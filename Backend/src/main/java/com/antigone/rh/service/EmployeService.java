package com.antigone.rh.service;

import com.antigone.rh.dto.EmployeDTO;
import com.antigone.rh.dto.SoldeCongeInfo;
import com.antigone.rh.entity.Conge;
import com.antigone.rh.entity.Employe;
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
import java.util.Random;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class EmployeService {

    private static final Random RANDOM = new Random();

    private final EmployeRepository employeRepository;
    private final CongeRepository congeRepository;
    private final ReferentielRepository referentielRepository;

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

    // =========================================
    // VALIDATION DES CHAMPS EMPLOYÉ
    // =========================================
    private void validateEmploye(EmployeDTO dto, Long existingId) {
        // 1. CIN : obligatoire, exactement 8 chiffres, unique
        if (dto.getCin() == null || dto.getCin().isBlank()) {
            throw new RuntimeException("Le CIN est obligatoire.");
        }
        if (!dto.getCin().matches("^\\d{8}$")) {
            throw new RuntimeException("Le CIN doit contenir exactement 8 chiffres.");
        }
        if (existingId == null) {
            if (employeRepository.existsByCin(dto.getCin())) {
                throw new RuntimeException("Ce CIN existe déjà en base.");
            }
        } else {
            employeRepository.findByCin(dto.getCin()).ifPresent(e -> {
                if (!e.getId().equals(existingId))
                    throw new RuntimeException("Ce CIN existe déjà en base.");
            });
        }

        // 2. CNSS : obligatoire, numérique, 8-12 chiffres, unique
        if (dto.getCnss() == null || dto.getCnss().isBlank()) {
            throw new RuntimeException("Le numéro CNSS est obligatoire.");
        }
        if (!dto.getCnss().matches("^\\d{8,12}$")) {
            throw new RuntimeException("Numéro CNSS invalide (8 à 12 chiffres obligatoires).");
        }
        if (existingId == null) {
            if (employeRepository.existsByCnss(dto.getCnss())) {
                throw new RuntimeException("Ce numéro CNSS existe déjà en base.");
            }
        } else {
            // Check uniqueness excluding self
            employeRepository.findAll().stream()
                    .filter(e -> dto.getCnss().equals(e.getCnss()) && !e.getId().equals(existingId))
                    .findFirst()
                    .ifPresent(e -> {
                        throw new RuntimeException("Ce numéro CNSS existe déjà en base.");
                    });
        }

        // 3. Prénom : obligatoire, lettres/accents/tiret, 2-50 chars
        if (dto.getPrenom() == null || dto.getPrenom().isBlank()) {
            throw new RuntimeException("Le prénom est obligatoire.");
        }
        if (dto.getPrenom().length() < 2 || dto.getPrenom().length() > 50) {
            throw new RuntimeException("Le prénom doit contenir entre 2 et 50 caractères.");
        }
        if (!dto.getPrenom().matches("^[a-zA-ZÀ-ÿ\\u0600-\\u06FF\\s'-]+$")) {
            throw new RuntimeException("Le prénom doit contenir uniquement des lettres.");
        }

        // 4. Nom : obligatoire, lettres/accents/tiret, 2-50 chars
        if (dto.getNom() == null || dto.getNom().isBlank()) {
            throw new RuntimeException("Le nom est obligatoire.");
        }
        if (dto.getNom().length() < 2 || dto.getNom().length() > 50) {
            throw new RuntimeException("Le nom doit contenir entre 2 et 50 caractères.");
        }
        if (!dto.getNom().matches("^[a-zA-ZÀ-ÿ\\u0600-\\u06FF\\s'-]+$")) {
            throw new RuntimeException("Le nom doit contenir uniquement des lettres.");
        }

        // 5. Email : obligatoire, format valide, 5-100 chars, unique
        if (dto.getEmail() == null || dto.getEmail().isBlank()) {
            throw new RuntimeException("L'email est obligatoire.");
        }
        if (dto.getEmail().length() < 5 || dto.getEmail().length() > 100) {
            throw new RuntimeException("L'email doit contenir entre 5 et 100 caractères.");
        }
        if (!dto.getEmail().matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            throw new RuntimeException("Format email invalide.");
        }
        if (existingId == null) {
            if (employeRepository.existsByEmail(dto.getEmail())) {
                throw new RuntimeException("Cet email existe déjà en base.");
            }
        } else {
            employeRepository.findByEmail(dto.getEmail()).ifPresent(e -> {
                if (!e.getId().equals(existingId))
                    throw new RuntimeException("Cet email existe déjà en base.");
            });
        }

        // 6. Téléphone : obligatoire, 8 chiffres, commence par 2/4/5/7/9
        if (dto.getTelephone() == null || dto.getTelephone().isBlank()) {
            throw new RuntimeException("Le téléphone est obligatoire.");
        }
        if (!dto.getTelephone().matches("^[24579]\\d{7}$")) {
            throw new RuntimeException(
                    "Numéro de téléphone tunisien invalide (8 chiffres, commence par 2, 4, 5, 7 ou 9).");
        }

        // 7. RIB Bancaire : obligatoire, exactement 20 chiffres
        if (dto.getRibBancaire() == null || dto.getRibBancaire().isBlank()) {
            throw new RuntimeException("Le RIB bancaire est obligatoire.");
        }
        if (!dto.getRibBancaire().matches("^\\d{20}$")) {
            throw new RuntimeException("RIB invalide (20 chiffres obligatoires).");
        }

        // 8. Genre : obligatoire
        if (dto.getGenre() == null || dto.getGenre().isBlank()) {
            throw new RuntimeException("Le genre est obligatoire.");
        }

        // 9. Département : obligatoire
        if (dto.getDepartement() == null || dto.getDepartement().isBlank()) {
            throw new RuntimeException("Le département est obligatoire.");
        }

        // 10. Poste : obligatoire
        if (dto.getPoste() == null || dto.getPoste().isBlank()) {
            throw new RuntimeException("Le poste est obligatoire.");
        }

        // 11. Type Contrat : obligatoire
        if (dto.getTypeContrat() == null || dto.getTypeContrat().isBlank()) {
            throw new RuntimeException("Le type de contrat est obligatoire.");
        }

        // 12. Date d'embauche : obligatoire, pas future, pas avant 2020
        if (dto.getDateEmbauche() == null) {
            throw new RuntimeException("La date d'embauche est obligatoire.");
        }
        if (dto.getDateEmbauche().isAfter(LocalDate.now())) {
            throw new RuntimeException("La date d'embauche ne peut pas être dans le futur.");
        }
        // 13. Salaire de base : obligatoire, positif, max 99999
        if (dto.getSalaireBase() == null) {
            throw new RuntimeException("Le salaire de base est obligatoire.");
        }
        if (dto.getSalaireBase() < 0) {
            throw new RuntimeException("Le salaire de base doit être positif.");
        }
        if (dto.getSalaireBase() > 99999) {
            throw new RuntimeException("Le salaire de base ne peut pas dépasser 99 999 TND.");
        }

        if (dto.getDateEmbauche().isBefore(LocalDate.of(2020, 1, 1))) {
            throw new RuntimeException("La date d'embauche ne peut pas être avant 2020.");
        }
    }

    public EmployeDTO create(EmployeDTO dto) {
        validateEmploye(dto, null);
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

    /**
     * Génère un matricule unique : 3 premières lettres du département + 4 chiffres
     * aléatoires.
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
        validateEmploye(dto, id);
        Employe employe = employeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employé non trouvé avec l'id: " + id));
        employe.setMatricule(dto.getMatricule());
        employe.setCin(dto.getCin());
        employe.setCnss(dto.getCnss());
        employe.setNom(dto.getNom());
        employe.setPrenom(dto.getPrenom());
        employe.setEmail(dto.getEmail());
        employe.setTelephone(dto.getTelephone());
        employe.setDateEmbauche(dto.getDateEmbauche());
        employe.setPoste(dto.getPoste());
        employe.setTypeContrat(dto.getTypeContrat());
        employe.setGenre(dto.getGenre() != null ? com.antigone.rh.enums.Genre.valueOf(dto.getGenre()) : null);
        employe.setDepartement(dto.getDepartement());
        employe.setRibBancaire(dto.getRibBancaire());
        employe.setSalaireBase(dto.getSalaireBase() != null ? dto.getSalaireBase() : 0.0);
        employe.setImageUrl(dto.getImageUrl());
        if (dto.getManagerId() != null) {
            Employe manager = employeRepository.findById(dto.getManagerId())
                    .orElseThrow(() -> new RuntimeException("Manager non trouvé"));
            employe.setManager(manager);
        } else {
            employe.setManager(null);
        }

        // Solde congé : si l'admin l'a modifié, on garde sa valeur
        if (dto.getSoldeConge() != null) {
            employe.setSoldeConge(dto.getSoldeConge());
        }

        Employe saved = employeRepository.save(employe);

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
     * - Le solde est proratisé selon les mois travaillés dans l'année de congé en
     * cours
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
                    .mapToDouble(c -> c.getJoursOuvrables() != null ? c.getJoursOuvrables()
                            : (c.getNombreJours() != null ? c.getNombreJours() : 0))
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
                .cnss(employe.getCnss())
                .nom(employe.getNom())
                .prenom(employe.getPrenom())
                .email(employe.getEmail())
                .telephone(employe.getTelephone())
                .dateEmbauche(employe.getDateEmbauche())
                .soldeConge(employe.getSoldeConge())
                .poste(employe.getPoste())
                .typeContrat(employe.getTypeContrat())
                .genre(employe.getGenre() != null ? employe.getGenre().name() : null)
                .departement(employe.getDepartement())
                .ribBancaire(employe.getRibBancaire())
                .salaireBase(employe.getSalaireBase())
                .managerId(employe.getManager() != null ? employe.getManager().getId() : null)
                .managerNom(employe.getManager() != null
                        ? employe.getManager().getNom() + " " + employe.getManager().getPrenom()
                        : null)
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
                .dateEmbauche(dto.getDateEmbauche())
                .soldeConge(dto.getSoldeConge() != null ? dto.getSoldeConge() : 30.0)
                .poste(dto.getPoste())
                .typeContrat(dto.getTypeContrat())
                .genre(dto.getGenre() != null ? com.antigone.rh.enums.Genre.valueOf(dto.getGenre()) : null)
                .departement(dto.getDepartement())
                .ribBancaire(dto.getRibBancaire())
                .salaireBase(dto.getSalaireBase() != null ? dto.getSalaireBase() : 0.0)
                .imageUrl(dto.getImageUrl())
                .build();
    }
}
