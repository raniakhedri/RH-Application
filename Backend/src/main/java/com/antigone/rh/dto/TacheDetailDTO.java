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

    // Equipes with members
    private List<EquipeInfoDTO> equipes;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EquipeInfoDTO {
        private Long id;
        private String nom;
        private List<MembreInfoDTO> membres;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MembreInfoDTO {
        private Long id;
        private String nom;
        private String prenom;
        private String telephone;
        private String departement;
        private String email;
    }
}
