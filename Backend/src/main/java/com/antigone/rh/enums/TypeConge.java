package com.antigone.rh.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum TypeConge {
    CONGE_PAYE("Congé payé"),
    CONGE_MALADIE("Congé maladie"),
    CONGE_MATERNITE("Congé maternité"),
    CONGE_SANS_SOLDE("Congé sans solde"),
    CONGE_EXCEPTIONNEL("Congé exceptionnel"),
    CONGE_REGLES("Congé règles"),
    CONGE_DECES_PROCHE("Congé décès proche"),
    CONGE_DECES_FAMILLE("Congé décès famille");

    private final String label;
}
