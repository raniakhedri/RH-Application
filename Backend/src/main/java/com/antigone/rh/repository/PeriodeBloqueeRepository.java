package com.antigone.rh.repository;

import com.antigone.rh.entity.PeriodeBloquee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface PeriodeBloqueeRepository extends JpaRepository<PeriodeBloquee, Long> {
    @Query("SELECT p FROM PeriodeBloquee p WHERE :date BETWEEN p.dateDebut AND p.dateFin")
    List<PeriodeBloquee> findActiveOnDate(@Param("date") LocalDate date);
}
