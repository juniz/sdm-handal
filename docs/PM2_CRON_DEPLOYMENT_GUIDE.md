# PM2 Cron Jobs Deployment Guide

Panduan lengkap untuk menjalankan cron job auto-close tickets dengan PM2 di production.

## 📋 Daftar Isi

1. [Overview](#overview)
2. [Pre-requisites](#pre-requisites)
3. [Deployment Steps](#deployment-steps)
4. [Management & Monitoring](#management--monitoring)
5. [Troubleshooting](#troubleshooting)
6. [Best Practices](#best-practices)

## 🎯 Overview

Sistem ini menggunakan PM2 untuk menjalankan dua cron jobs:

### **Auto-Close Tickets Cron**

- **Schedule**: Setiap hari jam 2:00 pagi
- **Function**: Menutup tiket yang resolved > 3 hari
- **Process Name**: `auto-close-tickets-cron`

### **Health Check Cron**

- **Schedule**: Setiap 30 menit
- **Function**: Monitoring kesehatan sistem
- **Process Name**: `auto-close-health-check`

## 🔧 Pre-requisites

### 1. **Software Requirements**

```bash
# Install PM2 globally
npm install -g pm2

# Verify installation
pm2 --version
```

### 2. **Environment Setup**

Pastikan environment variables sudah dikonfigurasi di `.env`:

```bash
# Production settings
BASE_URL=http://localhost:3001  # PM2 port
CRON_SECRET=rsbhayangkaranganjuk
DRY_RUN=false
LOG_LEVEL=info
TZ=Asia/Jakarta
NODE_ENV=production
```

### 3. **Directory Structure**

```
project-root/
├── ecosystem.config.js      # PM2 configuration
├── scripts/
│   ├── auto-close-tickets.js
│   ├── deploy-pm2-cron.sh
│   └── pm2-cron-monitor.sh
└── logs/                    # Auto-created by PM2
    ├── auto-close-cron.log
    ├── health-check.log
    └── ...
```

## 🚀 Deployment Steps

### **Step 1: Persiapan Scripts**

```bash
# Make scripts executable
chmod +x scripts/deploy-pm2-cron.sh
chmod +x scripts/pm2-cron-monitor.sh
chmod +x scripts/auto-close-tickets.js
```

### **Step 2: Deploy Aplikasi Utama**

```bash
# Start main application with PM2
pm2 start ecosystem.config.js --env production --only sdm-app

# Verify main app is running
pm2 list
curl http://localhost:3001  # Should return app response
```

### **Step 3: Deploy Cron Jobs**

#### **Production Deployment:**

```bash
# Deploy for production
./scripts/deploy-pm2-cron.sh production

# Or skip tests if main app not ready
SKIP_TESTS=true ./scripts/deploy-pm2-cron.sh production
```

#### **Development Deployment:**

```bash
# Deploy for development (dry run enabled)
./scripts/deploy-pm2-cron.sh development
```

### **Step 4: Verify Deployment**

```bash
# Check all processes
pm2 list

# Check logs
pm2 logs auto-close-tickets-cron --lines 10
pm2 logs auto-close-health-check --lines 10

# Monitor in real-time
pm2 monit
```

## 🛠️ Management & Monitoring

### **1. Using Monitor Script**

#### **Status Monitoring:**

```bash
# Show comprehensive status
./scripts/pm2-cron-monitor.sh status

# Show performance stats
./scripts/pm2-cron-monitor.sh performance

# Show cron schedule info
./scripts/pm2-cron-monitor.sh schedule
```

#### **Log Management:**

```bash
# View all logs
./scripts/pm2-cron-monitor.sh logs

# View specific service logs
./scripts/pm2-cron-monitor.sh logs cron
./scripts/pm2-cron-monitor.sh logs health

# Real-time log monitoring
pm2 logs auto-close-tickets-cron --raw | tail -f
```

#### **Service Control:**

```bash
# Restart all cron services
./scripts/pm2-cron-monitor.sh restart

# Restart specific service
./scripts/pm2-cron-monitor.sh restart cron
./scripts/pm2-cron-monitor.sh restart health

# Stop/Start services
./scripts/pm2-cron-monitor.sh stop cron
./scripts/pm2-cron-monitor.sh start cron
```

### **2. Manual Testing**

```bash
# Preview tickets to be closed
./scripts/pm2-cron-monitor.sh test preview

# Health check test
./scripts/pm2-cron-monitor.sh test health

# Dry run test
./scripts/pm2-cron-monitor.sh test dry-run

# Connection troubleshoot
./scripts/pm2-cron-monitor.sh test troubleshoot
```

### **3. Direct PM2 Commands**

```bash
# List all processes
pm2 list

# Detailed process info
pm2 show auto-close-tickets-cron

# Memory/CPU monitoring
pm2 monit

# Restart with zero downtime
pm2 reload auto-close-tickets-cron

# Force restart
pm2 restart auto-close-tickets-cron

# Stop process
pm2 stop auto-close-tickets-cron

# Delete process
pm2 delete auto-close-tickets-cron
```

## 📊 Log Files

### **Log Locations:**

```bash
# Auto-Close Cron Logs
logs/auto-close-cron.log      # Combined output
logs/auto-close-out.log       # Standard output
logs/auto-close-error.log     # Error output

# Health Check Logs
logs/health-check.log         # Combined output
logs/health-check-out.log     # Standard output
logs/health-check-error.log   # Error output

# Main App Logs
logs/combined.log             # Main app combined
logs/out.log                  # Main app output
logs/error.log                # Main app errors
```

### **Log Analysis:**

```bash
# Check recent auto-close runs
grep "tiket diproses" logs/auto-close-cron.log | tail -10

# Check for errors
grep "ERROR" logs/auto-close-error.log | tail -20

# Monitor health check status
grep -E "(Healthy|Unhealthy)" logs/health-check.log | tail -10

# Check successful runs today
grep "$(date +%Y-%m-%d)" logs/auto-close-cron.log | grep "SUCCESS"
```

## ⚠️ Troubleshooting

### **Common Issues & Solutions:**

#### **1. Cron Jobs Not Running**

```bash
# Check PM2 status
pm2 list

# Check if processes exist
pm2 show auto-close-tickets-cron

# Restart if needed
pm2 restart auto-close-tickets-cron

# Check cron configuration
cat ecosystem.config.js | grep -A 10 "cron_restart"
```

#### **2. Authentication Errors**

```bash
# Check environment variables
pm2 env auto-close-tickets-cron

# Update environment if needed
pm2 restart auto-close-tickets-cron --env production

# Test credentials manually
curl -H "Authorization: Bearer rsbhayangkaranganjuk" http://localhost:3001/api/ticket/auto-close
```

#### **3. Connection Issues**

```bash
# Test main app connectivity
curl http://localhost:3001

# Check if main app is running
pm2 list | grep sdm-app

# Run troubleshoot script
./scripts/pm2-cron-monitor.sh test troubleshoot
```

#### **4. Memory/Performance Issues**

```bash
# Check memory usage
pm2 list
pm2 monit

# View detailed metrics
./scripts/pm2-cron-monitor.sh performance

# Restart if memory leak
pm2 restart auto-close-tickets-cron
```

#### **5. Log Issues**

```bash
# Check log permissions
ls -la logs/

# Create logs directory if missing
mkdir -p logs
chmod 755 logs

# Rotate large log files
pm2 flush  # Clear all logs
```

## 🔒 Production Best Practices

### **1. Security**

```bash
# Use secure CRON_SECRET
# Set proper file permissions
chmod 600 .env
chmod 755 scripts/*.sh
chmod 644 logs/*.log

# Regular security updates
npm audit
npm update
```

### **2. Monitoring**

```bash
# Setup system monitoring
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30

# Setup alerting
# Monitor process uptime
# Monitor log errors
```

### **3. Backup & Recovery**

```bash
# Backup PM2 configuration
pm2 save
cp ~/.pm2/dump.pm2 /backup/pm2-dump-$(date +%Y%m%d).pm2

# Backup logs
tar -czf logs-backup-$(date +%Y%m%d).tar.gz logs/

# Recovery procedure
pm2 resurrect
```

### **4. Performance Optimization**

```bash
# Monitor resource usage
pm2 monit

# Adjust memory limits if needed
# Edit ecosystem.config.js max_memory_restart

# Optimize database queries
# Monitor API response times
```

## 📅 Maintenance Schedule

### **Daily:**

- Check PM2 process status
- Review error logs
- Verify auto-close execution

### **Weekly:**

- Review performance metrics
- Check log file sizes
- Test manual execution

### **Monthly:**

- Rotate log files
- Update dependencies
- Review cron schedule effectiveness

## 🚨 Emergency Procedures

### **If Auto-Close Fails:**

```bash
# 1. Check status
./scripts/pm2-cron-monitor.sh status

# 2. Review recent logs
pm2 logs auto-close-tickets-cron --lines 50

# 3. Test manually
./scripts/pm2-cron-monitor.sh test preview

# 4. Restart if needed
pm2 restart auto-close-tickets-cron

# 5. Run manual close if urgent
node scripts/auto-close-tickets.js
```

### **If System Overload:**

```bash
# 1. Stop non-critical processes
pm2 stop auto-close-health-check

# 2. Check resource usage
pm2 monit

# 3. Scale down if needed
pm2 scale sdm-app 1

# 4. Restart services gradually
pm2 restart auto-close-tickets-cron
pm2 start auto-close-health-check
```

## 📞 Support Commands Quick Reference

```bash
# Essential Commands
pm2 list                                    # Show all processes
pm2 monit                                   # Real-time monitoring
pm2 logs auto-close-tickets-cron           # View cron logs
./scripts/pm2-cron-monitor.sh status       # Comprehensive status
./scripts/pm2-cron-monitor.sh test preview # Manual test

# Emergency Commands
pm2 restart auto-close-tickets-cron        # Restart cron
pm2 flush                                   # Clear all logs
pm2 save && pm2 kill && pm2 resurrect      # Full restart

# Deployment Commands
./scripts/deploy-pm2-cron.sh production    # Deploy production
pm2 reload ecosystem.config.js --env production  # Reload config
```

## 📈 Success Metrics

Monitor these metrics to ensure successful deployment:

- **Process Uptime**: > 99%
- **Memory Usage**: < 256MB per cron process
- **Error Rate**: < 1% of executions
- **Execution Time**: < 30 seconds for auto-close
- **Log Growth**: < 100MB per month

## 🎯 Next Steps

After successful deployment:

1. **Setup monitoring alerts**
2. **Configure log rotation**
3. **Schedule regular maintenance**
4. **Document any customizations**
5. **Train team on monitoring procedures**

---

**📧 Support**: Hubungi tim IT untuk bantuan teknis
**📚 Documentation**: Lihat `AUTO_CLOSE_TICKETS_CRON.md` untuk detail API
