"use client";

import { useState, useEffect, useRef, useCallback, Fragment } from "react";
import { 
  Activity, 
  Clock, 
  AlertTriangle, 
  RefreshCcw, 
  ShieldAlert, 
  Download,
  CalendarDays,
  PieChart
} from "lucide-react";
import { getClientToken } from "@/lib/client-auth";
import LogViewer from "@/components/development/LogViewer";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

// SSE reconnect with exponential backoff
const SSE_BACKOFF = [3000, 6000, 12000, 30000];

export default function MonitoringPage() {
  const [summary, setSummary] = useState(null);
  const [traffic, setTraffic] = useState([]);
  const [slowEndpoints, setSlowEndpoints] = useState([]);
  const [errors, setErrors] = useState([]);
  const [authEvents, setAuthEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedErrorIdx, setExpandedErrorIdx] = useState(null);
  const [expandedSlowIdx, setExpandedSlowIdx] = useState(null);

  // Helper to format local Date object to YYYY-MM-DD
  const formatDateLocal = (date) => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Date range filter
  const today = new Date().toISOString().split("T")[0];
  const [dateRange, setDateRange] = useState({
    from: new Date(),
    to: new Date(),
  });

  // SSE and controlled LogViewer states
  const [logs, setLogs] = useState([]);
  const [isPaused, setIsPaused] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef(null);

  const buildDateParams = () => {
    const params = new URLSearchParams();
    if (dateRange?.from) params.set("from", formatDateLocal(dateRange.from));
    if (dateRange?.to) params.set("to", formatDateLocal(dateRange.to));
    return params.toString() ? `?${params.toString()}` : "";
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const token = getClientToken();
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
    const qs = buildDateParams();

    try {
      const [summaryRes, trafficRes, slowRes, errorsRes, authRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/v1/monitor/summary${qs}`, { headers }),
        fetch(`${BACKEND_URL}/api/v1/monitor/traffic${qs}`, { headers }),
        fetch(`${BACKEND_URL}/api/v1/monitor/slow-endpoints${qs}`, { headers }),
        fetch(`${BACKEND_URL}/api/v1/monitor/errors?limit=10${qs ? "&" + qs.slice(1) : ""}`, { headers }),
        fetch(`${BACKEND_URL}/api/v1/monitor/auth-events?limit=10${qs ? "&" + qs.slice(1) : ""}`, { headers }),
      ]);

      if (summaryRes.ok) {
        const resJson = await summaryRes.json();
        setSummary(resJson.data || null);
      }
      if (trafficRes.ok) {
        const resJson = await trafficRes.json();
        setTraffic(resJson.data || []);
      }
      if (slowRes.ok) {
        const resJson = await slowRes.json();
        setSlowEndpoints(resJson.data || []);
      }
      if (errorsRes.ok) {
        const resJson = await errorsRes.json();
        setErrors(resJson.data?.data || []);
      }
      if (authRes.ok) {
        const resJson = await authRes.json();
        setAuthEvents(resJson.data?.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch monitoring data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [dateRange]);

  const handleRealtimeLog = (payload) => {
    const { type, entry } = payload;
    if (!entry) return;

    // Only apply real-time updates to chart/summary if today's date is currently viewed.
    const todayStr = new Date().toISOString().split("T")[0];
    const isShowingToday = (!dateRange?.from || formatDateLocal(dateRange.from) === todayStr) && 
                           (!dateRange?.to || formatDateLocal(dateRange.to) === todayStr);

    if (!isShowingToday) return;

    const isError = type === "error" || (type === "graphql" && entry.hasError);

    // 1. Update Summary KPIs
    setSummary((prev) => {
      if (!prev) return null;
      const nextTotal = prev.totalRequests + 1;
      const prevErrors = Math.round(prev.totalRequests * (prev.errorRate / 100));
      const nextErrors = isError ? prevErrors + 1 : prevErrors;
      const errorRate = nextTotal > 0 ? (nextErrors / nextTotal) * 100 : 0;
      const latency = type === "traffic" ? entry.responseTimeMs : (type === "graphql" ? entry.durationMs : 0);
      let nextAvg = prev.avgResponseTime;
      if (latency > 0 && !isError) {
        const prevSuccessful = prev.totalRequests * (1 - prev.errorRate / 100);
        const nextSuccessful = prevSuccessful + 1;
        const prevSum = prevSuccessful * prev.avgResponseTime;
        nextAvg = (prevSum + latency) / nextSuccessful;
      }
      const nextMethods = [...(prev.methods || [])];
      const method = entry.method || (type === "graphql" ? "POST" : null);
      if (method) {
        const idx = nextMethods.findIndex(m => m.name === method);
        if (idx !== -1) {
          nextMethods[idx] = { ...nextMethods[idx], value: nextMethods[idx].value + 1 };
        } else {
          nextMethods.push({ name: method, value: 1 });
        }
      }
      return {
        totalRequests: nextTotal,
        errorRate: parseFloat(errorRate.toFixed(2)),
        avgResponseTime: parseFloat(nextAvg.toFixed(0)),
        methods: nextMethods
      };
    });

    // 2. Update Traffic chart
    if (entry.timestamp) {
      try {
        const hour = new Date(entry.timestamp).getHours();
        setTraffic((prev) => {
          if (!prev || prev.length === 0) return prev;
          const next = [...prev];
          if (next[hour]) {
            next[hour] = { ...next[hour], [isError ? "errors" : "requests"]: next[hour][isError ? "errors" : "requests"] + 1 };
          }
          return next;
        });
      } catch { /* ignore */ }
    }

    // 3. Update Slow Endpoints
    const latency = type === "traffic" ? entry.responseTimeMs : (type === "graphql" ? entry.durationMs : 0);
    if (latency > 0) {
      const method = type === "traffic" ? entry.method : "GQL";
      const path = type === "traffic" ? entry.path : `${entry.operationType || "query"} ${entry.operationName}`;
      setSlowEndpoints((prev) => {
        const next = [...prev];
        const idx = next.findIndex(e => e.method === method && e.path === path);
        if (idx !== -1) {
          const item = next[idx];
          const nextCalls = item.calls + 1;
          const nextAvg = (item.avgResponseTime * item.calls + latency) / nextCalls;
          next[idx] = { ...item, calls: nextCalls, avgResponseTime: parseFloat(nextAvg.toFixed(0)) };
        } else {
          next.push({ method, path, avgResponseTime: latency, calls: 1 });
        }
        return next.sort((a, b) => b.avgResponseTime - a.avgResponseTime).slice(0, 10);
      });
    }

    // 4. Update Errors table
    if (isError) {
      setErrors((prev) => {
        const newError = {
          method: entry.method || "GQL",
          path: entry.path || `${entry.operationType || "query"} ${entry.operationName}`,
          errorMessage: entry.errorMessage || (entry.errors ? entry.errors[0]?.message : "GraphQL Error"),
          stackTrace: entry.stackTrace || (entry.errors ? JSON.stringify(entry.errors, null, 2) : ""),
          statusCode: entry.statusCode || 500,
          timestamp: entry.timestamp
        };
        return [newError, ...prev].slice(0, 10);
      });
    }

    // 5. Update Auth events
    if (type === "auth") {
      setAuthEvents((prev) => [entry, ...prev].slice(0, 10));
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // SSE manager with exponential backoff reconnect
  useEffect(() => {
    if (isPaused) return;

    let es = null;
    let retryCount = 0;
    let cancelled = false;

    const connect = () => {
      if (cancelled) return;

      const streamUrl = `${BACKEND_URL}/api/v1/monitor/logs/stream`;
      es = new EventSource(streamUrl, { withCredentials: true });

      es.onopen = () => {
        if (cancelled) { es.close(); return; }
        retryCount = 0;
        setIsConnected(true);
      };

      es.onmessage = (event) => {
        try {
          const rawPayload = JSON.parse(event.data);
          const payload = rawPayload.data ? rawPayload.data : rawPayload;
          if (!payload || !payload.entry) return;

          setLogs((prev) => {
            const next = [...prev, payload];
            return next.length > 200 ? next.slice(next.length - 200) : next;
          });

          handleRealtimeLog(payload);
        } catch (err) {
          console.error("Error parsing log stream event:", err);
        }
      };

      es.onerror = () => {
        if (cancelled) return;
        es.close();
        setIsConnected(false);
        // Exponential backoff: 3s → 6s → 12s → 30s → 30s...
        const delay = SSE_BACKOFF[Math.min(retryCount, SSE_BACKOFF.length - 1)];
        retryCount++;
        retryTimerRef.current = setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      cancelled = true;
      clearTimeout(retryTimerRef.current);
      if (es) { es.close(); }
      setIsConnected(false);
    };
  }, [isPaused]);

  // --- SVG CHARTS ---

  // Traffic line chart with dual lines (requests + error rate overlay)
  const renderTrafficChart = () => {
    if (traffic.length === 0) return null;

    const width = 600;
    const height = 180;
    const padding = 25;
    const maxReq = Math.max(...traffic.map(d => d.requests + d.errors), 10);

    const toX = (i) => padding + (i * (width - padding * 2)) / (traffic.length - 1);
    const toY = (val, maxVal) => height - padding - (val / maxVal) * (height - padding * 2);

    // Request line points
    const reqPoints = traffic.map((d, i) => ({
      x: toX(i), y: toY(d.requests, maxReq), ...d
    }));
    // Error line points (use same y scale for visual comparison)
    const errPoints = traffic.map((d, i) => ({
      x: toX(i), y: toY(d.errors, maxReq)
    }));

    const buildPath = (pts) => {
      if (pts.length === 0) return "";
      let p = `M ${pts[0].x} ${pts[0].y}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const xc = (pts[i].x + pts[i + 1].x) / 2;
        const yc = (pts[i].y + pts[i + 1].y) / 2;
        p += ` Q ${pts[i].x} ${pts[i].y}, ${xc} ${yc}`;
      }
      p += ` L ${pts[pts.length - 1].x} ${pts[pts.length - 1].y}`;
      return p;
    };

    const reqPath = buildPath(reqPoints);
    const errPath = buildPath(errPoints);
    const reqAreaPath = `${reqPath} L ${reqPoints[reqPoints.length - 1].x} ${height - padding} L ${reqPoints[0].x} ${height - padding} Z`;

    return (
      <div className="relative w-full h-[220px]">
        <div className="absolute top-0 right-0 flex items-center gap-4 text-[10px] font-medium pr-1">
          <span className="flex items-center gap-1"><span className="inline-block w-3 h-0.5 bg-sky-500 rounded" />Requests</span>
          <span className="flex items-center gap-1"><span className="inline-block w-3 h-0.5 bg-rose-400 rounded" />Errors</span>
        </div>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = padding + ratio * (height - padding * 2);
            const val = Math.round(maxReq * (1 - ratio));
            return (
              <g key={idx} className="opacity-20">
                <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#cbd5e1" strokeDasharray="3,3" />
                <text x={padding - 5} y={y + 4} textAnchor="end" fontSize="9" fill="#64748b" className="font-mono">{val}</text>
              </g>
            );
          })}

          <path d={reqAreaPath} fill="url(#chartGradient)" />
          <path d={reqPath} fill="none" stroke="#0ea5e9" strokeWidth="2.5" strokeLinecap="round" />
          <path d={errPath} fill="none" stroke="#fb7185" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="4,2" />

          {reqPoints.map((pt, i) => {
            if (i % 4 !== 0) return null;
            return (
              <text key={i} x={pt.x} y={height - 5} textAnchor="middle" fontSize="9" fill="#64748b" className="font-mono opacity-80">
                {pt.hour}
              </text>
            );
          })}
        </svg>
      </div>
    );
  };

  // Method Distribution donut chart
  const renderMethodDonut = () => {
    const methods = summary?.methods;
    if (!methods || methods.length === 0) {
      return <div className="text-slate-400 text-sm text-center py-8">Tidak ada data method.</div>;
    }

    const COLORS = ["#0ea5e9", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#64748b"];
    const total = methods.reduce((s, m) => s + m.value, 0);
    const cx = 80; const cy = 80; const r = 65; const ir = 42;

    // Special case for a single method (100% donut)
    if (methods.length === 1) {
      const m = methods[0];
      const color = COLORS[0];
      const strokeWidth = r - ir;
      const midRadius = (r + ir) / 2;
      return (
        <div className="flex items-center gap-4">
          <svg viewBox="0 0 160 160" className="w-[120px] h-[120px] flex-shrink-0">
            <circle
              cx={cx}
              cy={cy}
              r={midRadius}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              opacity="0.9"
            />
            <text x={cx} y={cy - 5} textAnchor="middle" fontSize="13" fontWeight="bold" fill="#1e293b">{total}</text>
            <text x={cx} y={cy + 11} textAnchor="middle" fontSize="8" fill="#64748b">req</text>
          </svg>
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
              <span className="font-mono font-semibold text-slate-700 w-10">{m.name}</span>
              <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-300" style={{ width: `100%`, backgroundColor: color }} />
              </div>
              <span className="text-slate-500 text-[10px] w-8 text-right">100%</span>
            </div>
          </div>
        </div>
      );
    }

    let startAngle = -Math.PI / 2;
    const slices = methods.map((m, i) => {
      const frac = m.value / total;
      const angle = Math.min(frac * 2 * Math.PI, 2 * Math.PI - 0.001);
      const endAngle = startAngle + angle;
      const x1 = cx + r * Math.cos(startAngle);
      const y1 = cy + r * Math.sin(startAngle);
      const x2 = cx + r * Math.cos(endAngle);
      const y2 = cy + r * Math.sin(endAngle);
      const ix1 = cx + ir * Math.cos(startAngle);
      const iy1 = cy + ir * Math.sin(startAngle);
      const ix2 = cx + ir * Math.cos(endAngle);
      const iy2 = cy + ir * Math.sin(endAngle);
      const largeArc = angle > Math.PI ? 1 : 0;
      const d = `M ${ix1} ${iy1} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${ir} ${ir} 0 ${largeArc} 0 ${ix1} ${iy1} Z`;
      const slice = { d, color: COLORS[i % COLORS.length], name: m.name, value: m.value, pct: Math.round(frac * 100) };
      startAngle = endAngle;
      return slice;
    });

    return (
      <div className="flex items-center gap-4">
        <svg viewBox="0 0 160 160" className="w-[120px] h-[120px] flex-shrink-0">
          {slices.map((s, i) => (
            <path key={i} d={s.d} fill={s.color} opacity="0.9" />
          ))}
          <text x={cx} y={cy - 5} textAnchor="middle" fontSize="13" fontWeight="bold" fill="#1e293b">{total}</text>
          <text x={cx} y={cy + 11} textAnchor="middle" fontSize="8" fill="#64748b">req</text>
        </svg>
        <div className="space-y-1.5 flex-1 min-w-0">
          {slices.map((s, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
              <span className="font-mono font-semibold text-slate-700 w-10">{s.name}</span>
              <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-300" style={{ width: `${s.pct}%`, backgroundColor: s.color }} />
              </div>
              <span className="text-slate-500 text-[10px] w-8 text-right">{s.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Slow Endpoints horizontal bar chart
  const renderSlowEndpointsBar = () => {
    if (slowEndpoints.length === 0) {
      return <div className="text-slate-400 text-sm text-center py-8">Tidak ada data latency.</div>;
    }

    const top5 = slowEndpoints.slice(0, 5);
    const maxMs = Math.max(...top5.map(e => e.avgResponseTime), 1);
    const METHOD_COLORS = { GET: "#10b981", POST: "#8b5cf6", PUT: "#f59e0b", DELETE: "#ef4444", GQL: "#6366f1", PATCH: "#0ea5e9" };

    return (
      <div className="space-y-3">
        {top5.map((ep, i) => {
          const pct = (ep.avgResponseTime / maxMs) * 100;
          const color = METHOD_COLORS[ep.method] || "#64748b";
          return (
            <div key={i} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
              <div 
                className="space-y-1 cursor-pointer hover:bg-slate-50 p-1.5 rounded transition-colors"
                onClick={() => setExpandedSlowIdx(expandedSlowIdx === i ? null : i)}
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1 mr-2">
                    <span className="font-bold px-1.5 py-0.5 rounded text-[10px] flex-shrink-0" style={{ backgroundColor: `${color}20`, color }}>
                      {ep.method}
                    </span>
                    <span className="font-mono text-slate-600 truncate">{ep.path}</span>
                  </div>
                  <span className="text-slate-800 font-semibold flex-shrink-0">{ep.avgResponseTime} ms</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-400">
                  <span>{ep.calls}x panggilan</span>
                  <span className="text-[#0093dd] text-[9px] hover:underline">
                    {expandedSlowIdx === i ? "Tutup detail" : "Lihat detail execution"}
                  </span>
                </div>
              </div>

              {expandedSlowIdx === i && ep.slowestCall && (
                <div className="mt-2 bg-slate-900 text-slate-200 p-3 rounded-lg font-mono text-[10px] space-y-2 border border-slate-800 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="flex justify-between border-b border-slate-800 pb-1.5 mb-1.5 text-slate-400">
                    <span className="font-bold text-slate-300">SLOWEST EXECUTION DETAILS</span>
                    <span>{new Date(ep.slowestCall.timestamp).toLocaleString()}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-slate-300">
                    <div>
                      <span className="text-slate-500 font-bold">Latency:</span>{" "}
                      <span className="text-rose-400 font-semibold">{ep.slowestCall.durationMs} ms</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold">Client IP:</span> <span>{ep.slowestCall.ip}</span>
                    </div>
                  </div>

                  {ep.slowestCall.userAgent && (
                    <div className="truncate text-slate-300">
                      <span className="text-slate-500 font-bold">User Agent:</span> <span className="text-[9px]">{ep.slowestCall.userAgent}</span>
                    </div>
                  )}

                  {ep.slowestCall.query && Object.keys(ep.slowestCall.query).length > 0 && (
                    <div>
                      <div className="text-slate-500 font-bold mb-1">Query Parameters:</div>
                      <pre className="bg-slate-950 p-2 rounded overflow-x-auto text-[9px] text-sky-300 max-h-[100px]">
                        {JSON.stringify(ep.slowestCall.query, null, 2)}
                      </pre>
                    </div>
                  )}

                  {ep.slowestCall.variables && Object.keys(ep.slowestCall.variables).length > 0 && (
                    <div>
                      <div className="text-slate-500 font-bold mb-1">GraphQL Variables:</div>
                      <pre className="bg-slate-950 p-2 rounded overflow-x-auto text-[9px] text-purple-300 max-h-[100px]">
                        {JSON.stringify(ep.slowestCall.variables, null, 2)}
                      </pre>
                    </div>
                  )}

                  {ep.slowestCall.body && Object.keys(ep.slowestCall.body).length > 0 && (
                    <div>
                      <div className="text-slate-500 font-bold mb-1">Request Body / Payload:</div>
                      <pre className="bg-slate-950 p-2 rounded overflow-x-auto text-[9px] text-emerald-300 max-h-[100px]">
                        {JSON.stringify(ep.slowestCall.body, null, 2)}
                      </pre>
                    </div>
                  )}

                  {!ep.slowestCall.query && !ep.slowestCall.body && !ep.slowestCall.variables && (
                    <div className="text-slate-500 italic py-1">Tidak ada payload atau query parameters terdeteksi.</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const handleDownloadLogs = (type) => {
    const token = getClientToken();
    const date = dateRange?.to ? formatDateLocal(dateRange.to) : today;
    const url = `${BACKEND_URL}/api/v1/monitor/logs/download?type=${type}&date=${date}`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.blob();
      })
      .then(blob => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = `${type}-${date}.log`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      })
      .catch(() => alert("Gagal mengunduh file log: Akses ditolak"));
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">System Monitor</h2>
          <p className="text-slate-500 text-sm">Pantau traffic, performa latency, error rate, dan log audit backend secara real-time.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Date Range Filter */}
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          <Button onClick={fetchData} variant="outline" className="h-9 border-slate-200" disabled={isLoading}>
            <RefreshCcw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={() => handleDownloadLogs("traffic")} variant="default" className="h-9 bg-[#0093dd] hover:bg-[#007ebb]">
            <Download className="mr-2 h-4 w-4" />
            Unduh Log Traffic
          </Button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-slate-100 shadow-sm bg-gradient-to-br from-white to-blue-50/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Requests</CardTitle>
            <Activity className="h-4 w-4 text-[#0093dd]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{summary?.totalRequests ?? 0}</div>
            <p className="text-xs text-slate-500 mt-1">Total traffic HTTP &amp; GraphQL terdeteksi</p>
          </CardContent>
        </Card>

        <Card className="border-slate-100 shadow-sm bg-gradient-to-br from-white to-purple-50/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Rata-rata Latency</CardTitle>
            <Clock className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{summary?.avgResponseTime ?? 0} ms</div>
            <p className="text-xs text-slate-500 mt-1">Waktu pemrosesan request HTTP &amp; GraphQL</p>
          </CardContent>
        </Card>

        <Card className="border-slate-100 shadow-sm bg-gradient-to-br from-white to-rose-50/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Error Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">{summary?.errorRate ?? 0}%</div>
            <p className="text-xs text-slate-500 mt-1">Rasio request berakhir kegagalan</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Traffic Chart (dual line) */}
        <Card className="col-span-2 border-slate-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-700">Volume Traffic per Jam</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading && traffic.length === 0 ? (
              <div className="h-[180px] flex items-center justify-center text-slate-400">Memuat grafik...</div>
            ) : renderTrafficChart()}
          </CardContent>
        </Card>

        {/* Method Distribution Donut */}
        <Card className="border-slate-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold text-slate-700">Distribusi Method</CardTitle>
            <PieChart className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            {renderMethodDonut()}
          </CardContent>
        </Card>
      </div>

      {/* Slow Endpoints Bar Chart */}
      <Card className="border-slate-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-700">Endpoint Terlambat (Top 5)</CardTitle>
        </CardHeader>
        <CardContent>
          {renderSlowEndpointsBar()}
        </CardContent>
      </Card>

      {/* Live Log Stream */}
      <LogViewer logs={logs} isConnected={isConnected} isPaused={isPaused} setIsPaused={setIsPaused} onClear={() => setLogs([])} />

      {/* Errors + Auth Tables */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Errors */}
        <Card className="border-slate-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold text-slate-700 flex items-center">
              <AlertTriangle className="h-4 w-4 text-rose-500 mr-2" />
              Exception &amp; Error Terbaru
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => handleDownloadLogs("error")} className="text-xs h-7 border-slate-200">
              Unduh Log Error
            </Button>
          </CardHeader>
          <CardContent>
            <div className="max-h-[300px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px] text-xs">Method</TableHead>
                    <TableHead className="text-xs">Path &amp; Message</TableHead>
                    <TableHead className="w-[80px] text-xs text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {errors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-slate-400 py-10 text-xs">Tidak ada error tercatat.</TableCell>
                    </TableRow>
                  ) : errors.map((err, idx) => (
                    <Fragment key={idx}>
                      <TableRow
                        className="hover:bg-slate-50 cursor-pointer"
                        onClick={() => setExpandedErrorIdx(expandedErrorIdx === idx ? null : idx)}
                      >
                        <TableCell className="font-bold text-xs">{err.method}</TableCell>
                        <TableCell className="text-xs">
                          <div className="font-mono text-slate-600 truncate max-w-[250px]">{err.path}</div>
                          <div className="text-rose-600 font-medium truncate max-w-[250px]">{err.errorMessage}</div>
                        </TableCell>
                        <TableCell className="text-right text-xs">
                          <Badge variant="destructive">{err.statusCode}</Badge>
                        </TableCell>
                      </TableRow>
                      {expandedErrorIdx === idx && (
                        <TableRow className="bg-slate-50/50">
                          <TableCell colSpan={3} className="p-3">
                            <div className="bg-slate-900 text-slate-200 p-3 rounded-lg font-mono text-[10px] whitespace-pre-wrap overflow-x-auto max-h-[150px]">
                              {err.stackTrace || "No stack trace available."}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Recent Auth Events */}
        <Card className="border-slate-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold text-slate-700 flex items-center">
              <ShieldAlert className="h-4 w-4 text-amber-500 mr-2" />
              Log Audit Keamanan (Auth)
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => handleDownloadLogs("auth")} className="text-xs h-7 border-slate-200">
              Unduh Log Auth
            </Button>
          </CardHeader>
          <CardContent>
            <div className="max-h-[300px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px] text-xs">Waktu</TableHead>
                    <TableHead className="text-xs">Event / IP</TableHead>
                    <TableHead className="text-xs">Keterangan / Alasan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {authEvents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-slate-400 py-10 text-xs">Tidak ada log keamanan tercatat.</TableCell>
                    </TableRow>
                  ) : authEvents.map((evt, idx) => (
                    <TableRow key={idx} className="hover:bg-slate-50">
                      <TableCell className="text-xs font-mono text-slate-500">
                        {new Date(evt.timestamp).toLocaleTimeString()}
                      </TableCell>
                      <TableCell className="text-xs">
                        <Badge className="bg-amber-100 text-amber-800 border-none font-bold text-[10px] mb-1">{evt.event}</Badge>
                        <div className="font-mono text-slate-500 text-[10px]">{evt.ip}</div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">{evt.reason || evt.path}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
