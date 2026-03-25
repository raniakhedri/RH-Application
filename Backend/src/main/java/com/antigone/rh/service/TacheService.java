package com.antigone.rh.service;

import com.antigone.rh.dto.TacheDetailDTO;
import com.antigone.rh.entity.Employe;
import com.antigone.rh.entity.Projet;
import com.antigone.rh.entity.Tache;
import com.antigone.rh.enums.StatutTache;
import com.antigone.rh.repository.EmployeRepository;
import com.antigone.rh.repository.ProjetRepository;
import com.antigone.rh.repository.TacheRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class TacheService {

    private final TacheRepository tacheRepository;
    private final ProjetRepository projetRepository;
    private final EmployeRepository employeRepository;
    private final NotificationService notificationService;

    public List<Tache> findAll() {
        return tacheRepository.findAll();
    }

    public Tache findById(Long id) {
        return tacheRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tâche non trouvée avec l'id: " + id));
    }

    public List<Tache> findByProjet(Long projetId) {
        return tacheRepository.findByProjetId(projetId);
    }

    public List<Tache> findByAssignee(Long employeId) {
        return tacheRepository.findByAssigneeId(employeId);
    }

    public List<TacheDetailDTO> findDetailByAssignee(Long employeId) {
        List<Tache> taches = tacheRepository.findByAssigneeId(employeId);
        return taches.stream().map(this::toDetailDTO).collect(Collectors.toList());
    }

    public List<Tache> findByProjetAndStatut(Long projetId, StatutTache statut) {
        return tacheRepository.findByProjetIdAndStatut(projetId, statut);
    }

    public Tache create(Long projetId, Tache tache) {
        Projet projet = projetRepository.findById(projetId)
                .orElseThrow(() -> new RuntimeException("Projet non trouvé"));

        tache.setProjet(projet);
        validateTacheDate(tache, projet);
        tache.setStatut(StatutTache.TODO);
        Tache saved = tacheRepository.save(tache);

        // Notify assignee of the new task
        if (saved.getAssignee() != null) {
            notificationService.create(
                    saved.getAssignee(),
                    "Nouvelle tâche assignée",
                    "Une nouvelle tâche \"" + saved.getTitre() + "\" vous a été assignée"
                            + (projet.getNom() != null ? " dans le projet \"" + projet.getNom() + "\"." : "."),
                    null);
        }

        return saved;
    }

    public Tache assign(Long tacheId, Long employeId) {
        Tache tache = findById(tacheId);
        Employe employe = employeRepository.findById(employeId)
                .orElseThrow(() -> new RuntimeException("Employé non trouvé"));

        tache.setAssignee(employe);
        Tache saved = tacheRepository.save(tache);

        // Notify the newly assigned employee
        notificationService.create(
                employe,
                "Nouvelle tâche assignée",
                "La tâche \"" + tache.getTitre() + "\" vous a été assignée.",
                null);

        return saved;
    }

    public Tache changeStatut(Long tacheId, StatutTache statut) {
        Tache tache = findById(tacheId);
        tache.setStatut(statut);
        Tache saved = tacheRepository.save(tache);

        // Notify chef de projet when task is marked as DONE
        if (statut == StatutTache.DONE && tache.getProjet() != null
                && tache.getProjet().getChefDeProjet() != null) {
            Employe chef = tache.getProjet().getChefDeProjet();
            notificationService.create(
                    chef,
                    "Tâche terminée",
                    "La tâche \"" + tache.getTitre() + "\" du projet \""
                            + tache.getProjet().getNom() + "\" a été marquée comme terminée.",
                    null);
        }

        return saved;
    }

    public Tache update(Long id, Tache tacheDetails) {
        Tache tache = findById(id);
        tache.setTitre(tacheDetails.getTitre());
        tache.setDateEcheance(tacheDetails.getDateEcheance());
        if (tacheDetails.getStatut() != null) {
            tache.setStatut(tacheDetails.getStatut());
        }
        validateTacheDate(tache, tache.getProjet());
        return tacheRepository.save(tache);
    }

    private void validateTacheDate(Tache tache, Projet projet) {
        if (tache.getDateEcheance() == null)
            return;
        if (projet.getDateDebut() != null && tache.getDateEcheance().isBefore(projet.getDateDebut())) {
            throw new IllegalArgumentException(
                    "La date de l'échéance ne peut pas être avant la date de début du projet (" + projet.getDateDebut()
                            + ")");
        }
        if (projet.getDateFin() != null && tache.getDateEcheance().isAfter(projet.getDateFin())) {
            throw new IllegalArgumentException("La date de l'échéance ne peut pas être après la date de fin du projet ("
                    + projet.getDateFin() + ")");
        }
    }

    public void delete(Long id) {
        tacheRepository.deleteById(id);
    }

    private TacheDetailDTO toDetailDTO(Tache tache) {
        Projet projet = tache.getProjet();
        String chefNom = null;
        Long chefId = null;
        if (projet != null && projet.getChefDeProjet() != null) {
            Employe chef = projet.getChefDeProjet();
            chefNom = chef.getPrenom() + " " + chef.getNom();
            chefId = chef.getId();
        }

        // Build flat member list: chef first, then selected subordinates
        java.util.List<TacheDetailDTO.MembreInfoDTO> membresProjet = new java.util.ArrayList<>();
        if (projet != null) {
            if (projet.getChefDeProjet() != null) {
                Employe chef = projet.getChefDeProjet();
                membresProjet.add(TacheDetailDTO.MembreInfoDTO.builder()
                        .id(chef.getId()).nom(chef.getNom()).prenom(chef.getPrenom())
                        .telephone(chef.getTelephone()).telephonePro(chef.getTelephonePro())
                        .departement(chef.getDepartement()).email(chef.getEmail())
                        .build());
            }
            for (Employe m : projet.getMembres()) {
                if (membresProjet.stream().anyMatch(x -> x.getId().equals(m.getId())))
                    continue;
                membresProjet.add(TacheDetailDTO.MembreInfoDTO.builder()
                        .id(m.getId()).nom(m.getNom()).prenom(m.getPrenom())
                        .telephone(m.getTelephone()).telephonePro(m.getTelephonePro())
                        .departement(m.getDepartement()).email(m.getEmail())
                        .build());
            }
        }

        return TacheDetailDTO.builder()
                .id(tache.getId())
                .titre(tache.getTitre())
                .statut(tache.getStatut())
                .dateEcheance(tache.getDateEcheance())
                .projetId(projet != null ? projet.getId() : null)
                .projetNom(projet != null ? projet.getNom() : null)
                .projetDateFin(projet != null ? projet.getDateFin() : null)
                .chefDeProjetNom(chefNom)
                .chefDeProjetId(chefId)
                .projetStatut(projet != null ? projet.getStatut() : null)
                .assigneeId(tache.getAssignee() != null ? tache.getAssignee().getId() : null)
                .membresProjet(membresProjet)
                .build();
    }
}
