package com.antigone.rh.dto;

import lombok.Data;

@Data
public class ClientAssistantAskRequest {
    private Long clientId;
    private String message;
    private String threadId;
}
