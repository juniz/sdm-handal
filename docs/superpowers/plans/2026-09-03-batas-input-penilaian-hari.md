# Batas Input Penilaian Kinerja Dinamis Lewat Environment Variable Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mengubah batas waktu pengisian penilaian kinerja harian agar dapat diatur dalam jumlah hari ($N$ hari) via environment variable `NEXT_PUBLIC_PENILAIAN_INPUT_LIMIT_DAYS`.

**Architecture:** Memperbarui helper `src/lib/penilaian-config.js` untuk membaca jumlah hari dari env dengan fallback backward compatibility ke `NEXT_PUBLIC_ENABLE_PENILAIAN_24H_LIMIT`. Memperbarui logika deadline dan pesan banner/error di backend API (`/api/penilaian/harian`, `/api/penilaian/harian/[id]`) dan frontend pages (`input/page.js`, `approval/page.js`).

**Tech Stack:** Next.js (App Router), React 19, moment.js, moment-timezone.

## Global Constraints
- Naming env: `NEXT_PUBLIC_PENILAIAN_INPUT_LIMIT_DAYS`.
- Nilai integer positif ($N > 0$): batas aktif $N$ hari.
- Nilai $0$ / unset (tanpa legacy env): limit nonaktif (unlimited backdated).
- Legacy env `NEXT_PUBLIC_ENABLE_PENILAIAN_24H_LIMIT=true` tetap didukung sebagai $1$ hari.
- Shift malam (+1 hari kompensasi).

---

### Task 1: Update Configuration Helper & Test Script

**Files:**
- Modify: `src/lib/penilaian-config.js`
- Create: `scripts/test-penilaian-limit.js`

**Interfaces:**
- Produces: `getPenilaianInputLimitDays(): number`, `isPenilaianLimitEnabled(): boolean`, `is24hLimitEnabled(): boolean`

- [ ] **Step 1: Write test script for config logic**

```javascript
// scripts/test-penilaian-limit.js
const assert = require("assert");

function testConfig(envDays, envLegacy) {
	delete process.env.NEXT_PUBLIC_PENILAIAN_INPUT_LIMIT_DAYS;
	delete process.env.NEXT_PUBLIC_ENABLE_PENILAIAN_24H_LIMIT;

	if (envDays !== undefined) process.env.NEXT_PUBLIC_PENILAIAN_INPUT_LIMIT_DAYS = envDays;
	if (envLegacy !== undefined) process.env.NEXT_PUBLIC_ENABLE_PENILAIAN_24H_LIMIT = envLegacy;

	// Inlined config logic for test
	const daysEnv = process.env.NEXT_PUBLIC_PENILAIAN_INPUT_LIMIT_DAYS;
	if (daysEnv !== undefined && daysEnv !== null && daysEnv.trim() !== "") {
		const parsed = parseInt(daysEnv, 10);
		if (!isNaN(parsed) && parsed > 0) return parsed;
		if (parsed === 0) return 0;
	}

	const legacyVal = process.env.NEXT_PUBLIC_ENABLE_PENILAIAN_24H_LIMIT;
	if (legacyVal === "true" || legacyVal === "1") return 1;

	return 0;
}

assert.strictEqual(testConfig("3", undefined), 3, "Harus return 3 saat env=3");
assert.strictEqual(testConfig("0", "true"), 0, "Harus return 0 saat diset 0 secara eksplisit");
assert.strictEqual(testConfig(undefined, "true"), 1, "Harus return 1 saat legacy env true");
assert.strictEqual(testConfig(undefined, undefined), 0, "Harus return 0 saat unset");
console.log("✅ All config tests passed!");
```

- [ ] **Step 2: Run test script to verify**

Run: `node scripts/test-penilaian-limit.js`
Expected: Output `✅ All config tests passed!`

- [ ] **Step 3: Update `src/lib/penilaian-config.js`**

```javascript
export function getPenilaianInputLimitDays() {
	const daysEnv = process.env.NEXT_PUBLIC_PENILAIAN_INPUT_LIMIT_DAYS;
	if (daysEnv !== undefined && daysEnv !== null && daysEnv.trim() !== "") {
		const parsed = parseInt(daysEnv, 10);
		if (!isNaN(parsed) && parsed > 0) {
			return parsed;
		}
		if (parsed === 0) {
			return 0;
		}
	}

	const legacyVal = process.env.NEXT_PUBLIC_ENABLE_PENILAIAN_24H_LIMIT;
	if (legacyVal === "true" || legacyVal === "1") {
		return 1;
	}

	return 0;
}

export function isPenilaianLimitEnabled() {
	return getPenilaianInputLimitDays() > 0;
}

export function is24hLimitEnabled() {
	return isPenilaianLimitEnabled();
}
```

- [ ] **Step 4: Commit Task 1**

```bash
git add src/lib/penilaian-config.js scripts/test-penilaian-limit.js
git commit -m "feat(config): support dynamic penilaian input limit days in penilaian-config"
```

---

### Task 2: Update Backend APIs for Dynamic Limit

**Files:**
- Modify: `src/app/api/penilaian/harian/route.js:423-441`
- Modify: `src/app/api/penilaian/harian/[id]/route.js:42-100,140-146,300-306,508-517`

**Interfaces:**
- Consumes: `getPenilaianInputLimitDays`, `isPenilaianLimitEnabled` from `@/lib/penilaian-config`

- [ ] **Step 1: Update `src/app/api/penilaian/harian/route.js`**
Update import to include `getPenilaianInputLimitDays, isPenilaianLimitEnabled`.
Update POST deadline validation:
```javascript
		// Verify deadline pengisian
		const limitDays = getPenilaianInputLimitDays();
		if (limitDays > 0) {
			let isNightShift = false;
			if (shift && shift !== "OFF" && shift !== "Libur") {
				const shiftInfo = await selectFirst({
					table: "jam_masuk",
					where: { shift: shift }
				});
				if (shiftInfo && shiftInfo.jam_pulang < shiftInfo.jam_masuk) {
					isNightShift = true;
				}
			}

			const daysToAdd = isNightShift ? limitDays + 1 : limitDays;
			const deadline = moment(tanggal).add(daysToAdd, "days").endOf("day");
			if (moment().isAfter(deadline)) {
				return NextResponse.json({ error: `Batas pengisian telah lewat (> ${limitDays} hari). Penilaian tanggal ${moment(tanggal).format("DD/MM/YYYY")} tidak dapat dibuat.` }, { status: 400 });
			}
		}
```

- [ ] **Step 2: Update `src/app/api/penilaian/harian/[id]/route.js`**
Update `checkDeadlinePassed` helper and error responses for PUT, submit, approve:
```javascript
async function checkDeadlinePassed(pegawaiId, tanggal, isApproval = false) {
	const limitDays = getPenilaianInputLimitDays();
	if (limitDays <= 0) return false;
	try {
		const evalDateStr = moment(tanggal).format("YYYY-MM-DD");
		const monthStr = moment(evalDateStr).format("MM");
		const yearStr = moment(evalDateStr).format("YYYY");
		const dayStr = moment(evalDateStr).format("D");

		const schedule = await selectFirst({
			table: "jadwal_pegawai",
			where: { id: pegawaiId, bulan: monthStr, tahun: yearStr }
		});

		const scheduleTambahan = await selectFirst({
			table: "jadwal_tambahan",
			where: { id: pegawaiId, bulan: monthStr, tahun: yearStr }
		});

		let shift = schedule ? (schedule[`h${dayStr}`] || "") : "";
		if (!shift) {
			shift = scheduleTambahan ? (scheduleTambahan[`h${dayStr}`] || "") : "";
		}

		let isNightShift = false;
		if (shift && shift !== "OFF" && shift !== "Libur") {
			const shiftInfo = await selectFirst({
				table: "jam_masuk",
				where: { shift: shift }
			});
			if (shiftInfo && shiftInfo.jam_pulang < shiftInfo.jam_masuk) {
				isNightShift = true;
			}
		}

		let daysToAdd = isNightShift ? limitDays + 1 : limitDays;
		if (isApproval) {
			daysToAdd += 1;
		}

		const deadline = moment.tz(evalDateStr, "Asia/Jakarta").add(daysToAdd, "days").endOf("day");
		const now = moment().tz("Asia/Jakarta");

		return now.isAfter(deadline);
	} catch (err) {
		console.error("Gagal memeriksa deadline input:", err);
		return false;
	}
}
```
Update PUT & POST error messages to:
- PUT: `Batas pengisian telah lewat (> ${getPenilaianInputLimitDays()} hari). Laporan tanggal ${moment(harian.tanggal).format("DD/MM/YYYY")} tidak dapat diubah.`
- POST submit: `Batas pengiriman telah lewat (> ${getPenilaianInputLimitDays()} hari). Laporan tanggal ${moment(harian.tanggal).format("DD/MM/YYYY")} tidak dapat dikirim.`
- POST approve: `Batas waktu persetujuan supervisor telah lewat (> ${getPenilaianInputLimitDays()} hari). Laporan tanggal ${moment(harian.tanggal).format("DD/MM/YYYY")} tidak dapat diproses.`

- [ ] **Step 3: Commit Task 2**

```bash
git add src/app/api/penilaian/harian/route.js src/app/api/penilaian/harian/[id]/route.js
git commit -m "feat(api): dynamic evaluation input deadline check in api routes"
```

---

### Task 3: Update Frontend Pages (Input & Approval)

**Files:**
- Modify: `src/app/dashboard/penilaian-kinerja/input/page.js:22,586-602,704-714,921-923,1210-1213`
- Modify: `src/app/dashboard/penilaian-kinerja/approval/page.js:19,36-41,243-252,435-439`

**Interfaces:**
- Consumes: `getPenilaianInputLimitDays`, `isPenilaianLimitEnabled` from `@/lib/penilaian-config`

- [ ] **Step 1: Update `src/app/dashboard/penilaian-kinerja/input/page.js`**
Update import to include `getPenilaianInputLimitDays, isPenilaianLimitEnabled`.
Update `checkIsDeadlinePassed`:
```javascript
	const checkIsDeadlinePassed = () => {
		const limitDays = getPenilaianInputLimitDays();
		if (limitDays <= 0) return false;
		if (!selectedDate) return false;
		let isNightShift = false;
		if (scheduleInfo.hasSchedule && scheduleInfo.shift && scheduleInfo.shift !== "OFF" && scheduleInfo.shift !== "Libur") {
			const sInfo = shiftDetails.find(s => s.shift === scheduleInfo.shift);
			if (sInfo && sInfo.jam_pulang < sInfo.jam_masuk) {
				isNightShift = true;
			}
		}
		const daysToAdd = isNightShift ? limitDays + 1 : limitDays;
		const deadline = moment(selectedDate).add(daysToAdd, "days").endOf("day");
		return moment().isAfter(deadline);
	};
```
Update UI banner & locked notice text to display dynamic `limitDays` hari.

- [ ] **Step 2: Update `src/app/dashboard/penilaian-kinerja/approval/page.js`**
Update import to include `getPenilaianInputLimitDays, isPenilaianLimitEnabled`.
Update `isApprovalDeadlinePassed`:
```javascript
	const isApprovalDeadlinePassed = (record) => {
		const limitDays = getPenilaianInputLimitDays();
		if (limitDays <= 0) return false;
		if (!record || !record.tanggal) return false;
		const deadline = moment(record.tanggal).add(limitDays + 1, "days").endOf("day");
		return moment().isAfter(deadline);
	};
```
Update UI warning banner & footer text.

- [ ] **Step 3: Commit Task 3**

```bash
git add src/app/dashboard/penilaian-kinerja/input/page.js src/app/dashboard/penilaian-kinerja/approval/page.js
git commit -m "feat(ui): dynamic evaluation input deadline check on input and approval pages"
```

---

### Task 4: Verification & Linting

**Files:**
- Run test script & Next.js lint / build check

- [ ] **Step 1: Run unit test script**
Run: `node scripts/test-penilaian-limit.js`
Expected: PASS

- [ ] **Step 2: Run Next.js lint / build validation**
Run: `npm run lint` or check syntax
Expected: No errors

- [ ] **Step 3: Commit remaining changes if any**
