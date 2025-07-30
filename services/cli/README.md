# Nexus Weaver CLI

Command-line interface for the Nexus Weaver deployment platform.

## Installation

```bash
pip install -e .
```

## Usage

```bash
# Initialize a new application
weaver init

# Deploy an application
weaver deploy

# List deployments
weaver list

# Get deployment status
weaver status <deployment-id>

# View logs
weaver logs <deployment-id> [--follow]

# Stop a deployment
weaver stop <deployment-id>

# Delete a deployment
weaver delete <deployment-id>
```

## Configuration

The CLI looks for configuration in the following order:
1. Command-line arguments
2. Environment variables
3. `.weaver.yml` in the current directory
4. `~/.weaver/config.yml`

## Development

```bash
# Install with dev dependencies
pip install -e ".[dev]"

# Run tests
pytest

# Format code
black .
isort .

# Type checking
mypy .
```