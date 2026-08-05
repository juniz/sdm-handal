# Notifikasi Revisi Penilaian Kinerja

## Background

Saat supervisor mengembalikan penilaian harian ke status `revisi`, pegawai tidak mendapat umpan balik visual kecuali mereka membuka halaman input secara manual. Fitur ini menambahkan alert banner di halaman dashboard dan halaman input penilaian harian agar pegawai langsung tahu ada penilaian yang perlu direvisi beserta catatan supervisor-nya.

## Scope

- Notifikasi muncul **hanya untuk pegawai** (bukan supervisor).
- Notifikasi dibatasi pada penilaian harian dengan `status = 'revisi'`.
- Tidak ada polling atau SSE — fetch satu kali saat halaman dibuka.
- Backend API menggunakan NestJS GraphQL, diakses lewat Next.js API proxy.

---

## Database

### Perubahan Schema

```sql
ALTER TABLE penilaian_harian
ADD COLUMN revisi_is_read BOOLEAN NOT NULL DEFAULT FALSE;
```

### Behavior

| Event | Efek pada `revisi_is_read` |
|---|---|
| Supervisor action `revisi` | Reset ke `FALSE` (tambah ke UPDATE yang sudah ada di `/api/penilaian/harian/[id]`) |
| Pegawai manual dismiss | Set `TRUE` via mutation |
| Pegawai submit ulang (`submitted`) | Tidak relevan — query filter `status='revisi'` sehingga otomatis tidak muncul |

---

## Backend — NestJS GraphQL

### File Baru

#### `src/sdm/dto/penilaian-notif-types.ts`
```ts
@ObjectType()
export class PenilaianRevisiNotifDto {
  @Field(() => Int)  id: number;
  @Field()           tanggal: string;         // YYYY-MM-DD
  @Field({ nullable: true }) catatan_supervisor?: string;
  @Field()           revisi_is_read: boolean;
}
```

#### `src/sdm/repositories/penilaian-notif.repository.ts`
- Method `getRevisiPending(pegawaiId: number)`:
  ```sql
  SELECT id, tanggal, catatan_supervisor, revisi_is_read
  FROM penilaian_harian
  WHERE pegawai_id = ? AND status = 'revisi' AND revisi_is_read = 0
  ORDER BY tanggal DESC
  ```
- Method `markAsRead(id: number, pegawaiId: number)`:
  ```sql
  UPDATE penilaian_harian
  SET revisi_is_read = TRUE
  WHERE id = ? AND pegawai_id = ?
  ```

#### `src/sdm/penilaian-notif.service.ts`
- Inject `PenilaianNotifRepository`.
- `getRevisiList(user)` → calls `getRevisiPending(user.id)`.
- `markRevisiRead(id, user)` → calls `markAsRead(id, user.id)`.

#### `src/sdm/penilaian-notif.resolver.ts`
- Guard: `GqlJwtSdmGuard`, `GqlThrottlerGuard`
- Query `penilaianRevisiList` → `[PenilaianRevisiNotifDto]`
- Mutation `markPenilaianRevisiRead(@Args('id', { type: () => Int }) id)` → `Boolean`

### Perubahan File

#### `src/sdm/sdm.module.ts`
- Tambah `PenilaianNotifResolver`, `PenilaianNotifService`, `PenilaianNotifRepository` ke `providers`.

---

## Next.js API Proxy

### File Baru: `src/app/api/notifications/penilaian-revisi/route.js`

**GET** — Ambil list revisi pending:
- Verify JWT dari cookie `auth_token`.
- Query GraphQL `penilaianRevisiList`.
- Return `{ success: true, data: [...] }`.

**PUT** — Mark as read:
- Body: `{ id: number }`.
- Mutation GraphQL `markPenilaianRevisiRead(id)`.
- Return `{ success: true }`.

---

## Next.js Frontend

### File Baru: `src/hooks/usePenilaianRevisiNotif.js`

```js
// Fetch 1x on mount, no polling
const usePenilaianRevisiNotif = () => {
  const [revisiList, setRevisiList] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchRevisi = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/notifications/penilaian-revisi');
    const data = await res.json();
    if (data.success) setRevisiList(data.data);
    setLoading(false);
  }, []);

  const markAsRead = async (id) => {
    await fetch('/api/notifications/penilaian-revisi', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setRevisiList(prev => prev.filter(item => item.id !== id));
  };

  useEffect(() => { fetchRevisi(); }, [fetchRevisi]);

  return { revisiList, loading, markAsRead };
};
```

### File Baru: `src/components/notifications/PenilaianRevisiAlert.js`

Banner komponen yang menampilkan daftar revisi pending:

```
┌──────────────────────────────────────────────────────────────┐
│ ⚠  Ada N penilaian harian yang perlu direvisi                │
│ ─────────────────────────────────────────────────────────    │
│  📅 03 Agu 2026  "Aktivitas kurang detail"   [Buka] [✕]     │
│  📅 02 Agu 2026  "Kegiatan tidak selesai"    [Buka] [✕]     │
└──────────────────────────────────────────────────────────────┘
```

- Klik **[Buka]**: navigate ke `/dashboard/penilaian-kinerja/input?tanggal=YYYY-MM-DD`.
- Klik **[✕]**: call `markAsRead(id)` → item hilang dari list.
- Jika `revisiList.length === 0`: komponen tidak render (null).
- Styling: konsisten dengan `NotificationAlert` yang ada.

### Perubahan File

#### `src/app/dashboard/page.js`
- Import dan render `<PenilaianRevisiAlert />` di atas konten dashboard.

#### `src/app/dashboard/penilaian-kinerja/input/page.js`
- Import dan render `<PenilaianRevisiAlert />` di bagian atas form.
- Baca query param `?tanggal=YYYY-MM-DD` dari URL (`useSearchParams`) untuk pre-select `selectedDate`.

#### `src/app/api/penilaian/harian/[id]/route.js`
- Pada action `revisi` (baris ~512): tambah `revisi_is_read: false` ke data UPDATE — reset flag agar notif muncul ulang jika supervisor revisi lebih dari sekali.

---

## Verification Plan

### Backend
```bash
cd /Users/hardiko/Documents/Developer/NEXT/website/backend
npm run build   # harus 0 error
```

### Frontend
```bash
cd /Users/hardiko/Documents/Developer/NEXT/sdm
npm run build   # harus 0 error
```

### Manual
1. Supervisor revisi penilaian → buka dashboard sebagai pegawai → banner muncul dengan catatan supervisor.
2. Klik [Buka] → navigasi ke `/input?tanggal=...` dengan tanggal ter-preselect.
3. Klik [✕] → item hilang dari banner.
4. Submit ulang penilaian → refresh halaman → banner tidak muncul lagi.
5. Supervisor revisi ulang → buka halaman baru → banner muncul kembali.
