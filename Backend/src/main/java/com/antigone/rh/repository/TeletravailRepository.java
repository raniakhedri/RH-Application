package com.antigone.rh.repository;

import com.antigone.rh.entity.Teletravail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TeletravailRepository extends JpaRepository<Teletravail, Long> {
    List<Teletravail> findByEmployeId(Long employeId);
}
