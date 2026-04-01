package com.antigone.rh.service;

import com.antigone.rh.dto.NotificationResponse;
import com.antigone.rh.entity.Demande;
import com.antigone.rh.entity.Employe;
import com.antigone.rh.entity.Notification;
import com.antigone.rh.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class NotificationService {

    private final NotificationRepository notificationRepository;

    /**
     * Crée une notification normale (non urgente).
     */
    public Notification create(Employe employe, String titre, String message, Demande demande) {
        return save(employe, titre, message, demande, false);
    }

    /**
     * Crée une notification urgente (ex : 3 jours avant fin contrat CIVP).
     * Affichée différemment côté front via le champ urgent = true.
     */
    public Notification createUrgent(Employe employe, String titre, String message, Demande demande) {
        return save(employe, titre, message, demande, true);
    }

    /**
     * Méthode interne commune à create() et createUrgent().
     */
    private Notification save(Employe employe, String titre, String message, Demande demande, boolean urgent) {
        Notification notification = Notification.builder()
                .employe(employe)
                .titre(titre)
                .message(message)
                .demande(demande)
                .dateCreation(LocalDateTime.now())
                .lu(false)
                .urgent(urgent)
                .build();
        return notificationRepository.save(notification);
    }

    /**
     * Toutes les notifications d'un employé (plus récentes en premier).
     */
    public List<NotificationResponse> getByEmploye(Long employeId) {
        return notificationRepository.findByEmployeIdOrderByDateCreationDesc(employeId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Notifications non lues d'un employé.
     */
    public List<NotificationResponse> getUnreadByEmploye(Long employeId) {
        return notificationRepository.findByEmployeIdAndLuFalseOrderByDateCreationDesc(employeId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Nombre de notifications non lues.
     */
    public long countUnread(Long employeId) {
        return notificationRepository.countByEmployeIdAndLuFalse(employeId);
    }

    /**
     * Marquer une notification comme lue.
     */
    public NotificationResponse markAsRead(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification non trouvée"));
        notification.setLu(true);
        notificationRepository.save(notification);
        return toResponse(notification);
    }

    /**
     * Marquer toutes les notifications comme lues.
     */
    public void markAllAsRead(Long employeId) {
        List<Notification> unread = notificationRepository
                .findByEmployeIdAndLuFalseOrderByDateCreationDesc(employeId);
        unread.forEach(n -> n.setLu(true));
        notificationRepository.saveAll(unread);
    }

  private NotificationResponse toResponse(Notification n) {
    return NotificationResponse.builder()
            .id(n.getId())
            .titre(n.getTitre())
            .message(n.getMessage())
            .lu(n.isLu())           
            .urgent(n.isUrgent())
            .dateCreation(n.getDateCreation())
            .demandeId(n.getDemande() != null ? n.getDemande().getId() : null)
            .build();
}
}