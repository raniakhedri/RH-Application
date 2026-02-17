package com.antigone.rh.repository;

import com.antigone.rh.entity.Demande;
import com.antigone.rh.enums.StatutDemande;
import com.antigone.rh.enums.TypeDemande;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DemandeRepository extends JpaRepository<Demande, Long> {
    List<Demande> findByEmployeId(Long employeId);
    List<Demande> findByStatut(StatutDemande statut);
    List<Demande> findByType(TypeDemande type);
    List<Demande> findByEmployeIdAndStatut(Long employeId, StatutDemande statut);
    List<Demande> findByEmployeIdAndType(Long employeId, TypeDemande type);
}
