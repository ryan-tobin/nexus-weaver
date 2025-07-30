/*
 * Nexus Weaver Control Plane
 * Copyright (c) 2024 Nexus Weaver Project
 */

package io.nexusweaver.controlplane.repository;

import io.nexusweaver.controlplane.domain.entity.Application;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Repository for Application entities.
 */
@Repository
public interface ApplicationRepository extends JpaRepository<Application, UUID> {
    
    /**
     * Find an application by name.
     *
     * @param name the application name
     * @return the application if found
     */
    Optional<Application> findByName(String name);
}