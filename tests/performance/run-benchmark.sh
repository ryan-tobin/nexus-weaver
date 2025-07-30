#!/bin/bash

# Nexus Weaver Performance Benchmarks
# This script runs performance tests to measure system capabilities

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test configuration
API_BASE_URL="${API_BASE_URL:-http://localhost:8080/api/v1}"
API_USER="${API_USER:-admin}"
API_PASS="${API_PASS:-admin}"
RESULTS_DIR="${RESULTS_DIR:-./results}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Performance test parameters
CONCURRENT_USERS="${CONCURRENT_USERS:-10}"
TEST_DURATION="${TEST_DURATION:-60}" # seconds
RAMP_UP_TIME="${RAMP_UP_TIME:-10}" # seconds

# Create results directory
mkdir -p "$RESULTS_DIR"

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_test() {
    echo -e "\n${BLUE}[BENCHMARK]${NC} $1"
}

# Helper functions
check_dependencies() {
    local deps=("jq" "curl" "bc" "awk")
    
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            log_error "$dep is required but not installed"
            exit 1
        fi
    done
    
    # Check for Apache Bench (ab) or wrk
    if command -v wrk &> /dev/null; then
        LOAD_TOOL="wrk"
    elif command -v ab &> /dev/null; then
        LOAD_TOOL="ab"
    else
        log_error "Either 'wrk' or 'ab' (Apache Bench) is required for load testing"
        exit 1
    fi
    
    log_info "Using $LOAD_TOOL for load testing"
}

# API helper
api_call() {
    local method=$1
    local endpoint=$2
    local data=${3:-}
    
    local start_time=$(date +%s.%N)
    
    if [ -z "$data" ]; then
        response=$(curl -s -X "$method" \
            -u "$API_USER:$API_PASS" \
            -H "Content-Type: application/json" \
            -w "\n%{http_code}" \
            "$API_BASE_URL$endpoint")
    else
        response=$(curl -s -X "$method" \
            -u "$API_USER:$API_PASS" \
            -H "Content-Type: application/json" \
            -d "$data" \
            -w "\n%{http_code}" \
            "$API_BASE_URL$endpoint")
    fi
    
    local end_time=$(date +%s.%N)
    local duration=$(echo "$end_time - $start_time" | bc)
    
    echo "$response|$duration"
}

# Benchmark: API Response Time
benchmark_api_response_time() {
    log_test "API Response Time"
    
    local endpoints=(
        "/deployments"
        "/applications"
        "/actuator/health"
    )
    
    local results_file="$RESULTS_DIR/api_response_time_$TIMESTAMP.csv"
    echo "endpoint,min_ms,max_ms,avg_ms,p50_ms,p95_ms,p99_ms" > "$results_file"
    
    for endpoint in "${endpoints[@]}"; do
        log_info "Testing endpoint: $endpoint"
        
        local times=()
        for i in {1..100}; do
            local result=$(api_call GET "$endpoint")
            local duration=$(echo "$result" | cut -d'|' -f2)
            times+=("$duration")
        done
        
        # Calculate statistics
        local sorted_times=($(printf '%s\n' "${times[@]}" | sort -n))
        local count=${#times[@]}
        
        local min=$(echo "${sorted_times[0]} * 1000" | bc)
        local max=$(echo "${sorted_times[$count-1]} * 1000" | bc)
        
        # Calculate average
        local sum=0
        for time in "${times[@]}"; do
            sum=$(echo "$sum + $time" | bc)
        done
        local avg=$(echo "scale=2; ($sum / $count) * 1000" | bc)
        
        # Calculate percentiles
        local p50_idx=$((count * 50 / 100))
        local p95_idx=$((count * 95 / 100))
        local p99_idx=$((count * 99 / 100))
        
        local p50=$(echo "${sorted_times[$p50_idx]} * 1000" | bc)
        local p95=$(echo "${sorted_times[$p95_idx]} * 1000" | bc)
        local p99=$(echo "${sorted_times[$p99_idx]} * 1000" | bc)
        
        echo "$endpoint,$min,$max,$avg,$p50,$p95,$p99" >> "$results_file"
        
        log_info "  Min: ${min}ms, Max: ${max}ms, Avg: ${avg}ms, P95: ${p95}ms"
    done
    
    log_info "Results saved to: $results_file"
}

# Benchmark: Deployment Creation Time
benchmark_deployment_creation() {
    log_test "Deployment Creation Time"
    
    local results_file="$RESULTS_DIR/deployment_creation_$TIMESTAMP.csv"
    echo "test_num,creation_time_ms,deployment_time_ms,total_time_ms,status" > "$results_file"
    
    for i in {1..20}; do
        local deployment_data="{
            \"applicationName\": \"perf-test-$i-$TIMESTAMP\",
            \"version\": \"1.0.0\",
            \"services\": [{
                \"name\": \"service\",
                \"language\": \"python\",
                \"command\": \"echo Performance test $i\"
            }]
        }"
        
        # Measure creation time
        local start_time=$(date +%s.%N)
        local result=$(api_call POST "/deployments" "$deployment_data")
        local creation_time=$(echo "$result" | cut -d'|' -f2)
        
        local response=$(echo "$result" | cut -d'|' -f1 | head -n -1)
        local deployment_id=$(echo "$response" | jq -r '.id')
        
        if [ -n "$deployment_id" ] && [ "$deployment_id" != "null" ]; then
            # Wait for deployment to complete
            local deployed=false
            local deploy_start=$(date +%s.%N)
            
            for j in {1..30}; do
                local status_result=$(api_call GET "/deployments/$deployment_id")
                local status=$(echo "$status_result" | cut -d'|' -f1 | head -n -1 | jq -r '.status')
                
                if [ "$status" == "DEPLOYED" ]; then
                    deployed=true
                    break
                fi
                sleep 1
            done
            
            local deploy_end=$(date +%s.%N)
            local deployment_time=$(echo "($deploy_end - $deploy_start) * 1000" | bc)
            local total_time=$(echo "($deploy_end - $start_time) * 1000" | bc)
            
            echo "$i,$creation_time,$deployment_time,$total_time,$status" >> "$results_file"
            
            # Cleanup
            api_call DELETE "/deployments/$deployment_id" > /dev/null 2>&1
            
            log_info "Test $i: Creation: ${creation_time}ms, Deployment: ${deployment_time}ms, Total: ${total_time}ms"
        else
            echo "$i,$creation_time,0,0,FAILED" >> "$results_file"
            log_error "Test $i: Failed to create deployment"
        fi
    done
    
    log_info "Results saved to: $results_file"
}

# Benchmark: Concurrent Load Test
benchmark_concurrent_load() {
    log_test "Concurrent Load Test"
    
    local results_file="$RESULTS_DIR/load_test_$TIMESTAMP.txt"
    
    if [ "$LOAD_TOOL" == "wrk" ]; then
        log_info "Running load test with wrk..."
        log_info "Duration: ${TEST_DURATION}s, Threads: ${CONCURRENT_USERS}"
        
        # Create a simple lua script for wrk
        cat > /tmp/wrk_script.lua << 'EOF'
wrk.method = "GET"
wrk.headers["Authorization"] = "Basic YWRtaW46YWRtaW4="  -- admin:admin base64

request = function()
    return wrk.format("GET", "/api/v1/deployments")
end
EOF
        
        wrk -t"$CONCURRENT_USERS" -c"$CONCURRENT_USERS" -d"${TEST_DURATION}s" \
            --script /tmp/wrk_script.lua \
            --latency \
            "$API_BASE_URL/deployments" > "$results_file" 2>&1
        
        # Extract key metrics
        local req_sec=$(grep "Requests/sec:" "$results_file" | awk '{print $2}')
        local avg_latency=$(grep "Latency" "$results_file" | awk '{print $2}')
        
        log_info "Requests/sec: $req_sec"
        log_info "Average Latency: $avg_latency"
        
    elif [ "$LOAD_TOOL" == "ab" ]; then
        log_info "Running load test with Apache Bench..."
        log_info "Requests: 1000, Concurrency: ${CONCURRENT_USERS}"
        
        ab -n 1000 -c "$CONCURRENT_USERS" \
            -A "$API_USER:$API_PASS" \
            -H "Accept: application/json" \
            "$API_BASE_URL/deployments" > "$results_file" 2>&1
        
        # Extract key metrics
        local req_sec=$(grep "Requests per second:" "$results_file" | awk '{print $4}')
        local mean_time=$(grep "Time per request:" "$results_file" | head -1 | awk '{print $4}')
        
        log_info "Requests/sec: $req_sec"
        log_info "Mean time per request: ${mean_time}ms"
    fi
    
    log_info "Results saved to: $results_file"
}

# Benchmark: Resource Usage
benchmark_resource_usage() {
    log_test "Resource Usage During Load"
    
    local results_file="$RESULTS_DIR/resource_usage_$TIMESTAMP.csv"
    echo "timestamp,cpu_percent,memory_mb,open_files,threads" > "$results_file"
    
    # Find Control Plane PID
    local control_plane_pid=$(pgrep -f "spring-boot:run" | head -1)
    
    if [ -z "$control_plane_pid" ]; then
        log_warn "Control Plane process not found, skipping resource monitoring"
        return
    fi
    
    log_info "Monitoring Control Plane PID: $control_plane_pid"
    
    # Create background deployments to generate load
    for i in {1..5}; do
        local deployment_data="{
            \"applicationName\": \"resource-test-$i-$TIMESTAMP\",
            \"version\": \"1.0.0\",
            \"services\": [{
                \"name\": \"service\",
                \"language\": \"python\",
                \"command\": \"sleep 30\"
            }]
        }"
        
        api_call POST "/deployments" "$deployment_data" > /dev/null 2>&1 &
    done
    
    # Monitor for 30 seconds
    for i in {1..30}; do
        local timestamp=$(date +%s)
        
        # Get CPU usage
        local cpu=$(ps -p "$control_plane_pid" -o %cpu= | tr -d ' ')
        
        # Get memory usage (RSS in KB)
        local memory_kb=$(ps -p "$control_plane_pid" -o rss= | tr -d ' ')
        local memory_mb=$((memory_kb / 1024))
        
        # Get open files
        local open_files=$(lsof -p "$control_plane_pid" 2>/dev/null | wc -l)
        
        # Get thread count
        local threads=$(ps -p "$control_plane_pid" -o nlwp= | tr -d ' ')
        
        echo "$timestamp,$cpu,$memory_mb,$open_files,$threads" >> "$results_file"
        
        sleep 1
    done
    
    # Cleanup test deployments
    local deployments=$(api_call GET "/deployments" | cut -d'|' -f1 | head -n -1 | \
        jq -r '.[] | select(.applicationName | startswith("resource-test-")) | .id')
    
    for deployment_id in $deployments; do
        api_call DELETE "/deployments/$deployment_id" > /dev/null 2>&1
    done
    
    log_info "Results saved to: $results_file"
}

# Benchmark: Kernel Process Management
benchmark_kernel_performance() {
    log_test "Kernel Process Management Performance"
    
    local results_file="$RESULTS_DIR/kernel_performance_$TIMESTAMP.csv"
    echo "test_type,processes,time_ms,success_rate" > "$results_file"
    
    # Test 1: Sequential process creation
    log_info "Testing sequential process creation..."
    local start_time=$(date +%s.%N)
    local success=0
    
    for i in {1..50}; do
        local deployment_data="{
            \"applicationName\": \"kernel-seq-$i-$TIMESTAMP\",
            \"version\": \"1.0.0\",
            \"services\": [{
                \"name\": \"proc-$i\",
                \"language\": \"python\",
                \"command\": \"echo Sequential test $i\"
            }]
        }"
        
        local result=$(api_call POST "/deployments" "$deployment_data")
        local deployment_id=$(echo "$result" | cut -d'|' -f1 | head -n -1 | jq -r '.id')
        
        if [ -n "$deployment_id" ] && [ "$deployment_id" != "null" ]; then
            ((success++))
        fi
    done
    
    local end_time=$(date +%s.%N)
    local duration=$(echo "($end_time - $start_time) * 1000" | bc)
    local success_rate=$(echo "scale=2; ($success / 50) * 100" | bc)
    
    echo "sequential,50,$duration,$success_rate" >> "$results_file"
    log_info "Sequential: 50 processes in ${duration}ms, Success rate: ${success_rate}%"
    
    # Cleanup
    sleep 2
    local deployments=$(api_call GET "/deployments" | cut -d'|' -f1 | head -n -1 | \
        jq -r '.[] | select(.applicationName | startswith("kernel-seq-")) | .id')
    
    for deployment_id in $deployments; do
        api_call DELETE "/deployments/$deployment_id" > /dev/null 2>&1
    done
    
    # Test 2: Concurrent process creation
    log_info "Testing concurrent process creation..."
    start_time=$(date +%s.%N)
    success=0
    
    for i in {1..20}; do
        (
            local deployment_data="{
                \"applicationName\": \"kernel-con-$i-$TIMESTAMP\",
                \"version\": \"1.0.0\",
                \"services\": [{
                    \"name\": \"proc-$i\",
                    \"language\": \"python\",
                    \"command\": \"echo Concurrent test $i\"
                }]
            }"
            
            api_call POST "/deployments" "$deployment_data" > /dev/null 2>&1
        ) &
    done
    
    wait
    
    end_time=$(date +%s.%N)
    duration=$(echo "($end_time - $start_time) * 1000" | bc)
    
    # Count successful deployments
    deployments=$(api_call GET "/deployments" | cut -d'|' -f1 | head -n -1 | \
        jq -r '.[] | select(.applicationName | startswith("kernel-con-")) | .id')
    
    success=$(echo "$deployments" | grep -c .)
    success_rate=$(echo "scale=2; ($success / 20) * 100" | bc)
    
    echo "concurrent,20,$duration,$success_rate" >> "$results_file"
    log_info "Concurrent: 20 processes in ${duration}ms, Success rate: ${success_rate}%"
    
    # Cleanup
    for deployment_id in $deployments; do
        api_call DELETE "/deployments/$deployment_id" > /dev/null 2>&1
    done
    
    log_info "Results saved to: $results_file"
}

# Generate summary report
generate_summary_report() {
    local report_file="$RESULTS_DIR/performance_summary_$TIMESTAMP.md"
    
    cat > "$report_file" << EOF
# Nexus Weaver Performance Test Summary

**Test Date**: $(date)
**Environment**: $API_BASE_URL

## Test Configuration
- Concurrent Users: $CONCURRENT_USERS
- Test Duration: ${TEST_DURATION}s
- Load Tool: $LOAD_TOOL

## Results Summary

### API Response Times
$(if [ -f "$RESULTS_DIR/api_response_time_$TIMESTAMP.csv" ]; then
    echo "| Endpoint | Min (ms) | Max (ms) | Avg (ms) | P95 (ms) |"
    echo "|----------|----------|----------|----------|----------|"
    tail -n +2 "$RESULTS_DIR/api_response_time_$TIMESTAMP.csv" | \
    awk -F',' '{printf "| %s | %.2f | %.2f | %.2f | %.2f |\n", $1, $2, $3, $4, $6}'
fi)

### Deployment Performance
$(if [ -f "$RESULTS_DIR/deployment_creation_$TIMESTAMP.csv" ]; then
    local total_tests=$(tail -n +2 "$RESULTS_DIR/deployment_creation_$TIMESTAMP.csv" | wc -l)
    local successful=$(tail -n +2 "$RESULTS_DIR/deployment_creation_$TIMESTAMP.csv" | grep -c "DEPLOYED")
    local avg_total=$(tail -n +2 "$RESULTS_DIR/deployment_creation_$TIMESTAMP.csv" | \
        awk -F',' '{sum+=$4; count++} END {print sum/count}')
    echo "- Total Tests: $total_tests"
    echo "- Successful: $successful"
    echo "- Average Total Time: ${avg_total}ms"
fi)

### Load Test Results
$(if [ -f "$RESULTS_DIR/load_test_$TIMESTAMP.txt" ]; then
    if [ "$LOAD_TOOL" == "wrk" ]; then
        grep -E "Requests/sec:|Latency|Transfer/sec:" "$RESULTS_DIR/load_test_$TIMESTAMP.txt"
    else
        grep -E "Requests per second:|Time per request:|Transfer rate:" "$RESULTS_DIR/load_test_$TIMESTAMP.txt"
    fi
fi)

### Resource Usage
$(if [ -f "$RESULTS_DIR/resource_usage_$TIMESTAMP.csv" ]; then
    local max_cpu=$(tail -n +2 "$RESULTS_DIR/resource_usage_$TIMESTAMP.csv" | \
        awk -F',' '{if($2>max)max=$2} END {print max}')
    local max_memory=$(tail -n +2 "$RESULTS_DIR/resource_usage_$TIMESTAMP.csv" | \
        awk -F',' '{if($3>max)max=$3} END {print max}')
    echo "- Peak CPU Usage: ${max_cpu}%"
    echo "- Peak Memory Usage: ${max_memory}MB"
fi)

### Kernel Performance
$(if [ -f "$RESULTS_DIR/kernel_performance_$TIMESTAMP.csv" ]; then
    echo "| Test Type | Processes | Time (ms) | Success Rate |"
    echo "|-----------|-----------|-----------|--------------|"
    tail -n +2 "$RESULTS_DIR/kernel_performance_$TIMESTAMP.csv" | \
    awk -F',' '{printf "| %s | %s | %.2f | %s%% |\n", $1, $2, $3, $4}'
fi)

## Recommendations

Based on the performance tests:
$(
if [ -f "$RESULTS_DIR/api_response_time_$TIMESTAMP.csv" ]; then
    local avg_response=$(tail -n +2 "$RESULTS_DIR/api_response_time_$TIMESTAMP.csv" | \
        awk -F',' '{sum+=$4; count++} END {print sum/count}')
    if (( $(echo "$avg_response > 100" | bc -l) )); then
        echo "- ⚠️ API response times are high. Consider caching or query optimization."
    else
        echo "- ✅ API response times are within acceptable range."
    fi
fi
)

---
Generated by Nexus Weaver Performance Test Suite
EOF
    
    log_info "Summary report saved to: $report_file"
}

# Main execution
main() {
    log_info "Starting Nexus Weaver Performance Benchmarks"
    log_info "Results will be saved to: $RESULTS_DIR"
    
    # Check dependencies
    check_dependencies
    
    # Verify services are running
    if ! curl -s -f "$API_BASE_URL/../actuator/health" > /dev/null 2>&1; then
        log_error "Control Plane is not accessible. Please ensure all services are running."
        exit 1
    fi
    
    # Run benchmarks
    benchmark_api_response_time
    benchmark_deployment_creation
    benchmark_concurrent_load
    benchmark_resource_usage
    benchmark_kernel_performance
    
    # Generate summary report
    generate_summary_report
    
    log_info "Performance benchmarks completed!"
    log_info "Results directory: $RESULTS_DIR"
}

# Run main function
main "$@"