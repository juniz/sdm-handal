# Popup Notifikasi Revisi Penilaian Harian Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mengganti alert banner inline `PenilaianRevisiAlert` dengan popup card overlay bergaya native app notification (`RevisiNotifPopup`) yang muncul di bawah header pada halaman Dashboard.

**Architecture:** Membuat komponen `RevisiNotifPopup.js` dengan state collapsed/expanded dan animasi Framer Motion. Menggunakan hook existing `usePenilaianRevisiNotif`. Menghapus komponen `PenilaianRevisiAlert.js` lama dan mengupdate `dashboard/page.js` serta `input/page.js`.

**Tech Stack:** Next.js 14 App Router, React, TailwindCSS, Framer Motion, Lucide React icons, Moment.js.

## Global Constraints

- Popup hanya muncul di halaman Dashboard (`src/app/dashboard/page.js`).
- Halaman Input Penilaian Harian (`src/app/dashboard/penilaian-kinerja/input/page.js`) tidak menampilkan popup, namun tetap mempertahankan penanganan query param `?tanggal=YYYY-MM-DD`.
- Tidak ada perubahan pada backend NestJS, database, API proxy route, atau hook `usePenilaianRevisiNotif`.
- Animasi menggunakan Framer Motion.
- Tombol `✕` header menyembunyikan popup (session state `isDismissed`), sedangkan tombol `✕` per-item memanggil `markAsRead(id)`.

---

### Task 1: Buat Komponen `RevisiNotifPopup.js`

**Files:**
- Create: `src/components/notifications/RevisiNotifPopup.js`

**Interfaces:**
- Consumes: `usePenilaianRevisiNotif` from `@/hooks/usePenilaianRevisiNotif` (returns `{ revisiList, loading, markAsRead }`)
- Produces: Default export React component `<RevisiNotifPopup />`

- [ ] **Step 1: Write `src/components/notifications/RevisiNotifPopup.js`**

```javascript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, CalendarDays, ExternalLink, ChevronDown, X } from "lucide-react";
import usePenilaianRevisiNotif from "@/hooks/usePenilaianRevisiNotif";
import moment from "moment";
import "moment/locale/id";

moment.locale("id");

export default function RevisiNotifPopup() {
  const router = useRouter();
  const { revisiList, loading, markAsRead } = usePenilaianRevisiNotif();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  if (loading || isDismissed || !revisiList || revisiList.length === 0) {
    return null;
  }

  const count = revisiList.length;

  return (
    <div className="fixed top-16 left-4 right-4 md:left-auto md:right-6 md:w-96 z-40">
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white rounded-2xl border border-amber-200/80 shadow-xl overflow-hidden backdrop-blur-md"
      >
        {/* Header Bar (Clickable to toggle expand) */}
        <div
          onClick={() => setIsExpanded((prev) => !prev)}
          className="flex items-center justify-between p-3.5 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent cursor-pointer hover:bg-amber-500/15 transition-colors select-none"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-4.5 w-4.5 text-amber-600 animate-bounce" />
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-extrabold text-slate-800 tracking-tight">
                Revisi Diperlukan
              </span>
              <span className="bg-amber-500 text-white text-xs font-black px-2 py-0.5 rounded-full shadow-xs shrink-0">
                {count}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="p-1 text-slate-400 hover:text-slate-600"
            >
              <ChevronDown className="h-4 w-4" />
            </motion.div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsDismissed(true);
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Tutup notifikasi"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Expandable Body */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden border-t border-amber-100/80"
            >
              <ul className="divide-y divide-amber-100/60 max-h-72 overflow-y-auto">
                {revisiList.map((item) => (
                  <li
                    key={item.id}
                    className="p-3.5 flex items-start justify-between gap-3 hover:bg-amber-50/40 transition-colors"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <CalendarDays className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800">
                          {moment(item.tanggal).format("DD MMMM YYYY")}
                        </p>
                        {item.catatan_supervisor && (
                          <p className="text-xs text-slate-500 mt-1 italic line-clamp-2 leading-relaxed">
                            &ldquo;{item.catatan_supervisor}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() =>
                          router.push(
                            `/dashboard/penilaian-kinerja/input?tanggal=${item.tanggal}`
                          )
                        }
                        className="flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-900 bg-amber-100/80 hover:bg-amber-200/80 border border-amber-300/60 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Buka
                      </button>
                      <button
                        onClick={() => markAsRead(item.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-amber-100 transition-colors cursor-pointer"
                        aria-label="Tutup notifikasi item ini"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
```

- [ ] **Step 2: Check compilation**

Run: `cd /Users/hardiko/Documents/Developer/NEXT/sdm && npx next build`
Expected: Next.js compiles without syntax errors in `RevisiNotifPopup.js`.

- [ ] **Step 3: Commit**

```bash
git add src/components/notifications/RevisiNotifPopup.js
git commit -m "feat: create RevisiNotifPopup native-style component"
```

---

### Task 2: Ganti `PenilaianRevisiAlert` dengan `RevisiNotifPopup` di Dashboard & Hapus Alert Inline

**Files:**
- Modify: `src/app/dashboard/page.js:26`
- Modify: `src/app/dashboard/penilaian-kinerja/input/page.js:6`
- Delete: `src/components/notifications/PenilaianRevisiAlert.js`

**Interfaces:**
- Consumes: `<RevisiNotifPopup />`
- Produces: Dashboard rendering `<RevisiNotifPopup />` fixed overlay, Input Page cleaned of alert component.

- [ ] **Step 1: Delete `src/components/notifications/PenilaianRevisiAlert.js`**

```bash
rm /Users/hardiko/Documents/Developer/NEXT/sdm/src/components/notifications/PenilaianRevisiAlert.js
```

- [ ] **Step 2: Update `src/app/dashboard/page.js`**

Replace import:
```javascript
import PenilaianRevisiAlert from "@/components/notifications/PenilaianRevisiAlert";
```
With:
```javascript
import RevisiNotifPopup from "@/components/notifications/RevisiNotifPopup";
```

Replace usage in JSX (line ~262):
```jsx
{/* Notifikasi Revisi Penilaian Kinerja */}
<PenilaianRevisiAlert />
```
With:
```jsx
{/* Notifikasi Revisi Penilaian Kinerja Popup */}
<RevisiNotifPopup />
```

- [ ] **Step 3: Update `src/app/dashboard/penilaian-kinerja/input/page.js`**

Remove import:
```javascript
import PenilaianRevisiAlert from "@/components/notifications/PenilaianRevisiAlert";
```

Remove usage in JSX (line ~597):
```jsx
{/* ── Feedback banners ────────────────────────────────────── */}
<PenilaianRevisiAlert />
```
(Keep `<PenilaianRevisiAlert />` out of input page as specified).

- [ ] **Step 4: Verify full project build**

Run: `cd /Users/hardiko/Documents/Developer/NEXT/sdm && npm run build`
Expected: Exit 0 (`✓ Compiled successfully`).

- [ ] **Step 5: Commit**

```bash
git add src/app/dashboard/page.js src/app/dashboard/penilaian-kinerja/input/page.js
git rm src/components/notifications/PenilaianRevisiAlert.js
git commit -m "refactor: replace PenilaianRevisiAlert with RevisiNotifPopup on dashboard"
```

---

## Verification Plan

### Automated Verification
```bash
cd /Users/hardiko/Documents/Developer/NEXT/sdm && npm run build
```
Verify Next.js static build succeeds with exit code 0.

### Manual Verification
1. Open Dashboard page with pending revisions.
2. Confirm popup appears fixed below header with collapsed state (showing count badge).
3. Click header bar to expand and view the list of items.
4. Click **[Buka]** on an item to verify navigation to `/dashboard/penilaian-kinerja/input?tanggal=YYYY-MM-DD`.
5. Click **[✕]** on header to confirm popup collapses/hides for the current session.
