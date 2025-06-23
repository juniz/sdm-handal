import moment from "moment-timezone";
import { rawQuery } from "@/lib/db-helper";

// Set timezone ke Jakarta
moment.tz.setDefault("Asia/Jakarta");

/**
 * Generate nomor pengajuan KTA dengan format KTA-YYYY-MM-NNNN
 * @param {Date} date - Tanggal untuk generate nomor (default: now)
 * @returns {Promise<string>} - Nomor pengajuan yang unik
 */
export async function generateNoPengajuan(date = new Date()) {
	try {
		const currentDate = moment(date);
		const year = currentDate.format("YYYY");
		const month = currentDate.format("MM");

		// Ambil nomor urut terakhir untuk bulan dan tahun ini
		const result = await rawQuery(
			`
			SELECT COALESCE(MAX(CAST(SUBSTRING(no_pengajuan, -4) AS UNSIGNED)), 0) as last_number
			FROM pengajuan_kta 
			WHERE no_pengajuan LIKE ?
		`,
			[`KTA-${year}-${month}-%`]
		);

		const nextNumber = (result[0]?.last_number || 0) + 1;

		// Format: KTA-YYYY-MM-NNNN
		const noPengajuan = `KTA-${year}-${month}-${nextNumber
			.toString()
			.padStart(4, "0")}`;

		return noPengajuan;
	} catch (error) {
		console.error("Error generating no_pengajuan:", error);
		throw new Error("Gagal generate nomor pengajuan");
	}
}

/**
 * Validasi format nomor pengajuan
 * @param {string} noPengajuan - Nomor pengajuan yang akan divalidasi
 * @returns {boolean} - True jika format valid
 */
export function validateNoPengajuan(noPengajuan) {
	if (!noPengajuan || typeof noPengajuan !== "string") {
		return false;
	}

	// Pattern: KTA-YYYY-MM-NNNN
	const pattern = /^KTA-\d{4}-\d{2}-\d{4}$/;
	return pattern.test(noPengajuan);
}

/**
 * Parse informasi dari nomor pengajuan
 * @param {string} noPengajuan - Nomor pengajuan
 * @returns {object} - Object dengan year, month, sequence
 */
export function parseNoPengajuan(noPengajuan) {
	if (!validateNoPengajuan(noPengajuan)) {
		return null;
	}

	const parts = noPengajuan.split("-");
	return {
		prefix: parts[0], // KTA
		year: parseInt(parts[1]),
		month: parseInt(parts[2]),
		sequence: parseInt(parts[3]),
	};
}

/**
 * Cek apakah nomor pengajuan sudah ada di database
 * @param {string} noPengajuan - Nomor pengajuan yang akan dicek
 * @returns {Promise<boolean>} - True jika sudah ada
 */
export async function isNoPengajuanExists(noPengajuan) {
	try {
		const result = await rawQuery(
			`
			SELECT COUNT(*) as count 
			FROM pengajuan_kta 
			WHERE no_pengajuan = ?
		`,
			[noPengajuan]
		);

		return result[0]?.count > 0;
	} catch (error) {
		console.error("Error checking no_pengajuan existence:", error);
		return false;
	}
}

/**
 * Generate nomor pengajuan yang unik dengan retry mechanism
 * @param {Date} date - Tanggal untuk generate nomor
 * @param {number} maxRetries - Maksimal retry jika duplicate
 * @returns {Promise<string>} - Nomor pengajuan yang unik
 */
export async function generateUniqueNoPengajuan(
	date = new Date(),
	maxRetries = 5
) {
	let attempts = 0;

	while (attempts < maxRetries) {
		try {
			const noPengajuan = await generateNoPengajuan(date);

			// Cek apakah nomor sudah ada
			const exists = await isNoPengajuanExists(noPengajuan);

			if (!exists) {
				return noPengajuan;
			}

			// Jika sudah ada, coba lagi dengan delay kecil
			await new Promise((resolve) => setTimeout(resolve, 100));
			attempts++;
		} catch (error) {
			attempts++;
			if (attempts >= maxRetries) {
				throw error;
			}

			// Delay sebelum retry
			await new Promise((resolve) => setTimeout(resolve, 200));
		}
	}

	throw new Error(
		`Gagal generate nomor pengajuan unik setelah ${maxRetries} percobaan`
	);
}

/**
 * Get statistik nomor pengajuan per bulan
 * @param {number} year - Tahun
 * @param {number} month - Bulan
 * @returns {Promise<object>} - Statistik pengajuan
 */
export async function getPengajuanStats(year, month) {
	try {
		const result = await rawQuery(
			`
			SELECT 
				COUNT(*) as total_pengajuan,
				MAX(CAST(SUBSTRING(no_pengajuan, -4) AS UNSIGNED)) as last_sequence,
				MIN(no_pengajuan) as first_no,
				MAX(no_pengajuan) as last_no
			FROM pengajuan_kta 
			WHERE no_pengajuan LIKE ?
		`,
			[`KTA-${year}-${month.toString().padStart(2, "0")}-%`]
		);

		return (
			result[0] || {
				total_pengajuan: 0,
				last_sequence: 0,
				first_no: null,
				last_no: null,
			}
		);
	} catch (error) {
		console.error("Error getting pengajuan stats:", error);
		return {
			total_pengajuan: 0,
			last_sequence: 0,
			first_no: null,
			last_no: null,
		};
	}
}
