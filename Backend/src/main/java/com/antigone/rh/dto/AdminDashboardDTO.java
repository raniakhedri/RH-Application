package com.antigone.rh.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardDTO {
    // Global KPIs
    private int totalProjets;
    private int projetsActifs;
    private int projetsPlanifies;
    private int projetsClotures;
    private int totalTaches;
    private int tachesDone;
    private int tachesInProgress;
    private int tachesTodo;
    private int tachesEnRetard;
    private double progressionMoyenne;

    // Per-project summaries
    private List<ProjetSummaryDTO> projets;

    // Active alerts (sorted by severity)
    private List<AlerteDTO> alertes;
}
