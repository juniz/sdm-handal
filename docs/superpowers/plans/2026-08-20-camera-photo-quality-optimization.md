# Attendance Camera Photo Quality Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Meningkatkan ketajaman dan resolusi foto presensi ke HD 960p/1024p dengan single-pass compression agar visual sangat jelas dan ukuran file tetap efisien (~120–200 KB).

**Architecture:**
- `AttendanceCamera.jsx`: Memperbarui video constraints kamera ke 960p (mobile) & 1024p (desktop), serta menerapkan *single-pass pipeline* tanpa kompresi ganda.
- `imageOptimizer.js`: Mengaktifkan `imageSmoothingQuality = "high"`, optimasi canvas stamping, dan ekspor kualitas JPEG 0.85.

**Tech Stack:** React, Next.js, WebRTC MediaStream API, HTML5 Canvas API.

---

### Task 1: Update Camera Constraints & Single-Pass Pipeline in `AttendanceCamera.jsx`

**Files:**
- Modify: `src/components/AttendanceCamera.jsx`

- [ ] **Step 1: Update `getVideoConstraints` and `capturePhoto` in `AttendanceCamera.jsx`**

```javascript
	const getVideoConstraints = () => {
		if (isMobile) {
			return {
				facingMode: "user",
				width: { ideal: 960, min: 640, max: 1280 },
				height: { ideal: 960, min: 640, max: 1280 },
				aspectRatio: { ideal: 1, min: 0.8, max: 1.2 },
			};
		} else {
			return {
				facingMode: "user",
				width: { ideal: 1024, min: 768, max: 1920 },
				height: { ideal: 768, min: 576, max: 1080 },
				aspectRatio: { ideal: 4 / 3, min: 4 / 3, max: 16 / 9 },
			};
		}
	};
```

In `capturePhoto`:
- Capture screenshot at 960x960 (mobile) or 1024x768 (desktop) with `screenshotQuality: 0.95`.
- If `watermarkMetadata` is provided, `stampGpsWatermark` produces the final crisp JPEG in a single pass without running secondary `optimizePhoto` (which would degrade quality).
- If `watermarkMetadata` is not provided, run `optimizePhoto(imageSrc)`.

- [ ] **Step 2: Commit Task 1**
```bash
git add src/components/AttendanceCamera.jsx
git commit -m "feat(attendance): upgrade camera resolution to 960p and implement single-pass capture"
```

---

### Task 2: Enhance Canvas Smoothing and Export Quality in `imageOptimizer.js`

**Files:**
- Modify: `src/utils/imageOptimizer.js`

- [ ] **Step 1: Update `stampGpsWatermark` and `getOptimalImageSettings`**

- In `stampGpsWatermark`:
  - Set `ctx.imageSmoothingEnabled = true;` and `ctx.imageSmoothingQuality = "high";`.
  - Set export to `canvas.toDataURL("image/jpeg", 0.85);`.
- In `getOptimalImageSettings`:
  - Default to `maxWidth: 1024, maxHeight: 768, quality: 0.85`.

- [ ] **Step 2: Commit Task 2**
```bash
git add src/utils/imageOptimizer.js
git commit -m "feat(attendance): enable high smoothing and optimize JPEG quality to 0.85"
```

---

### Task 3: Build Verification & End-to-End Test

- [ ] **Step 1: Run `npm run build`**
```bash
npm run build
```
Verify 0 errors.
