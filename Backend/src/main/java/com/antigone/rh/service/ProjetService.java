package com.antigone.rh.service;

import com.antigone.rh.entity.Projet;
import com.antigone.rh.enums.StatutProjet;
import com.antigone.rh.repository.ProjetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ProjetService {

    private final ProjetRepository projetRepository;

    public List<Projet> findAll() {
        return projetRepository.findAll();
    }

    public Projet findById(Long id) {
        return projetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Projet non trouvé avec l'id: " + id));
    }

    public List<Projet> findByStatut(StatutProjet statut) {
        return projetRepository.findByStatut(statut);
    }

    public Projet create(Projet projet) {
        projet.setStatut(StatutProjet.PLANIFIE);
        return projetRepository.save(projet);
    }

    public Projet update(Long id, Projet projetDetails) {
        Projet projet = findById(id);
        projet.setNom(projetDetails.getNom());
        projet.setDateDebut(projetDetails.getDateDebut());
        projet.setDateFin(projetDetails.getDateFin());
        projet.setStatut(projetDetails.getStatut());
        return projetRepository.save(projet);
    }

    public void delete(Long id) {
        projetRepository.deleteById(id);
    }

    public Projet changeStatut(Long id, StatutProjet statut) {
        Projet projet = findById(id);
        projet.setStatut(statut);
        return projetRepository.save(projet);
    }
}
