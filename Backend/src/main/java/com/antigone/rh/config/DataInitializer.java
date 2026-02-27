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

        createParamIfNotExists("SOLDE_CONGE_ANNUEL", "30",
                "Solde congé annuel par défaut pour chaque employé",
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
