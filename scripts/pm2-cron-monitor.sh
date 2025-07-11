#!/bin/bash

# PM2 Auto-Close Tickets Monitor
# Usage: ./scripts/pm2-cron-monitor.sh [status|logs|restart|stop|start]

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

# Function to show status
show_status() {
    log_info "📊 PM2 Auto-Close Tickets Status"
    echo ""
    
    # Show all processes
    log_info "All PM2 Processes:"
    pm2 list
    echo ""
    
    # Show specific auto-close processes
    log_info "Auto-Close Specific Processes:"
    pm2 jlist | jq '.[] | select(.name | contains("auto-close") or contains("sdm-app")) | {name: .name, status: .pm2_env.status, uptime: .pm2_env.pm_uptime, memory: .pm2_env.memory, cpu: .pm2_env.cpu, restart: .pm2_env.restart_time}' 2>/dev/null || pm2 list | grep -E "(auto-close|sdm-app)"
    echo ""
    
    # Check last runs
    log_info "Recent Log Entries:"
    if [ -f "./logs/auto-close-cron.log" ]; then
        echo "Last Auto-Close Run:"
        tail -n 5 ./logs/auto-close-cron.log
        echo ""
    fi
    
    if [ -f "./logs/health-check.log" ]; then
        echo "Last Health Check:"
        tail -n 3 ./logs/health-check.log
        echo ""
    fi
}

# Function to show logs
show_logs() {
    local service="${1:-all}"
    
    case $service in
        "cron"|"auto-close")
            log_info "📋 Auto-Close Cron Logs (last 50 lines):"
            pm2 logs auto-close-tickets-cron --lines 50
            ;;
        "health"|"health-check")
            log_info "📋 Health Check Logs (last 50 lines):"
            pm2 logs auto-close-health-check --lines 50
            ;;
        "all"|*)
            log_info "📋 All Auto-Close Logs:"
            echo ""
            echo "=== Auto-Close Cron Logs ==="
            pm2 logs auto-close-tickets-cron --lines 20
            echo ""
            echo "=== Health Check Logs ==="
            pm2 logs auto-close-health-check --lines 20
            ;;
    esac
}

# Function to restart services
restart_services() {
    local service="${1:-all}"
    
    case $service in
        "cron"|"auto-close")
            log_info "🔄 Restarting Auto-Close Cron..."
            pm2 restart auto-close-tickets-cron
            log_success "Auto-Close Cron restarted"
            ;;
        "health"|"health-check")
            log_info "🔄 Restarting Health Check..."
            pm2 restart auto-close-health-check
            log_success "Health Check restarted"
            ;;
        "all"|*)
            log_info "🔄 Restarting All Auto-Close Services..."
            pm2 restart auto-close-tickets-cron auto-close-health-check
            log_success "All services restarted"
            ;;
    esac
}

# Function to stop services
stop_services() {
    local service="${1:-all}"
    
    case $service in
        "cron"|"auto-close")
            log_info "⏹️ Stopping Auto-Close Cron..."
            pm2 stop auto-close-tickets-cron
            log_warning "Auto-Close Cron stopped"
            ;;
        "health"|"health-check")
            log_info "⏹️ Stopping Health Check..."
            pm2 stop auto-close-health-check
            log_warning "Health Check stopped"
            ;;
        "all"|*)
            log_info "⏹️ Stopping All Auto-Close Services..."
            pm2 stop auto-close-tickets-cron auto-close-health-check
            log_warning "All services stopped"
            ;;
    esac
}

# Function to start services
start_services() {
    local service="${1:-all}"
    
    case $service in
        "cron"|"auto-close")
            log_info "▶️ Starting Auto-Close Cron..."
            pm2 start auto-close-tickets-cron
            log_success "Auto-Close Cron started"
            ;;
        "health"|"health-check")
            log_info "▶️ Starting Health Check..."
            pm2 start auto-close-health-check
            log_success "Health Check started"
            ;;
        "all"|*)
            log_info "▶️ Starting All Auto-Close Services..."
            pm2 start auto-close-tickets-cron auto-close-health-check
            log_success "All services started"
            ;;
    esac
}

# Function to run manual test
run_manual_test() {
    local test_type="${1:-preview}"
    
    log_info "🧪 Running Manual Test: $test_type"
    
    # Set environment variables
    export BASE_URL="http://localhost:3001"
    export CRON_SECRET="rsbhayangkaranganjuk"
    export LOG_LEVEL="info"
    export TZ="Asia/Jakarta"
    
    case $test_type in
        "preview")
            node scripts/auto-close-tickets.js preview
            ;;
        "health")
            node scripts/auto-close-tickets.js health
            ;;
        "test"|"dry-run")
            node scripts/auto-close-tickets.js test
            ;;
        "troubleshoot")
            node scripts/troubleshoot-auto-close.js quick
            ;;
        *)
            log_error "Unknown test type: $test_type"
            echo "Available tests: preview, health, test, troubleshoot"
            exit 1
            ;;
    esac
}

# Function to show performance statistics
show_performance() {
    log_info "📈 Performance Statistics"
    echo ""
    
    # Memory usage
    log_info "Memory Usage:"
    pm2 list | grep -E "(auto-close|sdm-app)" | awk '{print $2, $8}' || echo "No processes found"
    echo ""
    
    # Restart count
    log_info "Restart Statistics:"
    pm2 jlist | jq '.[] | select(.name | contains("auto-close")) | {name: .name, restarts: .pm2_env.restart_time, uptime: .pm2_env.pm_uptime}' 2>/dev/null || echo "jq not available for detailed stats"
    echo ""
    
    # Log file sizes
    log_info "Log File Sizes:"
    ls -lh logs/ | grep -E "(auto-close|health-check)" || echo "No log files found"
}

# Function to show schedule info
show_schedule() {
    log_info "📅 Cron Schedule Information"
    echo ""
    echo "Auto-Close Tickets Cron:"
    echo "  Schedule: 0 2 * * * (Daily at 2:00 AM)"
    echo "  Purpose: Close tickets resolved > 3 days"
    echo "  Process: auto-close-tickets-cron"
    echo ""
    echo "Health Check:"
    echo "  Schedule: */30 * * * * (Every 30 minutes)"
    echo "  Purpose: Monitor system health"
    echo "  Process: auto-close-health-check"
    echo ""
    echo "Next scheduled runs (approximate):"
    echo "  Auto-Close: $(date -d 'tomorrow 02:00' '+%Y-%m-%d %H:%M:%S')"
    echo "  Health Check: $(date -d '+30 minutes' '+%Y-%m-%d %H:%M:%S')"
}

# Function to show help
show_help() {
    echo "PM2 Auto-Close Tickets Monitor"
    echo ""
    echo "Usage: $0 [COMMAND] [SERVICE] [OPTIONS]"
    echo ""
    echo "COMMANDS:"
    echo "  status              Show current status of all services"
    echo "  logs [SERVICE]      Show logs for services"
    echo "  restart [SERVICE]   Restart services"
    echo "  stop [SERVICE]      Stop services"
    echo "  start [SERVICE]     Start services"
    echo "  test [TYPE]         Run manual test"
    echo "  performance         Show performance statistics"
    echo "  schedule            Show cron schedule information"
    echo "  help                Show this help message"
    echo ""
    echo "SERVICES:"
    echo "  all                 All auto-close services (default)"
    echo "  cron, auto-close    Auto-close tickets cron job"
    echo "  health, health-check Health check service"
    echo ""
    echo "TEST TYPES:"
    echo "  preview             Show tickets that would be closed"
    echo "  health              Test system health"
    echo "  test, dry-run       Run auto-close with dry run"
    echo "  troubleshoot        Run connection troubleshoot"
    echo ""
    echo "Examples:"
    echo "  $0 status                    # Show all status"
    echo "  $0 logs cron                # Show auto-close logs"
    echo "  $0 restart health           # Restart health check"
    echo "  $0 test preview             # Manual preview test"
    echo "  $0 performance              # Show performance stats"
}

# Main function
main() {
    local command="${1:-status}"
    local service="${2:-all}"
    local option="${3:-}"
    
    case $command in
        "status"|"stat")
            show_status
            ;;
        "logs"|"log")
            show_logs "$service"
            ;;
        "restart"|"reload")
            restart_services "$service"
            ;;
        "stop"|"kill")
            stop_services "$service"
            ;;
        "start"|"run")
            start_services "$service"
            ;;
        "test"|"manual")
            run_manual_test "$service"
            ;;
        "performance"|"perf"|"stats")
            show_performance
            ;;
        "schedule"|"cron"|"time")
            show_schedule
            ;;
        "help"|"--help"|"-h")
            show_help
            ;;
        *)
            log_error "Unknown command: $command"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# Check if PM2 is available
if ! command -v pm2 &> /dev/null; then
    log_error "PM2 is not installed or not in PATH"
    exit 1
fi

# Run main function
main "$@" 