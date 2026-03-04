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
    private Double salaireBase;
    private Integer totalInactiviteMinutes;
    private Double montantDeductionInactivite;
    private Integer totalRetardMinutes;
    private Double montantRetard;
    private Double coutParMinute;
    private Double salaireNet;
    private Integer toleranceMinutes;
    private Integer inactiviteExcedentaire;
    private Double montantDeduction;
    private String decision;
    private String dateGeneration;
    private String dateDecision;
    private String decideParNom;
    private String commentaire;
}
