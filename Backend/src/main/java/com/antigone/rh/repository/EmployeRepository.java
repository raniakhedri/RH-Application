package com.antigone.rh.repository;

import com.antigone.rh.entity.Employe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeRepository extends JpaRepository<Employe, Long> {
    Optional<Employe> findByMatricule(String matricule);

    boolean existsByMatricule(String matricule);

    Optional<Employe> findByEmail(String email);

    boolean existsByEmail(String email);

    Optional<Employe> findByCin(String cin);

    boolean existsByCin(String cin);

    boolean existsByCnss(String cnss);

    List<Employe> findByManagerId(Long managerId);

    List<Employe> findByManagerIsNull();
}
