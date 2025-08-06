const https = require("https");
const http = require("http");

const BASE_URL = process.env.NEXT_PUBLIC_URL || "http://127.0.0.1:3001";

// Dummy JWT token untuk testing (ganti dengan token valid)
const JWT_TOKEN = "your-jwt-token-here";

async function makeRequest(endpoint, method = "POST", data = null) {
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
				"User-Agent": "Security Logs Test Script",
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

async function testSecurityLogsFix() {
	console.log("🧪 === TESTING SECURITY LOGS FIX ===\n");
	console.log(`🌐 Base URL: ${BASE_URL}\n`);

	// Test data untuk checkin
	const testCheckinData = {
		photo:
			"data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A",
		timestamp: new Date().toISOString(),
		latitude: -6.123456,
		longitude: 106.123456,
		isCheckingOut: false,
		securityData: {
			confidence: 85,
			accuracy: 10,
			warnings: [],
		},
	};

	console.log("🔍 Testing attendance checkin with security logs...");
	console.log("─".repeat(50));

	try {
		const response = await makeRequest(
			"/api/attendance",
			"POST",
			testCheckinData
		);

		console.log(`Status: ${response.status}`);
		console.log("Response:");
		console.log(JSON.stringify(response.data, null, 2));

		// Analyze response
		if (response.status === 200) {
			console.log("✅ Checkin successful");

			// Check if security data is present
			if (response.data && response.data.data && response.data.data.security) {
				console.log("📊 Security data found in response");
				console.log(
					`   - Security result: ${
						response.data.data.security ? "Present" : "Null"
					}`
				);
			} else {
				console.log(
					"📊 No security data in response (expected when ENABLE_SECURITY_LOGS = false)"
				);
			}

			// Check if attendance data is present
			if (response.data && response.data.data && response.data.data.presensi) {
				console.log("✅ Attendance data saved successfully");
			} else {
				console.log("❌ No attendance data in response");
			}
		} else if (response.status === 401) {
			console.log("🔐 Authentication required (expected)");
		} else if (response.status === 500) {
			console.log("❌ Server error - check if security logs fix is working");
			if (response.data && response.data.message) {
				console.log(`   Error: ${response.data.message}`);
			}
		} else {
			console.log(`❌ Unexpected status: ${response.status}`);
		}
	} catch (error) {
		console.log(`❌ Error: ${error.message}`);
	}

	console.log("\n");

	// Test checkout
	console.log("🔍 Testing attendance checkout...");
	console.log("─".repeat(50));

	const testCheckoutData = {
		photo: null,
		timestamp: new Date().toISOString(),
		latitude: -6.123456,
		longitude: 106.123456,
		isCheckingOut: true,
		securityData: {
			confidence: 90,
			accuracy: 5,
			warnings: [],
		},
	};

	try {
		const response = await makeRequest(
			"/api/attendance",
			"POST",
			testCheckoutData
		);

		console.log(`Status: ${response.status}`);
		console.log("Response:");
		console.log(JSON.stringify(response.data, null, 2));

		// Analyze response
		if (response.status === 200) {
			console.log("✅ Checkout successful");

			// Check if security data is present
			if (response.data && response.data.security) {
				console.log("📊 Security data found in response");
			} else {
				console.log(
					"📊 No security data in response (expected when ENABLE_SECURITY_LOGS = false)"
				);
			}
		} else if (response.status === 400) {
			console.log("⚠️  Expected error (no checkin data found)");
		} else if (response.status === 401) {
			console.log("🔐 Authentication required (expected)");
		} else if (response.status === 500) {
			console.log("❌ Server error - check if security logs fix is working");
		} else {
			console.log(`❌ Unexpected status: ${response.status}`);
		}
	} catch (error) {
		console.log(`❌ Error: ${error.message}`);
	}

	console.log("\n");

	// Manual testing instructions
	console.log("💡 === MANUAL TESTING INSTRUCTIONS ===\n");
	console.log("1. Set environment variable:");
	console.log("   export ENABLE_SECURITY_LOGS=false");
	console.log("\n2. Test checkin:");
	console.log(`   curl -X POST "${BASE_URL}/api/attendance" \\`);
	console.log(`     -H "Content-Type: application/json" \\`);
	console.log(`     -H "Cookie: auth_token=YOUR_TOKEN" \\`);
	console.log(`     -d '${JSON.stringify(testCheckinData, null, 2)}'`);
	console.log("\n3. Expected result:");
	console.log("   - Status: 200 OK");
	console.log("   - No ReferenceError in logs");
	console.log("   - security: null in response");
	console.log("\n4. Check logs:");
	console.log("   pm2 logs sdm-app | grep -i 'security\\|error'");
	console.log("\n5. Expected: No 'securityResult is not defined' errors");
}

async function main() {
	try {
		await testSecurityLogsFix();
	} catch (error) {
		console.error("❌ Error during testing:", error);
	}
}

// Run the script
if (require.main === module) {
	main().catch(console.error);
}

module.exports = { testSecurityLogsFix };
