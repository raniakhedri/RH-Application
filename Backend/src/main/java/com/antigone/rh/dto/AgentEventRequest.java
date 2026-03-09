package com.antigone.rh.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AgentEventRequest {
    private Long employeId;
    private String eventType; // CLOCK_IN, CLOCK_OUT
    private String ipAddress;
    private String ssid;
}
