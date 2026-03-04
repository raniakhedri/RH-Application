package com.antigone.rh.service;

import com.antigone.rh.dto.*;
import com.antigone.rh.entity.*;
import com.antigone.rh.enums.SourcePointage;
import com.antigone.rh.enums.StatutPointage;
import com.antigone.rh.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AgentService {

    private final PointageRepository pointageRepository;
    private final EmployeRepository employeRepository;
    private final ReferentielRepository referentielRepository;
    private final AffectationHoraireRepository affectationHoraireRepository;
    private final org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;

    // Statut temps réel des agents (employeId -> actif)
    private final ConcurrentHashMap<Long, Boolean> agentStatuses = new ConcurrentHashMap<>();
    // Dernier heartbeat (employeId -> timestamp)
    private final ConcurrentHashMap<Long, Long> lastHeartbeats = new ConcurrentHashMap<>();
    // SSID temps réel (employeId -> ssid)
    private final ConcurrentHashMap<Long, String> agentSSIDs = new ConcurrentHashMap<>();
    // Sur réseau entreprise temps réel (employeId -> true/false)
    private final ConcurrentHashMap<Long, Boolean> agentOnNetwork = new ConcurrentHashMap<>();

    /**
     * Traite le heartbeat envoyé par l'agent toutes les minutes.
     * Le backend vérifie ici toutes les conditions métier :
     * - RESEAU_ENTREPRISE_SSID : est-ce que le SSID correspond ?
     * - JOURS_TRAVAIL : est-ce un jour de travail ?
     * - HEURE_DEBUT_TRAVAIL / HEURE_FIN_TRAVAIL : est-on dans les horaires ?
     * - INACTIVITE_TOLERANCE_MINUTES_JOUR : utilisé dans le calcul du score
     */
    public void processHeartbeat(AgentHeartbeatRequest request) {
        Long employeId = request.getEmployeId();
        boolean isActif = request.getActif() != null ? request.getActif() : true;
        String ssid = request.getSsid() != null ? request.getSsid() : "";

        agentStatuses.put(employeId, isActif);
        lastHeartbeats.put(employeId, System.currentTimeMillis());
        agentSSIDs.put(employeId, ssid);

        // ===== Vérification RESEAU_ENTREPRISE_SSID =====
        String ssidEntreprise = getParamString("RESEAU_ENTREPRISE_SSID", "");
        boolean surReseau = !ssidEntreprise.isEmpty() && !ssid.isEmpty()
                && ssid.equalsIgnoreCase(ssidEntreprise);
        agentOnNetwork.put(employeId, surReseau);

        if (!ssid.isEmpty()) {
            log.info("Heartbeat employé={}: SSID={}, Attendu={}, Match={}, Actif={}",
                    employeId, ssid, ssidEntreprise, surReseau, isActif);
        }

        // ===== Vérification JOURS_TRAVAIL =====
        if (!isJourTravail()) {
            log.debug("Heartbeat employé={} ignoré (hors jour de travail)", employeId);
            return;
        }

        // ===== Vérification HEURE_DEBUT_TRAVAIL / HEURE_FIN_TRAVAIL =====
        if (!isDansHorairesTravail()) {
            log.debug("Heartbeat employé={} ignoré (hors horaires de travail)", employeId);
            return;
        }

        // ===== Mise à jour du pointage du jour =====
        LocalDate today = LocalDate.now();
        Optional<Pointage> pointageOpt = pointageRepository.findByEmployeIdAndDateJour(employeId, today);

        if (pointageOpt.isPresent()) {
            Pointage pointage = pointageOpt.get();

            // Mettre à jour le SSID connecté
            pointage.setSsidConnecte(ssid);
            pointage.setSurReseauEntreprise(surReseau);

            if (isActif) {
                pointage.setTempsActifMinutes(pointage.getTempsActifMinutes() + 1);
            } else {
                pointage.setTempsInactifMinutes(pointage.getTempsInactifMinutes() + 1);
            }
            recalculerScore(pointage);
            pointageRepository.save(pointage);
        }

        // Broadcast mise à jour temps réel via WebSocket
        try {
            messagingTemplate.convertAndSend("/topic/dashboard", getDashboardStatuses());
        } catch (Exception e) {
            log.debug("WebSocket broadcast échoué: {}", e.getMessage());
        }
    }

    /**
     * Traite un événement envoyé par l'agent.
     * Vérifie JOURS_TRAVAIL, HEURE_DEBUT/FIN_TRAVAIL et RESEAU_ENTREPRISE_SSID.
     */
    public void processEvent(AgentEventRequest request) {
        Long employeId = request.getEmployeId();
        String eventType = request.getEventType();
        String ssid = request.getSsid() != null ? request.getSsid() : "";
        String ipAddress = request.getIpAddress() != null ? request.getIpAddress() : "";

        log.info("Événement agent: employé={}, type={}, SSID={}, IP={}", employeId, eventType, ssid, ipAddress);

        switch (eventType) {
            case "CLOCK_IN":
                handleAgentClockIn(employeId, ssid, ipAddress);
                break;
            case "CLOCK_OUT":
                handleAgentClockOut(employeId, ssid);
                break;
            default:
                log.info("Événement non traité: {}", eventType);
        }
    }

    /**
     * Traite une confirmation de présence via popup
     */
    public void processPresenceConfirm(AgentPresenceConfirmRequest request) {
        Long employeId = request.getEmployeId();
        LocalDate today = LocalDate.now();

        Optional<Pointage> pointageOpt = pointageRepository.findByEmployeIdAndDateJour(employeId, today);
        if (pointageOpt.isPresent()) {
            Pointage pointage = pointageOpt.get();
            if (Boolean.TRUE.equals(request.getConfirmed())) {
                pointage.setConfirmationsReussies(pointage.getConfirmationsReussies() + 1);
                log.info("Confirmation réussie: employé={}", employeId);
            } else {
                pointage.setConfirmationsRatees(pointage.getConfirmationsRatees() + 1);
                log.warn("Confirmation ratée: employé={}", employeId);
            }
            recalculerScore(pointage);
            pointageRepository.save(pointage);
        }
    }

    /**
     * Retourne la configuration de l'agent basée sur les référentiels
     */
    @Transactional(readOnly = true)
    public AgentConfigResponse getConfig() {
        return AgentConfigResponse.builder()
                .toleranceRetardMinutes(getParamInt("TOLERANCE_RETARD_MINUTES", 10))
                .popupIntervalleHeures(getParamInt("POPUP_INTERVALLE_HEURES", 2))
                .popupTimeoutSecondes(getParamInt("POPUP_TIMEOUT_SECONDES", 60))
                .inactiviteToleranceMinutesJour(getParamInt("INACTIVITE_TOLERANCE_MINUTES_JOUR", 30))
                .reseauEntrepriseIp(getParamString("RESEAU_ENTREPRISE_IP", "192.168.1.0/24"))
                .reseauEntrepriseSsid(getParamString("RESEAU_ENTREPRISE_SSID", "MonWiFi"))
                .heureDebutTravail(getParamString("HEURE_DEBUT_TRAVAIL", "09:00"))
                .heureFinTravail(getParamString("HEURE_FIN_TRAVAIL", "18:00"))
                .joursTravail(getParamString("JOURS_TRAVAIL", "LUNDI,MARDI,MERCREDI,JEUDI,VENDREDI"))
                .build();
    }

    /**
     * Retourne le statut temps réel de tous les employés pour le dashboard admin
     */
    @Transactional(readOnly = true)
    public List<DashboardEmployeStatus> getDashboardStatuses() {
        LocalDate today = LocalDate.now();
        List<Employe> employes = employeRepository.findAll();
        List<DashboardEmployeStatus> statuses = new ArrayList<>();

        for (Employe emp : employes) {
            Optional<Pointage> pointageOpt = pointageRepository.findByEmployeIdAndDateJour(emp.getId(), today);

            DashboardEmployeStatus.DashboardEmployeStatusBuilder statusBuilder = DashboardEmployeStatus.builder()
                    .employeId(emp.getId())
                    .nom(emp.getNom())
                    .prenom(emp.getPrenom())
                    .poste(emp.getPoste())
                    .departement(emp.getDepartement())
                    .imageUrl(emp.getImageUrl())
                    .agentActif(agentStatuses.getOrDefault(emp.getId(), false));

            if (pointageOpt.isPresent()) {
                Pointage p = pointageOpt.get();
                statusBuilder
                        .statut(p.getStatut().name())
                        .heureEntree(p.getHeureEntree() != null ? p.getHeureEntree().toString() : null)
                        .heureSortie(p.getHeureSortie() != null ? p.getHeureSortie().toString() : null)
                        .retardMinutes(p.getRetardMinutes())
                        .scoreJournalier(p.getScoreJournalier())
                        .ssidConnecte(p.getSsidConnecte())
                        .surReseauEntreprise(p.getSurReseauEntreprise())
                        .tempsActifMinutes(p.getTempsActifMinutes())
                        .tempsInactifMinutes(p.getTempsInactifMinutes());
            } else {
                statusBuilder.statut("ABSENT");
            }

            statuses.add(statusBuilder.build());
        }

        return statuses;
    }

    public boolean isAgentActive(Long employeId) {
        Long lastBeat = lastHeartbeats.get(employeId);
        if (lastBeat == null)
            return false;
        // Agent considered inactive if no heartbeat for 3 minutes
        return (System.currentTimeMillis() - lastBeat) < 180_000;
    }

    // ============ Private Methods ============

    private void handleAgentClockIn(Long employeId, String ssid, String ipAddress) {
        LocalDate today = LocalDate.now();

        // ===== Vérification JOURS_TRAVAIL =====
        if (!isJourTravail()) {
            log.info("Clock-in refusé employé={} : ce n'est pas un jour de travail", employeId);
            return;
        }

        Optional<Pointage> existing = pointageRepository.findByEmployeIdAndDateJour(employeId, today);
        if (existing.isPresent()) {
            log.info("Pointage déjà existant pour employé={} aujourd'hui", employeId);
            return;
        }

        Employe employe = employeRepository.findById(employeId)
                .orElseThrow(() -> new RuntimeException("Employé non trouvé: " + employeId));

        // ===== Vérification RESEAU_ENTREPRISE_SSID =====
        String ssidEntreprise = getParamString("RESEAU_ENTREPRISE_SSID", "");
        boolean surReseau = !ssidEntreprise.isEmpty() && !ssid.isEmpty()
                && ssid.equalsIgnoreCase(ssidEntreprise);

        // ===== Vérification retard avec TOLERANCE_RETARD_MINUTES =====
        int toleranceMinutes = getParamInt("TOLERANCE_RETARD_MINUTES", 10);
        LocalTime now = LocalTime.now();
        StatutPointage statut = StatutPointage.PRESENT;
        int retardMinutes = 0;

        // Utiliser les horaires du référentiel (HEURE_DEBUT_TRAVAIL)
        String heureDebutStr = getParamString("HEURE_DEBUT_TRAVAIL", "09:00");
        LocalTime heureDebutRef = LocalTime.parse(heureDebutStr);

        // Vérifier aussi l'affectation horaire individuelle
        Optional<AffectationHoraire> affectation = affectationHoraireRepository
                .findActiveForEmployeOnDate(employeId, today);

        LocalTime heureDebut = affectation.isPresent()
                ? affectation.get().getHoraireTravail().getHeureDebut()
                : heureDebutRef;

        LocalTime heureDebutAvecTolerance = heureDebut.plusMinutes(toleranceMinutes);

        if (now.isAfter(heureDebutAvecTolerance)) {
            statut = StatutPointage.RETARD;
            retardMinutes = (int) Duration.between(heureDebut, now).toMinutes();
        }

        Pointage pointage = Pointage.builder()
                .employe(employe)
                .dateJour(today)
                .heureEntree(now)
                .statut(statut)
                .source(SourcePointage.AUTOMATIQUE)
                .retardMinutes(retardMinutes)
                .affectationHoraire(affectation.orElse(null))
                .ssidConnecte(ssid)
                .surReseauEntreprise(surReseau)
                .build();

        pointageRepository.save(pointage);
        log.info("Clock-in agent: employé={}, statut={}, retard={}min, SSID={}, surRéseau={}",
                employeId, statut, retardMinutes, ssid, surReseau);
    }

    private void handleAgentClockOut(Long employeId, String ssid) {
        LocalDate today = LocalDate.now();
        Optional<Pointage> pointageOpt = pointageRepository.findByEmployeIdAndDateJour(employeId, today);

        if (pointageOpt.isEmpty()) {
            log.warn("Aucun pointage trouvé pour clock-out: employé={}", employeId);
            return;
        }

        Pointage pointage = pointageOpt.get();
        if (pointage.getHeureSortie() != null) {
            log.info("Sortie déjà enregistrée pour employé={}", employeId);
            return;
        }

        pointage.setHeureSortie(LocalTime.now());
        recalculerScore(pointage);
        pointageRepository.save(pointage);
        agentStatuses.put(employeId, false);
        log.info("Clock-out agent: employé={}", employeId);
    }

    /**
     * Score = confirmationsOK - confirmationsRatées - (retard/10) -
     * (inactivité/INACTIVITE_TOLERANCE)
     * Utilise INACTIVITE_TOLERANCE_MINUTES_JOUR du référentiel
     */
    private void recalculerScore(Pointage pointage) {
        int toleranceInactivite = getParamInt("INACTIVITE_TOLERANCE_MINUTES_JOUR", 30);
        double penaliteInactivite = toleranceInactivite > 0
                ? (pointage.getTempsInactifMinutes() / (double) toleranceInactivite)
                : 0;
        double score = pointage.getConfirmationsReussies()
                - pointage.getConfirmationsRatees()
                - (pointage.getRetardMinutes() / 10.0)
                - penaliteInactivite;
        // Bonus si sur réseau entreprise
        if (Boolean.TRUE.equals(pointage.getSurReseauEntreprise())) {
            score += 0.5;
        }
        pointage.setScoreJournalier(Math.round(score * 100.0) / 100.0);
    }

    // ===== Méthodes de vérification des conditions métier =====

    /**
     * Vérifie si aujourd'hui est un jour de travail (JOURS_TRAVAIL)
     */
    private boolean isJourTravail() {
        String joursTravailStr = getParamString("JOURS_TRAVAIL", "LUNDI,MARDI,MERCREDI,JEUDI,VENDREDI");
        String[] jours = joursTravailStr.split(",");

        java.time.DayOfWeek today = LocalDate.now().getDayOfWeek();
        Map<String, java.time.DayOfWeek> frenchDays = Map.of(
                "LUNDI", java.time.DayOfWeek.MONDAY,
                "MARDI", java.time.DayOfWeek.TUESDAY,
                "MERCREDI", java.time.DayOfWeek.WEDNESDAY,
                "JEUDI", java.time.DayOfWeek.THURSDAY,
                "VENDREDI", java.time.DayOfWeek.FRIDAY,
                "SAMEDI", java.time.DayOfWeek.SATURDAY,
                "DIMANCHE", java.time.DayOfWeek.SUNDAY);

        for (String jour : jours) {
            java.time.DayOfWeek dw = frenchDays.get(jour.trim().toUpperCase());
            if (dw != null && dw == today) {
                return true;
            }
        }
        return false;
    }

    /**
     * Vérifie si l'heure actuelle est dans les horaires de travail
     * (HEURE_DEBUT_TRAVAIL - HEURE_FIN_TRAVAIL + 30min de marge)
     */
    private boolean isDansHorairesTravail() {
        String heureDebutStr = getParamString("HEURE_DEBUT_TRAVAIL", "09:00");
        String heureFinStr = getParamString("HEURE_FIN_TRAVAIL", "18:00");
        LocalTime heureDebut = LocalTime.parse(heureDebutStr);
        LocalTime heureFin = LocalTime.parse(heureFinStr);
        LocalTime now = LocalTime.now();

        // 30 min de marge après la fin pour les clock-out et derniers heartbeats
        return !now.isBefore(heureDebut) && !now.isAfter(heureFin.plusMinutes(30));
    }

    private int getParamInt(String libelle, int defaultValue) {
        return referentielRepository
                .findByLibelleAndTypeReferentiel(libelle, com.antigone.rh.enums.TypeReferentiel.PARAMETRE_SYSTEME)
                .map(r -> {
                    try {
                        return Integer.parseInt(r.getValeur());
                    } catch (Exception e) {
                        return defaultValue;
                    }
                })
                .orElse(defaultValue);
    }

    private String getParamString(String libelle, String defaultValue) {
        return referentielRepository
                .findByLibelleAndTypeReferentiel(libelle, com.antigone.rh.enums.TypeReferentiel.PARAMETRE_SYSTEME)
                .map(r -> r.getValeur() != null ? r.getValeur() : defaultValue)
                .orElse(defaultValue);
    }
}
