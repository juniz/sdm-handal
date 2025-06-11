#!/bin/bash

# Load Testing Suite Runner untuk SDM Application
# Usage: ./run-tests.sh [test-type] [options]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$SCRIPT_DIR/logs"
RESULTS_DIR="$SCRIPT_DIR/results"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Create directories if they don't exist
mkdir -p "$LOG_DIR" "$RESULTS_DIR"

# Function to print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${CYAN}================================${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}================================${NC}"
}

# Function to check if application is running
check_app_status() {
    print_info "Checking if SDM application is running..."
    
    if curl -s -k "https://localhost:3000" > /dev/null 2>&1; then
        print_success "Application is running on https://localhost:3000"
        return 0
    elif curl -s "http://localhost:3000" > /dev/null 2>&1; then
        print_success "Application is running on http://localhost:3000"
        return 0
    else
        print_error "Application is not running on localhost:3000"
        print_info "Please start the application first:"
        print_info "  npm run dev"
        print_info "  or"
        print_info "  npm start"
        return 1
    fi
}

# Function to check dependencies
check_dependencies() {
    print_info "Checking dependencies..."
    
    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        return 1
    fi
    
    # Check if package.json exists
    if [ ! -f "$SCRIPT_DIR/package.json" ]; then
        print_error "package.json not found. Please run from load-testing directory"
        return 1
    fi
    
    # Check if node_modules exists
    if [ ! -d "$SCRIPT_DIR/node_modules" ]; then
        print_warning "node_modules not found. Installing dependencies..."
        npm install
    fi
    
    print_success "Dependencies check completed"
}

# Function to run Artillery tests
run_artillery_test() {
    local test_type=$1
    local config_file="artillery-${test_type}.yml"
    
    print_header "Running Artillery ${test_type} Test"
    
    if [ ! -f "$SCRIPT_DIR/$config_file" ]; then
        print_error "Config file $config_file not found"
        return 1
    fi
    
    local log_file="$LOG_DIR/artillery_${test_type}_${TIMESTAMP}.log"
    local report_file="$RESULTS_DIR/artillery_${test_type}_${TIMESTAMP}.json"
    
    print_info "Starting $test_type load test..."
    print_info "Log file: $log_file"
    print_info "Report file: $report_file"
    
    # Run Artillery test
    if npx artillery run "$config_file" --output "$report_file" | tee "$log_file"; then
        print_success "$test_type test completed successfully"
        
        # Generate HTML report if possible
        if command -v artillery &> /dev/null; then
            local html_report="$RESULTS_DIR/artillery_${test_type}_${TIMESTAMP}.html"
            npx artillery report "$report_file" --output "$html_report" 2>/dev/null || true
            if [ -f "$html_report" ]; then
                print_success "HTML report generated: $html_report"
            fi
        fi
        
        return 0
    else
        print_error "$test_type test failed"
        return 1
    fi
}

# Function to run custom Node.js tests
run_custom_test() {
    local test_type=$1
    
    print_header "Running Custom ${test_type} Test"
    
    local script_file
    case $test_type in
        "load")
            script_file="custom-load-test.js"
            ;;
        "attendance")
            script_file="attendance-stress-test.js"
            ;;
        *)
            print_error "Unknown custom test type: $test_type"
            return 1
            ;;
    esac
    
    if [ ! -f "$SCRIPT_DIR/$script_file" ]; then
        print_error "Script file $script_file not found"
        return 1
    fi
    
    local log_file="$LOG_DIR/custom_${test_type}_${TIMESTAMP}.log"
    
    print_info "Starting custom $test_type test..."
    print_info "Log file: $log_file"
    
    if node "$script_file" | tee "$log_file"; then
        print_success "Custom $test_type test completed successfully"
        return 0
    else
        print_error "Custom $test_type test failed"
        return 1
    fi
}

# Function to run K6 tests
run_k6_test() {
    local test_type=$1
    
    print_header "Running K6 ${test_type} Test"
    
    if ! command -v k6 &> /dev/null; then
        print_error "K6 is not installed. Please install it first:"
        print_info "  npm install -g k6"
        print_info "  or visit: https://k6.io/docs/get-started/installation/"
        return 1
    fi
    
    if [ ! -f "$SCRIPT_DIR/k6-script.js" ]; then
        print_error "K6 script file not found"
        return 1
    fi
    
    local log_file="$LOG_DIR/k6_${test_type}_${TIMESTAMP}.log"
    local options=""
    
    case $test_type in
        "light")
            options="--vus 10 --duration 5m"
            ;;
        "medium")
            options="--vus 25 --duration 10m"
            ;;
        "heavy")
            options="--vus 50 --duration 15m"
            ;;
        "stress")
            options="--vus 100 --duration 10m"
            ;;
        *)
            print_error "Unknown K6 test type: $test_type"
            return 1
            ;;
    esac
    
    print_info "Starting K6 $test_type test..."
    print_info "Options: $options"
    print_info "Log file: $log_file"
    
    if k6 run $options "$SCRIPT_DIR/k6-script.js" | tee "$log_file"; then
        print_success "K6 $test_type test completed successfully"
        return 0
    else
        print_error "K6 $test_type test failed"
        return 1
    fi
}

# Function to run all tests
run_all_tests() {
    print_header "Running All Load Tests"
    
    local failed_tests=()
    
    # Artillery tests
    for test in light medium heavy; do
        if ! run_artillery_test "$test"; then
            failed_tests+=("artillery-$test")
        fi
        sleep 30 # Brief pause between tests
    done
    
    # Custom tests
    for test in load attendance; do
        if ! run_custom_test "$test"; then
            failed_tests+=("custom-$test")
        fi
        sleep 30
    done
    
    # K6 tests (if available)
    if command -v k6 &> /dev/null; then
        for test in light medium; do
            if ! run_k6_test "$test"; then
                failed_tests+=("k6-$test")
            fi
            sleep 30
        done
    fi
    
    # Summary
    print_header "Test Summary"
    if [ ${#failed_tests[@]} -eq 0 ]; then
        print_success "All tests completed successfully!"
    else
        print_warning "Some tests failed:"
        for test in "${failed_tests[@]}"; do
            echo "  - $test"
        done
    fi
}

# Function to show system info
show_system_info() {
    print_header "System Information"
    
    echo "Date: $(date)"
    echo "OS: $(uname -s)"
    echo "Architecture: $(uname -m)"
    echo "Node.js version: $(node --version 2>/dev/null || echo 'Not installed')"
    echo "NPM version: $(npm --version 2>/dev/null || echo 'Not installed')"
    echo "Artillery version: $(npx artillery --version 2>/dev/null || echo 'Not installed')"
    echo "K6 version: $(k6 version 2>/dev/null || echo 'Not installed')"
    echo "Working directory: $SCRIPT_DIR"
    echo "Log directory: $LOG_DIR"
    echo "Results directory: $RESULTS_DIR"
    echo ""
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  artillery [light|medium|heavy|stress]  Run Artillery.js tests"
    echo "  custom [load|attendance]               Run custom Node.js tests"
    echo "  k6 [light|medium|heavy|stress]         Run K6 tests"
    echo "  all                                    Run all available tests"
    echo "  check                                  Check system and dependencies"
    echo "  info                                   Show system information"
    echo "  help                                   Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 artillery light         # Run light Artillery test"
    echo "  $0 custom attendance       # Run attendance stress test"
    echo "  $0 k6 heavy               # Run heavy K6 test"
    echo "  $0 all                    # Run all tests"
    echo "  $0 check                  # Check if everything is ready"
    echo ""
}

# Function to cleanup old logs and results
cleanup_old_files() {
    print_info "Cleaning up old files (keeping last 10)..."
    
    # Keep only last 10 log files
    find "$LOG_DIR" -name "*.log" -type f | sort | head -n -10 | xargs rm -f 2>/dev/null || true
    
    # Keep only last 10 result files
    find "$RESULTS_DIR" -name "*.json" -type f | sort | head -n -10 | xargs rm -f 2>/dev/null || true
    find "$RESULTS_DIR" -name "*.html" -type f | sort | head -n -10 | xargs rm -f 2>/dev/null || true
    
    print_success "Cleanup completed"
}

# Main script logic
main() {
    # Show banner
    echo -e "${CYAN}"
    echo "  ___  ____  __  __   _     ___    __    ____     _____ _____ _____ _____ "
    echo " / __|/ ___)(  \/  ) ( )   / __)  /__\  (  _ \   (  _  ) ___ ) ___ | ___ |"
    echo " \__ \\\\___ \ )    (   )( ( (__  /(__)\\ )(_) )   )(_)( |___) |___) |___)"
    echo " (___/(____/(_/\/\_) (___) \\___)(__)(__)(____)(__(_____\___)_)_____)    "
    echo -e "${NC}"
    echo "SDM Load Testing Suite"
    echo ""
    
    # Handle command line arguments
    case "${1:-help}" in
        "artillery")
            show_system_info
            if check_dependencies && check_app_status; then
                run_artillery_test "${2:-light}"
            fi
            ;;
        "custom")
            show_system_info
            if check_dependencies && check_app_status; then
                run_custom_test "${2:-load}"
            fi
            ;;
        "k6")
            show_system_info
            if check_dependencies && check_app_status; then
                run_k6_test "${2:-light}"
            fi
            ;;
        "all")
            show_system_info
            if check_dependencies && check_app_status; then
                run_all_tests
            fi
            ;;
        "check")
            show_system_info
            check_dependencies
            check_app_status
            ;;
        "info")
            show_system_info
            ;;
        "cleanup")
            cleanup_old_files
            ;;
        "help"|*)
            show_usage
            ;;
    esac
}

# Handle Ctrl+C gracefully
trap 'echo -e "\n${YELLOW}Test interrupted by user${NC}"; exit 1' INT

# Run main function
main "$@" 