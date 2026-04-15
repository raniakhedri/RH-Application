package com.antigone.rh.entity;

import com.antigone.rh.enums.StatutProjet;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "projets")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Projet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nom;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutProjet statut;

    private LocalDate dateDebut;

    /** Null when typeProjet = INDETERMINE */
    private LocalDate dateFin;

    /** DETERMINE or INDETERMINE */
    @Builder.Default
    @Column(name = "type_projet", columnDefinition = "VARCHAR(50) DEFAULT 'DETERMINE'")
    private String typeProjet = "DETERMINE";

    @Column(name = "is_media_plan_project")
    private Boolean isMediaPlanProject;

    @Column(name = "media_plan_ligne_id")
    private Long mediaPlanLigneId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chef_projet_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Employe chefDeProjet;

    /** Multiple chefs de projet (managers) */
    @ManyToMany(fetch = FetchType.LAZY, cascade = { CascadeType.PERSIST, CascadeType.MERGE })
    @JoinTable(name = "projet_chefs", joinColumns = @JoinColumn(name = "projet_id"), inverseJoinColumns = @JoinColumn(name = "employe_id"))
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @Builder.Default
    private List<Employe> chefsDeProjet = new ArrayList<>();

    /** Fully-validated client linked to this project (optional) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Client client;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "createur_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Employe createur;

    @OneToMany(mappedBy = "projet", cascade = { CascadeType.PERSIST, CascadeType.MERGE }, fetch = FetchType.LAZY)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @Builder.Default
    @JsonIgnore
    private List<Equipe> equipes = new ArrayList<>();

    @OneToMany(mappedBy = "projet", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @Builder.Default
    @JsonIgnore
    private List<Tache> taches = new ArrayList<>();

    @ManyToMany(fetch = FetchType.LAZY, cascade = { CascadeType.PERSIST, CascadeType.MERGE })
    @JoinTable(name = "projet_membres", joinColumns = @JoinColumn(name = "projet_id"), inverseJoinColumns = @JoinColumn(name = "employe_id"))
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @Builder.Default
    private List<Employe> membres = new ArrayList<>();

    // ── Lifecycle timestamps ───────────────────────────────────────────────────

    /** Precise timestamp of project creation (opening by Admin) */
    @Column(name = "date_creation")
    private LocalDateTime dateCreation;

    /** Precise timestamp of project closure */
    @Column(name = "date_cloture")
    private LocalDateTime dateCloture;

    @PrePersist
    public void prePersist() {
        if (dateCreation == null) {
            dateCreation = LocalDateTime.now();
        }
    }
}
