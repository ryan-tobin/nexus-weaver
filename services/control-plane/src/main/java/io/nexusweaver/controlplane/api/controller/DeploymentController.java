/*
 * Nexus Weaver Control Plane
 * Copyright (c) 2024 Nexus Weaver Project
 */

package io.nexusweaver.controlplane.api.controller;

import io.nexusweaver.controlplane.api.dto.DeploymentRequest;
import io.nexusweaver.controlplane.api.dto.DeploymentResponse;
import io.nexusweaver.controlplane.service.DeploymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST controller for managing deployments.
 */
@RestController
@RequestMapping("/api/v1/deployments")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Deployments", description = "Deployment management endpoints")
public class DeploymentController {

    private final DeploymentService deploymentService;

    @PostMapping
    @Operation(summary = "Create a new deployment", description = "Deploy an application based on the provided manifest")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Deployment created successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid deployment request"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    public ResponseEntity<DeploymentResponse> createDeployment(
            @Valid @RequestBody DeploymentRequest request) {
        log.info("Creating deployment for application: {}", request.getApplicationName());
        DeploymentResponse response = deploymentService.createDeployment(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{deploymentId}")
    @Operation(summary = "Get deployment by ID", description = "Retrieve details of a specific deployment")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Deployment found"),
        @ApiResponse(responseCode = "404", description = "Deployment not found")
    })
    public ResponseEntity<DeploymentResponse> getDeployment(
            @Parameter(description = "Deployment ID") @PathVariable UUID deploymentId) {
        log.debug("Fetching deployment: {}", deploymentId);
        DeploymentResponse response = deploymentService.getDeployment(deploymentId);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @Operation(summary = "List all deployments", description = "Retrieve a list of all deployments")
    @ApiResponse(responseCode = "200", description = "List of deployments")
    public ResponseEntity<List<DeploymentResponse>> listDeployments(
            @Parameter(description = "Filter by application ID") @RequestParam(required = false) UUID applicationId,
            @Parameter(description = "Filter by status") @RequestParam(required = false) String status) {
        log.debug("Listing deployments - applicationId: {}, status: {}", applicationId, status);
        try {
            List<DeploymentResponse> deployments = deploymentService.listDeployments(applicationId, status);
            return ResponseEntity.ok(deployments);
        } catch (Exception e) {
            log.error("Error in listDeployments controller", e);
            throw e;
        }
    }

    @DeleteMapping("/{deploymentId}")
    @Operation(summary = "Delete a deployment", description = "Terminate and remove a deployment")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Deployment deleted successfully"),
        @ApiResponse(responseCode = "404", description = "Deployment not found")
    })
    public ResponseEntity<Void> deleteDeployment(
            @Parameter(description = "Deployment ID") @PathVariable UUID deploymentId) {
        log.info("Deleting deployment: {}", deploymentId);
        deploymentService.deleteDeployment(deploymentId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{deploymentId}/stop")
    @Operation(summary = "Stop a deployment", description = "Stop all services in a deployment")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Deployment stopped successfully"),
        @ApiResponse(responseCode = "404", description = "Deployment not found")
    })
    public ResponseEntity<DeploymentResponse> stopDeployment(
            @Parameter(description = "Deployment ID") @PathVariable UUID deploymentId) {
        log.info("Stopping deployment: {}", deploymentId);
        DeploymentResponse response = deploymentService.stopDeployment(deploymentId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{deploymentId}/start")
    @Operation(summary = "Start a deployment", description = "Start all services in a deployment")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Deployment started successfully"),
        @ApiResponse(responseCode = "404", description = "Deployment not found")
    })
    public ResponseEntity<DeploymentResponse> startDeployment(
            @Parameter(description = "Deployment ID") @PathVariable UUID deploymentId) {
        log.info("Starting deployment: {}", deploymentId);
        DeploymentResponse response = deploymentService.startDeployment(deploymentId);
        return ResponseEntity.ok(response);
    }
}