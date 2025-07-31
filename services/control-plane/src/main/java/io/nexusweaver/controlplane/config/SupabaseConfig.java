/*
 * Nexus Weaver Control Plane
 * Copyright (c) 2025 Nexus Weaver Project
 */

package io.nexusweaver.controlplane.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration properties for Supabase integration.
 */
@Configuration
@ConfigurationProperties(prefix = "supabase")
@Data
public class SupabaseConfig {

    private String url;
    private String anonKey;
    private String serviceRoleKey;

    /**
     * Get the Supabase REST API URL
     */
    public String getRestApiUrl() {
        return url + "/rest/v1";
    }

    /**
     * Get the Supabase Auth URL
     */
    public String getAuthUrl() {
        return url + "/auth/v1";
    }

    /**
     * Get the Supabase Realtime URL
     */
    public String getRealtimeUrl() {
        return url.replace("https://", "wss://") + "/realtime/v1";
    }
}