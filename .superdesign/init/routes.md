# Route Map

Framework: Next.js App Router. Routes are file-based under `src/app`.

## Relevant Route

- URL: `/dashboard/izin`
- Entry: `src/app/dashboard/izin/page.js`
- Layout chain:
  - `src/app/layout.js`
  - `src/app/dashboard/layout.js`
- Page summary: card titled **Pengajuan Izin** containing tabs for a submission form and izin history.
- Route-local components:
  - `src/app/dashboard/izin/components/PengajuanIzinForm.js`
  - `src/app/dashboard/izin/components/DaftarIzin.js`

## Related API

- URL: `/api/izin`
- Entry: `src/app/api/izin/route.js`
- Methods used by the page: `GET`, `POST`, `DELETE`.

## Other Key Dashboard Routes

- `/dashboard` → `src/app/dashboard/page.js`
- `/dashboard/profile` → `src/app/dashboard/profile/page.js`
- `/dashboard/cuti` → `src/app/dashboard/cuti/page.js`
- `/dashboard/pengajuan-tukar-dinas` → `src/app/dashboard/pengajuan-tukar-dinas/page.js`
- `/dashboard/reports` → `src/app/dashboard/reports/page.js`

There is no central router configuration; Next.js derives paths from the filesystem.
