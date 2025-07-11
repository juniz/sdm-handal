# PM2 Auto-Close Tickets - Direct Database Version

## 🚀 **Perubahan dari Versi API**

Versi **Direct Database** ini menghilangkan dependency pada API endpoints dan menggunakan akses database langsung untuk performa yang lebih baik:

### ✅ **Keuntungan Versi Direct Database:**

- **Tidak memerlukan API server** - langsung akses database
- **Tidak memerlukan authentication** - tidak perlu bearer token
- **Performa lebih cepat** - menghilangkan HTTP overhead
- **Lebih stabil** - tidak tergantung pada web server status
- **Resource lebih efisien** - mengurangi memory usage dan network calls

### 🔄 **Perbedaan dengan Versi API:**

| Fitur          | Versi API              | Versi Direct Database |
| -------------- | ---------------------- | --------------------- |
| Dependency     | Web server + API       | Database saja         |
| Authentication | Bearer token           | Tidak diperlukan      |
| Network        | HTTP requests          | Direct connection     |
| Performance    | Lambat (HTTP overhead) | Cepat (direct access) |
| Resource Usage | Tinggi                 | Rendah                |
| Stability      | Tergantung web server  | Independen            |

## 📋 **Struktur File**

```
scripts/
├── auto-close-tickets-direct.js     # Script utama (direct database)
├── db-adapter.js                     # Database adapter CommonJS
├── pm2-cron-monitor-direct.sh       # Script monitoring
└── deploy-pm2-cron-direct.sh        # Script deployment

ecosystem.config.js                  # PM2 configuration (updated)
.env                                  # Database configuration
```

## 🛠️ **Instalasi dan Setup**

### 1. **Persiapan Environment**

```bash
# Pastikan file .env ada dengan konfigurasi database
cat .env | grep -E "^DB_"
```

### 2. **Validasi Prerequisites**

```bash
# Install PM2 jika belum ada
npm install -g pm2

# Verifikasi Node.js
node --version

# Test koneksi database
export $(cat .env | grep -v '^#' | xargs)
node scripts/auto-close-tickets-direct.js health
```

### 3. **Deploy untuk Development**

```bash
./scripts/deploy-pm2-cron-direct.sh development
```

### 4. **Deploy untuk Production**

```bash
./scripts/deploy-pm2-cron-direct.sh production
```

## ⚙️ **Konfigurasi**

### **Environment Variables**

```env
# Database Configuration (wajib)
DB_HOST=your-database-host
DB_PORT=3306
DB_USER=your-username
DB_PASSWORD=your-password
DB_NAME=your-database-name

# Auto-close Configuration (opsional)
AUTO_CLOSE_DAYS=3        # Hari tunggu sebelum auto-close
BATCH_SIZE=50            # Jumlah tiket per batch
DRY_RUN=false           # Mode dry run (true/false)
LOG_LEVEL=info          # Level logging (debug/info/error)
TZ=Asia/Jakarta         # Timezone
```

### **PM2 Configuration (ecosystem.config.js)**

```javascript
{
  name: "auto-close-tickets-cron",
  script: "./scripts/auto-close-tickets-direct.js",
  cron_restart: "0 2 * * *",  // Daily at 2:00 AM
  env: {
    NODE_ENV: "production",
    DRY_RUN: "false",
    AUTO_CLOSE_DAYS: "3",
    BATCH_SIZE: "50"
  }
}
```

## 🎯 **Cara Penggunaan**

### **1. Manual Testing**

```bash
# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Health check database
node scripts/auto-close-tickets-direct.js health

# Preview tiket yang akan ditutup
node scripts/auto-close-tickets-direct.js preview

# Dry run (tidak benar-benar menutup tiket)
node scripts/auto-close-tickets-direct.js dry-run

# Eksekusi auto-close sebenarnya
node scripts/auto-close-tickets-direct.js run
```

### **2. Monitoring dengan PM2**

```bash
# Status semua services
./scripts/pm2-cron-monitor-direct.sh status

# Lihat logs
./scripts/pm2-cron-monitor-direct.sh logs

# Test manual
./scripts/pm2-cron-monitor-direct.sh test preview

# Performance monitoring
./scripts/pm2-cron-monitor-direct.sh performance

# Database connection info
./scripts/pm2-cron-monitor-direct.sh database
```

### **3. PM2 Commands**

```bash
# Lihat status
pm2 list

# Lihat logs
pm2 logs auto-close-tickets-cron

# Restart service
pm2 restart auto-close-tickets-cron

# Stop service
pm2 stop auto-close-tickets-cron

# Delete service
pm2 delete auto-close-tickets-cron
```

## 📊 **Monitoring dan Logging**

### **Log Files**

```
logs/
├── auto-close-cron.log        # Log utama auto-close
├── auto-close-out.log         # Standard output
├── auto-close-error.log       # Error logs
├── health-check.log           # Health check logs
└── combined.log               # Log gabungan
```

### **Monitoring Script Features**

```bash
# Comprehensive monitoring
./scripts/pm2-cron-monitor-direct.sh

# Available commands:
status          # Show current status
logs [service]  # Show logs
restart         # Restart services
stop           # Stop services
start          # Start services
test [type]    # Manual testing
performance    # Performance stats
schedule       # Cron schedule info
database       # Database info
help           # Show help
```

## 🔧 **Troubleshooting**

### **Common Issues**

#### **1. Database Connection Failed**

```bash
# Check environment variables
export $(cat .env | grep -v '^#' | xargs)
echo "DB_HOST: $DB_HOST"
echo "DB_PORT: $DB_PORT"
echo "DB_USER: $DB_USER"
echo "DB_NAME: $DB_NAME"

# Test connection
node scripts/auto-close-tickets-direct.js health
```

#### **2. PM2 Process Not Starting**

```bash
# Check PM2 status
pm2 list

# Check logs for errors
pm2 logs auto-close-tickets-cron

# Manual test
export $(cat .env | grep -v '^#' | xargs)
node scripts/auto-close-tickets-direct.js health
```

#### **3. No Tickets Found**

```bash
# Check if there are resolved tickets > 3 days
export $(cat .env | grep -v '^#' | xargs)
node scripts/auto-close-tickets-direct.js preview
```

### **Debug Mode**

```bash
# Enable debug logging
export LOG_LEVEL=debug
export $(cat .env | grep -v '^#' | xargs)
node scripts/auto-close-tickets-direct.js preview
```

## 🛡️ **Security Notes**

### **Database Security**

- Gunakan user database dengan permission terbatas
- Hanya berikan akses SELECT, INSERT, UPDATE pada tabel yang diperlukan
- Gunakan SSL connection untuk database di production

### **Environment Security**

- Pastikan file `.env` tidak di-commit ke git
- Set proper file permissions: `chmod 600 .env`
- Gunakan environment variables di production

## 📈 **Performance Optimization**

### **Database Optimization**

```sql
-- Index untuk performa query
CREATE INDEX idx_tickets_status_resolved ON tickets (current_status_id, resolved_date);
CREATE INDEX idx_tickets_closed_date ON tickets (closed_date);
```

### **Batch Processing**

```bash
# Adjust batch size based on system capacity
export BATCH_SIZE=25    # Smaller batch for low-end systems
export BATCH_SIZE=100   # Larger batch for high-end systems
```

## 🚀 **Production Deployment**

### **Step-by-Step Production Setup**

```bash
# 1. Prepare environment
cd /path/to/your/app
git pull origin main

# 2. Verify database connection
export $(cat .env | grep -v '^#' | xargs)
node scripts/auto-close-tickets-direct.js health

# 3. Deploy to production
./scripts/deploy-pm2-cron-direct.sh production

# 4. Verify deployment
pm2 list
pm2 logs auto-close-tickets-cron --lines 10

# 5. Set up monitoring
crontab -e
# Add: 0 9 * * * /path/to/app/scripts/pm2-cron-monitor-direct.sh status
```

### **Production Environment Variables**

```env
NODE_ENV=production
DRY_RUN=false
LOG_LEVEL=info
AUTO_CLOSE_DAYS=3
BATCH_SIZE=50
TZ=Asia/Jakarta
```

## 📅 **Maintenance**

### **Regular Maintenance Tasks**

```bash
# Daily: Check status
./scripts/pm2-cron-monitor-direct.sh status

# Weekly: Check performance
./scripts/pm2-cron-monitor-direct.sh performance

# Monthly: Review logs
ls -la logs/
# Archive old logs if needed
```

### **Log Rotation**

```bash
# PM2 log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

## 🔍 **Monitoring Dashboard**

### **Quick Health Check**

```bash
# One-liner health check
./scripts/pm2-cron-monitor-direct.sh test quick-health && echo "✅ System Healthy" || echo "❌ System Unhealthy"
```

### **System Status**

```bash
# Complete system overview
./scripts/pm2-cron-monitor-direct.sh status
```

## 🆘 **Emergency Procedures**

### **Stop Auto-Close Immediately**

```bash
# Stop all auto-close processes
pm2 stop auto-close-tickets-cron auto-close-health-check
```

### **Manual Recovery**

```bash
# Restart failed processes
pm2 restart auto-close-tickets-cron

# Reset and redeploy
pm2 delete auto-close-tickets-cron auto-close-health-check
./scripts/deploy-pm2-cron-direct.sh production
```

## 📞 **Support**

### **Getting Help**

```bash
# Show help
./scripts/pm2-cron-monitor-direct.sh help

# Check script documentation
node scripts/auto-close-tickets-direct.js --help
```

### **Contact Information**

- **Developer**: SDM Team
- **Environment**: Direct Database Version
- **Last Updated**: 2025-07-11
- **Version**: 2.0.0 (Direct Database)

---

**⚠️ Important Notes:**

- Selalu test di development environment terlebih dahulu
- Monitor logs secara berkala
- Backup database sebelum deployment production
- Pastikan semua environment variables sudah benar
- Verifikasi koneksi database sebelum deployment
