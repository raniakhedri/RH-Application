package com.antigone.rh.repository;

import com.antigone.rh.entity.Pointage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface PointageRepository extends JpaRepository<Pointage, Long> {

    Optional<Pointage> findByEmployeIdAndDatePointage(Long employeId, LocalDate date);

    List<Pointage> findByDatePointage(LocalDate date);

    List<Pointage> findByEmployeIdAndDatePointageBetween(Long employeId, LocalDate debut, LocalDate fin);

    List<Pointage> findByDatePointageBetween(LocalDate debut, LocalDate fin);

    @Query("SELECT p FROM Pointage p WHERE p.datePointage = :date ORDER BY p.employe.nom, p.employe.prenom")
    List<Pointage> findAllByDateOrderByNom(@Param("date") LocalDate date);
}
