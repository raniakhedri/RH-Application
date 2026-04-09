package com.antigone.rh.repository;

import com.antigone.rh.entity.Client;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ClientRepository extends JpaRepository<Client, Long> {

    boolean existsByLoginClient(String loginClient);
}
