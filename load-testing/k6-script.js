import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend, Counter } from "k6/metrics";

// Custom metrics
const errorRate = new Rate("errors");
const attendanceResponseTime = new Trend("attendance_response_time");
const loginResponseTime = new Trend("login_response_time");
const requestsPerSecond = new Counter("requests_per_second");

// Test configuration
export const options = {
	stages: [
		// Warm-up
		{ duration: "2m", target: 10 },
		// Ramp-up to normal load
		{ duration: "5m", target: 50 },
		// Normal load
		{ duration: "10m", target: 50 },
		// Ramp-up to high load
		{ duration: "3m", target: 100 },
		// High load
		{ duration: "5m", target: 100 },
		// Spike test
		{ duration: "2m", target: 200 },
		// Spike load
		{ duration: "3m", target: 200 },
		// Ramp-down
		{ duration: "5m", target: 0 },
	],
	thresholds: {
		http_req_duration: ["p(95)<5000"], // 95% of requests must complete below 5s
		http_req_failed: ["rate<0.1"], // Error rate must be below 10%
		errors: ["rate<0.05"], // Custom error rate must be below 5%
		attendance_response_time: ["p(95)<3000"], // Attendance API 95th percentile
		login_response_time: ["p(95)<2000"], // Login API 95th percentile
	},
	insecureSkipTLSVerify: true,
	noConnectionReuse: false,
};

// Test data
const BASE_URL = "https://localhost:3000";
const TEST_USERS = [
	{ username: "EMP001", password: "password123" },
	{ username: "EMP002", password: "pass456" },
	{ username: "EMP003", password: "test789" },
	{ username: "EMP004", password: "demo123" },
	{ username: "EMP005", password: "user456" },
];

const ADMIN_USER = { username: "admin", password: "admin123" };

// Office location for GPS testing
const OFFICE_LOCATION = {
	latitude: -7.9797,
	longitude: 112.6304,
	radius: 500, // meters
};

// Utility functions
function randomUser() {
	return TEST_USERS[Math.floor(Math.random() * TEST_USERS.length)];
}

function randomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateGPSCoordinates() {
	const radiusInDegrees = OFFICE_LOCATION.radius / 111320;
	const lat =
		OFFICE_LOCATION.latitude + (Math.random() - 0.5) * radiusInDegrees;
	const lng =
		OFFICE_LOCATION.longitude + (Math.random() - 0.5) * radiusInDegrees;
	return { latitude: lat, longitude: lng };
}

function generatePhotoData() {
	// Generate fake base64 photo data
	const size = randomInt(1000, 2000);
	const chars =
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
	let data = "";
	for (let i = 0; i < size; i++) {
		data += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return "data:image/jpeg;base64," + data;
}

function generateSecurityWarnings() {
	const warnings = [
		"GPS akurasi rendah",
		"Lokasi berubah terlalu cepat",
		"Sinyal GPS tidak stabil",
		"Deteksi mock location",
		"Pola pergerakan tidak wajar",
	];

	const numWarnings = randomInt(0, 2);
	const selectedWarnings = [];

	for (let i = 0; i < numWarnings; i++) {
		const warning = warnings[randomInt(0, warnings.length - 1)];
		if (!selectedWarnings.includes(warning)) {
			selectedWarnings.push(warning);
		}
	}

	return selectedWarnings;
}

// Login function
function login(username, password) {
	const startTime = Date.now();

	const response = http.post(
		`${BASE_URL}/api/auth/login`,
		JSON.stringify({
			username: username,
			password: password,
		}),
		{
			headers: {
				"Content-Type": "application/json",
			},
		}
	);

	const responseTime = Date.now() - startTime;
	loginResponseTime.add(responseTime);
	requestsPerSecond.add(1);

	const loginSuccess = check(response, {
		"login status is 200": (r) => r.status === 200,
		"login response has token": (r) => r.json("token") !== undefined,
		"login response time < 5s": (r) => responseTime < 5000,
	});

	if (!loginSuccess) {
		errorRate.add(1);
		return null;
	}

	return response.json("token");
}

// Attendance function
function makeAttendanceRequest(authToken) {
	const coordinates = generateGPSCoordinates();
	const startTime = Date.now();

	const attendanceData = {
		photo: generatePhotoData(),
		timestamp: new Date().toISOString(),
		latitude: coordinates.latitude,
		longitude: coordinates.longitude,
		isCheckingOut: Math.random() > 0.7, // 30% checkout requests
		securityData: {
			accuracy: randomInt(5, 50),
			warnings: generateSecurityWarnings(),
		},
	};

	const response = http.post(
		`${BASE_URL}/api/attendance`,
		JSON.stringify(attendanceData),
		{
			headers: {
				"Content-Type": "application/json",
				Cookie: `auth_token=${authToken}`,
			},
		}
	);

	const responseTime = Date.now() - startTime;
	attendanceResponseTime.add(responseTime);
	requestsPerSecond.add(1);

	const attendanceSuccess = check(response, {
		"attendance status is 200 or 400": (r) =>
			r.status === 200 || r.status === 400,
		"attendance response time < 10s": (r) => responseTime < 10000,
		"attendance response has message": (r) => r.json("message") !== undefined,
	});

	if (!attendanceSuccess && response.status >= 500) {
		errorRate.add(1);
		console.error(
			`Attendance request failed: ${response.status} - ${response.body}`
		);
	}

	return response.status;
}

// Check attendance status
function checkAttendanceStatus(authToken) {
	const response = http.get(`${BASE_URL}/api/attendance`, {
		headers: {
			Cookie: `auth_token=${authToken}`,
		},
	});

	requestsPerSecond.add(1);

	const statusSuccess = check(response, {
		"attendance status check is 200": (r) => r.status === 200,
		"attendance status has data": (r) => r.json("data") !== undefined,
	});

	if (!statusSuccess) {
		errorRate.add(1);
	}

	return response.status;
}

// Access dashboard
function accessDashboard(authToken) {
	const response = http.get(`${BASE_URL}/dashboard`, {
		headers: {
			Cookie: `auth_token=${authToken}`,
		},
	});

	requestsPerSecond.add(1);

	const dashboardSuccess = check(response, {
		"dashboard access is 200": (r) => r.status === 200,
		"dashboard response time < 3s": (r) => r.timings.duration < 3000,
	});

	if (!dashboardSuccess) {
		errorRate.add(1);
	}

	return response.status;
}

// Admin functions
function accessAdminPanel(authToken) {
	const endpoints = [
		"/api/error-logs?page=1&limit=20",
		"/api/admin/security-logs",
		"/dashboard/admin/location-settings",
	];

	const endpoint = endpoints[randomInt(0, endpoints.length - 1)];

	const response = http.get(`${BASE_URL}${endpoint}`, {
		headers: {
			Cookie: `auth_token=${authToken}`,
		},
	});

	requestsPerSecond.add(1);

	const adminSuccess = check(response, {
		"admin panel access success": (r) => r.status === 200 || r.status === 403,
	});

	if (!adminSuccess) {
		errorRate.add(1);
	}

	return response.status;
}

// Main test scenarios
export default function () {
	// Determine user type (90% regular users, 10% admin)
	const isAdmin = Math.random() < 0.1;
	const user = isAdmin ? ADMIN_USER : randomUser();

	// Login
	const authToken = login(user.username, user.password);
	if (!authToken) {
		return; // Skip rest of scenario if login fails
	}

	// User behavior simulation
	const actionsCount = randomInt(3, 8);

	for (let i = 0; i < actionsCount; i++) {
		const action = randomInt(1, 100);

		if (isAdmin) {
			// Admin user behavior
			if (action <= 60) {
				// 60% - Access admin panels
				accessAdminPanel(authToken);
			} else if (action <= 80) {
				// 20% - Check attendance status
				checkAttendanceStatus(authToken);
			} else {
				// 20% - Access dashboard
				accessDashboard(authToken);
			}
		} else {
			// Regular user behavior
			if (action <= 40) {
				// 40% - Make attendance request
				makeAttendanceRequest(authToken);
			} else if (action <= 70) {
				// 30% - Check attendance status
				checkAttendanceStatus(authToken);
			} else {
				// 30% - Access dashboard
				accessDashboard(authToken);
			}
		}

		// Think time - simulate user behavior
		sleep(randomInt(1, 3));
	}

	// Random pause between user sessions
	sleep(randomInt(0, 2));
}

// Setup function (runs once per VU)
export function setup() {
	console.log("🚀 Starting K6 Load Test for SDM Application");
	console.log(`Target: ${BASE_URL}`);
	console.log("Test Users: Regular employees + Admin users");
	console.log("Scenarios: Login, Attendance, Dashboard, Admin panels");
	console.log("");

	return { timestamp: Date.now() };
}

// Teardown function (runs once at the end)
export function teardown(data) {
	const testDuration = (Date.now() - data.timestamp) / 1000;
	console.log("");
	console.log("📊 K6 Load Test Completed");
	console.log(`Duration: ${testDuration.toFixed(2)} seconds`);
	console.log("Check detailed metrics above for performance analysis");
}

// Handle different test scenarios
export function attendanceStressTest() {
	// High-intensity attendance testing
	const user = randomUser();
	const authToken = login(user.username, user.password);

	if (authToken) {
		// Rapid attendance requests
		for (let i = 0; i < 5; i++) {
			makeAttendanceRequest(authToken);
			sleep(0.5); // Minimal think time for stress testing
		}
	}
}

export function adminStressTest() {
	// Admin panel stress testing
	const authToken = login(ADMIN_USER.username, ADMIN_USER.password);

	if (authToken) {
		// Rapid admin requests
		for (let i = 0; i < 10; i++) {
			accessAdminPanel(authToken);
			sleep(0.2);
		}
	}
}

// Export scenarios for different test types
export const scenarios = {
	// Normal mixed load
	mixed_load: {
		executor: "ramping-vus",
		startVUs: 0,
		stages: [
			{ duration: "5m", target: 20 },
			{ duration: "10m", target: 20 },
			{ duration: "5m", target: 0 },
		],
		exec: "default",
	},

	// Attendance-focused stress test
	attendance_stress: {
		executor: "ramping-vus",
		startVUs: 0,
		stages: [
			{ duration: "2m", target: 50 },
			{ duration: "5m", target: 50 },
			{ duration: "2m", target: 0 },
		],
		exec: "attendanceStressTest",
	},

	// Admin panel stress test
	admin_stress: {
		executor: "ramping-vus",
		startVUs: 0,
		stages: [
			{ duration: "2m", target: 10 },
			{ duration: "3m", target: 10 },
			{ duration: "2m", target: 0 },
		],
		exec: "adminStressTest",
	},
};
