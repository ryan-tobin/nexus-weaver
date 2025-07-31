#!/bin/bash 

echo "Testing Supabase connection..."

if [ -f "services/control-plane/.env.development" ]; then 
    export $(grep -v '^#' services/control-plane/.env.development | xargs )
fi 

if command -v psql &> /dev/null; then 
    echo "Testing database connection..."
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT current_database(), current_schema(), version();"
else 
    echo "psql not found, testing with curl..."
    curl -X GET "$SUPABASE_URL/rest/v1/" \
        -H "apikey: $SUPABASE_ANON_KEY" \
        -H "Authorization: Bearer $SUPABASE_ANON_KEY"
fi 

echo ""
echo "Testing Control Plane health endpoint..."
curl -s http://localhost:8080/actuator/health | jq "." || echo "Control Plane not running"