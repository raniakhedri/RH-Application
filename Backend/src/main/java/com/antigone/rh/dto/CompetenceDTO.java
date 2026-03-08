package com.antigone.rh.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompetenceDTO {
    private Long id;
    private String nom;
    private String categorie;
    private Integer niveau;
    private Long employeId;
    private String employeNom;
}
