// Database adapter untuk CommonJS - menggunakan mysql2 langsung
const mysql = require("mysql2/promise");

// Configuration
const dbConfig = {
	host: process.env.DB_HOST,
	port: process.env.DB_PORT,
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD || "",
	database: process.env.DB_NAME,
	connectTimeout: 10000,
	waitForConnections: true,
	connectionLimit: 10,
	maxIdle: 10,
	idleTimeout: 60000,
	queueLimit: 0,
	enableKeepAlive: true,
	keepAliveInitialDelay: 0,
	debug: false,
};

// Create database connection
async function createConnection() {
	try {
		const connection = await mysql.createConnection(dbConfig);
		await connection.ping();
		return connection;
	} catch (error) {
		throw new Error(`Failed to connect to database: ${error.message}`);
	}
}

// Raw query function
async function rawQuery(sql, params = []) {
	let connection;
	try {
		connection = await createConnection();
		const [results] = await connection.execute(sql, params);
		return results;
	} catch (error) {
		throw error;
	} finally {
		if (connection) {
			try {
				await connection.end();
			} catch (endError) {
				console.error("Error closing connection:", endError);
			}
		}
	}
}

// Helper function untuk membuat WHERE clause
function processWhereClause(where) {
	if (!where || Object.keys(where).length === 0) {
		return { whereClause: "", values: [] };
	}

	const conditions = [];
	const values = [];

	for (const [key, value] of Object.entries(where)) {
		if (value === null || value === undefined) {
			conditions.push(`${key} IS NULL`);
		} else if (Array.isArray(value)) {
			const placeholders = value.map(() => "?").join(", ");
			conditions.push(`${key} IN (${placeholders})`);
			values.push(...value);
		} else {
			conditions.push(`${key} = ?`);
			values.push(value);
		}
	}

	const whereClause =
		conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

	return { whereClause, values };
}

// Select first record
async function selectFirst({ table, where = {}, fields = ["*"] }) {
	const { whereClause, values } = processWhereClause(where);

	const sql = `
		SELECT ${fields.join(", ")}
		FROM ${table}
		${whereClause}
		LIMIT 1
	`;

	const results = await rawQuery(sql, values);
	return results.length > 0 ? results[0] : null;
}

// Insert record
async function insert({ table, data }) {
	const keys = Object.keys(data);
	const values = Object.values(data);
	const placeholders = values.map(() => "?").join(", ");

	const sql = `
		INSERT INTO ${table} (${keys.join(", ")})
		VALUES (${placeholders})
	`;

	const result = await rawQuery(sql, values);
	return result;
}

// Update records
async function update({ table, data, where }) {
	const { whereClause, values: whereValues } = processWhereClause(where);
	const setClause = Object.keys(data)
		.map((key) => `${key} = ?`)
		.join(", ");

	const sql = `
		UPDATE ${table}
		SET ${setClause}
		${whereClause}
	`;

	const values = [...Object.values(data), ...whereValues];
	const result = await rawQuery(sql, values);
	return result;
}

// Delete records
async function delete_({ table, where }) {
	const { whereClause, values } = processWhereClause(where);

	const sql = `
		DELETE FROM ${table}
		${whereClause}
	`;

	const result = await rawQuery(sql, values);
	return result;
}

// Select multiple records
async function select({
	table,
	where = {},
	fields = ["*"],
	orderBy = null,
	order = "ASC",
	limit = null,
	offset = null,
}) {
	const { whereClause, values } = processWhereClause(where);
	const limitClause = limit ? `LIMIT ${parseInt(limit)}` : "";
	const offsetClause = offset ? `OFFSET ${parseInt(offset)}` : "";
	const orderByClause = orderBy ? `ORDER BY ${orderBy} ${order}` : "";

	const sql = `
		SELECT ${fields.join(", ")}
		FROM ${table}
		${whereClause}
		${orderByClause}
		${limitClause}
		${offsetClause}
	`;

	return await rawQuery(sql, values);
}

// Test database connection
async function testConnection() {
	try {
		const connection = await createConnection();
		await connection.end();
		return true;
	} catch (error) {
		return false;
	}
}

module.exports = {
	rawQuery,
	selectFirst,
	insert,
	update,
	delete: delete_,
	select,
	testConnection,
	createConnection,
};
