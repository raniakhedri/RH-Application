package com.antigone.rh.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "clients")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Client {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nom;

    private String email;

    private String telephone;

    @Column(columnDefinition = "TEXT")
    private String adresse;

    @Column(columnDefinition = "TEXT")
    private String notes;

    // ── Contact principal ──────────────────────────────────────────────────────
    private String contactNom;
    private String contactPoste;
    private String contactEmail;
    private String contactTelephone;

    // ── Credentials du client (login/mdp) ─────────────────────────────────────
    private String loginClient;
    private String passwordClient;

    /**
     * Comma-separated list of page keys the client is allowed to access.
     * Known keys: MEDIA_PLANS, PROJETS, FICHIERS
     * Empty/null means no portal pages are accessible.
     */
    @Column(columnDefinition = "TEXT")
    private String clientPages;

    // ── Legacy fields (kept for backward compat) ──────────────────────────────
    /** Description libre (anciennement utilisé) */
    @Column(columnDefinition = "TEXT")
    private String description;

    /** Responsible person name (free text) */
    private String responsable;

    /** Relative path to the stored file (pdf/png/jpeg) */
    private String filePath;

    /** Original filename as uploaded by the user */
    private String fileName;

    @Column(nullable = false, updatable = false)
    private LocalDateTime dateCreation;

    @PrePersist
    protected void onCreate() {
        this.dateCreation = LocalDateTime.now();
    }
}
