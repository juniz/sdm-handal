# Tanda Tangan Gaji & Jasa Redesign Implementation Plan (UI/UX Pro Max)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign `/dashboard/tanda-tangan-gaji` and `TandaTanganModal` into a clinical, high-trust digital payroll validation portal aligned with `DESIGN.md` ("Pusat Layanan SDM Tepercaya") and `ui-ux-pro-max` accessibility, touch ergonomics, and financial transparency standards.

**Architecture:** Refactor `src/app/dashboard/tanda-tangan-gaji/page.js` with smart tab auto-selection (pending indicators), status filter pills (`Semua`, `Menunggu TTD`, `Sudah Sah`), and a voucher-style financial card that transparently compares finalized period payout (`nominal`) against base tariff (`gapok` / `jasaDasar`). Upgrade `src/components/penggajian/TandaTanganModal.jsx` with dynamic canvas pixel calibration (preventing mobile touch/stylus offset), 44px minimum mobile touch targets, and live stroke-state feedback. Zero backend changes required.

**Tech Stack:** Next.js (App Router, Client Components), Tailwind CSS, shadcn/ui (`Card`, `Tabs`, `Select`, `Badge`, `Button`, `Dialog`), `react-signature-canvas`, `lucide-react`, GraphQL client (`@/lib/gaji-validasi-gql-client`).

## Global Constraints

- **Palette (`DESIGN.md`):** Primary Brand Cyan `sky-600` (`#0284C7`), Deep Sky Accent `sky-700` (`#0369A1`), Pale Cyan `sky-50` (`#F0F9FF`), Neutral Surface `slate-50` (`#F8FAFC`), Muted Slate `slate-500`/`slate-600` (minimum 4.5:1 WCAG AA contrast; never `slate-400` for readable text).
- **Typography (`DESIGN.md`):** `font-figtree` for headings, card titles, and financial figures; `font-mono` for NIK/Validation IDs; `tabular-nums` mandatory on all currency values, percentages, and counters.
- **Touch & Interaction (`ui-ux-pro-max`):** Minimum `44px` (`h-11 sm:h-9` or `min-h-[44px] sm:min-h-[36px]`) touch targets on mobile interactive controls, `cursor-pointer` on clickable elements, `150–200ms` transitions, no layout-shifting hover transforms, no emoji icons.
- **Data Integrity:** `item.nominal` (`gaji_pegawai.gaji`) is always the primary period payout; `item.gapok` and `item.jasaDasar` are base reference values shown for transparency when they differ from `item.nominal`.

---

## File Structure

- **Modify:** `src/app/dashboard/tanda-tangan-gaji/page.js`
  - Owns period filtering (`selectedBulan`, `selectedTahun`), status filtering (`statusFilter`: `"all" | "pending" | "signed"`), smart tab auto-switching (`activeTab`: `"gaji" | "jasa"`), voucher-style `GajiSectionContent` cards with base-vs-finalized breakdown, and modal state orchestration.
- **Modify:** `src/components/penggajian/TandaTanganModal.jsx`
  - Owns digital signature capture modal, container-aware canvas DPI/width calibration (`ResizeObserver` + `devicePixelRatio` or container width sync so touch coordinates never drift), 44px mobile touch targets, and financial breakdown summary inside the dialog.

---

### Task 1: Smart Tab Auto-Switch, Filter Toolbar & Voucher Card Redesign in `page.js`

**Files:**
- Modify: `src/app/dashboard/tanda-tangan-gaji/page.js`

**Interfaces:**
- Consumes: `fetchMyGajiValidasiList({ periodeTahun, periodeBulan })` and `mutationSignGaji({ gajiId, tandaTangan, catatan })` from `@/lib/gaji-validasi-gql-client`.
- Produces: Redesigned `TandaTanganGajiPage` and `GajiSectionContent` passing `{ id, nik, namaPegawai, periodeBulan, periodeTahun, jenis, nominal, baseNominal, isValidated }` into `TandaTanganModal`.

- [x] **Step 1: Implement Smart Auto-Tab Selection, Status Filter Pills, and Voucher Card UI in `src/app/dashboard/tanda-tangan-gaji/page.js`**

Update `src/app/dashboard/tanda-tangan-gaji/page.js` with:
1. **Smart Tab Auto-Selection:** In `loadData`, after receiving `data`:
   - Compute `gajiRows` (`!i.jenis || i.jenis.toLowerCase() === "gaji"`) and `jasaRows` (`i.jenis?.toLowerCase() === "jasa"`).
   - If `gajiRows` has unsigned items, prefer `"gaji"`; else if `jasaRows` has unsigned items, switch to `"jasa"`; else if `gajiRows.length === 0 && jasaRows.length > 0`, switch to `"jasa"`.
2. **Symmetrical Tab & Filter Toolbar:**
   - Left: `TabsList` for `Gaji Pokok` and `Jasa Pelayanan`, each showing total count badge + amber pending dot when that tab has unsigned items.
   - Right: Segmented status filter pills (`Semua`, `Menunggu TTD`, `Sudah Sah`) with `min-h-[36px]` and `cursor-pointer`.
3. **Digital Payroll Voucher Card (`GajiSectionContent`):**
   - Header: Employee name (`font-figtree font-bold text-slate-900`), monospace NIK chip (`font-mono text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md`), period label, and semantic status badge (`Sudah Divalidasi` emerald vs `Menunggu TTD` amber).
   - Financial Box (`bg-slate-50 border border-slate-200/90 rounded-xl p-3.5 sm:p-4`):
     - Primary payout (`nominalValue`) in `text-lg sm:text-xl font-bold font-figtree text-slate-900 tabular-nums`.
     - Transparent Comparison Row when `baseReference` (`gapok` or `jasaDasar`) exists and differs from `nominalValue`: displays `Tarif Dasar: Rp ...` and `Penyesuaian Rekap: +/- Rp ...` (`emerald-700` if positive, `amber-700` if deduction) so employees clearly see the relation between `rekap_bulanan` and their final payout.
   - Validation Footer:
     - Validated state: Shows `Tanda Terima Sah`, formatted `signedAt`, validation ID badge (`#ID`), optional `catatan`, and crisp signature specimen preview box (`h-20 sm:h-24 bg-white border border-slate-200 rounded-lg`).
     - Pending state: Compliance hint + `min-h-[44px] sm:min-h-[40px] cursor-pointer` primary button (`bg-sky-600 hover:bg-sky-700`).

- [x] **Step 2: Verify syntax and deterministic anti-patterns on `page.js`**

Run:
```bash
node --check src/app/dashboard/tanda-tangan-gaji/page.js && node .agents/skills/impeccable/scripts/detect.mjs src/app/dashboard/tanda-tangan-gaji/page.js
```
Expected: Exit code 0 with zero anti-pattern findings.

---

### Task 2: Canvas Calibration & Touch Ergonomics in `TandaTanganModal.jsx`

**Files:**
- Modify: `src/components/penggajian/TandaTanganModal.jsx`

**Interfaces:**
- Consumes: `open`, `onOpenChange`, `gajiData` (`{ id, nik, nama, namaPegawai, periode_bulan, periodeBulan, periode_tahun, periodeTahun, jenis, gaji, nominal, baseNominal }`), `onSubmit` from `src/app/dashboard/tanda-tangan-gaji/page.js`.
- Produces: Calibrated base64 PNG signature via `onSubmit({ gaji_id, tanda_tangan, catatan })`.

- [x] **Step 1: Upgrade `TandaTanganModal.jsx` with dynamic canvas sizing, base-vs-finalized breakdown, and 44px mobile touch targets**

Update `src/components/penggajian/TandaTanganModal.jsx` with:
1. **Container-Synced Canvas Dimensions:**
   - Add a `canvasWrapperRef` and `useEffect` when `open` is `true` (plus `ResizeObserver`) that measures `canvasWrapperRef.current.clientWidth` and sets the underlying `<canvas>` `width` and `height` (`160`px) accurately so touch/stylus strokes never stretch or offset on mobile screens.
2. **Transparent Financial Summary Header:**
   - Display `NIK` (`font-mono`), `Nama Pegawai`, `Periode` (using month name instead of raw number), `Nominal Disetujui` (`tabular-nums`), and if `gajiData.baseNominal` differs from `nominalValue`, show a subtle reference line (`Tarif Dasar: Rp ...`).
3. **Touch-First Controls (`ui-ux-pro-max` Priority 2):**
   - `Bersihkan` button: `min-h-[40px] sm:min-h-[36px] px-3 py-1.5 cursor-pointer` with disabled state when canvas is already empty (`!tandaTangan`).
   - Footer `Batal` and `Konfirmasi & Simpan` buttons: `h-11 sm:h-10 cursor-pointer` (`44px` on mobile) with clear loading state.

- [x] **Step 2: Verify anti-pattern scan and update knowledge graph**

Run:
```bash
node .agents/skills/impeccable/scripts/detect.mjs src/app/dashboard/tanda-tangan-gaji/page.js src/components/penggajian/TandaTanganModal.jsx && graphify update .
```
Expected: Exit code 0 with zero anti-patterns and updated AST graph.
