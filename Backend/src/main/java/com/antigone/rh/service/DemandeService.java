package com.antigone.rh.service;

import com.antigone.rh.dto.DemandeRequest;
import com.antigone.rh.dto.DemandeResponse;
import com.antigone.rh.dto.HistoriqueStatutDTO;
import com.antigone.rh.entity.*;
import com.antigone.rh.enums.*;
import com.antigone.rh.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class DemandeService {

    private final DemandeRepository demandeRepository;
    private final EmployeRepository employeRepository;
    private final HistoriqueStatutRepository historiqueStatutRepository;
    private final CalendrierRepository calendrierRepository;
    private final CongeRepository congeRepository;
    private final AutorisationRepository autorisationRepository;
    private final ReferentielRepository referentielRepository;

    private static final int DEFAULT_MAX_AUTORISATION_MINUTES = 120; // 2h par mois

    // =========================================
    // QUERIES
    // =========================================

    public List<DemandeResponse> findAll() {
        return demandeRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public DemandeResponse findById(Long id) {
        Demande demande = demandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Demande non trouvée avec l'id: " + id));
        return toResponse(demande);
    }

    public List<DemandeResponse> findByEmploye(Long employeId) {
        return demandeRepository.findByEmployeId(employeId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<DemandeResponse> findByStatut(StatutDemande statut) {
        return demandeRepository.findByStatut(statut).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // =========================================
    // CREATE
    // =========================================

    public DemandeResponse create(DemandeRequest request) {
        Employe employe = employeRepository.findById(request.getEmployeId())
                .orElseThrow(() -> new RuntimeException("Employé non trouvé"));

        Demande demande;

        switch (request.getType()) {
            case CONGE:
                demande = createConge(request, employe);
                break;
            case AUTORISATION:
                demande = createAutorisation(request, employe);
                break;
            case TELETRAVAIL:
                demande = createTeletravail(request, employe);
                break;
            default:
                throw new RuntimeException("Type de demande non supporté: " + request.getType());
        }

        demande.setType(request.getType());
        demande.setStatut(StatutDemande.EN_ATTENTE);
        demande.setDateCreation(LocalDateTime.now());
        demande.setRaison(request.getRaison());
        demande.setEmploye(employe);

        Demande saved = demandeRepository.save(demande);
        return toResponse(saved);
    }

    private Conge createConge(DemandeRequest request, Employe employe) {
        if (request.getDateDebut() == null || request.getDateFin() == null) {
            throw new RuntimeException("Les dates de début et fin sont obligatoires pour un congé");
        }
        if (request.getDateFin().isBefore(request.getDateDebut())) {
            throw new RuntimeException("La date de fin doit être après la date de début");
        }
        if (request.getDateDebut().isBefore(LocalDate.now())) {
            throw new RuntimeException("La date de début doit être dans le futur");
        }

        TypeConge typeConge = TypeConge.CONGE_PAYE;
        if (request.getTypeConge() != null && !request.getTypeConge().isBlank()) {
            try {
                typeConge = TypeConge.valueOf(request.getTypeConge());
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Type de congé invalide: " + request.getTypeConge());
            }
        }

        // Justificatif obligatoire pour maladie, décès et maternité
        if ((typeConge == TypeConge.CONGE_MALADIE
                || typeConge == TypeConge.CONGE_DECES_PROCHE
                || typeConge == TypeConge.CONGE_DECES_FAMILLE
                || typeConge == TypeConge.CONGE_MATERNITE)
                && (request.getJustificatifPath() == null || request.getJustificatifPath().isBlank())) {
            String docName = switch (typeConge) {
                case CONGE_MALADIE -> "certificat médical";
                case CONGE_DECES_PROCHE, CONGE_DECES_FAMILLE -> "attestation de décès";
                case CONGE_MATERNITE -> "certificat médical / attestation d'accouchement";
                default -> "justificatif";
            };
            throw new RuntimeException("Un " + docName + " est obligatoire pour ce type de congé");
        }

        // Calculate working days (exclude weekends + holidays)
        int nombreJours = calculateWorkingDays(request.getDateDebut(), request.getDateFin());

        // Congé décès: override nombre de jours selon le règlement
        if (typeConge == TypeConge.CONGE_DECES_PROCHE) {
            nombreJours = 5; // 5 jours pour parent, grand-parent ou enfant
        } else if (typeConge == TypeConge.CONGE_DECES_FAMILLE) {
            nombreJours = 1; // 1 jour pour autre membre de la famille
        }

        if (nombreJours == 0) {
            throw new RuntimeException("La période sélectionnée ne contient aucun jour ouvrable");
        }

        // Friday-only rule: congé uniquement vendredi → doit être CONGE_SANS_SOLDE
        if (typeConge == TypeConge.CONGE_PAYE && isOnlyFridays(request.getDateDebut(), request.getDateFin())) {
            throw new RuntimeException("Un congé uniquement le vendredi doit être de type 'Congé sans solde'");
        }

        // Bridge rule: jeudi férié + vendredi congé = 4 jours décomptés (sauf décès)
        if (typeConge != TypeConge.CONGE_DECES_PROCHE && typeConge != TypeConge.CONGE_DECES_FAMILLE) {
            nombreJours = applyBridgeRule(request.getDateDebut(), request.getDateFin(), nombreJours);
        }

        // Check overlap with existing congés
        List<Conge> overlapping = congeRepository.findOverlapping(
                employe.getId(), request.getDateDebut(), request.getDateFin());
        if (!overlapping.isEmpty()) {
            throw new RuntimeException("Un congé existe déjà pour cette période");
        }

        // Check solde for paid leave
        if (typeConge == TypeConge.CONGE_PAYE) {
            double solde = employe.getSoldeConge() != null ? employe.getSoldeConge() : 0;
            if (solde < nombreJours) {
                throw new RuntimeException("Solde congé insuffisant. Solde actuel: "
                        + solde + " jours, Demandé: " + nombreJours + " jours");
            }
        }

        Conge conge = new Conge();
        conge.setDateDebut(request.getDateDebut());
        conge.setDateFin(request.getDateFin());
        conge.setTypeConge(typeConge);
        conge.setNombreJours(nombreJours);
        conge.setJustificatifPath(request.getJustificatifPath());
        return conge;
    }

    private Autorisation createAutorisation(DemandeRequest request, Employe employe) {
        if (request.getDate() == null) {
            throw new RuntimeException("La date est obligatoire pour une autorisation");
        }
        if (request.getHeureDebut() == null || request.getHeureFin() == null) {
            throw new RuntimeException("Les heures de début et fin sont obligatoires");
        }
        if (!request.getHeureFin().isAfter(request.getHeureDebut())) {
            throw new RuntimeException("L'heure de fin doit être après l'heure de début");
        }

        long dureeMinutes = Duration.between(request.getHeureDebut(), request.getHeureFin()).toMinutes();

        // Get max allowed minutes from system parameters
        int maxMinutes = getMaxAutorisationMinutes();

        // Calculate total used this month (EN_ATTENTE + APPROUVEE)
        LocalDate premierJourMois = request.getDate().withDayOfMonth(1);
        LocalDate dernierJourMois = request.getDate().withDayOfMonth(request.getDate().lengthOfMonth());

        List<Autorisation> monthlyAuth = autorisationRepository.findByEmployeIdAndDateBetweenAndStatutIn(
                employe.getId(), premierJourMois, dernierJourMois,
                List.of(StatutDemande.EN_ATTENTE, StatutDemande.APPROUVEE));

        long totalUsedMinutes = monthlyAuth.stream()
                .mapToLong(a -> Duration.between(a.getHeureDebut(), a.getHeureFin()).toMinutes())
                .sum();

        if (totalUsedMinutes + dureeMinutes > maxMinutes) {
            long remaining = Math.max(0, maxMinutes - totalUsedMinutes);
            throw new RuntimeException("Quota d'autorisation mensuel dépassé. Restant: "
                    + remaining + " minutes (" + (remaining / 60) + "h" + String.format("%02d", remaining % 60) + ")");
        }

        Autorisation autorisation = new Autorisation();
        autorisation.setDate(request.getDate());
        autorisation.setHeureDebut(request.getHeureDebut());
        autorisation.setHeureFin(request.getHeureFin());
        return autorisation;
    }

    private Teletravail createTeletravail(DemandeRequest request, Employe employe) {
        if (request.getDateDebut() == null || request.getDateFin() == null) {
            throw new RuntimeException("Les dates de début et fin sont obligatoires pour le télétravail");
        }
        if (request.getDateFin().isBefore(request.getDateDebut())) {
            throw new RuntimeException("La date de fin doit être après la date de début");
        }

        Teletravail teletravail = new Teletravail();
        teletravail.setDateDebut(request.getDateDebut());
        teletravail.setDateFin(request.getDateFin());
        return teletravail;
    }

    // =========================================
    // APPROVE / REFUSE / CANCEL
    // =========================================

    public DemandeResponse approve(Long demandeId, Long adminEmployeId) {
        Demande demande = demandeRepository.findById(demandeId)
                .orElseThrow(() -> new RuntimeException("Demande non trouvée"));
        Employe admin = employeRepository.findById(adminEmployeId)
                .orElseThrow(() -> new RuntimeException("Administrateur non trouvé"));

        if (demande.getStatut() != StatutDemande.EN_ATTENTE) {
            throw new RuntimeException("Seules les demandes en attente peuvent être approuvées");
        }

        StatutDemande ancien = demande.getStatut();
        demande.setStatut(StatutDemande.APPROUVEE);
        demandeRepository.save(demande);

        // Deduct solde for paid leave
        if (demande instanceof Conge conge && conge.getTypeConge() == TypeConge.CONGE_PAYE) {
            Employe employe = demande.getEmploye();
            double solde = employe.getSoldeConge() != null ? employe.getSoldeConge() : 0;
            employe.setSoldeConge(solde - conge.getNombreJours());
            employeRepository.save(employe);
        }

        saveHistorique(demande, ancien, StatutDemande.APPROUVEE, admin);
        return toResponse(demande);
    }

    public DemandeResponse refuse(Long demandeId, Long adminEmployeId, String commentaire) {
        Demande demande = demandeRepository.findById(demandeId)
                .orElseThrow(() -> new RuntimeException("Demande non trouvée"));
        Employe admin = employeRepository.findById(adminEmployeId)
                .orElseThrow(() -> new RuntimeException("Administrateur non trouvé"));

        if (demande.getStatut() != StatutDemande.EN_ATTENTE) {
            throw new RuntimeException("Seules les demandes en attente peuvent être refusées");
        }

        StatutDemande ancien = demande.getStatut();
        demande.setStatut(StatutDemande.REFUSEE);
        demandeRepository.save(demande);

        saveHistorique(demande, ancien, StatutDemande.REFUSEE, admin, commentaire);
        return toResponse(demande);
    }

    public DemandeResponse cancel(Long demandeId) {
        Demande demande = demandeRepository.findById(demandeId)
                .orElseThrow(() -> new RuntimeException("Demande non trouvée"));

        if (demande.getStatut() != StatutDemande.EN_ATTENTE) {
            throw new RuntimeException("Seules les demandes en attente peuvent être annulées");
        }

        StatutDemande ancien = demande.getStatut();
        demande.setStatut(StatutDemande.ANNULEE);
        demandeRepository.save(demande);

        saveHistorique(demande, ancien, StatutDemande.ANNULEE, demande.getEmploye());
        return toResponse(demande);
    }

    // =========================================
    // BATCH ACTIONS
    // =========================================

    public List<DemandeResponse> batchApprove(List<Long> demandeIds, Long adminEmployeId) {
        return demandeIds.stream()
                .map(id -> {
                    try {
                        return approve(id, adminEmployeId);
                    } catch (RuntimeException e) {
                        return null;
                    }
                })
                .filter(r -> r != null)
                .collect(Collectors.toList());
    }

    public List<DemandeResponse> batchRefuse(List<Long> demandeIds, Long adminEmployeId, String commentaire) {
        return demandeIds.stream()
                .map(id -> {
                    try {
                        return refuse(id, adminEmployeId, commentaire);
                    } catch (RuntimeException e) {
                        return null;
                    }
                })
                .filter(r -> r != null)
                .collect(Collectors.toList());
    }

    // =========================================
    // HISTORIQUE
    // =========================================

    public List<HistoriqueStatutDTO> getHistorique(Long demandeId) {
        return historiqueStatutRepository.findByDemandeIdOrderByDateChangementDesc(demandeId)
                .stream()
                .map(h -> HistoriqueStatutDTO.builder()
                        .id(h.getId())
                        .ancienStatut(h.getAncienStatut().name())
                        .nouveauStatut(h.getNouveauStatut().name())
                        .dateChangement(h.getDateChangement())
                        .modifieParNom(h.getModifiePar() != null
                                ? h.getModifiePar().getNom() + " " + h.getModifiePar().getPrenom()
                                : null)
                        .commentaire(h.getCommentaire())
                        .build())
                .collect(Collectors.toList());
    }

    // =========================================
    // BUSINESS LOGIC HELPERS
    // =========================================

    /**
     * Calculate working days between two dates, excluding weekends (Sat/Sun) and holidays.
     */
    private int calculateWorkingDays(LocalDate start, LocalDate end) {
        Set<LocalDate> holidays = calendrierRepository
                .findByTypeJourAndDateJourBetween(TypeJour.FERIE, start, end)
                .stream()
                .map(Calendrier::getDateJour)
                .collect(Collectors.toSet());

        int workingDays = 0;
        LocalDate current = start;
        while (!current.isAfter(end)) {
            DayOfWeek dow = current.getDayOfWeek();
            if (dow != DayOfWeek.SATURDAY && dow != DayOfWeek.SUNDAY && !holidays.contains(current)) {
                workingDays++;
            }
            current = current.plusDays(1);
        }
        return workingDays;
    }

    /**
     * Check if all working days in the period are only Fridays.
     * Friday-only congé = must be congé sans solde.
     */
    private boolean isOnlyFridays(LocalDate start, LocalDate end) {
        Set<LocalDate> holidays = calendrierRepository
                .findByTypeJourAndDateJourBetween(TypeJour.FERIE, start, end)
                .stream()
                .map(Calendrier::getDateJour)
                .collect(Collectors.toSet());

        LocalDate current = start;
        while (!current.isAfter(end)) {
            DayOfWeek dow = current.getDayOfWeek();
            if (dow != DayOfWeek.SATURDAY && dow != DayOfWeek.SUNDAY && !holidays.contains(current)) {
                if (dow != DayOfWeek.FRIDAY) {
                    return false;
                }
            }
            current = current.plusDays(1);
        }
        return true;
    }

    /**
     * Bridge rule: si jeudi est férié et l'employé prend vendredi en congé = 4 jours décomptés.
     * (jeudi + vendredi + samedi + dimanche)
     */
    private int applyBridgeRule(LocalDate start, LocalDate end, int baseWorkingDays) {
        Set<LocalDate> holidays = calendrierRepository
                .findByTypeJourAndDateJourBetween(TypeJour.FERIE,
                        start.minusDays(1), end.plusDays(1))
                .stream()
                .map(Calendrier::getDateJour)
                .collect(Collectors.toSet());

        int bridgePenalty = 0;
        LocalDate current = start;
        while (!current.isAfter(end)) {
            if (current.getDayOfWeek() == DayOfWeek.FRIDAY) {
                LocalDate thursday = current.minusDays(1);
                if (holidays.contains(thursday)) {
                    // Bridge detected: Thu(holiday)+Fri+Sat+Sun = 4 days total
                    // Only Fri is counted as working day, add 3 extra (Thu+Sat+Sun)
                    bridgePenalty += 3;
                }
            }
            current = current.plusDays(1);
        }
        return baseWorkingDays + bridgePenalty;
    }

    /**
     * Get max autorisation minutes per month from system parameters.
     */
    private int getMaxAutorisationMinutes() {
        return referentielRepository
                .findByLibelleAndTypeReferentiel("MAX_AUTORISATION_MINUTES", TypeReferentiel.PARAMETRE_SYSTEME)
                .map(ref -> {
                    try {
                        return Integer.parseInt(ref.getValeur());
                    } catch (NumberFormatException e) {
                        return DEFAULT_MAX_AUTORISATION_MINUTES;
                    }
                })
                .orElse(DEFAULT_MAX_AUTORISATION_MINUTES);
    }

    // =========================================
    // HISTORIQUE
    // =========================================

    private void saveHistorique(Demande demande, StatutDemande ancien, StatutDemande nouveau, Employe employe) {
        saveHistorique(demande, ancien, nouveau, employe, null);
    }

    private void saveHistorique(Demande demande, StatutDemande ancien, StatutDemande nouveau, Employe employe, String commentaire) {
        HistoriqueStatut historique = HistoriqueStatut.builder()
                .demande(demande)
                .ancienStatut(ancien)
                .nouveauStatut(nouveau)
                .dateChangement(LocalDateTime.now())
                .modifiePar(employe)
                .commentaire(commentaire)
                .build();
        historiqueStatutRepository.save(historique);
    }

    // =========================================
    // MAPPER
    // =========================================

    public DemandeResponse toResponse(Demande demande) {
        DemandeResponse.DemandeResponseBuilder builder = DemandeResponse.builder()
                .id(demande.getId())
                .type(demande.getType())
                .dateCreation(demande.getDateCreation())
                .statut(demande.getStatut())
                .raison(demande.getRaison())
                .employeId(demande.getEmploye().getId())
                .employeNom(demande.getEmploye().getNom() + " " + demande.getEmploye().getPrenom());

        if (demande instanceof Conge conge) {
            builder.dateDebut(conge.getDateDebut());
            builder.dateFin(conge.getDateFin());
            builder.typeConge(conge.getTypeConge().name());
            builder.typeCongeLabel(conge.getTypeConge().getLabel());
            builder.nombreJours(conge.getNombreJours());
            builder.justificatifPath(conge.getJustificatifPath());
        } else if (demande instanceof Autorisation autorisation) {
            builder.date(autorisation.getDate());
            builder.heureDebut(autorisation.getHeureDebut());
            builder.heureFin(autorisation.getHeureFin());
            builder.dureeMinutes(Duration.between(autorisation.getHeureDebut(), autorisation.getHeureFin()).toMinutes());
        } else if (demande instanceof Teletravail teletravail) {
            builder.dateDebut(teletravail.getDateDebut());
            builder.dateFin(teletravail.getDateFin());
        }

        return builder.build();
    }
}
