package com.antigone.rh.dto;

import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class ProjetRequest {
    private String nom;
    private LocalDate dateDebut;
    private LocalDate dateFin;
    private String statut;
    /** DETERMINE or INDETERMINE */
    private String typeProjet;
    private Boolean isMediaPlanProject;
    private Long mediaPlanLigneId;
    /** Single chef (legacy, kept for backward compat) */
    private Long chefDeProjetId;
    /**
     * Multiple chefs de projet (managers) — replaces / supplements chefDeProjetId
     */
    private List<Long> chefDeProjetIds;
    private Long createurId;
    /** ID of the fully-validated client to link to this project */
    private Long clientId;
    private List<Long> equipeIds;
    private List<Long> membreIds;
}
