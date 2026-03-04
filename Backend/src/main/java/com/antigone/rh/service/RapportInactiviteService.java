package com.antigone.rh.service;

import com.antigone.rh.dto.RapportInactiviteDTO;
import com.antigone.rh.entity.Employe;
import com.antigone.rh.entity.Pointage;
import com.antigone.rh.entity.RapportInactivite;
import com.antigone.rh.enums.DecisionInactivite;
import com.antigone.rh.enums.TypeReferentiel;
import com.antigone.rh.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
@Slf4j
@Transactional
public class RapportInactiviteService {

    private final RapportInactiviteRepository rapportInactiviteRepository;
    private final PointageRepository pointageRepository;
    private final EmployeRepository employeRepository;
    private final ReferentielRepository referentielRepository;

    /**
     * Génère les rapports d'inactivité hebdomadaires pour tous les employés (appelé
     * chaque vendredi)
     */
    public List<RapportInactiviteDTO> genererRapportsHebdomadaires() {
        LocalDate today = LocalDate.now();
        // Semaine: lundi à vendredi de la semaine courante
        LocalDate lundi = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate vendredi = today.with(TemporalAdjusters.nextOrSame(DayOfWeek.FRIDAY));

        return genererRapportsHebdomadaires(lundi, vendredi);
    }

    public List<RapportInactiviteDTO> genererRapportsHebdomadaires(LocalDate semaineDebut, LocalDate semaineFin) {
        List<Employe> employes = employeRepository.findAll();
        List<RapportInactiviteDTO> result = new ArrayList<>();

        for (Employe employe : employes) {
            // Vérifier si un rapport existe déjà pour cette période
            var existingOpt = rapportInactiviteRepository.findByEmployeIdAndSemaineDebutAndSemaineFin(
                    employe.getId(), semaineDebut, semaineFin);

            // Si le rapport existe et a déjà une décision (DEDUIT ou ANNULE), on ne le touche pas
            if (existingOpt.isPresent() && existingOpt.get().getDecision() != DecisionInactivite.EN_ATTENTE) {
                continue;
            }

            // Pointages de la semaine
            List<Pointage> pointages = pointageRepository.findByEmployeIdAndDateJourBetween(
                    employe.getId(), semaineDebut, semaineFin);

            // Total inactivité (pas de tolérance : chaque minute compte)
            int totalInactivite = pointages.stream()
                    .mapToInt(p -> p.getTempsInactifMinutes() != null ? p.getTempsInactifMinutes() : 0)
                    .sum();

            // Total retard
            int totalRetard = pointages.stream()
                    .mapToInt(p -> p.getRetardMinutes() != null ? p.getRetardMinutes() : 0)
                    .sum();

            // Calculs salaire
            double salaireBase = employe.getSalaireBase() != null ? employe.getSalaireBase() : 0;
            double coutParMinute = salaireBase > 0 ? salaireBase / 176.0 / 60.0 : 0;
            coutParMinute = Math.round(coutParMinute * 10000.0) / 10000.0;

            // Déduction inactivité = coût/min × totalInactivité (pas de tolérance)
            double montantDeductionInactivite = coutParMinute * totalInactivite;
            montantDeductionInactivite = Math.round(montantDeductionInactivite * 100.0) / 100.0;

            // Pénalité retard = coût/min × totalRetard
            double montantRetard = coutParMinute * totalRetard;
            montantRetard = Math.round(montantRetard * 100.0) / 100.0;

            // Salaire net = base - déduction inactivité - pénalité retard
            double salaireNet = salaireBase - montantDeductionInactivite - montantRetard;
            salaireNet = Math.max(0, Math.round(salaireNet * 100.0) / 100.0);

            RapportInactivite rapport;
            if (existingOpt.isPresent()) {
                // Mettre à jour le rapport EN_ATTENTE existant avec les données actuelles
                rapport = existingOpt.get();
                rapport.setSalaireBase(salaireBase);
                rapport.setTotalInactiviteMinutes(totalInactivite);
                rapport.setMontantDeductionInactivite(montantDeductionInactivite);
                rapport.setTotalRetardMinutes(totalRetard);
                rapport.setMontantRetard(montantRetard);
                rapport.setCoutParMinute(coutParMinute);
                rapport.setSalaireNet(salaireNet);
                rapport.setToleranceMinutes(0);
                rapport.setInactiviteExcedentaire(totalInactivite);
                rapport.setMontantDeduction(montantDeductionInactivite);
                rapport.setDateGeneration(LocalDateTime.now());
            } else {
                // Créer un nouveau rapport
                rapport = RapportInactivite.builder()
                        .employe(employe)
                        .semaineDebut(semaineDebut)
                        .semaineFin(semaineFin)
                        .salaireBase(salaireBase)
                        .totalInactiviteMinutes(totalInactivite)
                        .montantDeductionInactivite(montantDeductionInactivite)
                        .totalRetardMinutes(totalRetard)
                        .montantRetard(montantRetard)
                        .coutParMinute(coutParMinute)
                        .salaireNet(salaireNet)
                        .toleranceMinutes(0)
                        .inactiviteExcedentaire(totalInactivite)
                        .montantDeduction(montantDeductionInactivite)
                        .decision(DecisionInactivite.EN_ATTENTE)
                        .dateGeneration(LocalDateTime.now())
                        .build();
            }

            rapport = rapportInactiviteRepository.save(rapport);
            result.add(toDTO(rapport));
        }

        log.info("Rapports hebdomadaires générés/mis à jour: {}-{} - {} rapports", semaineDebut, semaineFin, result.size());
        return result;
    }

    /**
     * Admin décide: DEDUIT ou ANNULE
     */
    public RapportInactiviteDTO decider(Long rapportId, Long adminEmployeId, DecisionInactivite decision,
            String commentaire) {
        RapportInactivite rapport = rapportInactiviteRepository.findById(rapportId)
                .orElseThrow(() -> new RuntimeException("Rapport non trouvé: " + rapportId));

        Employe admin = employeRepository.findById(adminEmployeId)
                .orElseThrow(() -> new RuntimeException("Admin non trouvé: " + adminEmployeId));

        rapport.setDecision(decision);
        rapport.setDateDecision(LocalDateTime.now());
        rapport.setDecidePar(admin);
        rapport.setCommentaire(commentaire);

        rapport = rapportInactiviteRepository.save(rapport);
        log.info("Rapport d'inactivité décidé: id={}, decision={}", rapportId, decision);

        return toDTO(rapport);
    }

    @Transactional(readOnly = true)
    public List<RapportInactiviteDTO> findAll() {
        return rapportInactiviteRepository.findAllByOrderByDateGenerationDesc().stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public RapportInactiviteDTO findById(Long id) {
        return toDTO(rapportInactiviteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Rapport non trouvé")));
    }

    @Transactional(readOnly = true)
    public List<RapportInactiviteDTO> findByEmploye(Long employeId) {
        return rapportInactiviteRepository.findByEmployeId(employeId).stream().map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<RapportInactiviteDTO> findEnAttente() {
        return rapportInactiviteRepository.findByDecisionOrderByDateGenerationDesc(DecisionInactivite.EN_ATTENTE)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    private int getParamInt(String libelle, int defaultValue) {
        return referentielRepository
                .findByLibelleAndTypeReferentiel(libelle, TypeReferentiel.PARAMETRE_SYSTEME)
                .map(r -> {
                    try {
                        return Integer.parseInt(r.getValeur());
                    } catch (Exception e) {
                        return defaultValue;
                    }
                })
                .orElse(defaultValue);
    }

    private RapportInactiviteDTO toDTO(RapportInactivite r) {
        return RapportInactiviteDTO.builder()
                .id(r.getId())
                .employeId(r.getEmploye().getId())
                .employeNom(r.getEmploye().getNom())
                .employePrenom(r.getEmploye().getPrenom())
                .employeMatricule(r.getEmploye().getMatricule())
                .semaineDebut(r.getSemaineDebut().toString())
                .semaineFin(r.getSemaineFin().toString())
                .salaireBase(r.getSalaireBase())
                .totalInactiviteMinutes(r.getTotalInactiviteMinutes())
                .montantDeductionInactivite(r.getMontantDeductionInactivite())
                .totalRetardMinutes(r.getTotalRetardMinutes())
                .montantRetard(r.getMontantRetard())
                .coutParMinute(r.getCoutParMinute())
                .salaireNet(r.getSalaireNet())
                .toleranceMinutes(r.getToleranceMinutes())
                .inactiviteExcedentaire(r.getInactiviteExcedentaire())
                .montantDeduction(r.getMontantDeduction())
                .decision(r.getDecision().name())
                .dateGeneration(r.getDateGeneration() != null ? r.getDateGeneration().toString() : null)
                .dateDecision(r.getDateDecision() != null ? r.getDateDecision().toString() : null)
                .decideParNom(r.getDecidePar() != null ? r.getDecidePar().getNom() + " " + r.getDecidePar().getPrenom()
                        : null)
                .commentaire(r.getCommentaire())
                .build();
    }
}
