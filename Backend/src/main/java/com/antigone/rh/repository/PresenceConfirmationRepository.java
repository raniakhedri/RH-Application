package com.antigone.rh.repository;

import com.antigone.rh.entity.PresenceConfirmation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PresenceConfirmationRepository extends JpaRepository<PresenceConfirmation, Long> {

    List<PresenceConfirmation> findByEmployeIdAndTimestampBetween(
            Long employeId, LocalDateTime start, LocalDateTime end);
}
