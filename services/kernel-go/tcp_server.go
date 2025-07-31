package main

import (
	"context"
	"encoding/binary"
	"fmt"
	"io"
	"net"
	"strings"
	"time"

	"github.com/sirupsen/logrus"
	kernelv1 "github.com/nexusweaver/kernel-go/api/kernelv1"
)

// Message types matching Control Plane expectations
const (
	MSG_START_PROCESS  = 1
	MSG_STOP_PROCESS   = 2
	MSG_GET_PROCESS    = 3
	MSG_LIST_PROCESSES = 4
	MSG_HEALTH_CHECK   = 5
)

type TCPServer struct {
	kernelService *KernelService
	port          int
	listener      net.Listener
}

func NewTCPServer(kernelService *KernelService, port int) *TCPServer {
	return &TCPServer{
		kernelService: kernelService,
		port:          port,
	}
}

func (s *TCPServer) Start() error {
	var err error
	s.listener, err = net.Listen("tcp", fmt.Sprintf(":%d", s.port))
	if err != nil {
		return fmt.Errorf("failed to start TCP server: %w", err)
	}

	logrus.WithField("port", s.port).Info("TCP server listening for legacy Control Plane connections")

	go s.acceptConnections()
	return nil
}

func (s *TCPServer) Stop() error {
	if s.listener != nil {
		return s.listener.Close()
	}
	return nil
}

func (s *TCPServer) acceptConnections() {
	for {
		conn, err := s.listener.Accept()
		if err != nil {
			logrus.WithError(err).Error("Failed to accept TCP connection")
			continue
		}

		go s.handleConnection(conn)
	}
}

func (s *TCPServer) handleConnection(conn net.Conn) {
	defer conn.Close()
	
	logger := logrus.WithField("client", conn.RemoteAddr())
	logger.Info("TCP connection established")

	// Set connection timeout
	conn.SetReadDeadline(time.Now().Add(30 * time.Second))

	// Read message header (8 bytes: 4 for type, 4 for length)
	header := make([]byte, 8)
	if _, err := io.ReadFull(conn, header); err != nil {
		logger.WithError(err).Error("Failed to read message header")
		return
	}

	messageType := int32(binary.LittleEndian.Uint32(header[0:4]))
	messageLength := int32(binary.LittleEndian.Uint32(header[4:8]))

	logger.WithFields(logrus.Fields{
		"messageType":   messageType,
		"messageLength": messageLength,
	}).Info("Received TCP message")

	// Read message data
	var messageData []byte
	if messageLength > 0 {
		messageData = make([]byte, messageLength)
		if _, err := io.ReadFull(conn, messageData); err != nil {
			logger.WithError(err).Error("Failed to read message data")
			return
		}
	}

	// Process message
	response := s.processMessage(messageType, string(messageData), logger)
	
	// Send response
	s.sendResponse(conn, messageType, response, logger)
}

func (s *TCPServer) processMessage(messageType int32, data string, logger *logrus.Entry) string {
	switch messageType {
	case MSG_START_PROCESS:
		return s.handleStartProcess(data, logger)
	case MSG_STOP_PROCESS:
		return s.handleStopProcess(data, logger)
	case MSG_LIST_PROCESSES:
		return s.handleListProcesses(logger)
	case MSG_HEALTH_CHECK:
		return s.handleHealthCheck(logger)
	default:
		logger.WithField("messageType", messageType).Warn("Unknown message type")
		return "ERROR: Unknown message type"
	}
}

func (s *TCPServer) handleStartProcess(data string, logger *logrus.Entry) string {
	// Expected format: "processId processName command"
	parts := strings.SplitN(data, " ", 3)
	if len(parts) < 3 {
		logger.WithField("data", data).Error("Invalid start process message format")
		return "ERROR: Invalid message format"
	}

	processId := parts[0]
	processName := parts[1] 
	command := parts[2]

	logger.WithFields(logrus.Fields{
		"processId":   processId,
		"processName": processName,
		"command":     command,
	}).Info("Starting process via TCP")

	// Create StartProcessRequest for gRPC service
	req := &kernelv1.StartProcessRequest{
		ProcessName: processName,
		Language:    "python", // Default language for legacy protocol
		Command:     command,
		NodeId:      "localhost",
		Port:        8000, // Default port
		MemoryLimit: 536870912, // 512MB default
		CpuShares:   1024,      // Default CPU shares
		Environment: make(map[string]string),
	}

	// Call the gRPC service implementation
	ctx := context.Background()
	resp, err := s.kernelService.StartProcess(ctx, req)
	if err != nil {
		logger.WithError(err).Error("Failed to start process")
		return fmt.Sprintf("ERROR: Failed to start process: %v", err)
	}

	if resp.Success {
		return fmt.Sprintf("Process started successfully: %s", resp.ProcessId)
	} else {
		return fmt.Sprintf("ERROR: %s", resp.Message)
	}
}

func (s *TCPServer) handleStopProcess(processId string, logger *logrus.Entry) string {
	logger.WithField("processId", processId).Info("Stopping process via TCP")

	req := &kernelv1.StopProcessRequest{
		ProcessId: strings.TrimSpace(processId),
	}

	ctx := context.Background()
	resp, err := s.kernelService.StopProcess(ctx, req)
	if err != nil {
		logger.WithError(err).Error("Failed to stop process")
		return fmt.Sprintf("ERROR: Failed to stop process: %v", err)
	}

	if resp.Success {
		return "Process stopped successfully"
	} else {
		return fmt.Sprintf("ERROR: %s", resp.Message)
	}
}

func (s *TCPServer) handleListProcesses(logger *logrus.Entry) string {
	logger.Info("Listing processes via TCP")

	req := &kernelv1.ListProcessesRequest{}
	ctx := context.Background()
	resp, err := s.kernelService.ListProcesses(ctx, req)
	if err != nil {
		logger.WithError(err).Error("Failed to list processes")
		return fmt.Sprintf("ERROR: Failed to list processes: %v", err)
	}

	var result strings.Builder
	result.WriteString("Processes:\n")
	for _, process := range resp.Processes {
		result.WriteString(fmt.Sprintf("%s %s %s %s\n", 
			process.ProcessId, process.Name, process.Status, process.Language))
	}

	return result.String()
}

func (s *TCPServer) handleHealthCheck(logger *logrus.Entry) string {
	logger.Info("Health check via TCP")

	req := &kernelv1.HealthCheckRequest{}
	ctx := context.Background()
	resp, err := s.kernelService.HealthCheck(ctx, req)
	if err != nil {
		logger.WithError(err).Error("Health check failed")
		return "ERROR: Health check failed"
	}

	if resp.Status == "healthy" {
		return "OK: Kernel is healthy"
	} else {
		return fmt.Sprintf("ERROR: %s", resp.Message)
	}
}

func (s *TCPServer) sendResponse(conn net.Conn, messageType int32, response string, logger *logrus.Entry) {
	responseData := []byte(response)
	
	// Create response header
	header := make([]byte, 8)
	binary.LittleEndian.PutUint32(header[0:4], uint32(messageType))
	binary.LittleEndian.PutUint32(header[4:8], uint32(len(responseData)))

	// Send header
	if _, err := conn.Write(header); err != nil {
		logger.WithError(err).Error("Failed to send response header")
		return
	}

	// Send response data
	if len(responseData) > 0 {
		if _, err := conn.Write(responseData); err != nil {
			logger.WithError(err).Error("Failed to send response data")
			return
		}
	}

	logger.WithFields(logrus.Fields{
		"responseLength": len(responseData),
		"response":       response,
	}).Info("TCP response sent")
}