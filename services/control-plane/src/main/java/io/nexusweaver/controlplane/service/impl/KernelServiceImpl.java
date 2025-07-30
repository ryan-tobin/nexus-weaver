/*
 * Nexus Weaver Control Plane
 * Copyright (c) 2024 Nexus Weaver Project
 */

package io.nexusweaver.controlplane.service.impl;

import io.nexusweaver.controlplane.config.NexusWeaverProperties;
import io.nexusweaver.controlplane.service.KernelService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.*;
import java.net.Socket;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

/**
 * Implementation of kernel service using TCP communication.
 * This will be replaced with gRPC in the future.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class KernelServiceImpl implements KernelService {

    private final NexusWeaverProperties properties;

    // Message types matching kernel protocol
    private static final int MSG_START_PROCESS = 1;
    private static final int MSG_STOP_PROCESS = 2;
    private static final int MSG_GET_PROCESS = 3;
    private static final int MSG_LIST_PROCESSES = 4;
    private static final int MSG_HEALTH_CHECK = 5;

    @Override
    public String startProcess(String nodeId, String processName, String command, 
                              Long memoryLimit, Integer cpuShares) {
        log.info("Starting process {} on node {}", processName, nodeId);
        
        String processId = UUID.randomUUID().toString().substring(0, 8);
        String message = String.format("%s %s %s", processId, processName, command);
        
        try {
            String response = sendMessage(nodeId, MSG_START_PROCESS, message);
            if (response.contains("Process started")) {
                log.info("Process {} started successfully on node {}", processId, nodeId);
                return processId;
            } else {
                throw new RuntimeException("Failed to start process: " + response);
            }
        } catch (Exception e) {
            log.error("Failed to start process on node {}", nodeId, e);
            throw new RuntimeException("Failed to start process", e);
        }
    }

    @Override
    public void stopProcess(String nodeId, String processId) {
        log.info("Stopping process {} on node {}", processId, nodeId);
        
        try {
            String response = sendMessage(nodeId, MSG_STOP_PROCESS, processId);
            if (!response.contains("Process stopped")) {
                log.warn("Unexpected response when stopping process: {}", response);
            }
        } catch (Exception e) {
            log.error("Failed to stop process {} on node {}", processId, nodeId, e);
            throw new RuntimeException("Failed to stop process", e);
        }
    }

    @Override
    public ProcessStatus getProcessStatus(String nodeId, String processId) {
        try {
            String response = sendMessage(nodeId, MSG_LIST_PROCESSES, "");
            // Parse response to find process status
            // For now, return RUNNING if process is in the list
            if (response.contains(processId)) {
                return ProcessStatus.RUNNING;
            }
            return ProcessStatus.TERMINATED;
        } catch (Exception e) {
            log.error("Failed to get process status", e);
            return ProcessStatus.FAILED;
        }
    }

    @Override
    public boolean isNodeHealthy(String nodeId) {
        try {
            String response = sendMessage(nodeId, MSG_HEALTH_CHECK, "");
            return response.contains("OK");
        } catch (Exception e) {
            log.error("Health check failed for node {}", nodeId, e);
            return false;
        }
    }

    private String sendMessage(String nodeId, int messageType, String data) throws IOException {
        // For now, assume nodeId is the hostname and use default port
        String host = nodeId.equals("localhost") ? "127.0.0.1" : nodeId;
        int port = properties.getKernel().getDefaultPort();
        
        try (Socket socket = new Socket(host, port)) {
            socket.setSoTimeout(properties.getKernel().getRequestTimeout());
            
            // Send message
            DataOutputStream out = new DataOutputStream(socket.getOutputStream());
            byte[] dataBytes = data.getBytes(StandardCharsets.UTF_8);
            
            // Write message header (type + length)
            ByteBuffer header = ByteBuffer.allocate(8);
            header.order(ByteOrder.LITTLE_ENDIAN);
            header.putInt(messageType);
            header.putInt(dataBytes.length);
            out.write(header.array());
            
            // Write message data
            if (dataBytes.length > 0) {
                out.write(dataBytes);
            }
            out.flush();
            
            // Read response
            DataInputStream in = new DataInputStream(socket.getInputStream());
            byte[] responseHeader = new byte[8];
            in.readFully(responseHeader);
            
            ByteBuffer headerBuffer = ByteBuffer.wrap(responseHeader);
            headerBuffer.order(ByteOrder.LITTLE_ENDIAN);
            int responseType = headerBuffer.getInt();
            int responseLength = headerBuffer.getInt();
            
            byte[] responseData = new byte[responseLength];
            if (responseLength > 0) {
                in.readFully(responseData);
            }
            
            return new String(responseData, StandardCharsets.UTF_8);
        }
    }
}