package com.antigone.rh.repository;

import com.antigone.rh.entity.Competence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CompetenceRepository extends JpaRepository<Competence, Long> {
    List<Competence> findByEmployeId(Long employeId);
    List<Competence> findByCategorie(String categorie);
    List<Competence> findByNomContainingIgnoreCase(String nom);
}
