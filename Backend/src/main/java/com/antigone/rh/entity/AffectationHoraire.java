package com.antigone.rh.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "affectations_horaire")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AffectationHoraire {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDate dateDebut;

    private LocalDate dateFin;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employe_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Employe employe;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "horaire_travail_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private HoraireTravail horaireTravail;
}
