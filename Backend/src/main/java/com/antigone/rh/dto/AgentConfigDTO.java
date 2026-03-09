package com.antigone.rh.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AgentConfigDTO {
    private Integer popupIntervalleHeures;
    private Integer popupTimeoutSecondes;
    private Integer inactiviteToleranceMinutesJour;
    private String reseauEntrepriseIp;
    private String reseauEntrepriseSsid;
    private Integer toleranceRetardMinutes;
    private String heureDebutTravail;
    private String heureFinTravail;
    private String joursTravail;
}
