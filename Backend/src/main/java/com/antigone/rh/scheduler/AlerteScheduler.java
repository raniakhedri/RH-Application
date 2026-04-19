package com.antigone.rh.scheduler;

import com.antigone.rh.dto.AlerteDTO;
import com.antigone.rh.entity.Employe;
import com.antigone.rh.entity.Projet;
import com.antigone.rh.entity.Tache;
import com.antigone.rh.repository.ProjetRepository;
import com.antigone.rh.repository.TacheRepository;
import com.antigone.rh.service.AdminDashboardService;
import com.antigone.rh.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Runs every 2 hours and generates notification alerts for Admin and Managers
 * when tasks exceed dynamic thresholds.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AlerteScheduler {

    private final AdminDashboardService adminDashboardService;
    private final NotificationService notificationService;
    private final ProjetRepository projetRepository;
    private final TacheRepository tacheRepository;

    /**
     * Runs every 2 hours: at minute 0 of hours 0,2,4,6,8,10,12,14,16,18,20,22
     */
    @Scheduled(cron = "0 0 */2 * * *")
    public void checkAlertes() {
        try {
            List<Projet> projets = projetRepository.findAll();
            List<Tache> taches = tacheRepository.findAll();
            List<AlerteDTO> alertes = adminDashboardService.generateAlertes(projets, taches);

            if (alertes.isEmpty()) {
                log.info("AlerteScheduler: no alerts detected");
                return;
            }

            // Track who we've notified to avoid spam
            Set<String> notified = new HashSet<>();

            for (AlerteDTO alerte : alertes) {
                // Only send notifications for CRITIQUE alerts
                if (!"CRITIQUE".equals(alerte.getNiveau())) continue;

                String key = alerte.getProjetId() + "-" + alerte.getTacheId();
                if (notified.contains(key)) continue;
                notified.add(key);

                String title = "🔴 ALERTE — " + (alerte.getProjetNom() != null ? alerte.getProjetNom() : "Projet");
                String message = buildNotificationMessage(alerte);

                // Notify manager if exists
                if (alerte.getProjetId() != null) {
                    try {
                        Projet p = projetRepository.findById(alerte.getProjetId()).orElse(null);
                        if (p != null && p.getChefDeProjet() != null) {
                            notificationService.createUrgent(p.getChefDeProjet(), title, message, null);
                        }
                        // Also notify creator (admin)
                        if (p != null && p.getCreateur() != null
                                && (p.getChefDeProjet() == null || !p.getCreateur().getId().equals(p.getChefDeProjet().getId()))) {
                            notificationService.createUrgent(p.getCreateur(), title, message, null);
                        }
                    } catch (Exception e) {
                        log.error("AlerteScheduler: failed to send notification for alerte: {}", e.getMessage());
                    }
                }
            }

            log.info("AlerteScheduler: processed {} alerts, sent {} CRITIQUE notifications", alertes.size(), notified.size());
        } catch (Exception e) {
            log.error("AlerteScheduler: error during alert check: {}", e.getMessage(), e);
        }
    }

    private String buildNotificationMessage(AlerteDTO alerte) {
        StringBuilder sb = new StringBuilder();
        if (alerte.getTacheNom() != null) {
            sb.append("Tâche : \"").append(alerte.getTacheNom()).append("\"\n");
        }
        if (alerte.getEmployeNom() != null) {
            sb.append("Employé : ").append(alerte.getEmployeNom()).append("\n");
        }
        sb.append("Problème : ").append(alerte.getProbleme()).append("\n");
        if (alerte.getRetardJours() > 0) {
            sb.append("Retard : +").append(alerte.getRetardJours()).append(" jour(s)\n");
        }
        sb.append("Action : ").append(alerte.getActionSuggere());
        return sb.toString();
    }
}
