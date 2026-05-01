package com.antigone.rh.repository;

import com.antigone.rh.entity.ReactifIntern;
import com.antigone.rh.enums.TypeReactif;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReactifInternRepository extends JpaRepository<ReactifIntern, Long> {

    List<ReactifIntern> findByTypeOrderByDateReactifDesc(TypeReactif type);

    List<ReactifIntern> findByTache_IdOrderByDateReactifDesc(Long tacheId);

    List<ReactifIntern> findByMediaPlan_IdOrderByDateReactifDesc(Long mediaPlanId);

    List<ReactifIntern> findByClient_IdOrderByDateReactifDesc(Long clientId);

    long countByTache_Id(Long tacheId);

    long countByMediaPlan_Id(Long mediaPlanId);

    @Query("SELECT r FROM ReactifIntern r WHERE r.type = 'TACHE' ORDER BY r.dateReactif DESC")
    List<ReactifIntern> findAllTacheReactifs();

    @Query("SELECT r FROM ReactifIntern r WHERE r.type = 'MEDIA_PLAN_INTERN' ORDER BY r.dateReactif DESC")
    List<ReactifIntern> findAllMediaPlanInternReactifs();

    @Query("SELECT r FROM ReactifIntern r WHERE r.type = 'MEDIA_PLAN_EXTERN' ORDER BY r.dateReactif DESC")
    List<ReactifIntern> findAllMediaPlanExternReactifs();
}
