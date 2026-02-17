package com.antigone.rh.service;

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

@Service
@RequiredArgsConstructor
@Transactional
public class TacheService {

    private final TacheRepository tacheRepository;
    private final ProjetRepository projetRepository;
    private final EmployeRepository employeRepository;

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

    public List<Tache> findByProjetAndStatut(Long projetId, StatutTache statut) {
        return tacheRepository.findByProjetIdAndStatut(projetId, statut);
    }

    public Tache create(Long projetId, Tache tache) {
        Projet projet = projetRepository.findById(projetId)
                .orElseThrow(() -> new RuntimeException("Projet non trouvé"));

        tache.setProjet(projet);
        tache.setStatut(StatutTache.TODO);
        return tacheRepository.save(tache);
    }

    public Tache assign(Long tacheId, Long employeId) {
        Tache tache = findById(tacheId);
        Employe employe = employeRepository.findById(employeId)
                .orElseThrow(() -> new RuntimeException("Employé non trouvé"));

        tache.setAssignee(employe);
        return tacheRepository.save(tache);
    }

    public Tache changeStatut(Long tacheId, StatutTache statut) {
        Tache tache = findById(tacheId);
        tache.setStatut(statut);
        return tacheRepository.save(tache);
    }

    public Tache update(Long id, Tache tacheDetails) {
        Tache tache = findById(id);
        tache.setTitre(tacheDetails.getTitre());
        tache.setDateEcheance(tacheDetails.getDateEcheance());
        if (tacheDetails.getStatut() != null) {
            tache.setStatut(tacheDetails.getStatut());
        }
        return tacheRepository.save(tache);
    }

    public void delete(Long id) {
        tacheRepository.deleteById(id);
    }
}
