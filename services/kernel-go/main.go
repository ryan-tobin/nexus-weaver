package main

import (
	"context"
	"flag"
	"fmt"
	"net"
	"os"
	"os/signal"
	"syscall"

	"github.com/docker/docker/client"
	"github.com/sirupsen/logrus"
	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"
	
	kernelv1 "github.com/nexusweaver/kernel-go/api/kernelv1"
)

const (
	defaultPort     = 50051
	defaultLogLevel = "info"
	version         = "2.0.0"
)

type KernelConfig struct {
	Port     int
	LogLevel string
	DevMode  bool
}

func main() {
	config := parseFlags()
	
	// Setup logging
	setupLogging(config.LogLevel)
	
	logrus.WithFields(logrus.Fields{
		"version": version,
		"port":    config.Port,
		"devMode": config.DevMode,
	}).Info("Starting Nexus Weaver Kernel (Go)")

	// Initialize Docker client
	dockerClient, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		logrus.WithError(err).Fatal("Failed to create Docker client")
	}
	defer dockerClient.Close()

	// Test Docker connection
	ctx := context.Background()
	info, err := dockerClient.Info(ctx)
	if err != nil {
		logrus.WithError(err).Fatal("Failed to connect to Docker daemon")
	}
	logrus.WithFields(logrus.Fields{
		"docker_version": info.ServerVersion,
		"containers":     info.Containers,
	}).Info("Connected to Docker daemon")

	// Create kernel service
	kernelService := NewKernelService(dockerClient, config.DevMode)

	// Setup TCP server for legacy Control Plane compatibility
	tcpServer := NewTCPServer(kernelService, config.Port)
	if err := tcpServer.Start(); err != nil {
		logrus.WithError(err).Fatal("Failed to start TCP server")
	}

	// Setup gRPC server on different port for future use
	grpcPort := config.Port + 1 // Use port 50052 for gRPC
	grpcServer := grpc.NewServer()
	kernelv1.RegisterKernelServiceServer(grpcServer, kernelService)
	
	// Enable reflection for development
	if config.DevMode {
		reflection.Register(grpcServer)
		logrus.Info("gRPC reflection enabled (dev mode)")
	}

	// Start gRPC server
	grpcListen, err := net.Listen("tcp", fmt.Sprintf(":%d", grpcPort))
	if err != nil {
		logrus.WithError(err).Fatal("Failed to listen on gRPC port")
	}

	// Start gRPC server in background
	go func() {
		logrus.WithField("address", grpcListen.Addr()).Info("gRPC server ready for future use")
		if err := grpcServer.Serve(grpcListen); err != nil {
			logrus.WithError(err).Error("gRPC server error")
		}
	}()

	// Handle graceful shutdown
	go func() {
		sigChan := make(chan os.Signal, 1)
		signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
		<-sigChan
		
		logrus.Info("Shutting down kernel...")
		kernelService.Shutdown()
		tcpServer.Stop()
		grpcServer.GracefulStop()
		os.Exit(0)
	}()

	logrus.WithFields(logrus.Fields{
		"tcpPort":  config.Port,
		"grpcPort": grpcPort,
	}).Info("Kernel ready and waiting for requests")
	
	// Keep main thread alive
	select {}
}

func parseFlags() *KernelConfig {
	var (
		port     = flag.Int("port", defaultPort, "gRPC server port")
		logLevel = flag.String("log-level", defaultLogLevel, "Log level (debug, info, warn, error)")
		devMode  = flag.Bool("dev-mode", false, "Enable development mode")
		showVersion = flag.Bool("version", false, "Show version")
	)
	flag.Parse()

	if *showVersion {
		fmt.Printf("Nexus Weaver Kernel v%s\n", version)
		os.Exit(0)
	}

	return &KernelConfig{
		Port:     *port,
		LogLevel: *logLevel,
		DevMode:  *devMode,
	}
}

func setupLogging(level string) {
	logrus.SetFormatter(&logrus.TextFormatter{
		FullTimestamp: true,
		TimestampFormat: "2006-01-02 15:04:05",
	})

	switch level {
	case "debug":
		logrus.SetLevel(logrus.DebugLevel)
	case "info":
		logrus.SetLevel(logrus.InfoLevel)
	case "warn":
		logrus.SetLevel(logrus.WarnLevel)
	case "error":
		logrus.SetLevel(logrus.ErrorLevel)
	default:
		logrus.SetLevel(logrus.InfoLevel)
	}
}