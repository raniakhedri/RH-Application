package com.antigone.rh.entity;

import com.antigone.rh.enums.StatutFichePaie;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "fiches_paie", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "employe_id", "mois", "annee" })
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FichePaie {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employe_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Employe employe;

    @Column(nullable = false)
    private Integer mois;

    @Column(nullable = false)
    private Integer annee;

    @Column(nullable = false, columnDefinition = "double precision default 0")
    @Builder.Default
    private Double salaireBase = 0.0;

    @Column(columnDefinition = "integer default 0")
    @Builder.Default
    private Integer totalRetardMinutes = 0;

    @Column(columnDefinition = "double precision default 0")
    @Builder.Default
    private Double montantPenaliteRetard = 0.0;

    @Column(columnDefinition = "integer default 0")
    @Builder.Default
    private Integer totalInactiviteMinutes = 0;

    @Column(columnDefinition = "double precision default 0")
    @Builder.Default
    private Double montantDeductionInactivite = 0.0;

    @Column(columnDefinition = "integer default 0")
    @Builder.Default
    private Integer joursPresence = 0;

    @Column(columnDefinition = "integer default 0")
    @Builder.Default
    private Integer joursAbsence = 0;

    @Column(columnDefinition = "integer default 0")
    @Builder.Default
    private Integer joursConge = 0;

    @Column(columnDefinition = "double precision default 0")
    @Builder.Default
    private Double scoreMoyen = 0.0;

    @Column(columnDefinition = "double precision default 0")
    @Builder.Default
    private Double salaireNet = 0.0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private StatutFichePaie statut = StatutFichePaie.BROUILLON;

    private LocalDateTime dateGeneration;

    private LocalDateTime dateValidation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "valide_par_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Employe validePar;
}
