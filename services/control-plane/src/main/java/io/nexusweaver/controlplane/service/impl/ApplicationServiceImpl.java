/*
 * Nexus Weaver Control Plane
 * Copyright (c) 2024 Nexus Weaver Project
 */

package io.nexusweaver.controlplane.service.impl;

import io.nexusweaver.controlplane.api.dto.ApplicationDto;
import io.nexusweaver.controlplane.domain.entity.Application;
import io.nexusweaver.controlplane.domain.entity.Deployment;
import io.nexusweaver.controlplane.domain.entity.DeploymentStatus;
import io.nexusweaver.controlplane.exception.ResourceNotFoundException;
import io.nexusweaver.controlplane.repository.ApplicationRepository;
import io.nexusweaver.controlplane.repository.DeploymentRepository;
import io.nexusweaver.controlplane.service.ApplicationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Implementation of the application service.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class ApplicationServiceImpl implements ApplicationService {
    
    private final ApplicationRepository applicationRepository;
    private final DeploymentRepository deploymentRepository;
    
    @Override
    public List<ApplicationDto> getAllApplications() {
        log.debug("Fetching all applications");
        List<Application> applications = applicationRepository.findAll();
        return applications.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    @Override
    public ApplicationDto getApplication(UUID id) {
        Application application = applicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found with id: " + id));
        return convertToDto(application);
    }
    
    @Override
    @Transactional
    public void deleteApplication(UUID id) {
        Application application = applicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found with id: " + id));
        
        // Delete all deployments for this application
        List<Deployment> deployments = deploymentRepository.findByApplicationId(id);
        deploymentRepository.deleteAll(deployments);
        
        // Delete the application
        applicationRepository.delete(application);
        log.info("Deleted application: {} and {} deployments", application.getName(), deployments.size());
    }
    
    private ApplicationDto convertToDto(Application application) {
        ApplicationDto dto = new ApplicationDto();
        dto.setId(application.getId());
        dto.setName(application.getName());
        dto.setDescription(application.getDescription());
        dto.setCreatedAt(application.getCreatedAt());
        dto.setUpdatedAt(application.getUpdatedAt());
        
        // Get deployment statistics
        List<Deployment> deployments = deploymentRepository.findByApplicationId(application.getId());
        dto.setDeploymentCount(deployments.size());
        
        // Count active deployments (DEPLOYED or DEPLOYING)
        long activeCount = deployments.stream()
                .filter(d -> d.getStatus() == DeploymentStatus.DEPLOYED || 
                           d.getStatus() == DeploymentStatus.DEPLOYING)
                .count();
        dto.setActiveDeployments((int) activeCount);
        
        // Get last deployment date
        deployments.stream()
                .map(Deployment::getCreatedAt)
                .max(LocalDateTime::compareTo)
                .ifPresent(dto::setLastDeployedAt);
        
        // Get unique languages from all deployments
        List<String> languages = deployments.stream()
                .flatMap(d -> d.getServices().stream())
                .map(s -> s.getLanguage())
                .filter(lang -> lang != null)
                .distinct()
                .sorted()
                .collect(Collectors.toList());
        dto.setLanguages(languages);
        
        return dto;
    }
}