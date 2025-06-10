const moment = require("moment");

// Helper functions for Artillery.js
module.exports = {
	// Set custom variables
	setCustomVariables: function (context, events, done) {
		// Set current timestamp
		context.vars.$timestamp = new Date().toISOString();

		// Set today's date
		context.vars.$today = moment().format("YYYY-MM-DD");

		// Set yesterday's date
		context.vars.$yesterday = moment().subtract(1, "day").format("YYYY-MM-DD");

		// Generate random coordinates around office
		const officeLat = -7.9797;
		const officeLng = 112.6304;
		const radius = 0.01; // ~1km radius

		context.vars.$randomLat = officeLat + (Math.random() - 0.5) * radius;
		context.vars.$randomLng = officeLng + (Math.random() - 0.5) * radius;

		// Generate random boolean
		context.vars.$randomBoolean = Math.random() > 0.5;

		// Generate random photo data (base64)
		const photoSizes = [500, 1000, 1500, 2000];
		const randomSize =
			photoSizes[Math.floor(Math.random() * photoSizes.length)];
		context.vars.$randomPhotoData = generateRandomBase64(randomSize);

		return done();
	},

	// Generate random employee ID
	generateEmployeeId: function (context, events, done) {
		const empIds = ["EMP001", "EMP002", "EMP003", "EMP004", "EMP005"];
		context.vars.$randomEmpId =
			empIds[Math.floor(Math.random() * empIds.length)];
		return done();
	},

	// Generate random security warnings
	generateSecurityWarnings: function (context, events, done) {
		const warnings = [
			"GPS akurasi rendah",
			"Lokasi berubah terlalu cepat",
			"Sinyal GPS tidak stabil",
			"Deteksi mock location",
			"Pola pergerakan tidak wajar",
		];

		const numWarnings = Math.floor(Math.random() * 3);
		const selectedWarnings = [];

		for (let i = 0; i < numWarnings; i++) {
			const randomWarning =
				warnings[Math.floor(Math.random() * warnings.length)];
			if (!selectedWarnings.includes(randomWarning)) {
				selectedWarnings.push(randomWarning);
			}
		}

		context.vars.$securityWarnings = JSON.stringify(selectedWarnings);
		return done();
	},

	// Log response metrics
	logResponse: function (requestParams, response, context, ee, next) {
		if (response.statusCode >= 400) {
			console.log(`Error ${response.statusCode} for ${requestParams.url}`);
			console.log(`Response: ${response.body}`);
		}

		// Track slow responses
		if (response.timings && response.timings.response > 5000) {
			console.log(
				`Slow response: ${response.timings.response}ms for ${requestParams.url}`
			);
		}

		return next();
	},

	// Custom validation
	validateAttendanceResponse: function (
		requestParams,
		response,
		context,
		ee,
		next
	) {
		try {
			const body = JSON.parse(response.body);

			if (response.statusCode === 200) {
				// Validate successful attendance response
				if (!body.message || !body.data) {
					ee.emit("error", "Invalid attendance response structure");
				}

				// Track successful operations
				context.vars.$successfulAttendance =
					(context.vars.$successfulAttendance || 0) + 1;
			} else if (response.statusCode === 400) {
				// Expected validation errors
				console.log(`Validation error: ${body.message}`);
			} else {
				// Unexpected errors
				ee.emit("error", `Unexpected status code: ${response.statusCode}`);
			}
		} catch (error) {
			ee.emit("error", `Failed to parse response: ${error.message}`);
		}

		return next();
	},
};

// Helper function to generate random base64 data
function generateRandomBase64(length) {
	const chars =
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
	let result = "";
	for (let i = 0; i < length; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return result;
}

// Export additional utility functions
module.exports.utils = {
	// Generate realistic employee data
	generateEmployeeData: function () {
		const names = [
			"John Doe",
			"Jane Smith",
			"Bob Johnson",
			"Alice Brown",
			"Charlie Wilson",
		];
		const departments = ["IT", "HR", "Finance", "Operations", "Marketing"];
		const shifts = ["PAGI", "SIANG", "MALAM"];

		return {
			name: names[Math.floor(Math.random() * names.length)],
			department: departments[Math.floor(Math.random() * departments.length)],
			shift: shifts[Math.floor(Math.random() * shifts.length)],
		};
	},

	// Generate realistic GPS coordinates with variance
	generateGPSWithNoise: function (baseLat, baseLng, radiusKm = 0.5) {
		const radiusInDegrees = radiusKm / 111.32; // Rough conversion
		const u = Math.random();
		const v = Math.random();
		const w = radiusInDegrees * Math.sqrt(u);
		const t = 2 * Math.PI * v;
		const x = w * Math.cos(t);
		const y = w * Math.sin(t);

		return {
			latitude: baseLat + x,
			longitude: baseLng + y,
		};
	},

	// Generate realistic timestamps
	generateWorkingHourTimestamp: function () {
		const now = moment();
		const workingHours = [7, 8, 9, 16, 17, 18]; // 7-9 AM, 4-6 PM
		const randomHour =
			workingHours[Math.floor(Math.random() * workingHours.length)];

		return now
			.hour(randomHour)
			.minute(Math.floor(Math.random() * 60))
			.second(Math.floor(Math.random() * 60))
			.toISOString();
	},
};
