package main

import (
	"context"
	"fmt"
	"io"
	"strings"
	"sync"
	"time"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/network"
	"github.com/docker/docker/client"
	"github.com/docker/go-connections/nat"
	"github.com/sirupsen/logrus"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	kernelv1 "github.com/nexusweaver/kernel-go/api/kernelv1"
)

type KernelService struct {
	kernelv1.UnimplementedKernelServiceServer
	dockerClient *client.Client
	devMode      bool
	containers   map[string]*ContainerInfo
	mutex        sync.RWMutex
}

type ContainerInfo struct {
	ID          string
	Name        string
	Status      string
	ProcessID   string
	Language    string
	Port        int32
	CreatedAt   time.Time
	ContainerID string
}

func NewKernelService(dockerClient *client.Client, devMode bool) *KernelService {
	return &KernelService{
		dockerClient: dockerClient,
		devMode:      devMode,
		containers:   make(map[string]*ContainerInfo),
	}
}

// StartProcess creates and runs a Docker container for the user application
func (k *KernelService) StartProcess(ctx context.Context, req *kernelv1.StartProcessRequest) (*kernelv1.StartProcessResponse, error) {
	logger := logrus.WithFields(logrus.Fields{
		"processName": req.ProcessName,
		"language":    req.Language,
		"nodeId":      req.NodeId,
	})

	logger.Info("Starting process via Docker container")

	// Generate container name
	containerName := fmt.Sprintf("nexus-%s-%d", req.ProcessName, time.Now().Unix())
	
	// Create Dockerfile content based on language and command
	dockerfile := k.generateDockerfile(req.Language, req.Command, req.Environment)
	
	// Build container image
	imageTag := fmt.Sprintf("nexus-app-%s:latest", req.ProcessName)
	err := k.buildContainerImage(ctx, dockerfile, imageTag, logger)
	if err != nil {
		logger.WithError(err).Error("Failed to build container image")
		return &kernelv1.StartProcessResponse{
			Success:   false,
			ProcessId: "",
			Message:   fmt.Sprintf("Failed to build container: %v", err),
		}, nil
	}

	// Configure container
	config := &container.Config{
		Image: imageTag,
		Env:   k.buildEnvironmentVars(req.Environment),
		ExposedPorts: nat.PortSet{
			nat.Port(fmt.Sprintf("%d/tcp", req.Port)): struct{}{},
		},
	}

	hostConfig := &container.HostConfig{
		PublishAllPorts: true,
		Resources: container.Resources{
			Memory:   req.MemoryLimit,
			NanoCPUs: int64(req.CpuShares) * 1000000, // Convert CPU shares to nano CPUs
		},
	}

	networkConfig := &network.NetworkingConfig{}

	// Create container
	resp, err := k.dockerClient.ContainerCreate(ctx, config, hostConfig, networkConfig, nil, containerName)
	if err != nil {
		logger.WithError(err).Error("Failed to create container")
		return &kernelv1.StartProcessResponse{
			Success:   false,
			ProcessId: "",
			Message:   fmt.Sprintf("Failed to create container: %v", err),
		}, nil
	}

	// Start container
	if err := k.dockerClient.ContainerStart(ctx, resp.ID, types.ContainerStartOptions{}); err != nil {
		logger.WithError(err).Error("Failed to start container")
		return &kernelv1.StartProcessResponse{
			Success:   false,
			ProcessId: "",
			Message:   fmt.Sprintf("Failed to start container: %v", err),
		}, nil
	}

	// Store container info
	processID := resp.ID[:12] // Use first 12 chars of container ID as process ID
	containerInfo := &ContainerInfo{
		ID:          processID,
		Name:        containerName,
		Status:      "running",
		ProcessID:   processID,
		Language:    req.Language,
		Port:        req.Port,
		CreatedAt:   time.Now(),
		ContainerID: resp.ID,
	}

	k.mutex.Lock()
	k.containers[processID] = containerInfo
	k.mutex.Unlock()

	logger.WithFields(logrus.Fields{
		"processId":   processID,
		"containerId": resp.ID,
	}).Info("Container started successfully")

	return &kernelv1.StartProcessResponse{
		Success:   true,
		ProcessId: processID,
		Message:   "Process started successfully",
	}, nil
}

// StopProcess stops and removes a Docker container
func (k *KernelService) StopProcess(ctx context.Context, req *kernelv1.StopProcessRequest) (*kernelv1.StopProcessResponse, error) {
	logger := logrus.WithField("processId", req.ProcessId)
	
	k.mutex.RLock()
	containerInfo, exists := k.containers[req.ProcessId]
	k.mutex.RUnlock()
	
	if !exists {
		return &kernelv1.StopProcessResponse{
			Success: false,
			Message: "Process not found",
		}, status.Error(codes.NotFound, "Process not found")
	}

	// Stop container
	timeout := 30 * time.Second
	if err := k.dockerClient.ContainerStop(ctx, containerInfo.ContainerID, &timeout); err != nil {
		logger.WithError(err).Error("Failed to stop container")
		return &kernelv1.StopProcessResponse{
			Success: false,
			Message: fmt.Sprintf("Failed to stop container: %v", err),
		}, nil
	}

	// Remove container
	if err := k.dockerClient.ContainerRemove(ctx, containerInfo.ContainerID, types.ContainerRemoveOptions{Force: true}); err != nil {
		logger.WithError(err).Warn("Failed to remove container (continuing anyway)")
	}

	// Update status
	k.mutex.Lock()
	containerInfo.Status = "stopped"
	k.mutex.Unlock()

	logger.Info("Process stopped successfully")

	return &kernelv1.StopProcessResponse{
		Success: true,
		Message: "Process stopped successfully",
	}, nil
}

// GetProcessStatus returns the status of a process
func (k *KernelService) GetProcessStatus(ctx context.Context, req *kernelv1.GetProcessStatusRequest) (*kernelv1.GetProcessStatusResponse, error) {
	k.mutex.RLock()
	containerInfo, exists := k.containers[req.ProcessId]
	k.mutex.RUnlock()
	
	if !exists {
		return &kernelv1.GetProcessStatusResponse{
			Status: "not_found",
		}, nil
	}

	// Check actual container status
	containerJSON, err := k.dockerClient.ContainerInspect(ctx, containerInfo.ContainerID)
	if err != nil {
		return &kernelv1.GetProcessStatusResponse{
			Status: "unknown",
		}, nil
	}

	status := "stopped"
	if containerJSON.State.Running {
		status = "running"
	} else if containerJSON.State.Dead {
		status = "failed"
	}

	return &kernelv1.GetProcessStatusResponse{
		Status: status,
	}, nil
}

// ListProcesses returns all managed processes
func (k *KernelService) ListProcesses(ctx context.Context, req *kernelv1.ListProcessesRequest) (*kernelv1.ListProcessesResponse, error) {
	k.mutex.RLock()
	defer k.mutex.RUnlock()

	var processes []*kernelv1.ProcessInfo
	for _, containerInfo := range k.containers {
		processes = append(processes, &kernelv1.ProcessInfo{
			ProcessId: containerInfo.ProcessID,
			Name:      containerInfo.Name,
			Status:    containerInfo.Status,
			Language:  containerInfo.Language,
			Port:      containerInfo.Port,
			CreatedAt: containerInfo.CreatedAt.Unix(),
		})
	}

	return &kernelv1.ListProcessesResponse{
		Processes: processes,
	}, nil
}

// HealthCheck returns the health status of the kernel
func (k *KernelService) HealthCheck(ctx context.Context, req *kernelv1.HealthCheckRequest) (*kernelv1.HealthCheckResponse, error) {
	// Test Docker connection
	_, err := k.dockerClient.Ping(ctx)
	if err != nil {
		return &kernelv1.HealthCheckResponse{
			Status:  "unhealthy",
			Message: fmt.Sprintf("Docker daemon unreachable: %v", err),
		}, nil
	}

	return &kernelv1.HealthCheckResponse{
		Status:  "healthy",
		Message: "Kernel is healthy",
	}, nil
}

// Shutdown gracefully shuts down the kernel service
func (k *KernelService) Shutdown() {
	logrus.Info("Shutting down kernel service...")
	
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	k.mutex.RLock()
	containers := make(map[string]*ContainerInfo)
	for k, v := range k.containers {
		containers[k] = v
	}
	k.mutex.RUnlock()

	// Stop all containers
	for processID, containerInfo := range containers {
		logrus.WithField("processId", processID).Info("Stopping container during shutdown")
		
		timeout := 10 * time.Second
		if err := k.dockerClient.ContainerStop(ctx, containerInfo.ContainerID, &timeout); err != nil {
			logrus.WithError(err).WithField("processId", processID).Warn("Failed to stop container during shutdown")
		}
	}
}

// Helper functions

func (k *KernelService) generateDockerfile(language, command string, environment map[string]string) string {
	var dockerfile strings.Builder
	
	// Base image selection
	switch strings.ToLower(language) {
	case "python":
		dockerfile.WriteString("FROM python:3.11-slim\n")
	case "node", "nodejs", "javascript":
		dockerfile.WriteString("FROM node:18-slim\n")
	case "go", "golang":
		dockerfile.WriteString("FROM golang:1.21-alpine\n")
	case "java":
		dockerfile.WriteString("FROM openjdk:17-jre-slim\n")
	default:
		dockerfile.WriteString("FROM ubuntu:22.04\n")
		dockerfile.WriteString("RUN apt-get update && apt-get install -y curl wget\n")
	}
	
	dockerfile.WriteString("WORKDIR /app\n")
	
	// Add environment variables
	for key, value := range environment {
		dockerfile.WriteString(fmt.Sprintf("ENV %s=%s\n", key, value))
	}
	
	// Create a simple application based on language
	switch strings.ToLower(language) {
	case "python":
		dockerfile.WriteString("RUN echo 'import http.server; import socketserver; import os; PORT = int(os.environ.get(\"PORT\", 8000)); Handler = http.server.SimpleHTTPRequestHandler; httpd = socketserver.TCPServer((\"\", PORT), Handler); print(f\"Server running on port {PORT}\"); httpd.serve_forever()' > app.py\n")
		dockerfile.WriteString("EXPOSE 8000\n")
		if command != "" {
			dockerfile.WriteString(fmt.Sprintf("CMD %s\n", command))
		} else {
			dockerfile.WriteString("CMD [\"python\", \"app.py\"]\n")
		}
	case "node", "nodejs", "javascript":
		dockerfile.WriteString("RUN echo 'const http = require(\"http\"); const port = process.env.PORT || 3000; const server = http.createServer((req, res) => { res.writeHead(200, {\"Content-Type\": \"text/html\"}); res.end(\"<h1>Hello from Node.js!</h1>\"); }); server.listen(port, () => console.log(`Server running on port ${port}`));' > app.js\n")
		dockerfile.WriteString("EXPOSE 3000\n")
		if command != "" {
			dockerfile.WriteString(fmt.Sprintf("CMD %s\n", command))
		} else {
			dockerfile.WriteString("CMD [\"node\", \"app.js\"]\n")
		}
	default:
		dockerfile.WriteString("RUN echo '#!/bin/bash\necho \"Hello from Nexus Weaver!\"\nwhile true; do sleep 1; done' > start.sh && chmod +x start.sh\n")
		if command != "" {
			dockerfile.WriteString(fmt.Sprintf("CMD %s\n", command))
		} else {
			dockerfile.WriteString("CMD [\"./start.sh\"]\n")
		}
	}
	
	return dockerfile.String()
}

func (k *KernelService) buildContainerImage(ctx context.Context, dockerfile, tag string, logger *logrus.Entry) error {
	// Create build context with Dockerfile
	buildContext := strings.NewReader(dockerfile)
	
	buildOptions := types.ImageBuildOptions{
		Tags:           []string{tag},
		Dockerfile:     "Dockerfile",
		Remove:         true,
		ForceRemove:    true,
		PullParent:     true,
		SuppressOutput: !k.devMode,
	}

	// Build image
	buildResponse, err := k.dockerClient.ImageBuild(ctx, buildContext, buildOptions)
	if err != nil {
		return fmt.Errorf("failed to build image: %w", err)
	}
	defer buildResponse.Body.Close()

	// Read build output
	if k.devMode {
		_, err = io.Copy(logrus.StandardLogger().Out, buildResponse.Body)
		if err != nil {
			logger.WithError(err).Warn("Failed to read build output")
		}
	} else {
		// Just consume the output to avoid blocking
		io.Copy(io.Discard, buildResponse.Body)
	}

	return nil
}

func (k *KernelService) buildEnvironmentVars(envMap map[string]string) []string {
	var envVars []string
	for key, value := range envMap {
		envVars = append(envVars, fmt.Sprintf("%s=%s", key, value))
	}
	return envVars
}