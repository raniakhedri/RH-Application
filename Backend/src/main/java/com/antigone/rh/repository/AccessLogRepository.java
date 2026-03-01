package com.antigone.rh.repository;

import com.antigone.rh.entity.AccessLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AccessLogRepository extends JpaRepository<AccessLog, Long> {
    List<AccessLog> findByCompteIdOrderByDateAccesDesc(Long compteId);
}
