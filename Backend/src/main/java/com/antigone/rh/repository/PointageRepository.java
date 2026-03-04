package com.antigone.rh.repository;

import com.antigone.rh.entity.Pointage;
import com.antigone.rh.enums.SourcePointage;
import com.antigone.rh.enums.StatutPointage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface PointageRepository extends JpaRepository<Pointage, Long> {
    List<Pointage> findByEmployeId(Long employeId);

    Optional<Pointage> findByEmployeIdAndDateJour(Long employeId, LocalDate dateJour);

    List<Pointage> findByEmployeIdAndDateJourBetween(Long employeId, LocalDate start, LocalDate end);

    List<Pointage> findByDateJour(LocalDate dateJour);

    List<Pointage> findByStatut(StatutPointage statut);

    List<Pointage> findByDateJourBetween(LocalDate start, LocalDate end);

    boolean existsByEmployeIdAndSource(Long employeId, SourcePointage source);
}
