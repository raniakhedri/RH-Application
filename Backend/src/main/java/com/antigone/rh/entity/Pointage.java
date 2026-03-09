package com.antigone.rh.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employe_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Employe employe;

    private LocalDate datePointage;

    private LocalTime heureEntree;

    private LocalTime heureSortie;

    private String ipEntree;

    private String ssidEntree;

    private Integer retardMinutes;

    // PRESENT, RETARD, ABSENT, EN_CONGE, EN_AUTORISATION, TELETRAVAIL, JOUR_FERIE
    private String statut;

    private Boolean surReseauEntreprise;

    // true si l'employé est en télétravail ce jour
    private Boolean teletravail;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
