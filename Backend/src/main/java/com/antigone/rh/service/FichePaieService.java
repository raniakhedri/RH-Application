package com.antigone.rh.service;

import com.antigone.rh.dto.FichePaieDTO;
import com.antigone.rh.entity.Employe;
import com.antigone.rh.entity.FichePaie;
import com.antigone.rh.entity.Pointage;
import com.antigone.rh.entity.RapportInactivite;
import com.antigone.rh.enums.DecisionInactivite;
import com.antigone.rh.enums.StatutFichePaie;
import com.antigone.rh.enums.StatutPointage;
import com.antigone.rh.enums.TypeReferentiel;
import com.antigone.rh.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class FichePaieService {

    private final FichePaieRepository fichePaieRepository;
    private final PointageRepository pointageRepository;
    private final EmployeRepository employeRepository;
    private final RapportInactiviteRepository rapportInactiviteRepository;
    private final ReferentielRepository referentielRepository;

    /**
     * Génère les fiches de paie pour tous les employés pour un mois donné
     */
    public List<FichePaieDTO> genererFichesPaieMensuelles(int mois, int annee) {
        List<Employe> employes = employeRepository.findAll();
        List<FichePaieDTO> result = new ArrayList<>();

        for (Employe employe : employes) {
            FichePaieDTO dto = genererFichePaie(employe.getId(), mois, annee);
            if (dto != null) {
                result.add(dto);
            }
        }

        log.info("Fiches de paie générées: {}/{} - {} fiches", mois, annee, result.size());
        return result;
    }

    /**
     * Génère une fiche de paie pour un employé spécifique
     * Si une fiche BROUILLON existe déjà, elle est recalculée avec les données à
     * jour.
     * Si une fiche VALIDEE existe, elle est retournée telle quelle.
     */
    public FichePaieDTO genererFichePaie(Long employeId, int mois, int annee) {
        // Vérifier si déjà générée
        var existante = fichePaieRepository.findByEmployeIdAndMoisAndAnnee(employeId, mois, annee);
        if (existante.isPresent()) {
            FichePaie fp = existante.get();
            if (fp.getStatut() == StatutFichePaie.VALIDEE) {
                log.info("Fiche de paie VALIDEE, pas de recalcul: employé={}, {}/{}", employeId, mois, annee);
                return toDTO(fp);
            }
            // BROUILLON → supprimer pour recalculer avec les données à jour (salaire,
            // pointages...)
            log.info("Fiche BROUILLON existante supprimée pour recalcul: employé={}, {}/{}", employeId, mois, annee);
            fichePaieRepository.delete(fp);
            fichePaieRepository.flush();
        }

        Employe employe = employeRepository.findById(employeId)
                .orElseThrow(() -> new RuntimeException("Employé non trouvé: " + employeId));

        // Récupérer tous les pointages du mois
        YearMonth yearMonth = YearMonth.of(annee, mois);
        LocalDate debut = yearMonth.atDay(1);
        LocalDate fin = yearMonth.atEndOfMonth();

        List<Pointage> pointages = pointageRepository.findByEmployeIdAndDateJourBetween(employeId, debut, fin);

        // Calculs
        int totalRetardMinutes = pointages.stream()
                .mapToInt(p -> p.getRetardMinutes() != null ? p.getRetardMinutes() : 0)
                .sum();

        int totalInactiviteMinutes = pointages.stream()
                .mapToInt(p -> p.getTempsInactifMinutes() != null ? p.getTempsInactifMinutes() : 0)
                .sum();

        int joursPresence = (int) pointages.stream()
                .filter(p -> p.getStatut() == StatutPointage.PRESENT || p.getStatut() == StatutPointage.RETARD)
                .count();

        int joursAbsence = (int) pointages.stream()
                .filter(p -> p.getStatut() == StatutPointage.ABSENT)
                .count();

        double scoreMoyen = pointages.stream()
                .mapToDouble(p -> p.getScoreJournalier() != null ? p.getScoreJournalier() : 0)
                .average()
                .orElse(0.0);

        double salaireBase = employe.getSalaireBase() != null ? employe.getSalaireBase() : 0.0;

        // Pénalité retard = salaireBase / 176h / 60min × totalRetardMinutes
        double montantPenaliteRetard = 0;
        if (salaireBase > 0 && totalRetardMinutes > 0) {
            montantPenaliteRetard = (salaireBase / 176.0 / 60.0) * totalRetardMinutes;
            montantPenaliteRetard = Math.round(montantPenaliteRetard * 100.0) / 100.0;
        }

        // Déduction inactivité = somme des rapports DEDUIT du mois
        double montantDeductionInactivite = rapportInactiviteRepository
                .findByEmployeIdAndSemaineDebutBetween(employeId, debut, fin)
                .stream()
                .filter(r -> r.getDecision() == DecisionInactivite.DEDUIT)
                .mapToDouble(r -> r.getMontantDeduction() != null ? r.getMontantDeduction() : 0)
                .sum();

        double salaireNet = salaireBase - montantPenaliteRetard - montantDeductionInactivite;
        salaireNet = Math.max(0, Math.round(salaireNet * 100.0) / 100.0);

        FichePaie fichePaie = FichePaie.builder()
                .employe(employe)
                .mois(mois)
                .annee(annee)
                .salaireBase(salaireBase)
                .totalRetardMinutes(totalRetardMinutes)
                .montantPenaliteRetard(montantPenaliteRetard)
                .totalInactiviteMinutes(totalInactiviteMinutes)
                .montantDeductionInactivite(montantDeductionInactivite)
                .joursPresence(joursPresence)
                .joursAbsence(joursAbsence)
                .joursConge(0) // TODO: calculer depuis congés approuvés
                .scoreMoyen(Math.round(scoreMoyen * 100.0) / 100.0)
                .salaireNet(salaireNet)
                .statut(StatutFichePaie.BROUILLON)
                .dateGeneration(LocalDateTime.now())
                .build();

        fichePaie = fichePaieRepository.save(fichePaie);
        log.info("Fiche de paie générée: employé={}, {}/{}, net={}", employeId, mois, annee, salaireNet);

        return toDTO(fichePaie);
    }

    /**
     * Valider une fiche de paie (admin)
     */
    public FichePaieDTO validerFichePaie(Long fichePaieId, Long adminEmployeId) {
        FichePaie fichePaie = fichePaieRepository.findById(fichePaieId)
                .orElseThrow(() -> new RuntimeException("Fiche de paie non trouvée: " + fichePaieId));

        Employe admin = employeRepository.findById(adminEmployeId)
                .orElseThrow(() -> new RuntimeException("Admin non trouvé: " + adminEmployeId));

        fichePaie.setStatut(StatutFichePaie.VALIDEE);
        fichePaie.setDateValidation(LocalDateTime.now());
        fichePaie.setValidePar(admin);

        fichePaie = fichePaieRepository.save(fichePaie);
        log.info("Fiche de paie validée: id={}, par={}", fichePaieId, adminEmployeId);

        return toDTO(fichePaie);
    }

    @Transactional(readOnly = true)
    public List<FichePaieDTO> findAll() {
        return fichePaieRepository.findAll().stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public FichePaieDTO findById(Long id) {
        return toDTO(fichePaieRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Fiche de paie non trouvée")));
    }

    @Transactional(readOnly = true)
    public List<FichePaieDTO> findByEmploye(Long employeId) {
        return fichePaieRepository.findByEmployeId(employeId).stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<FichePaieDTO> findByMoisAndAnnee(int mois, int annee) {
        return fichePaieRepository.findByMoisAndAnnee(mois, annee).stream().map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<FichePaieDTO> findByStatut(StatutFichePaie statut) {
        return fichePaieRepository.findByStatut(statut).stream().map(this::toDTO).collect(Collectors.toList());
    }

    private FichePaieDTO toDTO(FichePaie fp) {
        return FichePaieDTO.builder()
                .id(fp.getId())
                .employeId(fp.getEmploye().getId())
                .employeNom(fp.getEmploye().getNom())
                .employePrenom(fp.getEmploye().getPrenom())
                .employeMatricule(fp.getEmploye().getMatricule())
                .mois(fp.getMois())
                .annee(fp.getAnnee())
                .salaireBase(fp.getSalaireBase())
                .totalRetardMinutes(fp.getTotalRetardMinutes())
                .montantPenaliteRetard(fp.getMontantPenaliteRetard())
                .totalInactiviteMinutes(fp.getTotalInactiviteMinutes())
                .montantDeductionInactivite(fp.getMontantDeductionInactivite())
                .joursPresence(fp.getJoursPresence())
                .joursAbsence(fp.getJoursAbsence())
                .joursConge(fp.getJoursConge())
                .scoreMoyen(fp.getScoreMoyen())
                .salaireNet(fp.getSalaireNet())
                .statut(fp.getStatut().name())
                .dateGeneration(fp.getDateGeneration() != null ? fp.getDateGeneration().toString() : null)
                .dateValidation(fp.getDateValidation() != null ? fp.getDateValidation().toString() : null)
                .valideParNom(
                        fp.getValidePar() != null ? fp.getValidePar().getNom() + " " + fp.getValidePar().getPrenom()
                                : null)
                .build();
    }
}
