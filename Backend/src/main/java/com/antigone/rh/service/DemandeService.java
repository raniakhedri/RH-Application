package com.antigone.rh.service;

import com.antigone.rh.dto.DemandeRequest;
import com.antigone.rh.dto.DemandeResponse;
import com.antigone.rh.entity.*;
import com.antigone.rh.enums.StatutDemande;
import com.antigone.rh.enums.TypeDemande;
import com.antigone.rh.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class DemandeService {

    private final DemandeRepository demandeRepository;
    private final EmployeRepository employeRepository;
    private final HistoriqueStatutRepository historiqueStatutRepository;

    public List<DemandeResponse> findAll() {
        return demandeRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public DemandeResponse findById(Long id) {
        Demande demande = demandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Demande non trouvée avec l'id: " + id));
        return toResponse(demande);
    }

    public List<DemandeResponse> findByEmploye(Long employeId) {
        return demandeRepository.findByEmployeId(employeId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<DemandeResponse> findByStatut(StatutDemande statut) {
        return demandeRepository.findByStatut(statut).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public DemandeResponse create(DemandeRequest request) {
        Employe employe = employeRepository.findById(request.getEmployeId())
                .orElseThrow(() -> new RuntimeException("Employé non trouvé"));

        Demande demande;

        switch (request.getType()) {
            case CONGE:
                Conge conge = new Conge();
                conge.setDateDebut(request.getDateDebut());
                conge.setDateFin(request.getDateFin());
                demande = conge;
                break;
            case AUTORISATION:
                Autorisation autorisation = new Autorisation();
                autorisation.setDate(request.getDate());
                autorisation.setHeureDebut(request.getHeureDebut());
                autorisation.setHeureFin(request.getHeureFin());
                demande = autorisation;
                break;
            case TELETRAVAIL:
                Teletravail teletravail = new Teletravail();
                teletravail.setDateDebut(request.getDateDebut());
                teletravail.setDateFin(request.getDateFin());
                demande = teletravail;
                break;
            default:
                throw new RuntimeException("Type de demande non supporté: " + request.getType());
        }

        demande.setType(request.getType());
        demande.setStatut(StatutDemande.BROUILLON);
        demande.setDateCreation(LocalDateTime.now());
        demande.setRaison(request.getRaison());
        demande.setEmploye(employe);

        Demande saved = demandeRepository.save(demande);
        return toResponse(saved);
    }

    public DemandeResponse submit(Long demandeId) {
        Demande demande = demandeRepository.findById(demandeId)
                .orElseThrow(() -> new RuntimeException("Demande non trouvée"));

        if (demande.getStatut() != StatutDemande.BROUILLON) {
            throw new RuntimeException("Seules les demandes en brouillon peuvent être soumises");
        }

        StatutDemande ancien = demande.getStatut();
        demande.setStatut(StatutDemande.SOUMISE);
        demandeRepository.save(demande);

        saveHistorique(demande, ancien, StatutDemande.SOUMISE, demande.getEmploye());
        return toResponse(demande);
    }

    public DemandeResponse cancel(Long demandeId) {
        Demande demande = demandeRepository.findById(demandeId)
                .orElseThrow(() -> new RuntimeException("Demande non trouvée"));

        if (demande.getStatut() == StatutDemande.VALIDEE || demande.getStatut() == StatutDemande.ANNULEE) {
            throw new RuntimeException("Impossible d'annuler cette demande");
        }

        StatutDemande ancien = demande.getStatut();
        demande.setStatut(StatutDemande.ANNULEE);
        demandeRepository.save(demande);

        saveHistorique(demande, ancien, StatutDemande.ANNULEE, demande.getEmploye());
        return toResponse(demande);
    }

    public DemandeResponse changeStatut(Long demandeId, StatutDemande nouveauStatut, Long employeId) {
        Demande demande = demandeRepository.findById(demandeId)
                .orElseThrow(() -> new RuntimeException("Demande non trouvée"));
        Employe employe = employeRepository.findById(employeId)
                .orElseThrow(() -> new RuntimeException("Employé non trouvé"));

        StatutDemande ancien = demande.getStatut();
        demande.setStatut(nouveauStatut);
        demandeRepository.save(demande);

        saveHistorique(demande, ancien, nouveauStatut, employe);
        return toResponse(demande);
    }

    private void saveHistorique(Demande demande, StatutDemande ancien, StatutDemande nouveau, Employe employe) {
        HistoriqueStatut historique = HistoriqueStatut.builder()
                .demande(demande)
                .ancienStatut(ancien)
                .nouveauStatut(nouveau)
                .dateChangement(LocalDateTime.now())
                .modifiePar(employe)
                .build();
        historiqueStatutRepository.save(historique);
    }

    public DemandeResponse toResponse(Demande demande) {
        DemandeResponse.DemandeResponseBuilder builder = DemandeResponse.builder()
                .id(demande.getId())
                .type(demande.getType())
                .dateCreation(demande.getDateCreation())
                .statut(demande.getStatut())
                .raison(demande.getRaison())
                .employeId(demande.getEmploye().getId())
                .employeNom(demande.getEmploye().getNom() + " " + demande.getEmploye().getPrenom());

        if (demande instanceof Conge conge) {
            builder.dateDebut(conge.getDateDebut());
            builder.dateFin(conge.getDateFin());
        } else if (demande instanceof Autorisation autorisation) {
            builder.date(autorisation.getDate());
            builder.heureDebut(autorisation.getHeureDebut());
            builder.heureFin(autorisation.getHeureFin());
        } else if (demande instanceof Teletravail teletravail) {
            builder.dateDebut(teletravail.getDateDebut());
            builder.dateFin(teletravail.getDateFin());
        }

        return builder.build();
    }
}
