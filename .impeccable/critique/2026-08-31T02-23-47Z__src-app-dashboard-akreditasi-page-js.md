---
target: src/app/dashboard/akreditasi/page.js
total_score: 32
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
timestamp: 2026-08-31T02-23-47Z
slug: src-app-dashboard-akreditasi-page-js
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|:-----:|-----------|
| 1 | Visibility of System Status | 4 | Real-time ARIA progress bar, dynamic page counter badge, polite loading status. |
| 2 | Match System / Real World | 4 | Domain-grounded hospital accreditation terminology ("STARKES Berlaku", "RS Bhayangkara Nganjuk"). |
| 3 | User Control and Freedom | 3 | Full PDF sidebar navigation restored; lacks top-level quick-jump Pokja chips. |
| 4 | Consistency and Standards | 4 | Strictly compliant with SDM Handal clinical cyan/slate tokens and card radii. |
| 5 | Error Prevention | 4 | Isolated client worker rendering with accessible fallback download link. |
| 6 | Recognition Rather Than Recall | 3 | Page count and badge visible; reading progress not persisted across page refreshes. |
| 7 | Flexibility and Efficiency | 3 | In-viewer search, outline, and thumbnails available; lacks external Pokja chapter filters. |
| 8 | Aesthetic and Minimalist Design | 3 | Clean clinical layout; minor chrome redundancy between card header download button and viewer toolbar. |
| 9 | Error Recovery | 4 | Clear error modal with retry button and fallback file download link. |
| 10 | Help and Documentation | 3 | Contextual metadata provided; no brief usage guide for STARKES navigation. |
| **Total** | | **32/40** | **Good (80%)** |

## Design Specificity Verdict

**LLM Assessment:** High domain grounding. Explicitly authored for RS Bhayangkara Nganjuk clinical operations. Header anchors hospital context with official document naming ("Buku Standar Akreditasi Rumah Sakit"), verified status badge ("STARKES Berlaku"), and dynamic reading progress metadata. Fully adheres to `DESIGN.md` clinical cyan/slate palette (`#0284C7`, `#0EA5E9`, `#F8FAFC`, `#E2E8F0`).

**Deterministic Scan:** Automated detector returned 0 violations (`[]`) across both `page.js` and `PDFViewerComponent.jsx`. Exit code 0 (clean pass).

**Visual Overlays:** Deterministic regex and AST scan verified. Browser live overlay skipped in headless CI subagent environment.

## Overall Impression
Massive improvement. The interface transformed from a broken pink template into an authoritative, accessible, and structured hospital compliance reader aligned with RS Bhayangkara Nganjuk standards.

## What's Working
1. **Clinical Brand Grounding:** Official accreditation badge ("STARKES Berlaku") and crisp cyan/slate palette establish immediate medical credibility.
2. **Accessible Status Architecture:** Thorough ARIA attributes (`role="progressbar"`, `aria-live="polite"`, `role="alert"`, `.sr-only` descriptions) maintain high accessibility standards.
3. **Resilient Recovery:** Error state provides non-destructive in-place retry and fallback direct download without crashing client session.

## Priority Issues

### [P2] Redundant Download Action & Double Chrome
- **Why it matters:** Custom CardHeader features an "Unduh PDF" button while `@react-pdf-viewer`'s default toolbar also renders an internal download button and secondary toolbar chrome.
- **Fix:** Streamline toolbar configuration or keep both if redundant download affords convenience.
- **Suggested command:** `$impeccable polish`

### [P2] Session Reading Position Reset on Refresh
- **Why it matters:** STARKES accreditation handbook spans hundreds of pages. Refreshing browser or switching tabs resets viewer to page 1.
- **Fix:** Persist `currentPage` in `localStorage` (`sdm_akreditasi_last_page`) and offer resume reading state.
- **Suggested command:** `$impeccable harden`

### [P3] Mobile Floating Badge Viewport Offset
- **Why it matters:** On small mobile screens (`fixed sm:absolute bottom-4 right-4`), floating badge can sit near bottom navigation bar.
- **Fix:** Adjust bottom margin on mobile viewports (`bottom-16 sm:bottom-4`).
- **Suggested command:** `$impeccable adapt`

## Persona Red Flags

- **Dr. Alex (Pokja Head / Auditor):** Excellent navigation via PDF sidebar outline/search. Would benefit from 1-click top-level Pokja chapter jump chips.
- **Jordan (First-Timer Nurse):** Clean layout and STARKES badge give confidence document is official and up-to-date.
- **Sam (Accessibility User):** Progress bar, loading spinners, and error alerts are fully announced by screen readers.

## Minor Observations
1. `PDF_DOCUMENT_PATH` and `PDF_DOWNLOAD_NAME` constants are clean and well-factored.
2. `SpecialZoomLevel.PageWidth` provides optimal initial scale on desktop and mobile.

## Questions to Consider
- Should we persist the user's last read page in localStorage to auto-resume on revisit?
- Would top-level shortcut chips for major Pokja chapters (TKRS, KPS, PPI, PMKP) speed up audit navigation?
