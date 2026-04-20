package com.antigone.rh.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AlerteDTO {
    /** CRITIQUE, WARNING, INFO */
    private String niveau;
    private String projetNom;
    private Long projetId;
    private String tacheNom;
    private Long tacheId;
    private String employeNom;
    private String managerNom;
    private String probleme;
    private String actionSuggere;
    /** Delay in days (can be fractional) */
    private double retardJours;
    private LocalDateTime dateDetection;
}
