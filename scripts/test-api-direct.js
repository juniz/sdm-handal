#!/usr/bin/env node

const http = require("http");

// Fungsi untuk membuat HTTP request
function makeRequest(path, cookie = "") {
	return new Promise((resolve, reject) => {
		const options = {
			hostname: "localhost",
			port: 3000,
			path: path,
			method: "GET",
			headers: {
				Cookie: cookie,
				"Cache-Control": "no-cache",
				Pragma: "no-cache",
			},
		};

		const req = http.request(options, (res) => {
			let data = "";

			res.on("data", (chunk) => {
				data += chunk;
			});

			res.on("end", () => {
				try {
					const jsonData = JSON.parse(data);
					resolve({
						status: res.statusCode,
						data: jsonData,
					});
				} catch (error) {
					resolve({
						status: res.statusCode,
						data: data,
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

async function testAPIs() {
	console.log("🧪 TESTING ATTENDANCE APIs DIRECTLY");
	console.log("=".repeat(50));

	try {
		// Test tanpa authentication dulu
		console.log("\n1️⃣ Testing /api/attendance/today (without auth)");
		const todayResult = await makeRequest("/api/attendance/today");
		console.log("Status:", todayResult.status);
		console.log("Response:", JSON.stringify(todayResult.data, null, 2));

		console.log("\n2️⃣ Testing /api/attendance/completed (without auth)");
		const completedResult = await makeRequest("/api/attendance/completed");
		console.log("Status:", completedResult.status);
		console.log("Response:", JSON.stringify(completedResult.data, null, 2));

		console.log("\n3️⃣ Testing /api/attendance/status (without auth)");
		const statusResult = await makeRequest("/api/attendance/status");
		console.log("Status:", statusResult.status);
		console.log("Response:", JSON.stringify(statusResult.data, null, 2));

		// Jika ada file cookies, coba dengan auth
		const fs = require("fs");
		try {
			const cookieContent = fs.readFileSync(".cookies", "utf8");
			const authTokenMatch = cookieContent.match(/auth_token=([^;]+)/);

			if (authTokenMatch) {
				const authToken = authTokenMatch[1];
				const authCookie = `auth_token=${authToken}`;

				console.log("\n" + "=".repeat(50));
				console.log("🔐 TESTING WITH AUTHENTICATION");
				console.log("=".repeat(50));

				console.log("\n4️⃣ Testing /api/attendance/today (with auth)");
				const todayAuthResult = await makeRequest(
					"/api/attendance/today",
					authCookie
				);
				console.log("Status:", todayAuthResult.status);
				console.log("Response:", JSON.stringify(todayAuthResult.data, null, 2));

				console.log("\n5️⃣ Testing /api/attendance/completed (with auth)");
				const completedAuthResult = await makeRequest(
					"/api/attendance/completed",
					authCookie
				);
				console.log("Status:", completedAuthResult.status);
				console.log(
					"Response:",
					JSON.stringify(completedAuthResult.data, null, 2)
				);

				console.log("\n6️⃣ Testing /api/attendance/status (with auth)");
				const statusAuthResult = await makeRequest(
					"/api/attendance/status",
					authCookie
				);
				console.log("Status:", statusAuthResult.status);
				console.log(
					"Response:",
					JSON.stringify(statusAuthResult.data, null, 2)
				);

				// Analisis hasil
				console.log("\n" + "=".repeat(50));
				console.log("📊 ANALYSIS");
				console.log("=".repeat(50));

				const todayHasData = todayAuthResult.data?.data ? "YES" : "NO";
				const completedHasData = completedAuthResult.data?.data ? "YES" : "NO";
				const statusCompleted = statusAuthResult.data?.data?.isCompleted
					? "YES"
					: "NO";

				console.log(`Today Attendance has data: ${todayHasData}`);
				console.log(`Completed Attendance has data: ${completedHasData}`);
				console.log(`Status shows completed: ${statusCompleted}`);

				console.log("\n🎯 EXPECTED BEHAVIOR:");
				console.log("- If database is clean: All should be NO/NULL");
				console.log(
					"- If problem persists: One or more APIs returning unexpected data"
				);

				if (todayHasData === "YES" || completedHasData === "YES") {
					console.log("\n🚨 PROBLEM IDENTIFIED:");
					console.log("- APIs are returning data when they should return null");
					console.log("- This confirms the issue is in the backend/database");
					console.log("- Frontend state management is NOT the root cause");
				} else {
					console.log("\n✅ APIs ARE CLEAN:");
					console.log("- All APIs returning null as expected");
					console.log("- Problem is likely in frontend state/cache");
					console.log("- Browser cache or React state issue");
				}
			}
		} catch (cookieError) {
			console.log("\n⚠️  No cookie file found, skipping authenticated tests");
		}
	} catch (error) {
		console.error("\n❌ Error testing APIs:", error);
	}

	console.log("\n" + "=".repeat(50));
	console.log("🏁 API TESTING COMPLETED");
	console.log("=".repeat(50));
}

// Jalankan test
testAPIs();
