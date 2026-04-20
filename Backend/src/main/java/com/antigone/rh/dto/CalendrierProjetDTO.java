package com.antigone.rh.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class CalendrierProjetDTO {
    private Long id;
    private LocalDate dateSlot;
    private Long managerId;
    private Long socialManagerId;
    private String projectName;
    private String description;
    private String localisation;
    private String typeDeContenu; // PHOTO | VIDEO | BOTH
    private Long mediaPlanLigneId;
    private String titre;
    private Long clientId;
    private String clientNom;
    private boolean urgent;
    private String type; // BUSY or BOOKED
    private String statut; // EN_ATTENTE, VALIDE, REJETE
}