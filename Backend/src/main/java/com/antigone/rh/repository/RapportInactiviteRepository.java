package com.antigone.rh.repository;

import com.antigone.rh.entity.RapportInactivite;
import com.antigone.rh.enums.DecisionInactivite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface RapportInactiviteRepository extends JpaRepository<RapportInactivite, Long> {
    List<RapportInactivite> findByEmployeId(Long employeId);

    List<RapportInactivite> findByDecision(DecisionInactivite decision);

    Optional<RapportInactivite> findByEmployeIdAndSemaineDebutAndSemaineFin(
            Long employeId, LocalDate semaineDebut, LocalDate semaineFin);

    List<RapportInactivite> findByEmployeIdAndSemaineDebutBetween(
            Long employeId, LocalDate start, LocalDate end);

    List<RapportInactivite> findAllByOrderByDateGenerationDesc();

    List<RapportInactivite> findByDecisionOrderByDateGenerationDesc(DecisionInactivite decision);
}
