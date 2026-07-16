# Design Spec: Cancel Submit for Daily Performance Evaluation

## Goal
Allow employees to cancel their submitted daily performance evaluations if the supervisor has not approved them yet. This allows them to edit their evaluation details without waiting for the supervisor to reject/request revision.

## Proposed Changes

### 1. Backend API: [route.js](file:///Users/hardiko/Documents/Developer/NEXT/sdm/src/app/api/penilaian/harian/%5Bid%5D/route.js)
Modify the dynamic POST route to support the `"cancel"` action.
- Update action whitelist to: `["submit", "approve", "revisi", "cancel"]`.
- When `action === "cancel"`:
  - Verify that the requesting employee is the owner of the record.
  - Verify that the current status of the record is `"submitted"`.
  - Update status back to `"draft"`.

### 2. Frontend Page: [page.js](file:///Users/hardiko/Documents/Developer/NEXT/sdm/src/app/dashboard/penilaian-kinerja/input/page.js)
Update the daily performance input screen.
- Import `RotateCcw` from `lucide-react`.
- Add `cancelling` state.
- Add `handleCancelSubmit` function calling the POST API with `{ action: "cancel" }`.
- Render a cancel button at the bottom of the activities sheet when `harianRecord && harianRecord.status === 'submitted'`.

## Verification Plan

### Manual Verification
- Create draft evaluation, add activity, and submit it.
- Observe state transition to `"submitted"` and fields becoming read-only.
- Click "Batal Kirim Penilaian" button at the bottom of the activities sheet.
- Verify status reverts to `"draft"` and fields become editable again.
- Verify supervisor page does not list the draft.
