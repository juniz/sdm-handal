#!/usr/bin/env node

/**
 * Script untuk debug dan fix masalah numbering pengajuan KTA
 * Usage: node scripts/fix-pengajuan-kta-numbering.js [--dry-run] [--fix]
 */

import { rawQuery } from "../src/lib/db-helper.js";
import {
	validateNoPengajuan,
	getPengajuanStats,
} from "../src/lib/pengajuan-kta-helper.js";

const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const shouldFix = args.includes("--fix");

async function main() {
	console.log("🔍 Debugging Pengajuan KTA Numbering Issues");
	console.log("============================================\n");

	try {
		// 1. Ambil semua data pengajuan KTA
		console.log("1. Fetching all pengajuan KTA data...");
		const allData = await rawQuery(
			`SELECT id, no_pengajuan, created_at 
			 FROM pengajuan_kta 
			 ORDER BY created_at DESC`
		);

		console.log(`   Total records: ${allData.length}\n`);

		// 2. Analisis format nomor pengajuan
		console.log("2. Analyzing number formats...");
		const validFormat = [];
		const invalidFormat = [];
		const duplicates = new Map();

		allData.forEach((row) => {
			const { id, no_pengajuan, created_at } = row;

			if (validateNoPengajuan(no_pengajuan)) {
				validFormat.push(row);

				// Check for duplicates
				if (duplicates.has(no_pengajuan)) {
					duplicates.get(no_pengajuan).push(row);
				} else {
					duplicates.set(no_pengajuan, [row]);
				}
			} else {
				invalidFormat.push(row);
			}
		});

		console.log(`   ✅ Valid format: ${validFormat.length}`);
		console.log(`   ❌ Invalid format: ${invalidFormat.length}`);

		// Show invalid format examples
		if (invalidFormat.length > 0) {
			console.log("\n   Invalid format examples:");
			invalidFormat.slice(0, 5).forEach((row) => {
				console.log(
					`   - ID ${row.id}: "${row.no_pengajuan}" (${row.created_at})`
				);
			});
		}

		// 3. Check for duplicates
		const duplicateNumbers = Array.from(duplicates.entries()).filter(
			([_, records]) => records.length > 1
		);
		console.log(`\n   🔍 Duplicate numbers: ${duplicateNumbers.length}`);

		if (duplicateNumbers.length > 0) {
			console.log("\n   Duplicate examples:");
			duplicateNumbers.slice(0, 3).forEach(([number, records]) => {
				console.log(`   - "${number}" used ${records.length} times:`);
				records.forEach((record) => {
					console.log(`     * ID ${record.id} (${record.created_at})`);
				});
			});
		}

		// 4. Analisis per bulan
		console.log("\n3. Monthly analysis...");
		const monthlyData = new Map();

		validFormat.forEach((row) => {
			const date = new Date(row.created_at);
			const year = date.getFullYear();
			const month = date.getMonth() + 1;
			const key = `${year}-${month.toString().padStart(2, "0")}`;

			if (!monthlyData.has(key)) {
				monthlyData.set(key, []);
			}
			monthlyData.get(key).push(row);
		});

		console.log(`   Found data in ${monthlyData.size} months:`);

		for (const [monthKey, records] of monthlyData.entries()) {
			const [year, month] = monthKey.split("-");
			const sequences = records
				.map((r) => {
					const match = r.no_pengajuan.match(/KTA-\d{4}-\d{2}-(\d{4})$/);
					return match ? parseInt(match[1]) : 0;
				})
				.filter((s) => s > 0);

			sequences.sort((a, b) => a - b);

			// Detect gaps
			const gaps = [];
			if (sequences.length > 0) {
				const maxSeq = Math.max(...sequences);
				for (let i = 1; i <= maxSeq; i++) {
					if (!sequences.includes(i)) {
						gaps.push(i);
					}
				}
			}

			console.log(
				`   ${monthKey}: ${records.length} records, sequences: ${sequences.join(
					","
				)}`
			);
			if (gaps.length > 0) {
				console.log(`     ⚠️  Gaps detected: ${gaps.join(",")}`);
			}
		}

		// 5. Test current month stats
		console.log("\n4. Current month statistics...");
		const now = new Date();
		const currentYear = now.getFullYear();
		const currentMonth = now.getMonth() + 1;

		const stats = await getPengajuanStats(currentYear, currentMonth);
		console.log(
			`   Current period: ${currentYear}-${currentMonth
				.toString()
				.padStart(2, "0")}`
		);
		console.log(`   Total pengajuan: ${stats.total_pengajuan}`);
		console.log(`   Next number: ${stats.next_no_pengajuan}`);
		console.log(`   Used sequences: [${stats.used_sequences.join(", ")}]`);
		if (stats.gaps.length > 0) {
			console.log(`   Gaps: [${stats.gaps.join(", ")}]`);
		}

		// 6. Recommendations
		console.log("\n5. Recommendations:");

		if (invalidFormat.length > 0) {
			console.log(
				`   ⚠️  Fix ${invalidFormat.length} records with invalid format`
			);
			if (shouldFix) {
				console.log("   🔧 Fixing invalid format records...");
				await fixInvalidFormat(invalidFormat, isDryRun);
			} else {
				console.log("   💡 Run with --fix to automatically fix these records");
			}
		}

		if (duplicateNumbers.length > 0) {
			console.log(
				`   ⚠️  Resolve ${duplicateNumbers.length} duplicate numbers`
			);
			if (shouldFix) {
				console.log("   🔧 Fixing duplicate numbers...");
				await fixDuplicateNumbers(duplicateNumbers, isDryRun);
			} else {
				console.log("   💡 Run with --fix to automatically resolve duplicates");
			}
		}

		if (invalidFormat.length === 0 && duplicateNumbers.length === 0) {
			console.log(
				"   ✅ All pengajuan KTA numbers are properly formatted and unique!"
			);
		}

		console.log(
			`\n${
				isDryRun
					? "🧪 DRY RUN MODE - No changes made"
					: shouldFix
					? "✅ Fix applied!"
					: "💡 Use --fix to apply fixes"
			}`
		);
	} catch (error) {
		console.error("\n❌ Script failed:", error.message);
		console.error(error.stack);
		process.exit(1);
	}
}

/**
 * Fix records with invalid format
 */
async function fixInvalidFormat(invalidRecords, isDryRun = false) {
	console.log(`\n   Fixing ${invalidRecords.length} invalid format records...`);

	for (const record of invalidRecords) {
		const { id, no_pengajuan, created_at } = record;
		const date = new Date(created_at);
		const year = date.getFullYear();
		const month = (date.getMonth() + 1).toString().padStart(2, "0");

		// Generate new format based on ID and date
		const newNoPengajuan = `KTA-${year}-${month}-${id
			.toString()
			.padStart(4, "0")}`;

		console.log(`     ID ${id}: "${no_pengajuan}" → "${newNoPengajuan}"`);

		if (!isDryRun) {
			await rawQuery("UPDATE pengajuan_kta SET no_pengajuan = ? WHERE id = ?", [
				newNoPengajuan,
				id,
			]);
		}
	}
}

/**
 * Fix duplicate numbers
 */
async function fixDuplicateNumbers(duplicates, isDryRun = false) {
	console.log(`\n   Fixing ${duplicates.length} duplicate number groups...`);

	for (const [duplicateNumber, records] of duplicates) {
		console.log(
			`\n     Duplicate "${duplicateNumber}" (${records.length} records):`
		);

		// Keep the oldest record, renumber the rest
		records.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
		const [keepRecord, ...duplicateRecords] = records;

		console.log(`       Keep: ID ${keepRecord.id} (${keepRecord.created_at})`);

		for (const record of duplicateRecords) {
			const { id, created_at } = record;
			const date = new Date(created_at);
			const year = date.getFullYear();
			const month = (date.getMonth() + 1).toString().padStart(2, "0");

			// Generate new number based on ID (temporary solution)
			const newNoPengajuan = `KTA-${year}-${month}-${id
				.toString()
				.padStart(4, "0")}`;

			console.log(`       Fix: ID ${id} → "${newNoPengajuan}"`);

			if (!isDryRun) {
				await rawQuery(
					"UPDATE pengajuan_kta SET no_pengajuan = ? WHERE id = ?",
					[newNoPengajuan, id]
				);
			}
		}
	}
}

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
	console.error("❌ Unhandled Rejection:", reason);
	process.exit(1);
});

// Show usage if no arguments
if (args.length === 0) {
	console.log("Usage:");
	console.log(
		"  node scripts/fix-pengajuan-kta-numbering.js --dry-run  # Check issues without fixing"
	);
	console.log(
		"  node scripts/fix-pengajuan-kta-numbering.js --fix      # Check and fix issues"
	);
	console.log(
		"  node scripts/fix-pengajuan-kta-numbering.js --dry-run --fix  # Preview fixes"
	);
	process.exit(0);
}

// Run the script
main().catch((error) => {
	console.error("❌ Fatal error:", error);
	process.exit(1);
});
