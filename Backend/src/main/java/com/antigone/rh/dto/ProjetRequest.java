package com.antigone.rh.dto;

import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class ProjetRequest {
    private String nom;
    private LocalDate dateDebut;
    private LocalDate dateFin;
    private String statut; // Use String to avoid classloader conflicts with enum
    private Long chefDeProjetId;
    private Long createurId; // ID of the employee who is creating the project
    private List<Long> equipeIds; // Multiple teams supported
}
