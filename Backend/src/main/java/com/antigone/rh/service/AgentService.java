package com.antigone.rh.service;

import com.antigone.rh.dto.*;
import com.antigone.rh.entity.*;
import com.antigone.rh.enums.StatutDemande;
import com.antigone.rh.enums.TypeJour;
import com.antigone.rh.enums.TypeReferentiel;
import com.antigone.rh.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class AgentService {

    private final PointageRepository pointageRepository;
    private final HeartbeatRepository heartbeatRepository;
    private final PresenceConfirmationRepository presenceConfirmationRepository;
    private final EmployeRepository employeRepository;
    private final HoraireTravailRepository horaireTravailRepository;
    private final AffectationHoraireRepository affectationHoraireRepository;
    private final ReferentielRepository referentielRepository;
    private final CalendrierRepository calendrierRepository;
    private final CongeRepository congeRepository;
    private final AutorisationRepository autorisationRepository;
    private final TeletravailRepository teletravailRepository;

    private static final List<StatutDemande> STATUTS_APPROUVES = List.of(
            StatutDemande.APPROUVEE, StatutDemande.VALIDEE);

    // ========================================
    // CONFIG pour l'Agent Desktop
    // ========================================
    public AgentConfigDTO getAgentConfig() {
        HoraireTravail horaire = horaireTravailRepository.findAll().stream()
                .findFirst().orElse(null);

        String heureDebut = "09:00";
        String heureFin = "18:00";
        String joursTravail = "LUNDI,MARDI,MERCREDI,JEUDI,VENDREDI";

        if (horaire != null) {
            heureDebut = horaire.getHeureDebut().toString();
            heureFin = horaire.getHeureFin().toString();
            joursTravail = horaire.getJoursTravail();
        }

        String ssid = getParametreSysteme("SSID_ENTREPRISE", "");
        String ipRange = getParametreSysteme("IP_RESEAU_ENTREPRISE", "192.168.1.0/24");

        return AgentConfigDTO.builder()
                .popupIntervalleHeures(2)
                .popupTimeoutSecondes(60)
                .inactiviteToleranceMinutesJour(0)
                .reseauEntrepriseIp(ipRange)
                .reseauEntrepriseSsid(ssid)
                .toleranceRetardMinutes(0)
                .heureDebutTravail(heureDebut)
                .heureFinTravail(heureFin)
                .joursTravail(joursTravail)
                .build();
    }

    // ========================================
    // HEARTBEAT — reçu chaque minute
    // ========================================
    public void processHeartbeat(HeartbeatRequest request) {
        Employe employe = employeRepository.findById(request.getEmployeId())
                .orElseThrow(() -> new RuntimeException("Employé non trouvé: " + request.getEmployeId()));

        boolean surReseau = isOnEntrepriseNetwork(request.getSsid());

        Heartbeat heartbeat = Heartbeat.builder()
                .employe(employe)
                .timestamp(LocalDateTime.now())
                .ipAddress(request.getIpAddress())
                .ssid(request.getSsid())
                .actif(request.getActif())
                .surReseauEntreprise(surReseau)
                .build();

        heartbeatRepository.save(heartbeat);
    }

    // ========================================
    // EVENT — CLOCK_IN / CLOCK_OUT
    // ========================================
    public void processEvent(AgentEventRequest request) {
        Employe employe = employeRepository.findById(request.getEmployeId())
                .orElseThrow(() -> new RuntimeException("Employé non trouvé: " + request.getEmployeId()));

        Long empId = employe.getId();
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now().truncatedTo(ChronoUnit.SECONDS);
        boolean surReseau = isOnEntrepriseNetwork(request.getSsid());

        if ("CLOCK_IN".equals(request.getEventType())) {
            Pointage pointage = pointageRepository.findByEmployeIdAndDatePointage(empId, today)
                    .orElse(Pointage.builder()
                            .employe(employe)
                            .datePointage(today)
                            .build());

            pointage.setHeureEntree(now);
            pointage.setIpEntree(request.getIpAddress());
            pointage.setSsidEntree(request.getSsid());
            pointage.setSurReseauEntreprise(surReseau);

            // --- Déterminer le statut selon les règles métier ---

            // 1. Jour férié ?
            if (isJourFerie(today)) {
                pointage.setStatut("JOUR_FERIE");
                pointage.setRetardMinutes(0);
                pointageRepository.save(pointage);
                return;
            }

            // 2. Jour de travail ? (vérifier dans l'horaire)
            HoraireTravail horaire = getHoraireForEmploye(empId);
            if (horaire != null && !isJourTravail(horaire, today)) {
                pointage.setStatut("JOUR_NON_TRAVAILLE");
                pointage.setRetardMinutes(0);
                pointageRepository.save(pointage);
                return;
            }

            // 3. En congé approuvé ?
            if (isEnConge(empId, today)) {
                pointage.setStatut("EN_CONGE");
                pointage.setRetardMinutes(0);
                pointageRepository.save(pointage);
                return;
            }

            // 4. En télétravail (demande approuvée OU jour télétravail dans l'horaire) ?
            boolean enTeletravail = isEnTeletravail(empId, today, horaire);
            pointage.setTeletravail(enTeletravail);
            if (enTeletravail) {
                // En télétravail : ne pas vérifier le réseau entreprise, juste la présence
                // suffit
                pointage.setSurReseauEntreprise(true); // considéré OK
            }

            // 5. A une autorisation aujourd'hui ?
            LocalTime heureDebutEffective = getHeureDebutEffective(empId, today, horaire);

            // 6. Calculer le retard
            int retardMinutes = 0;
            if (now.isAfter(heureDebutEffective)) {
                retardMinutes = (int) ChronoUnit.MINUTES.between(heureDebutEffective, now);
            }
            pointage.setRetardMinutes(retardMinutes);

            if (retardMinutes > 0) {
                pointage.setStatut("RETARD");
            } else {
                pointage.setStatut("PRESENT");
            }

            if (enTeletravail) {
                pointage.setStatut(retardMinutes > 0 ? "RETARD" : "TELETRAVAIL");
            }

            pointageRepository.save(pointage);

        } else if ("CLOCK_OUT".equals(request.getEventType())) {
            pointageRepository.findByEmployeIdAndDatePointage(empId, today)
                    .ifPresent(pointage -> {
                        pointage.setHeureSortie(now);
                        pointageRepository.save(pointage);
                    });
        }
    }

    // ========================================
    // PRESENCE CONFIRMATION
    // ========================================
    public void processPresenceConfirm(PresenceConfirmRequest request) {
        Employe employe = employeRepository.findById(request.getEmployeId())
                .orElseThrow(() -> new RuntimeException("Employé non trouvé: " + request.getEmployeId()));

        PresenceConfirmation confirmation = PresenceConfirmation.builder()
                .employe(employe)
                .timestamp(LocalDateTime.now())
                .confirmed(request.getConfirmed())
                .build();

        presenceConfirmationRepository.save(confirmation);
    }

    // ========================================
    // DASHBOARD TEMPS REEL
    // ========================================
    public List<DashboardEmployeStatusDTO> getDashboardStatus() {
        LocalDate today = LocalDate.now();
        List<Employe> allEmployes = employeRepository.findAll();
        List<Pointage> todayPointages = pointageRepository.findByDatePointage(today);

        Map<Long, Pointage> pointageMap = todayPointages.stream()
                .collect(Collectors.toMap(p -> p.getEmploye().getId(), p -> p, (a, b) -> b));

        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime now = LocalDateTime.now();

        return allEmployes.stream().map(emp -> {
            Pointage pointage = pointageMap.get(emp.getId());

            long actifCount = heartbeatRepository.countActiveMinutes(emp.getId(), startOfDay, now);
            long inactifCount = heartbeatRepository.countInactiveMinutes(emp.getId(), startOfDay, now);

            Heartbeat lastHb = heartbeatRepository.findLastByEmployeId(emp.getId());
            boolean agentActif = lastHb != null &&
                    lastHb.getTimestamp().isAfter(now.minusMinutes(2));

            String ssidConnecte = lastHb != null ? lastHb.getSsid() : null;
            boolean surReseau = lastHb != null && Boolean.TRUE.equals(lastHb.getSurReseauEntreprise());

            String statut = "ABSENT";
            String heureEntree = null;
            String heureSortie = null;
            int retardMinutes = 0;

            if (pointage != null) {
                statut = pointage.getStatut();
                heureEntree = pointage.getHeureEntree() != null ? pointage.getHeureEntree().toString() : null;
                heureSortie = pointage.getHeureSortie() != null ? pointage.getHeureSortie().toString() : null;
                retardMinutes = pointage.getRetardMinutes() != null ? pointage.getRetardMinutes() : 0;
            }

            // Score journalier
            double score = actifCount - inactifCount;

            return DashboardEmployeStatusDTO.builder()
                    .employeId(emp.getId())
                    .nom(emp.getNom())
                    .prenom(emp.getPrenom())
                    .poste(emp.getPoste())
                    .departement(emp.getDepartement())
                    .imageUrl(emp.getImageUrl())
                    .statut(statut)
                    .heureEntree(heureEntree)
                    .heureSortie(heureSortie)
                    .retardMinutes(retardMinutes)
                    .scoreJournalier(score)
                    .agentActif(agentActif)
                    .ssidConnecte(ssidConnecte)
                    .surReseauEntreprise(surReseau)
                    .tempsActifMinutes(actifCount)
                    .tempsInactifMinutes(inactifCount)
                    .build();
        }).collect(Collectors.toList());
    }

    // ========================================
    // PRIX MINUTE (pour rapports d'inactivité)
    // ========================================
    public double calculatePrixMinute(Employe employe) {
        HoraireTravail horaire = getHoraireForEmploye(employe.getId());
        int minutesJour = 8 * 60; // default 8h
        if (horaire != null) {
            minutesJour = (int) ChronoUnit.MINUTES.between(horaire.getHeureDebut(), horaire.getHeureFin());
            // Enlever la pause déjeuner
            if (horaire.getPauseDebutMidi() != null && horaire.getPauseFinMidi() != null) {
                minutesJour -= (int) ChronoUnit.MINUTES.between(horaire.getPauseDebutMidi(), horaire.getPauseFinMidi());
            }
        }
        double salaire = employe.getSalaire() != null ? employe.getSalaire() : 0;
        return salaire / (22.0 * minutesJour);
    }

    // ========================================
    // HELPERS — Règles métier
    // ========================================

    /**
     * Récupère l'horaire de travail pour un employé via AffectationHoraire,
     * ou le premier horaire global si pas d'affectation.
     */
    private HoraireTravail getHoraireForEmploye(Long employeId) {
        return affectationHoraireRepository
                .findActiveForEmployeOnDate(employeId, LocalDate.now())
                .map(AffectationHoraire::getHoraireTravail)
                .orElseGet(() -> horaireTravailRepository.findAll().stream()
                        .findFirst().orElse(null));
    }

    /**
     * Vérifie si le jour est un jour travaillé dans l'horaire.
     */
    private boolean isJourTravail(HoraireTravail horaire, LocalDate date) {
        if (horaire == null || horaire.getJoursTravail() == null)
            return true;

        String jourFr = switch (date.getDayOfWeek()) {
            case MONDAY -> "LUNDI";
            case TUESDAY -> "MARDI";
            case WEDNESDAY -> "MERCREDI";
            case THURSDAY -> "JEUDI";
            case FRIDAY -> "VENDREDI";
            case SATURDAY -> "SAMEDI";
            case SUNDAY -> "DIMANCHE";
        };

        return horaire.getJoursTravail().toUpperCase().contains(jourFr);
    }

    /**
     * Vérifie si la date est un jour férié dans le calendrier entreprise.
     */
    private boolean isJourFerie(LocalDate date) {
        return calendrierRepository.findByDateJour(date)
                .map(c -> c.getTypeJour() == TypeJour.FERIE)
                .orElse(false);
    }

    /**
     * Vérifie si l'employé est en congé approuvé ce jour.
     */
    private boolean isEnConge(Long employeId, LocalDate date) {
        List<Conge> conges = congeRepository.findOverlapping(employeId, date, date);
        return conges.stream().anyMatch(c -> STATUTS_APPROUVES.contains(c.getStatut()));
    }

    /**
     * Vérifie si l'employé est en télétravail ce jour.
     * Soit via une demande de télétravail approuvée, soit via les jours de
     * télétravail de l'horaire.
     */
    private boolean isEnTeletravail(Long employeId, LocalDate date, HoraireTravail horaire) {
        // 1. Demande de télétravail approuvée pour ce jour
        List<Teletravail> teletravails = teletravailRepository.findActiveForEmployeOnDate(
                employeId, date, STATUTS_APPROUVES);
        if (!teletravails.isEmpty())
            return true;

        // 2. Jour de télétravail dans l'horaire
        if (horaire != null && horaire.getJoursTeletravail() != null
                && !horaire.getJoursTeletravail().isBlank()) {
            String jourFr = switch (date.getDayOfWeek()) {
                case MONDAY -> "LUNDI";
                case TUESDAY -> "MARDI";
                case WEDNESDAY -> "MERCREDI";
                case THURSDAY -> "JEUDI";
                case FRIDAY -> "VENDREDI";
                case SATURDAY -> "SAMEDI";
                case SUNDAY -> "DIMANCHE";
            };
            return horaire.getJoursTeletravail().toUpperCase().contains(jourFr);
        }

        // 3. Calendrier entreprise marque ce jour comme TELETRAVAIL
        return calendrierRepository.findByDateJour(date)
                .map(c -> c.getTypeJour() == TypeJour.TELETRAVAIL)
                .orElse(false);
    }

    /**
     * Calcule l'heure de début effective en tenant compte des autorisations.
     * Si l'employé a une autorisation approuvée aujourd'hui, l'heure de début
     * est repoussée à la fin de l'autorisation (il ne doit pas être compté en
     * retard).
     */
    private LocalTime getHeureDebutEffective(Long employeId, LocalDate date, HoraireTravail horaire) {
        LocalTime heureDebut = (horaire != null) ? horaire.getHeureDebut() : LocalTime.of(9, 0);

        // Chercher les autorisations approuvées pour ce jour
        List<Autorisation> autorisations = autorisationRepository
                .findByEmployeIdAndDateBetweenAndStatutIn(employeId, date, date, STATUTS_APPROUVES);

        if (!autorisations.isEmpty()) {
            // Prendre l'autorisation avec la fin la plus tardive
            LocalTime finAutorisation = autorisations.stream()
                    .map(Autorisation::getHeureFin)
                    .filter(Objects::nonNull)
                    .max(LocalTime::compareTo)
                    .orElse(heureDebut);

            // Si l'autorisation couvre le début de journée, repousser l'heure effective
            if (finAutorisation.isAfter(heureDebut)) {
                heureDebut = finAutorisation;
            }
        }

        return heureDebut;
    }

    /**
     * Vérifie si le SSID correspond au réseau entreprise.
     */
    private boolean isOnEntrepriseNetwork(String ssid) {
        if (ssid == null || ssid.isBlank())
            return false;
        String configuredSsid = getParametreSysteme("SSID_ENTREPRISE", "");
        return configuredSsid != null && !configuredSsid.isBlank()
                && configuredSsid.equalsIgnoreCase(ssid);
    }

    /**
     * Récupère un paramètre système depuis les référentiels.
     */
    private String getParametreSysteme(String libelle, String defaultValue) {
        return referentielRepository
                .findByTypeReferentielAndActifTrue(TypeReferentiel.PARAMETRE_SYSTEME)
                .stream()
                .filter(r -> libelle.equalsIgnoreCase(r.getLibelle()))
                .map(Referentiel::getValeur)
                .findFirst()
                .orElse(defaultValue);
    }

    // ========================================
    // HISTORIQUE PAR EMPLOYÉ
    // ========================================
    @Transactional(readOnly = true)
    public HistoriqueEmployeDTO getHistorique(Long employeId, LocalDate debut, LocalDate fin) {
        Employe employe = employeRepository.findById(employeId)
                .orElseThrow(() -> new RuntimeException("Employé non trouvé: " + employeId));

        List<Pointage> pointages = pointageRepository.findByEmployeIdAndDatePointageBetween(employeId, debut, fin);
        Map<LocalDate, Pointage> pointageMap = pointages.stream()
                .collect(Collectors.toMap(Pointage::getDatePointage, p -> p, (a, b) -> b));

        List<HistoriqueEmployeDTO.JourDetailDTO> jours = new ArrayList<>();

        for (LocalDate date = debut; !date.isAfter(fin); date = date.plusDays(1)) {
            Pointage pointage = pointageMap.get(date);

            LocalDateTime startOfDay = date.atStartOfDay();
            LocalDateTime endOfDay = date.atTime(23, 59, 59);
            long actif = heartbeatRepository.countActiveMinutes(employeId, startOfDay, endOfDay);
            long inactif = heartbeatRepository.countInactiveMinutes(employeId, startOfDay, endOfDay);

            String statut = "ABSENT";
            String heureEntree = null;
            String heureSortie = null;
            int retard = 0;
            String ssid = null;
            Boolean surReseau = false;
            Boolean teletravail = null;

            if (pointage != null) {
                statut = pointage.getStatut();
                heureEntree = pointage.getHeureEntree() != null ? pointage.getHeureEntree().toString() : null;
                heureSortie = pointage.getHeureSortie() != null ? pointage.getHeureSortie().toString() : null;
                retard = pointage.getRetardMinutes() != null ? pointage.getRetardMinutes() : 0;
                ssid = pointage.getSsidEntree();
                surReseau = pointage.getSurReseauEntreprise();
                teletravail = pointage.getTeletravail();
            }

            jours.add(HistoriqueEmployeDTO.JourDetailDTO.builder()
                    .date(date.toString())
                    .statut(statut)
                    .heureEntree(heureEntree)
                    .heureSortie(heureSortie)
                    .retardMinutes(retard)
                    .tempsActifMinutes(actif)
                    .tempsInactifMinutes(inactif)
                    .ssid(ssid)
                    .surReseauEntreprise(surReseau)
                    .teletravail(teletravail)
                    .build());
        }

        return HistoriqueEmployeDTO.builder()
                .employeId(employe.getId())
                .nom(employe.getNom())
                .prenom(employe.getPrenom())
                .poste(employe.getPoste())
                .departement(employe.getDepartement())
                .imageUrl(employe.getImageUrl())
                .jours(jours)
                .build();
    }

    @Transactional(readOnly = true)
    public List<HistoriqueEmployeDTO> getHistoriqueTous(LocalDate debut, LocalDate fin) {
        return employeRepository.findAll().stream()
                .map(emp -> getHistorique(emp.getId(), debut, fin))
                .collect(Collectors.toList());
    }
}
