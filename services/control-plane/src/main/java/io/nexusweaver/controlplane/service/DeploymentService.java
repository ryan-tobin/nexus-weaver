/*
 * Nexus Weaver Control Plane
 * Copyright (c) 2024 Nexus Weaver Project
 */

package io.nexusweaver.controlplane.service;

import io.nexusweaver.controlplane.api.dto.DeploymentRequest;
import io.nexusweaver.controlplane.api.dto.DeploymentResponse;

import java.util.List;
import java.util.UUID;

/**
 * Service interface for deployment operations.
 */
public interface DeploymentService {

    /**
     * Create a new deployment.
     *
     * @param request the deployment request
     * @return the created deployment
     */
    DeploymentResponse createDeployment(DeploymentRequest request);

    /**
     * Get a deployment by ID.
     *
     * @param deploymentId the deployment ID
     * @return the deployment
     */
    DeploymentResponse getDeployment(UUID deploymentId);

    /**
     * List all deployments with optional filters.
     *
     * @param applicationId filter by application ID (optional)
     * @param status filter by status (optional)
     * @return list of deployments
     */
    List<DeploymentResponse> listDeployments(UUID applicationId, String status);

    /**
     * Delete a deployment.
     *
     * @param deploymentId the deployment ID
     */
    void deleteDeployment(UUID deploymentId);

    /**
     * Stop a deployment.
     *
     * @param deploymentId the deployment ID
     * @return the updated deployment
     */
    DeploymentResponse stopDeployment(UUID deploymentId);

    /**
     * Start a deployment.
     *
     * @param deploymentId the deployment ID
     * @return the updated deployment
     */
    DeploymentResponse startDeployment(UUID deploymentId);
}