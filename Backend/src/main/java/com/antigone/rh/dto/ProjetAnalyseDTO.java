package com.antigone.rh.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class ProjetAnalyseDTO {

    // ── Projet header ──────────────────────────────────────────────────────────
    private Long projetId;
    private String projetNom;
    private String clientNom;
    private LocalDateTime dateOuverture;
    private LocalDateTime dateCloture;
    private Long dureeTotaleMinutes;   // null if not closed yet

    private String statut;

    // ── Phase 1 : Mise en place (Admin) ───────────────────────────────────────
    private PhaseSetup phaseSetup;

    // ── Phase 2 : Distribution (Managers) ─────────────────────────────────────
    private List<ManagerDistribution> phaseDistribution;

    // ── Phase 3 : Exécution (Membres) ─────────────────────────────────────────
    private List<MembreExecution> phaseExecution;

    // ── Phase 4 : Clôture ─────────────────────────────────────────────────────
    private PhaseCloture phaseCloture;

    // ── Résumé des retards ────────────────────────────────────────────────────
    private List<RetardEntry> retards;

    // ── Temps par employé ─────────────────────────────────────────────────────
    private List<EmployeTempsDTO> tempsParEmploye;

    // ── Temps inactif managers ────────────────────────────────────────────────
    private List<ManagerTempsInactifDTO> tempsInactifManagers;

    // ── Sub-DTOs ──────────────────────────────────────────────────────────────

    @Data
    @Builder
    public static class PhaseSetup {
        private LocalDateTime dateCreationProjet;
        /** Time between project creation and last task creation (Admin setup time) */
        private Long dureeSetupMinutes;
        private int nombreTaches;
        private boolean retardDetecte;
        private String commentaire;
    }

    @Data
    @Builder
    public static class ManagerDistribution {
        private Long managerId;
        private String managerNom;
        private String tacheNom;
        private Long tacheId;
        private LocalDateTime dateReception;          // tache.dateCreation
        private LocalDateTime dateRedistribution;     // tache.dateAssignation
        /** Minutes between reception and redistribution */
        private Long dureeDistributionMinutes;
        private boolean retard;                       // > threshold (e.g. 24h = 1440 min)
    }

    @Data
    @Builder
    public static class MembreExecution {
        private Long membreId;
        private String membreNom;
        private Long tacheId;
        private String tacheNom;
        private LocalDateTime dateAssignation;
        private LocalDateTime dateDebutExecution;
        private LocalDateTime dateFinExecution;
        private LocalDateTime dateEcheance;
        /** Minutes from assignation to IN_PROGRESS */
        private Long delaiDemarrage;
        /** Minutes from IN_PROGRESS to DONE */
        private Long dureeExecution;
        private String statutFinal;
        private boolean enRetard;
    }

    @Data
    @Builder
    public static class PhaseCloture {
        private LocalDateTime dateDerniereTacheDone;
        private LocalDateTime dateCloture;
        /** Minutes between last task DONE and project closure */
        private Long delaiCloture;
        private boolean clotureEffectuee;
    }

    @Data
    @Builder
    public static class RetardEntry {
        private String source;       // "Admin", "Manager", "Membre"
        private String nom;          // person name
        private String etape;        // Phase description
        private Long dureeRetardMinutes;
        private String impact;
    }

    @Data
    @Builder
    public static class EmployeTempsDTO {
        private Long employeId;
        private String employeNom;
        private int totalTaches;
        private int tachesDone;
        private int tachesInProgress;
        private int tachesTodo;
        /** Σ(dateDebutExecution - dateAssignation) across all tasks */
        private Long tempsEnTodoMinutes;
        /** Σ(dateFinExecution - dateDebutExecution) across all tasks */
        private Long tempsEnInProgressMinutes;
        /** Σ(now/dateCloture - dateFinExecution) for done tasks */
        private Long tempsDepuisDoneMinutes;
        /** Total from assignment to done/now */
        private Long tempsTotalMinutes;
        /** Temps estimé inactif (sans tâche en cours) */
        private Long tempsInactifMinutes;
    }

    @Data
    @Builder
    public static class ManagerTempsInactifDTO {
        private Long managerId;
        private String managerNom;
        private LocalDateTime dateReceptionProjet;
        private LocalDateTime datePremiereAssignation;
        /** Minutes entre réception projet et 1ère assignation */
        private Long tempsInactifMinutes;
        /** Tâches encore sans assigné */
        private int tachesNonAssignees;
        private boolean retard;
        private String commentaire;
    }
}
