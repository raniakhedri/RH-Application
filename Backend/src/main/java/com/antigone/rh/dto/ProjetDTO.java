package com.antigone.rh.dto;

import com.antigone.rh.enums.StatutProjet;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjetDTO {
    private Long id;
    private String nom;
    private StatutProjet statut;
    private LocalDate dateDebut;
    private LocalDate dateFin;
    private EmployeDTO chefDeProjet;
    private Long equipeId;
    private java.util.List<String> equipeNoms;
}
