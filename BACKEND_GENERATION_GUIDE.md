# Backend Generation Guide: Nomor Pengajuan KTA

## Overview

Dokumentasi ini menjelaskan implementasi generate nomor pengajuan KTA di backend JavaScript, menggantikan pendekatan database function/trigger.

## Keunggulan Backend Generation

### 🎯 **Fleksibilitas**

- Custom logic untuk format nomor
- Easy debugging dan logging
- Conditional generation berdasarkan business rules
- Integration dengan external services

### 🔧 **Maintainability**

- Code di version control
- Unit testing yang mudah
- Refactoring yang aman
- Documentation yang lebih baik

### 🚀 **Performance**

- Tidak ada database overhead untuk function calls
- Caching possibilities
- Async/await pattern yang optimal
- Error handling yang lebih granular

### 🔒 **Security**

- Input validation di aplikasi level
- Rate limiting dan throttling
- Audit trail yang detail
- Custom authorization logic

## Architecture

### 1. Helper Functions (`src/lib/pengajuan-kta-helper.js`)

```javascript
// Core functions
generateNoPengajuan(date); // Generate basic number
generateUniqueNoPengajuan(date); // Generate with uniqueness check
validateNoPengajuan(noPengajuan); // Validate format
parseNoPengajuan(noPengajuan); // Parse components
isNoPengajuanExists(noPengajuan); // Check existence
getPengajuanStats(year, month); // Get statistics
```

### 2. API Integration (`src/app/api/pengajuan-kta/route.js`)

```javascript
// POST method workflow
1. Validate input
2. Check existing pending requests
3. Generate unique no_pengajuan
4. Insert to database with no_pengajuan
5. Return response with generated number
```

### 3. Statistics API (`src/app/api/pengajuan-kta/stats/route.js`)

```javascript
// GET /api/pengajuan-kta/stats
- Current month statistics
- Status breakdown
- Monthly trends
- Next number preview
```

## Implementation Details

### Format Generation

```javascript
// Format: KTA-YYYY-MM-NNNN
const year = moment().format("YYYY"); // 2024
const month = moment().format("MM"); // 01, 02, etc
const sequence = nextNumber.padStart(4, "0"); // 0001, 0002, etc
const noPengajuan = `KTA-${year}-${month}-${sequence}`;
```

### Uniqueness Guarantee

```javascript
// Retry mechanism untuk handle race conditions
async function generateUniqueNoPengajuan(date, maxRetries = 5) {
	for (let attempts = 0; attempts < maxRetries; attempts++) {
		const noPengajuan = await generateNoPengajuan(date);
		const exists = await isNoPengajuanExists(noPengajuan);

		if (!exists) return noPengajuan;

		// Delay dan retry
		await new Promise((resolve) => setTimeout(resolve, 100));
	}

	throw new Error("Failed to generate unique number");
}
```

### Database Schema

```sql
-- Minimal database schema (no functions/triggers)
ALTER TABLE pengajuan_kta
ADD COLUMN no_pengajuan VARCHAR(20) NOT NULL UNIQUE AFTER id;

-- Indexes for performance
CREATE INDEX idx_no_pengajuan ON pengajuan_kta(no_pengajuan);
CREATE INDEX idx_pengajuan_year_month ON pengajuan_kta(YEAR(created_at), MONTH(created_at));
```

## API Specifications

### POST /api/pengajuan-kta

```javascript
// Request
{
  "jenis": "Baru",
  "alasan": "Karyawan baru"
}

// Response
{
  "status": 201,
  "message": "Pengajuan KTA berhasil disubmit",
  "data": {
    "id": 1,
    "no_pengajuan": "KTA-2024-01-0001",
    "nik": "1234567890",
    "jenis": "Baru",
    "alasan": "Karyawan baru",
    "status": "pending",
    "created_at": "2024-01-15 10:30:00"
  }
}
```

### GET /api/pengajuan-kta/stats

```javascript
// Query Parameters
?year=2024&month=01

// Response
{
  "status": 200,
  "data": {
    "period": {
      "year": 2024,
      "month": 1,
      "month_name": "Januari 2024"
    },
    "current_month": {
      "total_pengajuan": 15,
      "last_sequence": 15,
      "first_no": "KTA-2024-01-0001",
      "last_no": "KTA-2024-01-0015"
    },
    "status_breakdown": {
      "pending": 3,
      "disetujui": 8,
      "ditolak": 2,
      "selesai": 2
    },
    "next_number": 16,
    "next_no_pengajuan": "KTA-2024-01-0016"
  }
}
```

## Error Handling

### Generation Errors

```javascript
try {
	const noPengajuan = await generateUniqueNoPengajuan();
} catch (error) {
	// Log error
	console.error("Generation failed:", error);

	// Return user-friendly message
	return NextResponse.json(
		{
			message: "Sistem sedang sibuk, silakan coba lagi",
		},
		{ status: 503 }
	);
}
```

### Validation Errors

```javascript
if (!validateNoPengajuan(noPengajuan)) {
	return NextResponse.json(
		{
			message: "Format nomor pengajuan tidak valid",
		},
		{ status: 400 }
	);
}
```

### Race Condition Handling

```javascript
// Database constraint akan catch duplicate
try {
  await insert({ table: "pengajuan_kta", data: { no_pengajuan, ... } });
} catch (error) {
  if (error.code === 'ER_DUP_ENTRY') {
    // Retry dengan nomor baru
    return await generateAndInsert();
  }
  throw error;
}
```

## Testing Strategy

### Unit Tests

```javascript
describe("generateNoPengajuan", () => {
	test("should generate correct format", () => {
		const result = generateNoPengajuan(new Date("2024-01-15"));
		expect(result).toMatch(/^KTA-2024-01-\d{4}$/);
	});
});

describe("validateNoPengajuan", () => {
	test("should validate correct format", () => {
		expect(validateNoPengajuan("KTA-2024-01-0001")).toBe(true);
		expect(validateNoPengajuan("INVALID")).toBe(false);
	});
});
```

### Integration Tests

```javascript
describe("POST /api/pengajuan-kta", () => {
	test("should generate unique no_pengajuan", async () => {
		const response = await request(app)
			.post("/api/pengajuan-kta")
			.send({ jenis: "Baru", alasan: "Test" });

		expect(response.body.data.no_pengajuan).toMatch(/^KTA-\d{4}-\d{2}-\d{4}$/);
	});
});
```

### Load Tests

```javascript
// Test concurrent requests
describe("Concurrent generation", () => {
	test("should handle 100 concurrent requests", async () => {
		const promises = Array(100)
			.fill()
			.map(() => generateUniqueNoPengajuan());

		const results = await Promise.all(promises);
		const unique = new Set(results);

		expect(unique.size).toBe(100); // All should be unique
	});
});
```

## Performance Considerations

### Database Optimization

```sql
-- Compound index untuk faster queries
CREATE INDEX idx_pengajuan_lookup ON pengajuan_kta(
  YEAR(created_at),
  MONTH(created_at),
  SUBSTRING(no_pengajuan, -4)
);

-- Partitioning by year (optional)
ALTER TABLE pengajuan_kta PARTITION BY RANGE (YEAR(created_at)) (
  PARTITION p2024 VALUES LESS THAN (2025),
  PARTITION p2025 VALUES LESS THAN (2026)
);
```

### Caching Strategy

```javascript
// Cache last sequence number
const cache = new Map();

async function getCachedLastSequence(year, month) {
	const key = `${year}-${month}`;

	if (cache.has(key)) {
		return cache.get(key);
	}

	const result = await getLastSequenceFromDB(year, month);
	cache.set(key, result);

	// Auto-expire cache after 1 minute
	setTimeout(() => cache.delete(key), 60000);

	return result;
}
```

### Connection Pooling

```javascript
// Optimize database connections
const pool = mysql.createPool({
	connectionLimit: 10,
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_NAME,
	acquireTimeout: 60000,
	timeout: 60000,
});
```

## Monitoring & Logging

### Generation Metrics

```javascript
// Track generation performance
const metrics = {
	totalGenerated: 0,
	averageTime: 0,
	failureRate: 0,
	retryCount: 0,
};

async function generateWithMetrics() {
	const startTime = Date.now();

	try {
		const result = await generateUniqueNoPengajuan();
		metrics.totalGenerated++;
		metrics.averageTime = (metrics.averageTime + (Date.now() - startTime)) / 2;
		return result;
	} catch (error) {
		metrics.failureRate++;
		throw error;
	}
}
```

### Error Logging

```javascript
// Structured logging
const logger = {
	info: (message, data) =>
		console.log(
			JSON.stringify({ level: "info", message, data, timestamp: new Date() })
		),
	error: (message, error) =>
		console.error(
			JSON.stringify({
				level: "error",
				message,
				error: error.message,
				stack: error.stack,
				timestamp: new Date(),
			})
		),
};

// Usage
logger.info("Generated no_pengajuan", { noPengajuan, userId, timestamp });
logger.error("Generation failed", error);
```

## Migration Steps

### 1. Database Migration

```bash
# Run the simplified migration
mysql -u username -p database_name < database_migration_pengajuan_kta_v2.sql
```

### 2. Deploy Backend Changes

```bash
# Deploy helper functions and API updates
npm run build
npm run deploy
```

### 3. Verify Generation

```bash
# Test generation endpoint
curl -X POST /api/pengajuan-kta \
  -H "Content-Type: application/json" \
  -d '{"jenis":"Baru","alasan":"Test generation"}'
```

### 4. Monitor Performance

```bash
# Check generation metrics
curl /api/pengajuan-kta/stats?year=2024&month=01
```

## Troubleshooting

### Common Issues

#### 1. Duplicate Number Generation

```javascript
// Symptoms: ER_DUP_ENTRY errors
// Solution: Increase retry count or add delay

const noPengajuan = await generateUniqueNoPengajuan(date, 10); // Increase retries
```

#### 2. Performance Degradation

```javascript
// Symptoms: Slow generation times
// Solution: Add database indexes and caching

// Check slow queries
SHOW PROCESSLIST;
EXPLAIN SELECT ... FROM pengajuan_kta WHERE ...;
```

#### 3. Memory Leaks

```javascript
// Symptoms: Increasing memory usage
// Solution: Proper cleanup and connection pooling

// Monitor memory
process.memoryUsage();
```

## Future Enhancements

### 1. Distributed Generation

```javascript
// For multi-server deployment
const generateWithLock = async () => {
	const lock = await redis.set("generation_lock", "locked", "EX", 10, "NX");
	if (!lock) throw new Error("Generation in progress");

	try {
		return await generateUniqueNoPengajuan();
	} finally {
		await redis.del("generation_lock");
	}
};
```

### 2. Custom Formats

```javascript
// Support different formats per department
const generateCustomFormat = (department, date) => {
	const formats = {
		IT: "KTA-IT-YYYY-MM-NNNN",
		HRD: "KTA-HR-YYYY-MM-NNNN",
		default: "KTA-YYYY-MM-NNNN",
	};

	return applyFormat(formats[department] || formats.default, date);
};
```

### 3. Batch Generation

```javascript
// For bulk imports
const generateBatch = async (count, date) => {
	const numbers = [];

	for (let i = 0; i < count; i++) {
		numbers.push(await generateUniqueNoPengajuan(date));
	}

	return numbers;
};
```

---

**Implementation Date**: 2024
**Version**: 2.0.0
**Status**: Production Ready
**Approach**: Backend Generation
