package com.antigone.rh.entity;

import com.antigone.rh.enums.TypeConge;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "conges")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@ToString(callSuper = true)
public class Conge extends Demande {

    @Enumerated(EnumType.STRING)
    private TypeConge typeConge;

    @Column(nullable = false)
    private LocalDate dateDebut;

    @Column(nullable = false)
    private LocalDate dateFin;

    private Double nombreJours;

    private Double joursOuvrables;
}
