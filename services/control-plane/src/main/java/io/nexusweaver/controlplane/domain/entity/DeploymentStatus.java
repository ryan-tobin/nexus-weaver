/*
 * Nexus Weaver Control Plane
 * Copyright (c) 2024 Nexus Weaver Project
 */

package io.nexusweaver.controlplane.domain.entity;

/**
 * Represents the status of a deployment.
 */
public enum DeploymentStatus {
    /**
     * Deployment is being prepared
     */
    PENDING,
    
    /**
     * Deployment is in progress
     */
    DEPLOYING,
    
    /**
     * Deployment completed successfully
     */
    DEPLOYED,
    
    /**
     * Deployment failed
     */
    FAILED,
    
    /**
     * Deployment is being terminated
     */
    TERMINATING,
    
    /**
     * Deployment has been terminated
     */
    TERMINATED
}