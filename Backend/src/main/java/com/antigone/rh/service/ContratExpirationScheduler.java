package com.antigone.rh.service;

import com.antigone.rh.entity.Employe;
import com.antigone.rh.repository.EmployeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class ContratExpirationScheduler {

    private final EmployeRepository employeRepository;
    private final NotificationService notificationService;

    /**
     * Vérifie chaque jour à 8h les contrats CDD qui expirent dans 1 mois.
     * Envoie une notification aux admins et RH.
     */
    @Scheduled(cron = "0 0 8 * * *")
    @Transactional
    public void checkContratsCddExpiration() {
        LocalDate dateExpiration = LocalDate.now().plusMonths(1);
        List<Employe> employesExpirant = employeRepository.findByDateFinContrat(dateExpiration);

        for (Employe employe : employesExpirant) {
            String nomComplet = employe.getPrenom() + " " + employe.getNom();
            String message = "Le contrat CDD de l'employé " + nomComplet
                    + " (" + employe.getMatricule() + ")"
                    + " se termine le " + employe.getDateFinContrat()
                    + ". Veuillez prendre les dispositions nécessaires.";

            notifyAdmins("Fin de contrat CDD dans 1 mois", message);
            log.info("Notification envoyée pour fin de contrat CDD: {} - {}", employe.getMatricule(), employe.getDateFinContrat());
        }
    }

    private void notifyAdmins(String titre, String message) {
        List<Employe> admins = employeRepository.findByRoleName("ADMIN");
        List<Employe> rhs = employeRepository.findByRoleName("RH");
        Set<Long> notifiedIds = new HashSet<>();
        for (Employe admin : admins) {
            if (notifiedIds.add(admin.getId())) {
                notificationService.create(admin, titre, message, null);
            }
        }
        for (Employe rh : rhs) {
            if (notifiedIds.add(rh.getId())) {
                notificationService.create(rh, titre, message, null);
            }
        }
    }
}
