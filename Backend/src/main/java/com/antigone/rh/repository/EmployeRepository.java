package com.antigone.rh.repository;

import com.antigone.rh.entity.Employe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeRepository extends JpaRepository<Employe, Long> {
    Optional<Employe> findByMatricule(String matricule);
    Optional<Employe> findByEmail(String email);
    Optional<Employe> findByCin(String cin);
    List<Employe> findByManagerId(Long managerId);
    List<Employe> findByManagerIsNull();
}
