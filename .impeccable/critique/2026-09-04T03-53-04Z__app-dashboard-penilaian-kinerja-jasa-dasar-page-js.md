---
target: /dashboard/penilaian-kinerja/jasa-dasar
total_score: 39
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
timestamp: 2026-09-04T03-53-04Z
slug: app-dashboard-penilaian-kinerja-jasa-dasar-page-js
---
# Assessment A: Design Review (Revision 4)

**Target:** `src/app/dashboard/penilaian-kinerja/jasa-dasar/page.js`  
**Workspace:** `/Users/hardiko/Documents/Developer/NEXT/sdm`  
**Review Mode:** Impeccable Critique — Revision 4 (Unanchored, no detector output read)

---

## 1. Design Specificity Verdict

**Verdict: Highly Grounded (RS Bhayangkara Nganjuk SDM Handal)**

Design strictly follows `DESIGN.md` and `PRODUCT.md`. Not generic template or unstyled SaaS admin.
- Color palette respects "Clinical Signal Rule": quiet slate surfaces (`bg-slate-50`, `border-slate-200`), crisp cyan/sky accents (`bg-sky-600`, `text-sky-700`, `bg-sky-50`), zero purple/ai-slop gradients.
- Typography strictly follows hierarchy: Figtree for display headings, modal titles, and tracked uppercase table headers; Noto Sans for dense tabular figures and explanatory text.
- Hospital domain grounding evident: employee records identified by dual NIK + Department metadata; Excel template generator pre-populates hospital employee rosters sorted alphabetically within unit/departemen; compensation validity windows (`berlaku_mulai` / `berlaku_sampai`) reflect hospital payroll cycles.

---

## 2. Nielsen 10 Heuristics Score Table

| # | Heuristic | Score (0-4) | Key Issue / Observation |
|---|---|:---:|---|
| 1 | Visibility of System Status | 4.0 | Dynamic count badges on tabs (`Semua`, `Aktif`, `Kedaluwarsa`), pagination range indicator, live Rupiah badge (`aria-live="polite"`), modal spinners. |
| 2 | Match Between System & Real World | 4.0 | Indonesian clinical HR conventions: NIK, Unit Kerja, Nominal Jasa Dasar in `id-ID` currency, Excel template structure matches hospital payroll workflow. |
| 3 | User Control & Freedom | 4.0 | Escape key dismiss, backdrop click dismiss, modal cancel buttons, confirmation modal for single & bulk deletes, paginated select-all toggle. |
| 4 | Consistency & Standards | 4.0 | Standardized border radii (`rounded-xl` / `rounded-2xl`), unified Lucide icons, consistent modal headers, predictable table controls. |
| 5 | Error Prevention | 3.5 | Real-time date constraint (`min={berlakuMulai}` on `berlakuSampai`), JS validation, delete confirmation. Nominal input missing HTML `min="0"`. |
| 6 | Recognition Rather Than Recall | 4.0 | Live formatted Rupiah badge prevents zero-counting errors; SearchableSelect displays NIK + department sublabel; filename retained in import modal. |
| 7 | Flexibility & Efficiency of Use | 4.0 | Bulk Excel export/import with prefilled roster; bulk deletion; status filter tabs + unit filter + instant search; page size selector (10-100). |
| 8 | Aesthetic & Minimalist Design | 4.0 | High signal-to-noise ratio. High-contrast tabular numbers (`tabular-nums font-bold text-slate-900`), restrained borders, no decorative clutter. |
| 9 | Help Users Recognize & Recover from Errors | 4.0 | In-modal import error retention with scrollable row-by-row breakdown (`Baris X: NIK ... tidak ditemukan`) without losing modal state. |
| 10 | Help & Documentation | 3.5 | Clear subtitle and in-modal validity guidelines. Lacks contextual tooltip explaining how Jasa Dasar links to final performance remuneration formula. |

**Total Score:** **39.0 / 40.0**  
**Rating Band:** **Excellent (36 - 40)**

---

## 3. Cognitive Load Evaluation

**Checklist Failures Count: 1 (Minor)**

### Checklist Breakdown:
1. *Working Memory (7±2 items)*: **PASS**. Form separated into 4 distinct groups (Employee, Nominal, Dates, Notes).
2. *Choice Overload (Hick's Law - max 4 visible choices per decision point)*: **PASS**.
   - Header actions: 3 standard buttons (Download, Import, Add) + 1 conditional bulk action.
   - Status tabs: 3 options (Semua, Aktif, Kedaluwarsa).
   - Pagination page size: 4 options (10, 25, 50, 100).
   - Row actions: 2 icons (Edit, Delete).
3. *Visual Hierarchy & Anchoring*: **PASS**. Strong anchor on employee name with muted subtext for NIK/department; right-aligned tabular nominals.
4. *Signal Conflict*: **PASS**. Clear separation between page toasts and modal error banners.
5. *Recognition vs Recall*: **PASS**. Search placeholder describes search fields; live badge confirms nominal.
6. *Input Friction*: **FAIL (Minor)**. Raw nominal input displays unformatted digits (`3000000`) without currency masking in the input box itself, relying solely on badge above. Missing `min="0"`.
7. *Error Recovery Cost*: **PASS**. Excel errors stay visible in modal with exact line citations; users don't restart upload flow blindly.
8. *State Visibility*: **PASS**. Paginated slice indicator ("Menampilkan 1 - 25 dari 84 data") keeps position clear.

---

## 4. Emotional Journey Analysis

- **Entry & Scan**: User enters page. Instant reassurance from dynamic status badges (`Semua 84`, `Aktif 78`, `Kedaluwarsa 6`). Hospital admin instantly grasps workload.
- **Search & Filter**: Zero latency. Typing filters immediately across NIK, name, and unit. Clear feedback when no data matches.
- **High-Stakes Moments (Import & Bulk Delete)**:
  - *Bulk Delete*: Danger mitigated by explicit modal stating exact count ("Hapus 5 konfigurasi jasa dasar terpilih?").
  - *Excel Import*: Previously an emotional valley (silent failures or abrupt modal close). Now a reassuring peak: file badge shows selected file, validation failure keeps modal open with scrollable list of invalid rows.
- **Peak-End Rule**: Completion of tasks (saving, importing, deleting) triggers clean emerald confirmation toasts with quick dismiss. Admin leaves with verified state.

---

## 5. What's Working

1. **In-Modal Import Error Retention & File Awareness**:
   Retains user in import modal on error, lists exact Excel row numbers and specific failure reasons, and displays file name badge (`File: Template_Jasa_Dasar_Pegawai.xlsx`). Eliminates trial-and-error guessing.
2. **Accessible Multi-Sensory Data Entry**:
   Modal combines live Rupiah preview with `aria-live="polite"` badge, Tab focus trapping (`Shift+Tab` / `Tab` cycling), and Escape key dismiss. High accessibility compliance for screen readers and keyboard users.
3. **Clinical Operational IA with Status Tabs & Table Pagination**:
   Status filter tabs with live counters allow one-click audit of expired compensation records. Client-side pagination (10/25/50/100) prevents DOM bloat and preserves UI responsiveness for large hospital rosters.

---

## 6. Priority Issues

- **P0 / P1**: **None**. Zero critical bugs or severe accessibility blockers found.
- **P2**:
  - **Issue**: Nominal input missing `min="0"` attribute in form modal.  
    *Why*: User could enter negative numbers directly via keyboard.  
    *Fix*: Add `min="0"` and `step="1000"` to `<input id="form-nominal" type="number" ... />`.  
    *Suggested Command*: `$impeccable polish-inputs`
  - **Issue**: Bulk action button unanchored on mobile/long scroll.  
    *Why*: When selecting items on 50/100 row pages, bulk delete button in top header scrolls out of viewport.  
    *Fix*: Implement floating or sticky selection bar when `selectedIds.length > 0`.  
    *Suggested Command*: `$impeccable harden-tables`
- **P3**:
  - **Issue**: Import error list lacks "Salin Error" button.  
    *Why*: If 15 rows fail in Excel, hospital admin must manually transcribe error rows rather than pasting to clipboard.  
    *Fix*: Add small "Salin Rincian Error" button inside `importErrorList` container.  
    *Suggested Command*: `$impeccable refine-workflow`
  - **Issue**: Generic empty state when filter returns 0 rows.  
    *Why*: Message "Tidak ada konfigurasi jasa dasar ditemukan" does not distinguish between empty database vs strict search filter.  
    *Fix*: Add "Reset Filter" button when `filteredList.length === 0 && jasaList.length > 0`.  
    *Suggested Command*: `$impeccable clarify-states`

---

## 7. Persona Red Flags

- **Alex (Fast Operator / Power Admin)**:
  - *Red Flag*: No keyboard hotkey (e.g. `Cmd+K` or `Alt+N`) to trigger quick add modal or jump to search bar. High-frequency operators must reach for mouse.
- **Jordan (Detail-Oriented Auditor / Compliance)**:
  - *Red Flag*: Lacks audit metadata in table (created date, updated by). Jordan cannot see when nominal was last altered or by which admin.
- **Sam (Casual / Novice Department Supervisor)**:
  - *Red Flag*: Unclear distinction between "Jasa Dasar" and "Jasa Pelayanan" without contextual info tooltip or help link.
- **Siti (RS Bhayangkara Nganjuk Payroll Staff)**:
  - *Red Flag*: Re-importing existing NIK in Excel doesn't clarify whether it will overwrite existing active record or append new historical row. Reassurance text needed in import modal.

---

## 8. Minor Observations

- Checkbox "Select All" on table header correctly bounds selection to current page (`paginatedList`), avoiding accidental off-screen deletions.
- Status pill colors (`Aktif` emerald vs `Kedaluwarsa` rose) strictly maintain WCAG AA contrast against slate table rows.
- Table header uses `sticky top-0 z-10 bg-slate-50/95 backdrop-blur-xs`, ensuring column names remain visible during table scrolling.

---

## 9. Provocative Questions to Consider

1. *Should Jasa Dasar support an Import Preview Diff Table (showing old vs new nominal before applying changes to database)?*
2. *When an employee transfers between clinical units in RS Bhayangkara Nganjuk, should existing Jasa Dasar auto-expire or prompt for departmental re-approval?*
3. *Would an automated alert tab for "Kedaluwarsa Bulan Ini" (expiring this month) proactively prevent payroll calculation discrepancies?*
