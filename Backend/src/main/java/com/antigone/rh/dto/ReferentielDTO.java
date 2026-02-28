package com.antigone.rh.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReferentielDTO {
    private Long id;
    private String libelle;
    private String description;
    private Boolean actif;
    private String typeReferentiel;
    private String typeReferentielLabel;
    private String valeur;
}
