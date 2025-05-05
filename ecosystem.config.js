module.exports = {
	apps: [
		{
			name: "sdm-handal",
			script: "node_modules/next/dist/bin/next",
			args: "start",
			env: {
				PORT: 11300,
				NODE_ENV: "production",
			},
			instances: 1,
			autorestart: true,
			watch: false,
			max_memory_restart: "1G",
		},
	],
};
