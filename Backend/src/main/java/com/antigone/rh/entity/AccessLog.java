package com.antigone.rh.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "access_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccessLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "compte_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Compte compte;

    @Column(nullable = false)
    private LocalDateTime dateAcces;

    private String adresseIp;

    @Column(nullable = false)
    private String action;

    @PrePersist
    protected void onCreate() {
        this.dateAcces = LocalDateTime.now();
    }
}
