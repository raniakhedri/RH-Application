package com.antigone.rh.service;

import com.antigone.rh.dto.DemandePapierRequest;
import com.antigone.rh.dto.DemandeResponse;
import com.antigone.rh.entity.Demande;
import com.antigone.rh.entity.Employe;
import com.antigone.rh.entity.HistoriqueStatut;
import com.antigone.rh.enums.StatutDemande;
import com.antigone.rh.enums.TypeDemande;
import com.antigone.rh.repository.DemandeRepository;
import com.antigone.rh.repository.EmployeRepository;
import com.antigone.rh.repository.HistoriqueStatutRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class DemandePapierService {

    private final DemandeRepository demandeRepository;
    private final EmployeRepository employeRepository;
    private final HistoriqueStatutRepository historiqueStatutRepository;
    private final DemandeService demandeService; // reuse toResponse mapper
    private final NotificationService notificationService;

    /** Return all ADMINISTRATION demandes */
    public List<DemandeResponse> findAll() {
        return demandeRepository.findAll().stream()
                .filter(d -> d.getType() == TypeDemande.ADMINISTRATION)
                .map(demandeService::toResponse)
                .collect(Collectors.toList());
    }

    /** Return a single ADMINISTRATION demande by id */
    public DemandeResponse findById(Long id) {
        Demande demande = demandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Demande papier non trouvée avec l'id: " + id));
        if (demande.getType() != TypeDemande.ADMINISTRATION) {
            throw new RuntimeException("Cette demande n'est pas une demande papier");
        }
        return demandeService.toResponse(demande);
    }

    /** Create a new ADMINISTRATION demande */
    public DemandeResponse create(DemandePapierRequest request) {
        Employe employe = employeRepository.findById(request.getEmployeId())
                .orElseThrow(() -> new RuntimeException("Employé non trouvé"));

        Demande demande = new Demande();
        demande.setType(TypeDemande.ADMINISTRATION);
        demande.setStatut(StatutDemande.BROUILLON);
        demande.setDateCreation(LocalDateTime.now());
        demande.setRaison(request.getRaison());
        demande.setEmploye(employe);

        Demande saved = demandeRepository.save(demande);
        return demandeService.toResponse(saved);
    }

    /** Accept a demande papier → VALIDEE */
    public DemandeResponse accept(Long id) {
        Demande demande = getAdminDemande(id);

        if (demande.getStatut() == StatutDemande.VALIDEE || demande.getStatut() == StatutDemande.ANNULEE) {
            throw new RuntimeException("Impossible d'accepter cette demande dans son état actuel");
        }

        StatutDemande ancien = demande.getStatut();
        demande.setStatut(StatutDemande.VALIDEE);
        demandeRepository.save(demande);

        saveHistorique(demande, ancien, StatutDemande.VALIDEE, demande.getEmploye());

        // Notify the employee
        notificationService.create(
                demande.getEmploye(),
                "Demande papier acceptée ✓",
                "Votre demande papier a été acceptée.",
                demande);

        return demandeService.toResponse(demande);
    }

    /** Cancel / refuse a demande papier → ANNULEE */
    public DemandeResponse cancel(Long id, String motif) {
        Demande demande = getAdminDemande(id);

        if (demande.getStatut() == StatutDemande.VALIDEE || demande.getStatut() == StatutDemande.ANNULEE) {
            throw new RuntimeException("Impossible d'annuler cette demande");
        }

        StatutDemande ancien = demande.getStatut();
        demande.setStatut(StatutDemande.ANNULEE);
        if (motif != null && !motif.isBlank()) {
            demande.setRaisonAnnulation(motif);
        }
        demandeRepository.save(demande);

        saveHistorique(demande, ancien, StatutDemande.ANNULEE, demande.getEmploye());

        // Notify the employee
        notificationService.create(
                demande.getEmploye(),
                "Demande papier refusée ✗",
                "Votre demande papier a été refusée" + (motif != null && !motif.isBlank() ? " : " + motif : "."),
                demande);

        return demandeService.toResponse(demande);
    }

    // ── helpers ────────────────────────────────────────────────────────────────

    private Demande getAdminDemande(Long id) {
        Demande demande = demandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Demande non trouvée"));
        if (demande.getType() != TypeDemande.ADMINISTRATION) {
            throw new RuntimeException("Cette demande n'est pas une demande papier");
        }
        return demande;
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
}
