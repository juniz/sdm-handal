# Design Spec: Mobile Fullscreen E-Reader Mode for Akreditasi PDF

## Summary
Redesign the PDF Viewer UI on mobile devices to deliver a native-like Fullscreen E-Reader experience. The new layout features a top reading progress bar, auto-fitting page width scaling, edge-to-edge mobile viewing, and an unobtrusive floating page badge.

## User Experience & Mobile Layout

### 1. Reading Progress Bar
- Positioned at the very top of the viewing area (sticky/fixed).
- Height: `3px`, colored `bg-rose-600 transition-all duration-300`.
- Calculates progress as `((currentPage + 1) / totalPages) * 100%`.

### 2. Header & Container Layout
- **Desktop**: Retains structured Card container with gradient header and download action.
- **Mobile (< 768px)**: 
  - Reduced outer card padding and border radius for edge-to-edge canvas view.
  - Compact header bar with title, download button, and total pages counter.
  - Smooth momentum scrolling with `-webkit-overflow-scrolling: touch`.

### 3. Canvas Scaling & Touch Controls
- PDF page automatically scales to fit mobile screen width (`defaultScale={SpecialZoomLevel.PageWidth}` or calculated responsive scale) to prevent unintended horizontal scrolling.
- Floating bottom-right page badge (`bg-slate-900/80 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs font-medium shadow-lg`) showing `Halaman X dari Y`.

## Components to Modify
- `src/app/dashboard/akreditasi/page.js`: Add progress bar computation, responsive layout wrapper, floating badge, and page count state.
- `src/app/dashboard/akreditasi/PDFViewerComponent.jsx`: Support page count callback, responsive default scale, and custom render layout props.

## Verification Plan
1. **Build Verification**: Run `npm run build` to ensure 0 compilation/type errors.
2. **Responsiveness Verification**: Verify mobile viewpoint layout rendering, progress bar calculations, and floating badge behavior.
