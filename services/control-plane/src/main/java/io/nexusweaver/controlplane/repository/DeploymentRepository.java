/*
 * Nexus Weaver Control Plane
 * Copyright (c) 2024 Nexus Weaver Project
 */

package io.nexusweaver.controlplane.repository;

import io.nexusweaver.controlplane.domain.entity.Deployment;
import io.nexusweaver.controlplane.domain.entity.DeploymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repository for Deployment entities.
 */
@Repository
public interface DeploymentRepository extends JpaRepository<Deployment, UUID> {
    
    /**
     * Find deployments by application ID.
     */
    List<Deployment> findByApplicationId(UUID applicationId);
    
    /**
     * Find deployments by status.
     */
    List<Deployment> findByStatus(DeploymentStatus status);
    
    /**
     * Find deployments by application ID and status.
     */
    List<Deployment> findByApplicationIdAndStatus(UUID applicationId, DeploymentStatus status);
    
    /**
     * Find active deployments (not terminated).
     */
    @Query("SELECT d FROM Deployment d WHERE d.status NOT IN ('TERMINATED', 'FAILED')")
    List<Deployment> findActiveDeployments();
}