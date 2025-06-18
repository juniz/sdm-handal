#!/usr/bin/env node

/**
 * Script untuk membersihkan cache attendance
 * Jalankan dengan: node scripts/clear-attendance-cache.js
 */

const fs = require("fs").promises;
const path = require("path");

async function clearNextCache() {
	console.log("🧹 === CLEARING NEXT.JS CACHE ===\n");

	const cachePaths = [
		".next/cache",
		".next/server",
		".next/static",
		"node_modules/.cache",
	];

	for (const cachePath of cachePaths) {
		try {
			const fullPath = path.join(process.cwd(), cachePath);
			await fs.access(fullPath);
			await fs.rmdir(fullPath, { recursive: true });
			console.log(`✅ Cleared: ${cachePath}`);
		} catch (error) {
			console.log(`ℹ️  Skipped: ${cachePath} (not found)`);
		}
	}
}

async function clearTempFiles() {
	console.log("\n🗑️  === CLEARING TEMP FILES ===\n");

	const tempPaths = ["tmp", ".tmp", "temp"];

	for (const tempPath of tempPaths) {
		try {
			const fullPath = path.join(process.cwd(), tempPath);
			await fs.access(fullPath);
			await fs.rmdir(fullPath, { recursive: true });
			console.log(`✅ Cleared: ${tempPath}`);
		} catch (error) {
			console.log(`ℹ️  Skipped: ${tempPath} (not found)`);
		}
	}
}

async function showClearBrowserCacheInstructions() {
	console.log("\n🌐 === BROWSER CACHE INSTRUCTIONS ===\n");
	console.log("To clear browser cache:");
	console.log("");
	console.log("Chrome/Edge:");
	console.log("- Press Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)");
	console.log("- Or F12 → Network tab → Disable cache checkbox");
	console.log("");
	console.log("Firefox:");
	console.log("- Press Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)");
	console.log("- Or F12 → Network tab → Settings → Disable cache");
	console.log("");
	console.log("Safari:");
	console.log("- Press Cmd+Option+R");
	console.log("- Or Develop menu → Empty Caches");
	console.log("");
	console.log("💡 Alternative: Open in Incognito/Private mode");
}

async function restartInstructions() {
	console.log("\n🔄 === RESTART INSTRUCTIONS ===\n");
	console.log("After clearing cache, restart the development server:");
	console.log("");
	console.log("1. Stop current server (Ctrl+C)");
	console.log("2. Run: npm run dev");
	console.log("3. Open browser in incognito mode");
	console.log("4. Test attendance functionality");
	console.log("");
	console.log("🎯 Expected behavior:");
	console.log("- No active attendance should be shown");
	console.log("- User should be able to start new check-in");
	console.log('- No "presensi tanggal 17 masih muncul" message');
}

async function main() {
	console.log("🚀 === ATTENDANCE CACHE CLEANER ===\n");

	try {
		await clearNextCache();
		await clearTempFiles();
		showClearBrowserCacheInstructions();
		restartInstructions();

		console.log("\n✅ Cache clearing completed!");
		console.log("📝 Don't forget to:");
		console.log("   1. Clear browser cache (see instructions above)");
		console.log("   2. Restart the development server");
		console.log("   3. Test in incognito mode");
	} catch (error) {
		console.error("❌ Error during cache clearing:", error);
	}
}

// Run the script
if (require.main === module) {
	main().catch(console.error);
}

module.exports = { clearNextCache, clearTempFiles };
