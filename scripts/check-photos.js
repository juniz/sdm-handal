#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log("🔍 Checking Photo System Status...\n");

// 1. Check photos directory
const photosDir = path.join(process.cwd(), "public", "photos");
console.log("📁 Photos Directory:", photosDir);

if (fs.existsSync(photosDir)) {
	console.log("✅ Photos directory exists");

	// List recent photos
	try {
		const files = fs
			.readdirSync(photosDir)
			.filter((file) => file.match(/\.(jpg|jpeg|png)$/i))
			.map((file) => {
				const filePath = path.join(photosDir, file);
				const stats = fs.statSync(filePath);
				return {
					name: file,
					size: stats.size,
					created: stats.birthtime,
					modified: stats.mtime,
				};
			})
			.sort((a, b) => b.created - a.created)
			.slice(0, 5);

		console.log(`📸 Found ${files.length} recent photos:`);
		files.forEach((file) => {
			console.log(
				`   - ${file.name} (${Math.round(
					file.size / 1024
				)}KB) - ${file.created.toLocaleString()}`
			);
		});
	} catch (error) {
		console.log("❌ Error reading photos directory:", error.message);
	}
} else {
	console.log("❌ Photos directory does not exist");
	console.log("💡 Creating photos directory...");
	try {
		fs.mkdirSync(photosDir, { recursive: true });
		console.log("✅ Photos directory created");
	} catch (error) {
		console.log("❌ Failed to create photos directory:", error.message);
	}
}

// 2. Check directory permissions
try {
	fs.accessSync(photosDir, fs.constants.R_OK | fs.constants.W_OK);
	console.log("✅ Photos directory has read/write permissions");
} catch (error) {
	console.log("❌ Photos directory permission issue:", error.message);
	console.log("💡 Try running: chmod -R 755 public/photos");
}

// 3. Check PM2 status
console.log("\n🔄 Checking PM2 Status...");
try {
	const pm2Status = execSync("pm2 list", { encoding: "utf8" });
	console.log("✅ PM2 is running");

	// Check if sdm-app is running
	if (pm2Status.includes("sdm-app")) {
		console.log("✅ sdm-app is running in PM2");
	} else {
		console.log("❌ sdm-app is not running in PM2");
	}
} catch (error) {
	console.log("❌ PM2 is not available or not running");
}

// 4. Check Next.js config
console.log("\n⚙️  Checking Next.js Configuration...");
const nextConfigPath = path.join(process.cwd(), "next.config.js");
if (fs.existsSync(nextConfigPath)) {
	console.log("✅ next.config.js exists");

	try {
		const configContent = fs.readFileSync(nextConfigPath, "utf8");
		if (configContent.includes("/photos/:path*")) {
			console.log("✅ Photos headers configuration found");
		} else {
			console.log("⚠️  Photos headers configuration not found");
		}
	} catch (error) {
		console.log("❌ Error reading next.config.js:", error.message);
	}
} else {
	console.log("❌ next.config.js not found");
}

// 5. Test photo URL accessibility
console.log("\n🌐 Testing Photo URL Accessibility...");
const testPhotoUrl = "http://localhost:3001/photos/test.jpg";
console.log(`Testing URL: ${testPhotoUrl}`);

// Create a test image if it doesn't exist
const testImagePath = path.join(photosDir, "test.jpg");
if (!fs.existsSync(testImagePath)) {
	// Create a simple 1x1 pixel JPEG
	const testImageData = Buffer.from(
		"/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=",
		"base64"
	);
	try {
		fs.writeFileSync(testImagePath, testImageData);
		console.log("✅ Test image created");
	} catch (error) {
		console.log("❌ Failed to create test image:", error.message);
	}
}

// 6. Recommendations
console.log("\n💡 Recommendations:");
console.log("1. Ensure PM2 is watching the photos directory");
console.log("2. Check file permissions: chmod -R 755 public/photos");
console.log("3. Restart PM2 if needed: pm2 restart sdm-app");
console.log("4. Clear browser cache and try again");
console.log("5. Check network tab in DevTools for 404 errors");

console.log("\n✨ Photo system check completed!");
