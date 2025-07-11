#!/bin/bash

# PM2 Auto-Close Tickets Deployment Script (Direct Database Version)
# Usage: ./scripts/deploy-pm2-cron-direct.sh [development|production]

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
LOGS_DIR="$PROJECT_DIR/logs"
ECOSYSTEM_CONFIG="$PROJECT_DIR/ecosystem.config.js"
DIRECT_SCRIPT="$PROJECT_DIR/scripts/auto-close-tickets-direct.js"
DB_ADAPTER="$PROJECT_DIR/scripts/db-adapter.js"
MONITORING_SCRIPT="$PROJECT_DIR/scripts/pm2-cron-monitor-direct.sh"

# Logging functions
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

# Environment detection
ENVIRONMENT="${1:-development}"

if [[ "$ENVIRONMENT" != "development" && "$ENVIRONMENT" != "production" ]]; then
    log_error "Invalid environment. Use 'development' or 'production'"
    exit 1
fi

log_info "🚀 Deploying PM2 Auto-Close Tickets (Direct Database) for $ENVIRONMENT"

# Function to check prerequisites
check_prerequisites() {
    log_info "📋 Checking prerequisites..."
    
    # Check if PM2 is installed
    if ! command -v pm2 &> /dev/null; then
        log_error "PM2 is not installed. Please install PM2 first:"
        echo "  npm install -g pm2"
        exit 1
    fi
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        exit 1
    fi
    
    # Check if required files exist
    if [ ! -f "$ECOSYSTEM_CONFIG" ]; then
        log_error "Ecosystem config file not found: $ECOSYSTEM_CONFIG"
        exit 1
    fi
    
    if [ ! -f "$DIRECT_SCRIPT" ]; then
        log_error "Direct database script not found: $DIRECT_SCRIPT"
        exit 1
    fi
    
    if [ ! -f "$DB_ADAPTER" ]; then
        log_error "Database adapter not found: $DB_ADAPTER"
        exit 1
    fi
    
    # Check if .env file exists
    if [ ! -f "$PROJECT_DIR/.env" ]; then
        log_error ".env file not found. Please create .env file with database configuration"
        exit 1
    fi
    
    log_success "All prerequisites met"
}

# Function to setup environment
setup_environment() {
    log_info "🔧 Setting up environment..."
    
    # Create logs directory if it doesn't exist
    mkdir -p "$LOGS_DIR"
    
    # Make scripts executable
    chmod +x "$DIRECT_SCRIPT"
    chmod +x "$MONITORING_SCRIPT"
    
    # Load environment variables for testing
    set -a
    source "$PROJECT_DIR/.env"
    set +a
    
    log_success "Environment setup complete"
}

# Function to test database connection
test_database_connection() {
    log_info "🗄️ Testing database connection..."
    
    # Load environment variables
    export $(cat "$PROJECT_DIR/.env" | grep -v '^#' | xargs)
    
    # Test database connection
    if node "$DIRECT_SCRIPT" health > /dev/null 2>&1; then
        log_success "Database connection successful"
    else
        log_error "Database connection failed"
        log_warning "Please check your database configuration in .env file"
        exit 1
    fi
}

# Function to test scripts
test_scripts() {
    log_info "🧪 Testing scripts..."
    
    # Load environment variables
    export $(cat "$PROJECT_DIR/.env" | grep -v '^#' | xargs)
    
    # Test health check
    log_info "Testing health check..."
    if node "$DIRECT_SCRIPT" health > /dev/null 2>&1; then
        log_success "Health check passed"
    else
        log_error "Health check failed"
        exit 1
    fi
    
    # Test preview functionality
    log_info "Testing preview functionality..."
    if node "$DIRECT_SCRIPT" preview > /dev/null 2>&1; then
        log_success "Preview test passed"
    else
        log_error "Preview test failed"
        exit 1
    fi
    
    # Test dry run
    log_info "Testing dry run..."
    if node "$DIRECT_SCRIPT" dry-run > /dev/null 2>&1; then
        log_success "Dry run test passed"
    else
        log_error "Dry run test failed"
        exit 1
    fi
    
    log_success "All script tests passed"
}

# Function to stop existing processes
stop_existing_processes() {
    log_info "⏹️ Stopping existing auto-close processes..."
    
    # Stop auto-close processes if they exist
    pm2 stop auto-close-tickets-cron 2>/dev/null || true
    pm2 stop auto-close-health-check 2>/dev/null || true
    
    # Delete processes
    pm2 delete auto-close-tickets-cron 2>/dev/null || true
    pm2 delete auto-close-health-check 2>/dev/null || true
    
    log_success "Existing processes stopped"
}

# Function to deploy PM2 processes
deploy_pm2_processes() {
    log_info "🚀 Deploying PM2 processes..."
    
    # Start PM2 processes with the specified environment
    if pm2 start "$ECOSYSTEM_CONFIG" --env "$ENVIRONMENT" --only auto-close-tickets-cron,auto-close-health-check; then
        log_success "PM2 processes deployed successfully"
    else
        log_error "Failed to deploy PM2 processes"
        exit 1
    fi
    
    # Save PM2 configuration
    pm2 save
    
    log_success "PM2 configuration saved"
}

# Function to verify deployment
verify_deployment() {
    log_info "✅ Verifying deployment..."
    
    # Wait a moment for processes to start
    sleep 3
    
    # Check if processes are running
    if pm2 list | grep -q "auto-close-tickets-cron.*online"; then
        log_success "Auto-close cron process is online"
    else
        log_error "Auto-close cron process is not running"
        exit 1
    fi
    
    if pm2 list | grep -q "auto-close-health-check.*online"; then
        log_success "Health check process is online"
    else
        log_error "Health check process is not running"
        exit 1
    fi
    
    # Test monitoring script
    if "$MONITORING_SCRIPT" status > /dev/null 2>&1; then
        log_success "Monitoring script is working"
    else
        log_warning "Monitoring script may have issues"
    fi
    
    log_success "Deployment verification complete"
}

# Function to show deployment summary
show_deployment_summary() {
    log_info "📊 Deployment Summary"
    echo ""
    echo "Environment: $ENVIRONMENT"
    echo "Direct Database: ✓ Enabled (no API dependency)"
    echo "Authentication: ✓ Not required"
    echo "Scripts:"
    echo "  • Auto-close: $DIRECT_SCRIPT"
    echo "  • DB Adapter: $DB_ADAPTER"
    echo "  • Monitoring: $MONITORING_SCRIPT"
    echo ""
    echo "PM2 Processes:"
    pm2 list | grep -E "(auto-close|sdm-app)" || echo "  No auto-close processes found"
    echo ""
    echo "Configuration:"
    echo "  • Auto-close schedule: Daily at 2:00 AM"
    echo "  • Health check: Every 30 minutes"
    echo "  • Days to wait: 3 days"
    echo "  • Batch size: $([ "$ENVIRONMENT" = "development" ] && echo "10" || echo "50")"
    echo "  • Dry run: $([ "$ENVIRONMENT" = "development" ] && echo "true" || echo "false")"
    echo ""
    echo "Next Steps:"
    echo "  1. Monitor logs: pm2 logs auto-close-tickets-cron"
    echo "  2. Check status: $MONITORING_SCRIPT status"
    echo "  3. Manual test: $MONITORING_SCRIPT test preview"
    echo "  4. Performance: $MONITORING_SCRIPT performance"
    echo ""
    log_success "Deployment completed successfully!"
}

# Function to handle cleanup on exit
cleanup() {
    log_info "🧹 Cleaning up..."
    # Any cleanup tasks if needed
}

# Trap cleanup function on script exit
trap cleanup EXIT

# Main execution
main() {
    echo "════════════════════════════════════════════════════════════════"
    echo "   PM2 Auto-Close Tickets Deployment (Direct Database Version)"
    echo "════════════════════════════════════════════════════════════════"
    echo ""
    
    # Change to project directory
    cd "$PROJECT_DIR"
    
    # Execute deployment steps
    check_prerequisites
    setup_environment
    test_database_connection
    test_scripts
    stop_existing_processes
    deploy_pm2_processes
    verify_deployment
    show_deployment_summary
    
    echo ""
    echo "════════════════════════════════════════════════════════════════"
    echo "   Deployment Complete!"
    echo "════════════════════════════════════════════════════════════════"
}

# Run main function
main "$@" 