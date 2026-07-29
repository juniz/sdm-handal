# Izin Mobile iOS Redesign

## Goal

Redesign `/dashboard/izin` below a `780px` viewport width so it feels like a native iOS application while preserving the existing desktop and tablet layout at `780px` and above.

The redesign is presentation-only. Existing APIs, form fields, validation rules, submission behavior, filtering, pagination, deletion, and data structures remain unchanged.

## Responsive Boundary

- Below `780px`: use the new mobile iOS presentation.
- At `780px` and above: preserve the current desktop presentation and interactions.
- Implement the boundary explicitly with Tailwind arbitrary breakpoint variants such as `min-[780px]:`.

## Page Shell

On mobile, remove the visual impression of a centered webpage card. The page uses:

- A full-width, light neutral system background.
- A compact page header titled **Izin** with a short supporting label.
- An inset, pill-shaped segmented control for **Pengajuan** and **Daftar Izin**.
- Mobile-safe horizontal padding and bottom safe-area spacing.
- Subtle borders and restrained shadows instead of gradients and large desktop-style elevation.

The segmented control continues to use the existing tab state and content. No routing or data-flow changes are introduced.

## Pengajuan Izin

The mobile form is arranged as grouped inset sections:

1. **Periode**
   - Tanggal Awal
   - Tanggal Akhir
2. **Detail Izin**
   - Urgensi
   - Kepentingan
3. **Serah Terima**
   - Penanggung Jawab

Mobile controls have a minimum interactive height of 44px, comfortable internal spacing, clear labels, and rounded iOS-like surfaces. The purpose textarea remains multiline.

When **Dinas Dalam Kota** is selected, the existing information message appears as a subtle blue system notice. Validation remains inline beneath the affected field using concise red helper text.

The submit action becomes a full-width, 50–52px button in a sticky bottom action area. The area includes safe-area padding and an opaque or lightly translucent background so content does not show through illegibly. The existing loading state and submit icon remain.

At `780px` and above, the current form grid, spacing, and right-aligned submit button remain intact.

## Daftar Izin

On mobile, requests appear as an inset iOS settings-style list rather than a table:

- Each tappable row shows the request number, submission or period date, status, and a disclosure indicator.
- Expanding a row reveals the full period, duration, urgency, purpose, responsible employee, and conditional delete action.
- Statuses retain semantic colors: amber for processing, green for approved, red for rejected, and neutral gray for unknown values.
- Rows and disclosure controls have at least a 44px touch target.

The existing desktop table remains unchanged at `780px` and above.

### Filters

Mobile date filters appear in a compact grouped panel above the list. The clear action is visible only when a filter is active. Existing date values and fetch behavior are unchanged.

### Pagination

Mobile pagination uses:

- A previous button.
- A centered `Halaman X dari Y` indicator.
- A next button.

Desktop retains the existing numbered pagination. Disabled states must be visually clear.

### Supporting States

- Loading: show a compact mobile loading treatment without shifting the whole page.
- Empty: show a centered, calm empty state with a short explanation.
- Delete: retain the existing confirmation dialog and toast behavior.

## Component Boundaries

Changes remain surgical and within the existing route:

- `page.js` owns the responsive page shell, header, and segmented control.
- `PengajuanIzinForm.js` owns grouped mobile field presentation and the sticky submit area.
- `DaftarIzin.js` owns mobile list rows, filters, pagination, and supporting states.

Small local presentational helpers may be added inside these files when they reduce repetition. No new shared abstraction is needed unless the same presentation is used more than once in the route.

## Accessibility and Interaction

- Preserve native button semantics and keyboard behavior from the existing UI primitives.
- Maintain visible focus states.
- Ensure touch targets are at least 44px tall.
- Do not rely on color alone for status or validation meaning.
- Respect device safe-area insets for the sticky submit action.
- Keep motion subtle and avoid scale effects on mobile primary actions.

## Verification

Verify the redesign at:

- `390px`: representative mobile layout.
- `779px`: new iOS mobile layout remains active.
- `780px`: existing desktop layout is restored.
- A wider desktop viewport: no regressions to the current presentation.

Functional checks:

- Required-field validation and invalid date ranges.
- Conditional in-city information notice.
- Successful submit and loading state.
- History loading, empty, and populated states.
- Row expansion and details.
- Date filtering and filter clearing.
- Previous/next pagination boundaries.
- Delete confirmation and approved-item delete restriction.

Run the project’s available lint or build checks for the touched files and inspect the responsive page in a browser.
