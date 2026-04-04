package com.antigone.rh.dto;

import lombok.Data;

@Data
public class MediaPlanRequest {
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
    private Long clientId;
    private Long createurId;
}
