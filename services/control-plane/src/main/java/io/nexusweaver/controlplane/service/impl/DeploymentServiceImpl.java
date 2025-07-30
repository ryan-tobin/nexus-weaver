/*
 * Nexus Weaver Control Plane
 * Copyright (c) 2024 Nexus Weaver Project
 */

package io.nexusweaver.controlplane.service.impl;

import io.nexusweaver.controlplane.api.dto.DeploymentRequest;
import io.nexusweaver.controlplane.api.dto.DeploymentResponse;
import io.nexusweaver.controlplane.domain.entity.*;
import io.nexusweaver.controlplane.exception.ResourceNotFoundException;
import io.nexusweaver.controlplane.mapper.DeploymentMapper;
import io.nexusweaver.controlplane.repository.ApplicationRepository;
import io.nexusweaver.controlplane.repository.DeploymentRepository;
import io.nexusweaver.controlplane.service.DeploymentService;
import io.nexusweaver.controlplane.service.KernelService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Implementation of the deployment service.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class DeploymentServiceImpl implements DeploymentService {

    private final DeploymentRepository deploymentRepository;
    private final ApplicationRepository applicationRepository;
    private final KernelService kernelService;
    private final DeploymentMapper deploymentMapper;

    @Override
    public DeploymentResponse createDeployment(DeploymentRequest request) {
        log.info("Creating deployment for application: {}", request.getApplicationName());

        // Find or create application
        Application application = applicationRepository.findByName(request.getApplicationName())
                .orElseGet(() -> {
                    Application newApp = Application.builder()
                            .name(request.getApplicationName())
                            .description(request.getDescription())
                            .build();
                    return applicationRepository.save(newApp);
                });

        // Create deployment
        Deployment deployment = Deployment.builder()
                .application(application)
                .version(request.getVersion())
                .status(DeploymentStatus.PENDING)
                .build();

        // Create services
        for (DeploymentRequest.ServiceDefinition serviceDef : request.getServices()) {
            io.nexusweaver.controlplane.domain.entity.Service service = 
                    io.nexusweaver.controlplane.domain.entity.Service.builder()
                    .name(serviceDef.getName())
                    .language(serviceDef.getLanguage())
                    .port(serviceDef.getPort())
                    .command(serviceDef.getCommand())
                    .status(ServiceStatus.INIT)
                    .memoryLimit(serviceDef.getLimits() != null ? 
                            serviceDef.getLimits().getMemory() : 536870912L) // 512MB default
                    .cpuShares(serviceDef.getLimits() != null ? 
                            serviceDef.getLimits().getCpuShares() : 1024)
                    .build();
            
            deployment.addService(service);
        }

        deployment = deploymentRepository.save(deployment);

        // Start deployment asynchronously
        startDeploymentAsync(deployment);

        return deploymentMapper.toResponse(deployment);
    }

    @Override
    public DeploymentResponse getDeployment(UUID deploymentId) {
        Deployment deployment = deploymentRepository.findById(deploymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Deployment not found: " + deploymentId));
        return deploymentMapper.toResponse(deployment);
    }

    @Override
    public List<DeploymentResponse> listDeployments(UUID applicationId, String status) {
        List<Deployment> deployments;
        
        if (applicationId != null && status != null) {
            deployments = deploymentRepository.findByApplicationIdAndStatus(
                    applicationId, DeploymentStatus.valueOf(status.toUpperCase()));
        } else if (applicationId != null) {
            deployments = deploymentRepository.findByApplicationId(applicationId);
        } else if (status != null) {
            deployments = deploymentRepository.findByStatus(
                    DeploymentStatus.valueOf(status.toUpperCase()));
        } else {
            deployments = deploymentRepository.findAll();
        }

        return deployments.stream()
                .map(deploymentMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public void deleteDeployment(UUID deploymentId) {
        Deployment deployment = deploymentRepository.findById(deploymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Deployment not found: " + deploymentId));

        // Stop all services
        deployment.setStatus(DeploymentStatus.TERMINATING);
        deploymentRepository.save(deployment);

        // Stop services in kernel
        for (io.nexusweaver.controlplane.domain.entity.Service service : deployment.getServices()) {
            if (service.getProcessId() != null) {
                try {
                    kernelService.stopProcess(service.getNodeId(), service.getProcessId());
                } catch (Exception e) {
                    log.error("Failed to stop process {} on node {}", 
                            service.getProcessId(), service.getNodeId(), e);
                }
            }
        }

        // Delete deployment
        deploymentRepository.delete(deployment);
        log.info("Deployment {} deleted", deploymentId);
    }

    @Override
    public DeploymentResponse stopDeployment(UUID deploymentId) {
        Deployment deployment = deploymentRepository.findById(deploymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Deployment not found: " + deploymentId));

        deployment.setStatus(DeploymentStatus.TERMINATING);
        
        // Stop all services
        for (io.nexusweaver.controlplane.domain.entity.Service service : deployment.getServices()) {
            if (service.getProcessId() != null && service.getStatus() == ServiceStatus.RUNNING) {
                try {
                    kernelService.stopProcess(service.getNodeId(), service.getProcessId());
                    service.setStatus(ServiceStatus.STOPPED);
                } catch (Exception e) {
                    log.error("Failed to stop service {}", service.getName(), e);
                    service.setStatus(ServiceStatus.FAILED);
                }
            }
        }

        deployment.setStatus(DeploymentStatus.TERMINATED);
        deployment = deploymentRepository.save(deployment);

        return deploymentMapper.toResponse(deployment);
    }

    @Override
    public DeploymentResponse startDeployment(UUID deploymentId) {
        Deployment deployment = deploymentRepository.findById(deploymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Deployment not found: " + deploymentId));

        if (deployment.getStatus() != DeploymentStatus.TERMINATED) {
            throw new IllegalStateException("Can only start terminated deployments");
        }

        deployment.setStatus(DeploymentStatus.DEPLOYING);
        deployment = deploymentRepository.save(deployment);

        // Start deployment asynchronously
        startDeploymentAsync(deployment);

        return deploymentMapper.toResponse(deployment);
    }

    private void startDeploymentAsync(Deployment deployment) {
        // In a real implementation, this would be done asynchronously
        // For now, we'll do it synchronously
        try {
            deployment.setStatus(DeploymentStatus.DEPLOYING);
            
            for (io.nexusweaver.controlplane.domain.entity.Service service : deployment.getServices()) {
                try {
                    // Select a node (for now, just use "localhost")
                    String nodeId = "localhost";
                    service.setNodeId(nodeId);
                    
                    // Start process on kernel
                    String processId = kernelService.startProcess(
                            nodeId,
                            service.getName(),
                            service.getCommand() != null ? service.getCommand() : 
                                    buildDefaultCommand(service),
                            service.getMemoryLimit(),
                            service.getCpuShares()
                    );
                    
                    service.setProcessId(processId);
                    service.setStatus(ServiceStatus.RUNNING);
                } catch (Exception e) {
                    log.error("Failed to start service {}", service.getName(), e);
                    service.setStatus(ServiceStatus.FAILED);
                }
            }
            
            // Check if all services started successfully
            boolean allRunning = deployment.getServices().stream()
                    .allMatch(s -> s.getStatus() == ServiceStatus.RUNNING);
            
            deployment.setStatus(allRunning ? DeploymentStatus.DEPLOYED : DeploymentStatus.FAILED);
            deploymentRepository.save(deployment);
            
        } catch (Exception e) {
            log.error("Failed to deploy {}", deployment.getId(), e);
            deployment.setStatus(DeploymentStatus.FAILED);
            deploymentRepository.save(deployment);
        }
    }

    private String buildDefaultCommand(io.nexusweaver.controlplane.domain.entity.Service service) {
        // Build default command based on language
        return switch (service.getLanguage().toLowerCase()) {
            case "python" -> "python app.py";
            case "node", "nodejs" -> "node index.js";
            case "java" -> "java -jar app.jar";
            default -> "/bin/sh -c 'echo No command specified'";
        };
    }
}