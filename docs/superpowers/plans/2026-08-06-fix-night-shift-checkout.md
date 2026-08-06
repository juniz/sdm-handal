# Fix Night Shift Checkout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mencegah checkout sebelum jam pulang dan memperbolehkan checkout mulai tepat pada jam pulang, termasuk shift Malam lintas tengah malam.

**Architecture:** Backend repository mengembalikan detail jam shift bersama presensi aktif. Frontend memakai `jamMasuk`/`jamPulang` itu untuk menghitung `expectedCheckout` berbasis datetime, sementara backend GraphQL menghitung ulang target berdasarkan data database dan waktu server sebelum membuka transaksi checkout. Tidak ada perubahan skema database atau alur auto-checkout.

**Tech Stack:** Next.js/React, Moment.js, NestJS, TypeScript, Jest, GraphQL, MySQL.

## Global Constraints

- Checkout diperbolehkan mulai tepat pada jam pulang (`>=`).
- Shift Malam ditandai `jam_pulang < jam_masuk` dan checkout-nya berada satu hari setelah `jam_datang`.
- Timestamp dari client tidak digunakan untuk menentukan kelayakan checkout; gunakan waktu server backend.
- Validasi lokasi, transaksi checkout, auto-checkout, dan skema database tidak diubah.
- Perubahan dibatasi pada alur absensi checkout dan test terkait.

---

### Task 1: Tambahkan regression test dan validasi server-side pada GraphQL backend

**Files:**
- Create: `/Users/hardiko/Documents/Developer/NEXT/website/backend/src/sdm/attendance.service.spec.ts`
- Modify: `/Users/hardiko/Documents/Developer/NEXT/website/backend/src/sdm/repositories/attendance.repository.ts:88-123`
- Modify: `/Users/hardiko/Documents/Developer/NEXT/website/backend/src/sdm/attendance.service.ts:232-237,381-447`
- Modify: `/Users/hardiko/Documents/Developer/NEXT/website/backend/src/sdm/attendance.resolver.ts:39-55`

**Interfaces:**
- Consumes: `AttendanceRepository.getTodayAttendance(idPegawai)` yang mengembalikan presensi aktif dengan `shift`, `jam_datang`, `jam_masuk`, dan `jam_pulang` dari join `jam_masuk`.
- Produces: `AttendanceService.checkOut()` yang melempar `BadRequestException` sebelum transaksi jika waktu server belum mencapai target checkout.

- [ ] **Step 1: Tulis test gagal untuk shift normal sebelum jam pulang**

Buat mock repository yang mengembalikan presensi aktif lengkap dengan `jam_masuk` dan `jam_pulang`, mock `dataSource.transaction`, lalu panggil `service.checkOut(123, validInput)` pada waktu yang dikontrol. Pastikan exception dilempar serta `transaction` tidak dipanggil. Definisikan `validInput` sekali pada scope `describe`:

Kasus minimum (letakkan `validInput` dan mock factory pada scope `describe` agar dipakai semua test):

```ts
it('rejects normal-shift checkout before scheduled time', async () => {
  jest.useFakeTimers().setSystemTime(new Date('2026-08-06T16:59:59+07:00'));
  repository.getTodayAttendance.mockResolvedValue({
    id: 123,
    shift: 'Pagi',
    jam_datang: '2026-08-06 08:00:00',
    jam_masuk: '08:00:00',
    jam_pulang: '17:00:00',
    status: 'Tepat Waktu',
    keterlambatan: '00:00:00',
    photo: null,
  });

  await expect(service.checkOut(123, validInput)).rejects.toThrow(
    'Belum waktunya presensi pulang',
  );
  expect(dataSource.transaction).not.toHaveBeenCalled();
});
```

Fixture bersama yang dipakai oleh test di atas dan test boundary berikut:

```ts
const validInput = {
  photo: null,
  timestamp: '2026-08-06 16:59:59',
  latitude: '-6.2',
  longitude: '106.8',
  isCheckingOut: true,
  securityData: { confidence: 80, accuracy: 10, warnings: [] },
};
```

Jangan memanggil database nyata dalam unit test. Set `process.env.ENABLE_LOCATION_VALIDATION = 'false'` pada setup test atau gunakan koordinat/security fixture yang valid agar assertion hanya menguji waktu checkout dan transaction boundary.

- [ ] **Step 2: Jalankan test untuk memastikan reproduksi gagal**

Run from `/Users/hardiko/Documents/Developer/NEXT/website/backend`:

```bash
rtk npm test -- --runInBand src/sdm/attendance.service.spec.ts
```

Expected: FAIL karena `checkOut()` saat ini langsung menjalankan transaction.

- [ ] **Step 3: Tambahkan test untuk seluruh batas waktu**

Gunakan helper fixture yang sama dan kontrol waktu sistem untuk kasus berikut:

```ts
it('rejects night-shift checkout at 20:05 on the check-in date', async () => {
  jest.useFakeTimers().setSystemTime(new Date('2026-08-06T20:05:00+07:00'));
  repository.getTodayAttendance.mockResolvedValue({
    id: 123, shift: 'Malam', jam_datang: '2026-08-06 20:00:00',
    jam_masuk: '20:00:00', jam_pulang: '06:59:00',
    status: 'Tepat Waktu', keterlambatan: '00:00:00', photo: null,
  });
  await expect(service.checkOut(123, validInput)).rejects.toThrow('Belum waktunya presensi pulang');
  expect(dataSource.transaction).not.toHaveBeenCalled();
});

it('rejects night-shift checkout at 06:58:59 on the next date', async () => {
  jest.useFakeTimers().setSystemTime(new Date('2026-08-07T06:58:59+07:00'));
  repository.getTodayAttendance.mockResolvedValue({
    id: 123, shift: 'Malam', jam_datang: '2026-08-06 20:00:00',
    jam_masuk: '20:00:00', jam_pulang: '06:59:00',
    status: 'Tepat Waktu', keterlambatan: '00:00:00', photo: null,
  });
  await expect(service.checkOut(123, validInput)).rejects.toThrow('Belum waktunya presensi pulang');
  expect(dataSource.transaction).not.toHaveBeenCalled();
});

it('allows night-shift checkout exactly at 06:59:00', async () => {
  jest.useFakeTimers().setSystemTime(new Date('2026-08-07T06:59:00+07:00'));
  repository.getTodayAttendance.mockResolvedValue({
    id: 123, shift: 'Malam', jam_datang: '2026-08-06 20:00:00',
    jam_masuk: '20:00:00', jam_pulang: '06:59:00',
    status: 'Tepat Waktu', keterlambatan: '00:00:00', photo: null,
  });
  dataSource.transaction.mockImplementation(async (callback) => callback({ query: jest.fn() }));
  await expect(service.checkOut(123, validInput)).resolves.toMatchObject({ success: true });
  expect(dataSource.transaction).toHaveBeenCalledTimes(1);
});

it('does not trust a future client timestamp', async () => {
  jest.useFakeTimers().setSystemTime(new Date('2026-08-06T16:59:59+07:00'));
  repository.getTodayAttendance.mockResolvedValue({
    id: 123, shift: 'Pagi', jam_datang: '2026-08-06 08:00:00',
    jam_masuk: '08:00:00', jam_pulang: '17:00:00',
    status: 'Tepat Waktu', keterlambatan: '00:00:00', photo: null,
  });
  await expect(service.checkOut(123, { ...validInput, timestamp: '2026-08-06 17:00:00' }))
    .rejects.toThrow('Belum waktunya presensi pulang');
  expect(dataSource.transaction).not.toHaveBeenCalled();
});
```

Pisahkan test shift normal dan shift Malam agar fixture tanggalnya eksplisit. Tambahkan test bahwa `input.timestamp` yang dibuat lebih maju tidak dapat memaksa checkout lebih awal.

- [ ] **Step 4: Jalankan test baru untuk memastikan test masih gagal hanya pada implementasi**

```bash
rtk npm test -- --runInBand src/sdm/attendance.service.spec.ts
```

Expected: test sebelum waktunya gagal pada implementasi, sedangkan test yang memeriksa checkout valid tetap dapat memverifikasi transaction path.

- [ ] **Step 5: Sertakan detail shift pada presensi aktif dan response GraphQL**

Di `AttendanceRepository.getTodayAttendance`, tambahkan `LEFT JOIN jam_masuk jm ON temporary_presensi.shift = jm.shift` dan pilih `jm.jam_masuk` serta `jm.jam_pulang`. Di resolver, teruskan kedua nilai itu ke object `TodayAttendance`.

- [ ] **Step 6: Implementasikan helper target checkout di service**

Tambahkan private helper terfokus berikut di `AttendanceService`:

```ts
private getExpectedCheckout(
  jamDatang: string | Date,
  jamMasuk: string,
  jamPulang: string,
): moment.Moment {
  const expected = moment(
    `${moment(jamDatang).format('YYYY-MM-DD')} ${jamPulang}`,
    'YYYY-MM-DD HH:mm:ss',
  );
  if (jamPulang < jamMasuk) expected.add(1, 'day');
  return expected;
}
```

Di awal `checkOut()`, setelah `existing` ditemukan dan sebelum menghitung durasi/transaksi, hitung target dari `existing.jam_datang`, `existing.jam_masuk`, dan `existing.jam_pulang`, lalu tolak dengan `BadRequestException` bila `moment().isBefore(expectedCheckout)`. Pesan harus mencantumkan `expectedCheckout.format('HH:mm')`. Jangan memakai `input.timestamp`.

- [ ] **Step 7: Jalankan test backend sampai lulus**

```bash
rtk npm test -- --runInBand src/sdm/attendance.service.spec.ts
```

Expected: PASS untuk shift normal, shift Malam sebelum/tepat/setelah jam pulang, bypass timestamp client, dan checkout valid.

- [ ] **Step 8: Commit perubahan backend**

```bash
rtk git add src/sdm/repositories/attendance.repository.ts src/sdm/attendance.service.ts src/sdm/attendance.resolver.ts src/sdm/attendance.service.spec.ts
rtk git commit -m "fix: enforce checkout time on attendance service"
```

### Task 2: Perbaiki perhitungan waktu checkout pada frontend

**Files:**
- Modify: `/Users/hardiko/Documents/Developer/NEXT/sdm/src/lib/attendance-gql-client.js:116-132,141-149`
- Modify: `/Users/hardiko/Documents/Developer/NEXT/sdm/src/app/dashboard/attendance/page.js:340-346`

**Interfaces:**
- Consumes: `todayAttendance.jamDatang`, `todayAttendance.jamMasuk`, dan `todayAttendance.jamPulang` dari query GraphQL yang diperbarui pada Task 1.
- Produces: state `isCheckingOut` yang hanya `true` jika waktu sekarang sudah mencapai `expectedCheckout`.

- [ ] **Step 1: Tambahkan helper datetime kecil di file halaman**

Perbarui selection GraphQL di `src/lib/attendance-gql-client.js`: pada query `InitialLoad` dan query `attendanceToday`, minta `jamMasuk` dan `jamPulang` di dalam `data`. Biarkan field result-level `jamPulang` tetap ada karena dipakai untuk kompatibilitas state yang sudah berjalan.

Setelah data tersedia, tambahkan helper datetime kecil di file halaman.

Gunakan Moment untuk membentuk target dari tanggal `todayAttendance.jamDatang` dan jam shift. Jangan membandingkan `HH:mm:ss` sebagai string:

```js
const getExpectedCheckout = (attendance, jamPulang, jamMasuk) => {
  if (!attendance?.jamDatang || !jamPulang || !jamMasuk) return null;
  const expected = moment(
    `${moment(attendance.jamDatang).format('YYYY-MM-DD')} ${jamPulang}`,
    'YYYY-MM-DD HH:mm:ss',
  );
  if (jamPulang < jamMasuk) expected.add(1, 'day');
  return expected;
};
```

Jangan menebak shift Malam berdasarkan label shift; gunakan perbandingan `jamPulang < jamMasuk`.

- [ ] **Step 2: Ubah effect status checkout**

Ganti logika `jamNow > jamPulang` dengan perbandingan moment:

```js
const expectedCheckout = getExpectedCheckout(
  todayAttendance,
  todayAttendance?.jamPulang,
  todayAttendance?.jamMasuk,
);
setIsCheckingOut(Boolean(expectedCheckout && !moment().isBefore(expectedCheckout)));
```

Pastikan effect memiliki dependency `[todayAttendance, formattedTime]` sehingga `useRealTime` yang sudah ada memicu evaluasi ulang setiap detik. Jangan menambah polling baru.

- [ ] **Step 3: Jalankan lint frontend**

Run from `/Users/hardiko/Documents/Developer/NEXT/sdm`:

```bash
rtk npm run lint
```

Expected: lint selesai tanpa error baru dari perubahan checkout.

- [ ] **Step 4: Commit perubahan frontend**

```bash
rtk git add src/lib/attendance-gql-client.js src/app/dashboard/attendance/page.js
rtk git commit -m "fix: handle night shift checkout date in UI"
```

### Task 3: Verifikasi lint/build dan skenario end-to-end

**Files:**
- Verify: `/Users/hardiko/Documents/Developer/NEXT/website/backend`
- Verify: `/Users/hardiko/Documents/Developer/NEXT/sdm`

**Interfaces:**
- Consumes: backend validation and frontend `isCheckingOut` behavior from Tasks 1–2.
- Produces: verified checkout behavior with no database/schema changes.

- [ ] **Step 1: Jalankan seluruh test backend**

```bash
rtk npm test -- --runInBand
```

Expected: seluruh test backend lulus.

- [ ] **Step 2: Jalankan lint dan build frontend**

```bash
rtk npm run lint
rtk npm run build
```

Expected: lint dan build selesai tanpa error.

- [ ] **Step 3: Verifikasi diff dan status repository**

```bash
rtk git -C /Users/hardiko/Documents/Developer/NEXT/website/backend status --short
rtk git -C /Users/hardiko/Documents/Developer/NEXT/sdm status --short
rtk git -C /Users/hardiko/Documents/Developer/NEXT/website/backend diff HEAD~1 -- src/sdm/repositories/attendance.repository.ts src/sdm/attendance.service.ts src/sdm/attendance.resolver.ts src/sdm/attendance.service.spec.ts
rtk git -C /Users/hardiko/Documents/Developer/NEXT/sdm diff HEAD~1 -- src/lib/attendance-gql-client.js src/app/dashboard/attendance/page.js
```

Pastikan diff hanya mencakup perbaikan checkout dan test terkait. Jangan mengubah atau meng-commit perubahan pengguna yang sudah ada di working tree.
