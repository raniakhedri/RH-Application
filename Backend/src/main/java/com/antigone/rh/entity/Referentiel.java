package com.antigone.rh.entity;

import com.antigone.rh.enums.TypeReferentiel;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "referentiels", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"libelle", "type_referentiel"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Referentiel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String libelle;

    private String description;

    @Column(columnDefinition = "boolean default true")
    @Builder.Default
    private Boolean actif = true;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_referentiel", nullable = false)
    private TypeReferentiel typeReferentiel;
}
