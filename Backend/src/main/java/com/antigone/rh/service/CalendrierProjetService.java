package com.antigone.rh.service;

import com.antigone.rh.dto.CalendrierProjetDTO;
import com.antigone.rh.entity.CalendrierProjet;
import com.antigone.rh.entity.Employe;
import com.antigone.rh.repository.CalendrierProjetRepository;
import com.antigone.rh.repository.EmployeRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CalendrierProjetService {

    private final CalendrierProjetRepository repository;
    private final EmployeRepository employeRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;

    public List<CalendrierProjetDTO> getSlotsBetween(LocalDate start, LocalDate end) {
        return repository.findByDateSlotBetween(start, end).stream().map(this::toDTO).collect(Collectors.toList());
    }

    public List<CalendrierProjetDTO> getManagerSlotsBetween(Long managerId, LocalDate start, LocalDate end) {
        return repository.findByManagerIdAndDateSlotBetween(managerId, start, end).stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional
    public CalendrierProjetDTO createBusySlot(CalendrierProjetDTO dto) {
        Employe manager = employeRepository.findById(dto.getManagerId())
                .orElseThrow(() -> new RuntimeException("Manager introuvable"));

        CalendrierProjet slot = CalendrierProjet.builder()
                .dateSlot(dto.getDateSlot())
                .manager(manager)
                .socialManager(null)
                .projectName(dto.getProjectName())
                .urgent(dto.isUrgent())
                .type(CalendrierProjet.SlotType.BUSY)
                .statut(CalendrierProjet.SlotStatus.VALIDE)
                .build();
                
        return toDTO(repository.save(slot));
    }

    @Transactional
    public CalendrierProjetDTO createBookedSlot(CalendrierProjetDTO dto) {
        Employe manager = employeRepository.findById(dto.getManagerId())
                .orElseThrow(() -> new RuntimeException("Manager introuvable"));
        
        Employe socialManager = null;
        if(dto.getSocialManagerId() != null) {
            socialManager = employeRepository.findById(dto.getSocialManagerId()).orElse(null);
        }
        
        CalendrierProjet slot = CalendrierProjet.builder()
                .dateSlot(dto.getDateSlot())
                .manager(manager)
                .socialManager(socialManager)
                .projectName(dto.getProjectName())
                .urgent(dto.isUrgent())
                .type(CalendrierProjet.SlotType.BOOKED)
                .statut(CalendrierProjet.SlotStatus.EN_ATTENTE)
                .build();
                
        slot = repository.save(slot);

        // Envoyer une notification au manager
        String socialManagerName = socialManager != null ? socialManager.getPrenom() + " " + socialManager.getNom() : "Un Social Media Manager";
        String message = socialManagerName + " a planifié le projet '" + dto.getProjectName() + "' le " + dto.getDateSlot() + ". Veuillez valider.";
        if (dto.isUrgent()) {
            notificationService.createUrgent(manager, "PLANIFICATION_PROJET", message, null);
        } else {
            notificationService.create(manager, "PLANIFICATION_PROJET", message, null);
        }
        
        if(dto.isUrgent()) {
            // Optionnel: On peut envoyer un email ici si EmailService est mis à jour
        }
        
        return toDTO(slot);
    }

    @Transactional
    public CalendrierProjetDTO updateSlotStatus(Long id, String newStatus) {
        CalendrierProjet slot = repository.findById(id).orElseThrow(() -> new RuntimeException("Créneau introuvable"));
        slot.setStatut(CalendrierProjet.SlotStatus.valueOf(newStatus));
        
        slot = repository.save(slot);

        if(slot.getSocialManager() != null) {
            String message = "La planification pour le projet '" + slot.getProjectName() + "' a été " + newStatus;
            notificationService.create(slot.getSocialManager(), "REPONSE_PLANIFICATION", message, null);
        }

        return toDTO(slot);
    }

    @Transactional
    public void deleteSlot(Long id) {
        repository.deleteById(id);
    }

    private CalendrierProjetDTO toDTO(CalendrierProjet entity) {
        CalendrierProjetDTO dto = new CalendrierProjetDTO();
        dto.setId(entity.getId());
        dto.setDateSlot(entity.getDateSlot());
        dto.setManagerId(entity.getManager().getId());
        if(entity.getSocialManager() != null) dto.setSocialManagerId(entity.getSocialManager().getId());
        dto.setProjectName(entity.getProjectName());
        dto.setUrgent(entity.isUrgent());
        dto.setType(entity.getType().name());
        dto.setStatut(entity.getStatut().name());
        return dto;
    }
}