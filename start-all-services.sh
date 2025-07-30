#!/bin/bash

# Start All Nexus Weaver Services (GitHub Codespaces Version)
# Run this script from the project root directory

echo "Starting Nexus Weaver Services in GitHub Codespaces..."

# Function to make a port public using GitHub CLI
make_port_public() {
    local port="$1"
    echo "Making port $port public..."
    gh codespace ports visibility $port:public -c $CODESPACE_NAME
}

# 1. Start Infrastructure (PostgreSQL, Redis)
echo "Starting infrastructure services..."
docker-compose up -d postgres redis

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
until docker-compose exec -T postgres pg_isready -U weaver > /dev/null 2>&1; do
    echo -n "."
    sleep 1
done
echo " Ready!"

# 2. Start the Kernel (Process Manager)
echo "Starting Kernel..."
cd services/kernel
make clean && make build
sudo ./build/kernel --port 50051 --log-level debug &
KERNEL_PID=$!
cd ../..
echo "Kernel started (PID: $KERNEL_PID)"

# 3. Start the Control Plane (Java/Spring Boot)
echo "☕ Starting Control Plane..."
cd services/control-plane
mvn clean compile
mvn spring-boot:run &
CONTROL_PLANE_PID=$!
cd ../..

# Wait for Control Plane to be ready
echo "Waiting for Control Plane to be ready..."
until curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/actuator/health | grep -q "200"; do
    echo -n "."
    sleep 2
done
echo " Ready!"

# 4. Start the Dashboard (React)
echo "Starting Dashboard..."
cd services/dashboard
npm install
npm run dev &
DASHBOARD_PID=$!
cd ../..

# Wait a bit for services to fully start
sleep 5

# 5. Make ports public in GitHub Codespaces
if [ -n "$CODESPACE_NAME" ]; then
    echo ""
    echo "Configuring port visibility for GitHub Codespaces..."
    
    # Make ports public
    make_port_public 3000  # Dashboard
    make_port_public 8080  # Control Plane API
    # make_port_public 5432  # PostgreSQL (keep private for security)
    # make_port_public 50051 # Kernel (keep private for security)
    
    # Get the Codespace URLs
    DASHBOARD_URL="https://${CODESPACE_NAME}-3000.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"
    API_URL="https://${CODESPACE_NAME}-8080.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"
    
    echo ""
    echo "✅ Ports configured for public access!"
else
    DASHBOARD_URL="http://localhost:3000"
    API_URL="http://localhost:8080"
fi

echo ""
echo "All services started successfully!"
echo ""
echo "Service Status:"
echo "- PostgreSQL: localhost:5432 (user: weaver, password: weaver-dev-password)"
echo "- Kernel: localhost:50051"
echo "- Control Plane API: $API_URL (Credentials: admin/admin)"
echo "- Dashboard: $DASHBOARD_URL (Login: admin/admin)"
echo ""
echo "Process IDs:"
echo "- Kernel PID: $KERNEL_PID"
echo "- Control Plane PID: $CONTROL_PLANE_PID"
echo "- Dashboard PID: $DASHBOARD_PID"
echo ""

# Save PIDs to a file for the stop script
echo "KERNEL_PID=$KERNEL_PID" > .pids
echo "CONTROL_PLANE_PID=$CONTROL_PLANE_PID" >> .pids
echo "DASHBOARD_PID=$DASHBOARD_PID" >> .pids

echo "To stop all services, run: ./stop-all-services.sh"
echo ""
echo "🎉 Your Nexus Weaver platform is ready!"
echo "   Dashboard: $DASHBOARD_URL"
echo "   API Docs: $API_URL/swagger-ui.html"