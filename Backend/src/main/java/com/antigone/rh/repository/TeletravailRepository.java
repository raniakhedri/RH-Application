package com.antigone.rh.repository;

import com.antigone.rh.entity.Teletravail;
import com.antigone.rh.enums.StatutDemande;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface TeletravailRepository extends JpaRepository<Teletravail, Long> {
    List<Teletravail> findByEmployeId(Long employeId);

    @Query("SELECT t FROM Teletravail t WHERE t.employe.id = :employeId " +
            "AND t.statut IN :statuts " +
            "AND t.dateDebut <= :date AND t.dateFin >= :date")
    List<Teletravail> findActiveForEmployeOnDate(
            @Param("employeId") Long employeId,
            @Param("date") LocalDate date,
            @Param("statuts") List<StatutDemande> statuts);
}
