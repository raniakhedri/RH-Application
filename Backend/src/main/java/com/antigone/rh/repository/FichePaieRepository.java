package com.antigone.rh.repository;

import com.antigone.rh.entity.FichePaie;
import com.antigone.rh.enums.StatutFichePaie;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FichePaieRepository extends JpaRepository<FichePaie, Long> {
    List<FichePaie> findByEmployeId(Long employeId);

    Optional<FichePaie> findByEmployeIdAndMoisAndAnnee(Long employeId, Integer mois, Integer annee);

    List<FichePaie> findByMoisAndAnnee(Integer mois, Integer annee);

    List<FichePaie> findByStatut(StatutFichePaie statut);

    List<FichePaie> findByEmployeIdAndAnnee(Long employeId, Integer annee);
}
