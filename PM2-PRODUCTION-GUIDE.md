# PM2 Production Configuration Guide

## Optimized untuk 300 Concurrent Users

### 🖥️ Server Specifications

- **CPU**: Intel Xeon E3-1230 v6 (8 cores, 3.5GHz)
- **RAM**: 32GB
- **Architecture**: x86_64
- **OS**: Linux

### ⚙️ PM2 Configuration

#### Mode: Fork (bukan Cluster)

- **Instances**: 6 processes
- **Memory per instance**: 2GB
- **Total memory allocation**: ~12GB
- **CPU cores utilized**: 6/8 cores
- **Expected load**: ~50 users per instance

#### Key Optimizations

```javascript
{
  instances: 6,                    // 6 fork processes
  exec_mode: "fork",              // Fork mode untuk stability
  max_memory_restart: "2G",       // Restart jika memory > 2GB
  node_args: [
    "--max-old-space-size=2048",  // 2GB heap per process
    "--optimize-for-size"         // Memory optimization
  ],
  env: {
    UV_THREADPOOL_SIZE: 16        // Increased thread pool
  }
}
```

### 📊 Performance Targets

| Metric           | Target | Alert Threshold |
| ---------------- | ------ | --------------- |
| Response Time    | < 2s   | > 2s            |
| Error Rate       | < 5%   | > 5%            |
| CPU Usage        | < 80%  | > 80%           |
| Memory Usage     | < 85%  | > 85%           |
| Concurrent Users | 300    | -               |

### 🚀 Deployment Commands

#### Quick Start

```bash
# Deploy to production
npm run deploy:production

# Monitor performance
npm run performance-check

# Load testing
npm install -g artillery
npm run load-test
artillery run load-test.yml
```

#### Manual Commands

```bash
# Start application
pm2 start ecosystem.config.js --env production

# Monitor real-time
pm2 monit

# Check status
pm2 status

# View logs
pm2 logs sdm-app

# Reload without downtime
pm2 reload ecosystem.config.js --env production

# Restart all instances
pm2 restart sdm-app
```

### 📈 Load Testing

#### Artillery Configuration

- **Warm up**: 60s with 10 users/s
- **Ramp up**: 5 minutes to 50 users/s
- **Peak load**: 10 minutes at 300 concurrent users
- **Cool down**: 2 minutes at 10 users/s

#### Test Scenarios

1. **Attendance Flow (60%)**: Login → Check status → Submit attendance
2. **Dashboard Navigation (30%)**: Browse dashboard → View reports
3. **Health Check (10%)**: API health monitoring

### 🔍 Monitoring & Alerts

#### Real-time Monitoring

```bash
# PM2 built-in monitoring
pm2 monit

# System resources
htop
iostat -x 1

# Network connections
netstat -an | grep :3001 | wc -l
```

#### Log Analysis

```bash
# Application logs
pm2 logs sdm-app --lines 100

# Error logs only
pm2 logs sdm-app --err

# Follow logs in real-time
pm2 logs sdm-app -f
```

### 🛠️ Troubleshooting

#### High Memory Usage

```bash
# Check memory per process
pm2 show sdm-app

# Restart if memory leak detected
pm2 restart sdm-app

# Reduce max memory restart threshold
# Edit ecosystem.config.js: max_memory_restart: "1.5G"
```

#### High CPU Usage

```bash
# Check CPU usage
pm2 monit

# Reduce instances if needed
pm2 scale sdm-app 4

# Check for infinite loops in logs
pm2 logs sdm-app --lines 1000 | grep -i error
```

#### Slow Response Times

```bash
# Check database connections
# Monitor API response times
# Review slow query logs
# Consider adding Redis cache
```

### 🔧 System Optimizations

#### File Descriptor Limits

```bash
# Check current limits
ulimit -n

# Increase limits (add to /etc/security/limits.conf)
* soft nofile 65536
* hard nofile 65536
```

#### TCP Optimizations

```bash
# Add to /etc/sysctl.conf
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 65535
net.ipv4.ip_local_port_range = 1024 65535
```

### 📋 Maintenance Schedule

#### Daily

- Check PM2 status: `pm2 status`
- Monitor resource usage: `pm2 monit`
- Review error logs: `pm2 logs sdm-app --err --lines 50`

#### Weekly

- Restart application: `pm2 restart sdm-app`
- Clean old logs: `pm2 flush`
- Update dependencies if needed

#### Monthly

- Full system restart
- Performance testing
- Capacity planning review

### 🚨 Emergency Procedures

#### Application Down

```bash
# Quick restart
pm2 restart sdm-app

# If restart fails, delete and start fresh
pm2 delete sdm-app
pm2 start ecosystem.config.js --env production
```

#### High Load Emergency

```bash
# Scale up instances temporarily
pm2 scale sdm-app +2

# Monitor impact
pm2 monit

# Scale back down when load decreases
pm2 scale sdm-app 6
```

#### Memory Leak

```bash
# Identify problematic instance
pm2 show sdm-app

# Restart specific instance
pm2 restart sdm-app --instance 0

# If persistent, reduce memory limit
# Edit ecosystem.config.js: max_memory_restart: "1G"
```

### 📞 Support Contacts

- **System Admin**: [Your contact]
- **Developer Team**: [Your contact]
- **Database Admin**: [Your contact]

---

**Last Updated**: \$(date)
**Configuration Version**: 1.0
**Tested Load**: 300 concurrent users
