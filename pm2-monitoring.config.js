module.exports = {
	apps: [
		{
			name: "sdm-monitor",
			script: "pm2",
			args: "monit",
			instances: 1,
			exec_mode: "fork",
			autorestart: false,
			watch: false,
		},
	],
	// Konfigurasi untuk load testing
	load_test: {
		concurrent_users: 300,
		ramp_up_time: "5m",
		test_duration: "30m",
		endpoints: [
			"/api/attendance",
			"/api/attendance/today",
			"/api/attendance/status",
			"/dashboard/attendance",
		],
	},
	// Resource monitoring thresholds
	monitoring: {
		cpu_threshold: 80, // Alert jika CPU > 80%
		memory_threshold: 85, // Alert jika Memory > 85%
		response_time_threshold: 2000, // Alert jika response time > 2s
		error_rate_threshold: 5, // Alert jika error rate > 5%
	},
};
