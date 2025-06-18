#!/usr/bin/env node

/**
 * Script untuk memaksa clear semua cache dan rebuild aplikasi
 * Jalankan dengan: node scripts/force-clear-all.js
 */

const fs = require("fs").promises;
const path = require("path");
const { execSync } = require("child_process");

async function forceClearAll() {
	console.log("🚀 === FORCE CLEARING ALL CACHE ===\n");

	const pathsToDelete = [
		".next",
		"node_modules/.cache",
		".cache",
		"tmp",
		".tmp",
		"temp",
	];

	console.log("🗑️  Deleting cache directories...");
	for (const cachePath of pathsToDelete) {
		try {
			const fullPath = path.join(process.cwd(), cachePath);
			await fs.access(fullPath);
			await fs.rmdir(fullPath, { recursive: true });
			console.log(`✅ Deleted: ${cachePath}`);
		} catch (error) {
			console.log(`ℹ️  Skipped: ${cachePath} (not found)`);
		}
	}

	console.log("\n🔧 Rebuilding Next.js...");
	try {
		execSync("npm run build", { stdio: "inherit" });
		console.log("✅ Build completed successfully");
	} catch (error) {
		console.log("⚠️  Build failed, but continuing...");
	}

	console.log("\n📋 === MANUAL STEPS REQUIRED ===");
	console.log("─".repeat(50));
	console.log("1. CLOSE ALL BROWSER WINDOWS");
	console.log("2. RESTART DEVELOPMENT SERVER:");
	console.log("   - Stop current server (Ctrl+C)");
	console.log("   - Run: npm run dev");
	console.log("");
	console.log("3. CLEAR BROWSER COMPLETELY:");
	console.log("   Chrome/Edge:");
	console.log(
		"   - Press Ctrl+Shift+Delete (Windows) or Cmd+Shift+Delete (Mac)"
	);
	console.log('   - Select "All time" in time range');
	console.log("   - Check ALL boxes");
	console.log('   - Click "Clear data"');
	console.log("");
	console.log("   Firefox:");
	console.log(
		"   - Press Ctrl+Shift+Delete (Windows) or Cmd+Shift+Delete (Mac)"
	);
	console.log('   - Select "Everything" in time range');
	console.log("   - Check ALL boxes");
	console.log('   - Click "Clear Now"');
	console.log("");
	console.log("4. TEST IN INCOGNITO MODE:");
	console.log("   - Open incognito/private window");
	console.log("   - Navigate to attendance page");
	console.log("   - Login and test");
	console.log("");
	console.log("5. IF STILL SHOWS DATA:");
	console.log("   - Try different browser entirely");
	console.log("   - Check if you're testing with correct user");
	console.log("   - Verify server is serving latest code");
	console.log("");

	console.log("🎯 === EXPECTED RESULT ===");
	console.log("─".repeat(50));
	console.log('✅ NO "Data Presensi Hari Ini" section');
	console.log("✅ Shows form for new check-in");
	console.log('✅ Green "Siap untuk presensi masuk" button');
	console.log("✅ No old attendance data displayed");

	console.log("\n✅ Force clear completed!");
	console.log("📝 Remember to follow the manual steps above");
}

// Run the script
if (require.main === module) {
	forceClearAll().catch(console.error);
}

module.exports = { forceClearAll };
