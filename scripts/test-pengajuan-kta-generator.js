#!/usr/bin/env node

/**
 * Test Script untuk Pengajuan KTA Number Generation
 * Usage: node scripts/test-pengajuan-kta-generator.js
 */

import {
	generateUniqueNoPengajuan,
	testBatchGenerateNoPengajuan,
	getPengajuanStats,
	validateNoPengajuan,
} from "../src/lib/pengajuan-kta-helper.js";

async function main() {
	console.log("🧪 Testing Pengajuan KTA Number Generation");
	console.log("==========================================\n");

	try {
		// Test 1: Single generation
		console.log("1. Testing single number generation...");
		const singleNumber = await generateUniqueNoPengajuan();
		console.log(`   Generated: ${singleNumber}`);
		console.log(
			`   Valid format: ${validateNoPengajuan(singleNumber) ? "✅" : "❌"}\n`
		);

		// Test 2: Get current stats
		console.log("2. Getting current statistics...");
		const currentDate = new Date();
		const year = currentDate.getFullYear();
		const month = currentDate.getMonth() + 1;
		const stats = await getPengajuanStats(year, month);
		console.log(
			`   Current month (${year}-${month.toString().padStart(2, "0")}):`
		);
		console.log(`   - Total pengajuan: ${stats.total_pengajuan}`);
		console.log(`   - Last sequence: ${stats.last_sequence}`);
		console.log(`   - Next number: ${stats.next_no_pengajuan}`);
		console.log(`   - Latest: ${stats.last_no || "None"}\n`);

		// Test 3: Batch generation (concurrent test)
		console.log("3. Testing concurrent generation (5 numbers)...");
		const batchResult = await testBatchGenerateNoPengajuan(5);
		console.log(`   Results summary:`);
		console.log(
			`   - Success rate: ${batchResult.successful}/${batchResult.total} (${(
				(batchResult.successful / batchResult.total) *
				100
			).toFixed(1)}%)`
		);
		console.log(`   - Unique numbers: ${batchResult.uniqueNumbers}`);
		console.log(`   - Duplicates detected: ${batchResult.duplicates}`);
		console.log(`   - Generated numbers:`);
		batchResult.generatedNumbers.forEach((num) => {
			console.log(`     ${num} ${validateNoPengajuan(num) ? "✅" : "❌"}`);
		});

		if (batchResult.duplicates > 0) {
			console.log("\n   ⚠️  WARNING: Duplicates detected!");
			console.log("   This should not happen with proper locking.");
		} else {
			console.log("\n   ✅ All numbers are unique - locking works correctly!");
		}

		// Test 4: Format validation
		console.log("\n4. Testing format validation...");
		const testFormats = [
			"KTA-2025-07-0001", // Valid
			"KTA-2025-07-1234", // Valid
			"KTA-2025-7-0001", // Invalid (month not padded)
			"KTA-25-07-0001", // Invalid (year not 4 digits)
			"KTA-2025-07-001", // Invalid (sequence not 4 digits)
			"KTA-2025-07-00001", // Invalid (sequence too long)
			"KTB-2025-07-0001", // Invalid (wrong prefix)
		];

		testFormats.forEach((format) => {
			const isValid = validateNoPengajuan(format);
			console.log(
				`   ${format.padEnd(20)} ${isValid ? "✅ Valid" : "❌ Invalid"}`
			);
		});

		console.log("\n🎉 Test completed successfully!");
	} catch (error) {
		console.error("\n❌ Test failed with error:", error.message);
		console.error("Stack trace:", error.stack);
		process.exit(1);
	}
}

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
	console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
	process.exit(1);
});

// Run the test
main().catch((error) => {
	console.error("❌ Fatal error:", error);
	process.exit(1);
});
