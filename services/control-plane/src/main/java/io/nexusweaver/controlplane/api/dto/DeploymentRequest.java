/*
 * Nexus Weaver Control Plane
 * Copyright (c) 2024 Nexus Weaver Project
 */

package io.nexusweaver.controlplane.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * Request DTO for creating a new deployment.
 */

@Data
@Builder 
@NoArgsConstructor
@AllArgsConstructor
@Schema(description="Request to create a new deployment")
public class DeploymentRequest {
    @NotBlank(message="Application name is required")
    @Schema(description="Name of the application", example="my=app")
    private String applicationName;

    @Schema(description="Application description", example="My application")
    private String description;

    @NotBlank
    @Schema(description="Version of the deployment", example = "1.0.0")
    private String version;

    @NotNull(message="Services are required")
    @Schema(description="List of services to deploy")
    private List<ServiceDefinition> services;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description="Service definition")
    public static class ServiceDefinition {
        @NotBlank(message="Service name is required")
        @Schema(description="Name of the service", example="api")
        private String name;

        @NotBlank(message="Language is required")
        @Schema(description="Programming language", example="Python")
        private String language;

        @Schema(description="Service port", example="8000")
        private Integer port;

        @NotBlank(message="Source path is required")
        @Schema(description="Source code path", example="./api")
        private String source;

        @Schema(description="Command to execute", example="python app.py")
        private String command;

        @Schema(description="Environment variables")
        private Map<String, String> environment;

        @Schema(description="Resource limits")
        private ResourceLimits limits;
    }
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description="Resource limits")
    public static class ResourceLimits {
        @Schema(description="Memory limit in bytes", example="536870912")
        private Long memory;

        @Schema(description="CPU shares", example="1024")
        private Integer cpuShares;

        @Schema(description="Maximum number of PIDs", example="1000")
        private Integer pidsLimit;
    }
}