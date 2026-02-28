package com.antigone.rh.repository;

import com.antigone.rh.entity.Autorisation;
import com.antigone.rh.enums.StatutDemande;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface AutorisationRepository extends JpaRepository<Autorisation, Long> {
    List<Autorisation> findByEmployeId(Long employeId);
    List<Autorisation> findByEmployeIdAndDate(Long employeId, LocalDate date);

    @Query("SELECT a FROM Autorisation a WHERE a.employe.id = :employeId " +
           "AND a.date BETWEEN :debut AND :fin " +
           "AND a.statut IN :statuts")
    List<Autorisation> findByEmployeIdAndDateBetweenAndStatutIn(
            @Param("employeId") Long employeId,
            @Param("debut") LocalDate debut,
            @Param("fin") LocalDate fin,
            @Param("statuts") List<StatutDemande> statuts);
}
