package com.antigone.rh.service;

import com.antigone.rh.dto.ProjetAnalyseDTO;
import com.antigone.rh.entity.Employe;
import com.antigone.rh.entity.Projet;
import com.antigone.rh.entity.Tache;
import com.antigone.rh.enums.StatutTache;
import com.antigone.rh.repository.ProjetRepository;
import com.antigone.rh.repository.TacheRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class ProjetAnalyseService {

    /** Threshold above which a manager redistribution delay is flagged (24 hours) */
    private static final long MANAGER_DELAY_THRESHOLD_MIN = 1440L;

    /** Threshold above which a member start delay is flagged (8 hours) */
    private static final long MEMBER_START_DELAY_THRESHOLD_MIN = 480L;

    private final ProjetRepository projetRepository;
    private final TacheRepository tacheRepository;

    // ─────────────────────────────────────────────────────────────────────────
    // PUBLIC API
    // ─────────────────────────────────────────────────────────────────────────

    public ProjetAnalyseDTO analyseProjet(Long projetId) {
        Projet projet = projetRepository.findById(projetId)
                .orElseThrow(() -> new RuntimeException("Projet non trouvé: " + projetId));
        List<Tache> taches = tacheRepository.findByProjetId(projetId);
        return buildRapport(projet, taches);
    }

    public List<ProjetAnalyseDTO> analyseAllProjets() {
        return projetRepository.findAll().stream()
                .map(p -> buildRapport(p, tacheRepository.findByProjetId(p.getId())))
                .collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CORE BUILDER
    // ─────────────────────────────────────────────────────────────────────────

    private ProjetAnalyseDTO buildRapport(Projet projet, List<Tache> taches) {

        LocalDateTime ouverture = projet.getDateCreation();
        LocalDateTime cloture = projet.getDateCloture();

        Long dureeTotale = (ouverture != null && cloture != null)
                ? Duration.between(ouverture, cloture).toMinutes() : null;

        String clientNom = null;
        try { if (projet.getClient() != null) clientNom = projet.getClient().getNom(); }
        catch (Exception ignored) {}

        // ── Phase 1 ─────────────────────────────────────────────────────────
        ProjetAnalyseDTO.PhaseSetup phaseSetup = buildPhaseSetup(projet, taches, ouverture);

        // ── Phase 2 ─────────────────────────────────────────────────────────
        List<ProjetAnalyseDTO.ManagerDistribution> phaseDistribution = buildPhaseDistribution(taches);

        // ── Phase 3 ─────────────────────────────────────────────────────────
        List<ProjetAnalyseDTO.MembreExecution> phaseExecution = buildPhaseExecution(taches);

        // ── Phase 4 ─────────────────────────────────────────────────────────
        ProjetAnalyseDTO.PhaseCloture phaseCloture = buildPhaseCloture(taches, cloture);

        // ── Retards ─────────────────────────────────────────────────────────
        List<ProjetAnalyseDTO.RetardEntry> retards = buildRetards(
                phaseSetup, phaseDistribution, phaseExecution);

        return ProjetAnalyseDTO.builder()
                .projetId(projet.getId())
                .projetNom(projet.getNom())
                .clientNom(clientNom)
                .statut(projet.getStatut() != null ? projet.getStatut().name() : null)
                .dateOuverture(ouverture)
                .dateCloture(cloture)
                .dureeTotaleMinutes(dureeTotale)
                .phaseSetup(phaseSetup)
                .phaseDistribution(phaseDistribution)
                .phaseExecution(phaseExecution)
                .phaseCloture(phaseCloture)
                .retards(retards)
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PHASE 1 — Setup (Admin)
    // ─────────────────────────────────────────────────────────────────────────

    private ProjetAnalyseDTO.PhaseSetup buildPhaseSetup(Projet projet, List<Tache> taches,
                                                         LocalDateTime ouverture) {
        if (ouverture == null) {
            return ProjetAnalyseDTO.PhaseSetup.builder()
                    .commentaire("Date de création du projet non disponible (projet antérieur à la mise à jour).")
                    .nombreTaches(taches.size())
                    .retardDetecte(false)
                    .build();
        }

        // Last task creation = end of admin setup phase
        LocalDateTime lastTaskCreation = taches.stream()
                .map(Tache::getDateCreation)
                .filter(Objects::nonNull)
                .max(Comparator.naturalOrder())
                .orElse(null);

        Long dureeSetup = null;
        boolean retard = false;
        String commentaire = null;

        if (lastTaskCreation != null) {
            dureeSetup = Duration.between(ouverture, lastTaskCreation).toMinutes();
            // Flag if setup took more than 24h
            if (dureeSetup > MANAGER_DELAY_THRESHOLD_MIN) {
                retard = true;
                commentaire = "L'Admin a mis " + formatDuration(dureeSetup)
                        + " pour créer et assigner toutes les tâches.";
            }
        } else {
            commentaire = "Aucune tâche avec timestamp — données incomplètes.";
        }

        return ProjetAnalyseDTO.PhaseSetup.builder()
                .dateCreationProjet(ouverture)
                .dureeSetupMinutes(dureeSetup)
                .nombreTaches(taches.size())
                .retardDetecte(retard)
                .commentaire(commentaire)
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PHASE 2 — Distribution (Managers)
    // ─────────────────────────────────────────────────────────────────────────

    private List<ProjetAnalyseDTO.ManagerDistribution> buildPhaseDistribution(List<Tache> taches) {
        List<ProjetAnalyseDTO.ManagerDistribution> result = new ArrayList<>();

        for (Tache t : taches) {
            if (t.getAssignee() == null) continue;

            Employe assignee = t.getAssignee();
            String assigneeNom = assignee.getPrenom() + " " + assignee.getNom();

            LocalDateTime reception = t.getDateCreation();
            LocalDateTime redistribution = t.getDateAssignation();

            Long duree = (reception != null && redistribution != null)
                    ? Duration.between(reception, redistribution).toMinutes() : null;

            boolean retard = duree != null && duree > MANAGER_DELAY_THRESHOLD_MIN;

            result.add(ProjetAnalyseDTO.ManagerDistribution.builder()
                    .managerId(assignee.getId())
                    .managerNom(assigneeNom)
                    .tacheId(t.getId())
                    .tacheNom(t.getTitre())
                    .dateReception(reception)
                    .dateRedistribution(redistribution)
                    .dureeDistributionMinutes(duree)
                    .retard(retard)
                    .build());
        }

        return result;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PHASE 3 — Exécution (Membres)
    // ─────────────────────────────────────────────────────────────────────────

    private List<ProjetAnalyseDTO.MembreExecution> buildPhaseExecution(List<Tache> taches) {
        List<ProjetAnalyseDTO.MembreExecution> result = new ArrayList<>();

        for (Tache t : taches) {
            if (t.getAssignee() == null) continue;

            Employe membre = t.getAssignee();
            String membreNom = membre.getPrenom() + " " + membre.getNom();

            LocalDateTime assignation = t.getDateAssignation();
            LocalDateTime debut = t.getDateDebutExecution();
            LocalDateTime fin = t.getDateFinExecution();

            Long delaiDemarrage = (assignation != null && debut != null)
                    ? Duration.between(assignation, debut).toMinutes() : null;
            Long dureeExecution = (debut != null && fin != null)
                    ? Duration.between(debut, fin).toMinutes() : null;

            // Check if task is late: finished after echeance
            boolean enRetard = false;
            if (t.getDateEcheance() != null && fin != null) {
                enRetard = fin.toLocalDate().isAfter(t.getDateEcheance());
            } else if (t.getDateEcheance() != null && t.getStatut() != StatutTache.DONE) {
                enRetard = LocalDateTime.now().toLocalDate().isAfter(t.getDateEcheance());
            }

            LocalDateTime dateEcheanceDT = t.getDateEcheance() != null
                    ? t.getDateEcheance().atStartOfDay() : null;

            result.add(ProjetAnalyseDTO.MembreExecution.builder()
                    .membreId(membre.getId())
                    .membreNom(membreNom)
                    .tacheId(t.getId())
                    .tacheNom(t.getTitre())
                    .dateAssignation(assignation)
                    .dateDebutExecution(debut)
                    .dateFinExecution(fin)
                    .dateEcheance(dateEcheanceDT)
                    .delaiDemarrage(delaiDemarrage)
                    .dureeExecution(dureeExecution)
                    .statutFinal(t.getStatut().name())
                    .enRetard(enRetard)
                    .build());
        }

        return result;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PHASE 4 — Clôture
    // ─────────────────────────────────────────────────────────────────────────

    private ProjetAnalyseDTO.PhaseCloture buildPhaseCloture(List<Tache> taches,
                                                              LocalDateTime dateCloture) {
        LocalDateTime lastDone = taches.stream()
                .map(Tache::getDateFinExecution)
                .filter(Objects::nonNull)
                .max(Comparator.naturalOrder())
                .orElse(null);

        Long delai = (lastDone != null && dateCloture != null)
                ? Duration.between(lastDone, dateCloture).toMinutes() : null;

        return ProjetAnalyseDTO.PhaseCloture.builder()
                .dateDerniereTacheDone(lastDone)
                .dateCloture(dateCloture)
                .delaiCloture(delai)
                .clotureEffectuee(dateCloture != null)
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RETARDS SUMMARY
    // ─────────────────────────────────────────────────────────────────────────

    private List<ProjetAnalyseDTO.RetardEntry> buildRetards(
            ProjetAnalyseDTO.PhaseSetup setup,
            List<ProjetAnalyseDTO.ManagerDistribution> distributions,
            List<ProjetAnalyseDTO.MembreExecution> executions) {

        List<ProjetAnalyseDTO.RetardEntry> retards = new ArrayList<>();

        // Admin delay
        if (setup.isRetardDetecte() && setup.getDureeSetupMinutes() != null) {
            retards.add(ProjetAnalyseDTO.RetardEntry.builder()
                    .source("Admin")
                    .nom("Admin")
                    .etape("Mise en place des tâches")
                    .dureeRetardMinutes(setup.getDureeSetupMinutes() - MANAGER_DELAY_THRESHOLD_MIN)
                    .impact("Retard au démarrage du projet de " +
                            formatDuration(setup.getDureeSetupMinutes() - MANAGER_DELAY_THRESHOLD_MIN))
                    .build());
        }

        // Manager delays
        for (ProjetAnalyseDTO.ManagerDistribution d : distributions) {
            if (d.isRetard() && d.getDureeDistributionMinutes() != null) {
                long retardMin = d.getDureeDistributionMinutes() - MANAGER_DELAY_THRESHOLD_MIN;
                retards.add(ProjetAnalyseDTO.RetardEntry.builder()
                        .source("Manager")
                        .nom(d.getManagerNom())
                        .etape("Redistribution de la tâche \"" + d.getTacheNom() + "\"")
                        .dureeRetardMinutes(retardMin)
                        .impact("Membre bloqué " + formatDuration(retardMin) + " sans tâche")
                        .build());
            }
        }

        // Member delays
        for (ProjetAnalyseDTO.MembreExecution e : executions) {
            if (e.isEnRetard()) {
                Long totalDelay = null;
                if (e.getDateFinExecution() != null && e.getDateEcheance() != null) {
                    totalDelay = Duration.between(e.getDateEcheance(), e.getDateFinExecution()).toMinutes();
                }
                retards.add(ProjetAnalyseDTO.RetardEntry.builder()
                        .source("Membre")
                        .nom(e.getMembreNom())
                        .etape("Exécution de la tâche \"" + e.getTacheNom() + "\"")
                        .dureeRetardMinutes(totalDelay != null && totalDelay > 0 ? totalDelay : null)
                        .impact(totalDelay != null
                                ? "Tâche livrée avec " + formatDuration(totalDelay) + " de retard"
                                : "Tâche en retard (non terminée)")
                        .build());
            }
        }

        return retards;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    private String formatDuration(long minutes) {
        if (minutes < 60) return minutes + " min";
        long hours = minutes / 60;
        long mins = minutes % 60;
        if (hours < 24) return hours + "h" + (mins > 0 ? mins + "min" : "");
        long days = hours / 24;
        long remainHours = hours % 24;
        return days + "j " + (remainHours > 0 ? remainHours + "h" : "");
    }
}
