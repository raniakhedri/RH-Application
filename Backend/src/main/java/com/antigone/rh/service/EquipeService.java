package com.antigone.rh.service;

import com.antigone.rh.entity.Employe;
import com.antigone.rh.entity.Equipe;
import com.antigone.rh.entity.Projet;
import com.antigone.rh.repository.EmployeRepository;
import com.antigone.rh.repository.EquipeRepository;
import com.antigone.rh.repository.ProjetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class EquipeService {

    private final EquipeRepository equipeRepository;
    private final ProjetRepository projetRepository;
    private final EmployeRepository employeRepository;

    public List<Equipe> findAll() {
        return equipeRepository.findAll();
    }

    public Equipe findById(Long id) {
        return equipeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Equipe non trouvée avec l'id: " + id));
    }

    public List<Equipe> findByProjet(Long projetId) {
        return equipeRepository.findByProjetId(projetId);
    }

    public Equipe create(Long projetId, String nom) {
        Projet projet = projetRepository.findById(projetId)
                .orElseThrow(() -> new RuntimeException("Projet non trouvé"));

        Equipe equipe = Equipe.builder()
                .nom(nom)
                .projet(projet)
                .build();

        return equipeRepository.save(equipe);
    }

    public Equipe addMembre(Long equipeId, Long employeId) {
        Equipe equipe = findById(equipeId);
        Employe employe = employeRepository.findById(employeId)
                .orElseThrow(() -> new RuntimeException("Employé non trouvé"));

        equipe.getMembres().add(employe);
        return equipeRepository.save(equipe);
    }

    public Equipe removeMembre(Long equipeId, Long employeId) {
        Equipe equipe = findById(equipeId);
        equipe.getMembres().removeIf(e -> e.getId().equals(employeId));
        return equipeRepository.save(equipe);
    }

    public void delete(Long id) {
        equipeRepository.deleteById(id);
    }
}
