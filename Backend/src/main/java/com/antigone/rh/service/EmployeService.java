package com.antigone.rh.service;

import com.antigone.rh.dto.EmployeDTO;
import com.antigone.rh.dto.SoldeCongeInfo;
import com.antigone.rh.entity.Conge;
import com.antigone.rh.entity.Employe;
import com.antigone.rh.entity.Referentiel;
import com.antigone.rh.enums.Sexe;
import com.antigone.rh.enums.StatutDemande;
import com.antigone.rh.enums.TypeConge;
import com.antigone.rh.enums.TypeReferentiel;
import com.antigone.rh.repository.CongeRepository;
import com.antigone.rh.repository.EmployeRepository;
import com.antigone.rh.repository.ReferentielRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.Period;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class EmployeService {

    private final EmployeRepository employeRepository;
    private final ReferentielRepository referentielRepository;
    private final CongeRepository congeRepository;

    public List<EmployeDTO> findAll() {
        return employeRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public EmployeDTO findById(Long id) {
        Employe employe = employeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employé non trouvé avec l'id: " + id));
        return toDTO(employe);
    }

    public EmployeDTO findByMatricule(String matricule) {
        Employe employe = employeRepository.findByMatricule(matricule)
                .orElseThrow(() -> new RuntimeException("Employé non trouvé avec le matricule: " + matricule));
        return toDTO(employe);
    }

    public EmployeDTO findByEmail(String email) {
        Employe employe = employeRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Employé non trouvé avec l'email: " + email));
        return toDTO(employe);
    }

    public List<EmployeDTO> findSubordinates(Long managerId) {
        return employeRepository.findByManagerId(managerId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public EmployeDTO create(EmployeDTO dto) {
        Employe employe = toEntity(dto);
        if (dto.getManagerId() != null) {
            Employe manager = employeRepository.findById(dto.getManagerId())
                    .orElseThrow(() -> new RuntimeException("Manager non trouvé"));
            employe.setManager(manager);
        }
        Employe saved = employeRepository.save(employe);

        // Auto-calculate solde congé from dateEmbauche
        if (saved.getDateEmbauche() != null) {
            SoldeCongeInfo info = getSoldeCongeInfo(saved.getId());
            saved.setSoldeConge(info.getSoldeDisponible());
            employeRepository.save(saved);
        }

        return toDTO(saved);
    }

    public EmployeDTO update(Long id, EmployeDTO dto) {
        Employe employe = employeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employé non trouvé avec l'id: " + id));
        employe.setMatricule(dto.getMatricule());
        employe.setCin(dto.getCin());
        employe.setNom(dto.getNom());
        employe.setPrenom(dto.getPrenom());
        employe.setEmail(dto.getEmail());
        employe.setTelephone(dto.getTelephone());
        employe.setDateEmbauche(dto.getDateEmbauche());
        // Don't override soldeConge manually — it's auto-computed from dateEmbauche
        if (dto.getSexe() != null) {
            employe.setSexe(Sexe.valueOf(dto.getSexe()));
        } else {
            employe.setSexe(null);
        }
        if (dto.getManagerId() != null) {
            Employe manager = employeRepository.findById(dto.getManagerId())
                    .orElseThrow(() -> new RuntimeException("Manager non trouvé"));
            employe.setManager(manager);
        } else {
            employe.setManager(null);
        }
        Employe saved = employeRepository.save(employe);

        // Recalculate solde from dateEmbauche
        if (saved.getDateEmbauche() != null) {
            SoldeCongeInfo info = getSoldeCongeInfo(saved.getId());
            saved.setSoldeConge(info.getSoldeDisponible());
            employeRepository.save(saved);
        }

        return toDTO(saved);
    }

    public void delete(Long id) {
        if (!employeRepository.existsById(id)) {
            throw new RuntimeException("Employé non trouvé avec l'id: " + id);
        }
        employeRepository.deleteById(id);
    }

    public void updateSoldeConge(Long id, Double solde) {
        Employe employe = employeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employé non trouvé"));
        employe.setSoldeConge(solde);
        employeRepository.save(employe);
    }

    // =========================================
    // SOLDE CONGÉ — CALCUL BASÉ SUR L'ANCIENNETÉ
    // =========================================

    /**
     * Compute solde congé info dynamically from dateEmbauche.
     *
     * Rules:
     * - 1ère année : 18 jours/an (1.5 jours/mois)
     * - À partir de la 2ème année : 24 jours/an (2 jours/mois)
     * - Le solde est proratisé selon les mois travaillés dans l'année de congé en cours
     * - L'année de congé va d'anniversaire d'embauche à anniversaire d'embauche
     */
    public SoldeCongeInfo getSoldeCongeInfo(Long employeId) {
        Employe employe = employeRepository.findById(employeId)
                .orElseThrow(() -> new RuntimeException("Employé non trouvé"));

        if (employe.getDateEmbauche() == null) {
            return SoldeCongeInfo.builder()
                    .employeId(employe.getId())
                    .employeNom(employe.getNom() + " " + employe.getPrenom())
                    .soldeDisponible(employe.getSoldeConge() != null ? employe.getSoldeConge() : 0)
                    .build();
        }

        LocalDate today = LocalDate.now();
        LocalDate dateEmbauche = employe.getDateEmbauche();

        // Compute seniority
        Period anciennete = Period.between(dateEmbauche, today);
        int ancienneteAnnees = anciennete.getYears();
        int ancienneteMois = anciennete.getYears() * 12 + anciennete.getMonths();

        // Get rates from referentiels
        double droitAn1 = getRefValue("SOLDE_CONGE_AN1", 18.0);
        double droitAn2Plus = getRefValue("SOLDE_CONGE_AN2_PLUS", 24.0);
        double tauxAn1 = getRefValue("TAUX_MENSUEL_AN1", 1.5);
        double tauxAn2Plus = getRefValue("TAUX_MENSUEL_AN2_PLUS", 2.0);

        // Determine current congé year boundaries (anniversary-based)
        LocalDate debutAnneeConge;
        LocalDate finAnneeConge;
        if (ancienneteAnnees < 1) {
            debutAnneeConge = dateEmbauche;
            finAnneeConge = dateEmbauche.plusYears(1).minusDays(1);
        } else {
            debutAnneeConge = dateEmbauche.plusYears(ancienneteAnnees);
            finAnneeConge = debutAnneeConge.plusYears(1).minusDays(1);
        }

        // Determine rate and annual right
        boolean isFirstYear = ancienneteAnnees < 1;
        double droitAnnuel = isFirstYear ? droitAn1 : droitAn2Plus;
        double tauxMensuel = isFirstYear ? tauxAn1 : tauxAn2Plus;

        // Months worked in current congé year
        int moisTravailles;
        if (today.isBefore(debutAnneeConge)) {
            moisTravailles = 0;
        } else {
            Period p = Period.between(debutAnneeConge, today);
            moisTravailles = p.getYears() * 12 + p.getMonths();
            // Count partial month if > 15 days worked
            if (p.getDays() >= 15) {
                moisTravailles++;
            }
        }
        moisTravailles = Math.min(moisTravailles, 12);

        // Days acquired this year
        double joursAcquis = Math.min(moisTravailles * tauxMensuel, droitAnnuel);

        // ── Carry-over from previous year (max MAX_REPORT_CONGE) ──
        double joursReportes = 0;
        double maxReport = getRefValue("MAX_REPORT_CONGE", 5.0);
        if (ancienneteAnnees >= 1) {
            // Previous congé year boundaries
            LocalDate debutAnneePrecedente = dateEmbauche.plusYears(ancienneteAnnees - 1);
            LocalDate finAnneePrecedente = debutAnneePrecedente.plusYears(1).minusDays(1);

            // Rate for previous year
            boolean prevIsFirstYear = (ancienneteAnnees - 1) < 1;
            double prevDroit = prevIsFirstYear ? droitAn1 : droitAn2Plus;
            double prevTaux = prevIsFirstYear ? tauxAn1 : tauxAn2Plus;
            double prevAcquis = prevDroit; // full 12 months

            // Consumed in previous year
            List<Conge> prevApprouves = congeRepository.findByEmployeIdAndTypeCongeAndStatutAndDateDebutBetween(
                    employeId, TypeConge.CONGE_PAYE, StatutDemande.APPROUVEE,
                    debutAnneePrecedente, finAnneePrecedente);
            double prevConsommes = prevApprouves.stream()
                    .mapToDouble(c -> c.getJoursOuvrables() != null ? c.getJoursOuvrables() : (c.getNombreJours() != null ? c.getNombreJours() : 0))
                    .sum();

            double reliquat = Math.max(0, prevAcquis - prevConsommes);
            joursReportes = Math.min(reliquat, maxReport);
        }

        // Total available = acquired this year + carry-over - consumed this year
        joursAcquis += joursReportes;

        // Consumed congés payés (APPROUVEE) this congé year
        List<Conge> approuves = congeRepository.findByEmployeIdAndTypeCongeAndStatutAndDateDebutBetween(
                employeId, TypeConge.CONGE_PAYE, StatutDemande.APPROUVEE,
                debutAnneeConge, finAnneeConge);
        double joursConsommes = approuves.stream()
                .mapToDouble(c -> c.getNombreJours() != null ? c.getNombreJours() : 0)
                .sum();

        // Pending congés payés (EN_ATTENTE) this congé year
        List<Conge> enAttente = congeRepository.findByEmployeIdAndTypeCongeAndStatutAndDateDebutBetween(
                employeId, TypeConge.CONGE_PAYE, StatutDemande.EN_ATTENTE,
                debutAnneeConge, finAnneeConge);
        double joursEnAttente = enAttente.stream()
                .mapToDouble(c -> c.getNombreJours() != null ? c.getNombreJours() : 0)
                .sum();

        double soldeDisponible = Math.max(0, joursAcquis - joursConsommes);
        double soldePrevisionnel = Math.max(0, joursAcquis - joursConsommes - joursEnAttente);

        // Also update the stored soldeConge to keep it in sync
        employe.setSoldeConge(soldeDisponible);
        employeRepository.save(employe);

        return SoldeCongeInfo.builder()
                .employeId(employe.getId())
                .employeNom(employe.getNom() + " " + employe.getPrenom())
                .dateEmbauche(dateEmbauche)
                .ancienneteAnnees(ancienneteAnnees)
                .ancienneteMois(ancienneteMois)
                .droitAnnuel(droitAnnuel)
                .tauxMensuel(tauxMensuel)
                .joursAcquis(joursAcquis)
                .moisTravaillesAnneeEnCours(moisTravailles)
                .joursReportes(joursReportes)
                .joursConsommes(joursConsommes)
                .joursEnAttente(joursEnAttente)
                .soldeDisponible(soldeDisponible)
                .soldePrevisionnel(soldePrevisionnel)
                .debutAnneeConge(debutAnneeConge)
                .finAnneeConge(finAnneeConge)
                .build();
    }

    /**
     * Get a double value from referentiels by libelle.
     */
    private double getRefValue(String libelle, double defaultValue) {
        return referentielRepository
                .findByLibelleAndTypeReferentiel(libelle, TypeReferentiel.PARAMETRE_SYSTEME)
                .map(ref -> {
                    try {
                        return Double.parseDouble(ref.getValeur());
                    } catch (NumberFormatException e) {
                        return defaultValue;
                    }
                })
                .orElse(defaultValue);
    }

    public EmployeDTO toDTO(Employe employe) {
        return EmployeDTO.builder()
                .id(employe.getId())
                .matricule(employe.getMatricule())
                .cin(employe.getCin())
                .nom(employe.getNom())
                .prenom(employe.getPrenom())
                .email(employe.getEmail())
                .telephone(employe.getTelephone())
                .dateEmbauche(employe.getDateEmbauche())
                .soldeConge(employe.getSoldeConge())
                .sexe(employe.getSexe() != null ? employe.getSexe().name() : null)
                .managerId(employe.getManager() != null ? employe.getManager().getId() : null)
                .managerNom(employe.getManager() != null ? employe.getManager().getNom() + " " + employe.getManager().getPrenom() : null)
                .build();
    }

    private Employe toEntity(EmployeDTO dto) {
        return Employe.builder()
                .matricule(dto.getMatricule())
                .cin(dto.getCin())
                .nom(dto.getNom())
                .prenom(dto.getPrenom())
                .email(dto.getEmail())
                .telephone(dto.getTelephone())
                .dateEmbauche(dto.getDateEmbauche())
                .soldeConge(dto.getSoldeConge() != null ? dto.getSoldeConge() : 0.0)
                .sexe(dto.getSexe() != null ? Sexe.valueOf(dto.getSexe()) : null)
                .build();
    }
}
