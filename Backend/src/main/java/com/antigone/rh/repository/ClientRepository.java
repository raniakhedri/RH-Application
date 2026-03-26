package com.antigone.rh.repository;

import com.antigone.rh.entity.Client;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ClientRepository extends JpaRepository<Client, Long> {

    /** DA visibility: only fully CEO+COO validated clients */
    List<Client> findByCeoValidatedTrueAndCooValidatedTrue();
}
