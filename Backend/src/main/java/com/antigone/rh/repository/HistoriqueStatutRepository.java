package com.antigone.rh.repository;

import com.antigone.rh.entity.HistoriqueStatut;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HistoriqueStatutRepository extends JpaRepository<HistoriqueStatut, Long> {
    List<HistoriqueStatut> findByDemandeIdOrderByDateChangementDesc(Long demandeId);
}
