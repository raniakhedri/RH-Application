package com.antigone.rh.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "media_plan_comments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MediaPlanComment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * The existing MediaPlan row id, null if it's a draft (identified by draftKey)
     */
    @Column(name = "media_plan_id")
    private Long mediaPlanId;

    /** For draft rows (not yet saved to DB), we store their _key */
    @Column(name = "draft_key", length = 100)
    private String draftKey;

    @Column(name = "client_id")
    private Long clientId;

    @Column(name = "month_key", length = 10)
    private String monthKey;

    /** The COLUMNS key e.g. "titre", "inspiration", "texteSurVisuel" */
    @Column(name = "column_key", nullable = false, length = 50)
    private String columnKey;

    @Column(nullable = false, length = 1000)
    private String content;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "auteur_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Employe auteur;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
