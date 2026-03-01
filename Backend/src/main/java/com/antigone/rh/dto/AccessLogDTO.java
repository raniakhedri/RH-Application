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
public class AccessLogDTO {
    private Long id;
    private Long compteId;
    private String username;
    private LocalDateTime dateAcces;
    private String adresseIp;
    private String action;
}
