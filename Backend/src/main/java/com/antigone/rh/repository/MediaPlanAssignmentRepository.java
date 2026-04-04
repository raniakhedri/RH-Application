package com.antigone.rh.repository;

import com.antigone.rh.entity.MediaPlanAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MediaPlanAssignmentRepository extends JpaRepository<MediaPlanAssignment, Long> {
    List<MediaPlanAssignment> findByEmployeId(Long employeId);

    List<MediaPlanAssignment> findByClientId(Long clientId);

    boolean existsByEmployeIdAndClientId(Long employeId, Long clientId);
}
