package com.antigone.rh.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Configuration envoyée à l'Agent Desktop
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AgentConfigResponse {
    private Integer toleranceRetardMinutes;
    private Integer popupIntervalleHeures;
    private Integer popupTimeoutSecondes;
    private Integer inactiviteToleranceMinutesJour;
    private String reseauEntrepriseIp;
    private String reseauEntrepriseSsid;
    private String heureDebutTravail;
    private String heureFinTravail;
    private String joursTravail;
}
