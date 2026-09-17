---
target: /dashboard/pegawai-manajemen
total_score: 17
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
timestamp: 2026-09-17T01-54-27Z
slug: src-app-dashboard-pegawai-manajemen-page-js
---
#### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|:-----:|-----------|
| 1 | Visibility of System Status | 2 | Form validation fails silently on hidden subtabs; toast errors provide no visual indicator of which tab contains the error. |
| 2 | Match System / Real World | 2 | Database column abbreviations leaked to UI (`jnj_jabatan`, `kode_kelompok`, `bpd`, `indexins`); monetary values lack standard Rupiah currency formatting. |
| 3 | User Control and Freedom | 2 | Tab navigation commented out in code, locking user in Data Pegawai; lacks batch actions and rollback mechanisms. |
| 4 | Consistency and Standards | 1 | Injects rogue external fonts (`Lexend`, `Source Sans 3`), hardcoded color `#0093dd`, and suffers desktop vs mobile table column mismatch. |
| 5 | Error Prevention | 1 | Zero input masking on 16-digit NIK/NPWP; deletion of remunerasi thresholds executes without impact simulation warnings. |
| 6 | Recognition Rather Than Recall | 2 | Calculation logic locked inside modal; users must memorize complex point weights across separate sections. |
| 7 | Flexibility and Efficiency | 1 | No keyboard accelerators, no bulk status updates, no bulk export. |
| 8 | Aesthetic and Minimalist Design | 2 | Competing visual noise from pastel glow blobs on KPI cards and 6 congested form modal tabs. |
| 9 | Error Recovery | 2 | Generic toast error message without auto-focusing or switching to the invalid input tab. |
| 10 | Help and Documentation | 2 | Remunerasi formula buried in auxiliary dialog; zero contextual tooltips for complex hospital index weights. |
| **Total** | | **17/40** | **Poor (<20)** |

#### Design Specificity Verdict

**Verdict: Severe Category-Interchangeable SaaS Admin with Broken Clinical Workflow.**

- **LLM Assessment**: The page abandons its specialized clinical operational identity for a generic SaaS boilerplate admin. Crucially, `page.js` has commented out the top navigation `TabsList` (lines 227–265), leaving 4 major hospital workforce modules (`Index Remunerasi`, `Evaluasi Pegawai`, `Pencapaian Pegawai`, and `Threshold`) rendered as unreachable dead code. An inline `<style>` tag bypasses `DESIGN.md` by injecting Google Fonts (`Lexend`, `Source Sans 3`) and rogue hex color `#0093dd`, conflicting with canonical `Figtree` / `Noto Sans` and Brand Cyan (`#0284C7`). Furthermore, medical credentialing (STR/SIP expiration, clinical privilege tiers, duty shifts) is flattened into 30+ unformatted input fields spread across 6 disjointed modal tabs.
- **Deterministic Scan**: The automated detector identified **26 rule violations**:
  - `design-system-font` (5 findings): Rogue Google Fonts injection and CSS overrides (`Lexend`, `Source Sans 3`) in `page.js:62,65,68,96`.
  - `design-system-color` (10 findings): Hardcoded rogue `#0093dd` (diverging from `#0284C7`), plus unindexed `#64748b` and `#94a3b8` in `page.js` and `IndexRemunerasiSection.jsx`.
  - `design-system-font-size` (11 findings): Off-ramp micro font sizes (`text-[10px]`, `text-[11px]`, `13px`, `15px`) across sections.
  - *Detector Agreement & Distinctions*: The detector caught granular font and color token deviations, while recognizing `page.js:260` as a false positive within commented-out JSX, and micro-fonts as intentional dense data table treatments.
- **Visual Overlays**: Headless environment executed deterministic AST/regex scanning; browser overlay injection was not executed.

#### Overall Impression

The workforce management page has strong underlying mathematical and filtering architecture, but is severely crippled by commented-out navigation, fragmented 6-tab modal editing, and visual token drift that deviates from the hospital design system.

#### What's Working

1. **Explicit Remunerasi Mathematical Model (`RumusRemunerasiDialog.jsx`)**: The 35% Jabatan / 65% Personal point-weight split is mathematically sound and transparently documented.
2. **Synchronized Server-Side Filtering (`PegawaiDataSection.jsx`)**: Debounced search and synchronized query params across department and employment status perform smoothly.
3. **Mobile Responsive Card Fallback**: Seamless transition from wide table to compact touch cards on smaller viewports.

#### Priority Issues

- **[P0] What**: Top navigation tab triggers commented out in `page.js`.
  - *Why it matters*: Completely breaks information architecture; 4 entire modules (`Remunerasi`, `Evaluasi`, `Pencapaian`, `Threshold`) are inaccessible to users.
  - *Fix*: Restore and restyle the segmented controller adhering to `DESIGN.md`.
  - *Suggested command*: `$impeccable layout src/app/dashboard/pegawai-manajemen/page.js`

- **[P1] What**: Cross-tab validation failure trap in `PegawaiFormDialog.jsx`.
  - *Why it matters*: When validation fails on a non-active tab, users receive a generic toast error with no indication of which tab contains the error, causing form abandonment.
  - *Fix*: Add tab badge error counters and auto-navigate to the first invalid field/tab on submit.
  - *Suggested command*: `$impeccable harden src/components/pegawai-manajemen/PegawaiFormDialog.jsx`

- **[P1] What**: Rogue typography and color tokens defying `DESIGN.md`.
  - *Why it matters*: Injects external Google Fonts (`Lexend`, `Source Sans 3`) and `#0093dd` blue, breaking visual harmony across the application.
  - *Fix*: Remove inline font loading; replace rogue fonts and hex values with canonical `Figtree`/`Noto Sans` and Brand Cyan Tailwind tokens.
  - *Suggested command*: `$impeccable polish src/app/dashboard/pegawai-manajemen/page.js`

- **[P2] What**: Desktop vs mobile table column parity mismatch.
  - *Why it matters*: `Total Index` and `Persentase` are commented out in the desktop table but displayed in mobile cards, depriving desktop users of vital remuneration metrics.
  - *Fix*: Restore and typeset remuneration index columns cleanly on desktop using compact numerical badges.
  - *Suggested command*: `$impeccable typeset src/components/pegawai-manajemen/PegawaiDataSection.jsx`

- **[P2] What**: Unformatted financial and identity inputs.
  - *Why it matters*: Base salary (`gapok`), deductions (`pengurang`), and NIK are entered as raw unstructured numbers, inviting human input error.
  - *Fix*: Implement Rupiah currency formatting (`Intl.NumberFormat`) and structured 16-digit NIK masking.
  - *Suggested command*: `$impeccable clarify src/components/pegawai-manajemen/PegawaiFormDialog.jsx`

#### Persona Red Flags

- **Alex (Hospital HR Power Admin)**: Trapped in Data Pegawai table because top tabs are commented out in code. Cannot access remuneration thresholds or perform bulk status operations.
- **Jordan (New HR Staff / Onboarding)**: Confronted by 30+ unformatted inputs across 6 subtabs with raw database abbreviations (`indexins`, `bpd`, `stts_wp`), triggering invisible validation errors on submit.
- **Morgan (Hospital Director / Auditor)**: Desktop view conceals employee remuneration percentages and total index scores; calculation rules remain hidden inside developer modals.

#### Minor Observations

- Hardcoded inline style widths (`width: min(56rem, 95vw)`) bypass Tailwind responsive utility standards.
- Developer debug mode dialog (`DebugPersentaseDialog`) is wired in production UI via conditional env check.
- KPI metric cards use pastel blur effects (`emerald-500/5`, `blue-500/5`) instead of clean hospital slate borders.

#### Questions to Consider

- What if the 6-tab modal were streamlined into a structured 2-step clinical wizard (Identity & Assignment)?
- Why hide the remuneration calculation in a modal instead of displaying a live point simulator directly beside employee roles?
- How might the data table group employees by Clinical Department (UGD, ICU, Rawat Inap) rather than a flat corporate employee list?
