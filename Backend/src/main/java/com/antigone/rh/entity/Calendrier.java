package com.antigone.rh.entity;

import com.antigone.rh.enums.OrigineJour;
import com.antigone.rh.enums.TypeJour;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "calendrier")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Calendrier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDate dateJour;

    @Column(nullable = false)
    private String nomJour;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TypeJour typeJour;

    @Enumerated(EnumType.STRING)
    private OrigineJour origine;

    private String description;

    @Column(columnDefinition = "boolean default true")
    @Builder.Default
    private Boolean estPaye = true;
}
