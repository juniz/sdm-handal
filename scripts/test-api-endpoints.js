#!/usr/bin/env node

/**
 * Script untuk test API endpoints attendance
 * Jalankan dengan: node scripts/test-api-endpoints.js
 */

const https = require("https");
const http = require("http");

const BASE_URL = process.env.NEXT_PUBLIC_URL || "http://127.0.0.1:3001";

// Dummy JWT token untuk testing (ganti dengan token valid)
const JWT_TOKEN = "your-jwt-token-here";

async function makeRequest(endpoint, method = "GET", data = null) {
	return new Promise((resolve, reject) => {
		const url = new URL(endpoint, BASE_URL);
		const isHttps = url.protocol === "https:";
		const client = isHttps ? https : http;

		const options = {
			hostname: url.hostname,
			port: url.port || (isHttps ? 443 : 80),
			path: url.pathname + url.search,
			method: method,
			headers: {
				"Content-Type": "application/json",
				Cookie: `auth_token=${JWT_TOKEN}`,
				"User-Agent": "Test Script",
			},
		};

		if (data) {
			const jsonData = JSON.stringify(data);
			options.headers["Content-Length"] = Buffer.byteLength(jsonData);
		}

		const req = client.request(options, (res) => {
			let responseData = "";

			res.on("data", (chunk) => {
				responseData += chunk;
			});

			res.on("end", () => {
				try {
					const parsedData = JSON.parse(responseData);
					resolve({
						status: res.statusCode,
						headers: res.headers,
						data: parsedData,
					});
				} catch (error) {
					resolve({
						status: res.statusCode,
						headers: res.headers,
						data: responseData,
					});
				}
			});
		});

		req.on("error", (error) => {
			reject(error);
		});

		if (data) {
			req.write(JSON.stringify(data));
		}

		req.end();
	});
}

async function testAttendanceEndpoints() {
	console.log("🧪 === TESTING ATTENDANCE API ENDPOINTS ===\n");
	console.log(`🌐 Base URL: ${BASE_URL}\n`);

	const endpoints = [
		"/api/attendance/today",
		"/api/attendance/completed",
		"/api/attendance/status",
		"/api/attendance",
	];

	for (const endpoint of endpoints) {
		console.log(`🔍 Testing: ${endpoint}`);
		console.log("─".repeat(50));

		try {
			const response = await makeRequest(endpoint);

			console.log(`Status: ${response.status}`);
			console.log("Response:");
			console.log(JSON.stringify(response.data, null, 2));

			// Analyze response
			if (response.status === 200) {
				console.log("✅ Endpoint responded successfully");

				if (response.data && response.data.data) {
					console.log("📊 Data found in response");
					if (endpoint === "/api/attendance/today" && response.data.data) {
						console.log("🔴 PROBLEM: /today returned data (should be null)");
					}
				} else {
					console.log("✅ No data returned (expected for clean state)");
				}
			} else if (response.status === 401) {
				console.log("🔐 Authentication required (expected)");
			} else {
				console.log(`❌ Unexpected status: ${response.status}`);
			}
		} catch (error) {
			console.log(`❌ Error: ${error.message}`);
		}

		console.log("\n");
	}

	// Test with curl commands
	console.log("💡 === MANUAL TESTING COMMANDS ===\n");
	console.log("You can also test manually with these curl commands:\n");

	endpoints.forEach((endpoint) => {
		console.log(`curl -X GET "${BASE_URL}${endpoint}" \\`);
		console.log(`  -H "Cookie: auth_token=YOUR_TOKEN_HERE" \\`);
		console.log(`  -H "Content-Type: application/json"`);
		console.log("");
	});

	console.log(
		"📝 Note: Replace YOUR_TOKEN_HERE with actual auth token from browser"
	);
}

async function main() {
	try {
		await testAttendanceEndpoints();
	} catch (error) {
		console.error("❌ Error during testing:", error);
	}
}

// Run the script
if (require.main === module) {
	main().catch(console.error);
}

module.exports = { testAttendanceEndpoints };
