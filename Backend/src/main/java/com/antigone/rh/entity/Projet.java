package com.antigone.rh.entity;

import com.antigone.rh.enums.StatutProjet;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
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

    private LocalDate dateFin;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chef_projet_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Employe chefDeProjet;

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
}
