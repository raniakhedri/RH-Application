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
    private String cnss;
    private String nom;
    private String prenom;
    private String email;
    private String telephone;
    private LocalDate dateEmbauche;
    private Double soldeConge;
    private String poste;
    private String typeContrat;
    private String genre;
    private String departement;
    private String ribBancaire;
    private Long managerId;
    private String managerNom;
    private String imageUrl;
}
