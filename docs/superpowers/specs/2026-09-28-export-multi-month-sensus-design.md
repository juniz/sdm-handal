# Design: Export Multi-Bulan Sensus Harian

**Date:** 2026-09-28

## Problem

Current export in `QualityIndicatorReport` only exports 1 month (whichever is active in filter). User needs to export multiple months at once, with separate files per month.

## Requirements

1. User can select **multiple individual months** via checkboxes (not a date range)
2. Result: **one Excel file per selected month**, downloaded sequentially
3. Data per month is **fetched fresh from the API** (not from current display state)
4. Export format per file is the same as existing `handleExportSensus` output
5. Default list shows last 12 months as checkboxes

## Approach

Add **"Export Multi-Bulan"** button next to existing Export Excel button in `QualityIndicatorReport.js`. This button opens an inline modal (no new file). Modal contains:

- Checkbox list of last 12 months (most recent first)
- Select All / Deselect All shortcut
- Export button + loading state
- Sequential download: for each selected month, fetch API then trigger XLSX download

## Files Modified

- `src/components/ticket-assignment/QualityIndicatorReport.js` — only file changed

## Non-Goals

- No ZIP packaging (sequential individual downloads)
- No changes to API
- No changes to backend
