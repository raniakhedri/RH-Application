package com.antigone.rh.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClientAssistantResponse {
    private String reply;
    private List<ClientAssistantActionDTO> actions;
    private List<ClientAssistantActionDTO> executedActions;
    private List<String> warnings;
    private List<String> missingInfo;
    private String threadId;
}
