module.exports = {
	// Generate timestamp for attendance requests
	generateTimestamp: function (context, events, done) {
		context.vars.timestamp = new Date().toISOString();
		return done();
	},

	// Generate random coordinates around Jakarta area
	generateCoordinates: function (context, events, done) {
		const baseLatitude = -6.2088;
		const baseLongitude = 106.8456;

		// Add small random offset (within ~1km radius)
		const latOffset = (Math.random() - 0.5) * 0.01;
		const lngOffset = (Math.random() - 0.5) * 0.01;

		context.vars.latitude = (baseLatitude + latOffset).toString();
		context.vars.longitude = (baseLongitude + lngOffset).toString();

		return done();
	},

	// Log response times for attendance requests
	logAttendanceResponse: function (
		requestParams,
		response,
		context,
		events,
		done
	) {
		if (requestParams.url.includes("/api/attendance")) {
			events.emit("counter", "attendance_requests", 1);
			events.emit(
				"histogram",
				"response_time_attendance",
				response.timings.response
			);
		}
		return done();
	},

	// Custom error handler
	handleError: function (requestParams, response, context, events, done) {
		if (response.statusCode >= 400) {
			console.log(`Error ${response.statusCode} on ${requestParams.url}`);
			events.emit("counter", `error_${response.statusCode}`, 1);
		}
		return done();
	},

	// Performance monitoring
	checkPerformance: function (requestParams, response, context, events, done) {
		const responseTime = response.timings.response;

		if (responseTime > 2000) {
			console.log(`Slow response: ${responseTime}ms on ${requestParams.url}`);
			events.emit("counter", "slow_responses", 1);
		}

		if (responseTime > 5000) {
			console.log(
				`Very slow response: ${responseTime}ms on ${requestParams.url}`
			);
			events.emit("counter", "very_slow_responses", 1);
		}

		return done();
	},
};
