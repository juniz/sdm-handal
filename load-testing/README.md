# Load Testing Suite untuk Aplikasi SDM

Dokumentasi lengkap untuk menjalankan load testing pada aplikasi SDM (HR Management System).

## 🚀 Quick Start

```bash
# 1. Install dependencies
cd load-testing
npm install

# 2. Install Artillery.js dan K6 secara global (opsional)
npm install -g artillery k6

# 3. Jalankan light load test
npm run test:light

# 4. Jalankan custom Node.js load test
npm run test:custom
```

## 📋 Daftar Test yang Tersedia

### 1. Artillery.js Tests

- **Light Load Test** (`npm run test:light`)

  - 5-20 concurrent users
  - Duration: 9 menit
  - Cocok untuk development testing

- **Medium Load Test** (`npm run test:medium`)

  - 20-50 concurrent users
  - Duration: 15 menit
  - Cocok untuk staging testing

- **Heavy Load Test** (`npm run test:heavy`)

  - 10-200 concurrent users
  - Duration: 25 menit
  - Termasuk spike testing hingga 200 users/second

- **Stress Test** (`npm run test:stress`)
  - Progressive load increase
  - Breaking point testing
  - System limits identification

### 2. Custom Node.js Tests

- **Custom Load Test** (`npm run test:custom`)

  - 50 concurrent users max
  - 10 menit duration
  - Detailed metrics dan reporting

- **Attendance Stress Test** (`npm run test:attendance`)
  - Specialized untuk attendance endpoint
  - Multi-phase testing
  - Database stress testing

### 3. K6 Tests

```bash
# Basic load test
k6 run k6-script.js

# High performance test
k6 run --vus 100 --duration 5m k6-script.js

# Stress test dengan custom scenario
k6 run --scenario attendance_stress k6-script.js
```

## 🎯 Test Scenarios

### Endpoints yang Ditest

1. **Authentication**

   - `/api/auth/login` - Login requests
   - Session management
   - Token validation

2. **Attendance System**

   - `/api/attendance` (GET) - Check status
   - `/api/attendance` (POST) - Submit attendance
   - Photo upload simulation
   - GPS coordinate validation

3. **Dashboard**

   - `/dashboard` - Main dashboard access
   - `/dashboard/admin` - Admin panel access
   - Real-time data loading

4. **Admin Functions**
   - `/api/error-logs` - Error log retrieval
   - `/api/admin/security-logs` - Security monitoring
   - `/dashboard/admin/location-settings` - Settings management

### User Behavior Simulation

- **Regular Users (90%)**

  - Login → Check attendance → Submit attendance → View dashboard
  - Realistic think time (1-5 seconds)
  - GPS coordinates simulation
  - Photo upload simulation

- **Admin Users (10%)**
  - Login → Access admin panels → Monitor logs → Check settings
  - Higher frequency of admin operations
  - Concurrent admin requests

## 📊 Metrics yang Diukur

### Performance Metrics

- **Response Time**: Average, 95th percentile, 99th percentile
- **Throughput**: Requests per second
- **Concurrent Users**: Active user count
- **Success Rate**: Percentage of successful requests

### Error Metrics

- **HTTP Errors**: 4xx and 5xx status codes
- **Timeout Errors**: Request timeouts
- **System Errors**: Application-level errors
- **Database Errors**: DB connection/query issues

### System Metrics

- **Memory Usage**: Application memory consumption
- **CPU Usage**: Server CPU utilization
- **Database Performance**: Query response times
- **Network**: Bandwidth utilization

## 🔧 Konfigurasi

### Environment Variables

```bash
# .env file untuk load testing
LOAD_TEST_BASE_URL=https://localhost:3000
LOAD_TEST_USERS=50
LOAD_TEST_DURATION=600
LOAD_TEST_RAMP_UP=120
LOAD_TEST_TIMEOUT=30000
```

### Test Data

File `test-data.json`:

```json
{
	"users": [
		{ "username": "EMP001", "password": "password123" },
		{ "username": "EMP002", "password": "pass456" },
		{ "username": "admin", "password": "admin123" }
	],
	"officeLocation": {
		"latitude": -7.9797,
		"longitude": 112.6304,
		"radius": 500
	}
}
```

## 📈 Interpreting Results

### Response Time Benchmarks

- **Excellent**: < 1 second
- **Good**: 1-3 seconds
- **Acceptable**: 3-5 seconds
- **Poor**: > 5 seconds

### Error Rate Benchmarks

- **Excellent**: < 0.1%
- **Good**: 0.1-1%
- **Acceptable**: 1-5%
- **Poor**: > 5%

### Throughput Benchmarks

- **Low**: < 5 req/s
- **Moderate**: 5-10 req/s
- **Good**: 10-50 req/s
- **Excellent**: > 50 req/s

## 🚨 Troubleshooting

### Common Issues

1. **Connection Refused**

   ```bash
   # Pastikan aplikasi berjalan
   npm run dev
   # atau
   npm start
   ```

2. **SSL Certificate Errors**

   ```bash
   # Gunakan flag untuk skip SSL verification
   export NODE_TLS_REJECT_UNAUTHORIZED=0
   ```

3. **Memory Issues**

   ```bash
   # Increase Node.js memory limit
   export NODE_OPTIONS="--max-old-space-size=4096"
   ```

4. **Database Connection Errors**
   - Check database connection pool settings
   - Monitor database performance during tests
   - Verify connection limits

### Performance Optimization Tips

1. **Database Optimization**

   - Add indexes on frequently queried columns
   - Optimize slow queries
   - Implement connection pooling
   - Use database caching

2. **Application Optimization**

   - Implement response caching
   - Optimize image processing
   - Use CDN for static assets
   - Enable gzip compression

3. **Server Configuration**
   - Increase file descriptor limits
   - Optimize memory allocation
   - Configure load balancing
   - Monitor server resources

## 📋 Test Checklists

### Before Running Tests

- [ ] Application is running and accessible
- [ ] Database is running and connected
- [ ] Test data is prepared
- [ ] Monitoring tools are active
- [ ] Backup data if necessary

### During Tests

- [ ] Monitor system resources
- [ ] Watch for error patterns
- [ ] Check database performance
- [ ] Monitor network usage
- [ ] Record peak performance metrics

### After Tests

- [ ] Analyze results and reports
- [ ] Identify bottlenecks
- [ ] Document findings
- [ ] Plan optimization strategies
- [ ] Schedule follow-up tests

## 🔍 Advanced Testing

### Custom Scenarios

```javascript
// Contoh custom scenario untuk testing khusus
const customScenario = {
  name: "Custom Scenario",
  weight: 100,
  flow: [
    // Login
    { post: { url: "/api/auth/login", ... }},
    // Custom business logic
    { post: { url: "/api/custom-endpoint", ... }},
    // Validation
    { get: { url: "/api/validate", ... }}
  ]
};
```

### Load Testing Best Practices

1. **Start Small**: Begin with light loads
2. **Gradual Increase**: Ramp up slowly
3. **Monitor Everything**: Watch all system metrics
4. **Test Realistic Scenarios**: Use production-like data
5. **Document Results**: Keep detailed records
6. **Regular Testing**: Include in CI/CD pipeline

## 📞 Support

Jika mengalami masalah dalam load testing:

1. Check logs di `load-test-results.log`
2. Periksa system metrics
3. Validasi konfigurasi test
4. Konsultasi dengan tim development

## 📚 References

- [Artillery.js Documentation](https://artillery.io/docs/)
- [K6 Documentation](https://k6.io/docs/)
- [Load Testing Best Practices](https://artillery.io/docs/guides/getting-started/core-concepts.html)
- [Performance Testing Guidelines](https://k6.io/docs/testing-guides/)
