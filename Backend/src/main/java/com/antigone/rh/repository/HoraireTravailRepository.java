package com.antigone.rh.repository;

import com.antigone.rh.entity.HoraireTravail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface HoraireTravailRepository extends JpaRepository<HoraireTravail, Long> {
    Optional<HoraireTravail> findByNom(String nom);
}
