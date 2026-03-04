package com.antigone.rh.entity;

import com.antigone.rh.enums.SourcePointage;
import com.antigone.rh.enums.StatutPointage;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "pointages")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Pointage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDate dateJour;

    private LocalTime heureEntree;

    private LocalTime heureSortie;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutPointage statut;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SourcePointage source;

    @Column(columnDefinition = "integer default 0")
    @Builder.Default
    private Integer retardMinutes = 0;

    @Column(columnDefinition = "integer default 0")
    @Builder.Default
    private Integer tempsActifMinutes = 0;

    @Column(columnDefinition = "integer default 0")
    @Builder.Default
    private Integer tempsInactifMinutes = 0;

    @Column(columnDefinition = "double precision default 0")
    @Builder.Default
    private Double scoreJournalier = 0.0;

    @Column(columnDefinition = "integer default 0")
    @Builder.Default
    private Integer confirmationsReussies = 0;

    @Column(columnDefinition = "integer default 0")
    @Builder.Default
    private Integer confirmationsRatees = 0;

    /** SSID WiFi connecté au moment du clock-in */
    private String ssidConnecte;

    /** true si le SSID correspond au réseau entreprise */
    @Column(columnDefinition = "boolean default false")
    @Builder.Default
    private Boolean surReseauEntreprise = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employe_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Employe employe;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "affectation_horaire_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private AffectationHoraire affectationHoraire;
}
