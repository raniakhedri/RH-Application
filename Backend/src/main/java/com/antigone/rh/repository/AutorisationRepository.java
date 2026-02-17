package com.antigone.rh.repository;

import com.antigone.rh.entity.Autorisation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface AutorisationRepository extends JpaRepository<Autorisation, Long> {
    List<Autorisation> findByEmployeId(Long employeId);
    List<Autorisation> findByEmployeIdAndDate(Long employeId, LocalDate date);
}
