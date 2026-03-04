package com.antigone.rh.entity;

import com.antigone.rh.enums.DecisionInactivite;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "rapports_inactivite")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RapportInactivite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employe_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Employe employe;

    @Column(nullable = false)
    private LocalDate semaineDebut;

    @Column(nullable = false)
    private LocalDate semaineFin;

    @Column(columnDefinition = "double precision default 0")
    @Builder.Default
    private Double salaireBase = 0.0;

    @Column(columnDefinition = "integer default 0")
    @Builder.Default
    private Integer totalInactiviteMinutes = 0;

    @Column(columnDefinition = "double precision default 0")
    @Builder.Default
    private Double montantDeductionInactivite = 0.0;

    @Column(columnDefinition = "integer default 0")
    @Builder.Default
    private Integer totalRetardMinutes = 0;

    @Column(columnDefinition = "double precision default 0")
    @Builder.Default
    private Double montantRetard = 0.0;

    @Column(columnDefinition = "double precision default 0")
    @Builder.Default
    private Double coutParMinute = 0.0;

    @Column(columnDefinition = "double precision default 0")
    @Builder.Default
    private Double salaireNet = 0.0;

    @Column(columnDefinition = "integer default 0")
    @Builder.Default
    private Integer toleranceMinutes = 0;

    @Column(columnDefinition = "integer default 0")
    @Builder.Default
    private Integer inactiviteExcedentaire = 0;

    @Column(columnDefinition = "double precision default 0")
    @Builder.Default
    private Double montantDeduction = 0.0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private DecisionInactivite decision = DecisionInactivite.EN_ATTENTE;

    private LocalDateTime dateGeneration;

    private LocalDateTime dateDecision;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "decide_par_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Employe decidePar;

    private String commentaire;
}
