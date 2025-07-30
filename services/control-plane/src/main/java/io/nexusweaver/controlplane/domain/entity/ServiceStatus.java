/*
 * Nexus Weaver Control Plane
 * Copyright (c) 2024 Nexus Weaver Project
 */

package io.nexusweaver.controlplane.domain.entity;

/**
 * Represents the status of a service.
 */
public enum ServiceStatus {
    /**
     * Service is being initialized
     */
    INIT,
    
    /**
     * Service is starting
     */
    STARTING,
    
    /**
     * Service is running
     */
    RUNNING,
    
    /**
     * Service is stopping
     */
    STOPPING,
    
    /**
     * Service is stopped
     */
    STOPPED,
    
    /**
     * Service has failed
     */
    FAILED,
    
    /**
     * Service has been terminated
     */
    TERMINATED
}