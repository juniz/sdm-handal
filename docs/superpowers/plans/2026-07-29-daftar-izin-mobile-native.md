# Daftar Izin Mobile Native Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the mobile `DaftarIzin` accordion cards with a compact iOS grouped activity list and bottom detail sheet below `780px`, while preserving desktop behavior.

**Architecture:** Keep all state, API requests, filtering, pagination, and deletion logic inside the existing `DaftarIzin` component. Replace only the mobile presentation with small route-local helpers that receive plain izin records and callbacks, using the existing Radix dialog primitive as a bottom-aligned sheet.

**Tech Stack:** Next.js 15, React 19, Tailwind CSS 4, Radix/shadcn Dialog and AlertDialog, Lucide React, date-fns, Superdesign CLI.

## Global Constraints

- The new grouped list and detail sheet apply only below `780px`.
- At `780px` and above, preserve the existing date filters, table columns, row actions, and numbered pagination.
- Do not change `/api/izin`, request data, date filtering, pagination state, deletion rules, confirmation behavior, or toast messages.
- Use no new dependency and no new shared sheet abstraction.
- Mobile rows and controls must provide at least `44px` touch targets.
- Approved requests must not expose deletion.
- Verification uses the user-approved production-build and source-boundary workflow; no new UI test framework is added.

---

### Task 1: Generate the Focused Superdesign Variation

**Files:**
- Read: `src/app/dashboard/izin/components/DaftarIzin.js`
- Read: `src/components/ui/dialog.jsx`
- Read: `src/components/ui/skeleton.jsx`
- Read: `.superdesign/design-system.md`

**Interfaces:**
- Consumes: approved draft `681a6a79-f206-47ca-8c29-d47e6f4dd3f6` and the existing mobile history presentation.
- Produces: one approved visual branch for the grouped activity list and bottom sheet.

- [ ] **Step 1: Read the current approved draft**

Run:

```bash
npx --yes @superdesign/cli@latest get-design --draft-id 681a6a79-f206-47ca-8c29-d47e6f4dd3f6 --json
```

Expected: the approved iconic-header draft and its current HTML are returned.

- [ ] **Step 2: Generate one focused branch**

Run `iterate-design-draft --mode branch` with one prompt that requests:

```text
Redesign only the Daftar Izin mobile tab below 780px. Replace accordion cards with a compact iOS grouped activity list. Add a summary/filter toolbar, dense tappable rows with a system-blue calendar icon, request number, date range, duration, status pill, and chevron. Tapping a row opens a safe-area-aware bottom sheet showing submission date, period, duration, urgency, purpose, responsible employee, status, close action, and conditional delete. Show skeleton rows while loading, retain the inset empty state and previous/next pagination, and preserve the entire desktop filter/table/pagination at 780px and above.
```

Pass the verbatim user request `make view responsive on mobile device and feel like native app` through `--user-request`. Include the same design-system context plus `DaftarIzin.js`, `dialog.jsx`, `skeleton.jsx`, `badge.jsx`, `button.jsx`, and `DatePicker.jsx`.

- [ ] **Step 3: Present the generated preview**

Share the returned `preview:` and `canvas:` links. Obtain explicit user approval before changing application code.

### Task 2: Replace Accordion Cards with Grouped Mobile Rows

**Files:**
- Modify: `src/app/dashboard/izin/components/DaftarIzin.js:1-337`

**Interfaces:**
- Consumes: an izin `item` with `no_pengajuan`, `tanggal`, `tanggal_awal`, `tanggal_akhir`, `jumlah`, `urgensi`, `kepentingan`, `nama_pj`, and `status`.
- Produces:
  - `MobileIzinRow({ item, onOpen })`
  - `MobileHistorySkeleton()`
  - existing `getStatusBadge(status)` behavior.

- [ ] **Step 1: Update imports**

Add:

```jsx
import { CalendarDays, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
```

Keep the existing `ChevronRight` import only once. Remove the mobile accordion imports after the last accordion use is removed.

- [ ] **Step 2: Add the mobile row helper**

Create:

```jsx
const MobileIzinRow = ({ item, onOpen }) => (
	<button
		type="button"
		onClick={() => onOpen(item)}
		className="flex min-h-16 w-full items-center gap-3 border-b border-[#c6c6c8]/30 px-4 py-3 text-left last:border-b-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#007aff]"
		aria-label={`Lihat detail ${item.no_pengajuan}`}
	>
		<span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#e5f1ff] text-[#007aff]">
			<CalendarDays className="size-5" aria-hidden="true" />
		</span>
		<span className="min-w-0 flex-1">
			<span className="block truncate text-[15px] font-semibold text-[#1c1c1e]">
				{item.no_pengajuan}
			</span>
			<span className="mt-0.5 block text-[12px] text-[#6e6e73]">
				{formatDateSafe(item.tanggal_awal)} – {formatDateSafe(item.tanggal_akhir)}
				{" · "}{item.jumlah} hari
			</span>
		</span>
		<span className="flex shrink-0 items-center gap-1.5">
			{getStatusBadge(item.status)}
			<ChevronRight className="size-4 text-[#c7c7cc]" aria-hidden="true" />
		</span>
	</button>
);
```

- [ ] **Step 3: Add loading skeleton rows**

Create `MobileHistorySkeleton` that renders three `min-h-16` rows inside a `rounded-2xl bg-white` surface. Each row contains a `size-10 rounded-xl` icon skeleton and two text skeletons. Use the existing `Skeleton` primitive.

- [ ] **Step 4: Remove `IzinCard`**

Delete the accordion-based `IzinCard` helper. Keep all record details available for the detail-sheet helper in Task 3.

- [ ] **Step 5: Verify source structure**

Run:

```bash
rg -n "IzinCard|MobileIzinRow|MobileHistorySkeleton|Accordion" src/app/dashboard/izin/components/DaftarIzin.js
```

Expected: `MobileIzinRow` and `MobileHistorySkeleton` are present; `IzinCard` and mobile accordion imports are absent.

### Task 3: Add the Mobile Detail Bottom Sheet

**Files:**
- Modify: `src/app/dashboard/izin/components/DaftarIzin.js`

**Interfaces:**
- Consumes:
  - `item`: selected izin record or `null`.
  - `open`: boolean.
  - `onOpenChange(open: boolean)`.
  - `onDelete(noPengajuan: string)`.
- Produces: `MobileIzinDetailSheet({ item, open, onOpenChange, onDelete })`.

- [ ] **Step 1: Import dialog primitives**

Add:

```jsx
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
```

- [ ] **Step 2: Add the bottom-sheet helper**

Create `MobileIzinDetailSheet` that returns `null` when `item` is absent and otherwise renders:

```jsx
<Dialog open={open} onOpenChange={onOpenChange}>
	<DialogContent className="fixed inset-x-0 bottom-0 top-auto max-h-[85dvh] w-full max-w-none translate-x-0 translate-y-0 gap-0 overflow-y-auto rounded-b-none rounded-t-[24px] border-0 bg-[#f2f2f7] p-0 pb-[max(1rem,env(safe-area-inset-bottom))] min-[780px]:hidden">
		<div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-[#c7c7cc]" />
		<DialogHeader className="px-5 pb-4 pt-3 text-left">
			<DialogTitle>{item.no_pengajuan}</DialogTitle>
			<DialogDescription>Detail pengajuan izin</DialogDescription>
		</DialogHeader>
		{/* grouped detail sections */}
		<DialogFooter className="px-4 pt-4">
			{/* conditional delete and close actions */}
		</DialogFooter>
	</DialogContent>
</Dialog>
```

The grouped details must render every field listed in the spec. The delete button appears only for `item.status !== "Disetujui"` and calls `onDelete(item.no_pengajuan)`.

- [ ] **Step 3: Add selected-item state**

Inside `DaftarIzin`, add:

```jsx
const [selectedIzin, setSelectedIzin] = useState(null);
```

Use `Boolean(selectedIzin)` as the sheet open state. On close, set the selected item to `null`.

- [ ] **Step 4: Preserve delete confirmation**

Pass a sheet delete handler that:

```jsx
const handleSheetDelete = (noPengajuan) => {
	setSelectedIzin(null);
	showDeleteDialog(noPengajuan);
};
```

This closes the sheet and opens the existing AlertDialog without issuing a DELETE request.

- [ ] **Step 5: Mount the sheet**

Render one `MobileIzinDetailSheet` after the mobile list and before the existing delete confirmation dialog. Do not mount a separate sheet for every row.

### Task 4: Build the Summary Toolbar and Grouped List

**Files:**
- Modify: `src/app/dashboard/izin/components/DaftarIzin.js:453-668`

**Interfaces:**
- Consumes: `pagination.total`, `filterDate`, `handleDateChange`, `clearFilters`, `izin`, `loading`, `setSelectedIzin`.
- Produces: mobile summary/filter toolbar and grouped list; desktop markup remains unchanged.

- [ ] **Step 1: Replace the mobile filter accordion**

Use a mobile-only `min-[780px]:hidden` surface containing:

```jsx
<div className="mb-4 rounded-2xl bg-white p-4">
	<div className="flex items-center justify-between">
		<div>
			<p className="text-[13px] text-[#6e6e73]">Riwayat pengajuan</p>
			<p className="text-xl font-bold text-[#1c1c1e]">{pagination.total} izin</p>
		</div>
		{(filterDate.start || filterDate.end) && (
			<Button variant="ghost" onClick={clearFilters}>Hapus filter</Button>
		)}
	</div>
	<div className="mt-3 grid grid-cols-2 gap-2">
		{/* existing start and end DatePicker controls */}
	</div>
</div>
```

Keep labels visible and make each date control at least `44px` high.

- [ ] **Step 2: Replace mobile loading and list branches**

- Loading renders `<MobileHistorySkeleton />`.
- Empty retains the current icon, title, and secondary message.
- Populated state renders one `rounded-2xl bg-white` group containing `MobileIzinRow` for each record.

- [ ] **Step 3: Keep pagination unchanged**

Retain `MobilePagination` below the grouped list and the existing desktop `Pagination`. Both continue using `handlePageChange`.

- [ ] **Step 4: Confirm the exact breakpoint**

Run:

```bash
rg -n "min-\\[780px\\]:hidden|hidden min-\\[780px\\]:block" src/app/dashboard/izin/components/DaftarIzin.js
```

Expected: mobile toolbar, list, sheet, and mobile pagination hide at `780px`; desktop filter/table show at `780px`.

### Task 5: Verify and Commit the Revision

**Files:**
- Verify: `src/app/dashboard/izin/components/DaftarIzin.js`
- Verify: `docs/superpowers/specs/2026-07-29-daftar-izin-mobile-native-design.md`
- Verify: `docs/superpowers/plans/2026-07-29-daftar-izin-mobile-native.md`

**Interfaces:**
- Consumes: completed Tasks 1–4.
- Produces: a scoped, build-verified feature-branch revision.

- [ ] **Step 1: Review the diff**

Run:

```bash
git diff --check
git diff -- src/app/dashboard/izin/components/DaftarIzin.js
```

Expected: no whitespace errors and no API, fetch, pagination-state, or delete-request changes.

- [ ] **Step 2: Run the production build**

Run:

```bash
npm run build
```

Expected: Next.js production build exits `0`. If Google Fonts fail under restricted networking, rerun the same build with approved network access because `src/app/layout.js` already depends on `fonts.googleapis.com`.

- [ ] **Step 3: Inspect responsive widths when a browser is available**

Inspect `/dashboard/izin` at `390px`, `779px`, `780px`, and `1280px`.

Expected:

- `390px` and `779px`: toolbar, grouped rows, bottom sheet, and mobile pagination.
- `780px` and `1280px`: unchanged desktop filters, table, and numbered pagination.

If no browser surface is available, report that limitation without substituting a different browser tool.

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/izin/components/DaftarIzin.js docs/superpowers/plans/2026-07-29-daftar-izin-mobile-native.md
git commit -m "feat: add native izin history sheet"
```
