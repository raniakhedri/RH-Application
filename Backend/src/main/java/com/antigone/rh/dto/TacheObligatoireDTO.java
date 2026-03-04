package com.antigone.rh.dto;

import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TacheObligatoireDTO {
    private Long id;
    private String nom;
    private List<String> dates;
    private Long equipeId;
    private String equipeNom;
    private Long employeId;
    private String employeNom;
}
