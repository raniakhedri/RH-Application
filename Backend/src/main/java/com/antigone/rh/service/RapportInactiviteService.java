package com.antigone.rh.service;

import com.antigone.rh.dto.RapportDecisionRequest;
import com.antigone.rh.dto.RapportInactiviteDTO;
import com.antigone.rh.entity.Employe;
import com.antigone.rh.entity.Pointage;
import com.antigone.rh.entity.RapportInactivite;
import com.antigone.rh.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class RapportInactiviteService {

    private final RapportInactiviteRepository rapportRepository;
    private final HeartbeatRepository heartbeatRepository;
    private final PointageRepository pointageRepository;
    private final EmployeRepository employeRepository;
    private final AgentService agentService;

    /**
     * Récupérer tous les rapports
     */
    public List<RapportInactiviteDTO> getAll() {
        return rapportRepository.findAllByOrderByDateGenerationDesc().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Générer les rapports pour la semaine courante (lundi à dimanche précédent)
     */
    public List<RapportInactiviteDTO> genererSemaineCourante() {
        LocalDate today = LocalDate.now();
        // Semaine précédente : du lundi au vendredi
        LocalDate lundiDernier = today.with(TemporalAdjusters.previous(DayOfWeek.MONDAY));
        LocalDate vendrediDernier = lundiDernier.plusDays(4);

        return genererRapports(lundiDernier, vendrediDernier);
    }

    /**
     * Générer les rapports pour une période donnée
     */
    public List<RapportInactiviteDTO> genererPeriode(LocalDate debut, LocalDate fin) {
        List<RapportInactiviteDTO> allRapports = new ArrayList<>();

        // Découper en semaines (lundi à vendredi)
        LocalDate currentMonday = debut.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        while (!currentMonday.isAfter(fin)) {
            LocalDate currentFriday = currentMonday.plusDays(4);
            if (!currentFriday.isAfter(fin) || currentMonday.isBefore(fin)) {
                LocalDate effectiveFin = currentFriday.isAfter(fin) ? fin : currentFriday;
                allRapports.addAll(genererRapports(currentMonday, effectiveFin));
            }
            currentMonday = currentMonday.plusWeeks(1);
        }

        return allRapports;
    }

    /**
     * Prendre une décision sur un rapport (DEDUIT ou ANNULE)
     */
    public RapportInactiviteDTO decider(Long rapportId, RapportDecisionRequest request) {
        RapportInactivite rapport = rapportRepository.findById(rapportId)
                .orElseThrow(() -> new RuntimeException("Rapport non trouvé: " + rapportId));

        if (!"EN_ATTENTE".equals(rapport.getDecision())) {
            throw new RuntimeException("Ce rapport a déjà été traité.");
        }

        Employe decidePar = employeRepository.findById(request.getDecideParId())
                .orElseThrow(() -> new RuntimeException("Décideur non trouvé: " + request.getDecideParId()));

        rapport.setDecision(request.getDecision());
        rapport.setDecidePar(decidePar);
        rapport.setCommentaire(request.getCommentaire());
        rapport.setDateDecision(LocalDateTime.now());

        rapportRepository.save(rapport);
        return toDTO(rapport);
    }

    // ========================================
    // LOGIQUE DE GENERATION
    // ========================================

    private List<RapportInactiviteDTO> genererRapports(LocalDate semaineDebut, LocalDate semaineFin) {
        List<Employe> employes = employeRepository.findAll();
        List<RapportInactiviteDTO> generated = new ArrayList<>();

        for (Employe employe : employes) {
            // Vérifier si un rapport existe déjà pour cette période et cet employé
            if (rapportRepository.findByEmployeIdAndSemaineDebutAndSemaineFin(
                    employe.getId(), semaineDebut, semaineFin).isPresent()) {
                continue; // Déjà généré
            }

            // Compter les minutes d'inactivité sur toute la semaine
            LocalDateTime start = semaineDebut.atStartOfDay();
            LocalDateTime end = semaineFin.atTime(23, 59, 59);

            long inactiveMinutes = heartbeatRepository.countInactiveMinutes(
                    employe.getId(), start, end);

            // Si aucun heartbeat du tout, l'employé n'avait pas l'agent → on skip
            long totalHeartbeats = heartbeatRepository.countActiveMinutes(employe.getId(), start, end)
                    + inactiveMinutes;
            if (totalHeartbeats == 0)
                continue;

            // Tolérance = 0 (chaque minute compte)
            int toleranceMinutes = 0;
            int inactiviteExcedentaire = (int) Math.max(0, inactiveMinutes - toleranceMinutes);

            // Calculer le retard cumulé sur la période
            List<Pointage> pointages = pointageRepository.findByEmployeIdAndDatePointageBetween(
                    employe.getId(), semaineDebut, semaineFin);
            int retardCumule = pointages.stream()
                    .mapToInt(p -> p.getRetardMinutes() != null ? p.getRetardMinutes() : 0)
                    .sum();

            // Calculer le montant de déduction
            double prixMinute = agentService.calculatePrixMinute(employe);
            double montantDeduction = inactiviteExcedentaire * prixMinute;

            RapportInactivite rapport = RapportInactivite.builder()
                    .employe(employe)
                    .semaineDebut(semaineDebut)
                    .semaineFin(semaineFin)
                    .totalInactiviteMinutes((int) inactiveMinutes)
                    .toleranceMinutes(toleranceMinutes)
                    .inactiviteExcedentaire(inactiviteExcedentaire)
                    .retardCumule(retardCumule)
                    .montantDeduction(montantDeduction)
                    .decision("EN_ATTENTE")
                    .build();

            rapportRepository.save(rapport);
            generated.add(toDTO(rapport));
        }

        return generated;
    }

    // ========================================
    // MAPPING
    // ========================================

    private RapportInactiviteDTO toDTO(RapportInactivite r) {
        String decideParNom = null;
        if (r.getDecidePar() != null) {
            decideParNom = r.getDecidePar().getNom() + " " + r.getDecidePar().getPrenom();
        }

        return RapportInactiviteDTO.builder()
                .id(r.getId())
                .employeId(r.getEmploye().getId())
                .employeNom(r.getEmploye().getNom())
                .employePrenom(r.getEmploye().getPrenom())
                .employeMatricule(r.getEmploye().getMatricule())
                .semaineDebut(r.getSemaineDebut().toString())
                .semaineFin(r.getSemaineFin().toString())
                .totalInactiviteMinutes(r.getTotalInactiviteMinutes())
                .toleranceMinutes(r.getToleranceMinutes())
                .inactiviteExcedentaire(r.getInactiviteExcedentaire())
                .retardCumule(r.getRetardCumule() != null ? r.getRetardCumule() : 0)
                .montantDeduction(r.getMontantDeduction())
                .decision(r.getDecision())
                .decideParNom(decideParNom)
                .commentaire(r.getCommentaire())
                .dateDecision(r.getDateDecision() != null ? r.getDateDecision().toString() : null)
                .dateGeneration(r.getDateGeneration() != null ? r.getDateGeneration().toString() : null)
                .build();
    }
}
