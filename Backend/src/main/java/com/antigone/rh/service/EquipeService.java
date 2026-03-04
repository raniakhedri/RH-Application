package com.antigone.rh.service;

import com.antigone.rh.dto.EquipeCreateRequest;
import com.antigone.rh.dto.EquipeDTO;
import com.antigone.rh.dto.EmployeDTO;
import com.antigone.rh.entity.Employe;
import com.antigone.rh.entity.Equipe;
import com.antigone.rh.entity.Projet;
import com.antigone.rh.repository.EmployeRepository;
import com.antigone.rh.repository.EquipeRepository;
import com.antigone.rh.repository.ProjetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class EquipeService {

    private final EquipeRepository equipeRepository;
    private final ProjetRepository projetRepository;
    private final EmployeRepository employeRepository;
    private final EmployeService employeService;
    private final NotificationService notificationService;

    public List<EquipeDTO> findAll() {
        return equipeRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public EquipeDTO findById(Long id) {
        Equipe equipe = equipeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Equipe non trouvée avec l'id: " + id));
        return toDTO(equipe);
    }

    public List<EquipeDTO> findByProjet(Long projetId) {
        return equipeRepository.findByProjetId(projetId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public EquipeDTO create(EquipeCreateRequest request) {
        Equipe equipe = new Equipe();
        equipe.setNom(request.getNom());

        if (request.getProjetId() != null) {
            Projet projet = projetRepository.findById(request.getProjetId())
                    .orElseThrow(() -> new RuntimeException("Projet non trouvé: " + request.getProjetId()));
            equipe.setProjet(projet);
        }

        if (request.getMemberIds() != null && !request.getMemberIds().isEmpty()) {
            Set<Employe> membres = request.getMemberIds().stream()
                    .map(id -> employeRepository.findById(id)
                            .orElseThrow(() -> new RuntimeException("Employé non trouvé: " + id)))
                    .collect(Collectors.toSet());
            equipe.setMembres(membres);
        }

        Equipe saved = equipeRepository.save(equipe);

        // Notify newly added members
        if (request.getMemberIds() != null) {
            request.getMemberIds().forEach(membId -> {
                employeRepository.findById(membId)
                        .ifPresent(emp -> notificationService.create(emp, "Ajout à une équipe",
                                "Vous avez été ajouté à l'équipe \"" + saved.getNom() + "\".", null));
            });
        }

        return toDTO(saved);
    }

    public EquipeDTO update(Long id, EquipeCreateRequest request) {
        Equipe equipe = equipeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Equipe non trouvée: " + id));
        equipe.setNom(request.getNom());

        if (request.getProjetId() != null) {
            Projet projet = projetRepository.findById(request.getProjetId())
                    .orElseThrow(() -> new RuntimeException("Projet non trouvé: " + request.getProjetId()));
            equipe.setProjet(projet);
        } else {
            equipe.setProjet(null);
        }

        if (request.getMemberIds() != null) {
            Set<Employe> membres = request.getMemberIds().stream()
                    .map(employeId -> employeRepository.findById(employeId)
                            .orElseThrow(() -> new RuntimeException("Employé non trouvé: " + employeId)))
                    .collect(Collectors.toSet());
            equipe.setMembres(membres);
        }

        Equipe savedEquipe = equipeRepository.save(equipe);

        // Notify newly added members on update
        if (request.getMemberIds() != null) {
            request.getMemberIds().forEach(membId -> {
                employeRepository.findById(membId)
                        .ifPresent(emp -> notificationService.create(emp, "Ajout à une équipe",
                                "Vous avez été ajouté à l'équipe \"" + savedEquipe.getNom() + "\".", null));
            });
        }

        return toDTO(savedEquipe);
    }

    public EquipeDTO addMembre(Long equipeId, Long employeId) {
        Equipe equipe = equipeRepository.findById(equipeId)
                .orElseThrow(() -> new RuntimeException("Equipe non trouvée"));
        Employe employe = employeRepository.findById(employeId)
                .orElseThrow(() -> new RuntimeException("Employé non trouvé"));

        equipe.getMembres().add(employe);
        Equipe saved = equipeRepository.save(equipe);

        // Notify the added member
        notificationService.create(employe, "Ajout à une équipe",
                "Vous avez été ajouté à l'équipe \"" + equipe.getNom() + "\".", null);

        return toDTO(saved);
    }

    public EquipeDTO removeMembre(Long equipeId, Long employeId) {
        Equipe equipe = equipeRepository.findById(equipeId)
                .orElseThrow(() -> new RuntimeException("Equipe non trouvée"));
        equipe.getMembres().removeIf(e -> e.getId().equals(employeId));
        return toDTO(equipeRepository.save(equipe));
    }

    public EquipeDTO assignToProjet(Long equipeId, Long projetId) {
        Equipe equipe = equipeRepository.findById(equipeId)
                .orElseThrow(() -> new RuntimeException("Equipe non trouvée"));
        Projet projet = projetRepository.findById(projetId)
                .orElseThrow(() -> new RuntimeException("Projet non trouvé"));
        equipe.setProjet(projet);
        return toDTO(equipeRepository.save(equipe));
    }

    public List<EmployeDTO> findMembresByProjet(Long projetId) {
        List<Equipe> equipes = equipeRepository.findByProjetId(projetId);
        Set<Employe> allMembers = new LinkedHashSet<>();
        for (Equipe equipe : equipes) {
            allMembers.addAll(equipe.getMembres());
        }
        return allMembers.stream().map(employeService::toDTO).collect(Collectors.toList());
    }

    public void delete(Long id) {
        equipeRepository.deleteById(id);
    }

    public EquipeDTO toDTO(Equipe equipe) {
        return EquipeDTO.builder()
                .id(equipe.getId())
                .nom(equipe.getNom())
                .projetId(equipe.getProjet() != null ? equipe.getProjet().getId() : null)
                .membres(equipe.getMembres() != null ? equipe.getMembres().stream()
                        .map(employeService::toDTO)
                        .collect(Collectors.toList()) : new ArrayList<>())
                .build();
    }
}
