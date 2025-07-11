#!/usr/bin/env node

const https = require("https");
const http = require("http");
const { URL } = require("url");
const { performance } = require("perf_hooks");

// Konfigurasi
const config = {
	baseUrl: process.env.BASE_URL || "http://localhost:3000",
	cronSecret: process.env.CRON_SECRET || "your-cron-secret-key",
	timeout: 30000, // 30 detik untuk testing
};

// Logging utility
const log = {
	info: (message) =>
		console.log(`[INFO] ${new Date().toISOString()}: ${message}`),
	error: (message) =>
		console.error(`[ERROR] ${new Date().toISOString()}: ${message}`),
	debug: (message) =>
		console.log(`[DEBUG] ${new Date().toISOString()}: ${message}`),
	warn: (message) =>
		console.warn(`[WARN] ${new Date().toISOString()}: ${message}`),
};

// Fungsi untuk test koneksi dasar
const testConnection = async () => {
	log.info("Testing basic connection...");

	try {
		const parsedUrl = new URL(config.baseUrl);
		const protocol = parsedUrl.protocol === "https:" ? https : http;

		return new Promise((resolve, reject) => {
			const req = protocol.request(
				{
					hostname: parsedUrl.hostname,
					port: parsedUrl.port || (parsedUrl.protocol === "https:" ? 443 : 80),
					path: "/",
					method: "GET",
					timeout: config.timeout,
				},
				(res) => {
					res.on("data", () => {}); // Consume response data
					res.on("end", () => {
						resolve({
							statusCode: res.statusCode,
							headers: res.headers,
							success: true,
						});
					});
				}
			);

			req.on("error", (error) => {
				resolve({
					success: false,
					error: error.message,
					code: error.code,
				});
			});

			req.on("timeout", () => {
				req.destroy();
				resolve({
					success: false,
					error: "Connection timeout",
					code: "TIMEOUT",
				});
			});

			req.end();
		});
	} catch (error) {
		return {
			success: false,
			error: error.message,
		};
	}
};

// Fungsi untuk test API endpoint
const testApiEndpoint = async (endpoint = "/api/ticket/auto-close") => {
	log.info(`Testing API endpoint: ${endpoint}`);

	const startTime = performance.now();

	try {
		const parsedUrl = new URL(config.baseUrl + endpoint);
		const protocol = parsedUrl.protocol === "https:" ? https : http;

		return new Promise((resolve, reject) => {
			const req = protocol.request(
				{
					hostname: parsedUrl.hostname,
					port: parsedUrl.port || (parsedUrl.protocol === "https:" ? 443 : 80),
					path: parsedUrl.pathname + parsedUrl.search,
					method: "GET",
					headers: {
						Authorization: `Bearer ${config.cronSecret}`,
						"Content-Type": "application/json",
						"User-Agent": "troubleshoot-auto-close/1.0",
						Connection: "keep-alive",
					},
					timeout: config.timeout,
				},
				(res) => {
					let data = "";

					res.on("data", (chunk) => {
						data += chunk;
					});

					res.on("end", () => {
						const endTime = performance.now();
						const duration = endTime - startTime;

						try {
							const jsonData = JSON.parse(data);
							resolve({
								success: true,
								statusCode: res.statusCode,
								headers: res.headers,
								data: jsonData,
								duration: Math.round(duration),
								responseSize: data.length,
							});
						} catch (error) {
							resolve({
								success: false,
								error: "Invalid JSON response",
								statusCode: res.statusCode,
								rawData: data.substring(0, 200) + "...",
								duration: Math.round(duration),
							});
						}
					});
				}
			);

			req.on("error", (error) => {
				const endTime = performance.now();
				const duration = endTime - startTime;

				resolve({
					success: false,
					error: error.message,
					code: error.code,
					duration: Math.round(duration),
				});
			});

			req.on("timeout", () => {
				req.destroy();
				const endTime = performance.now();
				const duration = endTime - startTime;

				resolve({
					success: false,
					error: "Request timeout",
					code: "TIMEOUT",
					duration: Math.round(duration),
				});
			});

			req.end();
		});
	} catch (error) {
		return {
			success: false,
			error: error.message,
		};
	}
};

// Fungsi untuk test multiple connections
const testMultipleConnections = async (count = 5) => {
	log.info(`Testing ${count} concurrent connections...`);

	const promises = [];
	for (let i = 0; i < count; i++) {
		promises.push(testApiEndpoint());
	}

	try {
		const results = await Promise.allSettled(promises);

		const successful = results.filter(
			(r) => r.status === "fulfilled" && r.value.success
		).length;
		const failed = results.filter(
			(r) => r.status === "rejected" || !r.value.success
		).length;

		log.info(
			`Concurrent test results: ${successful} successful, ${failed} failed`
		);

		// Log details of failed requests
		results.forEach((result, index) => {
			if (result.status === "rejected" || !result.value.success) {
				const error =
					result.status === "rejected" ? result.reason : result.value;
				log.error(
					`Connection ${index + 1} failed: ${
						error.error || error.message || "Unknown error"
					} (${error.code || "N/A"})`
				);
			}
		});

		return {
			successful,
			failed,
			total: count,
			results,
		};
	} catch (error) {
		log.error(`Error in concurrent test: ${error.message}`);
		return {
			successful: 0,
			failed: count,
			total: count,
			error: error.message,
		};
	}
};

// Fungsi untuk test dengan timeout berbeda
const testWithDifferentTimeouts = async () => {
	log.info("Testing with different timeout values...");

	const timeouts = [5000, 10000, 30000, 60000, 120000]; // 5s, 10s, 30s, 1m, 2m
	const results = [];

	for (const timeout of timeouts) {
		log.info(`Testing with timeout: ${timeout}ms`);
		const originalTimeout = config.timeout;
		config.timeout = timeout;

		try {
			const result = await testApiEndpoint();
			results.push({
				timeout,
				success: result.success,
				duration: result.duration || 0,
				error: result.error || null,
			});
			log.info(
				`Timeout ${timeout}ms: ${result.success ? "SUCCESS" : "FAILED"} (${
					result.duration || 0
				}ms)`
			);
		} catch (error) {
			results.push({
				timeout,
				success: false,
				error: error.message || error.toString(),
			});
			log.error(
				`Timeout ${timeout}ms: FAILED - ${error.message || error.toString()}`
			);
		}

		config.timeout = originalTimeout;
	}

	return results;
};

// Fungsi untuk monitoring system resources
const checkSystemResources = async () => {
	log.info("Checking system resources...");

	const memoryUsage = process.memoryUsage();
	const cpuUsage = process.cpuUsage();

	log.info(
		`Memory usage: ${Math.round(
			memoryUsage.heapUsed / 1024 / 1024
		)} MB heap, ${Math.round(memoryUsage.rss / 1024 / 1024)} MB RSS`
	);
	log.info(`CPU usage: ${cpuUsage.user} user, ${cpuUsage.system} system`);

	return {
		memory: memoryUsage,
		cpu: cpuUsage,
	};
};

// Fungsi untuk test DNS resolution
const testDnsResolution = async () => {
	log.info("Testing DNS resolution...");

	try {
		const parsedUrl = new URL(config.baseUrl);
		const { lookup } = require("dns").promises;

		const startTime = performance.now();
		const result = await lookup(parsedUrl.hostname);
		const endTime = performance.now();

		log.info(
			`DNS resolution successful: ${result.address} (${Math.round(
				endTime - startTime
			)}ms)`
		);

		return {
			success: true,
			address: result.address,
			family: result.family,
			duration: Math.round(endTime - startTime),
		};
	} catch (error) {
		log.error(`DNS resolution failed: ${error.message}`);
		return {
			success: false,
			error: error.message,
		};
	}
};

// Main troubleshooting function
const runTroubleshooting = async () => {
	log.info("=== Auto-Close Troubleshooting Started ===");
	log.info(`Base URL: ${config.baseUrl}`);
	log.info(`Timeout: ${config.timeout}ms`);

	const startTime = performance.now();

	try {
		// 1. Check system resources
		const systemResources = await checkSystemResources();

		// 2. Test DNS resolution
		const dnsResult = await testDnsResolution();

		// 3. Test basic connection
		log.info("\n--- Testing Basic Connection ---");
		const connectionResult = await testConnection();
		if (connectionResult.success) {
			log.info(
				`✓ Basic connection successful (${connectionResult.statusCode})`
			);
		} else {
			log.error(`✗ Basic connection failed: ${connectionResult.error}`);
		}

		// 4. Test API endpoint
		log.info("\n--- Testing API Endpoint ---");
		const apiResult = await testApiEndpoint();
		if (apiResult.success) {
			log.info(
				`✓ API endpoint successful (${apiResult.statusCode}, ${
					apiResult.duration || 0
				}ms, ${apiResult.responseSize || 0} bytes)`
			);
		} else {
			log.error(
				`✗ API endpoint failed: ${apiResult.error} (${
					apiResult.duration || 0
				}ms)`
			);
		}

		// 5. Test multiple concurrent connections
		log.info("\n--- Testing Concurrent Connections ---");
		const concurrentResult = await testMultipleConnections(3);

		// 6. Test with different timeouts
		log.info("\n--- Testing Different Timeouts ---");
		const timeoutResults = await testWithDifferentTimeouts();

		// Summary
		const endTime = performance.now();
		const totalDuration = Math.round(endTime - startTime);

		log.info("\n=== Troubleshooting Summary ===");
		log.info(`Total duration: ${totalDuration}ms`);
		log.info(`DNS resolution: ${dnsResult.success ? "✓" : "✗"}`);
		log.info(`Basic connection: ${connectionResult.success ? "✓" : "✗"}`);
		log.info(`API endpoint: ${apiResult.success ? "✓" : "✗"}`);
		log.info(
			`Concurrent connections: ${concurrentResult.successful}/${concurrentResult.total}`
		);

		// Recommendations
		log.info("\n=== Recommendations ===");
		if (!dnsResult.success) {
			log.warn("- DNS resolution issue detected. Check network connectivity.");
		}
		if (!connectionResult.success) {
			log.warn("- Basic connection failed. Check if server is running.");
		}
		if (!apiResult.success) {
			log.warn(
				"- API endpoint failed. Check server logs and database connectivity."
			);
		}
		if (concurrentResult.failed > 0) {
			log.warn(
				"- Some concurrent connections failed. Server might be overloaded."
			);
		}

		const successfulTimeouts = timeoutResults.filter((r) => r.success);
		if (successfulTimeouts.length > 0) {
			const minTimeout = Math.min(...successfulTimeouts.map((r) => r.timeout));
			log.info(`- Minimum working timeout: ${minTimeout}ms`);
		}

		if (apiResult.success && apiResult.duration > 30000) {
			log.warn(
				"- API response time is slow. Consider optimizing database queries."
			);
		}

		log.info("=== Troubleshooting Completed ===");

		return {
			success: apiResult.success,
			summary: {
				dns: dnsResult.success,
				connection: connectionResult.success,
				api: apiResult.success,
				concurrent: concurrentResult,
				timeouts: timeoutResults,
				duration: totalDuration,
			},
		};
	} catch (error) {
		log.error(`Troubleshooting failed: ${error.message}`);
		return {
			success: false,
			error: error.message,
		};
	}
};

// Handle command line arguments
const args = process.argv.slice(2);
const command = args[0];

// Add global error handlers
process.on("uncaughtException", (error) => {
	log.error(`Uncaught Exception: ${error.message}`);
	process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
	log.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
	process.exit(1);
});

switch (command) {
	case "quick":
		// Quick test - hanya test basic connection dan API
		(async () => {
			try {
				const connection = await testConnection();
				const api = await testApiEndpoint();
				console.log(`Connection: ${connection.success ? "✓" : "✗"}`);
				console.log(`API: ${api.success ? "✓" : "✗"}`);
				process.exit(connection.success && api.success ? 0 : 1);
			} catch (error) {
				console.error("Error:", error.message || error);
				process.exit(1);
			}
		})();
		break;

	case "concurrent":
		// Test concurrent connections
		const count = parseInt(args[1]) || 5;
		testMultipleConnections(count)
			.then((result) => {
				console.log(
					`Concurrent test: ${result.successful}/${result.total} successful`
				);
				process.exit(result.successful === result.total ? 0 : 1);
			})
			.catch((error) => {
				console.error("Error:", error.message || error);
				process.exit(1);
			});
		break;

	case "timeout":
		// Test with specific timeout
		const timeout = parseInt(args[1]) || 30000;
		config.timeout = timeout;
		testApiEndpoint()
			.then((result) => {
				console.log(
					`Timeout test (${timeout}ms): ${result.success ? "✓" : "✗"}`
				);
				if (result.success) {
					console.log(`Duration: ${result.duration}ms`);
				} else {
					console.log(`Error: ${result.error}`);
				}
				process.exit(result.success ? 0 : 1);
			})
			.catch((error) => {
				console.error("Error:", error.message || error);
				process.exit(1);
			});
		break;

	default:
		// Full troubleshooting
		runTroubleshooting()
			.then((result) => {
				process.exit(result.success ? 0 : 1);
			})
			.catch((error) => {
				console.error("Error:", error.message || error);
				process.exit(1);
			});
		break;
}
