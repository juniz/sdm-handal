# Akreditasi PDF Viewer Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix runtime `TypeError: Properties can only be defined on Objects` in `/dashboard/akreditasi` by downgrading `pdfjs-dist` to version `3.4.120` to match `@react-pdf-viewer/core@3.12.0` requirements.

**Architecture:** Lock `pdfjs-dist` to exact version `3.4.120` compatible with `@react-pdf-viewer/core@3.12.0`. Ensure worker script points to the matching `3.4.120` worker. Keep dynamic SSR-disabled loading on Next.js 15.

**Tech Stack:** Next.js 15, React 19, `@react-pdf-viewer/core@3.12.0`, `pdfjs-dist@3.4.120`.

## Global Constraints
- `pdfjs-dist` must be locked to `"3.4.120"` in `package.json`.
- `PDFViewerComponent.jsx` must remain a client-side component rendered via Next.js `dynamic(..., { ssr: false })`.
- Touch only `package.json`, `package-lock.json`, and `src/app/dashboard/akreditasi/PDFViewerComponent.jsx`.

---

### Task 1: Lock `pdfjs-dist` version in `package.json` and reinstall

**Files:**
- Modify: `package.json:84`

**Interfaces:**
- Consumes: npm package manifest
- Produces: `pdfjs-dist` locked at version `3.4.120` in `node_modules`

- [ ] **Step 1: Update package.json dependency for pdfjs-dist**

Modify line 84 in `package.json`:
```json
"pdfjs-dist": "3.4.120",
```

- [ ] **Step 2: Install dependencies**

Run: `npm install --legacy-peer-deps`
Expected: Success, `node_modules/pdfjs-dist` installed at version `3.4.120`.

- [ ] **Step 3: Commit dependency update**

```bash
git add package.json package-lock.json
git commit -m "fix(akreditasi): lock pdfjs-dist to 3.4.120 for react-pdf-viewer compatibility"
```

---

### Task 2: Ensure matching PDF Worker in `PDFViewerComponent.jsx`

**Files:**
- Modify: `src/app/dashboard/akreditasi/PDFViewerComponent.jsx:34`

**Interfaces:**
- Consumes: `/pdfjs-dist@3.4.120/build/pdf.worker.min.js` or `/pdf.worker.min.js` in public directory
- Produces: Matching PDF.js worker execution in client browser

- [ ] **Step 1: Update Worker URL in PDFViewerComponent.jsx**

Update line 34 in `src/app/dashboard/akreditasi/PDFViewerComponent.jsx`:
```jsx
<Worker workerUrl="/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
```

- [ ] **Step 2: Commit worker URL change**

```bash
git add src/app/dashboard/akreditasi/PDFViewerComponent.jsx
git commit -m "fix(akreditasi): set Worker URL to matching pdfjs-dist 3.4.120 build"
```

---

### Task 3: Verification of PDF Viewer rendering

**Files:**
- Test: `src/app/dashboard/akreditasi/page.js`

- [ ] **Step 1: Run Next.js build validation**

Run: `npm run build`
Expected: Next.js app builds cleanly without bundler or type errors.

- [ ] **Step 2: Commit and confirm completion**

```bash
git status
```
