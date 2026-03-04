package com.antigone.rh.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "taches_obligatoires")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TacheObligatoire {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nom;

    /**
     * Comma-separated list of dates: "2026-03-10,2026-03-11,2026-03-12"
     */
    @Column(nullable = false, columnDefinition = "TEXT")
    private String dates;

    /** The team this task is for (required) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "equipe_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Equipe equipe;

    /**
     * Specific employee this task is for.
     * If null → applies to the entire team.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employe_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Employe employe;
}
