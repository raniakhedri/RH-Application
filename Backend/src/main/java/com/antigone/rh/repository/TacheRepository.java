package com.antigone.rh.repository;

import com.antigone.rh.entity.Tache;
import com.antigone.rh.enums.StatutTache;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;

import java.util.List;

@Repository
public interface TacheRepository extends JpaRepository<Tache, Long> {
    List<Tache> findByProjetId(Long projetId);

    List<Tache> findByAssigneeId(Long assigneeId);

    List<Tache> findByProjetIdAndStatut(Long projetId, StatutTache statut);

    /**
     * All non-DONE tâches that have an assignee and a deadline — used by the
     * deadline scheduler.
     */
    @Query("SELECT t FROM Tache t WHERE t.statut <> :statut AND t.assignee IS NOT NULL AND t.dateEcheance IS NOT NULL")
    List<Tache> findActiveWithAssigneeAndDeadline(StatutTache statut);
}
