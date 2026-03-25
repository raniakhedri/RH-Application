package com.antigone.rh.repository;

import com.antigone.rh.entity.Heartbeat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface HeartbeatRepository extends JpaRepository<Heartbeat, Long> {

    List<Heartbeat> findByEmployeIdAndTimestampBetweenOrderByTimestampAsc(
            Long employeId, LocalDateTime start, LocalDateTime end);

    @Query("SELECT h FROM Heartbeat h WHERE h.employe.id = :employeId " +
            "AND h.timestamp >= :start AND h.timestamp <= :end AND h.actif = false")
    List<Heartbeat> findInactiveHeartbeats(
            @Param("employeId") Long employeId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Query("SELECT COUNT(h) FROM Heartbeat h WHERE h.employe.id = :employeId " +
            "AND h.timestamp >= :start AND h.timestamp <= :end AND h.actif = false")
    long countInactiveMinutes(
            @Param("employeId") Long employeId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Query("SELECT COUNT(h) FROM Heartbeat h WHERE h.employe.id = :employeId " +
            "AND h.timestamp >= :start AND h.timestamp <= :end AND h.actif = true")
    long countActiveMinutes(
            @Param("employeId") Long employeId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Query("SELECT h FROM Heartbeat h WHERE h.employe.id = :employeId " +
            "ORDER BY h.timestamp DESC LIMIT 1")
    Heartbeat findLastByEmployeId(@Param("employeId") Long employeId);
}
