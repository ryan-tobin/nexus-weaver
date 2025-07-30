/*
 * Nexus Weaver Control Plane
 * Copyright (c) 2024 Nexus Weaver Project
 */

package io.nexusweaver.controlplane.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Response DTO for deployment operations.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Deployment response")
public class DeploymentResponse {

    @Schema(description = "Deployment ID")
    private UUID id;

    @Schema(description = "Application ID")
    private UUID applicationId;

    @Schema(description = "Application name")
    private String applicationName;

    @Schema(description = "Deployment version")
    private String version;

    @Schema(description = "Deployment status")
    private String status;

    @Schema(description = "List of services")
    private List<ServiceResponse> services;

    @Schema(description = "Creation timestamp")
    private LocalDateTime createdAt;

    @Schema(description = "Last update timestamp")
    private LocalDateTime updatedAt;

    /**
     * Service response within a deployment.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "Service response")
    public static class ServiceResponse {
        
        @Schema(description = "Service ID")
        private UUID id;

        @Schema(description = "Service name")
        private String name;

        @Schema(description = "Process ID in kernel")
        private String processId;

        @Schema(description = "Node ID where service is running")
        private String nodeId;

        @Schema(description = "Service status")
        private String status;

        @Schema(description = "Service language")
        private String language;

        @Schema(description = "Service port")
        private Integer port;

        @Schema(description = "Memory limit in bytes")
        private Long memoryLimit;

        @Schema(description = "CPU shares")
        private Integer cpuShares;
    }
}