# OneSignal Push Notification Admin Menu & REST API Design Specification

- **Date**: 2026-09-09
- **Target Application**: SDM Handal (`/Users/hardiko/Documents/Developer/NEXT/sdm`)
- **Status**: Draft for User Review

## 1. Overview
Provide an administrative menu and backend API in SDM Handal allowing administrators to compose and send targeted web push notifications to specific employees or broadcast to all registered subscribers via the OneSignal REST API.

## 2. Architecture & Components

### 2.1 OneSignal REST API Integration (`src/app/api/admin/push-notification/route.js`)
- **HTTP Method**: `POST`
- **Authentication**: Requires valid JWT token with Admin/IT permission.
- **Request Payload**:
  ```json
  {
    "target_type": "single" | "all",
    "external_id": "string (employee NIK)",
    "title": "string (min 1, max 255)",
    "message": "string (min 1, max 1000)",
    "url": "string (optional relative or absolute URL)"
  }
  ```
- **External OneSignal Endpoint**: `POST https://api.onesignal.com/notifications`
  - Header: `Authorization: Key <ONESIGNAL_REST_API_KEY>`
  - Header: `Content-Type: application/json`
  - Payload when targeting specific user:
    ```json
    {
      "app_id": "<NEXT_PUBLIC_ONESIGNAL_APP_ID>",
      "include_aliases": {
        "external_id": ["<NIK>"]
      },
      "target_channel": "push",
      "headings": { "en": "<title>", "id": "<title>" },
      "contents": { "en": "<message>", "id": "<message>" },
      "url": "<url>"
    }
    ```
  - Payload when targeting all subscribers:
    ```json
    {
      "app_id": "<NEXT_PUBLIC_ONESIGNAL_APP_ID>",
      "included_segments": ["Subscribed Users"],
      "target_channel": "push",
      "headings": { "en": "<title>", "id": "<title>" },
      "contents": { "en": "<message>", "id": "<message>" },
      "url": "<url>"
    }
    ```
- **Response**: Returns `status: "success"` with OneSignal notification ID and recipient count, or descriptive error.

### 2.2 Client User ID Binding (`src/app/dashboard/layout.js`)
- When employee logs into dashboard and `userData` is fetched:
  ```javascript
  if (typeof window !== "undefined" && window.OneSignalDeferred) {
    window.OneSignalDeferred.push(async function(OneSignal) {
      if (userData?.username) {
        await OneSignal.login(userData.username);
      }
    });
  }
  ```
- On logout:
  ```javascript
  if (typeof window !== "undefined" && window.OneSignalDeferred) {
    window.OneSignalDeferred.push(async function(OneSignal) {
      await OneSignal.logout();
    });
  }
  ```

### 2.3 Admin Menu UI (`src/app/dashboard/admin/push-notification/page.js`)
- Responsive card form:
  - Mode toggle: "Kirim ke Pegawai Tertentu" vs "Kirim Broadcast (Semua)"
  - Employee picker using `SearchableSelect` populated from `GET /api/pegawai`
  - Judul Notifikasi (input)
  - Isi Pesan (textarea)
  - URL Tujuan / Redirect Link (optional input, e.g. `/dashboard/penilaian-kinerja`)
  - Live Push Preview component (renders instant preview of notification on Android/Desktop)
  - Send button with loading spinner and status feedback (`sonner` toast)
- Added navigation link in `src/app/dashboard/admin/settings/page.js`.

## 3. Security & Validation
- Only users with valid session and IT/Admin department role can invoke `POST /api/admin/push-notification`.
- REST API key remains server-side in `process.env.ONESIGNAL_REST_API_KEY`.
- Input validation: Title and message cannot be empty.

## 4. Verification Plan
- AST syntax & compile verification.
- Test `GET /api/pegawai` integration with `SearchableSelect`.
- Test `POST /api/admin/push-notification` with dummy and real NIK.
- Production build validation (`npm run build`).
