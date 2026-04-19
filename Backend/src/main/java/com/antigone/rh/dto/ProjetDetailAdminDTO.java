package com.antigone.rh.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjetDetailAdminDTO {
    // Project info
    private Long projetId;
    private String projetNom;
    private String clientNom;
    private Long clientId;
    private String statut;
    private LocalDate dateDebut;
    private LocalDate dateFin;
    private String typeProjet;
    private double progressionPourcentage;
    private int totalTaches;
    private int tachesDone;
    private int tachesInProgress;
    private int tachesTodo;
    private int tachesEnRetard;

    // Per-manager view
    private List<ManagerSectionDTO> managers;

    // Per-employee view
    private List<EmployeSectionDTO> employes;

    // Timeline data
    private List<TacheTimelineDTO> timeline;

    // Project-specific alerts
    private List<AlerteDTO> alertes;

    // ── Sub-DTOs ──────────────────────────────────────────────────────────────

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ManagerSectionDTO {
        private Long managerId;
        private String managerNom;
        private List<TacheManagerDTO> taches;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TacheManagerDTO {
        private Long tacheId;
        private String tacheNom;
        private String employeNom;
        private Long employeId;
        private String statut;
        private LocalDate dateEcheance;
        private Integer dureePrevueJours;
        private LocalDateTime dateAssignation;
        private LocalDateTime dateDebutExecution;
        private LocalDateTime dateFinExecution;
        /** Total duration from start to done in fractional hours */
        private Double dureeReelleHeures;
        private boolean enRetard;
        private String statutRetard; // ✅ DANS_LES_TEMPS, ⚠ EN_RETARD, 🔴 CRITIQUE
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EmployeSectionDTO {
        private Long employeId;
        private String employeNom;
        private int tachesAssignees;
        private int tachesDone;
        private int tachesEnRetard;
        private int tachesEnCours;
        private int tachesTodo;
        /** Average execution time in hours for done tasks */
        private Double tempsMoyenHeures;
        /** Time spent in TODO status (assigned but not started) in minutes */
        private Long tempsEnTodoMinutes;
        /** Time spent in IN_PROGRESS status in minutes */
        private Long tempsEnInProgressMinutes;
        /** Time since tasks were marked DONE in minutes */
        private Long tempsDepuisDoneMinutes;
        /** Total time from assignment to completion/now in minutes */
        private Long tempsTotalMinutes;
        private List<TacheManagerDTO> taches;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TacheTimelineDTO {
        private Long tacheId;
        private String tacheNom;
        private String employeNom;
        private String statut;
        private LocalDate dateEcheance;
        private LocalDateTime dateAssignation;
        private LocalDateTime dateDebutExecution;
        private LocalDateTime dateFinExecution;
        private Integer dureePrevueJours;
        private boolean enRetard;
        /** Progress percentage: 0=TODO, 50=IN_PROGRESS, 100=DONE */
        private int progressPourcent;
        private LocalDate projetDateDebut;
        private LocalDate projetDateFin;
    }
}
