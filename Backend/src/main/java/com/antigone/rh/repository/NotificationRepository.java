package com.antigone.rh.repository;

import com.antigone.rh.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByEmployeIdOrderByDateCreationDesc(Long employeId);

    List<Notification> findByEmployeIdAndLuFalseOrderByDateCreationDesc(Long employeId);

    long countByEmployeIdAndLuFalse(Long employeId);

    List<Notification> findByEmployeId(Long employeId);
}
