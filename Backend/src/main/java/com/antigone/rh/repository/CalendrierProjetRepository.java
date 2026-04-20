package com.antigone.rh.repository;

import com.antigone.rh.entity.CalendrierProjet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface CalendrierProjetRepository extends JpaRepository<CalendrierProjet, Long> {
    List<CalendrierProjet> findByDateSlotBetween(LocalDate start, LocalDate end);
    List<CalendrierProjet> findByManagerIdAndDateSlotBetween(Long managerId, LocalDate start, LocalDate end);

    List<CalendrierProjet> findByDateSlotBetweenAndStatutIn(LocalDate start, LocalDate end, List<CalendrierProjet.SlotStatus> statuts);
    List<CalendrierProjet> findByManagerIdAndDateSlotBetweenAndStatutIn(Long managerId, LocalDate start, LocalDate end, List<CalendrierProjet.SlotStatus> statuts);

    boolean existsByManagerIdAndDateSlotAndStatutIn(Long managerId, LocalDate dateSlot, List<CalendrierProjet.SlotStatus> statuts);

    Optional<CalendrierProjet> findByMediaPlanLigneId(Long mediaPlanLigneId);
}