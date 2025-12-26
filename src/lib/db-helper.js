import { query } from "./db";
import { createConnection } from "./db";

// SECURITY FIX CVE-002: Validasi identifier untuk mencegah SQL injection
/**
 * Validasi identifier (table name, column name) untuk mencegah SQL injection
 * Hanya allow alphanumeric, underscore, dan dash
 */
function validateIdentifier(identifier) {
	if (!identifier || typeof identifier !== "string") {
		throw new Error(`Invalid identifier: ${identifier}`);
	}
	// Hanya allow alphanumeric, underscore, dan dash
	if (!/^[a-zA-Z0-9_\-]+$/.test(identifier)) {
		throw new Error(`Invalid identifier format: ${identifier}`);
	}
	return identifier;
}

/**
 * Whitelist untuk table names yang diizinkan
 * Update ini sesuai dengan tabel yang ada di database
 */
const ALLOWED_TABLES = [
	"development_requests",
	"pegawai",
	"departemen",
	"temporary_presensi",
	"rekap_presensi",
	"error_logs",
	"error_resolutions",
	"security_logs",
	"jadwal_pegawai",
	"jadwal_tambahan",
	"jam_masuk",
	"development_assignments",
	"development_notes",
	"development_attachments",
	"development_progress",
	"development_statuses",
	"development_priorities",
	"module_types",
	"tickets",
	"assignments_ticket",
	"categories_ticket",
	"priorities_ticket",
	"statuses_ticket",
	"ticket_notes",
	"ticket_status_history",
	"status_history_ticket",
	"pengajuan_kta",
	"pengajuan_tukar_dinas",
	"pengajuan_tudin",
	"pengajuan_cuti",
	"pengajuan_izin",
	"pendidikan",
	"jam_jaga",
	"kelompok_jabatan",
	"stts_kerja",
	"rapat",
	"user",
	"gaji_pegawai",
	"gaji_upload_log",
	"gaji_history",
];

/**
 * Validasi table name dengan whitelist
 */
function validateTableName(table) {
	if (!ALLOWED_TABLES.includes(table)) {
		throw new Error(`Table not allowed: ${table}`);
	}
	return table;
}

/**
 * Transaction manager untuk database operations
 */
class TransactionManager {
	constructor(connection) {
		this.connection = connection;
		this.inTransaction = false;
	}

	async begin() {
		if (this.inTransaction) {
			throw new Error("Transaction already started");
		}
		await this.connection.beginTransaction();
		this.inTransaction = true;
		console.log("Transaction started");
	}

	async commit() {
		if (!this.inTransaction) {
			throw new Error("No active transaction to commit");
		}
		await this.connection.commit();
		this.inTransaction = false;
		console.log("Transaction committed");
	}

	async rollback() {
		if (!this.inTransaction) {
			console.log("No active transaction to rollback");
			return;
		}
		await this.connection.rollback();
		this.inTransaction = false;
		console.log("Transaction rolled back");
	}

	async execute(sql, params = []) {
		if (!this.connection) {
			throw new Error("No database connection available");
		}
		const [results] = await this.connection.execute(sql, params);
		return results;
	}

	async end() {
		if (this.inTransaction) {
			await this.rollback();
		}
		if (this.connection) {
			await this.connection.end();
		}
	}
}

/**
 * Wrapper function untuk menjalankan operasi database dalam transaction
 * @param {Function} operations - Function yang berisi operasi database
 * @returns {Promise<*>} - Result dari operations function
 */
export async function withTransaction(operations) {
	let connection;
	let transaction;

	try {
		connection = await createConnection();
		transaction = new TransactionManager(connection);

		// Begin transaction
		await transaction.begin();

		// Execute operations dengan transaction context
		const result = await operations(transaction);

		// Commit transaction
		await transaction.commit();

		return result;
	} catch (error) {
		console.error("Transaction error:", error);

		// Rollback transaction jika ada error
		if (transaction) {
			try {
				await transaction.rollback();
			} catch (rollbackError) {
				console.error("Rollback error:", rollbackError);
			}
		}

		throw error;
	} finally {
		// Clean up connection
		if (transaction) {
			await transaction.end();
		} else if (connection) {
			try {
				await connection.end();
			} catch (endError) {
				console.error("Error closing connection:", endError);
			}
		}
	}
}

/**
 * Helper functions yang bisa digunakan dalam transaction context
 */
export const transactionHelpers = {
	/**
	 * Insert dengan transaction context
	 */
	async insert(transaction, { table, data }) {
		// SECURITY FIX CVE-002: Validasi table name dan column names
		const validatedTable = validateTableName(table);
		const validatedKeys = Object.keys(data).map(validateIdentifier);
		const values = Object.values(data);
		const placeholders = values.map(() => "?").join(", ");

		const sqlQuery = `
			INSERT INTO ${validatedTable} (${validatedKeys.join(", ")})
			VALUES (${placeholders})
		`;

		return await transaction.execute(sqlQuery, values);
	},

	/**
	 * Update dengan transaction context
	 */
	async update(transaction, { table, data, where }) {
		// SECURITY FIX CVE-002: Validasi table name dan column names
		const validatedTable = validateTableName(table);
		const { whereClause, values: whereValues } = processWhereClause(where);
		const validatedKeys = Object.keys(data).map(validateIdentifier);
		const setClause = validatedKeys.map((key) => `${key} = ?`).join(", ");

		const sqlQuery = `
			UPDATE ${validatedTable}
			SET ${setClause}
			${whereClause}
		`;

		const values = [...Object.values(data), ...whereValues];
		return await transaction.execute(sqlQuery, values);
	},

	/**
	 * Delete dengan transaction context
	 */
	async delete(transaction, { table, where }) {
		// SECURITY FIX CVE-002: Validasi table name
		const validatedTable = validateTableName(table);
		const { whereClause, values } = processWhereClause(where);

		const sqlQuery = `
			DELETE FROM ${validatedTable}
			${whereClause}
		`;

		return await transaction.execute(sqlQuery, values);
	},

	/**
	 * Select dengan transaction context
	 */
	async select(
		transaction,
		{
			table,
			where = {},
			fields = ["*"],
			orderBy = null,
			order = "ASC",
			limit = null,
		}
	) {
		// SECURITY FIX CVE-002: Validasi table name, fields, dan orderBy
		const validatedTable = validateTableName(table);
		const { whereClause, values } = processWhereClause(where);
		const limitClause = limit ? `LIMIT ${parseInt(limit)}` : "";
		
		// Validasi fields
		let validatedFields = fields;
		if (fields[0] !== "*") {
			validatedFields = fields.map(validateIdentifier);
		}
		
		// Validasi orderBy
		let orderByClause = "";
		if (orderBy) {
			const validatedOrderBy = validateIdentifier(orderBy);
			const validatedOrder = order.toUpperCase() === "DESC" ? "DESC" : "ASC";
			orderByClause = `ORDER BY ${validatedOrderBy} ${validatedOrder}`;
		}

		const sqlQuery = `
			SELECT ${validatedFields.join(", ")}
			FROM ${validatedTable}
			${whereClause}
			${orderByClause}
			${limitClause}
		`;

		return await transaction.execute(sqlQuery, values);
	},

	/**
	 * Raw query dengan transaction context
	 */
	async rawQuery(transaction, sql, values = []) {
		return await transaction.execute(sql, values);
	},
};

/**
 * Helper untuk melakukan SELECT dari database
 * @param {string} table - Nama tabel
 * @param {Object} where - Kondisi WHERE dalam bentuk object
 * @param {string[]} fields - Field yang ingin diselect
 * @param {string} orderBy - Field untuk ordering
 * @param {string} order - ASC atau DESC
 * @param {number} limit - Limit jumlah data
 * @param {number} offset - Offset data
 * @returns {Promise<Array>}
 */
export async function select({
	table,
	where = {},
	fields = ["*"],
	orderBy = null,
	order = "ASC",
	limit = null,
	offset = null,
}) {
	try {
		// SECURITY FIX CVE-002: Validasi table name, fields, dan orderBy
		const validatedTable = validateTableName(table);
		const { whereClause, values } = processWhereClause(where);
		const limitClause = limit ? `LIMIT ${parseInt(limit)}` : "";
		const offsetClause = offset ? `OFFSET ${parseInt(offset)}` : "";
		
		// Validasi fields
		let validatedFields = fields;
		if (fields[0] !== "*") {
			validatedFields = fields.map(validateIdentifier);
		}
		
		// Validasi orderBy
		let orderByClause = "";
		if (orderBy) {
			const validatedOrderBy = validateIdentifier(orderBy);
			const validatedOrder = order.toUpperCase() === "DESC" ? "DESC" : "ASC";
			orderByClause = `ORDER BY ${validatedOrderBy} ${validatedOrder}`;
		}

		const sqlQuery = `
			SELECT ${validatedFields.join(", ")}
			FROM ${validatedTable}
			${whereClause}
			${orderByClause}
			${limitClause}
			${offsetClause}
		`;

		const result = await query(sqlQuery, values);
		return result;
	} catch (error) {
		console.error("Error in select:", error);
		throw error;
	}
}

/**
 * Helper untuk mengambil satu baris data
 * @param {string} table - Nama tabel
 * @param {Object} where - Kondisi WHERE dalam bentuk object
 * @param {string[]} fields - Field yang ingin diselect
 * @returns {Promise<Object|null>}
 */
export async function selectFirst({ table, where = {}, fields = ["*"] }) {
	try {
		const result = await select({
			table,
			where,
			fields,
			limit: 1,
		});
		return result[0] || null;
	} catch (error) {
		console.error("Error in selectFirst:", error);
		throw error;
	}
}

/**
 * Helper untuk melakukan INSERT ke database
 * @param {string} table - Nama tabel
 * @param {Object} data - Data yang akan diinsert dalam bentuk object
 * @returns {Promise<Object>}
 */
export async function insert({ table, data }) {
	try {
		// SECURITY FIX CVE-002: Validasi table name dan column names
		const validatedTable = validateTableName(table);
		const validatedKeys = Object.keys(data).map(validateIdentifier);
		const values = Object.values(data);
		const placeholders = values.map(() => "?").join(", ");

		const sqlQuery = `
			INSERT INTO ${validatedTable} (${validatedKeys.join(", ")})
			VALUES (${placeholders})
		`;

		const result = await query(sqlQuery, values);
		return result;
	} catch (error) {
		console.error("Error in insert:", error);
		throw error;
	}
}

/**
 * Helper untuk melakukan UPDATE ke database
 * @param {string} table - Nama tabel
 * @param {Object} data - Data yang akan diupdate dalam bentuk object
 * @param {Object} where - Kondisi WHERE dalam bentuk object
 * @returns {Promise<Object>}
 */
export async function update({ table, data, where }) {
	try {
		// SECURITY FIX CVE-002: Validasi table name dan column names
		const validatedTable = validateTableName(table);
		const { whereClause, values: whereValues } = processWhereClause(where);
		const validatedKeys = Object.keys(data).map(validateIdentifier);
		const setClause = validatedKeys.map((key) => `${key} = ?`).join(", ");

		const sqlQuery = `
			UPDATE ${validatedTable}
			SET ${setClause}
			${whereClause}
		`;

		const values = [...Object.values(data), ...whereValues];
		const result = await query(sqlQuery, values);
		return result;
	} catch (error) {
		console.error("Error in update:", error);
		throw error;
	}
}

/**
 * Helper untuk melakukan DELETE dari database
 * @param {string} table - Nama tabel
 * @param {Object} where - Kondisi WHERE dalam bentuk object
 * @returns {Promise<Object>}
 */
export async function delete_({ table, where }) {
	try {
		// SECURITY FIX CVE-002: Validasi table name
		const validatedTable = validateTableName(table);
		const { whereClause, values } = processWhereClause(where);

		const sqlQuery = `
			DELETE FROM ${validatedTable}
			${whereClause}
		`;

		const result = await query(sqlQuery, values);
		return result;
	} catch (error) {
		console.error("Error in delete:", error);
		throw error;
	}
}

/**
 * Helper untuk melakukan raw query ke database
 * @param {string} sql - Query SQL
 * @param {Array} values - Values untuk prepared statement
 * @returns {Promise<Array>}
 */
export async function rawQuery(sql, values = []) {
	try {
		const result = await query(sql, values);
		return result;
	} catch (error) {
		console.error("Error in rawQuery:", error);
		throw error;
	}
}

// Fungsi untuk memproses where clause
function processWhereClause(where) {
	const values = [];
	const conditions = [];

	for (const [key, value] of Object.entries(where)) {
		// SECURITY FIX CVE-002: Validasi column name
		const validatedKey = validateIdentifier(key);
		
		// Skip undefined values
		if (value === undefined) {
			console.warn(
				`Warning: Skipping undefined value for key '${validatedKey}' in WHERE clause`
			);
			continue;
		}

		if (value === null) {
			conditions.push(`${validatedKey} IS NULL`);
		} else if (typeof value === "object" && value !== null) {
			// Handle operator objects
			const operator = value.operator?.toUpperCase() || "=";
			switch (operator) {
				case "LIKE":
				case "NOT LIKE":
					conditions.push(`${validatedKey} ${operator} ?`);
					values.push(value.value);
					break;
				case "IN":
				case "NOT IN":
					if (Array.isArray(value.value)) {
						conditions.push(
							`${validatedKey} ${operator} (${value.value.map(() => "?").join(",")})`
						);
						values.push(...value.value);
					}
					break;
				case "BETWEEN":
					if (Array.isArray(value.value) && value.value.length === 2) {
						conditions.push(`${validatedKey} BETWEEN ? AND ?`);
						values.push(...value.value);
					}
					break;
				case ">":
				case ">=":
				case "<":
				case "<=":
				case "!=":
				case "<>":
					conditions.push(`${validatedKey} ${operator} ?`);
					values.push(value.value);
					break;
				default:
					conditions.push(`${validatedKey} = ?`);
					values.push(value.value);
			}
		} else {
			conditions.push(`${validatedKey} = ?`);
			values.push(value);
		}
	}

	return {
		whereClause: conditions.length ? `WHERE ${conditions.join(" AND ")}` : "",
		values,
	};
}
