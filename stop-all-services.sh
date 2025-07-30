#!/bin/bash

# Stop all Nexus Weaver services
echo "Stopping Nexus Weaver Services..."

echo "Stopping Dashboard..."
pkill -f "npm run dev"
pkill -f "vite"

echo "Stopping Control Plane..."
pkill -f "spring-boot:run"
pkill -f "java.*control-plane"

echo "Stopping Kernel..."
sudo pkill -f "./build/kernel"

echo "Stopping Docker containers..."
docker-compose down 

echo "All services stopped."