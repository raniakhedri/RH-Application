package com.antigone.rh.enums;

public enum TypeConge {
    CONGE_PAYE("Congé payé"),
    CONGE_MALADIE("Congé maladie"),
    CONGE_MATERNITE("Congé maternité"),
    CONGE_PATERNITE("Congé paternité"),
    CONGE_SANS_SOLDE("Congé sans solde"),
    CONGE_EXCEPTIONNEL("Congé exceptionnel"),
    CONGE_FORMATION("Congé formation"),
    CONGE_RECUPERATION("Congé récupération"),
    CONGE_ADMINISTRATIF("Congé administratif"),
    CONGE_REGLES("Congé règles"),
    CONGE_DECES_PROCHE("Congé décès (proche)"),
    CONGE_DECES_FAMILLE("Congé décès (famille)");

    private final String label;

    TypeConge(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
