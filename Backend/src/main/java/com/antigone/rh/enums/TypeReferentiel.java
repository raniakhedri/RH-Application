package com.antigone.rh.enums;

public enum TypeReferentiel {
    DEPARTEMENT("Département"),
    TYPE_CONTRAT("Type contrat"),
    SITE_ETABLISSEMENT("Site / Établissement"),
    POSTE("Poste"),
    NIVEAU_HIERARCHIQUE("Niveau hiérarchique"),
    TYPE_CONGE("Type congé"),
    TYPE_DEMANDE("Type demande"),
    GENRE("Genre"),
    PARAMETRE_SYSTEME("Paramètre système");
    

    private final String label;

    TypeReferentiel(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
