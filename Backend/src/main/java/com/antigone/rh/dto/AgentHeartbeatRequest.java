package com.antigone.rh.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO envoyé par l'Agent Desktop pour le heartbeat (toutes les minutes)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AgentHeartbeatRequest {
    private Long employeId;
    private String ipAddress;
    private String ssid;
    private Boolean actif;
}
