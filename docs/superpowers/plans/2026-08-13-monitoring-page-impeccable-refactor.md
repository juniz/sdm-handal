# Server Monitoring Page Comprehensive UI/UX Refactor Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the Server Monitoring dashboard (`src/app/dashboard/monitoring/page.js`) to eliminate high-risk P0 issues (unprotected cron triggers, main-thread SSE freeze, native `alert()`), restructure the monolithic 8-card page into a clean tabbed layout (`Tabs`), and add log search/filtering with SDM domain clarity.

**Architecture:** Update `MonitoringPage` in `src/app/dashboard/monitoring/page.js`:
1. Restructure single-page layout into 4 organized Tabs: `[Ikhtisar System]`, `[Cron Job Backend]`, `[Live Log Terminal]`, `[Audit Database & Error]`.
2. Implement an `AlertDialog` confirmation dialog before executing manual cron jobs, and replace native `alert()` with a Toast/Notification state.
3. Optimize SSE log stream handling using a `useRef` queue and throttled updates (every 500ms) to prevent React DOM thrashing.
4. Add search inputs and filter dropdowns for Live Logs, Errors, Slow Queries, and Cron Jobs.
5. Translate developer jargon & cron expressions into human-readable Indonesian descriptions and tooltips.

**Tech Stack:** Next.js (App Router, Client Component), React Hooks (`useRef`, `useCallback`, `useEffect`), Tailwind CSS, `lucide-react` icons, shadcn UI components (`Card`, `Table`, `Badge`, `Button`, `Dialog`/`AlertDialog`, `Input`).

## Global Constraints

- Touch only `src/app/dashboard/monitoring/page.js` and dependent subcomponents if required.
- Maintain existing visual system and clean responsive layout.
- Ensure `node -c src/app/dashboard/monitoring/page.js` passes with zero errors.

---

### Task 1: Refactor Page Architecture with Tabbed Navigation & Search States

**Files:**
- Modify: `src/app/dashboard/monitoring/page.js`

**Interfaces:**
- Consumes: `summary`, `traffic`, `slowEndpoints`, `cronJobs`, `logs`, `errors`, `authEvents`, `slowQueries` state data.
- Produces: Tabbed interface (`activeTab`: `'overview'`, `'cron'`, `'logs'`, `'audit'`) and search/filter states (`cronFilter`, `logFilter`, `auditFilter`).

- [ ] **Step 1: Add tab and filter states to `MonitoringPage`**

In `src/app/dashboard/monitoring/page.js`:
```javascript
const [activeTab, setActiveTab] = useState("overview");
const [cronFilter, setCronFilter] = useState("");
const [logFilter, setLogFilter] = useState("");
const [auditFilter, setAuditFilter] = useState("");
const [selectedCronJob, setSelectedCronJob] = useState(null); // for confirmation modal
const [toastMessage, setToastMessage] = useState(null); // toast notification state
```

- [ ] **Step 2: Add Humanized Cron Expression Helper & Toast Helper**

```javascript
const humanizeCron = (expression) => {
  if (!expression) return "Jadwal kustom";
  if (expression === "0 0 * * *") return "Setiap hari pukul 00:00 WIB";
  if (expression === "0 5 0 * * *") return "Setiap hari pukul 00:05 WIB";
  if (expression.startsWith("*/")) {
    const mins = expression.split(" ")[0].replace("*/", "");
    return `Setiap ${mins} menit`;
  }
  return `Jadwal: ${expression}`;
};

const showToast = (message, type = "info") => {
  setToastMessage({ message, type, id: Date.now() });
  setTimeout(() => setToastMessage(null), 4000);
};
```

- [ ] **Step 3: Render Navigation Tab Bar**

Replace monolithic vertical stack header with responsive Tab Navigation buttons:
```jsx
<div className="flex border-b border-slate-200 gap-2 mb-6 overflow-x-auto">
  <button
    onClick={() => setActiveTab("overview")}
    className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
      activeTab === "overview" ? "border-sky-500 text-sky-600" : "border-transparent text-slate-500 hover:text-slate-700"
    }`}
  >
    Ikhtisar &amp; Resource
  </button>
  <button
    onClick={() => setActiveTab("cron")}
    className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
      activeTab === "cron" ? "border-sky-500 text-sky-600" : "border-transparent text-slate-500 hover:text-slate-700"
    }`}
  >
    Cron Job Backend ({cronJobs.length})
  </button>
  <button
    onClick={() => setActiveTab("logs")}
    className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
      activeTab === "logs" ? "border-sky-500 text-sky-600" : "border-transparent text-slate-500 hover:text-slate-700"
    }`}
  >
    Live Terminal Stream
  </button>
  <button
    onClick={() => setActiveTab("audit")}
    className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
      activeTab === "audit" ? "border-sky-500 text-sky-600" : "border-transparent text-slate-500 hover:text-slate-700"
    }`}
  >
    Audit Error &amp; Database
  </button>
</div>
```

- [ ] **Step 4: Verify syntax & commit Task 1**

Run: `node -c src/app/dashboard/monitoring/page.js`
Commit: `git add src/app/dashboard/monitoring/page.js` with message `refactor(monitoring): add tabbed navigation layout and toast state`.

---

### Task 2: Implement P0 Fixes (Throttled SSE Queue, Confirmation Modal, Toast Notifications)

**Files:**
- Modify: `src/app/dashboard/monitoring/page.js`

**Interfaces:**
- Consumes: Real-time SSE stream events.
- Produces: Smooth throttled batch re-rendering (every 500ms) without DOM lockups, confirmation dialog before manual cron triggers, and inline toast notification UI.

- [ ] **Step 1: Optimize SSE log stream updating with `useRef` queue**

Replace unbatched SSE `onmessage` handling with a throttled buffer queue:
```javascript
const logQueueRef = useRef([]);

useEffect(() => {
  if (isPaused) return;

  const flushInterval = setInterval(() => {
    if (logQueueRef.current.length === 0) return;
    const queuedLogs = [...logQueueRef.current];
    logQueueRef.current = [];

    setLogs((prev) => {
      const next = [...prev, ...queuedLogs];
      return next.length > 200 ? next.slice(next.length - 200) : next;
    });

    queuedLogs.forEach((payload) => handleRealtimeLog(payload));
  }, 500);

  return () => clearInterval(flushInterval);
}, [isPaused]);
```
Update `es.onmessage` to push into `logQueueRef.current.push(payload)` instead of calling state setters immediately.

- [ ] **Step 2: Replace native `alert()` with Toast & Modal Confirmation**

Update `handleTriggerCron`:
```javascript
const confirmAndTriggerCron = (jobName) => {
  setSelectedCronJob(jobName);
};

const executeTriggerCron = async () => {
  const jobName = selectedCronJob;
  if (!jobName || triggeringJob) return;
  setTriggeringJob(jobName);
  setSelectedCronJob(null);
  const token = getClientToken();
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/monitor/cron-jobs/${encodeURIComponent(jobName)}/trigger`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    const json = await res.json();
    if (res.ok) {
      showToast(json.message || `Cron job ${jobName} berhasil dipicu.`, "success");
      await fetchCronJobs();
    } else {
      showToast(`Gagal memicu cron job: ${json.message || "Unknown error"}`, "error");
    }
  } catch (err) {
    console.error("Error triggering cron job:", err);
    showToast("Gagal memicu cron job: Terjadi kesalahan jaringan", "error");
  } finally {
    setTriggeringJob(null);
  }
};
```

Render `AlertDialog` confirmation overlay when `selectedCronJob` is set:
```jsx
{selectedCronJob && (
  <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 border border-slate-100">
      <div className="flex items-center gap-3 text-amber-600">
        <AlertTriangle className="h-6 w-6 flex-shrink-0" />
        <h3 className="text-lg font-bold text-slate-800">Konfirmasi Trigger Cron Job</h3>
      </div>
      <p className="text-sm text-slate-600">
        Apakah Anda yakin ingin memicu eksekusi manual untuk cron job <strong>{selectedCronJob}</strong> secara langsung?
      </p>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" size="sm" onClick={() => setSelectedCronJob(null)}>
          Batal
        </Button>
        <Button variant="default" size="sm" className="bg-sky-600 hover:bg-sky-700 text-white" onClick={executeTriggerCron}>
          Ya, Jalankan Sekarang
        </Button>
      </div>
    </div>
  </div>
)}
```

Render Toast banner at top-right of page:
```jsx
{toastMessage && (
  <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg border text-sm font-medium flex items-center gap-2 animate-in slide-in-from-top-2 duration-200 ${
    toastMessage.type === "error" ? "bg-rose-50 text-rose-800 border-rose-200" : "bg-emerald-50 text-emerald-800 border-emerald-200"
  }`}>
    <span>{toastMessage.message}</span>
  </div>
)}
```

- [ ] **Step 3: Verify syntax & commit Task 2**

Run: `node -c src/app/dashboard/monitoring/page.js`
Commit: `git add src/app/dashboard/monitoring/page.js` with message `fix(monitoring): add confirmation dialog for cron triggers, toast notifications, and SSE event batching`.

---

### Task 3: Add Search & Filtering to Cron Jobs, Logs, and Audit Tables

**Files:**
- Modify: `src/app/dashboard/monitoring/page.js`

**Interfaces:**
- Consumes: `cronFilter`, `logFilter`, `auditFilter`.
- Produces: Instant client-side text filtering across all tables & terminal stream.

- [ ] **Step 1: Filter Cron Jobs list with search bar**

```javascript
const filteredCronJobs = Array.isArray(cronJobs)
  ? cronJobs.filter(
      (job) =>
        job.name.toLowerCase().includes(cronFilter.toLowerCase()) ||
        (job.description && job.description.toLowerCase().includes(cronFilter.toLowerCase())) ||
        (job.cronExpression && job.cronExpression.includes(cronFilter)),
    )
  : [];
```
Render `<input type="text" placeholder="Cari nama/deskripsi cron..." value={cronFilter} onChange={(e) => setCronFilter(e.target.value)} />` in the Cron Jobs tab header.

- [ ] **Step 2: Filter Database Queries & Errors with audit search bar**

```javascript
const filteredSlowQueries = Array.isArray(slowQueries)
  ? slowQueries.filter((q) => q.query.toLowerCase().includes(auditFilter.toLowerCase()))
  : [];

const filteredErrors = Array.isArray(errors)
  ? errors.filter(
      (e) =>
        e.path.toLowerCase().includes(auditFilter.toLowerCase()) ||
        e.errorMessage.toLowerCase().includes(auditFilter.toLowerCase()),
    )
  : [];
```

- [ ] **Step 3: Verify build & syntax**

Run: `node -c src/app/dashboard/monitoring/page.js`

- [ ] **Step 4: Commit Task 3**

```bash
git add src/app/dashboard/monitoring/page.js
git commit -m "feat(monitoring): add search and filtering controls for cron jobs, logs, and database audit tables"
```

---

## Plan Self-Review

1. **Spec coverage**:
   - Tabbed layout: Task 1.
   - P0 Confirmation Modal & Toast: Task 2.
   - P0 Throttled SSE Queue: Task 2.
   - Search & Filtering controls: Task 3.
   - Humanized Indonesian Cron Tooltips: Task 1 & Task 2.
2. **Placeholder scan**: No TODOs or vague placeholders.
3. **Type consistency**: Variable names (`activeTab`, `selectedCronJob`, `toastMessage`, `cronFilter`, `logFilter`, `auditFilter`) consistent across tasks.
