package com.antigone.rh.repository;

import com.antigone.rh.entity.Tache;
import com.antigone.rh.enums.StatutTache;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TacheRepository extends JpaRepository<Tache, Long> {
    List<Tache> findByProjetId(Long projetId);
    List<Tache> findByAssigneeId(Long assigneeId);
    List<Tache> findByProjetIdAndStatut(Long projetId, StatutTache statut);
}
