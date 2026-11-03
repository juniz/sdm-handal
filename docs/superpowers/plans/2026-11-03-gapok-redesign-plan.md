# Redesign Plan: `/dashboard/penggajian/gapok` (UI/UX Pro Max)

**Target File:** `src/app/dashboard/penggajian/gapok/page.js`
**Backend Route:** `src/app/api/pegawai/gapok/route.js` (Zero API changes required; reuses existing `pagination.total` & `meta.unset_total`)
**Design System Alignment:** `DESIGN.md` (Clinical Precision, `#0284C7` `sky-600` brand cyan, `font-figtree` headers, `tabular-nums`, `#F8FAFC` neutral surface) + `ui-ux-pro-max` Data-Dense Dashboard pattern.

---

## 1. Visual & Brand Alignment (`DESIGN.md`)
- **Primary Brand Token:** Replace generic `blue-600` (`#2563EB`) buttons, icons, and hover tints with `sky-600` (`#0284C7` Brand Cyan) and `sky-50/40` (`#F0F9FF`) row hover states.
- **Typography & Hierarchy:** Apply `font-figtree` to page headline, KPI numbers, and card titles; keep `font-mono` for NIK and `tabular-nums` for all currency/count displays.
- **Semantic Status Badges:**
  - **Terisi (`gapok > 0`):** Crisp `text-slate-900 font-semibold tabular-nums`.
  - **Belum Diatur (`null` / `undefined` / `0`):** Unified semantic amber pill (`bg-amber-50 text-amber-800 border border-amber-200`) so `Rp 0` and `null` are treated consistently (matching backend `unset_only` SQL `gapok IS NULL OR gapok = 0`).

---

## 2. Operational KPI Summary Strip (3 Compact Cards)
Add a 3-column summary strip above the main card so HR admins immediately see payroll readiness before clicking **Generate Gaji**:
1. **Total Pegawai Sesuai Filter (`totalRecords`):** Icon `Users` (`sky-600`), shows active headcount in current view.
2. **Siap Digenerate (`Math.max(0, totalRecords - unsetTotal)` when unfiltered, or derived status):** Icon `CheckCircle2` (`emerald-600`), shows employees with configured base salary.
3. **Perlu Diatur / Audit (`unsetTotal`):** Interactive card (clickable to toggle `showUnsetOnly`), Icon `AlertCircle` (`amber-600`), highlights employees with `gapok = 0 / NULL` that would generate `Rp 0` payroll.

---

## 3. Symmetrical Filter Toolbar & Quick Reset
Refactor `CardHeader` into a clean, single-row responsive toolbar:
- **Left:** Search input (`Cari nama atau NIK...` with clear `✕` button when non-empty) + Department `Select` (`Semua Departemen`).
- **Right:**
  - Quick filter toggle button `Hanya Belum Diatur` with live badge count `unsetTotal`.
  - Conditional `Reset Filter` ghost button when `search !== ""`, `selectedDepartment !== "all"`, or `showUnsetOnly === true`.

---

## 4. Responsive Data View (Desktop Table + Mobile Card List)
Eliminate horizontal scrolling on mobile (`< 768px`) while keeping high data density on desktop:
- **Desktop (`hidden md:block`):**
  - 6-column table (`NIK`, `Nama Pegawai`, `Departemen`, `Jabatan`, `Gaji Pokok`, `Aksi`).
  - Replace bare icon-only edit button with a clear, high-target action button (`h-9 px-3 text-xs font-medium text-sky-700 hover:bg-sky-50 hover:text-sky-800 gap-1.5`) labeled `Edit` with `Pencil` icon.
- **Mobile (`md:hidden`):**
  - Stacked card list per employee showing `Nama` + `NIK` badge on top, `Departemen • Jabatan` subtitle, formatted `Gaji Pokok` (or `Belum diatur` badge) on bottom-left, and `Edit` button on bottom-right.

---

## 5. Polished Modals (Edit, Import Excel, Generate Gaji)
- **Edit Gaji Pokok Modal:**
  - Read-only employee summary banner (`Nama`, `NIK`) in a compact `bg-slate-50 border-slate-200` box instead of a disabled form input.
  - Live formatted `Rp` preview badge (`bg-sky-50 text-sky-800 border-sky-200 tabular-nums`) + `onSubmit` also refreshes `unsetTotal` via `fetchData()` so the audit counter stays accurate immediately after editing an unset employee.
- **Generate Gaji & Import Excel Modals:**
  - Unify primary CTA buttons to `bg-sky-600 hover:bg-sky-700` and maintain `sm:gap-3` footer spacing.

---

## Implementation Steps & Verification
1. **Step 1:** Update `src/app/dashboard/penggajian/gapok/page.js` with `DESIGN.md` color tokens, 3 KPI summary cards, symmetrical filter bar with clear/reset, desktop table + mobile card list, and refreshed Edit modal (`fetchData()` sync on save).
2. **Step 2:** Verify syntax (`node --check src/app/dashboard/penggajian/gapok/page.js`), anti-pattern scan (`node .agents/skills/impeccable/scripts/detect.mjs src/app/dashboard/penggajian/gapok/page.js`), and update knowledge graph (`graphify update .`).
