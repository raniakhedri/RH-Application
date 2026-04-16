package com.antigone.rh.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {
    private Long id;
    private String titre;
    private String message;
    private Boolean lu;
    private LocalDateTime dateCreation;
    private Long demandeId;
    private Long reunionId;
    private boolean urgent;
}
