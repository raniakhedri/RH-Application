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
    /** DETERMINE or INDETERMINE */
    private String typeProjet;

    private Boolean isMediaPlanProject;
    private Long mediaPlanLigneId;

    private EmployeDTO chefDeProjet;
    /** All chefs de projet (managers) */
    private List<EmployeDTO> chefsDeProjet;
    private Long createurId;
    private String createurNom;
    private Long equipeId;
    private List<Long> equipeIds;
    private List<String> equipeNoms;
    private List<EmployeDTO> membres;
    /** Linked validated client */
    private Long clientId;
    private String clientNom;
    /** True if project was force-closed with remaining open tasks */
    private Boolean clotureForcee;
    /** Number of open tasks when force-closed */
    private Integer tachesAbandonnees;
}
