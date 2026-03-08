package com.antigone.rh.repository;

import com.antigone.rh.entity.DocumentEmploye;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface DocumentEmployeRepository extends JpaRepository<DocumentEmploye, Long> {
    List<DocumentEmploye> findByEmployeId(Long employeId);
    List<DocumentEmploye> findByType(String type);
    List<DocumentEmploye> findByDateExpirationBefore(LocalDate date);
    List<DocumentEmploye> findByDateExpirationBetween(LocalDate start, LocalDate end);
}
