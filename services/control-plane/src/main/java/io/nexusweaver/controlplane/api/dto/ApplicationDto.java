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
 * DTO for Application information with deployment statistics.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Application information with deployment statistics")
public class ApplicationDto {
    
    @Schema(description = "Application ID")
    private UUID id;
    
    @Schema(description = "Application name")
    private String name;
    
    @Schema(description = "Application description")
    private String description;
    
    @Schema(description = "Total number of deployments")
    private int deploymentCount;
    
    @Schema(description = "Number of active deployments")
    private int activeDeployments;
    
    @Schema(description = "Last deployment timestamp")
    private LocalDateTime lastDeployedAt;
    
    @Schema(description = "Creation timestamp")
    private LocalDateTime createdAt;
    
    @Schema(description = "Last update timestamp")
    private LocalDateTime updatedAt;
    
    @Schema(description = "Languages used in deployments")
    private List<String> languages;
}