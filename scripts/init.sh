#!/bin/bash
# Nexus Weaver - Project initialziation script

set -e

echo "Initializing Nexus Weaver development environment..."
echo ""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

command_exists() {
    command -v "$1" >/dev/null 2>&1
}

print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

echo "Checking system requirements..."

if command_exists docker; then
    docker_version=$(docker --version | awk '{print $3}' | sed 's/,$//')
    print_status "Docker installed (version $docker_version)"
else 
    print_error "Docker not found. Please install Docker"
    exit 1
fi 

if command_exists docker-compose; then
    compose_version=$(docker-compose --version | awk '{print $3}' | sed 's/,$//')
    print_status "Docker Compose installed (version $compose_version)"
else 
    print_error "Docker Compose not found. Please install Docker Compose."
    exit 1
fi

if command_exists git; then 
    git_version=$(git --version | awk '{print $3}')
    print_status "Git installed (version $git_version)"
else 
    print_error "Git not found. Please install Git."
    exit 1
fi 

echo ""
echo "Checking optional development tools..."

if command_exists gcc; then 
    print_status "GCC installed"
else 
    print_warning "GCC not found (needed for local kernel dev)"
fi 

if command_exists java; then 
    java_version=$(java -version 2>&1 | head -n 1 | awk -F '"' '{print $2}')
    print_status "Java installed (version $java_version)"
else
    print_warning "Java not found (needed for local control plane dev)"
fi

if command_exists python3; then
    python_version=$(python3 --version | awk '{print $2}')
    print_status "Python installed (version $python_version)"
else 
    print_warning "Python not found (needed for local CLI dev)"
fi 

if command_exists node; then \
    node_version=$(node --version)
    print_status "Node.js installed (version $node_version)"
else 
    print_warning "Node.js found (needed for local dashboard dev)"
fi 

echo ""
echo "Setting up Git hooks..."
if [-d, git]; then 
    cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
if git diff --cached --check; then
    :
else 
    echo "Error: Trailing whitespace detected. Please fix before committing."
    exit 1
fi 

#TODO: Add more pre-commit checks
EOF
    chmod +x .git/hooks/pre-commit
    print_status "Git hooks configured"
else 
    print_warning "Not in a Git repository. Skipping Git hooks setup"
fi 

echo ""
echo "Creating local environment configuration..."
if [ ! -f .env]; then 
    cat > .env << EOF
# Nexus Weaver - Local Dev Env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nexusweaver
DB_USER=weaver
DB_PASSWORD=weaver-dev-password

# Services
CONTROL_PLANE_PORT=8080
KERNEL_GRPC_PORT=50051
DASHBOARD_PORT=3000

# Dev
LOG_LEVEL=debug
ENABLE_METRICS=true
EOF
    print_status "Created .env file"
else 
    print_warning ".env file already exists, skipping"
fi 

echo ""
echo "Preparing Docker images..."
docker pull ubuntu:22.04
docker pull postgres:15-alpine
docker pull redis:7-alpine
print_status "Base images ready"

echo ""
echo "Preparing database initialization scripts..."
mkdir -p database/init
cat > database/init/01-schema.sql << 'EOF'
-- Nexus Weaver Database Schema

CREATE SCHEMA IF NOT EXISTS nexusweaver;

-- Users table
CREATE TABLE IF NOT EXISTS nexusweaver.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Deployments table
CREATE TABLE IF NOT EXISTS nexusweaver.deployments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES nexusweaver.applications(id),
    version VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Services table
CREATE TABLE IF NOT EXISTS nexusweaver.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deployment_id UUID REFERENCES nexusweaver.deployments(id),
    name VARCHAR(255) NOT NULL,
    process_id VARCHAR(255) UNIQUE,
    node_id VARCHAR(255),
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_applications_user_id ON nexusweaver.applications(user_id);
CREATE INDEX idx_deployments_application_id ON nexusweaver.deployment(application_id);
CREATE INDEX idx_services_deployment_id ON nexusweaver.services(deployment_id);
CREATE INDEX idx_services_status ON nexusweaver.services(status);
EOF
print_status "Database initialization scripts created"

echo ""
echo "Generating development certificates..."
mkdir -p certs
if [ ! -f certs/dev-cert.pem ]; then 
    openssl req -x509 -newkey rsa:4096 -nodes -days 365 \
        -keyout certs/dev-key.pem -out certs/dev-cert.pem \
        -subj "/C=US/ST=State/L=City/O=NexusWeaver/CN=localhost" \
        2>/dev/null
    print_status "Development certificates generated"
else 
    print_warning "Devlopment certificates already exist, skipping"
fi

echo ""
echo "================================"
echo "Nexus Weaver initialization complete."
echo "================================"
echo ""
echo "To start developing:"
echo "1. Start all servcies: make dev"
echo "2. View logs: docker-compose logs -f"
echo "3. Run tests: make test"
echo ""
echo "Service URLs:"
echo "- Control Plane API: http://localhost:8080"
echo "- Dashboard: http://localhost:3000"
echo "- PostgreSQL: localhost:5432"
echo "- Redis: localhost:6379"
echo ""
echo "Happy coding!"