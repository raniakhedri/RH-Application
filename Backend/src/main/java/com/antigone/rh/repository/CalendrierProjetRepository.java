package com.antigone.rh.repository;

import com.antigone.rh.entity.CalendrierProjet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface CalendrierProjetRepository extends JpaRepository<CalendrierProjet, Long> {
    List<CalendrierProjet> findByDateSlotBetween(LocalDate start, LocalDate end);
    List<CalendrierProjet> findByManagerIdAndDateSlotBetween(Long managerId, LocalDate start, LocalDate end);
}