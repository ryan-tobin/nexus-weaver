/*
 * Nexus Weaver Control Plane
 * Copyright (c) 2024 Nexus Weaver Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 */

package io.nexusweaver.controlplane;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Main application class for the Nexus Weaver Control Plane.
 * 
 * The Control Plane is responsible for:
 * - Managing application deployments
 * - Orchestrating kernel instances
 * - Providing REST API for CLI and dashboard
 * - Maintaining system state in PostgreSQL
 */
@SpringBootApplication
@EnableAsync
@EnableScheduling
public class ControlPlaneApplication {

    public static void main(String[] args) {
        SpringApplication.run(ControlPlaneApplication.class, args);
    }
}