package com.antigone.rh.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalTime;

@Entity
@Table(name = "horaires_travail")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HoraireTravail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nom;

    @Column(nullable = false)
    private LocalTime heureDebut;

    @Column(nullable = false)
    private LocalTime heureFin;

    @Column(nullable = false)
    private String joursTravail; // Comma-separated: "LUNDI,MARDI,MERCREDI,JEUDI,VENDREDI"
}
