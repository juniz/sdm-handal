const axios = require("axios");
const moment = require("moment");
const colors = require("colors");
const winston = require("winston");

// Configure logger
const logger = winston.createLogger({
	level: "info",
	format: winston.format.combine(
		winston.format.timestamp(),
		winston.format.json()
	),
	transports: [
		new winston.transports.File({ filename: "load-test-results.log" }),
		new winston.transports.Console({ format: winston.format.simple() }),
	],
});

// Test configuration
const CONFIG = {
	baseURL: "https://localhost:3000",
	maxConcurrentUsers: 50,
	testDurationMinutes: 10,
	rampUpTimeMinutes: 2,
	requestTimeoutMs: 30000,
	thinkTimeMs: 1000,

	// Test users
	testUsers: [
		{ username: "EMP001", password: "password123" },
		{ username: "EMP002", password: "pass456" },
		{ username: "EMP003", password: "test789" },
		{ username: "admin", password: "admin123" },
	],

	// Office coordinates
	officeLocation: {
		latitude: -7.9797,
		longitude: 112.6304,
		radius: 500, // meters
	},
};

// Test metrics
const metrics = {
	requests: {
		total: 0,
		successful: 0,
		failed: 0,
		timeouts: 0,
	},
	responseTimes: [],
	errors: [],
	startTime: null,
	endTime: null,
};

// Create axios instance with default config
const api = axios.create({
	baseURL: CONFIG.baseURL,
	timeout: CONFIG.requestTimeoutMs,
	headers: {
		"Content-Type": "application/json",
	},
	httpsAgent: new (require("https").Agent)({
		rejectUnauthorized: false,
	}),
});

// Utility functions
const utils = {
	randomElement: (array) => array[Math.floor(Math.random() * array.length)],

	randomInt: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,

	randomFloat: (min, max) => Math.random() * (max - min) + min,

	generateGPSCoordinates: () => {
		const { latitude, longitude, radius } = CONFIG.officeLocation;
		const radiusInDegrees = radius / 111320; // Convert meters to degrees

		const randomLat = latitude + (Math.random() - 0.5) * radiusInDegrees;
		const randomLng = longitude + (Math.random() - 0.5) * radiusInDegrees;

		return { latitude: randomLat, longitude: randomLng };
	},

	generatePhotoData: () => {
		// Generate fake base64 photo data
		const basePhoto =
			"data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=";
		return basePhoto;
	},

	sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),

	logRequest: (method, url, duration, status) => {
		metrics.requests.total++;
		metrics.responseTimes.push(duration);

		if (status >= 200 && status < 400) {
			metrics.requests.successful++;
		} else {
			metrics.requests.failed++;
		}

		const color = status >= 200 && status < 400 ? "green" : "red";
		console.log(
			`${method.toUpperCase()} ${url} - ${status} (${duration}ms)`[color]
		);
	},
};

// User session class
class UserSession {
	constructor(userId) {
		this.userId = userId;
		this.authToken = null;
		this.isActive = true;
		this.requestCount = 0;
	}

	async login() {
		try {
			const user = utils.randomElement(CONFIG.testUsers);
			const startTime = Date.now();

			const response = await api.post("/api/auth/login", {
				username: user.username,
				password: user.password,
			});

			const duration = Date.now() - startTime;
			utils.logRequest("POST", "/api/auth/login", duration, response.status);

			if (response.status === 200 && response.data.token) {
				this.authToken = response.data.token;
				return true;
			}

			return false;
		} catch (error) {
			const duration = Date.now() - (error.config?.startTime || Date.now());
			utils.logRequest(
				"POST",
				"/api/auth/login",
				duration,
				error.response?.status || 0
			);
			metrics.errors.push({
				endpoint: "/api/auth/login",
				error: error.message,
			});
			return false;
		}
	}

	async makeAttendanceRequest() {
		if (!this.authToken) return false;

		try {
			const coordinates = utils.generateGPSCoordinates();
			const startTime = Date.now();

			const response = await api.post(
				"/api/attendance",
				{
					photo: utils.generatePhotoData(),
					timestamp: new Date().toISOString(),
					latitude: coordinates.latitude,
					longitude: coordinates.longitude,
					isCheckingOut: Math.random() > 0.7, // 30% chance of check-out
					securityData: {
						accuracy: utils.randomInt(5, 50),
						warnings: [],
					},
				},
				{
					headers: {
						Cookie: `auth_token=${this.authToken}`,
					},
				}
			);

			const duration = Date.now() - startTime;
			utils.logRequest("POST", "/api/attendance", duration, response.status);

			return response.status === 200;
		} catch (error) {
			const duration = Date.now() - (error.config?.startTime || Date.now());
			utils.logRequest(
				"POST",
				"/api/attendance",
				duration,
				error.response?.status || 0
			);
			metrics.errors.push({
				endpoint: "/api/attendance",
				error: error.message,
			});
			return false;
		}
	}

	async checkAttendanceStatus() {
		if (!this.authToken) return false;

		try {
			const startTime = Date.now();

			const response = await api.get("/api/attendance", {
				headers: {
					Cookie: `auth_token=${this.authToken}`,
				},
			});

			const duration = Date.now() - startTime;
			utils.logRequest("GET", "/api/attendance", duration, response.status);

			return response.status === 200;
		} catch (error) {
			const duration = Date.now() - (error.config?.startTime || Date.now());
			utils.logRequest(
				"GET",
				"/api/attendance",
				duration,
				error.response?.status || 0
			);
			metrics.errors.push({
				endpoint: "/api/attendance",
				error: error.message,
			});
			return false;
		}
	}

	async accessDashboard() {
		if (!this.authToken) return false;

		try {
			const startTime = Date.now();

			const response = await api.get("/dashboard", {
				headers: {
					Cookie: `auth_token=${this.authToken}`,
				},
			});

			const duration = Date.now() - startTime;
			utils.logRequest("GET", "/dashboard", duration, response.status);

			return response.status === 200;
		} catch (error) {
			const duration = Date.now() - (error.config?.startTime || Date.now());
			utils.logRequest(
				"GET",
				"/dashboard",
				duration,
				error.response?.status || 0
			);
			metrics.errors.push({ endpoint: "/dashboard", error: error.message });
			return false;
		}
	}

	async runUserFlow() {
		// Login
		const loginSuccess = await this.login();
		if (!loginSuccess) {
			this.isActive = false;
			return;
		}

		// Random user behavior
		while (this.isActive && this.requestCount < 100) {
			const action = utils.randomInt(1, 100);

			if (action <= 40) {
				// 40% chance - Check attendance status
				await this.checkAttendanceStatus();
			} else if (action <= 70) {
				// 30% chance - Make attendance request
				await this.makeAttendanceRequest();
			} else {
				// 30% chance - Access dashboard
				await this.accessDashboard();
			}

			this.requestCount++;
			await utils.sleep(CONFIG.thinkTimeMs + utils.randomInt(0, 2000));
		}
	}
}

// Main load test execution
async function runLoadTest() {
	console.log("🚀 Starting Load Test".cyan.bold);
	console.log(`Configuration:`);
	console.log(`  Base URL: ${CONFIG.baseURL}`);
	console.log(`  Max Concurrent Users: ${CONFIG.maxConcurrentUsers}`);
	console.log(`  Test Duration: ${CONFIG.testDurationMinutes} minutes`);
	console.log(`  Ramp-up Time: ${CONFIG.rampUpTimeMinutes} minutes`);
	console.log("");

	metrics.startTime = Date.now();
	const sessions = [];

	// Ramp-up phase
	console.log("📈 Ramp-up phase starting...".yellow);
	const rampUpInterval =
		(CONFIG.rampUpTimeMinutes * 60 * 1000) / CONFIG.maxConcurrentUsers;

	for (let i = 0; i < CONFIG.maxConcurrentUsers; i++) {
		const session = new UserSession(i);
		sessions.push(session);

		// Start user session
		session.runUserFlow().catch((error) => {
			console.error(`User ${i} error:`, error.message);
		});

		await utils.sleep(rampUpInterval);
	}

	console.log("🏃 All users active, running steady state...".green);

	// Run for specified duration
	await utils.sleep(CONFIG.testDurationMinutes * 60 * 1000);

	// Stop all sessions
	sessions.forEach((session) => {
		session.isActive = false;
	});

	metrics.endTime = Date.now();

	// Wait for all sessions to complete
	await utils.sleep(5000);

	// Generate report
	generateReport();
}

function generateReport() {
	const duration = (metrics.endTime - metrics.startTime) / 1000;
	const avgResponseTime =
		metrics.responseTimes.length > 0
			? metrics.responseTimes.reduce((a, b) => a + b, 0) /
			  metrics.responseTimes.length
			: 0;

	const p95ResponseTime =
		metrics.responseTimes.length > 0
			? metrics.responseTimes.sort((a, b) => a - b)[
					Math.floor(metrics.responseTimes.length * 0.95)
			  ]
			: 0;

	const throughput = metrics.requests.total / duration;
	const errorRate = (metrics.requests.failed / metrics.requests.total) * 100;

	console.log("\n📊 Load Test Results".cyan.bold);
	console.log("═".repeat(50));
	console.log(`Duration: ${duration.toFixed(2)} seconds`);
	console.log(`Total Requests: ${metrics.requests.total}`);
	console.log(
		`Successful: ${metrics.requests.successful} (${(
			(metrics.requests.successful / metrics.requests.total) *
			100
		).toFixed(2)}%)`
	);
	console.log(`Failed: ${metrics.requests.failed} (${errorRate.toFixed(2)}%)`);
	console.log(`Throughput: ${throughput.toFixed(2)} req/sec`);
	console.log(`Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
	console.log(`95th Percentile Response Time: ${p95ResponseTime.toFixed(2)}ms`);

	if (metrics.errors.length > 0) {
		console.log("\n❌ Error Summary:");
		const errorGroups = {};
		metrics.errors.forEach((error) => {
			const key = `${error.endpoint}: ${error.error}`;
			errorGroups[key] = (errorGroups[key] || 0) + 1;
		});

		Object.entries(errorGroups).forEach(([error, count]) => {
			console.log(`  ${error} (${count} times)`);
		});
	}

	// Performance assessment
	console.log("\n🎯 Performance Assessment:");
	if (avgResponseTime < 1000) {
		console.log("  Response Time: Excellent (<1s)".green);
	} else if (avgResponseTime < 3000) {
		console.log("  Response Time: Good (1-3s)".yellow);
	} else {
		console.log("  Response Time: Poor (>3s)".red);
	}

	if (errorRate < 1) {
		console.log("  Error Rate: Excellent (<1%)".green);
	} else if (errorRate < 5) {
		console.log("  Error Rate: Acceptable (1-5%)".yellow);
	} else {
		console.log("  Error Rate: Poor (>5%)".red);
	}

	if (throughput > 10) {
		console.log("  Throughput: Good (>10 req/s)".green);
	} else if (throughput > 5) {
		console.log("  Throughput: Moderate (5-10 req/s)".yellow);
	} else {
		console.log("  Throughput: Low (<5 req/s)".red);
	}

	// Log results
	logger.info("Load test completed", {
		duration,
		totalRequests: metrics.requests.total,
		successfulRequests: metrics.requests.successful,
		failedRequests: metrics.requests.failed,
		throughput,
		avgResponseTime,
		p95ResponseTime,
		errorRate,
	});
}

// Handle process termination
process.on("SIGINT", () => {
	console.log("\n🛑 Test interrupted by user");
	metrics.endTime = Date.now();
	generateReport();
	process.exit(0);
});

// Start the load test
if (require.main === module) {
	runLoadTest().catch((error) => {
		console.error("Load test failed:", error.message);
		process.exit(1);
	});
}

module.exports = { runLoadTest, UserSession, utils };
