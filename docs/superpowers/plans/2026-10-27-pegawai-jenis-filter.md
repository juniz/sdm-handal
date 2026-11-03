# Filter Jenis Pegawai Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tambahkan filter jenis pegawai (`Semua Jenis`, `Pegawai POLRI`, `Pegawai PNS`, `Non-PNS & POLRI`) pada halaman `/dashboard/pegawai-manajemen` melalui Dropdown Select dan klik KPI Card yang tersinkronisasi dua arah.

**Architecture:** Tambahkan parameter query `jenis_pegawai` di endpoint `GET /api/pegawai-manajemen` yang memfilter `p.stts_kerja` pada query utama dan count (tanpa mengubah query agregasi `stats`). Di komponen `PegawaiDataSection.jsx`, tambahkan state `jenisPegawai` yang terhubung ke `<Select>` di bar filter dan handler `onClick` + active ring pada keempat KPI Card.

**Tech Stack:** Next.js App Router (JavaScript), React 18/19, Tailwind CSS, Lucide Icons, Radix UI Select (`@/components/ui/select`).

## Global Constraints

- Nilai filter `jenis_pegawai`: `"all"` (default), `"POLRI"`, `"PNS"`, `"NON_PNS_POLRI"`.
- Mapping SQL:
  - `POLRI` → `p.stts_kerja = 'POL'`
  - `PNS` → `p.stts_kerja = 'PNS'`
  - `NON_PNS_POLRI` → `(p.stts_kerja NOT IN ('POL', 'PNS') OR p.stts_kerja IS NULL)`
- Query `stats` di backend tidak difilter oleh `jenis_pegawai`.

---

### Task 1: Backend Query Filter `jenis_pegawai`

**Files:**
- Modify: `src/app/api/pegawai-manajemen/route.js:13-36`

**Interfaces:**
- Consumes: `searchParams.get("jenis_pegawai")` from `GET(request)` URL
- Produces: Filtered `pegawai` count & list in `GET /api/pegawai-manajemen`

- [ ] **Step 1: Add `jenis_pegawai` query parameter parsing and SQL `WHERE` condition**

In `src/app/api/pegawai-manajemen/route.js`:

```javascript
		const { searchParams } = new URL(request.url);
		const search = searchParams.get("search") || "";
		const departemen = searchParams.get("departemen") || "";
		const stts_aktif = searchParams.get("stts_aktif") || "";
		const jenis_pegawai = searchParams.get("jenis_pegawai") || "";
		const page = parseInt(searchParams.get("page") || "1");
		const limit = parseInt(searchParams.get("limit") || "20");
		const offset = (page - 1) * limit;

		let whereClause = "WHERE 1=1";
		const params = [];

		if (search) {
			whereClause += " AND (p.nama LIKE ? OR p.nik LIKE ?)";
			params.push(`%${search}%`, `%${search}%`);
		}
		if (departemen) {
			whereClause += " AND p.departemen = ?";
			params.push(departemen);
		}
		if (stts_aktif) {
			whereClause += " AND p.stts_aktif = ?";
			params.push(stts_aktif);
		}
		if (jenis_pegawai === "POLRI") {
			whereClause += " AND p.stts_kerja = 'POL'";
		} else if (jenis_pegawai === "PNS") {
			whereClause += " AND p.stts_kerja = 'PNS'";
		} else if (jenis_pegawai === "NON_PNS_POLRI") {
			whereClause +=
				" AND (p.stts_kerja NOT IN ('POL', 'PNS') OR p.stts_kerja IS NULL)";
		}
```

- [ ] **Step 2: Verify syntax / lint on `src/app/api/pegawai-manajemen/route.js`**

Run: `npx eslint src/app/api/pegawai-manajemen/route.js`
Expected: No errors.

---

### Task 2: Frontend `jenisPegawai` State, Interactive KPI Cards, and Select Dropdown

**Files:**
- Modify: `src/components/pegawai-manajemen/PegawaiDataSection.jsx:68-140`
- Modify: `src/components/pegawai-manajemen/PegawaiDataSection.jsx:224-370`

**Interfaces:**
- Consumes: `GET /api/pegawai-manajemen?jenis_pegawai=...`
- Produces: Two-way synced KPI Cards and Jenis Pegawai `<Select>` filter

- [ ] **Step 1: Add `jenisPegawai` state and query param in `fetchPegawai`**

In `src/components/pegawai-manajemen/PegawaiDataSection.jsx`:

```javascript
	const [departemen, setDepartemen] = useState("all");
	const [sttsAktif, setSttsAktif] = useState("AKTIF");
	const [jenisPegawai, setJenisPegawai] = useState("all");
```

And inside `fetchPegawai`:
```javascript
			if (departemen && departemen !== "all")
				params.set("departemen", departemen);
			if (sttsAktif && sttsAktif !== "all") params.set("stts_aktif", sttsAktif);
			if (jenisPegawai && jenisPegawai !== "all")
				params.set("jenis_pegawai", jenisPegawai);
			params.set("page", page);
```
With dependency array `[search, departemen, sttsAktif, jenisPegawai, page]`.

- [ ] **Step 2: Make KPI Cards clickable with active state styling and add Select filter**

Update the 4 KPI cards in `src/components/pegawai-manajemen/PegawaiDataSection.jsx` to toggle `jenisPegawai` (and reset `page` to `1`), and add the Jenis Pegawai `<Select>` dropdown next to Departemen & Status selects.

- [ ] **Step 3: Run ESLint to verify no errors**

Run: `npx eslint src/components/pegawai-manajemen/PegawaiDataSection.jsx src/app/api/pegawai-manajemen/route.js`
Expected: 0 errors.
