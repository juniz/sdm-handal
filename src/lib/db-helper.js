import { query } from "./db";

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
		const { whereClause, values } = processWhereClause(where);
		const limitClause = limit ? `LIMIT ${parseInt(limit)}` : "";
		const orderByClause = orderBy ? `ORDER BY ${orderBy} ${order}` : "";

		const sqlQuery = `
			SELECT ${fields.join(", ")}
			FROM ${table}
			${whereClause}
			${orderByClause}
			${limitClause}
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
		const keys = Object.keys(data);
		const values = Object.values(data);
		const placeholders = values.map(() => "?").join(", ");

		const sqlQuery = `
			INSERT INTO ${table} (${keys.join(", ")})
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
		const { whereClause, values: whereValues } = processWhereClause(where);
		const setClause = Object.keys(data)
			.map((key) => `${key} = ?`)
			.join(", ");

		const sqlQuery = `
			UPDATE ${table}
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
		const { whereClause, values } = processWhereClause(where);

		const sqlQuery = `
			DELETE FROM ${table}
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
		if (value === null) {
			conditions.push(`${key} IS NULL`);
		} else if (typeof value === "object" && value !== null) {
			// Handle operator objects
			const operator = value.operator?.toUpperCase() || "=";
			switch (operator) {
				case "LIKE":
				case "NOT LIKE":
					conditions.push(`${key} ${operator} ?`);
					values.push(value.value);
					break;
				case "IN":
				case "NOT IN":
					if (Array.isArray(value.value)) {
						conditions.push(
							`${key} ${operator} (${value.value.map(() => "?").join(",")})`
						);
						values.push(...value.value);
					}
					break;
				case "BETWEEN":
					if (Array.isArray(value.value) && value.value.length === 2) {
						conditions.push(`${key} BETWEEN ? AND ?`);
						values.push(...value.value);
					}
					break;
				case ">":
				case ">=":
				case "<":
				case "<=":
				case "!=":
				case "<>":
					conditions.push(`${key} ${operator} ?`);
					values.push(value.value);
					break;
				default:
					conditions.push(`${key} = ?`);
					values.push(value.value);
			}
		} else {
			conditions.push(`${key} = ?`);
			values.push(value);
		}
	}

	return {
		whereClause: conditions.length ? `WHERE ${conditions.join(" AND ")}` : "",
		values,
	};
}
