package com.antigone.rh.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "heartbeats")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Heartbeat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employe_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Employe employe;

    @Column(name = "\"timestamp\"", nullable = false)
    private LocalDateTime timestamp;

    private String ipAddress;

    private String ssid;

    @Column(nullable = false)
    private Boolean actif;

    private Boolean surReseauEntreprise;

    @PrePersist
    protected void onCreate() {
        if (this.timestamp == null) {
            this.timestamp = LocalDateTime.now();
        }
    }
}
