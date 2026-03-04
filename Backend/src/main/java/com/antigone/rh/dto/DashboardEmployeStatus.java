package com.antigone.rh.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO pour le dashboard temps réel (envoyé via WebSocket)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardEmployeStatus {
    private Long employeId;
    private String nom;
    private String prenom;
    private String poste;
    private String departement;
    private String statut; // PRESENT, ABSENT, RETARD, EN_CONGE, EN_TELETRAVAIL
    private String heureEntree;
    private String heureSortie;
    private Integer retardMinutes;
    private Double scoreJournalier;
    private Boolean agentActif;
    private String imageUrl;
    /** SSID WiFi actuellement connecté (envoyé par l'agent) */
    private String ssidConnecte;
    /** true si le SSID correspond au réseau entreprise */
    private Boolean surReseauEntreprise;
    /** Temps actif en minutes */
    private Integer tempsActifMinutes;
    /** Temps inactif en minutes */
    private Integer tempsInactifMinutes;
}
