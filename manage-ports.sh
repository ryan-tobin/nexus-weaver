#!/bin/bash

# Manage GitHub Codespaces Port Visibility

# Check if running in Codespaces
if [ -z "$CODESPACE_NAME" ]; then
    echo "This script must be run in a GitHub Codespace"
    exit 1
fi

# Function to set port visibility
set_port_visibility() {
    local port=$1
    local visibility=$2
    echo "Setting port $port to $visibility..."
    gh codespace ports visibility $port:$visibility -c $CODESPACE_NAME
}

# Function to list all ports
list_ports() {
    echo "Current port configuration:"
    gh codespace ports -c $CODESPACE_NAME
}

# Main menu
case "${1:-help}" in
    public)
        echo "Making Nexus Weaver ports public..."
        set_port_visibility 3000 public   # Dashboard
        set_port_visibility 8080 public   # Control Plane API
        echo "Ports are now public!"
        echo ""
        echo "Public URLs:"
        echo "Dashboard: https://${CODESPACE_NAME}-3000.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"
        echo "API: https://${CODESPACE_NAME}-8080.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"
        ;;
    
    private)
        echo "Making Nexus Weaver ports private..."
        set_port_visibility 3000 private
        set_port_visibility 8080 private
        set_port_visibility 5432 private
        set_port_visibility 50051 private
        echo "Ports are now private!"
        ;;
    
    list)
        list_ports
        ;;
    
    custom)
        if [ -z "$2" ] || [ -z "$3" ]; then
            echo "Usage: $0 custom <port> <public|private|org>"
            exit 1
        fi
        set_port_visibility $2 $3
        ;;
    
    *)
        echo "Nexus Weaver Port Manager for GitHub Codespaces"
        echo ""
        echo "Usage:"
        echo "  $0 public     - Make Dashboard (3000) and API (8080) public"
        echo "  $0 private    - Make all ports private"
        echo "  $0 list       - List all port configurations"
        echo "  $0 custom <port> <visibility> - Set specific port visibility"
        echo ""
        echo "Visibility options: public, private, org"
        echo ""
        echo "Current Codespace: $CODESPACE_NAME"
        ;;
esac