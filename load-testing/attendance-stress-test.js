const axios = require("axios");
const moment = require("moment");
const colors = require("colors");

// Specialized stress test for attendance endpoint
const STRESS_CONFIG = {
	baseURL: "https://presensi.itbhayangkara.id",

	// Stress test phases
	phases: [
		{ name: "Baseline", users: 10, durationMinutes: 2 },
		{ name: "Load Test", users: 50, durationMinutes: 5 },
		{ name: "Stress Test", users: 100, durationMinutes: 5 },
		{ name: "Spike Test", users: 200, durationMinutes: 3 },
		{ name: "Volume Test", users: 150, durationMinutes: 10 },
		{ name: "Recovery", users: 20, durationMinutes: 2 },
	],

	requestTimeoutMs: 60000,

	testUsers: [
		{ id: "EMP001", password: "password123" },
		{ id: "EMP002", password: "pass456" },
		{ id: "EMP003", password: "test789" },
		{ id: "EMP004", password: "demo123" },
		{ id: "EMP005", password: "user456" },
		{ id: "EMP006", password: "test123" },
		{ id: "EMP007", password: "pass789" },
		{ id: "EMP008", password: "demo456" },
		{ id: "EMP009", password: "user789" },
		{ id: "EMP010", password: "test456" },
	],

	officeLocation: {
		latitude: -7.9797,
		longitude: 112.6304,
		allowedRadius: 500,
	},
};

// Global metrics
const stressMetrics = {
	phases: [],
	currentPhase: null,
	totalRequests: 0,
	successfulRequests: 0,
	failedRequests: 0,
	timeoutRequests: 0,
	responseTimes: [],
	errors: [],
	concurrentUsers: 0,
	systemErrors: [],
	databaseErrors: [],
	memoryUsage: [],
	startTime: null,
};

// Create HTTP client
const client = axios.create({
	baseURL: STRESS_CONFIG.baseURL,
	timeout: STRESS_CONFIG.requestTimeoutMs,
	httpsAgent: new (require("https").Agent)({
		rejectUnauthorized: false,
	}),
});

class AttendanceStressWorker {
	constructor(workerId) {
		this.workerId = workerId;
		this.authToken = null;
		this.isActive = false;
		this.requestCount = 0;
		this.successCount = 0;
		this.errorCount = 0;
		this.user = null;
	}

	async initialize() {
		try {
			// Select random user
			this.user =
				STRESS_CONFIG.testUsers[this.workerId % STRESS_CONFIG.testUsers.length];

			// Login
			const loginResponse = await client.post("/api/auth/login", {
				username: this.user.id,
				password: this.user.password,
			});

			if (loginResponse.status === 200 && loginResponse.data.token) {
				this.authToken = loginResponse.data.token;
				return true;
			}

			return false;
		} catch (error) {
			console.error(`Worker ${this.workerId} login failed:`, error.message);
			return false;
		}
	}

	generateAttendanceData() {
		const { latitude, longitude, allowedRadius } = STRESS_CONFIG.officeLocation;

		// Generate coordinates within allowed radius (with some outside for testing)
		const isValid = Math.random() > 0.1; // 90% valid locations
		let lat, lng;

		if (isValid) {
			// Within allowed radius
			const radiusInDegrees = allowedRadius / 111320;
			lat = latitude + (Math.random() - 0.5) * radiusInDegrees;
			lng = longitude + (Math.random() - 0.5) * radiusInDegrees;
		} else {
			// Outside allowed radius (for testing rejection)
			lat = latitude + (Math.random() - 0.5) * 0.1;
			lng = longitude + (Math.random() - 0.5) * 0.1;
		}

		// Generate realistic photo data
		const photoSizes = [1000, 1500, 2000, 2500, 3000];
		const photoSize = photoSizes[Math.floor(Math.random() * photoSizes.length)];
		const photoData = this.generatePhotoBase64(photoSize);

		return {
			photo: photoData,
			timestamp: new Date().toISOString(),
			latitude: lat,
			longitude: lng,
			isCheckingOut: Math.random() > 0.6, // 40% check-out requests
			securityData: {
				accuracy: Math.floor(Math.random() * 45) + 5, // 5-50m accuracy
				warnings: this.generateSecurityWarnings(),
			},
		};
	}

	generatePhotoBase64(size) {
		const basePhoto = "data:image/jpeg;base64,";
		const chars =
			"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
		let data = "";

		for (let i = 0; i < size; i++) {
			data += chars.charAt(Math.floor(Math.random() * chars.length));
		}

		return basePhoto + data;
	}

	generateSecurityWarnings() {
		const warnings = [
			"GPS akurasi rendah",
			"Lokasi berubah terlalu cepat",
			"Sinyal GPS tidak stabil",
			"Deteksi mock location",
			"Pola pergerakan tidak wajar",
			"Timestamp tidak sesuai",
		];

		const numWarnings = Math.floor(Math.random() * 3); // 0-2 warnings
		const selectedWarnings = [];

		for (let i = 0; i < numWarnings; i++) {
			const warning = warnings[Math.floor(Math.random() * warnings.length)];
			if (!selectedWarnings.includes(warning)) {
				selectedWarnings.push(warning);
			}
		}

		return selectedWarnings;
	}

	async makeAttendanceRequest() {
		const requestStart = Date.now();

		try {
			const attendanceData = this.generateAttendanceData();

			const response = await client.post("/api/attendance", attendanceData, {
				headers: {
					Cookie: `auth_token=${this.authToken}`,
					"Content-Type": "application/json",
				},
			});

			const responseTime = Date.now() - requestStart;

			// Update metrics
			stressMetrics.totalRequests++;
			stressMetrics.responseTimes.push(responseTime);

			if (response.status >= 200 && response.status < 400) {
				stressMetrics.successfulRequests++;
				this.successCount++;
			} else {
				stressMetrics.failedRequests++;
				this.errorCount++;
			}

			this.requestCount++;

			// Log slow requests
			if (responseTime > 10000) {
				console.warn(
					`Slow request: ${responseTime}ms - Worker ${this.workerId}`.yellow
				);
			}

			return { success: true, responseTime, status: response.status };
		} catch (error) {
			const responseTime = Date.now() - requestStart;

			stressMetrics.totalRequests++;
			stressMetrics.responseTimes.push(responseTime);
			this.requestCount++;

			if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
				stressMetrics.timeoutRequests++;
				console.error(`Timeout: Worker ${this.workerId}`.red);
			} else {
				stressMetrics.failedRequests++;
				this.errorCount++;

				// Categorize errors
				if (error.response?.status >= 500) {
					stressMetrics.systemErrors.push({
						worker: this.workerId,
						status: error.response.status,
						message: error.message,
						timestamp: new Date().toISOString(),
					});
				} else if (
					error.message.includes("database") ||
					error.message.includes("connection")
				) {
					stressMetrics.databaseErrors.push({
						worker: this.workerId,
						message: error.message,
						timestamp: new Date().toISOString(),
					});
				}

				stressMetrics.errors.push({
					worker: this.workerId,
					error: error.message,
					status: error.response?.status || 0,
					timestamp: new Date().toISOString(),
				});
			}

			return { success: false, responseTime, error: error.message };
		}
	}

	async run() {
		this.isActive = true;

		while (this.isActive) {
			await this.makeAttendanceRequest();

			// Think time - simulate user behavior
			const thinkTime = Math.floor(Math.random() * 3000) + 500; // 0.5-3.5s
			await new Promise((resolve) => setTimeout(resolve, thinkTime));
		}
	}

	stop() {
		this.isActive = false;
	}
}

async function runStressPhase(phase) {
	console.log(`\n🔥 Starting ${phase.name} Phase`.cyan.bold);
	console.log(
		`Users: ${phase.users}, Duration: ${phase.durationMinutes} minutes`
	);

	stressMetrics.currentPhase = {
		name: phase.name,
		users: phase.users,
		startTime: Date.now(),
		startRequests: stressMetrics.totalRequests,
	};

	const workers = [];

	// Initialize workers
	for (let i = 0; i < phase.users; i++) {
		const worker = new AttendanceStressWorker(i);
		const initialized = await worker.initialize();

		if (initialized) {
			workers.push(worker);
		} else {
			console.warn(`Failed to initialize worker ${i}`);
		}

		// Gradual ramp-up
		if (i % 10 === 0 && i > 0) {
			await new Promise((resolve) => setTimeout(resolve, 500));
		}
	}

	stressMetrics.concurrentUsers = workers.length;
	console.log(
		`${workers.length}/${phase.users} workers initialized successfully`
	);

	// Start all workers
	const workerPromises = workers.map((worker) => worker.run());

	// Run for specified duration
	await new Promise((resolve) =>
		setTimeout(resolve, phase.durationMinutes * 60 * 1000)
	);

	// Stop all workers
	workers.forEach((worker) => worker.stop());

	// Wait for workers to finish
	await Promise.allSettled(workerPromises);

	// Record phase metrics
	const phaseEndTime = Date.now();
	const phaseDuration =
		(phaseEndTime - stressMetrics.currentPhase.startTime) / 1000;
	const phaseRequests =
		stressMetrics.totalRequests - stressMetrics.currentPhase.startRequests;

	const phaseMetrics = {
		name: phase.name,
		users: phase.users,
		duration: phaseDuration,
		requests: phaseRequests,
		throughput: phaseRequests / phaseDuration,
		workers: workers.map((w) => ({
			id: w.workerId,
			requests: w.requestCount,
			successes: w.successCount,
			errors: w.errorCount,
		})),
	};

	stressMetrics.phases.push(phaseMetrics);

	console.log(`Phase ${phase.name} completed:`.green);
	console.log(`  Requests: ${phaseRequests}`);
	console.log(`  Throughput: ${phaseMetrics.throughput.toFixed(2)} req/s`);
	console.log(
		`  Success Rate: ${(
			(stressMetrics.successfulRequests / stressMetrics.totalRequests) *
			100
		).toFixed(2)}%`
	);
}

function generateStressReport() {
	const totalDuration = (Date.now() - stressMetrics.startTime) / 1000;
	const avgResponseTime =
		stressMetrics.responseTimes.length > 0
			? stressMetrics.responseTimes.reduce((a, b) => a + b, 0) /
			  stressMetrics.responseTimes.length
			: 0;

	// Calculate percentiles
	const sortedTimes = stressMetrics.responseTimes.sort((a, b) => a - b);
	const p50 = sortedTimes[Math.floor(sortedTimes.length * 0.5)] || 0;
	const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)] || 0;
	const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)] || 0;

	console.log("\n📊 ATTENDANCE STRESS TEST RESULTS".cyan.bold);
	console.log("═".repeat(60));
	console.log(`Total Duration: ${totalDuration.toFixed(2)} seconds`);
	console.log(`Total Requests: ${stressMetrics.totalRequests}`);
	console.log(
		`Successful: ${stressMetrics.successfulRequests} (${(
			(stressMetrics.successfulRequests / stressMetrics.totalRequests) *
			100
		).toFixed(2)}%)`
	);
	console.log(
		`Failed: ${stressMetrics.failedRequests} (${(
			(stressMetrics.failedRequests / stressMetrics.totalRequests) *
			100
		).toFixed(2)}%)`
	);
	console.log(`Timeouts: ${stressMetrics.timeoutRequests}`);
	console.log(
		`Overall Throughput: ${(
			stressMetrics.totalRequests / totalDuration
		).toFixed(2)} req/s`
	);

	console.log("\n⏱️  Response Time Analysis:");
	console.log(`Average: ${avgResponseTime.toFixed(2)}ms`);
	console.log(`50th Percentile: ${p50.toFixed(2)}ms`);
	console.log(`95th Percentile: ${p95.toFixed(2)}ms`);
	console.log(`99th Percentile: ${p99.toFixed(2)}ms`);

	console.log("\n📈 Phase-by-Phase Results:");
	stressMetrics.phases.forEach((phase) => {
		console.log(`${phase.name}:`);
		console.log(`  Users: ${phase.users}, Requests: ${phase.requests}`);
		console.log(`  Throughput: ${phase.throughput.toFixed(2)} req/s`);
	});

	if (stressMetrics.systemErrors.length > 0) {
		console.log("\n❌ System Errors (5xx):".red.bold);
		const errorCounts = {};
		stressMetrics.systemErrors.forEach((error) => {
			const key = `${error.status}: ${error.message}`;
			errorCounts[key] = (errorCounts[key] || 0) + 1;
		});
		Object.entries(errorCounts).forEach(([error, count]) => {
			console.log(`  ${error} (${count} times)`.red);
		});
	}

	if (stressMetrics.databaseErrors.length > 0) {
		console.log("\n🗄️  Database Errors:".yellow.bold);
		console.log(`  Total: ${stressMetrics.databaseErrors.length} errors`);
	}

	// Performance assessment
	console.log("\n🎯 Performance Assessment:");

	// Response time assessment
	if (avgResponseTime < 1000) {
		console.log("  Response Time: Excellent".green);
	} else if (avgResponseTime < 3000) {
		console.log("  Response Time: Good".yellow);
	} else if (avgResponseTime < 10000) {
		console.log("  Response Time: Poor".red);
	} else {
		console.log("  Response Time: Critical".red.bold);
	}

	// Error rate assessment
	const errorRate =
		(stressMetrics.failedRequests / stressMetrics.totalRequests) * 100;
	if (errorRate < 0.1) {
		console.log("  Error Rate: Excellent".green);
	} else if (errorRate < 1) {
		console.log("  Error Rate: Good".yellow);
	} else if (errorRate < 5) {
		console.log("  Error Rate: Acceptable".orange);
	} else {
		console.log("  Error Rate: Poor".red);
	}

	// System stability assessment
	if (stressMetrics.systemErrors.length === 0) {
		console.log("  System Stability: Excellent".green);
	} else if (stressMetrics.systemErrors.length < 10) {
		console.log("  System Stability: Good".yellow);
	} else {
		console.log("  System Stability: Poor".red);
	}
}

async function runAttendanceStressTest() {
	console.log("🚀 ATTENDANCE ENDPOINT STRESS TEST".cyan.bold);
	console.log(
		"This test will progressively increase load on the attendance endpoint"
	);
	console.log("to identify performance bottlenecks and breaking points.\n");

	stressMetrics.startTime = Date.now();

	try {
		for (const phase of STRESS_CONFIG.phases) {
			await runStressPhase(phase);

			// Brief pause between phases
			if (phase !== STRESS_CONFIG.phases[STRESS_CONFIG.phases.length - 1]) {
				console.log("Pausing between phases...".gray);
				await new Promise((resolve) => setTimeout(resolve, 10000));
			}
		}

		generateStressReport();
	} catch (error) {
		console.error("Stress test failed:", error.message);
		generateStressReport();
	}
}

// Handle graceful shutdown
process.on("SIGINT", () => {
	console.log("\n🛑 Stress test interrupted");
	generateStressReport();
	process.exit(0);
});

if (require.main === module) {
	runAttendanceStressTest();
}

module.exports = { runAttendanceStressTest, AttendanceStressWorker };
