package com.antigone.rh.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeStatsDTO {
    private long totalEmployes;
    private long employesActifs;
    private long nouveauxCeMois;
    private double masseSalariale;
    private double moyenneSalaire;
    private double moyenneAnciennete;
    private Map<String, Long> parDepartement;
    private Map<String, Long> parTypeContrat;
    private Map<String, Long> parGenre;
    private Map<String, Long> parPoste;
    private Map<String, Long> embaucheParMois;
}
