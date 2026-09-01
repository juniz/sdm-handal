#!/usr/bin/env node

/**
 * Test script for Deteksi Cuti & Bypass Penilaian Harian logic
 */

const moment = require("moment");

// 1. Test mapCutiToKondisi mapping
function mapCutiToKondisi(urgensi) {
	const map = {
		"Sakit": "sakit",
		"Tahunan": "cuti_tahunan",
		"Melahirkan": "cuti_melahirkan",
		"Ibadah Keagamaan": "cuti_ibadah",
		"Istimewa": "cuti_istimewa",
		"Karena Alasan Penting": "cuti_penting",
		"Di luar tanggungan negara": "cuti_luar_tanggungan",
		"Tahunan ke luar negeri": "cuti_luar_negeri",
		"Keterangan Lainnya": "cuti_lainnya",
	};
	return map[urgensi] || "cuti_lainnya";
}

console.log("=== 1. Testing mapCutiToKondisi ===");
const testCases = [
	{ input: "Sakit", expected: "sakit" },
	{ input: "Tahunan", expected: "cuti_tahunan" },
	{ input: "Melahirkan", expected: "cuti_melahirkan" },
	{ input: "Ibadah Keagamaan", expected: "cuti_ibadah" },
	{ input: "Istimewa", expected: "cuti_istimewa" },
	{ input: "Karena Alasan Penting", expected: "cuti_penting" },
	{ input: "Di luar tanggungan negara", expected: "cuti_luar_tanggungan" },
	{ input: "Tahunan ke luar negeri", expected: "cuti_luar_negeri" },
	{ input: "Unknown Type", expected: "cuti_lainnya" },
];

let mapPassed = 0;
for (const tc of testCases) {
	const result = mapCutiToKondisi(tc.input);
	if (result === tc.expected) {
		mapPassed++;
	} else {
		console.error(`FAIL: mapCutiToKondisi("${tc.input}") => ${result}, expected ${tc.expected}`);
	}
}
console.log(`mapCutiToKondisi test: ${mapPassed}/${testCases.length} passed.`);

// 2. Test date range overlap and shift expansion simulation
console.log("\n=== 2. Testing Date Overlap and Shift Expansion Logic ===");

function expandLeaveDates({ reqStart, reqEnd, queryStart, queryEnd, scheduleMap, penilaianMap, pegawaiId, nik, noPengajuan, urgensi, pegawaiNama, departemen, departemenNama, statusFilter = "ALL" }) {
	const start = moment.max(moment(reqStart), moment(queryStart));
	const end = moment.min(moment(reqEnd), moment(queryEnd));

	let curr = start.clone();
	const items = [];
	let totalCutiShift = 0;
	let countApproved100 = 0;
	let countPerluBypass = 0;

	while (curr.isSameOrBefore(end)) {
		const dateStr = curr.format("YYYY-MM-DD");
		const dayNumber = curr.date();
		const monthStr = curr.format("MM");
		const yearStr = curr.format("YYYY");

		const regSched = scheduleMap.get(`regular_${pegawaiId}_${monthStr}_${yearStr}`);
		let shift = regSched ? regSched[`h${dayNumber}`] : "";

		if (!shift || shift.trim() === "") {
			const addSched = scheduleMap.get(`tambahan_${pegawaiId}_${monthStr}_${yearStr}`);
			shift = addSched ? addSched[`h${dayNumber}`] : "";
		}

		shift = (shift || "").trim();
		const shiftUpper = shift.toUpperCase();

		if (!shift || shiftUpper === "OFF" || shiftUpper === "LIBUR") {
			curr.add(1, "day");
			continue;
		}

		const ph = penilaianMap.get(`${pegawaiId}_${dateStr}`);
		let statusBypass = "belum_dibuat";

		if (ph) {
			const isApproved100 =
				ph.status === "approved" &&
				Number(ph.skor_total) === 100 &&
				ph.sumber_absensi === "cuti";

			statusBypass = isApproved100 ? "approved_100" : "perlu_bypass";
		}

		totalCutiShift++;
		if (statusBypass === "approved_100") {
			countApproved100++;
		} else {
			countPerluBypass++;
		}

		const item = {
			pegawai_id: pegawaiId,
			pegawai_nama: pegawaiNama,
			nik: nik,
			departemen: departemen,
			departemen_nama: departemenNama,
			no_pengajuan: noPengajuan,
			urgensi: urgensi,
			nilai_kondisi: mapCutiToKondisi(urgensi),
			tanggal: dateStr,
			shift: shift,
			status_bypass: statusBypass,
			penilaian_id: ph ? ph.id : null,
			penilaian_status: ph ? ph.status : null,
			skor_total: ph ? Number(ph.skor_total) : null,
			sumber_absensi: ph ? ph.sumber_absensi : null,
			ref_cuti_no: ph ? ph.ref_cuti_no : null
		};

		if (
			statusFilter === "ALL" ||
			statusFilter === statusBypass ||
			(statusFilter === "perlu_bypass" && statusBypass !== "approved_100")
		) {
			items.push(item);
		}

		curr.add(1, "day");
	}

	return {
		summary: {
			total_cuti_shift: totalCutiShift,
			approved_100: countApproved100,
			perlu_bypass: countPerluBypass
		},
		data: items
	};
}

// Test scenario: Leave 2026-09-01 to 2026-09-05 (5 days)
// Day 1: Pagi (no ph -> belum_dibuat)
// Day 2: Siang (ph draft -> perlu_bypass)
// Day 3: OFF (skipped)
// Day 4: Malam (ph approved 100 cuti -> approved_100)
// Day 5: Libur (skipped)
const mockScheduleMap = new Map();
mockScheduleMap.set("regular_101_09_2026", {
	id: 101,
	bulan: "09",
	tahun: "2026",
	h1: "Pagi",
	h2: "Siang",
	h3: "OFF",
	h4: "Malam",
	h5: "LIBUR"
});

const mockPenilaianMap = new Map();
mockPenilaianMap.set("101_2026-09-02", {
	id: 501,
	pegawai_id: 101,
	tanggal: "2026-09-02",
	status: "draft",
	skor_total: 0,
	sumber_absensi: null
});
mockPenilaianMap.set("101_2026-09-04", {
	id: 502,
	pegawai_id: 101,
	tanggal: "2026-09-04",
	status: "approved",
	skor_total: 100,
	sumber_absensi: "cuti"
});

const result = expandLeaveDates({
	reqStart: "2026-09-01",
	reqEnd: "2026-09-05",
	queryStart: "2026-09-01",
	queryEnd: "2026-09-30",
	scheduleMap: mockScheduleMap,
	penilaianMap: mockPenilaianMap,
	pegawaiId: 101,
	nik: "NIK101",
	noPengajuan: "CUTI/2026/001",
	urgensi: "Tahunan",
	pegawaiNama: "Dr. Budi",
	departemen: "DEP01",
	departemenNama: "Rawat Inap"
});

console.log("Summary result:", result.summary);
console.log("Items count:", result.data.length);
console.log("Items:", result.data.map(d => ({ tanggal: d.tanggal, shift: d.shift, status_bypass: d.status_bypass })));

// Verifications
const assertions = [
	result.summary.total_cuti_shift === 3, // Days 1, 2, 4 (Days 3 and 5 are OFF/Libur)
	result.summary.approved_100 === 1,    // Day 4
	result.summary.perlu_bypass === 2,    // Days 1 and 2
	result.data[0].status_bypass === "belum_dibuat",
	result.data[1].status_bypass === "perlu_bypass",
	result.data[2].status_bypass === "approved_100",
	result.data[0].nilai_kondisi === "cuti_tahunan"
];

const allPassed = assertions.every(Boolean);
if (allPassed) {
	console.log("✅ ALL SIMULATION TESTS PASSED!");
} else {
	console.error("❌ SOME ASSERTIONS FAILED:", assertions);
	process.exit(1);
}
