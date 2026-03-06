package com.antigone.rh.service;

import com.antigone.rh.dto.EmployeDTO;
import com.antigone.rh.dto.SoldeCongeInfo;
import com.antigone.rh.entity.Calendrier;
import com.antigone.rh.entity.Conge;
import com.antigone.rh.entity.Employe;
import com.antigone.rh.entity.HoraireTravail;
import com.antigone.rh.entity.Referentiel;
import com.antigone.rh.enums.StatutDemande;
import com.antigone.rh.enums.TypeConge;
import com.antigone.rh.enums.TypeJour;
import com.antigone.rh.enums.TypeReferentiel;
import com.antigone.rh.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.Period;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class EmployeService {

    private final EmployeRepository employeRepository;
    private final ReferentielRepository referentielRepository;
    private final CongeRepository congeRepository;
    private final PointageRepository pointageRepository;
    private final NotificationRepository notificationRepository;
    private final ValidationRepository validationRepository;
    private final TacheRepository tacheRepository;
    private final AffectationHoraireRepository affectationHoraireRepository;
    private final ProjetRepository projetRepository;
    private final EquipeRepository equipeRepository;
    private final CompteRepository compteRepository;
    private final DemandeRepository demandeRepository;
    private final HistoriqueStatutRepository historiqueStatutRepository;
    private final AccessLogRepository accessLogRepository;
    private final PeriodeBloqueeRepository periodeBloqueeRepository;
    private final CalendrierRepository calendrierRepository;
    private final HoraireTravailRepository horaireTravailRepository;

    private static final SecureRandom RANDOM = new SecureRandom();

    // Mapping DayOfWeek → French day names used in HoraireTravail.joursTravail
    private static final Map<DayOfWeek, String> DOW_TO_FRENCH = Map.of(
            DayOfWeek.MONDAY, "LUNDI",
            DayOfWeek.TUESDAY, "MARDI",
            DayOfWeek.WEDNESDAY, "MERCREDI",
            DayOfWeek.THURSDAY, "JEUDI",
            DayOfWeek.FRIDAY, "VENDREDI",
            DayOfWeek.SATURDAY, "SAMEDI",
            DayOfWeek.SUNDAY, "DIMANCHE"
    );

    public List<EmployeDTO> findAll() {
        return employeRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<EmployeDTO> findByRoleName(String roleName) {
        return employeRepository.findByRoleName(roleName).stream()
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
        validateFields(dto);
        Employe employe = toEntity(dto);
        // Auto-generate matricule from département (3 first letters + 4 random digits)
        employe.setMatricule(generateMatricule(dto.getDepartement()));
        if (dto.getManagerId() != null) {
            Employe manager = employeRepository.findById(dto.getManagerId())
                    .orElseThrow(() -> new RuntimeException("Manager non trouvé"));
            employe.setManager(manager);
        }
        Employe saved = employeRepository.save(employe);

        if (Boolean.TRUE.equals(dto.getUseInitialSolde()) && dto.getSoldeCongeInitial() != null) {
            // Solde congé initial saisi manuellement — on ne recalcule pas
            saved.setSoldeCongeInitial(dto.getSoldeCongeInitial());
            saved.setSoldeConge(dto.getSoldeCongeInitial());
            employeRepository.save(saved);
        } else {
            // Auto-calculate solde congé from dateEmbauche
            if (saved.getDateEmbauche() != null) {
                SoldeCongeInfo info = getSoldeCongeInfo(saved.getId());
                saved.setSoldeConge(info.getSoldeDisponible());
                employeRepository.save(saved);
            }
        }

        return toDTO(saved);
    }

    private void validateFields(EmployeDTO dto) {
        if (dto.getCin() != null && !dto.getCin().matches("^[0-9]{8}$")) {
            throw new RuntimeException("Le CIN doit contenir exactement 8 chiffres");
        }
        if (dto.getCnss() != null && !dto.getCnss().matches("^[0-9]{8,12}$")) {
            throw new RuntimeException("Le CNSS doit contenir entre 8 et 12 chiffres");
        }
        if (dto.getRibBancaire() != null && !dto.getRibBancaire().matches("^[0-9]{20}$")) {
            throw new RuntimeException("Le RIB doit contenir exactement 20 chiffres");
        }
        if (dto.getTelephonePro() != null && !dto.getTelephonePro().matches("^[0-9]+$")) {
            throw new RuntimeException("Le téléphone professionnel doit contenir uniquement des chiffres");
        }
    }

    /**
     * Génère un matricule unique : 3 premières lettres du département + 4 chiffres aléatoires.
     * Le matricule sert aussi de login pour se connecter.
     */
    private String generateMatricule(String departement) {
        String prefix;
        if (departement != null && !departement.isEmpty()) {
            String cleaned = departement.toUpperCase().replaceAll("[^A-Z]", "");
            if (cleaned.length() >= 3) {
                prefix = cleaned.substring(0, 3);
            } else {
                prefix = String.format("%-3s", cleaned).replace(' ', 'X');
            }
        } else {
            prefix = "EMP";
        }

        String matricule;
        do {
            int number = 1000 + RANDOM.nextInt(9000); // 4 chiffres
            matricule = prefix + number;
        } while (employeRepository.existsByMatricule(matricule));

        return matricule;
    }

    public EmployeDTO update(Long id, EmployeDTO dto) {
        validateFields(dto);
        Employe employe = employeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employé non trouvé avec l'id: " + id));
        // Le matricule ne change pas (généré automatiquement)
        employe.setCin(dto.getCin());
        employe.setCnss(dto.getCnss());
        employe.setNom(dto.getNom());
        employe.setPrenom(dto.getPrenom());
        employe.setEmail(dto.getEmail());
        employe.setTelephone(dto.getTelephone());
        employe.setTelephonePro(dto.getTelephonePro());
        employe.setSalaire(dto.getSalaire());
        employe.setDateEmbauche(dto.getDateEmbauche());
        employe.setSoldeConge(dto.getSoldeConge());
        employe.setPoste(dto.getPoste());
        employe.setTypeContrat(dto.getTypeContrat());
        employe.setGenre(dto.getGenre() != null ? com.antigone.rh.enums.Genre.valueOf(dto.getGenre()) : null);
        employe.setDepartement(dto.getDepartement());
        employe.setRibBancaire(dto.getRibBancaire());
        employe.setImageUrl(dto.getImageUrl());
        if (dto.getManagerId() != null) {
            Employe manager = employeRepository.findById(dto.getManagerId())
                    .orElseThrow(() -> new RuntimeException("Manager non trouvé"));
            employe.setManager(manager);
        } else {
            employe.setManager(null);
        }

        // Handle initial solde toggle
        if (Boolean.TRUE.equals(dto.getUseInitialSolde()) && dto.getSoldeCongeInitial() != null) {
            employe.setSoldeCongeInitial(dto.getSoldeCongeInitial());
            employe.setSoldeConge(dto.getSoldeCongeInitial());
        } else if (Boolean.FALSE.equals(dto.getUseInitialSolde())) {
            // User unchecked — clear initial balance, re-enable auto-calculation
            employe.setSoldeCongeInitial(null);
        }

        Employe saved = employeRepository.save(employe);

        // Auto-recalculate for employees without initial balance
        if (saved.getSoldeCongeInitial() == null && saved.getDateEmbauche() != null) {
            SoldeCongeInfo info = getSoldeCongeInfo(saved.getId());
            saved.setSoldeConge(info.getSoldeDisponible());
            employeRepository.save(saved);
        }

        return toDTO(saved);
    }

    public void delete(Long id) {
        Employe employe = employeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employé non trouvé avec l'id: " + id));

        // Détacher l'employé des équipes
        for (var equipe : employe.getEquipes()) {
            equipe.getMembres().remove(employe);
        }
        equipeRepository.saveAll(employe.getEquipes());

        // Détacher les subordonnés
        for (Employe sub : employe.getSubordonnes()) {
            sub.setManager(null);
        }

        // Détacher des projets (chef de projet)
        projetRepository.findAll().stream()
                .filter(p -> employe.equals(p.getChefDeProjet()))
                .forEach(p -> p.setChefDeProjet(null));

        // Supprimer les pointages
        pointageRepository.deleteAll(pointageRepository.findByEmployeId(employe.getId()));

        // Détacher les tâches assignées
        tacheRepository.findAll().stream()
                .filter(t -> employe.equals(t.getAssignee()))
                .forEach(t -> t.setAssignee(null));

        // Supprimer les notifications
        notificationRepository.deleteAll(notificationRepository.findByEmployeId(employe.getId()));

        // Supprimer les validations
        validationRepository.deleteAll(validationRepository.findByValidateurId(employe.getId()));

        // Supprimer les affectations horaires
        affectationHoraireRepository.deleteAll(affectationHoraireRepository.findByEmployeId(employe.getId()));

        // Supprimer historique statut lié
        historiqueStatutRepository.deleteAll(historiqueStatutRepository.findByModifieParId(employe.getId()));

        // Détacher des périodes bloquées créées par cet employé
        periodeBloqueeRepository.findAll().stream()
                .filter(p -> employe.equals(p.getCreePar()))
                .forEach(p -> p.setCreePar(null));

        // Supprimer les demandes (cascade supprime validations/historique liés)
        demandeRepository.deleteAll(demandeRepository.findByEmployeId(employe.getId()));

        // Supprimer les access logs et le compte
        if (employe.getCompte() != null) {
            accessLogRepository.deleteAll(
                    accessLogRepository.findByCompteIdOrderByDateAccesDesc(employe.getCompte().getId()));
            compteRepository.delete(employe.getCompte());
        }

        employeRepository.delete(employe);
    }

    public void updateSoldeConge(Long id, Double solde) {
        Employe employe = employeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employé non trouvé"));
        employe.setSoldeConge(solde);
        employeRepository.save(employe);
    }

    public EmployeDTO updateImage(Long id, String imageUrl) {
        Employe employe = employeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employé non trouvé"));
        employe.setImageUrl(imageUrl);
        return toDTO(employeRepository.save(employe));
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
            // Count partial month if >= 15 calendar days
            if (p.getDays() >= 15) {
                moisTravailles++;
            }
        }
        moisTravailles = Math.min(moisTravailles, 12);

        // ── Règlement 7.2.1 : "pour chaque mois travaillé" ──
        // Si un salarié a un congé sans solde couvrant la totalité des jours
        // ouvrables d'un mois, ce mois ne compte pas pour l'acquisition.
        List<Conge> congeSansSoldeApprouves = congeRepository.findOverlappingByTypeCongeAndStatut(
                employeId, TypeConge.CONGE_SANS_SOLDE, StatutDemande.APPROUVEE,
                debutAnneeConge, today.isBefore(finAnneeConge) ? today : finAnneeConge);

        int moisNonTravailles = 0;
        for (int m = 0; m < moisTravailles; m++) {
            LocalDate moisDebut = debutAnneeConge.plusMonths(m);
            LocalDate moisFin = debutAnneeConge.plusMonths(m + 1).minusDays(1);
            if (moisFin.isAfter(today)) moisFin = today;

            int joursOuvMois = countWorkingDaysInPeriod(moisDebut, moisFin);
            if (joursOuvMois == 0) continue;

            // Count congé sans solde working days overlapping this month
            int joursCssDansMois = 0;
            for (Conge css : congeSansSoldeApprouves) {
                LocalDate overlapStart = css.getDateDebut().isBefore(moisDebut) ? moisDebut : css.getDateDebut();
                LocalDate overlapEnd = css.getDateFin().isAfter(moisFin) ? moisFin : css.getDateFin();
                if (!overlapStart.isAfter(overlapEnd)) {
                    joursCssDansMois += countWorkingDaysInPeriod(overlapStart, overlapEnd);
                }
            }

            if (joursCssDansMois >= joursOuvMois) {
                moisNonTravailles++;
            }
        }
        moisTravailles = Math.max(0, moisTravailles - moisNonTravailles);

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

            // For the first year, compute actual months worked (may be < 12)
            int prevMoisTravailles;
            if (prevIsFirstYear) {
                Period pp = Period.between(debutAnneePrecedente, finAnneePrecedente.plusDays(1));
                prevMoisTravailles = Math.min(pp.getYears() * 12 + pp.getMonths() + (pp.getDays() >= 15 ? 1 : 0), 12);
            } else {
                prevMoisTravailles = 12;
            }
            double prevAcquis = Math.min(prevMoisTravailles * prevTaux, prevDroit);

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

        // Consumed congés payés (APPROUVEE) this congé year — use joursOuvrables for consistency
        List<Conge> approuves = congeRepository.findByEmployeIdAndTypeCongeAndStatutAndDateDebutBetween(
                employeId, TypeConge.CONGE_PAYE, StatutDemande.APPROUVEE,
                debutAnneeConge, finAnneeConge);
        double joursConsommes = approuves.stream()
                .mapToDouble(c -> c.getJoursOuvrables() != null && c.getJoursOuvrables() > 0
                        ? c.getJoursOuvrables()
                        : (c.getNombreJours() != null ? c.getNombreJours() : 0))
                .sum();

        // Pending congés payés (EN_ATTENTE) this congé year — use joursOuvrables for consistency
        List<Conge> enAttente = congeRepository.findByEmployeIdAndTypeCongeAndStatutAndDateDebutBetween(
                employeId, TypeConge.CONGE_PAYE, StatutDemande.EN_ATTENTE,
                debutAnneeConge, finAnneeConge);
        double joursEnAttente = enAttente.stream()
                .mapToDouble(c -> c.getJoursOuvrables() != null && c.getJoursOuvrables() > 0
                        ? c.getJoursOuvrables()
                        : (c.getNombreJours() != null ? c.getNombreJours() : 0))
                .sum();

        double soldeDisponible;
        double soldePrevisionnel;

        if (employe.getSoldeCongeInitial() != null) {
            // Solde géré manuellement — on utilise la valeur stockée
            soldeDisponible = employe.getSoldeConge() != null ? employe.getSoldeConge() : 0;
            soldePrevisionnel = Math.max(0, soldeDisponible - joursEnAttente);
        } else {
            soldeDisponible = Math.max(0, joursAcquis - joursConsommes);
            soldePrevisionnel = Math.max(0, joursAcquis - joursConsommes - joursEnAttente);

            // Also update the stored soldeConge to keep it in sync
            employe.setSoldeConge(soldeDisponible);
            employeRepository.save(employe);
        }

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
     * Count working days based on HoraireTravail (not hardcoded Sat/Sun) excluding holidays.
     */
    private int countWorkingDaysInPeriod(LocalDate start, LocalDate end) {
        Set<LocalDate> holidays = calendrierRepository
                .findByTypeJourAndDateJourBetween(TypeJour.FERIE, start, end)
                .stream()
                .map(Calendrier::getDateJour)
                .collect(Collectors.toSet());

        HoraireTravail horaire = getDefaultHoraire();
        Set<String> joursTravail = Arrays.stream(horaire.getJoursTravail().split(","))
                .map(String::trim).map(String::toUpperCase).collect(Collectors.toSet());

        int count = 0;
        LocalDate d = start;
        while (!d.isAfter(end)) {
            String jourFr = DOW_TO_FRENCH.get(d.getDayOfWeek());
            if (joursTravail.contains(jourFr) && !holidays.contains(d)) {
                count++;
            }
            d = d.plusDays(1);
        }
        return count;
    }

    /**
     * Get the default (first) HoraireTravail, or a sensible fallback.
     */
    private HoraireTravail getDefaultHoraire() {
        return horaireTravailRepository.findAll().stream().findFirst()
                .orElseGet(() -> {
                    HoraireTravail fallback = new HoraireTravail();
                    fallback.setNom("Défaut");
                    fallback.setHeureDebut(LocalTime.of(9, 0));
                    fallback.setHeureFin(LocalTime.of(18, 0));
                    fallback.setJoursTravail("LUNDI,MARDI,MERCREDI,JEUDI,VENDREDI");
                    return fallback;
                });
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
                .cnss(employe.getCnss())
                .nom(employe.getNom())
                .prenom(employe.getPrenom())
                .email(employe.getEmail())
                .telephone(employe.getTelephone())
                .telephonePro(employe.getTelephonePro())
                .salaire(employe.getSalaire())
                .dateEmbauche(employe.getDateEmbauche())
                .soldeConge(employe.getSoldeConge())
                .soldeCongeInitial(employe.getSoldeCongeInitial())
                .poste(employe.getPoste())
                .typeContrat(employe.getTypeContrat())
                .genre(employe.getGenre() != null ? employe.getGenre().name() : null)
                .departement(employe.getDepartement())
                .ribBancaire(employe.getRibBancaire())
                .managerId(employe.getManager() != null ? employe.getManager().getId() : null)
                .managerNom(employe.getManager() != null ? employe.getManager().getNom() + " " + employe.getManager().getPrenom() : null)
                .imageUrl(employe.getImageUrl())
                .build();
    }

    private Employe toEntity(EmployeDTO dto) {
        return Employe.builder()
                .matricule(dto.getMatricule())
                .cin(dto.getCin())
                .cnss(dto.getCnss())
                .nom(dto.getNom())
                .prenom(dto.getPrenom())
                .email(dto.getEmail())
                .telephone(dto.getTelephone())
                .telephonePro(dto.getTelephonePro())
                .salaire(dto.getSalaire())
                .dateEmbauche(dto.getDateEmbauche())
                .soldeConge(dto.getSoldeConge() != null ? dto.getSoldeConge() : 0.0)
                .soldeCongeInitial(dto.getSoldeCongeInitial())
                .poste(dto.getPoste())
                .typeContrat(dto.getTypeContrat())
                .genre(dto.getGenre() != null ? com.antigone.rh.enums.Genre.valueOf(dto.getGenre()) : null)
                .departement(dto.getDepartement())
                .ribBancaire(dto.getRibBancaire())
                .imageUrl(dto.getImageUrl())
                .build();
    }
}
