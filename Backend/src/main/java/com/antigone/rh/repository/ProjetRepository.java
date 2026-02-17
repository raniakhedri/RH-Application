package com.antigone.rh.repository;

import com.antigone.rh.entity.Projet;
import com.antigone.rh.enums.StatutProjet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjetRepository extends JpaRepository<Projet, Long> {
    List<Projet> findByStatut(StatutProjet statut);
}
