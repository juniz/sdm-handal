# PM2 Deployment Guide - SDM Application

## Overview

Konfigurasi PM2 untuk aplikasi SDM dengan optimasi maksimal untuk load balancing dan pemanfaatan resource CPU server.

## Features Configuration

### 🚀 **Cluster Mode**

- **Mode**: `cluster` untuk load balancing otomatis
- **Instances**: `max` (menggunakan semua CPU core yang tersedia)
- **Load Balancing**: Otomatis mendistribusikan request ke semua instance

### 📊 **Performance Optimization**

- **Memory Limit**: 1GB per instance (auto restart jika melebihi)
- **Min Uptime**: 10 detik sebelum dianggap sukses start
- **Max Restarts**: 10 attempts dengan delay 4 detik
- **Auto Restart**: Daily maintenance restart jam 2 pagi

### 👀 **Watch Mode**

- **Watch**: Enabled dengan delay 1 detik
- **Ignore**: `node_modules`, `.next`, `logs`, `.git`, `public/uploads`
- **Auto Reload**: Otomatis reload saat file berubah

### 📝 **Logging**

- **Combined Log**: `./logs/combined.log`
- **Output Log**: `./logs/out.log`
- **Error Log**: `./logs/error.log`
- **Format**: `YYYY-MM-DD HH:mm:ss Z`
- **Merge Logs**: Semua instance logs digabung

## Installation & Setup

### 1. Install PM2 Globally

```bash
npm install -g pm2
```

### 2. Build Application

```bash
npm run build
```

### 3. Start Application

```bash
# Production mode
npm run pm2:start

# Development mode
npm run pm2:dev
```

## Available Commands

### Basic Commands

```bash
# Start application
npm run pm2:start

# Stop application
npm run pm2:stop

# Restart application (hard restart)
npm run pm2:restart

# Reload application (zero-downtime)
npm run pm2:reload

# Delete application from PM2
npm run pm2:delete
```

### Monitoring Commands

```bash
# View logs
npm run pm2:logs

# Real-time monitoring
npm run pm2:monit

# List all processes
npm run pm2:list

# Check status
npm run pm2:status
```

### Direct PM2 Commands

```bash
# Start with ecosystem file
pm2 start ecosystem.config.js --env production

# Monitor CPU and Memory usage
pm2 monit

# View detailed info
pm2 show sdm-app

# Scale instances manually
pm2 scale sdm-app 8

# Reset restart counter
pm2 reset sdm-app
```

## Configuration Details

### Network Configuration

- **Host**: `0.0.0.0` (accept connections from any IP)
- **Port**: `3001`
- **Command**: `npm start -- -H 0.0.0.0 -p 3001`

### Environment Variables

```javascript
// Production
NODE_ENV=production
PORT=3001
HOST=0.0.0.0

// Development
NODE_ENV=development
PORT=3001
HOST=0.0.0.0
```

### Resource Optimization

- **CPU Usage**: Memaksimalkan semua core CPU
- **Memory Management**: Auto restart jika usage > 1GB
- **Process Management**: Smart restart dengan delay
- **Load Balancing**: Otomatis distribute load

## Server Requirements

### Minimum Requirements

- **CPU**: 2 cores
- **RAM**: 4GB
- **Storage**: 10GB free space
- **Node.js**: v18+
- **PM2**: Latest version

### Recommended for Production

- **CPU**: 4+ cores
- **RAM**: 8GB+
- **Storage**: 50GB+ SSD
- **Network**: 1Gbps
- **OS**: Ubuntu 20.04+ / CentOS 8+

## Monitoring & Health Check

### Real-time Monitoring

```bash
# Web-based monitoring
pm2 web

# Command line monitoring
pm2 monit

# Process list with details
pm2 ls
```

### Log Management

```bash
# View live logs
pm2 logs sdm-app --lines 100

# Clear logs
pm2 flush

# Rotate logs
pm2 install pm2-logrotate
```

### Health Checks

- **Listen Timeout**: 10 seconds
- **Kill Timeout**: 5 seconds
- **Restart Delay**: 4 seconds
- **Auto Health Check**: Built-in PM2 monitoring

## Production Deployment

### Auto-deployment Setup

```bash
# Setup deployment
pm2 deploy ecosystem.config.js production setup

# Deploy application
pm2 deploy ecosystem.config.js production
```

### Startup Script (Auto-start on boot)

```bash
# Generate startup script
pm2 startup

# Save current processes
pm2 save

# Manual startup (if needed)
pm2 resurrect
```

## Troubleshooting

### Common Issues

1. **Port Already in Use**

   ```bash
   lsof -ti:3001 | xargs kill -9
   ```

2. **Memory Issues**

   ```bash
   pm2 restart sdm-app --update-env
   ```

3. **Log Files Too Large**
   ```bash
   pm2 install pm2-logrotate
   pm2 set pm2-logrotate:max_size 10M
   ```

### Performance Tuning

```bash
# Increase max file descriptors
ulimit -n 65536

# Optimize for production
export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=2048"
```

## Security Considerations

- Run with non-root user
- Use firewall to restrict port access
- Enable HTTPS in production
- Regular security updates
- Monitor logs for suspicious activity

## Backup & Recovery

```bash
# Backup PM2 configuration
pm2 save

# Backup logs
tar -czf logs-backup-$(date +%Y%m%d).tar.gz logs/

# Restore configuration
pm2 resurrect
```

---

**Note**: Pastikan aplikasi sudah di-build (`npm run build`) sebelum menjalankan PM2 dalam mode production.
