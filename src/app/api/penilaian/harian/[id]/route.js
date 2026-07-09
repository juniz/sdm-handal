import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { selectFirst, select, insert, update, delete_, rawQuery } from "@/lib/db-helper";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Helper check direct supervisor
async function getSupervisorIdForEmployee(employeeId) {
	// Fetch employee department & bidang
	const pegawai = await selectFirst({
		table: "pegawai",
		where: { id: employeeId },
		select: ["departemen", "bidang"]
	});

	if (!pegawai) return null;

	const supervisorResult = await rawQuery(`
		SELECT sm.supervisor_id
		FROM supervisor_mapping sm
		WHERE sm.is_aktif = 1
		  AND sm.berlaku_mulai <= CURDATE()
		  AND (sm.berlaku_sampai IS NULL OR sm.berlaku_sampai >= CURDATE())
		  AND (
		    (sm.tipe_relasi = 'personal' AND sm.pegawai_id = ?) 
		    OR
		    (sm.tipe_relasi = 'unit' AND (
		       (sm.tipe_unit = 'departemen' AND ? = sm.kode_unit) OR 
		       (sm.tipe_unit = 'bidang' AND ? = sm.kode_unit)       
		    ))
		  )
		ORDER BY FIELD(sm.tipe_relasi, 'personal', 'unit') ASC 
		LIMIT 1
	`, [employeeId, pegawai.departemen, pegawai.bidang]);

	return supervisorResult.length > 0 ? supervisorResult[0].supervisor_id : null;
}

export async function PUT(request, { params }) {
	try {
		const cookieStore = await cookies();
		const token = cookieStore.get("auth_token")?.value;

		if (!token) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		let verified;
		try {
			verified = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
		} catch (error) {
			return NextResponse.json({ error: "Unauthorized / Session Expired" }, { status: 401 });
		}

		const loggedInUser = verified.payload;
		const { id } = await params;

		// Get daily evaluation
		const harian = await selectFirst({
			table: "penilaian_harian",
			where: { id: id }
		});

		if (!harian) {
			return NextResponse.json({ error: "Penilaian harian tidak ditemukan" }, { status: 404 });
		}

		// Verify owner
		if (Number(harian.pegawai_id) !== Number(loggedInUser.id)) {
			return NextResponse.json({ error: "Forbidden - Bukan data Anda" }, { status: 403 });
		}

		// Verify status
		if (harian.status !== "draft" && harian.status !== "revisi") {
			return NextResponse.json({ error: "Penilaian yang sudah dikirim atau disetujui tidak dapat diubah" }, { status: 400 });
		}

		const body = await request.json();
		const { kegiatan = [], alasan_terlambat, sumber_absensi, nilai_kondisi, skor_absensi } = body;

		if (kegiatan.length > 20) {
			return NextResponse.json({ error: "Maksimal 20 kegiatan per hari" }, { status: 400 });
		}

		// Update main evaluation record (reasons + active attendance updates)
		const updateData = {
			alasan_terlambat: alasan_terlambat || null
		};

		if (sumber_absensi !== undefined) updateData.sumber_absensi = sumber_absensi;
		if (nilai_kondisi !== undefined) updateData.nilai_kondisi = nilai_kondisi;
		if (skor_absensi !== undefined) updateData.skor_absensi = skor_absensi !== null ? Number(skor_absensi) : null;

		await update({
			table: "penilaian_harian",
			data: updateData,
			where: { id: id }
		});

		// Fetch existing activities
		const existingActivities = await select({
			table: "kegiatan_harian",
			where: { penilaian_id: id }
		});

		const existingIds = existingActivities.map(item => item.id);
		const incomingIds = kegiatan.map(item => item.id).filter(Boolean);

		// 1. Delete items not in incoming list
		const toDelete = existingIds.filter(x => !incomingIds.includes(x));
		for (const delId of toDelete) {
			await delete_({
				table: "kegiatan_harian",
				where: { id: delId }
			});
		}

		for (let i = 0; i < kegiatan.length; i++) {
			const item = kegiatan[i];
			const statusSelesai = item.status_selesai === "selesai" ? "selesai" : "belum";
			let selesaiAt = null;
			if (statusSelesai === "selesai") {
				if (item.selesai_at) {
					if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(item.selesai_at)) {
						selesaiAt = item.selesai_at;
					} else {
						const parsedDate = new Date(item.selesai_at);
						selesaiAt = isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
					}
				} else {
					selesaiAt = new Date();
				}
			}
			const alasanBelumSelesai = statusSelesai === "belum" ? (item.alasan_belum_selesai || null) : null;
			const prioritas = item.prioritas || "sedang";

			if (item.id && existingIds.includes(item.id)) {
				// Update
				await update({
					table: "kegiatan_harian",
					data: {
						judul_kegiatan: item.judul_kegiatan.substring(0, 200),
						penjabaran: item.penjabaran || null,
						prioritas: prioritas,
						status_selesai: statusSelesai,
						alasan_belum_selesai: alasanBelumSelesai,
						urutan: item.urutan || (i + 1),
						selesai_at: selesaiAt
					},
					where: { id: item.id }
				});
			} else {
				// Insert new
				await insert({
					table: "kegiatan_harian",
					data: {
						penilaian_id: id,
						judul_kegiatan: item.judul_kegiatan.substring(0, 200),
						penjabaran: item.penjabaran || null,
						prioritas: prioritas,
						status_selesai: statusSelesai,
						alasan_belum_selesai: alasanBelumSelesai,
						urutan: item.urutan || (i + 1),
						selesai_at: selesaiAt
					}
				});
			}
		}

		// Fetch updated activities
		const updatedList = await select({
			table: "kegiatan_harian",
			where: { penilaian_id: id },
			orderBy: "urutan",
			order: "ASC"
		});

		return NextResponse.json({
			success: true,
			message: "Kegiatan harian berhasil diperbarui",
			data: updatedList
		});
	} catch (error) {
		console.error("Error in PUT /api/penilaian/harian/[id]:", error);
		return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
	}
}

export async function POST(request, { params }) {
	try {
		const cookieStore = await cookies();
		const token = cookieStore.get("auth_token")?.value;

		if (!token) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		let verified;
		try {
			verified = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
		} catch (error) {
			return NextResponse.json({ error: "Unauthorized / Session Expired" }, { status: 401 });
		}

		const loggedInUser = verified.payload;
		const { id } = await params;
		const body = await request.json();
		const { action, catatan_supervisor } = body;

		if (!action || !["submit", "approve", "revisi"].includes(action)) {
			return NextResponse.json({ error: "Aksi tidak valid" }, { status: 400 });
		}

		// Fetch daily evaluation
		const harian = await selectFirst({
			table: "penilaian_harian",
			where: { id: id }
		});

		if (!harian) {
			return NextResponse.json({ error: "Penilaian harian tidak ditemukan" }, { status: 404 });
		}

		// 1. SUBMIT ACTION
		if (action === "submit") {
			// Owner validation
			if (Number(harian.pegawai_id) !== Number(loggedInUser.id)) {
				return NextResponse.json({ error: "Forbidden - Hanya pemilik yang dapat mengirim penilaian" }, { status: 403 });
			}

			if (harian.status !== "draft" && harian.status !== "revisi") {
				return NextResponse.json({ error: "Penilaian sudah dikirim atau disetujui" }, { status: 400 });
			}

			// Get all activities
			const kegiatan = await select({
				table: "kegiatan_harian",
				where: { penilaian_id: id }
			});

			if (kegiatan.length === 0) {
				return NextResponse.json({ error: "Minimal harus ada 1 kegiatan harian sebelum dikirim" }, { status: 400 });
			}

			// Load weight parameters dynamically from parameter_penilaian
			const paramsList = await select({
				table: "parameter_penilaian",
				where: { is_aktif: 1 }
			});
			
			const wTinggi = Number(paramsList.find(p => p.kode === "KGT_BOBOT_TINGGI")?.nilai_skor || 3);
			const wSedang = Number(paramsList.find(p => p.kode === "KGT_BOBOT_SEDANG")?.nilai_skor || 2);
			const wRendah = Number(paramsList.find(p => p.kode === "KGT_BOBOT_RENDAH")?.nilai_skor || 1);

			const getWeight = (prioritas) => {
				if (prioritas === "tinggi") return wTinggi;
				if (prioritas === "rendah") return wRendah;
				return wSedang;
			};

			const totalWeight = kegiatan.reduce((acc, curr) => acc + getWeight(curr.prioritas), 0);
			const completedWeight = kegiatan.reduce((acc, curr) => acc + (curr.status_selesai === "selesai" ? getWeight(curr.prioritas) : 0), 0);

			const skorKegiatan = totalWeight > 0 ? (completedWeight / totalWeight) * 100 : 0;

			// Get bobot parameter
			const paramKegiatan = paramsList.find(p => p.kode === "KGT_PRODUKTIF");
			const bobotKegiatan = paramKegiatan ? Number(paramKegiatan.bobot_persen) : 60;
			const bobotAbsensi = 100 - bobotKegiatan;

			const skorAbsensi = Number(harian.skor_absensi);
			const skorTotal = (skorKegiatan * bobotKegiatan / 100) + (skorAbsensi * bobotAbsensi / 100);

			await update({
				table: "penilaian_harian",
				data: {
					skor_kegiatan: skorKegiatan,
					skor_total: skorTotal,
					status: "submitted"
				},
				where: { id: id }
			});

			return NextResponse.json({
				success: true,
				message: "Penilaian berhasil dikirim untuk approval supervisor",
				data: {
					skor_kegiatan: skorKegiatan,
					skor_total: skorTotal,
					status: "submitted"
				}
			});
		}

		// 2. APPROVE / REVISI ACTIONS (Supervisor role required)
		const authorizedSupervisorId = await getSupervisorIdForEmployee(harian.pegawai_id);

		// Prevent self-assessment
		if (Number(harian.pegawai_id) === Number(loggedInUser.id)) {
			return NextResponse.json({ error: "Forbidden - Tidak dapat mengevaluasi diri sendiri" }, { status: 403 });
		}

		// Verify authorized supervisor
		// Wait, IT department can override in emergency, but standard check:
		const isIT = loggedInUser.departemen?.toUpperCase() === "IT";
		if (Number(authorizedSupervisorId) !== Number(loggedInUser.id) && !isIT) {
			return NextResponse.json({ error: "Forbidden - Anda bukan supervisor yang sah untuk pegawai ini" }, { status: 403 });
		}

		if (harian.status !== "submitted") {
			return NextResponse.json({ error: "Penilaian harus berstatus 'submitted' untuk diproses" }, { status: 400 });
		}

		if (action === "approve") {
			await update({
				table: "penilaian_harian",
				data: {
					status: "approved",
					catatan_supervisor: catatan_supervisor || null,
					approved_by: loggedInUser.id,
					approved_at: new Date()
				},
				where: { id: id }
			});

			return NextResponse.json({
				success: true,
				message: "Penilaian harian berhasil disetujui",
				data: {
					status: "approved",
					approved_by: loggedInUser.id
				}
			});
		}

		if (action === "revisi") {
			if (!catatan_supervisor || catatan_supervisor.trim() === "") {
				return NextResponse.json({ error: "Catatan supervisor wajib diisi untuk mengembalikan penilaian" }, { status: 400 });
			}

			await update({
				table: "penilaian_harian",
				data: {
					status: "revisi",
					catatan_supervisor: catatan_supervisor
				},
				where: { id: id }
			});

			return NextResponse.json({
				success: true,
				message: "Penilaian harian dikembalikan ke pegawai untuk direvisi",
				data: {
					status: "revisi",
					catatan_supervisor: catatan_supervisor
				}
			});
		}

	} catch (error) {
		console.error("Error in POST /api/penilaian/harian/[id]:", error);
		return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
	}
}
