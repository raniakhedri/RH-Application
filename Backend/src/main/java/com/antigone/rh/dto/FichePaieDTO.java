package com.antigone.rh.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FichePaieDTO {
    private Long id;
    private Long employeId;
    private String employeNom;
    private String employePrenom;
    private String employeMatricule;
    private Integer mois;
    private Integer annee;
    private Double salaireBase;
    private Integer totalRetardMinutes;
    private Double montantPenaliteRetard;
    private Integer totalInactiviteMinutes;
    private Double montantDeductionInactivite;
    private Integer joursPresence;
    private Integer joursAbsence;
    private Integer joursConge;
    private Double scoreMoyen;
    private Double salaireNet;
    private String statut;
    private String dateGeneration;
    private String dateValidation;
    private String valideParNom;
}
