package com.antigone.rh.service;

import com.antigone.rh.dto.ProjetDTO;
import com.antigone.rh.dto.ProjetRequest;
import com.antigone.rh.entity.Employe;
import com.antigone.rh.entity.Projet;
import com.antigone.rh.entity.Equipe;
import com.antigone.rh.enums.StatutProjet;
import com.antigone.rh.repository.EmployeRepository;
import com.antigone.rh.repository.ProjetRepository;
import com.antigone.rh.repository.EquipeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ProjetService {

    private final ProjetRepository projetRepository;
    private final EmployeRepository employeRepository;
    private final EquipeRepository equipeRepository;
    private final EmployeService employeService;

    public List<ProjetDTO> findAll() {
        return projetRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public Projet findEntityById(Long id) {
        return projetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Projet non trouvé avec l'id: " + id));
    }

    public ProjetDTO findById(Long id) {
        return toDTO(findEntityById(id));
    }

    public List<ProjetDTO> findByStatut(StatutProjet statut) {
        return projetRepository.findByStatut(statut).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public ProjetDTO create(ProjetRequest request) {
        validateDates(request.getDateDebut(), request.getDateFin(), true);

        Projet projet = new Projet();
        projet.setNom(request.getNom());
        projet.setDateDebut(request.getDateDebut());
        projet.setDateFin(request.getDateFin());
        projet.setStatut(StatutProjet.PLANIFIE);

        // Chef de projet (optional)
        if (request.getChefDeProjetId() != null) {
            Employe chef = employeRepository.findById(request.getChefDeProjetId())
                    .orElseThrow(() -> new RuntimeException(
                            "Chef de projet non trouvé avec l'id: " + request.getChefDeProjetId()));
            projet.setChefDeProjet(chef);
        }

        Projet savedProjet = projetRepository.save(projet);

        // Team assignment (optional, but cannot be already assigned to another project)
        if (request.getEquipeId() != null) {
            Equipe equipe = equipeRepository.findById(request.getEquipeId())
                    .orElseThrow(() -> new RuntimeException("Équipe non trouvée avec l'id: " + request.getEquipeId()));

            // Check if team is already assigned to a DIFFERENT project
            if (equipe.getProjet() != null && !equipe.getProjet().getId().equals(savedProjet.getId())) {
                throw new IllegalArgumentException(
                        "L'équipe \"" + equipe.getNom() + "\" est déjà assignée au projet \""
                                + equipe.getProjet().getNom()
                                + "\". Une équipe ne peut appartenir qu'à un seul projet.");
            }

            equipe.setProjet(savedProjet);
            equipeRepository.save(equipe);
        }

        return toDTO(savedProjet);
    }

    public ProjetDTO update(Long id, ProjetRequest request) {
        validateDates(request.getDateDebut(), request.getDateFin(), false);

        Projet projet = findEntityById(id);
        projet.setNom(request.getNom());
        projet.setDateDebut(request.getDateDebut());
        projet.setDateFin(request.getDateFin());

        if (request.getStatut() != null && !request.getStatut().isBlank()) {
            try {
                projet.setStatut(StatutProjet.valueOf(request.getStatut()));
            } catch (IllegalArgumentException ignored) {
                // Keep existing statut if value is invalid
            }
        }

        // Chef de projet (optional, can be removed by sending null)
        if (request.getChefDeProjetId() != null) {
            Employe chef = employeRepository.findById(request.getChefDeProjetId())
                    .orElseThrow(() -> new RuntimeException(
                            "Chef de projet non trouvé avec l'id: " + request.getChefDeProjetId()));
            projet.setChefDeProjet(chef);
        } else {
            projet.setChefDeProjet(null);
        }

        Projet savedProjet = projetRepository.save(projet);

        // Team assignment (optional, but cannot be already assigned to another project)
        if (request.getEquipeId() != null) {
            Equipe equipe = equipeRepository.findById(request.getEquipeId())
                    .orElseThrow(() -> new RuntimeException("Équipe non trouvée avec l'id: " + request.getEquipeId()));

            // Check if team is already assigned to a DIFFERENT project
            if (equipe.getProjet() != null && !equipe.getProjet().getId().equals(savedProjet.getId())) {
                throw new IllegalArgumentException(
                        "L'équipe \"" + equipe.getNom() + "\" est déjà assignée au projet \""
                                + equipe.getProjet().getNom()
                                + "\". Une équipe ne peut appartenir qu'à un seul projet.");
            }

            equipe.setProjet(savedProjet);
            equipeRepository.save(equipe);
        }

        return toDTO(savedProjet);
    }

    public void delete(Long id) {
        // Unassign all teams first to avoid constraint issues
        List<Equipe> equipes = equipeRepository.findByProjetId(id);
        for (Equipe eq : equipes) {
            eq.setProjet(null);
            equipeRepository.save(eq);
        }
        projetRepository.deleteById(id);
    }

    public ProjetDTO changeStatut(Long id, StatutProjet statut) {
        Projet projet = findEntityById(id);
        projet.setStatut(statut);
        return toDTO(projetRepository.save(projet));
    }

    public ProjetDTO toDTO(Projet projet) {
        // Explicitly query from DB to avoid lazy-loading issues with stale collections
        List<Equipe> equipes = equipeRepository.findByProjetId(projet.getId());
        return ProjetDTO.builder()
                .id(projet.getId())
                .nom(projet.getNom())
                .statut(projet.getStatut())
                .dateDebut(projet.getDateDebut())
                .dateFin(projet.getDateFin())
                .chefDeProjet(projet.getChefDeProjet() != null ? employeService.toDTO(projet.getChefDeProjet()) : null)
                .equipeId(equipes != null && !equipes.isEmpty() ? equipes.get(0).getId() : null)
                .equipeNoms(equipes != null
                        ? equipes.stream().map(Equipe::getNom).collect(Collectors.toList())
                        : Collections.emptyList())
                .build();
    }

    private void validateDates(LocalDate dateDebut, LocalDate dateFin, boolean isNew) {
        if (isNew && dateDebut != null && dateDebut.isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("La date de début doit être aujourd'hui ou plus tard");
        }
        if (dateDebut != null && dateFin != null && !dateFin.isAfter(dateDebut)) {
            throw new IllegalArgumentException("La date de fin doit être après la date de début");
        }
    }
}
