package com.antigone.rh.config;

import com.antigone.rh.entity.Compte;
import com.antigone.rh.entity.Employe;
import com.antigone.rh.entity.Permission;
import com.antigone.rh.entity.Referentiel;
import com.antigone.rh.entity.Role;
import com.antigone.rh.enums.TypeConge;
import com.antigone.rh.enums.TypeReferentiel;
import com.antigone.rh.repository.CompteRepository;
import com.antigone.rh.repository.EmployeRepository;
import com.antigone.rh.repository.PermissionRepository;
import com.antigone.rh.repository.ReferentielRepository;
import com.antigone.rh.repository.RoleRepository;
import com.antigone.rh.service.RoleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final RoleService roleService;
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final ReferentielRepository referentielRepository;
    private final EmployeRepository employeRepository;
    private final CompteRepository compteRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        // 1. Initialisation des permissions et rôles
        initPermissionsAndRoles();

        // 2. Initialisation des paramètres système (référentiels)
        initSystemParameters();

        // 3. Initialisation des types de congé
        initTypeConge();

        // 4. Création du compte admin par défaut
        initDefaultAdmin();
    }

    // ===================== Permissions & Rôles =====================

    private void initPermissionsAndRoles() {
        log.info("Initialisation des permissions...");
        roleService.initPermissions();
        log.info("Permissions initialisées avec succès");

        // Créer le rôle ADMIN avec toutes les permissions s'il n'existe pas
        if (roleRepository.findByNom("ADMIN").isEmpty()) {
            List<Permission> allPermissions = permissionRepository.findAll();
            Role adminRole = Role.builder()
                    .nom("ADMIN")
                    .permissions(new HashSet<>(allPermissions))
                    .build();
            roleRepository.save(adminRole);
            log.info("Rôle ADMIN créé avec toutes les permissions ({})", allPermissions.size());
        } else {
            // Mettre à jour le rôle ADMIN existant pour s'assurer qu'il a toutes les
            // permissions
            Role adminRole = roleRepository.findByNom("ADMIN").get();
            List<Permission> allPermissions = permissionRepository.findAll();
            adminRole.setPermissions(new HashSet<>(allPermissions));
            roleRepository.save(adminRole);
            log.info("Rôle ADMIN mis à jour avec toutes les permissions ({})", allPermissions.size());
        }
    }

    // ===================== Paramètres Système =====================

    private void initSystemParameters() {
        createParamIfNotExists("MAX_AUTORISATION_MINUTES", "120",
                "Nombre maximum de minutes d'autorisation par mois par employé",
                TypeReferentiel.PARAMETRE_SYSTEME);

        // Solde congé basé sur l'ancienneté
        createParamIfNotExists("SOLDE_CONGE_AN1", "18",
                "Solde congé annuel pour la 1ère année (1.5 jours/mois × 12)",
                TypeReferentiel.PARAMETRE_SYSTEME);

        createParamIfNotExists("SOLDE_CONGE_AN2_PLUS", "24",
                "Solde congé annuel à partir de la 2ème année (2 jours/mois × 12)",
                TypeReferentiel.PARAMETRE_SYSTEME);

        createParamIfNotExists("TAUX_MENSUEL_AN1", "1.5",
                "Taux d'acquisition congé mensuel pour la 1ère année",
                TypeReferentiel.PARAMETRE_SYSTEME);

        createParamIfNotExists("TAUX_MENSUEL_AN2_PLUS", "2",
                "Taux d'acquisition congé mensuel à partir de la 2ème année",
                TypeReferentiel.PARAMETRE_SYSTEME);

        createParamIfNotExists("MAX_REPORT_CONGE", "5",
                "Nombre maximum de jours de congé reportables d'une année sur l'autre",
                TypeReferentiel.PARAMETRE_SYSTEME);
    }

    // ===================== Types de Congé =====================

    private void initTypeConge() {
        for (TypeConge tc : TypeConge.values()) {
            createParamIfNotExists(tc.name(), null, tc.getLabel(), TypeReferentiel.TYPE_CONGE);
        }
    }

    private void createParamIfNotExists(String libelle, String valeur, String description, TypeReferentiel type) {
        if (referentielRepository.findByLibelleAndTypeReferentiel(libelle, type).isEmpty()) {
            Referentiel param = Referentiel.builder()
                    .libelle(libelle)
                    .valeur(valeur)
                    .description(description)
                    .typeReferentiel(type)
                    .actif(true)
                    .build();
            referentielRepository.save(param);
            log.info("Référentiel créé: [{}] {} = {}", type, libelle, valeur);
        }
    }

    // ===================== Compte Admin par défaut =====================

    private void initDefaultAdmin() {
        if (compteRepository.existsByUsername("admin")) {
            log.info("Compte admin déjà existant, skip.");
            return;
        }

        // Créer l'employé admin
        Employe adminEmploye = Employe.builder()
                .matricule("ADMIN001")
                .nom("Admin")
                .prenom("System")
                .email("admin@antigone.tn")
                .dateEmbauche(LocalDate.now())
                .poste("Administrateur Système")
                .build();
        adminEmploye = employeRepository.save(adminEmploye);
        log.info("Employé admin créé: {} {}", adminEmploye.getPrenom(), adminEmploye.getNom());

        // Récupérer le rôle ADMIN
        Role adminRole = roleRepository.findByNom("ADMIN")
                .orElseThrow(() -> new RuntimeException("Rôle ADMIN introuvable"));

        // Créer le compte admin (mot de passe: Admin@123)
        Compte adminCompte = Compte.builder()
                .username("admin")
                .passwordHash(passwordEncoder.encode("Admin@123"))
                .enabled(true)
                .mustChangePassword(true)
                .employe(adminEmploye)
                .roles(Set.of(adminRole))
                .build();
        compteRepository.save(adminCompte);
        log.info(
                "Compte admin créé - username: admin, mot de passe: Admin@123 (changement obligatoire à la première connexion)");
    }
}
