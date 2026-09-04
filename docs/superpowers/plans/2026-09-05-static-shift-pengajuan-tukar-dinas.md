# Static Shift Options in Pengajuan Tukar Dinas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mengubah pilihan shift pada pengajuan tukar dinas menjadi statis hanya "Pagi", "Siang", "Malam" sesuai enum di tabel database `pengajuan_tudin`.

**Architecture:** Hapus pemanggilan API `/api/jam-jaga` di hook `usePengajuanTukarDinas`, sediakan array statis `["Pagi", "Siang", "Malam"]`, sederhanakan `PengajuanFormModal`, dan tambahkan validasi enum shift di endpoint API `POST /api/pengajuan-tukar-dinas`.

**Tech Stack:** Next.js (App Router), React, Tailwind CSS, MySQL.

## Global Constraints

- Pilihan shift yang diizinkan hanya: `"Pagi"`, `"Siang"`, `"Malam"`.
- Jangan merusak signature return value hook `usePengajuanTukarDinas` (`shiftData` harus tetap diekspor).

---

### Task 1: Update `src/hooks/usePengajuanTukarDinas.js`

**Files:**
- Modify: `src/hooks/usePengajuanTukarDinas.js`

**Interfaces:**
- Consumes: None
- Produces: `shiftData = ["Pagi", "Siang", "Malam"]` (backward compatible)

- [ ] **Step 1: Replace dynamic shift fetching with static constants**
Hapus fungsi `fetchShiftData` dan `useEffect` yang memanggil `fetchShiftData` saat `userDepartmentId` berubah. Inisialisasi `shiftData` dengan `["Pagi", "Siang", "Malam"]`.

- [ ] **Step 2: Commit**

```bash
git add src/hooks/usePengajuanTukarDinas.js
git commit -m "refactor(pengajuan-tukar-dinas): use static shifts in usePengajuanTukarDinas hook"
```

---

### Task 2: Update `src/components/PengajuanFormModal.jsx`

**Files:**
- Modify: `src/components/PengajuanFormModal.jsx`

**Interfaces:**
- Consumes: `DEFAULT_SHIFTS = ["Pagi", "Siang", "Malam"]`
- Produces: Dropdown choices with only `Pagi`, `Siang`, `Malam`.

- [ ] **Step 1: Simplify availableShifts in PengajuanFormModal**
Pastikan `availableShifts` selalu merujuk langsung ke `DEFAULT_SHIFTS = ["Pagi", "Siang", "Malam"]`.

- [ ] **Step 2: Commit**

```bash
git add src/components/PengajuanFormModal.jsx
git commit -m "refactor(pengajuan-tukar-dinas): enforce static shifts in modal"
```

---

### Task 3: Add Backend Shift Enum Validation in `src/app/api/pengajuan-tukar-dinas/route.js`

**Files:**
- Modify: `src/app/api/pengajuan-tukar-dinas/route.js`

**Interfaces:**
- Consumes: `shift1`, `shift2` from POST body
- Produces: 400 error response jika nilai shift di luar `["Pagi", "Siang", "Malam"]`.

- [ ] **Step 1: Add shift validation in POST handler**
Tambahkan validasi:
```javascript
const VALID_SHIFTS = ["Pagi", "Siang", "Malam"];
if (!VALID_SHIFTS.includes(shift1) || !VALID_SHIFTS.includes(shift2)) {
	return NextResponse.json(
		{ message: "Shift harus salah satu dari: Pagi, Siang, atau Malam" },
		{ status: 400 }
	);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/pengajuan-tukar-dinas/route.js
git commit -m "feat(api/pengajuan-tukar-dinas): validate shift enum values"
```

---

### Task 4: Lint and Verification

**Files:**
- None (verification)

- [ ] **Step 1: Run linter / build check**
Run `npm run lint` or `npm run build` to verify there are no syntax or type errors.

- [ ] **Step 2: Verify git status and changes**
Ensure working directory is clean and diff matches expected changes.
