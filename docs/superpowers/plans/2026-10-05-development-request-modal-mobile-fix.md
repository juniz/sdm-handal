# Development Request Modal Mobile Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix UI bug where bottom dock menu covers modal content and footer action buttons in `/dashboard/development` on mobile devices.

**Architecture:** Adjust layout stacking contexts by lowering dock navigation to `z-40` and elevating `RequestModal` to `z-[60]` (with discard confirmation dialog at `z-[70]`). Transform `RequestModal` into a responsive full-screen flex layout on mobile with scrollable form body and pinned safe-area-aware footer.

**Tech Stack:** Next.js (App Router), React, Tailwind CSS, Lucide React icons.

## Global Constraints

- Never break desktop styling: desktop viewports (>= 640px) must retain centered card dialog (`sm:max-w-4xl`, `sm:rounded-lg`, `sm:max-h-[90vh]`).
- Do not introduce new third-party dependencies or Radix Dialog rewrites.
- Ensure iOS safe-area inset bottom is respected so action buttons are not clipped by home indicator bar.

---

### Task 1: Lower Dock Navigation Z-Index to `z-40`

**Files:**
- Modify: `src/components/BottomNavigation.js:52`

**Interfaces:**
- Consumes: Standard React component rendered in `src/app/dashboard/layout.js`.
- Produces: Persistent bottom dock navigation rendered with `z-40`.

- [ ] **Step 1: Check existing z-index in BottomNavigation.js**

Run: `grep -n "z-50" src/components/BottomNavigation.js`
Expected: Line 52 shows `<div className="fixed bottom-6 left-4 right-4 md:hidden z-50 print:hidden">`

- [ ] **Step 2: Update z-index to `z-40`**

In `src/components/BottomNavigation.js`:
```jsx
// Replace:
<div className="fixed bottom-6 left-4 right-4 md:hidden z-50 print:hidden">

// With:
<div className="fixed bottom-6 left-4 right-4 md:hidden z-40 print:hidden">
```

- [ ] **Step 3: Verify the change in BottomNavigation.js**

Run: `git diff src/components/BottomNavigation.js`
Expected: Diff shows `- z-50` and `+ z-40`.

- [ ] **Step 4: Commit Task 1**

```bash
git add src/components/BottomNavigation.js
git commit -m "style(nav): lower mobile bottom dock z-index to z-40"
```

---

### Task 2: Make RequestModal Full-Screen on Mobile with Stacking Layer Elevation

**Files:**
- Modify: `src/components/development/RequestModal.js:230-265,560-600`

**Interfaces:**
- Consumes: Props `{ isOpen, onClose, onSave, request, masterData, isLoading }` from `src/app/dashboard/development/page.js`.
- Produces: Modal with `z-[60]` overlay, responsive `h-full sm:h-auto` card, flex column layout, and `z-[70]` discard alert.

- [ ] **Step 1: Update Modal Overlay and Container Classes**

In `src/components/development/RequestModal.js`:
Change outer backdrop from `p-4 z-50` to `p-0 sm:p-4 z-[60]`:
```jsx
// Replace:
<div
	className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
	onClick={(e) => {
		if (e.target === e.currentTarget) handleAttemptClose();
	}}
	role="dialog"
	aria-modal="true"
	aria-labelledby="request-modal-title"
>
	<div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">

// With:
<div
	className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-0 sm:p-4"
	onClick={(e) => {
		if (e.target === e.currentTarget) handleAttemptClose();
	}}
	role="dialog"
	aria-modal="true"
	aria-labelledby="request-modal-title"
>
	<div className="bg-white w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-4xl sm:rounded-lg overflow-hidden shadow-2xl flex flex-col">
```

- [ ] **Step 2: Update Header and Form Body Structure**

In `src/components/development/RequestModal.js`:
Make header `shrink-0` with responsive padding, and make form `flex-1 min-h-0 overflow-y-auto`:
```jsx
// Replace:
<div className="flex items-center justify-between p-6 border-b border-gray-200">
	<h2
		id="request-modal-title"
		className="text-xl font-semibold text-gray-900"
	>
		{isEditing
			? "Edit Pengajuan Pengembangan"
			: "Pengajuan Pengembangan Baru"}
	</h2>
	<button
		onClick={handleAttemptClose}
		className="text-gray-400 hover:text-gray-600 transition-colors p-1"
		disabled={isSubmitting}
		aria-label="Tutup formulir"
	>
		<X className="w-6 h-6" />
	</button>
</div>

{/* Form */}
<form
	onSubmit={handleSubmit}
	className="overflow-y-auto max-h-[calc(90vh-180px)]"
>
	<div className="p-6 space-y-6">

// With:
<div className="flex items-center justify-between px-4 py-3.5 sm:p-6 border-b border-gray-200 bg-white shrink-0">
	<h2
		id="request-modal-title"
		className="text-lg sm:text-xl font-semibold text-gray-900"
	>
		{isEditing
			? "Edit Pengajuan Pengembangan"
			: "Pengajuan Pengembangan Baru"}
	</h2>
	<button
		onClick={handleAttemptClose}
		className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-lg hover:bg-gray-100"
		disabled={isSubmitting}
		aria-label="Tutup formulir"
	>
		<X className="w-5 h-5 sm:w-6 sm:h-6" />
	</button>
</div>

{/* Form */}
<form
	onSubmit={handleSubmit}
	className="flex-1 min-h-0 overflow-y-auto"
>
	<div className="p-4 sm:p-6 space-y-6">
```

- [ ] **Step 3: Update Footer and Discard Dialog Z-Index**

In `src/components/development/RequestModal.js`:
Make footer `shrink-0` with safe area padding, and elevate discard modal to `z-[70]`:
```jsx
// Replace:
{/* Footer */}
<div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">

// With:
{/* Footer */}
<div className="flex items-center justify-end gap-3 px-4 py-3 sm:px-6 sm:py-4 border-t border-gray-200 bg-gray-50 shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-4">
```

And for Discard Confirmation Modal:
```jsx
// Replace:
{showConfirmClose && (
	<div
		className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4"

// With:
{showConfirmClose && (
	<div
		className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4"
```

- [ ] **Step 4: Verify Diff in RequestModal.js**

Run: `git diff src/components/development/RequestModal.js`
Expected: Diff shows responsive flex classes, `z-[60]`, `z-[70]`, and removal of `max-h-[calc(90vh-180px)]`.

- [ ] **Step 5: Commit Task 2**

```bash
git add src/components/development/RequestModal.js
git commit -m "fix(development): make request modal responsive full-screen on mobile and elevate z-index"
```

---

### Task 3: Verification & Stacking Layer Check

**Files:**
- Verify: `src/components/BottomNavigation.js`
- Verify: `src/components/development/RequestModal.js`

- [ ] **Step 1: Check z-index stacking hierarchy across files**

Run:
```bash
grep -E "z-(40|50|\[60\]|\[70\])" src/components/BottomNavigation.js src/components/development/RequestModal.js
```
Expected:
`BottomNavigation.js`: `z-40`
`RequestModal.js`: `z-[60]`, `z-[70]`

- [ ] **Step 2: Verify git status is clean**

Run: `git status`
Expected: Working tree clean.
