package com.antigone.rh.repository;

import com.antigone.rh.entity.RapportInactivite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface RapportInactiviteRepository extends JpaRepository<RapportInactivite, Long> {

    List<RapportInactivite> findAllByOrderByDateGenerationDesc();

    Optional<RapportInactivite> findByEmployeIdAndSemaineDebutAndSemaineFin(
            Long employeId, LocalDate semaineDebut, LocalDate semaineFin);

    List<RapportInactivite> findByDecision(String decision);

    @Query("SELECT r FROM RapportInactivite r WHERE r.semaineDebut >= :debut AND r.semaineFin <= :fin " +
            "ORDER BY r.dateGeneration DESC")
    List<RapportInactivite> findByPeriode(@Param("debut") LocalDate debut, @Param("fin") LocalDate fin);
}
