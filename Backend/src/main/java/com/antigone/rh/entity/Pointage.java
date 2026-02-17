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
