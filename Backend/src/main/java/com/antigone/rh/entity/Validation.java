package com.antigone.rh.entity;

import com.antigone.rh.enums.DecisionValidation;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "validations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Validation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Integer ordre;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DecisionValidation decision;

    private LocalDateTime dateValidation;

    private String commentaire;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "demande_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Demande demande;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "validateur_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Employe validateur;

    @PrePersist
    public void prePersist() {
        if (decision == null) {
            decision = DecisionValidation.EN_ATTENTE;
        }
    }
}
