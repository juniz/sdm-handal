#!/bin/bash

# Health check script untuk monitoring auto-close tickets cron job
# Jalankan dengan: bash scripts/health-check-auto-close.sh

# Konfigurasi
LOG_FILE="logs/auto-close-tickets.log"
PROJECT_ROOT=$(pwd)
ALERT_EMAIL=${ALERT_EMAIL:-""}
SLACK_WEBHOOK=${SLACK_WEBHOOK:-""}

# Warna untuk output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fungsi untuk print dengan warna
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

# Fungsi untuk mengirim alert
send_alert() {
    local message="$1"
    local level="$2"
    
    echo "$(date '+%Y-%m-%d %H:%M:%S') [$level] $message" >> "logs/health-check.log"
    
    # Kirim email jika dikonfigurasi
    if [ -n "$ALERT_EMAIL" ]; then
        echo "$message" | mail -s "Auto-Close Tickets Alert: $level" "$ALERT_EMAIL"
    fi
    
    # Kirim ke Slack jika dikonfigurasi
    if [ -n "$SLACK_WEBHOOK" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚨 Auto-Close Tickets Alert: $level\n$message\"}" \
            "$SLACK_WEBHOOK"
    fi
}

# Fungsi untuk cek apakah cron job berjalan hari ini
check_cron_execution() {
    local today=$(date +%Y-%m-%d)
    
    if [ ! -f "$LOG_FILE" ]; then
        print_error "Log file tidak ditemukan: $LOG_FILE"
        send_alert "Log file tidak ditemukan: $LOG_FILE" "ERROR"
        return 1
    fi
    
    if grep "$today" "$LOG_FILE" | grep -q "Auto-Close Tickets Cron Job Started"; then
        print_success "Cron job telah berjalan hari ini"
        return 0
    else
        print_warning "Cron job belum berjalan hari ini"
        send_alert "Cron job belum berjalan hari ini ($today)" "WARNING"
        return 1
    fi
}

# Fungsi untuk cek error dalam log
check_log_errors() {
    local today=$(date +%Y-%m-%d)
    
    if [ ! -f "$LOG_FILE" ]; then
        return 1
    fi
    
    local error_count=$(grep "$today" "$LOG_FILE" | grep -c "ERROR")
    
    if [ "$error_count" -gt 0 ]; then
        print_error "Ditemukan $error_count error dalam log hari ini"
        
        # Tampilkan error terbaru
        print_info "Error terbaru:"
        grep "$today" "$LOG_FILE" | grep "ERROR" | tail -5
        
        send_alert "Ditemukan $error_count error dalam log hari ini" "ERROR"
        return 1
    else
        print_success "Tidak ada error dalam log hari ini"
        return 0
    fi
}

# Fungsi untuk cek API health
check_api_health() {
    print_info "Melakukan API health check..."
    
    if [ ! -f ".env.cron" ]; then
        print_error "File .env.cron tidak ditemukan"
        send_alert "File .env.cron tidak ditemukan" "ERROR"
        return 1
    fi
    
    # Source environment variables
    source .env.cron
    
    if [ -z "$BASE_URL" ] || [ -z "$CRON_SECRET" ]; then
        print_error "BASE_URL atau CRON_SECRET tidak ditemukan dalam .env.cron"
        send_alert "Environment variables tidak lengkap" "ERROR"
        return 1
    fi
    
    # Test API endpoint
    local response=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "Authorization: Bearer $CRON_SECRET" \
        "$BASE_URL/api/ticket/auto-close")
    
    if [ "$response" -eq 200 ]; then
        print_success "API health check berhasil"
        return 0
    else
        print_error "API health check gagal (HTTP $response)"
        send_alert "API health check gagal (HTTP $response)" "ERROR"
        return 1
    fi
}

# Fungsi untuk cek disk space
check_disk_space() {
    local log_dir=$(dirname "$LOG_FILE")
    local usage=$(df "$log_dir" | tail -1 | awk '{print $5}' | sed 's/%//')
    
    if [ "$usage" -gt 90 ]; then
        print_error "Disk space hampir penuh: ${usage}%"
        send_alert "Disk space hampir penuh: ${usage}%" "ERROR"
        return 1
    elif [ "$usage" -gt 80 ]; then
        print_warning "Disk space tinggi: ${usage}%"
        send_alert "Disk space tinggi: ${usage}%" "WARNING"
        return 1
    else
        print_success "Disk space normal: ${usage}%"
        return 0
    fi
}

# Fungsi untuk cek ukuran log file
check_log_size() {
    if [ ! -f "$LOG_FILE" ]; then
        return 0
    fi
    
    local size=$(stat -c%s "$LOG_FILE" 2>/dev/null || stat -f%z "$LOG_FILE" 2>/dev/null)
    local size_mb=$((size / 1024 / 1024))
    
    if [ "$size_mb" -gt 100 ]; then
        print_warning "Log file besar: ${size_mb}MB"
        send_alert "Log file besar: ${size_mb}MB, pertimbangkan log rotation" "WARNING"
        return 1
    else
        print_success "Ukuran log file normal: ${size_mb}MB"
        return 0
    fi
}

# Fungsi untuk cek database connectivity
check_database() {
    print_info "Melakukan database connectivity check..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js tidak ditemukan"
        return 1
    fi
    
    # Test database connection
    local test_result=$(node -e "
        const { createConnection } = require('./src/lib/db');
        createConnection().then(conn => {
            console.log('OK');
            conn.end();
        }).catch(err => {
            console.log('ERROR:', err.message);
            process.exit(1);
        });
    " 2>&1)
    
    if echo "$test_result" | grep -q "OK"; then
        print_success "Database connection berhasil"
        return 0
    else
        print_error "Database connection gagal: $test_result"
        send_alert "Database connection gagal: $test_result" "ERROR"
        return 1
    fi
}

# Fungsi untuk cek crontab
check_crontab() {
    if crontab -l 2>/dev/null | grep -q "auto-close-tickets"; then
        print_success "Crontab entry ditemukan"
        return 0
    else
        print_error "Crontab entry tidak ditemukan"
        send_alert "Crontab entry untuk auto-close tickets tidak ditemukan" "ERROR"
        return 1
    fi
}

# Fungsi untuk generate report
generate_report() {
    local total_checks=0
    local passed_checks=0
    local failed_checks=0
    local warnings=0
    
    print_info "=== Auto-Close Tickets Health Check Report ==="
    print_info "Tanggal: $(date)"
    print_info "================================================"
    
    # Array untuk menyimpan hasil check
    declare -a checks=(
        "check_cron_execution:Cron Job Execution"
        "check_log_errors:Log Errors"
        "check_api_health:API Health"
        "check_disk_space:Disk Space"
        "check_log_size:Log File Size"
        "check_database:Database Connection"
        "check_crontab:Crontab Entry"
    )
    
    # Jalankan setiap check
    for check_item in "${checks[@]}"; do
        IFS=':' read -r check_func check_name <<< "$check_item"
        
        print_info "Checking: $check_name"
        ((total_checks++))
        
        if $check_func; then
            ((passed_checks++))
        else
            ((failed_checks++))
        fi
        
        echo ""
    done
    
    print_info "================================================"
    print_info "Total Checks: $total_checks"
    print_success "Passed: $passed_checks"
    print_error "Failed: $failed_checks"
    
    if [ $failed_checks -eq 0 ]; then
        print_success "🎉 Semua health check berhasil!"
        return 0
    else
        print_error "❌ Ditemukan $failed_checks masalah"
        return 1
    fi
}

# Fungsi untuk continuous monitoring
continuous_monitoring() {
    local interval=${1:-300}  # Default 5 menit
    
    print_info "Starting continuous monitoring (interval: ${interval}s)"
    print_info "Press Ctrl+C to stop"
    
    while true; do
        print_info "$(date): Running health check..."
        
        if ! generate_report > /dev/null 2>&1; then
            print_error "Health check failed at $(date)"
        fi
        
        sleep $interval
    done
}

# Fungsi untuk cleanup old logs
cleanup_logs() {
    local retention_days=${1:-30}
    
    print_info "Cleaning up logs older than $retention_days days..."
    
    # Cleanup main log
    if [ -f "$LOG_FILE" ]; then
        # Rotate log if too large
        local size=$(stat -c%s "$LOG_FILE" 2>/dev/null || stat -f%z "$LOG_FILE" 2>/dev/null)
        if [ "$size" -gt 10485760 ]; then  # 10MB
            mv "$LOG_FILE" "$LOG_FILE.$(date +%Y%m%d)"
            touch "$LOG_FILE"
            print_info "Log file rotated"
        fi
    fi
    
    # Cleanup health check logs
    find logs/ -name "health-check.log.*" -mtime +$retention_days -delete 2>/dev/null
    
    print_info "Log cleanup completed"
}

# Parse command line arguments
case "$1" in
    "monitor")
        continuous_monitoring "$2"
        ;;
    "cleanup")
        cleanup_logs "$2"
        ;;
    "api")
        check_api_health
        ;;
    "database")
        check_database
        ;;
    "cron")
        check_cron_execution
        ;;
    "report")
        generate_report
        ;;
    "help"|"-h"|"--help")
        echo "Usage: $0 [COMMAND] [OPTIONS]"
        echo ""
        echo "Commands:"
        echo "  report          Generate full health check report (default)"
        echo "  monitor [SEC]   Continuous monitoring with interval (default: 300s)"
        echo "  cleanup [DAYS]  Cleanup old logs (default: 30 days)"
        echo "  api             Check API health only"
        echo "  database        Check database connection only"
        echo "  cron            Check cron execution only"
        echo "  help            Show this help"
        echo ""
        echo "Environment Variables:"
        echo "  ALERT_EMAIL     Email for alerts"
        echo "  SLACK_WEBHOOK   Slack webhook URL for alerts"
        echo ""
        echo "Examples:"
        echo "  $0                          # Full health check"
        echo "  $0 monitor 600              # Monitor every 10 minutes"
        echo "  $0 cleanup 7                # Cleanup logs older than 7 days"
        echo "  ALERT_EMAIL=admin@company.com $0 report"
        exit 0
        ;;
    *)
        generate_report
        ;;
esac

exit $? 