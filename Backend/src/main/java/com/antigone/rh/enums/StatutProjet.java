package com.antigone.rh.enums;

public enum StatutProjet {
    PLANIFIE,
    EN_COURS,
    CLOTURE,
    /** Closed with remaining open tasks — forced by admin */
    CLOTURE_INCOMPLET,
    ANNULE
}
