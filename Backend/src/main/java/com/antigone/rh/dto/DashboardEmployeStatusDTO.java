package com.antigone.rh.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardEmployeStatusDTO {
    private Long employeId;
    private String nom;
    private String prenom;
    private String poste;
    private String departement;
    private String imageUrl;
    private String statut; // PRESENT, RETARD, ABSENT, INCOMPLET
    private String heureEntree;
    private String heureSortie;
    private Integer retardMinutes;
    private Double scoreJournalier;
    private Boolean agentActif;
    private String ssidConnecte;
    private Boolean surReseauEntreprise;
    private Long tempsActifMinutes;
    private Long tempsInactifMinutes;
}
