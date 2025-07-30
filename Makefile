# Nexus Weaver - Root Makefile
# Orchestrates building, testing, and running all services

.PHONY: all build test clean dev prod help

# Default target
all: build

# Help command
help:
	@echo "Nexus Weaver - Build Commands"
	@echo ""
	@echo "  make build       Build all services"
	@echo "  make test        Run all tests"
	@echo "  make clean       Clean all build artifacts"
	@echo "  make dev         Start development environment"
	@echo "  make prod        Build production images"
	@echo "  make kernel      Build only the kernel"
	@echo "  make control     Build only the control plane"
	@echo "  make cli         Build only the CLI"
	@echo "  make dashboard   Build only the dashboard"
	@echo ""

# Build all services
build: kernel control cli dashboard
	@echo "✓ All services built successfully"

# Build individual services
kernel:
	@echo "Building Kernel (C)..."
	@cd services/kernel && $(MAKE) build

control:
	@echo "Building Control Plane (Java)..."
	@cd services/control-plane && mvn clean package

cli:
	@echo "Building CLI (Python)..."
	@cd services/cli && pip install -e .

dashboard:
	@echo "Building Dashboard (React)..."
	@cd services/dashboard && npm install && npm run build

# Run all tests
test: test-kernel test-control test-cli test-dashboard test-integration
	@echo "✓ All tests passed"

test-kernel:
	@echo "Testing Kernel..."
	@cd services/kernel && $(MAKE) test

test-control:
	@echo "Testing Control Plane..."
	@cd services/control-plane && mvn test

test-cli:
	@echo "Testing CLI..."
	@cd services/cli && pytest

test-dashboard:
	@echo "Testing Dashboard..."
	@cd services/dashboard && npm test

test-integration:
	@echo "Running integration tests..."
	@cd tests && ./run-integration-tests.sh

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	@cd services/kernel && $(MAKE) clean
	@cd services/control-plane && mvn clean
	@cd services/cli && rm -rf build dist *.egg-info
	@cd services/dashboard && rm -rf dist node_modules
	@docker-compose down -v
	@echo "✓ Clean complete"

# Development environment
dev:
	@echo "Starting development environment..."
	@docker-compose up -d
	@echo "✓ Development environment ready"
	@echo ""
	@echo "Services:"
	@echo "  Control Plane: http://localhost:8080"
	@echo "  Dashboard:     http://localhost:3000"
	@echo "  PostgreSQL:    localhost:5432"
	@echo ""
	@echo "Run 'docker-compose logs -f' to view logs"

# Production build
prod:
	@echo "Building production images..."
	@docker build -t nexus-weaver/kernel:latest services/kernel
	@docker build -t nexus-weaver/control-plane:latest services/control-plane
	@docker build -t nexus-weaver/dashboard:latest services/dashboard
	@echo "✓ Production images built"

# Initialize project (first time setup)
init:
	@echo "Initializing Nexus Weaver development environment..."
	@./scripts/init.sh
	@echo "✓ Initialization complete"

# Format code
format:
	@echo "Formatting code..."
	@cd services/kernel && $(MAKE) format
	@cd services/control-plane && mvn spotless:apply
	@cd services/cli && black . && isort .
	@cd services/dashboard && npm run format
	@echo "✓ Code formatted"

# Lint code
lint:
	@echo "Linting code..."
	@cd services/kernel && $(MAKE) lint
	@cd services/control-plane && mvn spotless:check
	@cd services/cli && ruff check . && mypy .
	@cd services/dashboard && npm run lint
	@echo "✓ Linting complete"