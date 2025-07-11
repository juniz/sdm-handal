# Auto-Close Tickets Cron Job

Dokumentasi untuk setup dan monitoring sistem auto-close tiket yang resolved selama lebih dari 3 hari.

## Deskripsi

Sistem ini secara otomatis menutup tiket yang memiliki status "Resolved" selama lebih dari 3 hari tanpa feedback dari user. Proses ini dilakukan melalui cron job yang berjalan setiap hari.

## Komponen Sistem

### 1. API Endpoint

- **File**: `src/app/api/ticket/auto-close/route.js`
- **Methods**:
  - `GET`: Preview tiket yang akan ditutup
  - `POST`: Menjalankan proses auto-close

### 2. Cron Script

- **File**: `scripts/auto-close-tickets.js`
- **Fungsi**: Memanggil API endpoint untuk menjalankan auto-close

### 3. Setup Script

- **File**: `scripts/setup-auto-close-cron.sh`
- **Fungsi**: Mengatur cron job di sistem

### 4. Health Check Script

- **File**: `scripts/health-check-auto-close.sh`
- **Fungsi**: Monitoring kesehatan sistem

### 5. Troubleshooting Script

- **File**: `scripts/troubleshoot-auto-close.js`
- **Fungsi**: Mendiagnosa masalah koneksi dan performance

## Environment Variables

Pastikan environment variables berikut sudah diset:

```bash
# Base URL aplikasi
BASE_URL=https://your-domain.com

# Secret key untuk autentikasi cron job
CRON_SECRET=your-secure-secret-key

# Optional: Mode dry run untuk testing
DRY_RUN=false

# Optional: Log level (info, debug)
LOG_LEVEL=info
```

## Setup

### 1. Persiapan

```bash
# Set environment variables
export BASE_URL="https://your-domain.com"
export CRON_SECRET="your-secure-secret-key"

# Buat direktori logs jika belum ada
mkdir -p /var/log/auto-close-tickets/
```

### 2. Setup Cron Job

```bash
# Jalankan setup script
./scripts/setup-auto-close-cron.sh

# Atau setup manual
crontab -e
# Tambahkan line berikut:
# 0 2 * * * /path/to/your/project/scripts/auto-close-tickets.js >> /var/log/auto-close-tickets/cron.log 2>&1
```

### 3. Verifikasi Setup

```bash
# Test koneksi
./scripts/auto-close-tickets.js health

# Preview tiket yang akan ditutup
./scripts/auto-close-tickets.js preview

# Test dengan dry run
./scripts/auto-close-tickets.js test
```

## Monitoring

### 1. Health Check

```bash
# Jalankan health check
./scripts/health-check-auto-close.sh

# Atau manual
./scripts/auto-close-tickets.js health
```

### 2. Log Files

```bash
# Lihat log cron job
tail -f /var/log/auto-close-tickets/cron.log

# Lihat log health check
tail -f /var/log/auto-close-tickets/health.log
```

## Troubleshooting

### Socket Hang Up Error

Jika mengalami error "socket hang up", ikuti langkah berikut:

#### 1. Jalankan Troubleshooting Script

```bash
# Full troubleshooting
./scripts/troubleshoot-auto-close.js

# Quick test
./scripts/troubleshoot-auto-close.js quick

# Test dengan timeout tertentu
./scripts/troubleshoot-auto-close.js timeout 120000

# Test concurrent connections
./scripts/troubleshoot-auto-close.js concurrent 3
```

#### 2. Periksa Sistem

```bash
# Periksa apakah aplikasi berjalan
ps aux | grep node

# Periksa port yang digunakan
netstat -tulpn | grep 3000

# Periksa penggunaan resource
htop
```

#### 3. Periksa Database

```bash
# Periksa koneksi database
mysql -u username -p database_name -e "SELECT 1"

# Periksa slow queries
mysql -u username -p database_name -e "SHOW PROCESSLIST"
```

#### 4. Optimasi

Jika masih mengalami masalah, coba:

1. **Tingkatkan timeout**:

   ```bash
   export TIMEOUT=120000  # 2 menit
   ```

2. **Batasi concurrent connections**:

   - Pastikan tidak ada multiple cron job yang berjalan bersamaan
   - Gunakan file lock untuk mencegah duplicate execution

3. **Optimasi database**:
   ```sql
   -- Buat index untuk mempercepat query
   CREATE INDEX idx_tickets_status_resolved ON tickets(current_status_id, resolved_date, closed_date);
   ```

### Error Logs

Jika mengalami error, periksa:

1. **Application logs**:

   ```bash
   # Server logs
   pm2 logs

   # Next.js logs
   tail -f .next/server.log
   ```

2. **Database logs**:

   ```bash
   # MySQL error log
   tail -f /var/log/mysql/error.log
   ```

3. **System logs**:
   ```bash
   # Sistem log
   tail -f /var/log/syslog
   ```

### Common Issues

#### 1. "Request timeout"

- Solusi: Tingkatkan timeout atau optimasi query database

#### 2. "Connection refused"

- Solusi: Pastikan aplikasi berjalan dan port accessible

#### 3. "Invalid JSON response"

- Solusi: Periksa server error logs, mungkin ada PHP error atau database issue

#### 4. "Unauthorized"

- Solusi: Periksa CRON_SECRET di environment variables

## Performance Monitoring

### 1. Metrics yang Dipantau

- Response time API endpoint
- Number of tickets processed
- Error rate
- Memory usage
- Database query performance

### 2. Alerting

Setup alerting untuk:

- Cron job failure
- High error rate
- Slow response time (>30s)
- Database connection issues

### 3. Optimasi Berkelanjutan

- Monitor query performance
- Optimasi database indexes
- Tune timeout values
- Review error patterns

## Best Practices

1. **Testing**: Selalu test dengan dry run sebelum production
2. **Monitoring**: Setup proper logging dan alerting
3. **Backup**: Backup database sebelum menjalankan bulk operations
4. **Rollback**: Siapkan prosedur rollback jika terjadi masalah
5. **Documentation**: Update dokumentasi saat ada perubahan

## Command Reference

```bash
# Auto-close scripts
./scripts/auto-close-tickets.js                    # Run auto-close
./scripts/auto-close-tickets.js preview           # Preview tickets to close
./scripts/auto-close-tickets.js test              # Test with dry run
./scripts/auto-close-tickets.js health            # Health check

# Troubleshooting
./scripts/troubleshoot-auto-close.js              # Full troubleshooting
./scripts/troubleshoot-auto-close.js quick        # Quick test
./scripts/troubleshoot-auto-close.js timeout 60000 # Test with timeout
./scripts/troubleshoot-auto-close.js concurrent 5 # Test concurrent connections

# Setup dan monitoring
./scripts/setup-auto-close-cron.sh               # Setup cron job
./scripts/health-check-auto-close.sh             # Health check script
```

## Kontak

Jika ada pertanyaan atau masalah, hubungi tim IT atau maintainer sistem.
