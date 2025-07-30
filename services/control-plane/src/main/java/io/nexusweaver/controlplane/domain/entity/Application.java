/*
 * Nexus Weaver Control Plane
 * Copyright (c) 2024 Nexus Weaver Project
 */

package io.nexusweaver.controlplane.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

/**
 * Represents an application managed by Nexus Weaver.
 * An application consists of one or more services that are deployed together.
 */
@Entity
@Table(name = "applications", schema = "nexusweaver")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@ToString(exclude = {"deployments"})
public class Application {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @EqualsAndHashCode.Include
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(name = "user_id")
    private UUID userId;

    @Column(columnDefinition = "TEXT")
    private String description;

    @OneToMany(mappedBy = "application", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private Set<Deployment> deployments = new HashSet<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /**
     * Add a deployment to this application.
     */
    public void addDeployment(Deployment deployment) {
        deployments.add(deployment);
        deployment.setApplication(this);
    }

    /**
     * Remove a deployment from this application.
     */
    public void removeDeployment(Deployment deployment) {
        deployments.remove(deployment);
        deployment.setApplication(null);
    }
}