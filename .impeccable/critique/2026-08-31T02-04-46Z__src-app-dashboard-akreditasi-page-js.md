---
target: src/app/dashboard/akreditasi/page.js
total_score: 15
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 1
timestamp: 2026-08-31T02-04-46Z
slug: src-app-dashboard-akreditasi-page-js
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Progress bar lacks ARIA states; double loading spinner flash; no byte/percentage fetch indicator. |
| 2 | Match System / Real World | 2 | Generic PDF container without hospital accreditation structure (Pokja/Bab/Standar/EP). |
| 3 | User Control and Freedom | 1 | `sidebarTabs` stripped in PDFViewer; no page jump input, no table of contents, no search. |
| 4 | Consistency and Standards | 1 | Direct violation of `DESIGN.md` color tokens and explicit gradient prohibition. |
| 5 | Error Prevention | 2 | Hardcoded `/documents/akreditasi.pdf` without file size label or missing-file fallback. |
| 6 | Recognition Rather Than Recall | 1 | Missing chapter navigation forces nurses to remember arbitrary page numbers. |
| 7 | Flexibility and Efficiency | 1 | No shortcuts, search, or Pokja quick-links for power users/surveyors. |
| 8 | Aesthetic and Minimalist Design | 2 | Gratuitous pink/rose AI-slop gradients cause visual noise; conflicts with clinical trust. |
| 9 | Error Recovery | 2 | Generic error message uses disruptive full `window.location.reload()`. |
| 10 | Help and Documentation | 1 | Zero metadata on accreditation edition (STARKES/KARS), year, or Pokja scope. |
| **Total** | | **15/40** | **Poor (37.5%)** |

## Design Specificity Verdict

**LLM Assessment:** Critical system non-compliance. Page uses heavy saturated pink/rose gradients (`from-rose-600 via-pink-600 to-rose-700`, `from-slate-50 via-rose-50/30 to-pink-50/40`), directly violating `DESIGN.md` (*"Don't introduce AI-slop purple, blue, or pink gradients"*). Visual language detached from RS Bhayangkara Nganjuk clinical cyan/slate identity (`#0284C7`, `#0EA5E9`, `#E0F2FE`, `#F8FAFC`). Lacks hospital accreditation metadata (STARKES/KARS edition, Pokja chapter structure, document validity).

**Deterministic Scan:** Automated detector flagged 2 warnings for `border-accent-on-rounded` on lines 17 and 122 (`border-b-2`). Both verified as false positives (standard Tailwind loading spinner animation). Static code inspection confirmed 5+ instances of rogue rose/pink gradient tokens and disabled PDF navigation (`sidebarTabs: () => []`).

**Visual Overlays:** Deterministic regex scan verified. Browser live overlay skipped in headless CI subagent environment.

## Overall Impression
Solid functional foundation (Next.js dynamic client-side PDF rendering works without SSR crashes), but ruined by inappropriate rogue pink aesthetic and stripped PDF navigation tabs that make multi-hundred-page accreditation books unusable.

## What's Working
1. **SSR Isolation:** Dynamic import (`ssr: false`) cleanly isolates canvas/PDF worker execution from Next.js server rendering.
2. **Direct Export Utility:** Functional "Unduh PDF" button provides immediate fallback to local file system.
3. **Progress Calculation:** Live page counter (`currentPage + 1 / totalPages`) provides reading tracking foundation.

## Priority Issues

### [P0] Brand Identity Violation & Rogue Color System
- **Why it matters:** Saturated rose/pink gradient violates `DESIGN.md`, clashes with platform-wide cyan theme, and degrades institutional clinical trust.
- **Fix:** Replace all rose/pink gradients and borders with canonical SDM Handal clinical cyan tokens (`#0284C7` brand cyan, `#0EA5E9` active cyan, `#F8FAFC` surface, `#E2E8F0` slate borders).
- **Suggested command:** `$impeccable colorize`

### [P1] Stripped PDF Navigation in Monolithic Document
- **Why it matters:** `sidebarTabs: () => []` removes table of contents, thumbnails, bookmarks, and search. Accreditation books exceed 100+ pages; staff cannot jump to specific Pokja standards (KPS, PPI, SKP).
- **Fix:** Enable default layout sidebar tabs or implement Pokja chapter quick-select dropdown and search toolbar.
- **Suggested command:** `$impeccable layout`

### [P2] Missing Accessibility Semantics & Interactive Page Jump
- **Why it matters:** Reading progress bar is unsemantic `div` without ARIA roles; floating page badge is `pointer-events-none`; loading spinners lack `role="status"`.
- **Fix:** Add `role="progressbar"` with `aria-valuenow`/`aria-valuemax`. Convert page badge into interactive keyboard jump input (`Go to page X`).
- **Suggested command:** `$impeccable harden`

### [P3] Lack of Clinical Accreditation Metadata
- **Why it matters:** Medical staff and surveyors cannot determine if handbook is current standard (STARKES 2024 vs KARS).
- **Fix:** Add structured metadata header chips (Standard version, Pokja scope, Publication date, Effective status).
- **Suggested command:** `$impeccable polish`

## Persona Red Flags

- **Dr. Alex (Pokja Head / Power User):** Needs standard KPS 8 during morning evaluation. Lacks search and Pokja index; forced to drag scrollbar through 200 pages. Abandons tool.
- **Jordan (First-Timer Nurse):** Accesses manual during onboarding. Pink gradient feels like unofficial template; doubts regulatory validity of document.
- **Sam (Accessibility / Keyboard User):** Screen reader cannot read unsemantic progress bar; unable to jump to specific page via keyboard.

## Minor Observations
1. **Dual Spinner Cascade:** Dynamic component loader spinner immediately followed by inner `isLoading` overlay spinner causes visible flicker.
2. **Destructive Error Reload:** PDF error fallback triggers full `window.location.reload()`, clearing user state.
3. **Duplicated Asset Path:** `/documents/akreditasi.pdf` hardcoded in both `page.js` and `PDFViewerComponent.jsx`.

## Questions to Consider
- What if page provided instant chapter jumps for all 16 hospital accreditation Pokjas (SKP, HPK, ARK, PAP, PAB, PKPO, MKE, PMKP, PPI, TKRS, MFK, KPS, MRMIK, PPK, PPN, PP)?
- What if viewer toolbar included keyword search and bookmarking for hospital audit preparation?
- What would clinical cyan palette aligned with RS Bhayangkara Nganjuk brand feel like?
