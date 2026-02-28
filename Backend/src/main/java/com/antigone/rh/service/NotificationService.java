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
     * Create a notification for an employee.
     */
    public Notification create(Employe employe, String titre, String message, Demande demande) {
        Notification notification = Notification.builder()
                .employe(employe)
                .titre(titre)
                .message(message)
                .demande(demande)
                .dateCreation(LocalDateTime.now())
                .lu(false)
                .build();
        return notificationRepository.save(notification);
    }

    /**
     * Get all notifications for an employee (most recent first).
     */
    public List<NotificationResponse> getByEmploye(Long employeId) {
        return notificationRepository.findByEmployeIdOrderByDateCreationDesc(employeId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get unread notifications for an employee.
     */
    public List<NotificationResponse> getUnreadByEmploye(Long employeId) {
        return notificationRepository.findByEmployeIdAndLuFalseOrderByDateCreationDesc(employeId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Count unread notifications.
     */
    public long countUnread(Long employeId) {
        return notificationRepository.countByEmployeIdAndLuFalse(employeId);
    }

    /**
     * Mark a notification as read.
     */
    public NotificationResponse markAsRead(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification non trouvée"));
        notification.setLu(true);
        notificationRepository.save(notification);
        return toResponse(notification);
    }

    /**
     * Mark all notifications as read for an employee.
     */
    public void markAllAsRead(Long employeId) {
        List<Notification> unread = notificationRepository.findByEmployeIdAndLuFalseOrderByDateCreationDesc(employeId);
        unread.forEach(n -> n.setLu(true));
        notificationRepository.saveAll(unread);
    }

    private NotificationResponse toResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .titre(n.getTitre())
                .message(n.getMessage())
                .lu(n.getLu())
                .dateCreation(n.getDateCreation())
                .demandeId(n.getDemande() != null ? n.getDemande().getId() : null)
                .build();
    }
}
