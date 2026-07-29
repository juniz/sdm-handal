# Izin Mobile iOS Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/dashboard/izin` feel like a native iOS application below `780px` without changing its desktop layout or existing business behavior.

**Architecture:** Keep the existing page, form, and history components and add mobile-only presentation with Tailwind `min-[780px]:` variants. Preserve all state, API requests, validation, dialogs, and data contracts; only restructure JSX and classes where needed to provide an iOS-style shell, grouped form, mobile history list, and compact pagination.

**Tech Stack:** Next.js 15, React 19, Tailwind CSS 4, Radix/shadcn UI primitives, Lucide React, Framer Motion, Superdesign CLI.

## Global Constraints

- The new presentation applies only below `780px`.
- At `780px` and above, preserve the existing desktop presentation and interactions.
- Do not change `/api/izin`, form fields, validation rules, submission behavior, filtering behavior, pagination data, deletion behavior, or response structures.
- Keep mobile touch targets at least `44px` tall.
- Keep visible focus states and do not communicate status or validation through color alone.
- Add no dependencies and no new shared abstraction for route-local presentation.

---

### Task 1: Establish Superdesign Context and Mobile Draft

**Files:**
- Create or regenerate: `.superdesign/init/components.md`
- Create or regenerate: `.superdesign/init/layouts.md`
- Create or regenerate: `.superdesign/init/routes.md`
- Create or regenerate: `.superdesign/init/theme.md`
- Create or regenerate: `.superdesign/init/pages.md`
- Create or regenerate: `.superdesign/init/extractable-components.md`
- Modify if needed: `.gitignore`

**Interfaces:**
- Consumes: the current route files and repository theme/layout components.
- Produces: a Superdesign project and an approved visual draft used as the implementation reference; no runtime interface changes.

- [ ] **Step 1: Read the Superdesign operating instructions**

Read the complete `references/SUPERDESIGN.md` and `references/INIT.md` files adjacent to the installed Superdesign skill before running any project command.

- [ ] **Step 2: Run the required CLI preflight**

Run:

```bash
npx --yes @superdesign/cli@latest
```

Expected: the command prints an `auth:` line and recent projects. If unauthenticated, run `npx --yes @superdesign/cli@latest login`, wait for success, and rerun the preflight once.

- [ ] **Step 3: Generate complete repository context**

Follow `INIT.md` to write all six non-empty files under `.superdesign/init/`. Confirm completeness with:

```bash
find .superdesign/init -maxdepth 1 -type f -size +0c -print
```

Expected: all six mandatory filenames appear.

- [ ] **Step 4: Read the generated context and select visual source files**

Read all six init files. From `pages.md`, identify the dependency tree for `/dashboard/izin`. Include the visually relevant route files, global theme tokens, and layout context in the draft command while respecting the Superdesign payload budget.

- [ ] **Step 5: Reproduce the existing route**

Create or reuse the project selected from preflight, then run `create-design-draft` with a title such as `Izin — Current UI` and a prompt to faithfully reproduce the current `/dashboard/izin` page from its context files.

Expected: the command returns a `canvas:` URL and `preview:` URL. Open the reported canvas rather than constructing a URL manually.

- [ ] **Step 6: Branch the mobile iOS redesign**

Run `iterate-design-draft --mode branch` against the current-UI draft with this design direction:

```text
At widths below 780px, redesign this izin page as a platform-native iOS-style screen: full-width light system background, compact Izin header, inset segmented control, grouped form sections, 44px minimum controls, subtle system-blue notice, full-width sticky submit action with safe-area padding, and an iOS settings-style expandable history list with compact filters and previous/next pagination. Preserve the current desktop design at 780px and above. Do not add fields or change behavior.
```

Expected: a mobile redesign draft is visible on the returned canvas and matches the approved design specification.

- [ ] **Step 7: Record the visual checkpoint**

Share the returned canvas link with the user. Use the draft as a visual reference for Tasks 2–4; do not copy generated application logic from the draft.

### Task 2: Implement the Responsive Page Shell

**Files:**
- Modify: `src/app/dashboard/izin/page.js`

**Interfaces:**
- Consumes: existing `Tabs`, `PengajuanIzinForm`, and `DaftarIzin`.
- Produces: the same default `IzinPage` component and unchanged tab values, `pengajuan` and `daftar`.

- [ ] **Step 1: Capture the desktop baseline**

Run the application and save or inspect the route at a viewport of at least `1280px`. Confirm the current gradient shell, card, blue header, and desktop tabs before editing.

- [ ] **Step 2: Remove unused imports without changing behavior**

Keep only imports used by the page shell: `motion`, the required card primitives, `Tabs` primitives, and the two route components. Remove imports already unused by the current file.

- [ ] **Step 3: Add the mobile-only screen shell**

Restructure the JSX so mobile receives:

```jsx
<div className="min-h-[80vh] bg-[#f2f2f7] pb-6 min-[780px]:bg-gradient-to-br min-[780px]:from-blue-50 min-[780px]:to-indigo-50">
	<header className="px-5 pb-3 pt-4 min-[780px]:hidden">
		<p className="text-[13px] font-medium text-[#6e6e73]">Administrasi pegawai</p>
		<h1 className="mt-0.5 text-[28px] font-bold tracking-tight text-[#1c1c1e]">Izin</h1>
	</header>
	{/* Existing desktop card remains active from 780px upward. */}
</div>
```

Use mobile `rounded-none border-0 bg-transparent shadow-none` overrides and restore the existing card treatment with `min-[780px]:` classes.

- [ ] **Step 4: Style tabs as an iOS segmented control on mobile**

Keep the existing tab values and content. Make `TabsList` a `36px` inset gray pill on mobile, with each trigger sharing the width and the active trigger using a white surface and restrained shadow. Restore the existing desktop list alignment and spacing at `780px`.

- [ ] **Step 5: Verify the boundary**

Inspect at `779px` and `780px`.

Expected:

- `779px`: compact mobile header, neutral full-width shell, segmented control, no blue desktop card header.
- `780px`: existing blue gradient card header titled `Pengajuan Izin`, desktop card surface, and desktop tab layout.

- [ ] **Step 6: Commit the shell**

```bash
git add src/app/dashboard/izin/page.js
git commit -m "feat: add mobile izin app shell"
```

### Task 3: Implement the Grouped Mobile Submission Form

**Files:**
- Modify: `src/app/dashboard/izin/components/PengajuanIzinForm.js`

**Interfaces:**
- Consumes: existing `DatePicker`, `Select`, `Textarea`, `PegawaiCombobox`, `Button`, form state, and event handlers.
- Produces: the same default `PengajuanIzinForm` component; POST payload remains `{ tanggal_awal, tanggal_akhir, urgensi, kepentingan, nik_pj }`.

- [ ] **Step 1: Preserve a behavior checklist**

Before editing, confirm the form still has exactly five required user inputs, the existing date-order validation, the `Dinas Dalam Kota` notice, and the same POST payload.

- [ ] **Step 2: Group the fields without changing handlers**

Wrap the existing fields into three semantic route-local sections:

```jsx
<section aria-labelledby="periode-title">
	<h2 id="periode-title">Periode</h2>
	{/* tanggal_awal and tanggal_akhir */}
</section>
<section aria-labelledby="detail-title">
	<h2 id="detail-title">Detail Izin</h2>
	{/* urgensi and kepentingan */}
</section>
<section aria-labelledby="handover-title">
	<h2 id="handover-title">Serah Terima</h2>
	{/* nik_pj */}
</section>
```

On mobile, headings use small uppercase or secondary system text and each section body uses an inset white surface with `rounded-2xl`, thin dividers where appropriate, and no heavy shadow. At `780px`, make section wrappers visually transparent so the existing two-column desktop grid remains.

- [ ] **Step 3: Apply mobile control sizing and typography**

Give interactive triggers and text inputs a minimum height of `44px` on mobile while retaining current desktop sizing. Keep labels explicit, errors directly beneath their field, and purpose text readable at `16px` to avoid mobile browser zoom.

- [ ] **Step 4: Restyle the conditional notice**

Keep the condition `form.urgensi === "Dinas Dalam Kota"` and the exact informational meaning. Present it as a light system-blue rounded notice with the `Info` icon and readable contrast.

- [ ] **Step 5: Add the mobile sticky submit area**

Wrap the existing submit button in:

```jsx
<div className="sticky bottom-0 z-10 -mx-4 border-t border-black/5 bg-[#f2f2f7]/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl min-[780px]:static min-[780px]:mx-0 min-[780px]:border-0 min-[780px]:bg-transparent min-[780px]:p-0 min-[780px]:backdrop-blur-none">
	{/* Existing submit button and loading content */}
</div>
```

Use a full-width `min-h-[50px]` system-blue button on mobile. Remove mobile hover-scale behavior and restore the existing desktop width/alignment from `780px`.

- [ ] **Step 6: Verify form behavior**

At `390px`, verify:

- empty submit shows all required errors;
- a past start date remains invalid;
- an end date before the start date remains invalid;
- selecting `Dinas Dalam Kota` reveals the notice;
- the sticky action does not cover the final field;
- loading content remains visible during submit.

At `780px`, confirm the existing two-column desktop form and right-aligned action remain.

- [ ] **Step 7: Commit the form**

```bash
git add src/app/dashboard/izin/components/PengajuanIzinForm.js
git commit -m "feat: group izin form for mobile"
```

### Task 4: Implement the iOS-Style Mobile History

**Files:**
- Modify: `src/app/dashboard/izin/components/DaftarIzin.js`

**Interfaces:**
- Consumes: existing izin records, `fetchIzin(filters, page)`, `handlePageChange(page)`, `clearFilters()`, and `showDeleteDialog(noPengajuan)`.
- Produces: unchanged desktop table and delete dialog; mobile `IzinCard` rows and mobile/desktop pagination presentations.

- [ ] **Step 1: Separate mobile and desktop pagination presentation**

Keep the existing numbered pagination for `min-[780px]`. Add a mobile presentation that consumes the same props:

```jsx
const MobilePagination = ({ currentPage, totalPages, onPageChange }) => (
	<nav aria-label="Navigasi halaman izin" className="flex items-center justify-between">
		<Button aria-label="Halaman sebelumnya" disabled={currentPage === 1}>
			<ChevronLeft />
		</Button>
		<span>Halaman {currentPage} dari {totalPages}</span>
		<Button aria-label="Halaman berikutnya" disabled={currentPage === totalPages}>
			<ChevronRight />
		</Button>
	</nav>
);
```

Both buttons must call `onPageChange(currentPage ± 1)` and have a `44px` minimum touch target.

- [ ] **Step 2: Restyle `IzinCard` as an inset disclosure row**

Keep the current Radix accordion behavior and delete restriction. The closed row must show:

- `item.no_pengajuan`;
- formatted submission or period date;
- `getStatusBadge(item.status)`;
- the accordion’s disclosure affordance.

The expanded content retains period, `item.jumlah`, urgency, purpose, responsible employee, status, and conditional delete action. Use subtle separators and an inset white surface rather than standalone bordered cards.

- [ ] **Step 3: Replace the mobile breakpoint classes**

Change route-local `md:hidden` and `hidden md:block` visibility classes to exact `780px` variants:

```text
Mobile: min-[780px]:hidden
Desktop: hidden min-[780px]:block
```

Do this for filters, list/table, and pagination so `768–779px` correctly receives the mobile presentation.

- [ ] **Step 4: Restyle mobile filters**

Keep the existing collapsible filter interaction and `DatePicker` values. Use an inset grouped panel, a `44px` filter trigger, and show the clear action only when `filterDate.start || filterDate.end` is truthy. Desktop filters remain structurally and visually unchanged from `780px`.

- [ ] **Step 5: Improve supporting states on mobile**

Keep the same `loading` and `izin.length === 0` branches. Present loading within a compact inset surface. Present empty state with `FileText`, `Belum ada pengajuan izin`, and a short secondary explanation. Do not change the desktop table states.

- [ ] **Step 6: Verify history interactions**

Using populated, empty, and loading responses, verify:

- rows expand and collapse;
- all approved and non-approved statuses include readable text;
- delete appears only when `item.status !== "Disetujui"`;
- filter values issue the same API query parameters;
- reset clears both filter values;
- previous/next buttons stop at page boundaries;
- the desktop numbered pagination and table reappear at `780px`.

- [ ] **Step 7: Commit the history**

```bash
git add src/app/dashboard/izin/components/DaftarIzin.js
git commit -m "feat: redesign mobile izin history"
```

### Task 5: Final Responsive and Regression Verification

**Files:**
- Verify: `src/app/dashboard/izin/page.js`
- Verify: `src/app/dashboard/izin/components/PengajuanIzinForm.js`
- Verify: `src/app/dashboard/izin/components/DaftarIzin.js`

**Interfaces:**
- Consumes: completed Tasks 1–4.
- Produces: a verified responsive redesign with no API or desktop regression.

- [ ] **Step 1: Run static checks**

Run:

```bash
npm run lint
```

If the repository’s existing `next lint` script is unsupported by Next.js 15, record that exact failure and run:

```bash
npx eslint src/app/dashboard/izin/page.js src/app/dashboard/izin/components/PengajuanIzinForm.js src/app/dashboard/izin/components/DaftarIzin.js
```

Expected: no new errors in touched files.

- [ ] **Step 2: Run the production build**

Run:

```bash
npm run build
```

Expected: build succeeds. If unrelated pre-existing failures occur, record them with file and error output and still complete the route-focused browser checks.

- [ ] **Step 3: Inspect exact responsive widths**

Run the app and inspect `/dashboard/izin` at:

- `390px`;
- `779px`;
- `780px`;
- `1280px`.

Expected: the iOS presentation is active only at the first two widths; the original desktop presentation is active at the last two.

- [ ] **Step 4: Check accessibility basics**

Keyboard through the segmented control, form controls, history disclosures, pagination, and delete dialog. Confirm visible focus, meaningful button labels, readable status text, and no touch target below `44px` on mobile.

- [ ] **Step 5: Review the diff for scope**

Run:

```bash
git diff --check
git diff -- src/app/dashboard/izin/page.js src/app/dashboard/izin/components/PengajuanIzinForm.js src/app/dashboard/izin/components/DaftarIzin.js
```

Expected: no whitespace errors, API payload changes, validation changes, or unrelated refactors.

- [ ] **Step 6: Commit any verification-only fixes**

```bash
git add src/app/dashboard/izin/page.js src/app/dashboard/izin/components/PengajuanIzinForm.js src/app/dashboard/izin/components/DaftarIzin.js
git commit -m "fix: polish izin responsive boundary"
```

Skip this commit when verification required no code changes.
