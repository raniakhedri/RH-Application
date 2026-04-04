package com.antigone.rh.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "calendrier_projet")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CalendrierProjet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDate dateSlot;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "manager_id", nullable = false)
    private Employe manager;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "social_manager_id")
    private Employe socialManager;

    @Column(nullable = false)
    private String projectName;

    @Column(nullable = false)
    private boolean urgent;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private SlotType type;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private SlotStatus statut;

    public enum SlotType {
        BUSY, // Created by Marketing Manager
        BOOKED // Created by Social Manager
    }

    public enum SlotStatus {
        EN_ATTENTE,
        VALIDE,
        REJETE
    }
}
