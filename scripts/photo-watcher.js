#!/usr/bin/env node

const chokidar = require("chokidar");
const { exec } = require("child_process");
const path = require("path");

console.log("🔍 Starting photo watcher...");

const photosDir = path.join(process.cwd(), "public", "photos");
let restartTimeout;

const restartPM2 = () => {
	console.log("🔄 Restarting PM2 due to photo changes...");
	exec("pm2 reload sdm-app", (error, stdout, stderr) => {
		if (error) {
			console.error("❌ PM2 restart failed:", error);
			return;
		}
		console.log("✅ PM2 restarted successfully");
		if (stdout) console.log(stdout);
		if (stderr) console.log(stderr);
	});
};

const watcher = chokidar.watch(photosDir, {
	ignored: /[\/\\]\./,
	persistent: true,
	ignoreInitial: true,
});

watcher
	.on("add", (filePath) => {
		const filename = path.basename(filePath);
		console.log(`📸 New photo detected: ${filename}`);

		// Debounce restart - wait 2 seconds for multiple files
		clearTimeout(restartTimeout);
		restartTimeout = setTimeout(restartPM2, 2000);
	})
	.on("change", (filePath) => {
		const filename = path.basename(filePath);
		console.log(`📝 Photo changed: ${filename}`);

		clearTimeout(restartTimeout);
		restartTimeout = setTimeout(restartPM2, 2000);
	})
	.on("error", (error) => {
		console.error("❌ Watcher error:", error);
	});

console.log(`👀 Watching for changes in: ${photosDir}`);
console.log("Press Ctrl+C to stop watching");

process.on("SIGINT", () => {
	console.log("\n🛑 Stopping photo watcher...");
	watcher.close();
	process.exit(0);
});
