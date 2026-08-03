# Design Spec: Fix Akreditasi Menu PDF Viewer Runtime Error

## Summary
The Akreditasi menu (`/dashboard/akreditasi`) crashes at runtime with `TypeError: Properties can only be defined on Objects` when importing `@react-pdf-viewer/core` via `pdfjs-dist/build/pdf.mjs`. This spec defines the resolution by fixing the dependency lock of `pdfjs-dist` to version `3.4.120`, ensuring full compatibility with `@react-pdf-viewer@3.12.0` and providing an optimal mobile-first, native-like rendering experience on both Android and iOS devices.

## Motivation & Constraints
- **Runtime Error**: Next.js 15 Webpack bundling breaks on `pdfjs-dist` v5.4.449 ES module structure (`pdf.mjs`).
- **Mobile Compatibility**: Native `<iframe>` PDF embedding behaves inconsistently on mobile browsers (Android Chrome forces downloads; iOS Safari restricts multi-page scrolling). HTML5 Canvas-based PDF rendering via PDF.js guarantees identical inline PDF rendering on both iOS Safari and Android Chrome.

## Proposed Changes

### Dependencies (`package.json`)
- Fix `pdfjs-dist` version from `^5.4.449` to `"3.4.120"`.
- Run clean package installation to ensure `node_modules/pdfjs-dist` matches `3.4.120`.

### PDF Viewer Component (`src/app/dashboard/akreditasi/PDFViewerComponent.jsx`)
- Set `<Worker workerUrl="/pdfjs-dist@3.4.120/build/pdf.worker.min.js">` or `/pdf.worker.min.js` pointing strictly to the matching 3.4.120 worker build.
- Ensure proper styling and responsive wrapper for mobile screens with touch momentum scrolling.

### Page Component (`src/app/dashboard/akreditasi/page.js`)
- Maintain Next.js `dynamic()` import with `ssr: false` to prevent server-side DOM access errors (`window`, `DOMMatrix`).
- Handle loading and error states gracefully.

## Verification Plan
1. **Dependency Installation**: Run `npm install` and ensure `pdfjs-dist` is strictly `3.4.120`.
2. **Next.js Build Check**: Run `npm run build` or start `npm run dev` to verify no runtime `TypeError: Properties can only be defined on Objects`.
3. **Functional Verification**: Load `/dashboard/akreditasi` page in browser, verify PDF document loads, scrolls, and zooms properly.
