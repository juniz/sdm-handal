---
target: pengajuan kta
total_score: 19
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 1
timestamp: 2026-09-01T02-53-00Z
slug: src-app-dashboard-pengajuan-kta-page-js
---
Method: dual-agent (A: ea1c0229-d917-48cd-ba07-60536bb424c9 · B: 7c0162a5-826c-4504-be3c-8cbb5e6e3224)

### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2/4 | Full-screen blocking spinner; status badges do not show workflow progression (printed/pickup). |
| 2 | Match System / Real World | 2/4 | Treats KTA as generic database ticket without physical card preview, photo check, or pickup SLA. |
| 3 | User Control and Freedom | 3/4 | Deletion allowed for pending status; dialogs dismissable; filter reset present. |
| 4 | Consistency and Standards | 1/4 | Table header conditionally renders column on modal state causing DOM misalignment; grid 15/12 overflow; bypasses design tokens. |
| 5 | Error Prevention | 2/4 | Copy specifies min 10 chars for reason but validation accepts any text; delete confirmation modal prevents accidental deletion. |
| 6 | Recognition Rather Than Recall | 2/4 | Ambiguity between status terms ('disetujui' vs 'proses'); no visual indicator of previous active KTA. |
| 7 | Flexibility and Efficiency | 2/4 | No Enter-key submit on search; no batch processing for HRD admins; no table pagination/sorting. |
| 8 | Aesthetic and Minimalist Design | 2/4 | Grid overflow wraps buttons awkwardly; ad-hoc Tailwind colors dilute hospital brand identity. |
| 9 | Error Recovery | 2/4 | Generic error toasts without actionable guidance; form resets error feedback on dismissal. |
| 10 | Help and Documentation | 1/4 | No guidance on photo requirements, pickup location, or lost card police report attachment. |
| **Total** | | **19/40** | **Poor (Major UX overhaul required)** |

### Design Specificity Verdict

**LLM assessment**: The page is a generic CRUD boilerplate that does not reflect RS Bhayangkara Nganjuk's hospital identity or the physical reality of a staff ID card (KTA). It lacks credential mockups, photo verification, batch processing for HRD printing, and lost-badge security workflows.

**Deterministic scan**: Automated scan ran cleanly (0 anti-pattern violations in `detect.mjs`). Primitives follow standard Tailwind/Shadcn markup structure, but qualitative design tokens, grid math, and domain workflows require architectural refinement.

**Visual overlays**: Skipped (static file analysis; dev server not attached).

### Overall Impression
Functional administrative interface that works for raw data entry, but suffers from severe table layout bugs, broken grid layout math, generic styling disconnected from SDM Handal clinical design tokens, and lack of hospital KTA domain lifecycle awareness.

### What's Working
1. **Responsive View Forking**: Implements dedicated desktop table and mobile card layouts for device adaptability.
2. **Destructive Action Safeguards**: Includes confirmation dialog with visual warning for pending request deletion.
3. **Role-Based Data Partitioning**: Appropriately toggles employee identity columns (NIK, Nama, Jabatan) and editing controls for HRD/IT roles.

### Priority Issues

- **[P0] Table Header Column Mismatch & Layout Rupture**
  - **Why it matters**: Line 548 conditionally renders `<TableHead>Alasan Ditolak</TableHead>` based on `selectedPengajuan?.alasan_ditolak` (modal selection state) instead of row data, causing header and body columns to misalign dynamically.
  - **Fix**: Make table columns static with a dedicated notes/rejection column or keep rejection details strictly inside the Detail modal.
  - **Suggested command**: `$impeccable layout`

- **[P1] Design System Token Violation & Semantic Badge Inconsistency**
  - **Why it matters**: Direct use of hardcoded Tailwind blues (`bg-blue-600`, `text-blue-600`) and identical default badges for 'disetujui', 'proses', and 'selesai' dilutes the SDM Handal clinical cyan palette and weakens status visibility.
  - **Fix**: Apply design tokens (`#0284C7` Brand Cyan, `#E0F2FE` Primary Sky) and create distinct semantic status chips for all 5 lifecycle states.
  - **Suggested command**: `$impeccable colorize`

- **[P2] Filter Grid Column Overflow (15/12 cols)**
  - **Why it matters**: Grid spans sum to 15 (`col-span-5 + col-span-3 + col-span-3 + col-span-4`) inside a 12-column grid, causing the action buttons to break onto a new row with misaligned height.
  - **Fix**: Adjust spans to 4 + 3 + 2 + 3 = 12 columns.
  - **Suggested command**: `$impeccable layout`

- **[P3] Missing Physical KTA Domain Lifecycle & Workflow Stepper**
  - **Why it matters**: Hospital staff have no visibility into card printing progress, pickup location, or lost card document prerequisites.
  - **Fix**: Introduce a visual KTA status pipeline (Diajukan -> Disetujui -> Dicetak -> Siap Diambil) and inline validation.
  - **Suggested command**: `$impeccable shape`

### Persona Red Flags

- **Jordan (First-Timer Staff)**: Unclear whether photo is required or auto-fetched from HR database; receives generic toast without estimated completion time or pickup desk details.
- **Alex (HRD Power User)**: Forced to edit requests one-by-one via modal dialogs; no batch approval or export queue for card printer; broken filter grid layout.
- **Casey (Mobile Staff)**: Mobile card view stacks long metadata blocks linearly without quick action gestures or bottom sheet drawer for details.

### Minor Observations
- Full-screen blocking spinner on initial data load destroys page context; table skeleton is preferred.
- Search input does not trigger on Enter key (`onKeyDown`).
- Absence of client-side validation enforcing the stated "minimum 10 characters" for the reason textarea.
- Missing empty-state call-to-action button when search filters return 0 records.

### Questions to Consider
- Should KTA requests display a live visual badge preview with the employee's photo pulled from Master Pegawai?
- Would a dedicated "Antrean Cetak KTA" batch processing view improve HRD operational throughput?
- For lost badges ("Hilang"), should the system require attaching a Surat Keterangan Kehilangan?
