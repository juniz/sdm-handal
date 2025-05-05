import mysql from "mysql2/promise";
import cardinal from "cardinal";

export async function createConnection() {
	// console.log("Attempting to connect to database...", {
	// 	host: "192.168.3.200",
	// 	port: 6671,
	// 	user: "pelaksana",
	// 	database: "sik",
	// });

	try {
		const connection = await mysql.createConnection({
			host: process.env.DB_HOST,
			port: process.env.DB_PORT,
			user: process.env.DB_USER,
			password: process.env.DB_PASSWORD || "",
			database: process.env.DB_NAME,
			connectTimeout: 10000, // 10 detik timeout
			waitForConnections: true,
			connectionLimit: 10,
			maxIdle: 10, // max idle connections, the default value is the same as `connectionLimit`
			idleTimeout: 60000, // idle connections timeout, in milliseconds, the default value 60000
			queueLimit: 0,
			enableKeepAlive: true,
			keepAliveInitialDelay: 0,
			debug: process.env.NODE_ENV !== "production",
		});

		// console.log("Connection created, attempting to ping...");
		await connection.ping();
		// console.log("Database connection successful!");

		return connection;
	} catch (error) {
		// console.error("Database connection error:", {
		// 	message: error.message,
		// 	code: error.code,
		// 	errno: error.errno,
		// 	sqlState: error.sqlState,
		// 	fatal: error.fatal,
		// 	stack: error.stack,
		// });
		throw new Error(`Failed to connect to database: ${error.message}`);
	}
}

// Fungsi helper untuk query database
export async function query(sql, params) {
	let connection;
	try {
		// if (process.env.NODE_ENV !== "production") {
		// 	console.log("\nExecuting query:");
		// 	console.log(cardinal.highlight(sql));
		// 	if (params?.length) {
		// 		console.log("Parameters:", params);
		// 	}
		// }

		connection = await createConnection();
		const [results] = await connection.execute(sql, params);

		if (process.env.NODE_ENV !== "production") {
			// console.log(`Query returned ${results.length} rows\n`);
		}

		return results;
	} catch (error) {
		if (process.env.NODE_ENV !== "production") {
			// console.error("Query error:", error.message);
		}
		throw error;
	} finally {
		if (connection) {
			try {
				await connection.end();
				// console.log("Connection closed");
			} catch (endError) {
				if (process.env.NODE_ENV !== "production") {
					// console.error("Error closing connection:", endError);
				}
			}
		}
	}
}
