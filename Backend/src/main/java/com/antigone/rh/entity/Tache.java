package com.antigone.rh.entity;

import com.antigone.rh.enums.StatutTache;
import com.fasterxml.jackson.annotation.JsonGetter;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

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

    /** Optional: Post, Video, Documentation */
    @Column
    private String typeDrive;

    /** Auto-generated Google Drive folder link */
    @Column(length = 512)
    private String driveLink;

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

    // ── Lifecycle timestamps ───────────────────────────────────────────────────

    /** When the task was created by the Admin */
    @Column(name = "date_creation")
    private LocalDateTime dateCreation;

    /** When the task was assigned to a team member */
    @Column(name = "date_assignation")
    private LocalDateTime dateAssignation;

    /** When the task moved to IN_PROGRESS */
    @Column(name = "date_debut_execution")
    private LocalDateTime dateDebutExecution;

    /** When the task was marked DONE */
    @Column(name = "date_fin_execution")
    private LocalDateTime dateFinExecution;

    @PrePersist
    public void prePersist() {
        if (dateCreation == null) {
            dateCreation = LocalDateTime.now();
        }
    }
}
