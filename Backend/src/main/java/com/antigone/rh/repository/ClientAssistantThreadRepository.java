package com.antigone.rh.repository;

import com.antigone.rh.entity.ClientAssistantThread;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ClientAssistantThreadRepository extends JpaRepository<ClientAssistantThread, String> {
    Optional<ClientAssistantThread> findByIdAndClientId(String id, Long clientId);
}
