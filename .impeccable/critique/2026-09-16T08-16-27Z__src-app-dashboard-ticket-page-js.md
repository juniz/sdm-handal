---
target: /dashboard/ticket
total_score: 29
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
timestamp: 2026-09-16T08-16-27Z
slug: src-app-dashboard-ticket-page-js
---
Method: dual-agent (A: c0945331-5e14-4799-b642-179f8f747b0d · B: 7713a2c3-5eba-4f0e-aaac-8ced227b27da)

### Design Health Score

| # | Heuristic | Score | Key Status |
|---|-----------|:-----:|------------|
| 1 | Visibility of System Status | 3/4 | Spinners and lifecycle badges clear; collapsed filter lacks active filter count badge |
| 2 | Match Between System and Real World | 3/4 | Indonesian phrasing used; minor lexicon oscillation (Ticket vs Pelaporan vs Tiket) |
| 3 | User Control and Freedom | 3/4 | Form reset and modal cancel present; `CloseTicketModal` lacks Escape and backdrop dismissal |
| 4 | Consistency and Standards | 2/4 | Secondary components (`CloseTicketModal`, `EmptyState`, `Pagination`) use legacy `gray-*` tokens |
| 5 | Error Prevention | 3/4 | Client-side field validation in place; search unthrottled and delete prompt is generic |
| 6 | Recognition Rather Than Recall | 3/4 | Complete card metadata visible; collapsed filter hides query parameters |
| 7 | Flexibility and Efficiency | 3/4 | One-tap personal ticket toggle accelerates self-service; lacks quick filter chips on canvas |
| 8 | Aesthetic and Minimalist Design | 3/4 | Card grid breathable; top-right card header crams 4 action buttons |
| 9 | Help Users Recognize, Diagnose, and Recover from Errors | 3/4 | Inline red helper copy under invalid inputs; toast error does not auto-focus first input |
| 10 | Help and Documentation | 2/4 | Helpful input placeholders; missing SLA guidelines and emergency IT escalation hotline |
| **Total** | | **29/40** | **Good (Production-Ready with Minor Polish)** |

---

### What's Working
1. **Contextual Hospital Microcopy**: Realistic placeholders (`"Contoh: Printer resep SIMRS IGD macet"`) bridge software with hospital operational reality.
2. **Clinical Severity Taxonomy**: Bold rose `Kritis` priority badge and explicit `Siap Ditutup` badge facilitate fast visual scanning.
3. **Structured Accountable Metadata**: Cards group department, reporter, category, submission timestamp, and discussion count clearly.

---

### Priority Issues

#### [P1] Secondary Component Token Drift & Close Modal Escape Trap
- **What**: `CloseTicketModal.js`, `EmptyState.js`, and `Pagination.js` use legacy `gray-*` and `green-600` classes instead of `DESIGN.md` slate/cyan tokens. `CloseTicketModal` lacks Escape key dismissal and backdrop click-to-close.
- **Why it matters**: Violates visual consistency across modal flows and traps keyboard users.
- **Fix**: Refactor secondary components to `DESIGN.md` slate/sky tokens; add Escape key listener and backdrop click to `CloseTicketModal.js`.
- **Suggested command**: `$impeccable polish`

#### [P1] Collapsed Filter Blindness
- **What**: When `FilterAccordion.js` is collapsed, there is no indicator showing how many filters or search terms are active.
- **Why it matters**: Users collapse filter and assume tickets are missing due to system error.
- **Fix**: Display active filter count badge on accordion trigger button (e.g. "Filter & Pencarian (2 aktif)") and render active filter chips.
- **Suggested command**: `$impeccable clarify`

#### [P2] Card Header Action Clutter & Raw SVG Icon
- **What**: `TicketCard.js` renders 4 action buttons side-by-side; Detail button uses raw inline SVG `<svg>` instead of Lucide `Eye`.
- **Why it matters**: Cognitive noise and touch mis-clicks during mobile rounds.
- **Fix**: Replace inline SVG with Lucide `Eye`; balance action button weights.
- **Suggested command**: `$impeccable distill`

#### [P2] Missing Emergency Escalation Contact
- **What**: Page provides no direct phone extension for life-critical clinical emergencies (UGD/ICU downtime).
- **Why it matters**: Clinical staff need immediate escalation channel when patient safety is at stake.
- **Fix**: Add emergency IT helpline badge in page header (*"Kendala darurat IGD/ICU? Hubungi Tim IT Siaga: Ext. 118"*).
- **Suggested command**: `$impeccable adapt`
