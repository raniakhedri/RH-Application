package com.antigone.rh.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MediaPlanDTO {
    private Long id;
    private String datePublication;
    private String heure;
    private String format;
    private String type;
    private String titre;
    private String texteSurVisuel;
    private String inspiration;
    private String autresElements;
    private String platforme;
    private String lienDrive;
    private String etatPublication;
    private String rectifs;
    private String remarques;
    private String statut;
    private Long clientId;
    private String clientNom;
    private Long createurId;
    private String createurNom;
    private String createurPrenom;
    private String dateCreation;
}
