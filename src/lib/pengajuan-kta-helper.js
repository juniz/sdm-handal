import moment from "moment-timezone";
import { rawQuery } from "@/lib/db-helper";

// Set timezone ke Jakarta
moment.tz.setDefault("Asia/Jakarta");

/**
 * Generate nomor pengajuan KTA dengan format KTA-YYYY-MM-NNNN
 * Menggunakan database locking untuk prevent race condition
 * @param {Date} date - Tanggal untuk generate nomor (default: now)
 * @returns {Promise<string>} - Nomor pengajuan yang unik
 */
export async function generateNoPengajuan(date = new Date()) {
	try {
		const currentDate = moment(date);
		const year = currentDate.format("YYYY");
		const month = currentDate.format("MM");

		// Gunakan database locking untuk prevent race condition
		const lockResult = await rawQuery(
			"SELECT GET_LOCK('pengajuan_kta_lock', 10) as lock_status"
		);

		if (lockResult[0]?.lock_status !== 1) {
			throw new Error("Gagal mendapatkan database lock");
		}

		try {
			// Ambil semua nomor urut yang sudah ada untuk bulan dan tahun ini
			// Menggunakan pendekatan yang lebih robust untuk sequential numbering
			const result = await rawQuery(
				`
				SELECT no_pengajuan
				FROM pengajuan_kta 
				WHERE no_pengajuan LIKE ? 
				  AND no_pengajuan REGEXP ?
				ORDER BY CAST(RIGHT(no_pengajuan, 4) AS UNSIGNED) ASC
			`,
				[`KTA-${year}-${month}-%`, `^KTA-${year}-${month}-[0-9]{4}$`]
			);

			// Ekstrak semua nomor urut yang sudah digunakan
			const usedNumbers = new Set();
			result.forEach((row) => {
				const match = row.no_pengajuan.match(/KTA-\d{4}-\d{2}-(\d{4})$/);
				if (match) {
					usedNumbers.add(parseInt(match[1]));
				}
			});

			// Cari nomor urut berikutnya yang tersedia (sequential)
			let nextNumber = 1;
			while (usedNumbers.has(nextNumber)) {
				nextNumber++;
			}

			// Format: KTA-YYYY-MM-NNNN (contoh: KTA-2025-07-0001)
			const noPengajuan = `KTA-${year}-${month}-${nextNumber
				.toString()
				.padStart(4, "0")}`;

			// Log untuk debugging
			console.log(
				`Generated sequential number: ${noPengajuan} (used: ${usedNumbers.size} numbers)`
			);

			return noPengajuan;
		} finally {
			// Selalu release lock
			await rawQuery("SELECT RELEASE_LOCK('pengajuan_kta_lock')");
		}
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
 * Generate nomor pengajuan yang unik dengan database locking
 * Format: KTA-YYYY-MM-NNNN (contoh: KTA-2025-07-0001)
 * @param {Date} date - Tanggal untuk generate nomor
 * @param {number} maxRetries - Maksimal retry jika database lock gagal
 * @returns {Promise<string>} - Nomor pengajuan yang unik
 */
export async function generateUniqueNoPengajuan(
	date = new Date(),
	maxRetries = 3
) {
	let attempts = 0;

	while (attempts < maxRetries) {
		try {
			// Dengan database locking, nomor yang dihasilkan sudah dijamin unik
			const noPengajuan = await generateNoPengajuan(date);

			// Double check untuk memastikan nomor belum ada (safety net)
			const exists = await isNoPengajuanExists(noPengajuan);

			if (!exists) {
				console.log(`Generated unique no_pengajuan: ${noPengajuan}`);
				return noPengajuan;
			}

			// Jika masih ada duplicate (sangat jarang), coba lagi dengan delay
			console.warn(
				`Duplicate no_pengajuan detected: ${noPengajuan}, retrying...`
			);
			await new Promise((resolve) => setTimeout(resolve, 100));
			attempts++;
		} catch (error) {
			console.error(
				`Error generating no_pengajuan (attempt ${attempts + 1}):`,
				error
			);
			attempts++;
			if (attempts >= maxRetries) {
				throw new Error(
					`Gagal generate nomor pengajuan unik setelah ${maxRetries} percobaan: ${error.message}`
				);
			}

			// Delay sebelum retry
			await new Promise((resolve) => setTimeout(resolve, 300));
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
		const monthPadded = month.toString().padStart(2, "0");

		// Ambil semua nomor untuk perhitungan sequential yang akurat
		const result = await rawQuery(
			`
			SELECT no_pengajuan
			FROM pengajuan_kta 
			WHERE no_pengajuan LIKE ? 
			  AND no_pengajuan REGEXP ?
			ORDER BY CAST(RIGHT(no_pengajuan, 4) AS UNSIGNED) ASC
		`,
			[`KTA-${year}-${monthPadded}-%`, `^KTA-${year}-${monthPadded}-[0-9]{4}$`]
		);

		// Ekstrak dan analisis nomor urut
		const sequences = [];
		result.forEach((row) => {
			const match = row.no_pengajuan.match(/KTA-\d{4}-\d{2}-(\d{4})$/);
			if (match) {
				sequences.push(parseInt(match[1]));
			}
		});

		sequences.sort((a, b) => a - b);

		// Cari next sequential number (mengisi gap jika ada)
		let nextSequence = 1;
		while (sequences.includes(nextSequence)) {
			nextSequence++;
		}

		const stats = {
			total_pengajuan: sequences.length,
			last_sequence: sequences.length > 0 ? Math.max(...sequences) : 0,
			first_no:
				sequences.length > 0
					? `KTA-${year}-${monthPadded}-${sequences[0]
							.toString()
							.padStart(4, "0")}`
					: null,
			last_no:
				sequences.length > 0
					? `KTA-${year}-${monthPadded}-${Math.max(...sequences)
							.toString()
							.padStart(4, "0")}`
					: null,
			next_no_pengajuan: `KTA-${year}-${monthPadded}-${nextSequence
				.toString()
				.padStart(4, "0")}`,
			used_sequences: sequences,
			gaps: [],
		};

		// Deteksi gap dalam sequence untuk informasi
		if (sequences.length > 0) {
			const maxSeq = Math.max(...sequences);
			for (let i = 1; i <= maxSeq; i++) {
				if (!sequences.includes(i)) {
					stats.gaps.push(i);
				}
			}
		}

		return stats;
	} catch (error) {
		console.error("Error getting pengajuan stats:", error);
		return {
			total_pengajuan: 0,
			last_sequence: 0,
			first_no: null,
			last_no: null,
			next_no_pengajuan: null,
			used_sequences: [],
			gaps: [],
		};
	}
}

/**
 * Test generate multiple nomor pengajuan sekaligus untuk testing concurrent
 * @param {number} count - Jumlah nomor yang akan di-generate
 * @param {Date} date - Tanggal untuk testing
 * @returns {Promise<Array>} - Array hasil generate
 */
export async function testBatchGenerateNoPengajuan(
	count = 5,
	date = new Date()
) {
	const results = [];
	const promises = [];

	console.log(`Testing batch generate ${count} nomor pengajuan...`);

	// Generate multiple nomor secara concurrent
	for (let i = 0; i < count; i++) {
		promises.push(
			generateUniqueNoPengajuan(date)
				.then((noPengajuan) => ({
					success: true,
					noPengajuan,
					index: i + 1,
				}))
				.catch((error) => ({
					success: false,
					error: error.message,
					index: i + 1,
				}))
		);
	}

	const batchResults = await Promise.all(promises);

	// Analisis hasil
	const successful = batchResults.filter((r) => r.success);
	const failed = batchResults.filter((r) => !r.success);
	const uniqueNumbers = new Set(successful.map((r) => r.noPengajuan));

	console.log(`Batch test completed:`);
	console.log(`- Total: ${count}`);
	console.log(`- Success: ${successful.length}`);
	console.log(`- Failed: ${failed.length}`);
	console.log(`- Unique numbers: ${uniqueNumbers.size}`);
	console.log(`- Duplicates: ${successful.length - uniqueNumbers.size}`);

	return {
		total: count,
		successful: successful.length,
		failed: failed.length,
		uniqueNumbers: uniqueNumbers.size,
		duplicates: successful.length - uniqueNumbers.size,
		results: batchResults,
		generatedNumbers: Array.from(uniqueNumbers).sort(),
	};
}
