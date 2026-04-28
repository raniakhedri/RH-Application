package com.antigone.rh.dto;

import com.antigone.rh.enums.TypeReunion;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class ReunionRequest {
    private String titre;
    private LocalDate dateReunion;
    private LocalTime heureDebut;
    private LocalTime heureFin;
    private TypeReunion typeReunion;
    private String plateforme;
    private String lienReunion;
    private String lieu;
    /** ID of the internal participant (employee) */
    private Long participantId;
    /** ID of the external participant (client) */
    private Long clientParticipantId;
}
