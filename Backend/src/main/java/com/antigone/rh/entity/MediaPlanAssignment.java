package com.antigone.rh.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "media_plan_assignments", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "employe_id", "client_id" })
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MediaPlanAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employe_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Employe employe;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Client client;

    @Column(nullable = false, updatable = false)
    private LocalDateTime dateAssignment;

    @PrePersist
    protected void onCreate() {
        this.dateAssignment = LocalDateTime.now();
    }
}
