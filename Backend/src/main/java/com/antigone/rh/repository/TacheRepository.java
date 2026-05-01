package com.antigone.rh.repository;

import com.antigone.rh.entity.Tache;
import com.antigone.rh.enums.StatutTache;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;

import java.util.List;

@Repository
public interface TacheRepository extends JpaRepository<Tache, Long> {

    // Explicit queries for active / archived filtering
    List<Tache> findByProjetIdAndArchivedFalse(Long projetId);

    List<Tache> findByProjetIdAndArchivedTrue(Long projetId);

    // Fallback simple query (used in some test routines or generic counts where
    // archived state doesn't matter)
    List<Tache> findByProjetId(Long projetId);

    List<Tache> findByAssigneeIdAndArchivedFalse(Long assigneeId);

    List<Tache> findByAssigneeId(Long assigneeId);

    List<Tache> findByProjetIdAndStatutAndArchivedFalse(Long projetId, StatutTache statut);

    List<Tache> findByProjetIdAndStatut(Long projetId, StatutTache statut);

    long countByProjetIdAndStatutAndArchivedFalse(Long projetId, StatutTache statut);

    long countByProjetIdAndStatut(Long projetId, StatutTache statut);

    long countByProjetId(Long projetId);

    /** Active tâches that are TODO — for alert calculation */
    List<Tache> findByStatutAndDateEcheanceIsNotNullAndArchivedFalse(StatutTache statut);

    /** All non-DONE tasks with an assignee */
    @Query("SELECT t FROM Tache t WHERE t.statut <> 'DONE' AND t.assignee IS NOT NULL AND t.archived = false")
    List<Tache> findAllActiveAssigned();

    /** All non-DONE tasks — used by alert scheduler */
    @Query("SELECT t FROM Tache t WHERE t.statut <> 'DONE' AND t.archived = false")
    List<Tache> findAllActive();

    /**
     * All non-DONE tâches that have an assignee and a deadline — used by the
     * deadline scheduler.
     */
    @Query("SELECT t FROM Tache t WHERE t.statut <> :statut AND t.assignee IS NOT NULL AND t.dateEcheance IS NOT NULL AND t.archived = false")
    List<Tache> findActiveWithAssigneeAndDeadline(StatutTache statut);
}
