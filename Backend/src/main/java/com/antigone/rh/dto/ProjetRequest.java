package com.antigone.rh.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class ProjetRequest {
    private String nom;
    private LocalDate dateDebut;
    private LocalDate dateFin;
    private String statut; // Use String to avoid classloader conflicts with enum
    private Long chefDeProjetId;
    private Long equipeId;
}
