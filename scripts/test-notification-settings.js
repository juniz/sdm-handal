#!/usr/bin/env node

/**
 * Script untuk testing notification settings
 *
 * Usage:
 * node scripts/test-notification-settings.js
 *
 * Environment variables yang di-test:
 * - NEXT_PUBLIC_DISABLE_NOTIFICATIONS
 */

const fs = require("fs");
const path = require("path");

console.log("🔔 Testing Notification Settings\n");

// Test environment variables
const testEnvVars = () => {
	console.log("📋 Environment Variables Check:");

	const disableNotifications = process.env.NEXT_PUBLIC_DISABLE_NOTIFICATIONS;

	console.log(
		`  NEXT_PUBLIC_DISABLE_NOTIFICATIONS: ${
			disableNotifications || "undefined"
		}`
	);

	if (disableNotifications === "true") {
		console.log("  ✅ Notifications are DISABLED");
	} else if (disableNotifications === "false") {
		console.log("  ✅ Notifications are ENABLED");
	} else {
		console.log("  ⚠️  Notifications are ENABLED (default behavior)");
	}

	console.log("");
};

// Test component files
const testComponentFiles = () => {
	console.log("📁 Component Files Check:");

	const components = [
		"src/components/notifications/NotificationAlert.js",
		"src/components/notifications/NotificationBell.js",
		"src/components/notifications/FloatingNotification.js",
	];

	components.forEach((component) => {
		const filePath = path.join(process.cwd(), component);

		if (fs.existsSync(filePath)) {
			const content = fs.readFileSync(filePath, "utf8");
			const hasDisableCheck = content.includes(
				"NEXT_PUBLIC_DISABLE_NOTIFICATIONS"
			);

			if (hasDisableCheck) {
				console.log(`  ✅ ${component} - Environment check implemented`);
			} else {
				console.log(`  ❌ ${component} - Environment check missing`);
			}
		} else {
			console.log(`  ❌ ${component} - File not found`);
		}
	});

	console.log("");
};

// Test .env file
const testEnvFile = () => {
	console.log("📄 .env File Check:");

	const envPath = path.join(process.cwd(), ".env");

	if (fs.existsSync(envPath)) {
		const content = fs.readFileSync(envPath, "utf8");
		const hasNotificationSetting = content.includes(
			"NEXT_PUBLIC_DISABLE_NOTIFICATIONS"
		);

		if (hasNotificationSetting) {
			console.log("  ✅ .env file contains NEXT_PUBLIC_DISABLE_NOTIFICATIONS");

			// Extract current value
			const match = content.match(/NEXT_PUBLIC_DISABLE_NOTIFICATIONS=(.+)/);
			if (match) {
				console.log(`  📝 Current value: ${match[1]}`);
			}
		} else {
			console.log("  ❌ .env file missing NEXT_PUBLIC_DISABLE_NOTIFICATIONS");
		}
	} else {
		console.log("  ❌ .env file not found");
	}

	console.log("");
};

// Test ecosystem.config.js
const testEcosystemConfig = () => {
	console.log("⚙️  Ecosystem Config Check:");

	const ecosystemPath = path.join(process.cwd(), "ecosystem.config.js");

	if (fs.existsSync(ecosystemPath)) {
		const content = fs.readFileSync(ecosystemPath, "utf8");
		const hasNotificationSetting = content.includes(
			"NEXT_PUBLIC_DISABLE_NOTIFICATIONS"
		);

		if (hasNotificationSetting) {
			console.log(
				"  ✅ ecosystem.config.js contains NEXT_PUBLIC_DISABLE_NOTIFICATIONS"
			);

			// Extract values for different environments
			const envMatch = content.match(
				/env:\s*{[^}]*NEXT_PUBLIC_DISABLE_NOTIFICATIONS:\s*"([^"]+)"/
			);
			const devMatch = content.match(
				/env_development:\s*{[^}]*NEXT_PUBLIC_DISABLE_NOTIFICATIONS:\s*"([^"]+)"/
			);
			const prodMatch = content.match(
				/env_production:\s*{[^}]*NEXT_PUBLIC_DISABLE_NOTIFICATIONS:\s*"([^"]+)"/
			);

			if (envMatch) console.log(`  📝 Default env: ${envMatch[1]}`);
			if (devMatch) console.log(`  📝 Development env: ${devMatch[1]}`);
			if (prodMatch) console.log(`  📝 Production env: ${prodMatch[1]}`);
		} else {
			console.log(
				"  ❌ ecosystem.config.js missing NEXT_PUBLIC_DISABLE_NOTIFICATIONS"
			);
		}
	} else {
		console.log("  ❌ ecosystem.config.js not found");
	}

	console.log("");
};

// Generate recommendations
const generateRecommendations = () => {
	console.log("💡 Recommendations:");

	const disableNotifications = process.env.NEXT_PUBLIC_DISABLE_NOTIFICATIONS;

	if (disableNotifications === "true") {
		console.log("  🔕 Notifications are currently DISABLED");
		console.log(
			"  📝 To enable notifications, set NEXT_PUBLIC_DISABLE_NOTIFICATIONS=false"
		);
	} else {
		console.log("  🔔 Notifications are currently ENABLED");
		console.log(
			"  📝 To disable notifications, set NEXT_PUBLIC_DISABLE_NOTIFICATIONS=true"
		);
	}

	console.log("");
	console.log("  🚀 Quick Commands:");
	console.log("    # Enable notifications");
	console.log("    export NEXT_PUBLIC_DISABLE_NOTIFICATIONS=false");
	console.log("");
	console.log("    # Disable notifications");
	console.log("    export NEXT_PUBLIC_DISABLE_NOTIFICATIONS=true");
	console.log("");
	console.log("    # Restart PM2 with new settings");
	console.log("    pm2 restart ecosystem.config.js --env production");
	console.log("");
};

// Run all tests
const runTests = () => {
	testEnvVars();
	testComponentFiles();
	testEnvFile();
	testEcosystemConfig();
	generateRecommendations();

	console.log("✅ Notification settings test completed!");
};

// Run if called directly
if (require.main === module) {
	runTests();
}

module.exports = {
	testEnvVars,
	testComponentFiles,
	testEnvFile,
	testEcosystemConfig,
	generateRecommendations,
	runTests,
};
