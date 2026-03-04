package com.antigone.rh.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO envoyé par l'Agent Desktop pour les événements (clock-in auto,
 * inactivité, etc.)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AgentEventRequest {
    private Long employeId;
    private String eventType; // CLOCK_IN, CLOCK_OUT, INACTIVITY_START, INACTIVITY_END, POPUP_CONFIRMED,
                              // POPUP_MISSED
    private String ipAddress;
    private String ssid;
    private String details;
}
