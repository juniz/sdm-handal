import { withTransaction, transactionHelpers } from "@/lib/db-helper";

/**
 * Contoh penggunaan transaction untuk operasi attendance
 * Yang menjaga integritas data dengan rollback otomatis jika ada error
 */
export async function attendanceTransactionExample() {
	try {
		const result = await withTransaction(async (transaction) => {
			// BEGIN TRANSACTION (otomatis)

			// Step 1: Insert security log
			const securityResult = await transactionHelpers.insert(transaction, {
				table: "security_logs",
				data: {
					id_pegawai: "12345",
					tanggal: "2024-01-15",
					action_type: "CHECKIN",
					confidence_level: 85,
					risk_level: "LOW",
					warnings: JSON.stringify([]),
					created_at: new Date(),
				},
			});

			// Step 2: Insert presensi data
			const presensiResult = await transactionHelpers.insert(transaction, {
				table: "temporary_presensi",
				data: {
					id: "12345",
					shift: "Pagi",
					jam_datang: "2024-01-15 08:00:00",
					status: "Tepat Waktu",
					keterlambatan: "00:00:00",
					photo: "/photos/example.jpg",
				},
			});

			// Step 3: Insert geolocation
			const geoResult = await transactionHelpers.insert(transaction, {
				table: "geolocation_presensi",
				data: {
					id: "12345",
					tanggal: "2024-01-15",
					latitude: -6.2088,
					longitude: 106.8456,
				},
			});

			// Jika salah satu operasi di atas gagal,
			// semua akan di-rollback secara otomatis

			// COMMIT TRANSACTION (otomatis jika tidak ada error)
			return {
				security: securityResult,
				presensi: presensiResult,
				geolocation: geoResult,
			};
		});

		console.log("Transaction berhasil:", result);
		return result;
	} catch (error) {
		// ROLLBACK TRANSACTION (otomatis jika ada error)
		console.error("Transaction gagal dan di-rollback:", error);
		throw error;
	}
}

/**
 * Contoh penggunaan transaction untuk checkout
 */
export async function checkoutTransactionExample() {
	try {
		const result = await withTransaction(async (transaction) => {
			// BEGIN TRANSACTION

			// Step 1: Insert security log
			await transactionHelpers.insert(transaction, {
				table: "security_logs",
				data: {
					id_pegawai: "12345",
					action_type: "CHECKOUT",
					confidence_level: 90,
					created_at: new Date(),
				},
			});

			// Step 2: Insert ke rekap_presensi
			await transactionHelpers.insert(transaction, {
				table: "rekap_presensi",
				data: {
					id: "12345",
					jam_datang: "2024-01-15 08:00:00",
					jam_pulang: "2024-01-15 17:00:00",
					durasi: "09:00:00",
					status: "Tepat Waktu",
				},
			});

			// Step 3: Hapus dari temporary_presensi
			await transactionHelpers.delete(transaction, {
				table: "temporary_presensi",
				where: {
					id: "12345",
					jam_datang: "2024-01-15 08:00:00",
				},
			});

			// COMMIT TRANSACTION
			return { message: "Checkout berhasil" };
		});

		return result;
	} catch (error) {
		// ROLLBACK TRANSACTION
		console.error("Checkout transaction failed:", error);
		throw error;
	}
}

/**
 * Contoh error handling dengan rollback
 */
export async function errorTransactionExample() {
	try {
		await withTransaction(async (transaction) => {
			// Step 1: Insert berhasil
			await transactionHelpers.insert(transaction, {
				table: "security_logs",
				data: { id_pegawai: "12345", action_type: "TEST" },
			});

			// Step 2: Simulasi error
			throw new Error("Simulasi error untuk testing rollback");

			// Step yang tidak akan dieksekusi karena error di atas
			await transactionHelpers.insert(transaction, {
				table: "temporary_presensi",
				data: { id: "12345" },
			});
		});
	} catch (error) {
		// Data dari Step 1 akan di-rollback secara otomatis
		// Tidak ada data yang tersimpan di database
		console.log("Error ditangkap, data di-rollback:", error.message);
	}
}
