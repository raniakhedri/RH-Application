package com.antigone.rh.repository;

import com.antigone.rh.entity.Reunion;
import com.antigone.rh.enums.StatutReunion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ReunionRepository extends JpaRepository<Reunion, Long> {

    @Query("SELECT r FROM Reunion r WHERE r.initiateur.id = :empId OR r.participant.id = :empId")
    List<Reunion> findByEmploye(@Param("empId") Long employeId);

    @Query("SELECT r FROM Reunion r WHERE r.dateReunion BETWEEN :start AND :end")
    List<Reunion> findBetween(@Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query("SELECT r FROM Reunion r WHERE (r.initiateur.id = :empId OR r.participant.id = :empId) AND r.dateReunion BETWEEN :start AND :end")
    List<Reunion> findByEmployeAndBetween(@Param("empId") Long employeId, @Param("start") LocalDate start, @Param("end") LocalDate end);

    List<Reunion> findByParticipantIdAndStatut(Long participantId, StatutReunion statut);
}
