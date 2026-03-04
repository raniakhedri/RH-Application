package com.antigone.rh.dto;

import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TacheObligatoireRequest {
    private String nom;
    private Long equipeId;
    private Long employeId; // nullable = entire team
    private List<String> dates; // list of "YYYY-MM-DD" strings
}
