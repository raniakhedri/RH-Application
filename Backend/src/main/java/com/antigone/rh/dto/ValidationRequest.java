package com.antigone.rh.dto;

import com.antigone.rh.enums.DecisionValidation;
import lombok.Data;

@Data
public class ValidationRequest {
    private Long demandeId;
    private Long validateurId;
    private Integer ordre;
    private DecisionValidation decision;
    private String commentaire;
}
