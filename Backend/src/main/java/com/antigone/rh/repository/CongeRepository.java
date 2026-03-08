package com.antigone.rh.repository;

import com.antigone.rh.entity.Conge;
import com.antigone.rh.enums.StatutDemande;
import com.antigone.rh.enums.TypeConge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface CongeRepository extends JpaRepository<Conge, Long> {
    List<Conge> findByEmployeId(Long employeId);

    @Query("SELECT c FROM Conge c WHERE c.employe.id = :employeId AND " +
           "((c.dateDebut BETWEEN :debut AND :fin) OR (c.dateFin BETWEEN :debut AND :fin))")
    List<Conge> findOverlapping(@Param("employeId") Long employeId,
                                 @Param("debut") LocalDate debut,
                                 @Param("fin") LocalDate fin);

    @Query("SELECT c FROM Conge c WHERE c.employe.id = :employeId AND c.typeConge = :typeConge AND c.statut = :statut AND c.dateDebut BETWEEN :debut AND :fin")
    List<Conge> findByEmployeIdAndTypeCongeAndStatutAndDateDebutBetween(
            @Param("employeId") Long employeId,
            @Param("typeConge") TypeConge typeConge,
            @Param("statut") StatutDemande statut,
            @Param("debut") LocalDate debut,
            @Param("fin") LocalDate fin);

    @Query("SELECT c FROM Conge c WHERE c.employe.id = :employeId AND c.typeConge = :typeConge AND c.statut = :statut AND " +
           "((c.dateDebut BETWEEN :debut AND :fin) OR (c.dateFin BETWEEN :debut AND :fin))")
    List<Conge> findOverlappingByTypeCongeAndStatut(
            @Param("employeId") Long employeId,
            @Param("typeConge") TypeConge typeConge,
            @Param("statut") StatutDemande statut,
            @Param("debut") LocalDate debut,
            @Param("fin") LocalDate fin);
}
