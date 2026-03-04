package com.antigone.rh.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PointageDTO {
    private Long id;
    private String dateJour;
    private String heureEntree;
    private String heureSortie;
    private String statut;
    private String source;
    private Long employeId;
    private String employeNom;
    private String employePrenom;
    private Integer retardMinutes;
    private Integer tempsActifMinutes;
    private Integer tempsInactifMinutes;
    private Double scoreJournalier;
    private Integer confirmationsReussies;
    private Integer confirmationsRatees;
}
