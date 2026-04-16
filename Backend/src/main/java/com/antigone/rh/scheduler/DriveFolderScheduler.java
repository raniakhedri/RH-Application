package com.antigone.rh.scheduler;

import com.antigone.rh.entity.Client;
import com.antigone.rh.repository.ClientRepository;
import com.antigone.rh.service.GoogleDriveService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

/**
 * Annual scheduler: every January 1st at midnight, creates the new-year Drive
 * folder structure for every active client.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DriveFolderScheduler {

    private final ClientRepository clientRepository;
    private final GoogleDriveService googleDriveService;

    /**
     * Cron: second minute hour day-of-month month day-of-week
     * "0 0 0 1 1 ?" = midnight on January 1st every year
     */
    @Scheduled(cron = "0 0 0 1 1 ?")
    public void createYearFoldersForAllClients() {
        int newYear = LocalDate.now().getYear();
        log.info("DriveFolderScheduler: creating {} folders for all clients...", newYear);

        List<Client> clients = clientRepository.findAll();
        for (Client client : clients) {
            try {
                googleDriveService.generateFullClientStructure(client.getNom(), newYear);
                log.info("Queued Drive structure for client '{}' / {}", client.getNom(), newYear);
            } catch (Exception e) {
                log.error("Failed to queue Drive structure for client '{}': {}", client.getNom(), e.getMessage());
            }
        }

        log.info("DriveFolderScheduler: finished queuing {} client(s).", clients.size());
    }
}
