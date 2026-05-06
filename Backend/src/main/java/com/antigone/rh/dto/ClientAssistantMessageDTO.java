package com.antigone.rh.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClientAssistantMessageDTO {
    private Long id;
    private String role;
    private String content;
    private LocalDateTime createdAt;
    private List<ClientAssistantActionDTO> actions;
    private List<String> missingInfo;
}
