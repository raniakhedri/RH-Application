package com.antigone.rh.dto;

import com.antigone.rh.enums.StatutReunion;
import com.antigone.rh.enums.TypeReunion;
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
public class ReunionDTO {
    private Long id;
    private String titre;
    private LocalDate dateReunion;
    private LocalTime heureDebut;
    private LocalTime heureFin;
    private TypeReunion typeReunion;
    private String plateforme;
    private String lienReunion;
    private String lieu;
    private StatutReunion statut;

    // Initiateur
    private Long initiateurId;
    private String initiateurNom;
    private String initiateurPrenom;

    // Participant interne
    private Long participantId;
    private String participantNom;
    private String participantPrenom;

    // Participant externe (client)
    private Long clientParticipantId;
    private String clientParticipantNom;

    private LocalDateTime dateCreation;
}
