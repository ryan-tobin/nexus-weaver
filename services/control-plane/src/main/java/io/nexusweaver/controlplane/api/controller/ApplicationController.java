/*
 * Nexus Weaver Control Plane
 * Copyright (c) 2024 Nexus Weaver Project
 */

package io.nexusweaver.controlplane.api.controller;

import io.nexusweaver.controlplane.api.dto.ApplicationDto;
import io.nexusweaver.controlplane.service.ApplicationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST controller for managing applications.
 */
@RestController
@RequestMapping("/api/v1/applications")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Applications", description = "Application management endpoints")
public class ApplicationController {
    
    private final ApplicationService applicationService;
    
    @GetMapping
    @Operation(summary = "Get all applications", description = "Returns a list of all applications with their deployment statistics")
    @ApiResponse(responseCode = "200", description = "List of applications")
    public ResponseEntity<List<ApplicationDto>> getAllApplications() {
        log.info("Fetching all applications");
        try {
            List<ApplicationDto> applications = applicationService.getAllApplications();
            return ResponseEntity.ok(applications);
        } catch (Exception e) {
            log.error("Error fetching applications", e);
            throw e;
        }
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "Get application by ID", description = "Returns details of a specific application")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Application found"),
        @ApiResponse(responseCode = "404", description = "Application not found")
    })
    public ResponseEntity<ApplicationDto> getApplication(
            @Parameter(description = "Application ID") @PathVariable UUID id) {
        log.info("Fetching application with id: {}", id);
        ApplicationDto application = applicationService.getApplication(id);
        return ResponseEntity.ok(application);
    }
    
    @DeleteMapping("/{id}")
    @Operation(summary = "Delete application", description = "Deletes an application and all its deployments")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Application deleted successfully"),
        @ApiResponse(responseCode = "404", description = "Application not found")
    })
    public ResponseEntity<Void> deleteApplication(
            @Parameter(description = "Application ID") @PathVariable UUID id) {
        log.info("Deleting application with id: {}", id);
        applicationService.deleteApplication(id);
        return ResponseEntity.noContent().build();
    }
}