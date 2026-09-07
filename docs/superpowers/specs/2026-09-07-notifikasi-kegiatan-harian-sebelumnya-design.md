# Design Specification: Notifikasi Pengisian Kegiatan Harian Hari Sebelumnya

## 1. Background

Pegawai seringkali lupa mengisi kegiatan harian atau lupa menekan tombol "Kirim ke Supervisor" (status masih `draft`) untuk hari-hari sebelumnya. Akibatnya, supervisor tidak dapat melakukan approval dan penilaian kinerja harian pegawai terhambat. 

Fitur ini menghadirkan popup alert interaktif di halaman Dashboard (`/dashboard`) yang mendeteksi tanggal-tanggal dalam 7 hari terakhir di mana pegawai seharusnya bekerja namun kegiatan hariannya belum diisi atau masih berstatus draft.

## 2. Scope & Target Kriteria

- **Rentang Waktu**: 7 hari kalender terakhir sebelum hari ini (`CURDATE() - INTERVAL 7 DAY` s.d. `CURDATE() - INTERVAL 1 DAY`). Hari ini tidak disertakan karena shift masih berjalan.
- **Kriteria Deteksi**:
  1. **Data Belum Diisi (`belum_isi`)**: Record di tabel `penilaian_harian` **belum ada**, tetapi pegawai memiliki jadwal masuk kerja pada tabel `jadwal_pegawai` atau `jadwal_tambahan` (shift tidak kosong, bukan `'OFF'`, dan bukan `'Libur'`).
  2. **Data Masih Draft (`draft`)**: Record di tabel `penilaian_harian` sudah dibuat tetapi statusnya masih `'draft'`.
- **Eksklusi**:
  - Record dengan status `'submitted'` atau `'approved'` tidak ditampilkan (sudah dikirim / dinilai).
  - Record dengan status `'revisi'` tidak ditampilkan di popup ini karena sudah ditangani secara khusus oleh `RevisiNotifPopup`.
  - Hari libur / off tanpa jadwal kerja tidak dianggap sebagai tanggungan kegiatan harian.
- **Target Halaman**: Halaman Dashboard (`sdm/src/app/dashboard/page.js`).
- **Aksi Cepat**: Setiap item memiliki tombol navigasi langsung ke `/dashboard/penilaian-kinerja/input?tanggal=YYYY-MM-DD`.

---

## 3. Architecture & Data Flow

```
┌───────────────────────────────────────────────────────────┐
│                    Dashboard Frontend                     │
│  src/app/dashboard/page.js                                │
│    ├── <RevisiNotifPopup />      (Amber - Revisi)         │
│    └── <KegiatanPendingPopup />  (Sky/Blue - Belum/Draft) │
└─────────────────────────────┬─────────────────────────────┘
                              │ calls hook
                              ▼
┌───────────────────────────────────────────────────────────┐
│              usePenilaianPendingNotif Hook                │
│  Fetch 1x on mount, cache dismiss di sessionStorage       │
└─────────────────────────────┬─────────────────────────────┘
                              │ GET
                              ▼
┌───────────────────────────────────────────────────────────┐
│           Next.js API Proxy Route (sdm)                   │
│  /api/notifications/penilaian-pending                     │
│  - Verifikasi JWT cookie auth_token                       │
│  - Eksekusi GraphQL Query                                 │
└─────────────────────────────┬─────────────────────────────┘
                              │ GraphQL over HTTP
                              ▼
┌───────────────────────────────────────────────────────────┐
│            NestJS Backend (website/backend)               │
│  PenilaianNotifResolver -> Query: penilaianPendingList    │
│  PenilaianNotifService -> getPendingList(user)            │
│  PenilaianNotifRepository -> getPendingPenilaian(id)      │
│  - Match jadwal_pegawai & jadwal_tambahan 7 hari kebelakang│
│  - Query penilaian_harian & count(kegiatan_harian)        │
└───────────────────────────────────────────────────────────┘
```

---

## 4. Backend Implementation (`website/backend`)

### 4.1. DTO: `src/sdm/dto/penilaian-notif-types.ts`

Tambahkan ObjectType GraphQL untuk data notifikasi pending:

```ts
@ObjectType()
export class PenilaianPendingNotifDto {
  @Field(() => Int, { nullable: true })
  id?: number;

  @Field()
  tanggal: string; // Format: YYYY-MM-DD

  @Field({ nullable: true })
  shift?: string;

  @Field()
  status: string; // 'belum_isi' | 'draft'

  @Field(() => Int)
  kegiatan_count: number;
}
```

### 4.2. Repository: `src/sdm/repositories/penilaian-notif.repository.ts`

Tambahkan method `getPendingPenilaian(pegawaiId: number)`:
- Query jadwal pegawai (`jadwal_pegawai` dan `jadwal_tambahan`) untuk bulan yang beririsan dengan 7 hari terakhir (bisa mencakup 1 atau 2 bulan jika tanggal berada di awal bulan).
- Loop setiap tanggal dari `H-7` hingga `H-1`:
  - Ambil shift dari kolom `h{day}` (`jadwal_pegawai` diprioritaskan, fallback ke `jadwal_tambahan`).
  - Filter: jika shift kosong, `'OFF'`, atau `'Libur'`, lewati.
  - Jika ada shift kerja:
    - Query tabel `penilaian_harian` pada tanggal tersebut untuk `pegawaiId`.
    - Jika tidak ditemukan record: masukkan ke list dengan `{ tanggal, shift, status: 'belum_isi', kegiatan_count: 0 }`.
    - Jika ditemukan record dan `status === 'draft'`: hitung jumlah item di `kegiatan_harian`, masukkan ke list dengan `{ id: row.id, tanggal, shift, status: 'draft', kegiatan_count }`.
    - Jika status `'submitted'`, `'approved'`, atau `'revisi'`: abaikan.
- Urutkan hasil descending berdasarkan `tanggal` (tanggal terbaru di urutan teratas).

### 4.3. Service & Resolver: `penilaian-notif.service.ts` & `penilaian-notif.resolver.ts`

- Tambahkan method `getPendingList(user: any): Promise<PenilaianPendingNotifDto[]>` pada `PenilaianNotifService`.
- Tambahkan GraphQL Query `@Query(() => [PenilaianPendingNotifDto], { name: 'penilaianPendingList' })` pada `PenilaianNotifResolver`.

---

## 5. Frontend Implementation (`sdm`)

### 5.1. Next.js API Proxy: `src/app/api/notifications/penilaian-pending/route.js`

- Membaca cookie `auth_token` dan verifikasi dengan `jose.jwtVerify`.
- Mengirim query GraphQL:
  ```graphql
  query {
    penilaianPendingList {
      id
      tanggal
      shift
      status
      kegiatan_count
    }
  }
  ```
- Mengembalikan response JSON `{ success: true, data: [...] }`.

### 5.2. React Hook: `src/hooks/usePenilaianPendingNotif.js`

- Fetch data 1x on mount ke endpoint `/api/notifications/penilaian-pending`.
- State `isDismissed` yang tersimpan di `sessionStorage` (`"kegiatan_pending_dismissed"`), sehingga jika pegawai menutup notifikasi pada sesi browser tersebut, popup tidak muncul berulang kali di setiap perpindahan halaman dalam sesi yang sama.
- Menyediakan handler `dismissItem(tanggal)` dan `dismissAll()`.

### 5.3. UI Component: `src/components/notifications/KegiatanPendingPopup.js`

- Gaya visual: Card overlay modern dengan tema Biru/Sky (`sky-500` / `blue-600`) beraksen kalender/jam, membedakannya secara visual dari notifikasi revisi yang bertema Amber (`amber-500`).
- Tampilan Header:
  - Icon `CalendarAlert` / `Clock`.
  - Teks: **"Kegiatan Belum Dikirim"**.
  - Badge counter jumlah hari pending.
  - Tombol toggle expand/collapse (panah dropdown).
  - Tombol dismiss [X].
- Tampilan List (saat expanded):
  - Nama hari & tanggal Indonesia lengkap menggunakan `moment` (misal: "Senin, 06 Sep 2026").
  - Label Shift (misal: "Pagi", "Non Shift").
  - Status Tag:
    - `status === 'draft'`: Badge kuning/amber bertuliskan `"Draft (N kegiatan)"`.
    - `status === 'belum_isi'`: Badge abu/merah bertuliskan `"Belum Diisi"`.
  - Tombol aksi **[Isi / Kirim]** dengan icon `ExternalLink`: navigasi langsung ke `/dashboard/penilaian-kinerja/input?tanggal=YYYY-MM-DD`.

### 5.4. Dashboard Stacking: `src/app/dashboard/page.js`

Agar kedua popup (`RevisiNotifPopup` dan `KegiatanPendingPopup`) tidak bertumpuk di koordinat yang sama (`fixed top-16 right-6`), kita bungkus dalam container notification stack yang rapi:
```jsx
{/* Floating Notifications Stack */}
<div className="fixed top-16 left-4 right-4 md:left-auto md:right-6 md:w-96 z-40 space-y-3 pointer-events-none">
  <RevisiNotifPopup />
  <KegiatanPendingPopup />
</div>
```
Komponen di dalamnya memiliki `pointer-events-auto` sehingga klik tetap berfungsi normal dan jika keduanya aktif, keduanya tampil berjejer secara vertikal.

---

## 6. Verification Plan

### 6.1. Automated Build Verification
1. **Backend Build**:
   ```bash
   cd /Users/hardiko/Documents/Developer/NEXT/website/backend
   npm run build
   ```
   Pastikan tidak ada error kompilasi TypeScript dan schema GraphQL ter-generate dengan benar.
2. **Frontend Build**:
   ```bash
   cd /Users/hardiko/Documents/Developer/NEXT/sdm
   npm run build
   ```
   Pastikan Next.js build sukses tanpa error lint/type.

### 6.2. Functional & Manual Verification
1. **Skenario Belum Diisi**:
   - Pegawai memiliki jadwal masuk kerja pada tanggal kemarin (misal: Shift Pagi).
   - Belum ada record `penilaian_harian` pada tanggal tersebut.
   - Buka `/dashboard`: Popup "Kegiatan Belum Dikirim" muncul dengan status "Belum Diisi".
   - Klik tombol [Isi / Kirim] -> diarahkan ke `/dashboard/penilaian-kinerja/input?tanggal=...`.
2. **Skenario Masih Draft**:
   - Pegawai sudah membuat penilaian harian dan menyimpan kegiatan harian, tetapi belum menekan "Kirim ke Supervisor" (status `draft`).
   - Buka `/dashboard`: Muncul notifikasi dengan label "Draft (X kegiatan)".
3. **Skenario Libur / OFF**:
   - Hari kemarin jadwal pegawai adalah `'OFF'` atau `'Libur'`.
   - Buka `/dashboard`: Tanggal tersebut tidak masuk dalam daftar notifikasi.
4. **Skenario Dismiss**:
   - Pegawai mengklik tombol close [X] -> popup tertutup dan tidak muncul kembali selama sesi browser aktif.
