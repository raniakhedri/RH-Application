package com.antigone.rh.config;

import com.antigone.rh.entity.Referentiel;
import com.antigone.rh.enums.TypeConge;
import com.antigone.rh.enums.TypeReferentiel;
import com.antigone.rh.repository.ReferentielRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final ReferentielRepository referentielRepository;

    @Override
    public void run(String... args) {
        initSystemParameters();
        initTypeConge();
    }

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

        // Horaires de l'entreprise (communs à tous les employés)
        createParamIfNotExists("HEURE_DEBUT_TRAVAIL", "08:00",
                "Heure de début de travail de l'entreprise",
                TypeReferentiel.PARAMETRE_SYSTEME);

        createParamIfNotExists("HEURE_FIN_TRAVAIL", "18:00",
                "Heure de fin de travail de l'entreprise",
                TypeReferentiel.PARAMETRE_SYSTEME);

        createParamIfNotExists("JOURS_TRAVAIL", "LUNDI,MARDI,MERCREDI,JEUDI,VENDREDI",
                "Jours de travail de l'entreprise (séparés par des virgules)",
                TypeReferentiel.PARAMETRE_SYSTEME);
    }

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
}
