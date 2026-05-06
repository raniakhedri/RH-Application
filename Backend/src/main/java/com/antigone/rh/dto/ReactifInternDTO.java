package com.antigone.rh.dto;

import com.antigone.rh.enums.TypeReactif;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class ReactifInternDTO {

    private Long id;
    private TypeReactif type;
    private String contenu;
    private LocalDateTime dateReactif;
    private Integer nombreFois;

    // Tache-related
    private Long tacheId;
    private String tacheTitre;
    private String tacheDescription;
    private LocalDate tacheDateCreation;
    private LocalDate tacheDateEcheance;
    private LocalDateTime tacheDateFinExecution;

    // Projet-related (via tache)
    private Long projetId;
    private String projetNom;

    // Media plan-related
    private Long mediaPlanId;
    private String mediaPlanTitre;
    private String mediaPlanMois;
    private LocalDateTime mediaPlanDateCreation;

    // Manager who wrote the reactif
    private Long managerId;
    private String managerNom;
    private String managerPrenom;

    // Employee (task assignee or mediaplan creator)
    private Long employeId;
    private String employeNom;
    private String employePrenom;

    // Client
    private Long clientId;
    private String clientNom;
}
