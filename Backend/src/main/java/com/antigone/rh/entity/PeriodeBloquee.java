package com.antigone.rh.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "periodes_bloquees")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PeriodeBloquee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDate dateDebut;

    @Column(nullable = false)
    private LocalDate dateFin;

    private Integer nbMinEmployes;

    private String raison;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cree_par_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Employe creePar;
}
