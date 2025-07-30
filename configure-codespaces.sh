#!/bin/bash

# Configure Nexus Weaver for GitHub Codespaces

if [ -z "$CODESPACE_NAME" ]; then
    echo "This script must be run in a GitHub Codespace"
    exit 1
fi

echo "🔧 Configuring Nexus Weaver for GitHub Codespaces..."

# Configure dashboard environment
API_URL="https://${CODESPACE_NAME}-8080.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}/api/v1"

echo "Creating dashboard environment configuration..."
cat > services/dashboard/.env.local << EOF
# Auto-generated for GitHub Codespaces
VITE_API_URL=$API_URL
EOF

echo "Dashboard configured to use API at: $API_URL"

# Update CORS configuration if needed
echo ""
echo " Note: The Control Plane already includes wildcard CORS for *.app.github.dev"
echo "   No additional CORS configuration needed!"

echo ""
echo "Configuration complete!"
echo ""
echo "Next steps:"
echo "1. Run: ./manage-ports.sh public"
echo "2. Run: ./start-all-services.sh"
echo "3. Access your dashboard at: https://${CODESPACE_NAME}-3000.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"