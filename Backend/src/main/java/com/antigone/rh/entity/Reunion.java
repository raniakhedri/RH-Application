package com.antigone.rh.entity;

import com.antigone.rh.enums.StatutReunion;
import com.antigone.rh.enums.TypeReunion;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "reunions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Reunion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titre;

    @Column(nullable = false)
    private LocalDate dateReunion;

    @Column(nullable = false)
    private LocalTime heureDebut;

    private LocalTime heureFin;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TypeReunion typeReunion;

    /** Plateforme for EN_LIGNE: Google Meet, Teams, Zoom, Autre */
    private String plateforme;

    /** Meeting link for EN_LIGNE (Google Meet/Teams/Zoom/...) */
    @Column(length = 1024)
    private String lienReunion;

    /** Lieu for PRESENTIEL */
    private String lieu;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private StatutReunion statut = StatutReunion.EN_ATTENTE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "initiateur_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @JsonIgnore
    private Employe initiateur;

    /** Internal participant (employee) — null if external */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "participant_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @JsonIgnore
    private Employe participant;

    /** External participant (client) — null if internal */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_participant_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @JsonIgnore
    private Client clientParticipant;

    @Column(nullable = false, updatable = false)
    private LocalDateTime dateCreation;

    @PrePersist
    public void prePersist() {
        if (dateCreation == null) {
            dateCreation = LocalDateTime.now();
        }
    }
}
