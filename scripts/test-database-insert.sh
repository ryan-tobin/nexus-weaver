#!/bin/bash

echo "Testing Supabase database with test application insertion..."

# Load environment variables
if [ -f "services/control-plane/.env.development" ]; then 
    export $(grep -v '^#' services/control-plane/.env.development | xargs)
fi 

# Generate a test UUID for user_id
TEST_USER_ID=$(uuidgen)

echo "Inserting test application..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME << EOF
-- Insert test application (without user_id to avoid foreign key constraint)
INSERT INTO nexusweaver.applications (name, description, created_at, updated_at) 
VALUES (
    'test-app-$(date +%s)', 
    'Test application created by script at $(date)',
    NOW(),
    NOW()
);

-- Query the inserted application
SELECT 
    id,
    name,
    user_id,
    description,
    created_at,
    updated_at
FROM nexusweaver.applications 
WHERE name LIKE 'test-app-%'
ORDER BY created_at DESC 
LIMIT 3;

-- Show total count of applications
SELECT COUNT(*) as total_applications FROM nexusweaver.applications;
EOF

echo ""
echo "Test completed!"