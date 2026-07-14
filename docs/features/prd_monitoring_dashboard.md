# PRD: Backend Monitoring Dashboard

> **Project**: RS Bhayangkara Nganjuk — NestJS Backend + SDM Frontend  
> **Status**: Draft for Review  
> **Date**: 2026-07-14  

---

## 1. Overview

Admin membutuhkan visibilitas terhadap performa backend NestJS secara real-time. Saat ini tidak ada mekanisme monitoring terpusat — error, traffic, dan auth events hanya tersimpan di console log yang volatile. Fitur ini menambahkan sistem observabilitas terpadu yang mencakup:

- **Backend**: Pengumpulan & penyimpanan log berbasis file + streaming SSE
- **Frontend**: Halaman dashboard baru di `/dashboard/monitoring` pada SDM (Next.js)

---

## 2. Goals & Non-Goals

### Goals
- Admin dapat memantau traffic, error, dan auth events tanpa akses langsung ke server
- Data tersedia real-time via Server-Sent Events (SSE) 
- Log tersimpan persisten di file, auto-cleanup setelah 30 hari
- Akses diamankan dengan SDM JWT guard + role filter (admin/superadmin)

### Non-Goals
- Tidak menggunakan external APM tools (Grafana, Datadog, Sentry)
- Tidak menyimpan log ke database MySQL
- Tidak ada alerting/notifikasi (email, Telegram, dsb) — v1 scope only

---

## 3. Stakeholders

| Role | Kebutuhan |
|---|---|
| Admin / Superadmin SDM | Akses dashboard monitoring |
| Backend Developer | Integrasi interceptor & logger |

---

## 4. User Stories

| ID | Sebagai... | Saya ingin... | Agar... |
|---|---|---|---|
| US-01 | Admin | Melihat summary traffic hari ini | Mengetahui volume request dan error rate sekilas |
| US-02 | Admin | Melihat grafik traffic per jam | Mendeteksi spike atau degradasi performa |
| US-03 | Admin | Melihat 10 endpoint terlambat | Menemukan bottleneck untuk dioptimasi |
| US-04 | Admin | Melihat daftar error/exception terbaru | Merespons insiden dengan cepat |
| US-05 | Admin | Melihat daftar auth failure terbaru | Mendeteksi potensi brute force |
| US-06 | Admin | Stream log file secara real-time | Debugging tanpa perlu SSH ke server |
| US-07 | Admin | Filter log berdasarkan rentang waktu | Investigasi insiden historis |

---

## 5. Metrics yang Dikumpulkan

### 5.1 HTTP REST Traffic Log
Dikumpulkan via **LoggingInterceptor** (baru) yang dibungkus di `AppModule`.

```
timestamp | method | path | statusCode | responseTimeMs | ip | userAgent
```

### 5.2 GraphQL Operation Log
Dikumpulkan via **GraphQL plugin** atau interceptor context `graphql`.

```
timestamp | operationType | operationName | resolverPath | durationMs | error?
```

### 5.3 Error / Exception Log
Dikumpulkan di **HttpExceptionFilter** (modifikasi) + global unhandled rejection handler.

```
timestamp | statusCode | path | method | errorMessage | stackTrace | ip
```

### 5.4 Auth Log
Dikumpulkan di **JWT Strategy** ketika validasi gagal, atau di auth guard.

```
timestamp | event (LOGIN_ATTEMPT | JWT_FAILURE | BRUTE_FORCE_SUSPECT) | ip | username? | reason
```

---

## 6. Arsitektur Backend

### 6.1 Modul Baru: `MonitorModule`

```
src/monitor/
├── monitor.module.ts
├── monitor.controller.ts       # REST endpoints + SSE
├── monitor.service.ts          # Baca/query log file
├── logger/
│   ├── app-logger.service.ts   # Winston atau native fs writer
│   ├── log-rotation.service.ts # Cron job 30-day cleanup
│   └── log-types.ts            # TypeScript types untuk log entries
└── interceptors/
    └── logging.interceptor.ts  # Ganti/extend TransformInterceptor
```

### 6.2 File Log Structure

```
logs/
├── traffic-YYYY-MM-DD.log      # HTTP REST traffic
├── graphql-YYYY-MM-DD.log      # GraphQL ops
├── error-YYYY-MM-DD.log        # Exceptions
└── auth-YYYY-MM-DD.log         # Auth events
```

Format setiap baris: **NDJSON** (newline-delimited JSON) agar mudah di-parse.

### 6.3 Log Retention

- **Cron job harian** (menggunakan `@nestjs/schedule`) menghapus file log yang berumur >30 hari
- Berjalan setiap tengah malam: `0 0 * * *`

### 6.4 REST Endpoints Monitor

| Method | Path | Deskripsi |
|---|---|---|
| `GET` | `/api/v1/monitor/summary` | Aggregated stats hari ini (total req, error rate, avg RT) |
| `GET` | `/api/v1/monitor/traffic` | Traffic per jam (24h terakhir atau rentang custom) |
| `GET` | `/api/v1/monitor/errors` | Daftar error terbaru (paginated) |
| `GET` | `/api/v1/monitor/auth-events` | Daftar auth failure/events terbaru |
| `GET` | `/api/v1/monitor/slow-endpoints` | Top 10 endpoint terlambat |
| `GET` | `/api/v1/monitor/logs/stream` | **SSE stream** — push log entries real-time |
| `GET` | `/api/v1/monitor/logs/download` | Download file log (query param: `type`, `date`) |

**Query params umum**: `from`, `to` (ISO date), `limit`, `page`

### 6.5 SSE (Server-Sent Events)

- Endpoint `/monitor/logs/stream` menggunakan `@Sse()` decorator NestJS
- Backend menggunakan **`fs.watch` atau `tail -f` equivalent** (via `readline` + `fs.watchFile`) untuk detect baris baru di log file
- Push event tiap ada baris baru di log file aktif
- Client (frontend) menggunakan `EventSource` API

### 6.6 Security

- Semua endpoint `MonitorController` dilindungi `@UseGuards(JwtSdmGuard)`
- Tambahkan role check: hanya `ADMIN` dan `SUPERADMIN` yang bisa akses (via existing RBAC decorator `@Roles`)
- Rate limiting tetap berlaku via `GqlThrottlerGuard` global

---

## 7. Arsitektur Frontend (SDM Next.js)

### 7.1 Route Baru

```
src/app/dashboard/monitoring/
├── page.jsx              # Main monitoring page
├── layout.jsx            # (opsional) Monitoring-specific layout
└── components/
    ├── SummaryCards.jsx  # Total req, error rate, avg RT
    ├── TrafficChart.jsx  # Line chart traffic per jam (recharts/chart.js)
    ├── ErrorTable.jsx    # Recent errors dengan stack trace expandable
    ├── AuthEventTable.jsx # Recent auth failures
    ├── SlowEndpointsBar.jsx # Horizontal bar chart top 10 slowest
    ├── MethodPieChart.jsx  # Pie chart by HTTP method
    └── LogViewer.jsx     # SSE log stream viewer (terminal-like UI)
```

### 7.2 UI Widget Plan

| Widget | Tipe | Data Source |
|---|---|---|
| **Summary Cards** | KPI Cards (4 cards) | `/monitor/summary` |
| **Traffic Volume** | Line chart per jam | `/monitor/traffic` |
| **Error Rate Trend** | Overlay di traffic chart | `/monitor/traffic` |
| **Recent Errors** | Table + expandable row | `/monitor/errors` |
| **Auth Failures** | Table | `/monitor/auth-events` |
| **Slowest Endpoints** | Horizontal bar chart | `/monitor/slow-endpoints` |
| **Method Distribution** | Pie/donut chart | `/monitor/summary` |
| **Live Log Stream** | Terminal-style SSE viewer | `/monitor/logs/stream` |

### 7.3 Refresh Strategy

- Summary, charts, tables: **polling setiap 30 detik** (fallback jika SSE putus)
- Log viewer: **SSE real-time** via `EventSource`
- Manual refresh button tersedia di header

---

## 8. Implementation Plan (Fase)

### Fase 1 — Backend Core (Week 1)
- [ ] Setup `MonitorModule` + `AppLoggerService` (file writer NDJSON)
- [ ] Buat `LoggingInterceptor` — capture HTTP traffic
- [ ] Modifikasi `HttpExceptionFilter` — log error ke file
- [ ] Modifikasi JWT Strategy — log auth events
- [ ] GraphQL plugin/interceptor untuk operation logging

### Fase 2 — Backend API (Week 1-2)
- [ ] `MonitorController` dengan semua REST endpoints
- [ ] Parser/query engine untuk NDJSON log files
- [ ] SSE endpoint (`/monitor/logs/stream`)
- [ ] `LogRotationService` dengan cron 30-hari

### Fase 3 — Frontend (Week 2)
- [ ] Route `/dashboard/monitoring`
- [ ] SummaryCards, TrafficChart
- [ ] ErrorTable, AuthEventTable  
- [ ] SlowEndpointsBar, MethodPieChart
- [ ] LogViewer (SSE EventSource)

### Fase 4 — Polish (Week 3)
- [ ] Date range filter di UI
- [ ] Log download button
- [ ] Error handling SSE reconnect
- [ ] Mobile responsive

---

## 9. Dependencies Baru

### Backend
| Package | Alasan |
|---|---|
| `winston` | Logger library dengan file transport dan rotation support |
| `winston-daily-rotate-file` | File rotation harian (meski manual cleanup 30 hari, ini lebih robust) |
| `@nestjs/schedule` | Cron job untuk log cleanup |

### Frontend
| Package | Alasan |
|---|---|
| `recharts` atau `chart.js + react-chartjs-2` | Chart library untuk grafik |

---

## 10. Open Questions

> [!IMPORTANT]
> **Q1**: Apakah `winston` sudah terinstall di backend? Jika tidak, apakah boleh menambah package, atau prefer implementasi custom `fs.appendFile` saja?

> [!IMPORTANT]
> **Q2**: Di SDM frontend, library chart apa yang sudah ada? Kalau belum ada, pakai `recharts` (lighter) atau `chart.js`?

> [!NOTE]
> **Q3**: Apakah log viewer perlu fitur search/filter di UI, atau cukup stream raw?

> [!NOTE]
> **Q4**: Brute force detection — apakah perlu threshold otomatis (misal: 5 gagal dalam 5 menit = flag "SUSPECT"), atau cukup log tiap failure tanpa logic otomatis?

---

## 11. Verification Plan

### Backend
- Unit test `MonitorService` — parse NDJSON log file
- Integration test endpoint `GET /monitor/summary` dengan mock log file
- Manual test SSE endpoint via `curl -N /api/v1/monitor/logs/stream`

### Frontend
- Visual test semua widget dengan data mock
- SSE reconnect behavior saat backend restart
- Role guard test — user non-admin harus dapat 403

