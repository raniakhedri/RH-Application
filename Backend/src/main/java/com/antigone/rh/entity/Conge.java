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
    @Column(nullable = false)
    private TypeConge typeConge;

    @Column(nullable = false)
    private LocalDate dateDebut;

    @Column(nullable = false)
    private LocalDate dateFin;

    @Column(nullable = false)
    private Integer nombreJours;

    @Column(columnDefinition = "integer default 0")
    private Integer joursOuvrables;

    private String justificatifPath;
}
