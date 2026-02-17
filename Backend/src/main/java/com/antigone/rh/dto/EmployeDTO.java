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
public class EmployeDTO {
    private Long id;
    private String matricule;
    private String cin;
    private String nom;
    private String prenom;
    private String email;
    private String telephone;
    private LocalDate dateEmbauche;
    private Double soldeConge;
    private Long managerId;
    private String managerNom;
}
