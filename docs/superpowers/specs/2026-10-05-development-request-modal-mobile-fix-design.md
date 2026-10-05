# Design Spec: Mobile Full-Screen & Stacking Fix for Development Request Modal

**Date:** 2026-10-05  
**Topic:** Fix mobile dock menu obscuring `RequestModal` in `/dashboard/development`  
**Status:** Approved

---

## 1. Problem Statement

On mobile devices, opening the Development Request modal (`RequestModal`) at `/dashboard/development` results in the floating dock navigation (`BottomNavigation`) obscuring the lower portion of the modal, including the disclaimer box and action buttons ("Batal", "Buat Pengajuan").

### Root Causes
1. **Identical Z-Index in Shared Context**: Both [BottomNavigation.js](file:///Users/hardiko/Documents/Developer/NEXT/sdm/src/components/BottomNavigation.js) and [RequestModal.js](file:///Users/hardiko/Documents/Developer/NEXT/sdm/src/components/development/RequestModal.js) use `z-50`. Because `BottomNavigation` is rendered after `<main>` in [layout.js](file:///Users/hardiko/Documents/Developer/NEXT/sdm/src/app/dashboard/layout.js), DOM order paints `BottomNavigation` over the modal and its backdrop.
2. **Brittle Modal Sizing on Mobile**: `RequestModal` uses fixed outer padding `p-4` with an arbitrary inner calculation `max-h-[calc(90vh-180px)]` and no flex container (`flex flex-col`), making the footer vulnerable to viewport height issues and overlapping controls on small mobile screens.

---

## 2. Architecture & Layering Design

### Stacking Hierarchy
```
Mobile Sidebar Drawer   : z-[100]
Mobile Sidebar Backdrop : z-[90]
Discard Confirm Dialog  : z-[70]
RequestModal Overlay    : z-[60]
Radix Modals / Popups   : z-50
BottomNavigation Dock   : z-40  <-- Lowered from z-50
Dashboard Mobile Header : z-30
Page Content Body       : z-0
```

1. **[BottomNavigation.js](file:///Users/hardiko/Documents/Developer/NEXT/sdm/src/components/BottomNavigation.js)**:
   - Change dock container z-index from `z-50` to `z-40`.
   - Result: App navigation remains above standard page elements, but sits beneath modal backdrops.

2. **[RequestModal.js](file:///Users/hardiko/Documents/Developer/NEXT/sdm/src/components/development/RequestModal.js)**:
   - Modal backdrop: Increase z-index from `z-50` to `z-[60]`.
   - Discard confirmation dialog: Increase z-index from `z-[60]` to `z-[70]` to stay above the primary modal backdrop.

---

## 3. UI/UX Layout & Responsiveness

### Mobile Full-Screen Layout
- **Backdrop (`RequestModal.js`)**:
  - Tailwind: `fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-0 sm:p-4`
  - Mobile: zero padding (`p-0`) to allow full viewport coverage.
  - Desktop: standard `sm:p-4` centering card modal.

- **Modal Card**:
  - Tailwind: `bg-white w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-4xl sm:rounded-lg overflow-hidden shadow-2xl flex flex-col`
  - Mobile: Fullscreen sheet (`h-full`, `rounded-none`).
  - Desktop: Floating rounded dialog (`sm:h-auto`, `sm:max-h-[90vh]`, `sm:rounded-lg`).

- **Header (`shrink-0`)**:
  - Tailwind: `flex items-center justify-between px-4 py-3 sm:p-6 border-b border-gray-200 bg-white shrink-0`
  - Mobile: compact padding for maximum editing area.

- **Form Body (`flex-1 min-h-0 overflow-y-auto`)**:
  - Replaces `max-h-[calc(90vh-180px)]` with natural flex scrolling.
  - Internal padding: `p-4 sm:p-6 space-y-6`.

- **Footer (`shrink-0`)**:
  - Tailwind: `flex items-center justify-end gap-3 px-4 py-3 sm:px-6 sm:py-4 border-t border-gray-200 bg-gray-50 shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-4`
  - Pinned to bottom, respecting safe-area inset on mobile devices.

---

## 4. Verification Plan

1. **Stacking Layer Verification**:
   - Open `/dashboard/development` on simulated mobile screen (viewport <= 768px).
   - Click "Ajukan Pengembangan" / open `RequestModal`.
   - Verify `BottomNavigation` dock is completely beneath the backdrop and invisible/non-clickable.
2. **Mobile Form Ergonomics**:
   - Verify modal fills screen on mobile without dock overlap.
   - Verify form body scrolls smoothly from top to bottom.
   - Verify footer buttons ("Batal", "Buat Pengajuan") remain accessible and pinned at bottom.
3. **Discard Dialog Verification**:
   - Type input into form, trigger close (click X or Esc).
   - Verify "Tutup Pengajuan?" alert dialog displays on top of the modal (`z-[70]`).
4. **Desktop Regression Check**:
   - View on desktop viewport (>= 1024px).
   - Verify centered card dialog with `max-w-4xl` and `rounded-lg` retains previous appearance.
