/*
 * Nexus Weaver Control Plane
 * Copyright (c) 2024 Nexus Weaver Project
 */

package io.nexusweaver.controlplane.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration properties for Nexus Weaver.
 */
@Configuration
@ConfigurationProperties(prefix = "nexusweaver.control-plane")
@Data
public class NexusWeaverProperties {

    private Kernel kernel = new Kernel();
    private Deployment deployment = new Deployment();
    private Process process = new Process();

    @Data
    public static class Kernel {
        private int defaultPort = 50051;
        private int connectionTimeout = 5000;
        private int requestTimeout = 30000;
    }

    @Data
    public static class Deployment {
        private int maxConcurrentDeployments = 10;
        private int deploymentTimeout = 300000;
    }

    @Data
    public static class Process {
        private long defaultMemoryLimit = 536870912L; // 512MB
        private int defaultCpuShares = 1024;
        private int defaultPidsLimit = 1000;
    }
}