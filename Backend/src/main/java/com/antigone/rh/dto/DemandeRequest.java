package com.antigone.rh.dto;

import com.antigone.rh.enums.TypeDemande;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class DemandeRequest {
    private TypeDemande type;
    private String raison;
    private Long employeId;

    // For Conge and Teletravail
    private LocalDate dateDebut;
    private LocalDate dateFin;

    // For Autorisation
    private LocalDate date;
    private LocalTime heureDebut;
    private LocalTime heureFin;
}
