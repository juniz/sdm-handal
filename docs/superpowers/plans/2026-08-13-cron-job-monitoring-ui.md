# Cron Job Monitoring UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dedicated Cron Job Monitoring & Control Card to the SDM Server Monitoring dashboard (`src/app/dashboard/monitoring/page.js`), enabling administrators to view registered backend cron jobs, execution statuses/durations/next runs/logs, and trigger manual job executions via API.

**Architecture:** Extend `MonitoringPage` in `src/app/dashboard/monitoring/page.js` to fetch `/api/v1/monitor/cron-jobs`, manage `cronJobs`, `triggeringJob`, and `expandedCronIdx` states, render a UI `<Card>` with status badges, monospaced cron schedules, expandable execution/error logs, and manual trigger action buttons.

**Tech Stack:** Next.js (App Router, Client Component), React Hooks, Tailwind CSS, `lucide-react` icons, shadcn UI components (`Card`, `Table`, `Badge`, `Button`).

## Global Constraints

- Touch only `src/app/dashboard/monitoring/page.js`.
- Maintain existing visual style (Tailwind CSS, shadcn UI design system).
- Handle loading, error, and triggering states gracefully with proper feedback.

---

### Task 1: Add Cron Jobs State & Data Fetching

**Files:**
- Modify: `src/app/dashboard/monitoring/page.js`

**Interfaces:**
- Consumes: `GET ${BACKEND_URL}/api/v1/monitor/cron-jobs`
- Produces: `cronJobs` state array populated from API response.

- [ ] **Step 1: Define `cronJobs`, `triggeringJob`, and `expandedCronIdx` state variables**

In `src/app/dashboard/monitoring/page.js`:
```javascript
const [cronJobs, setCronJobs] = useState([]);
const [triggeringJob, setTriggeringJob] = useState(null);
const [expandedCronIdx, setExpandedCronIdx] = useState(null);
```

- [ ] **Step 2: Add `fetchCronJobs` function and integrate into `fetchData`**

Add `fetchCronJobs` callback:
```javascript
const fetchCronJobs = useCallback(async () => {
  const token = getClientToken();
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/monitor/cron-jobs`, { headers });
    if (res.ok) {
      const json = await res.json();
      setCronJobs(json.data || []);
    }
  } catch (err) {
    console.error("Failed to fetch cron jobs status:", err);
  }
}, []);
```
Call `fetchCronJobs()` inside `fetchData()`.

- [ ] **Step 3: Commit Task 1**

```bash
git add src/app/dashboard/monitoring/page.js
git commit -m "feat(monitoring): add cron jobs state and API fetch logic to monitoring page"
```

---

### Task 2: Add Cron Job Monitoring UI Card & Table Component

**Files:**
- Modify: `src/app/dashboard/monitoring/page.js`

**Interfaces:**
- Consumes: `cronJobs` state array, `expandedCronIdx`, `triggeringJob`.
- Produces: Rendered Cron Job Monitoring `<Card>` with table, badges, expandable details, and manual trigger button.

- [ ] **Step 1: Implement `handleTriggerCron` action function**

```javascript
const handleTriggerCron = async (jobName) => {
  if (triggeringJob) return;
  setTriggeringJob(jobName);
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
    if (res.ok && json.success) {
      alert(json.message || `Cron job ${jobName} berhasil dipicu.`);
      await fetchCronJobs();
    } else {
      alert(`Gagal memicu cron job: ${json.message || "Unknown error"}`);
    }
  } catch (err) {
    console.error("Error triggering cron job:", err);
    alert("Gagal memicu cron job: Terjadi kesalahan jaringan");
  } finally {
    setTriggeringJob(null);
  }
};
```

- [ ] **Step 2: Add Cron Job Status Badge helper**

```javascript
const renderCronStatusBadge = (job) => {
  if (job.isRunning) {
    return <Badge className="bg-amber-100 text-amber-800 border-amber-200 animate-pulse font-bold text-[10px]">BERJALAN...</Badge>;
  }
  switch (job.lastStatus) {
    case "SUCCESS":
      return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 font-bold text-[10px]">SUKSES</Badge>;
    case "FAILED":
      return <Badge className="bg-rose-100 text-rose-800 border-rose-200 font-bold text-[10px]">GAGAL</Badge>;
    default:
      return <Badge className="bg-slate-100 text-slate-600 border-slate-200 font-bold text-[10px]">BELUM PERNAH</Badge>;
  }
};
```

- [ ] **Step 3: Add Cron Jobs `<Card>` to page JSX layout**

Place the `<Card>` in the grid layout inside `src/app/dashboard/monitoring/page.js`:
```jsx
{/* Cron Jobs Monitoring Card */}
<Card className="border-slate-100 shadow-sm">
  <CardHeader className="flex flex-row items-center justify-between">
    <CardTitle className="text-base font-semibold text-slate-700 flex items-center">
      <CalendarDays className="h-4 w-4 text-sky-500 mr-2" />
      Pemantauan &amp; Jadwal Cron Job Backend
    </CardTitle>
    <Button variant="outline" size="sm" onClick={fetchCronJobs} className="text-xs h-7 border-slate-200">
      <RefreshCcw className="h-3 w-3 mr-1" />
      Refresh Status
    </Button>
  </CardHeader>
  <CardContent>
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs">Nama &amp; Deskripsi Job</TableHead>
            <TableHead className="w-[120px] text-xs">Jadwal (Cron)</TableHead>
            <TableHead className="w-[110px] text-xs">Status</TableHead>
            <TableHead className="w-[140px] text-xs">Eksekusi Terakhir</TableHead>
            <TableHead className="w-[140px] text-xs">Eksekusi Berikutnya</TableHead>
            <TableHead className="w-[130px] text-xs text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cronJobs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-slate-400 py-8 text-xs">
                Tidak ada data Cron Job terdaftar.
              </TableCell>
            </TableRow>
          ) : (
            cronJobs.map((job, idx) => (
              <Fragment key={idx}>
                <TableRow
                  className="hover:bg-slate-50 cursor-pointer"
                  onClick={() => setExpandedCronIdx(expandedCronIdx === idx ? null : idx)}
                >
                  <TableCell className="text-xs">
                    <div className="font-bold text-slate-800">{job.name}</div>
                    <div className="text-slate-500 text-[11px]">{job.description || "-"}</div>
                  </TableCell>
                  <TableCell className="text-xs">
                    <code className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono text-[11px]">
                      {job.cronExpression || "-"}
                    </code>
                  </TableCell>
                  <TableCell className="text-xs">
                    {renderCronStatusBadge(job)}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 font-mono">
                    {job.lastRunTime ? (
                      <div>
                        <div>{new Date(job.lastRunTime).toLocaleTimeString("id-ID", { hour12: false })}</div>
                        <div className="text-[10px] text-slate-400">
                          {job.lastDurationMs != null ? `${job.lastDurationMs} ms` : ""}
                        </div>
                      </div>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 font-mono">
                    {job.nextRunTime ? (
                      <div>
                        <div>{new Date(job.nextRunTime).toLocaleDateString("id-ID")}</div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(job.nextRunTime).toLocaleTimeString("id-ID", { hour12: false })}
                        </div>
                      </div>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="text-right text-xs" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs border-sky-200 text-sky-700 hover:bg-sky-50"
                      disabled={job.isRunning || triggeringJob === job.name}
                      onClick={() => handleTriggerCron(job.name)}
                    >
                      {triggeringJob === job.name ? (
                        <RefreshCcw className="h-3 w-3 animate-spin mr-1" />
                      ) : (
                        <RefreshCcw className="h-3 w-3 mr-1" />
                      )}
                      Jalankan
                    </Button>
                  </TableCell>
                </TableRow>

                {expandedCronIdx === idx && (
                  <TableRow className="bg-slate-50/50">
                    <TableCell colSpan={6} className="p-3">
                      <div className="space-y-2">
                        <div className="text-xs font-bold text-slate-600">Detail Eksekusi Terakhir ({job.name}):</div>
                        {job.lastStatus === "FAILED" ? (
                          <pre className="bg-slate-900 text-rose-300 p-3 rounded-lg font-mono text-[10px] whitespace-pre-wrap overflow-x-auto max-h-[150px]">
                            {job.lastError || "Terjadi kesalahan tanpa detail error message."}
                          </pre>
                        ) : job.lastResultSummary ? (
                          <pre className="bg-slate-900 text-emerald-300 p-3 rounded-lg font-mono text-[10px] whitespace-pre-wrap overflow-x-auto max-h-[150px]">
                            {job.lastResultSummary}
                          </pre>
                        ) : (
                          <div className="text-slate-400 italic text-xs">Belum ada ringkasan hasil eksekusi recorded.</div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  </CardContent>
</Card>
```

- [ ] **Step 4: Verify build with Next.js**

Run: `npm run build` or `npx next build` in `sdm` directory.
Expected: Build passes without syntax/JSX errors.

- [ ] **Step 5: Commit Task 2**

```bash
git add src/app/dashboard/monitoring/page.js
git commit -m "feat(monitoring): render Cron Job Monitoring card, status badges, and trigger button"
```

---

## Plan Self-Review

1. **Spec coverage**:
   - Status badges: Covered in Task 2.
   - Table rendering: Covered in Task 2.
   - Manual trigger action: Covered in Task 2.
   - Expandable log details: Covered in Task 2.
   - API Integration: Covered in Task 1 & Task 2.
2. **Placeholder scan**: No TBD/TODO or vague instructions.
3. **Type consistency**: All state names (`cronJobs`, `triggeringJob`, `expandedCronIdx`) and helper functions consistent across tasks.
