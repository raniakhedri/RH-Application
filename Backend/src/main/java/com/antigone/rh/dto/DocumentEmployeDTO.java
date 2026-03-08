package com.antigone.rh.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentEmployeDTO {
    private Long id;
    private String nom;
    private String type;
    private String fichierUrl;
    private LocalDate dateExpiration;
    private Long employeId;
    private String employeNom;
}
