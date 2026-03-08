package com.antigone.rh.service;

import com.antigone.rh.dto.CompetenceDTO;
import com.antigone.rh.entity.Competence;
import com.antigone.rh.entity.Employe;
import com.antigone.rh.repository.CompetenceRepository;
import com.antigone.rh.repository.EmployeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class CompetenceService {

    private final CompetenceRepository competenceRepository;
    private final EmployeRepository employeRepository;
    private final NotificationService notificationService;

    public List<CompetenceDTO> findByEmployeId(Long employeId) {
        return competenceRepository.findByEmployeId(employeId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public CompetenceDTO create(CompetenceDTO dto) {
        Employe employe = employeRepository.findById(dto.getEmployeId())
                .orElseThrow(() -> new RuntimeException("Employé non trouvé"));
        if (dto.getNiveau() < 1 || dto.getNiveau() > 5) {
            throw new RuntimeException("Le niveau doit être entre 1 et 5");
        }
        Competence competence = Competence.builder()
                .nom(dto.getNom())
                .categorie(dto.getCategorie())
                .niveau(dto.getNiveau())
                .employe(employe)
                .build();
        CompetenceDTO saved = toDTO(competenceRepository.save(competence));

        notificationService.create(employe,
                "Nouvelle compétence ajoutée",
                "La compétence \"" + dto.getNom() + "\" (niveau " + dto.getNiveau() + "/5)"
                + (dto.getCategorie() != null ? " - Catégorie : " + dto.getCategorie() : "")
                + " a été ajoutée à votre profil.",
                null);

        return saved;
    }

    public CompetenceDTO update(Long id, CompetenceDTO dto) {
        Competence competence = competenceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Compétence non trouvée"));
        if (dto.getNiveau() < 1 || dto.getNiveau() > 5) {
            throw new RuntimeException("Le niveau doit être entre 1 et 5");
        }
        competence.setNom(dto.getNom());
        competence.setCategorie(dto.getCategorie());
        competence.setNiveau(dto.getNiveau());
        CompetenceDTO saved = toDTO(competenceRepository.save(competence));

        notificationService.create(competence.getEmploye(),
                "Compétence modifiée",
                "La compétence \"" + dto.getNom() + "\" a été mise à jour (niveau " + dto.getNiveau() + "/5).",
                null);

        return saved;
    }

    public void delete(Long id) {
        Competence competence = competenceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Compétence non trouvée"));

        notificationService.create(competence.getEmploye(),
                "Compétence supprimée",
                "La compétence \"" + competence.getNom() + "\" a été retirée de votre profil.",
                null);

        competenceRepository.deleteById(id);
    }

    private CompetenceDTO toDTO(Competence c) {
        return CompetenceDTO.builder()
                .id(c.getId())
                .nom(c.getNom())
                .categorie(c.getCategorie())
                .niveau(c.getNiveau())
                .employeId(c.getEmploye().getId())
                .employeNom(c.getEmploye().getNom() + " " + c.getEmploye().getPrenom())
                .build();
    }
}
