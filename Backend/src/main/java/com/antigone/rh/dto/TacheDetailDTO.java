package com.antigone.rh.dto;

import com.antigone.rh.enums.StatutProjet;
import com.antigone.rh.enums.StatutTache;
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
public class TacheDetailDTO {

    private Long id;
    private String titre;
    private StatutTache statut;
    private LocalDate dateEcheance;

    // Project info
    private Long projetId;
    private String projetNom;
    private LocalDate projetDateFin;
    private String chefDeProjetNom;
    private Long chefDeProjetId;
    private StatutProjet projetStatut;

    // Assignee
    private Long assigneeId;

    // Direct project members (chef + selected subordinates)
    private List<MembreInfoDTO> membresProjet;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MembreInfoDTO {
        private Long id;
        private String nom;
        private String prenom;
        private String telephone;
        private String telephonePro;
        private String departement;
        private String email;
    }
}
