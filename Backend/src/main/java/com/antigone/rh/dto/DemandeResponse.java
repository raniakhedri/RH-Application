package com.antigone.rh.dto;

import com.antigone.rh.enums.StatutDemande;
import com.antigone.rh.enums.TypeDemande;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DemandeResponse {
    private Long id;
    private TypeDemande type;
    private LocalDateTime dateCreation;
    private StatutDemande statut;
    private String raison;
    private Long employeId;
    private String employeNom;

    // For Conge and Teletravail
    private LocalDate dateDebut;
    private LocalDate dateFin;

    // For Autorisation
    private LocalDate date;
    private LocalTime heureDebut;
    private LocalTime heureFin;
}
