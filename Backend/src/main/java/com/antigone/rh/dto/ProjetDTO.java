package com.antigone.rh.dto;

import com.antigone.rh.enums.StatutProjet;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

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
    private Long createurId;
    private String createurNom; // prenom + nom of the creator
    private Long equipeId; // kept for backward compat (first equipe)
    private List<Long> equipeIds; // all equipe IDs
    private List<String> equipeNoms;
}
