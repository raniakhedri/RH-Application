package com.antigone.rh.repository;

import com.antigone.rh.entity.Projet;
import com.antigone.rh.enums.StatutProjet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import java.util.List;

@Repository
public interface ProjetRepository extends JpaRepository<Projet, Long> {
    List<Projet> findByStatut(StatutProjet statut);

    List<Projet> findByChefDeProjetId(Long chefId);

    List<Projet> findByCreateurId(Long createurId);

    boolean existsByNomAndClientId(String nom, Long clientId);

    /**
     * Projects where the given employee is a member of one of the project's equipes
     */
    @Query("SELECT DISTINCT e.projet FROM Equipe e JOIN e.membres m WHERE m.id = :employeId AND e.projet IS NOT NULL")
    List<Projet> findByEquipeMembre(Long employeId);

    /**
     * Projects where the given employee was directly selected as a member by the
     * chef
     */
    @Query("SELECT DISTINCT p FROM Projet p JOIN p.membres m WHERE m.id = :employeId")
    List<Projet> findByMembreId(Long employeId);
}
