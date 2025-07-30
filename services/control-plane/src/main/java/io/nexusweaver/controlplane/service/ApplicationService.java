/*
 * Nexus Weaver Control Plane
 * Copyright (c) 2024 Nexus Weaver Project
 */

package io.nexusweaver.controlplane.service;

import io.nexusweaver.controlplane.api.dto.ApplicationDto;

import java.util.List;
import java.util.UUID;

/**
 * Service interface for application operations.
 */
public interface ApplicationService {
    
    /**
     * Get all applications with deployment statistics.
     *
     * @return list of applications
     */
    List<ApplicationDto> getAllApplications();
    
    /**
     * Get an application by ID.
     *
     * @param id the application ID
     * @return the application
     */
    ApplicationDto getApplication(UUID id);
    
    /**
     * Delete an application and all its deployments.
     *
     * @param id the application ID
     */
    void deleteApplication(UUID id);
}