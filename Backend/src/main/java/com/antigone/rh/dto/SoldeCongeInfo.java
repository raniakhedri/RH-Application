package com.antigone.rh.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SoldeCongeInfo {
    private Long employeId;
    private String employeNom;
    private LocalDate dateEmbauche;
    private int ancienneteAnnees;
    private int ancienneteMois;
    private double droitAnnuel;
    private double tauxMensuel;
    private double joursAcquis;
    private int moisTravaillesAnneeEnCours;
    private double joursReportes;
    private double joursConsommes;
    private double joursEnAttente;
    private double soldeDisponible;
    private double soldePrevisionnel;
    private LocalDate debutAnneeConge;
    private LocalDate finAnneeConge;
}
