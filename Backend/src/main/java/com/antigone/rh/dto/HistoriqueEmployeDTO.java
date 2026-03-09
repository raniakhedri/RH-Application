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
public class HistoriqueEmployeDTO {
    private Long employeId;
    private String nom;
    private String prenom;
    private String poste;
    private String departement;
    private String imageUrl;
    private List<JourDetailDTO> jours;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class JourDetailDTO {
        private String date;
        private String statut; // PRESENT, RETARD, ABSENT, EN_CONGE, TELETRAVAIL, JOUR_FERIE,
                               // JOUR_NON_TRAVAILLE
        private String heureEntree;
        private String heureSortie;
        private Integer retardMinutes;
        private Long tempsActifMinutes;
        private Long tempsInactifMinutes;
        private String ssid;
        private Boolean surReseauEntreprise;
        private Boolean teletravail;
    }
}
