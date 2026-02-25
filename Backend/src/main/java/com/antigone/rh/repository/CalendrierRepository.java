package com.antigone.rh.repository;

import com.antigone.rh.entity.Calendrier;
import com.antigone.rh.enums.TypeJour;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface CalendrierRepository extends JpaRepository<Calendrier, Long> {

    List<Calendrier> findByTypeJour(TypeJour typeJour);

    List<Calendrier> findByDateJourBetween(LocalDate debut, LocalDate fin);

    List<Calendrier> findByTypeJourAndDateJourBetween(TypeJour typeJour, LocalDate debut, LocalDate fin);

    Optional<Calendrier> findByDateJour(LocalDate dateJour);

    List<Calendrier> findByDateJourBetweenOrderByDateJourAsc(LocalDate debut, LocalDate fin);

    boolean existsByDateJour(LocalDate dateJour);

    List<Calendrier> findAllByOrderByDateJourAsc();
}
