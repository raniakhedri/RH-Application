package com.antigone.rh.entity;

import com.antigone.rh.enums.TypeReactif;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "reactif_intern")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReactifIntern {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TypeReactif type;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String contenu;

    @Column(nullable = false)
    private LocalDateTime dateReactif;

    /**
     * How many times this specific tache/mediaplan has received a reactif
     * (denormalized counter)
     */
    @Column(nullable = false)
    @Builder.Default
    private Integer nombreFois = 1;

    /** The date the task was originally set to done */
    @Column(name = "date_termine_original")
    private LocalDateTime dateTermineOriginal;

    // ── Relations ──────────────────────────────────────────────────────────────

    /** The task this reactif targets (TACHE type) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tache_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Tache tache;

    /**
     * The media plan this reactif targets (MEDIA_PLAN_INTERN / MEDIA_PLAN_EXTERN)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "media_plan_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private MediaPlan mediaPlan;

    /** The manager/admin who wrote this reactif (TACHE or MEDIA_PLAN_INTERN) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Employe manager;

    /** The employee assigned to the task or the creator of the media plan */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employe_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Employe employe;

    /** The client who wrote the reactif (MEDIA_PLAN_EXTERN) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Client client;

    @PrePersist
    protected void onCreate() {
        if (this.dateReactif == null) {
            this.dateReactif = LocalDateTime.now();
        }
    }
}
