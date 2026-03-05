package com.antigone.rh.repository;

import com.antigone.rh.entity.Employe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeRepository extends JpaRepository<Employe, Long> {
    Optional<Employe> findByMatricule(String matricule);
    boolean existsByMatricule(String matricule);
    Optional<Employe> findByEmail(String email);
    Optional<Employe> findByCin(String cin);
    List<Employe> findByManagerId(Long managerId);
    List<Employe> findByManagerIsNull();

    @Query("SELECT e FROM Employe e JOIN e.compte c JOIN c.roles r WHERE UPPER(r.nom) = UPPER(:roleName)")
    List<Employe> findByRoleName(@Param("roleName") String roleName);
}
