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
