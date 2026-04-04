package com.antigone.rh.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MediaPlanAssignmentDTO {
    private Long id;
    private Long employeId;
    private String employeNom;
    private String employePrenom;
    private String employeDepartement;
    private Long clientId;
    private String clientNom;
    private String dateAssignment;
}
