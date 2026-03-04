package com.antigone.rh.repository;

import com.antigone.rh.entity.TacheObligatoire;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TacheObligatoireRepository extends JpaRepository<TacheObligatoire, Long> {

    List<TacheObligatoire> findByEquipeId(Long equipeId);

    List<TacheObligatoire> findByEmployeId(Long employeId);

    /**
     * Find all taches obligatoires that apply to a specific employee:
     * either directly assigned to them OR assigned to their team (employe = null
     * means entire team)
     */
    @Query("""
                SELECT t FROM TacheObligatoire t
                WHERE t.employe.id = :employeId
                   OR (t.employe IS NULL AND t.equipe.id IN (
                        SELECT eq.id FROM Equipe eq JOIN eq.membres m WHERE m.id = :employeId
                   ))
            """)
    List<TacheObligatoire> findByEmployeDirectOrViaEquipe(@Param("employeId") Long employeId);
}
