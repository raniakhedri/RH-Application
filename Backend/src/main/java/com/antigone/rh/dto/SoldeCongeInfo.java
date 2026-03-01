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

    // Ancienneté
    private int ancienneteAnnees;
    private int ancienneteMois;

    // Droits
    private double droitAnnuel;        // 18 (an1) ou 24 (an2+)
    private double tauxMensuel;        // 1.5 (an1) ou 2 (an2+)

    // Acquis pour l'année en cours
    private double joursAcquis;        // mois travaillés × taux
    private int moisTravaillesAnneeEnCours;

    // Report de l'année précédente
    private double joursReportes;      // min(reliquat année précédente, MAX_REPORT_CONGE)

    // Consommation
    private double joursConsommes;     // congés payés approuvés cette année
    private double joursEnAttente;     // congés payés en attente cette année

    // Solde
    private double soldeDisponible;    // acquis - consommés
    private double soldePrevisionnel;  // acquis - consommés - enAttente

    // Dates de référence
    private LocalDate debutAnneeConge; // anniversaire d'embauche de l'année en cours
    private LocalDate finAnneeConge;   // prochain anniversaire d'embauche
}
