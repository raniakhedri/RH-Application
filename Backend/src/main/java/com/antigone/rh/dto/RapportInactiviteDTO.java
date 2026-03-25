package com.antigone.rh.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RapportInactiviteDTO {
    private Long id;
    private Long employeId;
    private String employeNom;
    private String employePrenom;
    private String employeMatricule;
    private String semaineDebut;
    private String semaineFin;
    private Integer totalInactiviteMinutes;
    private Integer toleranceMinutes;
    private Integer inactiviteExcedentaire;
    private Integer retardCumule;
    private Double montantDeduction;
    private String decision;
    private String decideParNom;
    private String commentaire;
    private String dateDecision;
    private String dateGeneration;
}
