package com.antigone.rh.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HoraireTravailRequest {
    private String nom;
    private String heureDebut;
    private String heureFin;
    private String pauseDebutMidi;
    private String pauseFinMidi;
    private String joursTravail;
    private String joursTeletravail;
    private String dateDebut;
    private String dateFin;
}
