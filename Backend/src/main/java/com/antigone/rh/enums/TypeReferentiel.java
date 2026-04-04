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
    PARAMETRE_SYSTEME("Paramètre système"),
    FORMAT_MEDIA_PLAN("Format Media Plan"),
    TYPE_MEDIA_PLAN("Type Media Plan"),
    PLATFORME_MEDIA_PLAN("Platforme Media Plan");

    private final String label;

    TypeReferentiel(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
