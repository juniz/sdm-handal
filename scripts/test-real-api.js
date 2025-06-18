#!/usr/bin/env node

/**
 * Script untuk test API endpoints dengan cara yang lebih real
 * Jalankan dengan: node scripts/test-real-api.js
 */

const http = require("http");

const BASE_URL = "http://127.0.0.1:3001";

async function makeRequest(endpoint, cookies = "") {
	return new Promise((resolve, reject) => {
		const url = new URL(endpoint, BASE_URL);

		const options = {
			hostname: url.hostname,
			port: url.port || 80,
			path: url.pathname + url.search,
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				Cookie: cookies,
				"User-Agent":
					"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
				Accept: "application/json, text/plain, */*",
				"Cache-Control": "no-cache",
				Pragma: "no-cache",
			},
		};

		const req = http.request(options, (res) => {
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
						parseError: error.message,
					});
				}
			});
		});

		req.on("error", (error) => {
			reject(error);
		});

		req.end();
	});
}

async function testAllEndpoints() {
	console.log("🧪 === TESTING REAL API ENDPOINTS ===\n");
	console.log(`🌐 Base URL: ${BASE_URL}\n`);
	console.log(
		"⚠️  Note: These requests will fail with 401 (Unauthorized) without valid auth token"
	);
	console.log(
		"   This is expected - we're testing if endpoints are responsive\n"
	);

	const endpoints = [
		"/api/attendance/today",
		"/api/attendance/completed",
		"/api/attendance/status",
		"/api/attendance",
	];

	for (const endpoint of endpoints) {
		console.log(`🔍 Testing: ${endpoint}`);
		console.log("─".repeat(60));

		try {
			const response = await makeRequest(endpoint);

			console.log(`Status: ${response.status}`);

			if (response.parseError) {
				console.log("Response (Raw):", response.data);
				console.log("Parse Error:", response.parseError);
			} else {
				console.log("Response:");
				console.log(JSON.stringify(response.data, null, 2));
			}

			// Analyze response
			if (response.status === 401) {
				console.log(
					"✅ Endpoint is responsive (401 = auth required, which is expected)"
				);
			} else if (response.status === 200) {
				console.log("✅ Endpoint responded successfully");

				if (response.data && response.data.data) {
					console.log("📊 Data found in response");
					if (endpoint === "/api/attendance/today" && response.data.data) {
						console.log(
							"🔴 PROBLEM: /today returned data (should be null without auth)"
						);
					}
				} else {
					console.log("✅ No data returned (expected without auth)");
				}
			} else if (response.status === 500) {
				console.log("❌ Server error - check server logs");
			} else {
				console.log(`⚠️  Unexpected status: ${response.status}`);
			}
		} catch (error) {
			if (error.code === "ECONNREFUSED") {
				console.log("❌ Server not running - please start with: npm run dev");
			} else {
				console.log(`❌ Error: ${error.message}`);
			}
		}

		console.log("\n");
	}

	console.log("💡 === NEXT STEPS ===\n");
	console.log("If server is not running:");
	console.log("1. Start development server: npm run dev");
	console.log("2. Make sure it's running on port 3001");
	console.log("");
	console.log("If endpoints return 401 (expected):");
	console.log("1. Server is working correctly");
	console.log("2. Problem is likely in frontend caching");
	console.log("3. Clear browser cache and test in incognito mode");
	console.log("");
	console.log("If endpoints return data without auth:");
	console.log("1. There might be a security issue");
	console.log("2. Check API authentication logic");
}

async function main() {
	try {
		await testAllEndpoints();
	} catch (error) {
		console.error("❌ Error during testing:", error);
	}
}

// Run the script
if (require.main === module) {
	main().catch(console.error);
}

module.exports = { testAllEndpoints };
