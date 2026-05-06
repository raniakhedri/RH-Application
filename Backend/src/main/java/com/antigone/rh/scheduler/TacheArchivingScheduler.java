package com.antigone.rh.scheduler;

import com.antigone.rh.entity.Tache;
import com.antigone.rh.repository.TacheRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
@Slf4j
@RequiredArgsConstructor
public class TacheArchivingScheduler {

    private final TacheRepository tacheRepository;

    /**
     * Executes once every hour to find tasks that are completed (DONE),
     * and have stayed in that state for more than 48 hours without being
     * unarchived.
     */
    @Scheduled(cron = "0 0 * * * *") // Run at the start of every hour
    @Transactional
    public void archiveOldDoneTasks() {
        log.info("Running automatic task archiver check...");

        // Iterate over all tasks to find the ones that meet the archiving threshold
        List<Tache> allTasks = tacheRepository.findAll();
        int archivedCount = 0;

        LocalDateTime threshold = LocalDateTime.now().minusHours(48);

        for (Tache t : allTasks) {
            // Must be DONE, NOT archived, and completed over 48 hours ago
            if (t.getStatut() == com.antigone.rh.enums.StatutTache.DONE
                    && !t.isArchived()
                    && t.getDateFinExecution() != null
                    && t.getDateFinExecution().isBefore(threshold)) {

                t.setArchived(true);
                tacheRepository.save(t);
                archivedCount++;
            }
        }

        if (archivedCount > 0) {
            log.info("Archived {} tasks that were completed more than 48 hours ago.", archivedCount);
        }
    }
}
