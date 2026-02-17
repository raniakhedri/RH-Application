package com.antigone.rh.entity;

import com.antigone.rh.enums.StatutDemande;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "historique_statuts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HistoriqueStatut {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutDemande ancienStatut;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutDemande nouveauStatut;

    @Column(nullable = false)
    private LocalDateTime dateChangement;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "demande_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Demande demande;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "modifie_par_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Employe modifiePar;

    @PrePersist
    public void prePersist() {
        if (dateChangement == null) {
            dateChangement = LocalDateTime.now();
        }
    }
}
