# Daftar Izin Mobile Native Design

## Goal

Redesign the `DaftarIzin` mobile presentation below `780px` as a compact iOS-style activity list with native-feeling detail sheets. Preserve the existing desktop table at `780px` and above.

This revision is presentation-only. It does not change `/api/izin`, request data, date filtering, pagination state, deletion rules, confirmation behavior, or toast messages.

## Mobile Layout

The mobile history view uses a light `#f2f2f7` system background and grouped inset white surfaces.

### Summary and Filters

- Show a compact summary row with the total request count.
- Indicate when a start or end date filter is active.
- Present date filters as a concise horizontal toolbar.
- Reuse the existing `DatePicker` controls and filter state.
- Show the clear action only when at least one date filter is active.

### Request List

Each request appears as a minimum-`64px` tappable row containing:

- A system-blue rounded calendar icon.
- Request number as the primary label.
- Formatted start and end dates.
- Duration in days.
- A semantic status pill with readable text.
- A trailing chevron indicating that details are available.

Rows use subtle separators inside a single grouped surface. They do not expand inline.

### Detail Sheet

Tapping a request opens a bottom-aligned sheet on mobile. The sheet contains:

- A drag indicator and clear title.
- Request number and status.
- Submission date.
- Full leave period and duration.
- Urgency.
- Purpose.
- Responsible employee.
- A close action.
- A destructive delete action only when `status !== "Disetujui"`.

The sheet must be scrollable on short screens and include safe-area bottom padding. Closing the sheet returns focus to the row that opened it.

The existing delete confirmation dialog remains a separate confirmation step. Opening delete confirmation from the sheet must not immediately delete the request.

## Supporting States

- Loading: three inset skeleton rows that preserve the eventual list shape.
- Empty: an inset surface with icon, primary message, and short secondary explanation.
- Error behavior: retain the existing console behavior; no new API error model is introduced.
- Pagination: retain previous/next controls and `Halaman X dari Y`, with disabled boundary states.

## Desktop Preservation

At `780px` and above:

- Keep the existing desktop date filters.
- Keep the existing table columns and row actions.
- Keep numbered pagination.
- Do not render or mount the mobile detail sheet trigger presentation.

## Accessibility

- Every request row is a semantic button with a minimum `44px` touch target.
- Status meaning is communicated with text as well as color.
- The sheet has an accessible title and description.
- Escape and overlay click close the sheet through the existing dialog primitive.
- Icon-only controls have accessible labels.
- Focus remains visible and is restored after the sheet closes.

## Component Boundaries

Keep changes in `src/app/dashboard/izin/components/DaftarIzin.js`.

Route-local helpers may include:

- `MobileIzinRow`
- `MobileIzinDetailSheet`
- `MobileHistorySkeleton`
- `MobilePagination`

Reuse the existing shadcn/Radix dialog primitive rather than introducing a dependency or shared sheet abstraction.

## Verification

Verify at:

- `390px`: grouped list, toolbar, sheet, safe-area padding.
- `779px`: mobile presentation remains active.
- `780px`: desktop filters, table, and pagination are restored.
- `1280px`: no desktop regression.

Functional checks:

- Selecting and clearing both date filters.
- Opening and closing multiple request sheets.
- Approved requests do not expose delete.
- Other statuses expose delete and still require confirmation.
- Loading, empty, single-row, and multi-row responses.
- Previous and next pagination boundaries.
- Long purpose text remains readable and sheet content scrolls.
