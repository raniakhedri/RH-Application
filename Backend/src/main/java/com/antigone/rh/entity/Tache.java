package com.antigone.rh.entity;

import com.antigone.rh.enums.StatutTache;
import com.fasterxml.jackson.annotation.JsonGetter;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "taches")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Tache {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titre;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutTache statut;

    private LocalDate dateEcheance;

    @Column(nullable = false)
    private boolean urgente = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "projet_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @JsonIgnore
    private Projet projet;

    @JsonGetter("projetId")
    public Long fetchProjetIdJson() {
        return projet != null ? projet.getId() : null;
    }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignee_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @JsonIgnore
    private Employe assignee;

    @JsonGetter("assigneeId")
    public Long fetchAssigneeIdJson() {
        return assignee != null ? assignee.getId() : null;
    }
}
