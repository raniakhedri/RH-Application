package com.antigone.rh.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjetSummaryDTO {
    private Long projetId;
    private String projetNom;
    private String clientNom;
    private String statut;
    private List<String> managerNoms;
    private List<Long> managerIds;
    private double progressionPourcentage;
    private int totalTaches;
    private int tachesDone;
    private int tachesInProgress;
    private int tachesTodo;
    private int tachesEnRetard;
    private LocalDate dateDebut;
    private LocalDate dateFin;
    private String typeProjet;
}
