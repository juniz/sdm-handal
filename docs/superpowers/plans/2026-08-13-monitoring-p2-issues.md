# P2 Issues Resolution Plan for Server Monitoring

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve the two P2 issues identified in the Impeccable Critique:
1. Add Hospital / SDM Domain Context Badges (`[SDM-Penilaian]`, `[System-Log]`, `[SIMRS]`, `[Keamanan]`) to Cron Jobs and Slow Endpoints.
2. Add Severity Level Filter Buttons (`ALL`, `TRAFFIC`, `GRAPHQL`, `ERROR`, `AUTH`) to `LogViewer.jsx` in the Live Terminal tab.

**Architecture:**
1. Update `src/components/development/LogViewer.jsx` to include interactive type/severity filter buttons (`selectedType`: `'all'`, `'traffic'`, `'graphql'`, `'error'`, `'auth'`).
2. Update `src/app/dashboard/monitoring/page.js` to assign domain badges to Cron Jobs and Endpoints based on service/route.

**Tech Stack:** Next.js, React Hooks, Tailwind CSS, Lucide Icons, shadcn UI Badges.

## Global Constraints

- Touch only `src/components/development/LogViewer.jsx` and `src/app/dashboard/monitoring/page.js`.
- Verify JavaScript syntax with `node -c`.

---

### Task 1: Add Severity Level Filter Buttons to `LogViewer.jsx`

**Files:**
- Modify: `src/components/development/LogViewer.jsx`

- [ ] **Step 1: Add `selectedType` filter state to `LogViewer`**

In `src/components/development/LogViewer.jsx`:
```jsx
const [selectedType, setSelectedType] = useState("all");
```

- [ ] **Step 2: Filter logs array by `selectedType` and render filter buttons**

```jsx
const filteredLogs = logs.filter((log) => selectedType === "all" || log.type === selectedType);
```

Render filter pills in header:
```jsx
<div className="flex items-center space-x-1 bg-gray-950 p-1 rounded-lg border border-gray-800">
  {["all", "traffic", "graphql", "error", "auth"].map((type) => (
    <button
      key={type}
      onClick={() => setSelectedType(type)}
      className={`px-2 py-0.5 text-[10px] font-mono rounded capitalize transition-colors ${
        selectedType === type ? "bg-sky-600 text-white font-bold" : "text-gray-400 hover:text-gray-200"
      }`}
    >
      {type}
    </button>
  ))}
</div>
```

- [ ] **Step 3: Verify syntax & commit Task 1**

Run: `node -c src/components/development/LogViewer.jsx`
Commit: `git add src/components/development/LogViewer.jsx` with message `feat(monitoring): add severity/type level filter buttons to Live LogViewer`.

---

### Task 2: Add Hospital & SDM Domain Context Badges

**Files:**
- Modify: `src/app/dashboard/monitoring/page.js`

- [ ] **Step 1: Add domain badge helper functions**

In `src/app/dashboard/monitoring/page.js`:
```javascript
const getCronDomainBadge = (jobName) => {
  if (jobName.toLowerCase().includes("approval") || jobName.toLowerCase().includes("penilaian")) {
    return <Badge className="bg-sky-100 text-sky-800 border-sky-200 font-bold text-[10px] mr-1.5">SDM-Penilaian</Badge>;
  }
  if (jobName.toLowerCase().includes("log") || jobName.toLowerCase().includes("rotation")) {
    return <Badge className="bg-slate-100 text-slate-700 border-slate-200 font-bold text-[10px] mr-1.5">System-Log</Badge>;
  }
  return <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 font-bold text-[10px] mr-1.5">Backend-Task</Badge>;
};

const getEndpointDomainBadge = (path = "") => {
  const p = path.toLowerCase();
  if (p.includes("pegawai") || p.includes("sdm") || p.includes("cuti") || p.includes("presensi")) {
    return <Badge className="bg-sky-50 text-sky-700 border-sky-200 text-[9px] px-1 py-0 font-bold">SDM</Badge>;
  }
  if (p.includes("auth") || p.includes("login") || p.includes("profile")) {
    return <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[9px] px-1 py-0 font-bold">Keamanan</Badge>;
  }
  if (p.includes("pasien") || p.includes("dokter") || p.includes("rawat") || p.includes("bios")) {
    return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px] px-1 py-0 font-bold">SIMRS</Badge>;
  }
  return null;
};
```

- [ ] **Step 2: Render domain badges in Cron Jobs table and Slow Endpoints bar chart**

In Cron Jobs table row:
```jsx
<TableCell className="text-xs">
  <div className="flex items-center gap-1">
    {getCronDomainBadge(job.name)}
    <span className="font-bold text-slate-800">{job.name}</span>
  </div>
  <div className="text-slate-500 text-[11px] mt-0.5">{job.description || "-"}</div>
</TableCell>
```

In Slow Endpoints bar chart:
```jsx
<div className="flex items-center gap-1.5 min-w-0 flex-1 mr-2">
  <span className="font-bold px-1.5 py-0.5 rounded text-[10px] flex-shrink-0" style={{ backgroundColor: `${color}20`, color }}>
    {ep.method}
  </span>
  {getEndpointDomainBadge(ep.path)}
  <span className="font-mono text-slate-600 truncate">{ep.path}</span>
</div>
```

- [ ] **Step 3: Verify syntax & commit Task 2**

Run: `node -c src/app/dashboard/monitoring/page.js`
Commit: `git add src/app/dashboard/monitoring/page.js` with message `feat(monitoring): add hospital & SDM domain context badges to cron jobs and slow endpoints`.
