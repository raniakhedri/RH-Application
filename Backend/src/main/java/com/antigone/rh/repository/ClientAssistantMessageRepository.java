package com.antigone.rh.repository;

import com.antigone.rh.entity.ClientAssistantMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClientAssistantMessageRepository extends JpaRepository<ClientAssistantMessage, Long> {
    List<ClientAssistantMessage> findByThreadIdOrderByCreatedAtAsc(String threadId);
}
