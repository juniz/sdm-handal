# Desain: Popup Notifikasi Revisi Penilaian Harian (Native App Style)

**Tanggal:** 2026-08-05  
**Status:** Approved  
**Tujuan:** Mengganti alert banner inline `PenilaianRevisiAlert` dengan popup card overlay bergaya native app notification (Option B — Notification Card style).

---

## Konteks

Implementasi sebelumnya menggunakan alert banner inline di dalam konten dashboard. Pendekatan baru menggunakan komponen fixed-overlay yang tidak mendorong layout konten, memiliki collapsed/expanded state, dan tampilan lebih familiar bagi pengguna mobile.

Tidak ada perubahan backend, API proxy, atau hook — hanya perubahan tampilan frontend.

---

## Arsitektur & Komponen

### Komponen

| Komponen | Aksi | Keterangan |
|---|---|---|
| `src/components/notifications/RevisiNotifPopup.js` | **NEW** | Komponen popup card utama |
| `src/components/notifications/PenilaianRevisiAlert.js` | **DELETE** | Digantikan oleh RevisiNotifPopup |
| `src/app/dashboard/page.js` | **MODIFY** | Swap import PenilaianRevisiAlert → RevisiNotifPopup |
| `src/app/dashboard/penilaian-kinerja/input/page.js` | **MODIFY** | Hapus import & usage PenilaianRevisiAlert (popup tidak muncul di halaman input) |

### Scope Halaman

- Popup **hanya muncul di halaman Dashboard** (`/dashboard`).
- Halaman Input Penilaian Harian (`/dashboard/penilaian-kinerja/input`) **tidak** menampilkan popup, tapi tetap mendukung `?tanggal=YYYY-MM-DD` URL param untuk pre-select tanggal (logika ini sudah ada dan tidak diubah).

### Hook & Data

Hook `usePenilaianRevisiNotif` digunakan tanpa perubahan:
```js
const { revisiList, loading, markAsRead } = usePenilaianRevisiNotif();
```
- Fetch 1x saat mount, tidak ada polling.
- `markAsRead(id)` memanggil `PUT /api/notifications/penilaian-revisi` → set `revisi_is_read = TRUE`.

---

## Visual Design

### Positioning

```
[App Header — fixed top-0]
[RevisiNotifPopup — fixed top-[header-height], z-40]
[Dashboard content — normal flow, tidak terpengaruh]
```

- `position: fixed`, di bawah header app.
- **Mobile** (`< md`): `left-4 right-4` — full width dengan horizontal margin.
- **Desktop/Tablet** (`≥ md`): `max-w-sm right-4` — card kecil pojok kanan bawah header.
- `z-40` — di atas konten tapi di bawah modal/drawer jika ada.

### Collapsed State (default)

Tampilan saat komponen pertama kali muncul:

```
┌─────────────────────────────────────────────────────┐
│  🔔  Revisi Diperlukan   [N]   ▼   ✕               │
└─────────────────────────────────────────────────────┘
```

- Background: `white`
- Border: `border border-orange-200`
- Shadow: `shadow-lg`
- Rounded: `rounded-2xl`
- Icon bell: `text-orange-500`, efek `animate-bounce` 1x saat mount
- Badge count `[N]`: pill `bg-orange-500 text-white text-xs font-bold`
- Chevron `▼`: rotate 0° (collapsed) / 180° (expanded), transisi smooth
- Tombol `✕` (header close): dismiss seluruh card dari view (session-only, tidak memanggil `markAsRead`)

### Expanded State (setelah tap/klik header)

```
┌─────────────────────────────────────────────────────┐
│  🔔  Revisi Diperlukan   [N]   ▲   ✕               │
├─────────────────────────────────────────────────────┤
│  📅  DD MMMM YYYY                      [Buka →] ✕  │
│      "catatan supervisor..."                        │
├─────────────────────────────────────────────────────┤
│  📅  DD MMMM YYYY                      [Buka →] ✕  │
│      "catatan supervisor..."                        │
└─────────────────────────────────────────────────────┘
```

- Card body muncul di bawah header bar.
- `max-h-72 overflow-y-auto` — scrollable jika banyak item.
- Setiap item:
  - Icon kalender `📅` + tanggal format `DD MMMM YYYY` (bold)
  - Catatan supervisor: italic, `line-clamp-2`, warna gray
  - Tombol `Buka →`: navigasi ke `/dashboard/penilaian-kinerja/input?tanggal=YYYY-MM-DD`
  - Tombol `✕` per-item: memanggil `markAsRead(id)` → optimistic remove dari list
- Jika semua item di-dismiss → card fade out dan hilang

### Animasi (Framer Motion)

Framer Motion sudah tersedia di project (`FloatingNotification.js` sudah menggunakannya).

| Elemen | Animasi |
|---|---|
| Entry card saat mount | `y: -20 → 0, opacity: 0 → 1`, duration 0.3s |
| Expand/collapse body | `height: 0 → auto, opacity: 0 → 1`, duration 0.25s |
| Exit card (dismiss all) | `opacity: 1 → 0, y: 0 → -10`, duration 0.2s |
| Dismiss item | `opacity: 1 → 0, height: auto → 0`, duration 0.2s |

---

## State Management

State internal `RevisiNotifPopup` (tidak perlu context atau zustand):

```js
const [isExpanded, setIsExpanded] = useState(false);
const [isDismissed, setIsDismissed] = useState(false);
```

| State | Trigger | Efek |
|---|---|---|
| `isDismissed = true` | Klik ✕ di header | Card hilang dari UI (session-only) |
| `isExpanded = true` | Klik area header card | Card body muncul dengan animasi |
| `revisiList.length === 0` | Semua item di-dismiss via `markAsRead` | Card hilang (return null) |

**Render condition:**
```js
if (loading || isDismissed || revisiList.length === 0) return null;
```

---

## Tidak Ada Perubahan Backend

Seluruh backend NestJS (resolver, service, repository) dan API proxy Next.js tidak berubah. Hanya lapisan presentasi frontend yang dimodifikasi.

---

## Checklist Implementasi

- [ ] Buat `RevisiNotifPopup.js` dengan collapsed/expanded state dan animasi Framer Motion
- [ ] Hapus `PenilaianRevisiAlert.js`
- [ ] Update `dashboard/page.js`: swap import
- [ ] Update `input/page.js`: hapus import & rendering `PenilaianRevisiAlert`
- [ ] Verifikasi build `npm run build` sukses
- [ ] Commit
