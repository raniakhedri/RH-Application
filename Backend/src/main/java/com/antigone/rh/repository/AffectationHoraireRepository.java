package com.antigone.rh.repository;

import com.antigone.rh.entity.AffectationHoraire;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AffectationHoraireRepository extends JpaRepository<AffectationHoraire, Long> {
    List<AffectationHoraire> findByEmployeId(Long employeId);

    @Query("SELECT a FROM AffectationHoraire a WHERE a.employe.id = :employeId " +
           "AND :date BETWEEN a.dateDebut AND COALESCE(a.dateFin, :date)")
    Optional<AffectationHoraire> findActiveForEmployeOnDate(@Param("employeId") Long employeId,
                                                             @Param("date") LocalDate date);
}
