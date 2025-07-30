/*
 * Nexus Weaver Control Plane
 * Copyright (c) 2024 Nexus Weaver Project
 */

package io.nexusweaver.controlplane.service;

/**
 * Service interface for communicating with kernel instances.
 */
public interface KernelService {

    /**
     * Start a process on a kernel node.
     *
     * @param nodeId the node ID
     * @param processName the process name
     * @param command the command to execute
     * @param memoryLimit memory limit in bytes
     * @param cpuShares CPU shares
     * @return the process ID
     */
    String startProcess(String nodeId, String processName, String command, 
                       Long memoryLimit, Integer cpuShares);

    /**
     * Stop a process on a kernel node.
     *
     * @param nodeId the node ID
     * @param processId the process ID
     */
    void stopProcess(String nodeId, String processId);

    /**
     * Get process status.
     *
     * @param nodeId the node ID
     * @param processId the process ID
     * @return the process status
     */
    ProcessStatus getProcessStatus(String nodeId, String processId);

    /**
     * Check if a kernel node is healthy.
     *
     * @param nodeId the node ID
     * @return true if healthy
     */
    boolean isNodeHealthy(String nodeId);

    /**
     * Process status from kernel.
     */
    enum ProcessStatus {
        INIT,
        RUNNING,
        STOPPED,
        FAILED,
        TERMINATED
    }
}