/*
 * Nexus Weaver Control Plane
 * Copyright (c) 2024 Nexus Weaver Project
 */

package io.nexusweaver.controlplane.mapper;

import io.nexusweaver.controlplane.api.dto.DeploymentResponse;
import io.nexusweaver.controlplane.domain.entity.Deployment;
import io.nexusweaver.controlplane.domain.entity.Service;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

/**
 * Mapper for converting between Deployment entities and DTOs.
 */
@Mapper(componentModel = "spring")
public interface DeploymentMapper {

    @Mapping(source = "application.id", target = "applicationId")
    @Mapping(source = "application.name", target = "applicationName")
    @Mapping(source = "status", target = "status")
    DeploymentResponse toResponse(Deployment deployment);

    @Mapping(source = "id", target = "id")
    @Mapping(source = "name", target = "name")
    @Mapping(source = "processId", target = "processId")
    @Mapping(source = "nodeId", target = "nodeId")
    @Mapping(source = "status", target = "status")
    @Mapping(source = "language", target = "language")
    @Mapping(source = "port", target = "port")
    @Mapping(source = "memoryLimit", target = "memoryLimit")
    @Mapping(source = "cpuShares", target = "cpuShares")
    DeploymentResponse.ServiceResponse toServiceResponse(Service service);
}