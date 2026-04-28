package com.antigone.rh.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClientDTO {

    private Long id;
    private String nom;
    private String email;
    private String telephone;
    private String adresse;
    private String notes;

    // Contact principal
    private String contactNom;
    private String contactPoste;
    private String contactEmail;
    private String contactTelephone;

    // Account info (credentials are never exposed in plain text except
    // generatedPassword at creation)
    private boolean hasAccount;
    private String loginClient;
    /**
     * Comma-separated list of allowed client portal page keys (e.g.
     * "MEDIA_PLANS,PROJETS,FICHIERS")
     */
    private String clientPages;

    /** Returned only once at account creation — the raw generated password */
    private String generatedPassword;

    // Legacy
    private String description;
    private String responsable;
    private String fileName;
    private String fileUrl;

    private LocalDateTime dateCreation;
}
