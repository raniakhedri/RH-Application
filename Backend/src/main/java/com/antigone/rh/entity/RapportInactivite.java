package com.antigone.rh.entity;

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

    @Column(nullable = false)
    private Integer totalInactiviteMinutes;

    @Column(nullable = false)
    private Integer toleranceMinutes;

    @Column(nullable = false)
    private Integer inactiviteExcedentaire;

    private Integer retardCumule;

    @Column(nullable = false)
    private Double montantDeduction;

    @Column(nullable = false)
    private String decision; // EN_ATTENTE, DEDUIT, ANNULE

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "decide_par_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Employe decidePar;

    private String commentaire;

    private LocalDateTime dateDecision;

    @Column(nullable = false)
    private LocalDateTime dateGeneration;

    @PrePersist
    protected void onCreate() {
        if (this.dateGeneration == null) {
            this.dateGeneration = LocalDateTime.now();
        }
        if (this.decision == null) {
            this.decision = "EN_ATTENTE";
        }
    }
}
