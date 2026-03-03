package com.antigone.rh.entity;

import com.fasterxml.jackson.annotation.JsonGetter;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "equipes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Equipe {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nom;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "projet_id", nullable = true)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @JsonIgnore
    private Projet projet;

    @JsonGetter("projetId")
    public Long fetchProjetIdJson() {
        return projet != null ? projet.getId() : null;
    }

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "equipe_employes", joinColumns = @JoinColumn(name = "equipe_id"), inverseJoinColumns = @JoinColumn(name = "employe_id"))
    @Builder.Default
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Set<Employe> membres = new HashSet<>();
}
