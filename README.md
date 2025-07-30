# Nexus Weaver

> The Unified Development Ecosystem - Deploy any application with a single command

[![CI](https://github.com/ryan-tobin/nexus-weaver/actions/workflows/ci.yml/badge.svg)](https://github.com/ryan-tobin/nexus-weaver/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

## What is Nexus Weaver?

Nexus Weaver is an open-source platform that eliminates the complexity of modern infrastructure. Write your code, define your app in a simple manifest, and let Weaver handle everything else - building, deploying, networking, and monitoring.

```yaml
# weaver.yml
name: my-app
services:
  api:
    language: python
    port: 8000
    source: ./api
  frontend:
    language: node
    port: 3000
    source: ./frontend
```

```bash
$ weaver deploy
✓ Building services...
✓ Deploying to cluster...
✓ Configuring networking...
✓ Your app is live at https://my-app.weaver.local
```

## Key Features

- **Polyglot Support**: Deploy Python, Java, Node.js, and C# applications seamlessly
- **Zero Configuration**: No Dockerfiles, no Kubernetes YAML, no complexity
- **Instant Deployments**: From code to running application in seconds
- **Built-in Observability**: Logs, metrics, and tracing out of the box
- **Developer First**: Designed by developers, for developers

## Quick Start

### Prerequisites

- Linux (Ubuntu 20.04+ or similar)
- Docker 20.10+
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/ryan-tobin/nexus-weaver.git
cd nexus-weaver

# Start the local development environment
docker-compose up -d

# Install the CLI
pip install -e ./services/cli
```

### Your First Deployment

1. Create a simple Python application:

```python
# app.py
from flask import Flask
app = Flask(__name__)

@app.route('/')
def hello():
    return "Hello from Nexus Weaver!"

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)
```

2. Create a `weaver.yml` manifest:

```yaml
name: hello-world
services:
  web:
    language: python
    port: 8000
    source: .
```

3. Deploy:

```bash
weaver deploy
```

## Architecture

Nexus Weaver consists of several core components:

- **Kernel** (C): Lightweight agent managing processes and resources on each node
- **Control Plane** (Java): Orchestrates deployments and maintains system state
- **CLI** (Python): Primary interface for developers
- **Dashboard** (React): Web UI for monitoring and management
- **Database** (PostgreSQL): Stores configuration and state

## Development

### Project Structure

```
nexus-weaver/
├── services/
│   ├── kernel/        # C - Process management
│   ├── control-plane/ # Java - Orchestration
│   ├── cli/          # Python - Developer interface
│   └── dashboard/    # TypeScript/React - Web UI
├── docs/             # Documentation
├── database/         # Schema and migrations
└── tests/           # Integration tests
```

### Building from Source

```bash
# Build all services
make build

# Run tests
make test

# Start development environment
make dev
```

### Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## Roadmap

### Phase 1: Core Foundation (In Progress)
- [x] Project structure
- [x] Process management (Kernel)
- [x] Basic orchestration (Control Plane)
- [x] CLI with core commands
- [x] Python runtime support

### Phase 2: Polyglot Ecosystem
- [x] Java runtime support
- [x] Node.js runtime support
- [x] C# runtime support
- [x] Service discovery
- [x] Web dashboard

### Phase 3: Enterprise Features
- [ ] High availability
- [ ] Security & RBAC
- [ ] CI/CD integrations
- [ ] Persistent storage
- [ ] Advanced monitoring

## License

Nexus Weaver is licensed under the [Apache License 2.0](LICENSE).

---

Built with ❤️ by developers, for developers.
