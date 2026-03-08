package com.antigone.rh.scheduler;

import com.antigone.rh.entity.Tache;
import com.antigone.rh.enums.StatutTache;
import com.antigone.rh.repository.TacheRepository;
import com.antigone.rh.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

/**
 * Daily scheduler that sends deadline-warning notifications for tâches
 * whose dateEcheance is exactly 2 days from today and are not yet DONE.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class TacheDeadlineScheduler {

    private final TacheRepository tacheRepository;
    private final NotificationService notificationService;

    /**
     * Runs every day at 08:00 (server time).
     * Finds all non-DONE tâches due in ≤ 2 calendar days and notifies
     * their assignee if they haven't finished yet.
     */
    @Scheduled(cron = "0 0 8 * * *")
    public void checkDeadlines() {
        LocalDate today = LocalDate.now();
        LocalDate deadline = today.plusDays(2);

        List<Tache> candidates = tacheRepository.findActiveWithAssigneeAndDeadline(StatutTache.DONE);

        for (Tache tache : candidates) {
            if (tache.getDateEcheance() == null)
                continue;

            // Notify only when the deadline is in exactly 2 days (or overdue)
            long daysLeft = java.time.temporal.ChronoUnit.DAYS.between(today, tache.getDateEcheance());
            if (daysLeft > 2 || daysLeft < 0)
                continue; // skip future (> 2d) and already-past

            String projetNom = tache.getProjet() != null ? tache.getProjet().getNom() : null;
            String message;
            if (daysLeft == 0) {
                message = "La tâche \"" + tache.getTitre() + "\""
                        + (projetNom != null ? " du projet \"" + projetNom + "\"" : "")
                        + " arrive à échéance aujourd'hui ! Pensez à la terminer.";
            } else if (daysLeft < 0) {
                message = "La tâche \"" + tache.getTitre() + "\""
                        + (projetNom != null ? " du projet \"" + projetNom + "\"" : "")
                        + " est en retard depuis " + Math.abs(daysLeft) + " jour(s). Veuillez la clôturer.";
            } else {
                message = "La tâche \"" + tache.getTitre() + "\""
                        + (projetNom != null ? " du projet \"" + projetNom + "\"" : "")
                        + " arrive à échéance dans " + daysLeft
                        + " jour(s). Pensez à la terminer si ce n'est pas encore fait.";
            }

            try {
                notificationService.create(
                        tache.getAssignee(),
                        "⚠\uFE0F Tâche proche de l'échéance",
                        message,
                        null);
            } catch (Exception e) {
                log.error("Failed to send deadline notification for tache id={}: {}", tache.getId(), e.getMessage());
            }
        }

        log.info("TacheDeadlineScheduler: checked {} candidate tâches for deadline={}", candidates.size(), deadline);
    }
}
