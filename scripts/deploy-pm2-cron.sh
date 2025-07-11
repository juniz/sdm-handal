#!/bin/bash

# Deploy PM2 Auto-Close Tickets Cron Job
# Usage: ./scripts/deploy-pm2-cron.sh [development|production]

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENVIRONMENT="${1:-production}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if PM2 is installed
check_pm2() {
    if ! command -v pm2 &> /dev/null; then
        log_error "PM2 is not installed. Please install PM2 first:"
        echo "npm install -g pm2"
        exit 1
    fi
    log_success "PM2 is installed"
}

# Function to validate environment
validate_environment() {
    if [[ "$ENVIRONMENT" != "development" && "$ENVIRONMENT" != "production" ]]; then
        log_error "Invalid environment: $ENVIRONMENT"
        echo "Usage: $0 [development|production]"
        exit 1
    fi
    log_info "Environment: $ENVIRONMENT"
}

# Function to create logs directory
create_logs_directory() {
    log_info "Creating logs directory..."
    mkdir -p "$PROJECT_DIR/logs"
    chmod 755 "$PROJECT_DIR/logs"
    log_success "Logs directory created"
}

# Function to make scripts executable
make_scripts_executable() {
    log_info "Making scripts executable..."
    chmod +x "$PROJECT_DIR/scripts/auto-close-tickets.js"
    chmod +x "$PROJECT_DIR/scripts/troubleshoot-auto-close.js"
    log_success "Scripts are now executable"
}

# Function to test scripts before deployment
test_scripts() {
    log_info "Testing scripts before deployment..."
    
    cd "$PROJECT_DIR"
    
    # Test health check
    if [[ "$ENVIRONMENT" == "development" ]]; then
        export NODE_TLS_REJECT_UNAUTHORIZED=0
        export BASE_URL="https://localhost:3000"
    else
        export BASE_URL="http://localhost:3001"
    fi
    
    export CRON_SECRET="rsbhayangkaranganjuk"
    export LOG_LEVEL="info"
    export TZ="Asia/Jakarta"
    
    log_info "Testing health check..."
    if node scripts/auto-close-tickets.js health; then
        log_success "Health check passed"
    else
        log_warning "Health check failed - this might be expected if the main app is not running"
    fi
    
    log_info "Testing preview..."
    if node scripts/auto-close-tickets.js preview; then
        log_success "Preview test passed"
    else
        log_warning "Preview test failed - this might be expected if the main app is not running"
    fi
}

# Function to stop existing cron jobs
stop_existing_jobs() {
    log_info "Stopping existing auto-close cron jobs..."
    
    # Stop and delete existing processes
    pm2 delete auto-close-tickets-cron 2>/dev/null || log_warning "auto-close-tickets-cron was not running"
    pm2 delete auto-close-health-check 2>/dev/null || log_warning "auto-close-health-check was not running"
    
    log_success "Existing cron jobs stopped"
}

# Function to start PM2 ecosystem
start_pm2_ecosystem() {
    log_info "Starting PM2 ecosystem with environment: $ENVIRONMENT"
    
    cd "$PROJECT_DIR"
    
    if [[ "$ENVIRONMENT" == "development" ]]; then
        pm2 start ecosystem.config.js --env development --only auto-close-tickets-cron,auto-close-health-check
    else
        pm2 start ecosystem.config.js --env production --only auto-close-tickets-cron,auto-close-health-check
    fi
    
    log_success "PM2 cron jobs started"
}

# Function to show PM2 status
show_pm2_status() {
    log_info "PM2 Process Status:"
    pm2 list
    
    log_info "\nAuto-Close Cron Jobs:"
    pm2 list | grep -E "(auto-close|sdm-app)" || log_warning "No auto-close processes found"
}

# Function to setup monitoring
setup_monitoring() {
    log_info "Setting up PM2 monitoring..."
    
    # Save PM2 configuration
    pm2 save
    
    # Setup PM2 startup script
    if command -v systemctl &> /dev/null; then
        log_info "Setting up PM2 startup script for systemd..."
        sudo env PATH=$PATH:/usr/local/bin pm2 startup systemd -u $USER --hp $HOME
    else
        log_warning "systemctl not found, skipping startup script setup"
    fi
    
    log_success "PM2 monitoring setup completed"
}

# Function to show logs location
show_logs_info() {
    log_info "\n📋 Log Files Location:"
    echo "  Main App Logs:"
    echo "    - Combined: $PROJECT_DIR/logs/combined.log"
    echo "    - Output:   $PROJECT_DIR/logs/out.log"
    echo "    - Error:    $PROJECT_DIR/logs/error.log"
    echo ""
    echo "  Auto-Close Cron Logs:"
    echo "    - Combined: $PROJECT_DIR/logs/auto-close-cron.log"
    echo "    - Output:   $PROJECT_DIR/logs/auto-close-out.log"
    echo "    - Error:    $PROJECT_DIR/logs/auto-close-error.log"
    echo ""
    echo "  Health Check Logs:"
    echo "    - Combined: $PROJECT_DIR/logs/health-check.log"
    echo "    - Output:   $PROJECT_DIR/logs/health-check-out.log"
    echo "    - Error:    $PROJECT_DIR/logs/health-check-error.log"
    echo ""
    log_info "📊 Useful Commands:"
    echo "  # View all PM2 processes"
    echo "  pm2 list"
    echo ""
    echo "  # View logs"
    echo "  pm2 logs auto-close-tickets-cron"
    echo "  pm2 logs auto-close-health-check"
    echo ""
    echo "  # Monitor in real-time"
    echo "  pm2 monit"
    echo ""
    echo "  # Restart specific cron job"
    echo "  pm2 restart auto-close-tickets-cron"
    echo ""
    echo "  # Stop cron jobs"
    echo "  pm2 stop auto-close-tickets-cron auto-close-health-check"
    echo ""
    echo "  # Manual run for testing"
    echo "  node scripts/auto-close-tickets.js preview"
    echo "  node scripts/auto-close-tickets.js test"
}

# Main deployment function
main() {
    log_info "🚀 Starting PM2 Auto-Close Tickets Deployment"
    log_info "Project Directory: $PROJECT_DIR"
    log_info "Environment: $ENVIRONMENT"
    echo ""
    
    # Pre-checks
    validate_environment
    check_pm2
    
    # Setup
    create_logs_directory
    make_scripts_executable
    
    # Test scripts (optional, can be skipped if main app is not running)
    if [[ "${SKIP_TESTS:-false}" != "true" ]]; then
        test_scripts
    else
        log_warning "Skipping tests (SKIP_TESTS=true)"
    fi
    
    # Deployment
    stop_existing_jobs
    start_pm2_ecosystem
    
    # Post-deployment
    show_pm2_status
    setup_monitoring
    show_logs_info
    
    log_success "🎉 PM2 Auto-Close Tickets Deployment Completed!"
    log_info "Cron Schedule:"
    log_info "  - Auto-Close: Daily at 2:00 AM"
    log_info "  - Health Check: Every 30 minutes"
}

# Help function
show_help() {
    echo "PM2 Auto-Close Tickets Deployment Script"
    echo ""
    echo "Usage: $0 [ENVIRONMENT] [OPTIONS]"
    echo ""
    echo "ENVIRONMENT:"
    echo "  development    Deploy for development (default: dry run enabled)"
    echo "  production     Deploy for production (default: dry run disabled)"
    echo ""
    echo "OPTIONS:"
    echo "  --skip-tests   Skip script testing before deployment"
    echo "  --help         Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  SKIP_TESTS=true    Skip script testing"
    echo ""
    echo "Examples:"
    echo "  $0 production                 # Deploy for production"
    echo "  $0 development               # Deploy for development"
    echo "  SKIP_TESTS=true $0 production # Deploy without testing"
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-tests)
            export SKIP_TESTS=true
            shift
            ;;
        --help)
            show_help
            exit 0
            ;;
        -*)
            log_error "Unknown option $1"
            show_help
            exit 1
            ;;
        *)
            ENVIRONMENT="$1"
            shift
            ;;
    esac
done

# Run main function
main 