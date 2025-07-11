#!/bin/bash

# Script untuk setup cron job auto-close tiket
# Jalankan dengan: bash scripts/setup-auto-close-cron.sh

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

# Fungsi untuk validasi environment variable
validate_env() {
    local var_name=$1
    local var_value=$(eval echo \$$var_name)
    
    if [ -z "$var_value" ]; then
        print_error "Environment variable $var_name tidak ditemukan"
        return 1
    fi
    
    print_info "$var_name = $var_value"
    return 0
}

# Fungsi untuk membuat file log directory
create_log_directory() {
    local log_dir="$1"
    
    if [ ! -d "$log_dir" ]; then
        mkdir -p "$log_dir"
        print_info "Created log directory: $log_dir"
    fi
    
    # Set permissions
    chmod 755 "$log_dir"
}

# Fungsi untuk membuat cron job entry
create_cron_entry() {
    local schedule="$1"
    local script_path="$2"
    local log_path="$3"
    local env_file="$4"
    
    # Cron entry dengan environment variables
    local cron_entry="$schedule cd $PWD && /usr/bin/env -i /bin/bash -c 'source $env_file && node $script_path >> $log_path 2>&1'"
    
    echo "$cron_entry"
}

# Fungsi untuk install cron job
install_cron() {
    local cron_entry="$1"
    local backup_file="/tmp/crontab_backup_$(date +%Y%m%d_%H%M%S)"
    
    # Backup crontab yang ada
    crontab -l > "$backup_file" 2>/dev/null || true
    print_info "Backup crontab ke: $backup_file"
    
    # Hapus cron job yang ada untuk auto-close tickets (jika ada)
    crontab -l 2>/dev/null | grep -v "auto-close-tickets" > /tmp/new_crontab || true
    
    # Tambahkan cron job baru
    echo "$cron_entry" >> /tmp/new_crontab
    
    # Install crontab baru
    crontab /tmp/new_crontab
    
    # Cleanup
    rm -f /tmp/new_crontab
    
    print_success "Cron job berhasil diinstall"
}

# Fungsi untuk membuat environment file
create_env_file() {
    local env_file="$1"
    
    cat > "$env_file" << EOF
# Environment variables untuk auto-close tickets cron job
# Generated pada: $(date)

# Base URL aplikasi
BASE_URL=${BASE_URL:-http://localhost:3000}

# Secret key untuk autentikasi cron job
CRON_SECRET=${CRON_SECRET:-your-cron-secret-key}

# Mode dry run (true/false)
DRY_RUN=${DRY_RUN:-false}

# Log level (info/debug/error)
LOG_LEVEL=${LOG_LEVEL:-info}

# Timezone
TZ=${TZ:-Asia/Jakarta}

# Path untuk Node.js
PATH=/usr/local/bin:/usr/bin:/bin:\$PATH
EOF

    print_info "Environment file dibuat: $env_file"
}

# Fungsi untuk test cron job
test_cron_job() {
    local script_path="$1"
    local env_file="$2"
    
    print_info "Testing cron job..."
    
    # Source environment file dan jalankan dalam mode test
    source "$env_file"
    export DRY_RUN=true
    
    # Jalankan script dalam mode test
    node "$script_path" test
    
    if [ $? -eq 0 ]; then
        print_success "Test cron job berhasil"
        return 0
    else
        print_error "Test cron job gagal"
        return 1
    fi
}

# Main function
main() {
    print_info "=== Setup Auto-Close Tickets Cron Job ==="
    
    # Validasi apakah script dijalankan dari root directory project
    if [ ! -f "package.json" ]; then
        print_error "Script harus dijalankan dari root directory project"
        exit 1
    fi
    
    # Default values
    local PROJECT_ROOT=$(pwd)
    local SCRIPT_PATH="$PROJECT_ROOT/scripts/auto-close-tickets.js"
    local LOG_DIR="$PROJECT_ROOT/logs"
    local LOG_FILE="$LOG_DIR/auto-close-tickets.log"
    local ENV_FILE="$PROJECT_ROOT/.env.cron"
    local CRON_SCHEDULE="0 2 * * *"  # Setiap hari jam 2 pagi
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --schedule)
                CRON_SCHEDULE="$2"
                shift 2
                ;;
            --log-dir)
                LOG_DIR="$2"
                shift 2
                ;;
            --env-file)
                ENV_FILE="$2"
                shift 2
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo "Options:"
                echo "  --schedule SCHEDULE    Cron schedule (default: '0 2 * * *')"
                echo "  --log-dir DIR          Log directory (default: ./logs)"
                echo "  --env-file FILE        Environment file (default: ./.env.cron)"
                echo "  --help                 Show this help"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Validasi file script
    if [ ! -f "$SCRIPT_PATH" ]; then
        print_error "Script file tidak ditemukan: $SCRIPT_PATH"
        exit 1
    fi
    
    # Make script executable
    chmod +x "$SCRIPT_PATH"
    
    # Validasi environment variables
    print_info "Validating environment variables..."
    if ! validate_env "BASE_URL" || ! validate_env "CRON_SECRET"; then
        print_error "Environment variables tidak lengkap"
        print_info "Pastikan BASE_URL dan CRON_SECRET sudah diset"
        exit 1
    fi
    
    # Buat log directory
    create_log_directory "$LOG_DIR"
    
    # Buat environment file
    create_env_file "$ENV_FILE"
    
    # Test cron job
    if ! test_cron_job "$SCRIPT_PATH" "$ENV_FILE"; then
        print_error "Test cron job gagal, cron job tidak akan diinstall"
        exit 1
    fi
    
    # Buat cron entry
    local cron_entry=$(create_cron_entry "$CRON_SCHEDULE" "$SCRIPT_PATH" "$LOG_FILE" "$ENV_FILE")
    
    print_info "Cron job entry:"
    print_info "$cron_entry"
    
    # Konfirmasi instalasi
    read -p "Install cron job? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        install_cron "$cron_entry"
        
        # Tampilkan crontab yang aktif
        print_info "Crontab yang aktif:"
        crontab -l | grep -E "(auto-close-tickets|#)"
        
        print_success "Setup cron job selesai!"
        print_info "Cron job akan berjalan dengan schedule: $CRON_SCHEDULE"
        print_info "Log file: $LOG_FILE"
        print_info "Environment file: $ENV_FILE"
        
        # Tampilkan cara monitoring
        print_info ""
        print_info "Cara monitoring cron job:"
        print_info "  1. Lihat log: tail -f $LOG_FILE"
        print_info "  2. Test manual: node $SCRIPT_PATH test"
        print_info "  3. Preview: node $SCRIPT_PATH preview"
        print_info "  4. Health check: node $SCRIPT_PATH health"
        print_info "  5. Lihat crontab: crontab -l"
        print_info "  6. Hapus cron job: crontab -e (hapus baris yang mengandung 'auto-close-tickets')"
        
    else
        print_info "Instalasi cron job dibatalkan"
    fi
    
    print_info "=== Setup selesai ==="
}

# Handle Ctrl+C
trap 'print_error "\nSetup dibatalkan oleh user"; exit 1' INT

# Jalankan main function
main "$@" 