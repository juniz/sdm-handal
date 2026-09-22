# WhatsApp Gateway Admin Menu Design Specification

## 1. Overview
Provide an administrative menu and service integration for a WhatsApp Gateway using `whatsapp-web.js` with Puppeteer. The gateway enables scanning a QR code to connect an official WhatsApp number, monitoring connection status, logging out/resetting sessions, and sending test messages.

## 2. Key Decisions
- **Architecture**: Integrated NestJS background service (`website/backend`) + SDM Admin frontend page (`sdm`).
- **Session Scope**: Single session (1 official hospital WhatsApp number) using `LocalAuth`.
- **Status & QR Delivery**: REST Polling (3-second interval during pending/QR state) to avoid WebSocket/SSE overhead.

---

## 3. Backend Specification (`website/backend`)

### 3.1 Dependencies
- `whatsapp-web.js`: Node.js WhatsApp client via Puppeteer.
- `qrcode`: Utility to convert raw QR strings to base64 Data URLs for frontend rendering.

### 3.2 Service: `WhatsappGatewayService`
- **Location**: `src/web/whatsapp/whatsapp-gateway.service.ts`
- **Auth Strategy**: `new LocalAuth({ dataPath: './.wwebjs_auth', clientId: 'sdm-official' })`
- **Internal State**:
  - `DISCONNECTED`: Client stopped or logged out.
  - `INITIALIZING`: Puppeteer launching.
  - `SCAN_QR`: QR code generated and waiting for scan.
  - `AUTHENTICATING`: QR scanned, waiting for WhatsApp Web ready event.
  - `READY`: Client fully connected and operational.
- **Methods**:
  - `getStatus()`: Returns `{ state, qrCodeDataUrl, phone, pushname, updatedAt }`.
  - `initializeClient()`: Initializes client if not already running. Guarded by `isInitializing` lock.
  - `logoutClient()`: Logs out, destroys client instance, and deletes session directory.
  - `sendTextMessage(to: string, message: string)`: Normalizes phone number to `628...@c.us` and calls `client.sendMessage`.

### 3.3 Controller: `WhatsappGatewayController`
- **Location**: `src/web/whatsapp/whatsapp-gateway.controller.ts`
- **Route Prefix**: `/web/whatsapp-gateway`
- **Guards**: `@UseGuards(JwtAuthGuard, RolesGuard)` requiring Admin privileges.
- **Endpoints**:
  - `GET /status`: Get current gateway state, device info, or QR code Data URL.
  - `POST /initialize`: Trigger client startup / QR regeneration.
  - `POST /logout`: Logout active session and clean local auth state.
  - `POST /send-test`: Send test message. Body: `{ phone: string, message: string }`.

---

## 4. Frontend Specification (`sdm`)

### 4.1 Navigation & Menu Access
- **Settings Card**: Add WhatsApp Gateway navigation card to `src/app/dashboard/admin/settings/page.js` with Lucide icon (`MessageSquare` / `PhoneCall`).
- **Admin Page**: Create `src/app/dashboard/admin/whatsapp-gateway/page.js`.
- **Menu ACL**: Register `/dashboard/admin/whatsapp-gateway` in SDM menu ACL table if dynamic sidebar navigation is active.

### 4.2 Frontend Proxy Route
- **Location**: `src/app/api/admin/whatsapp-gateway/route.js`
- Handles GET (status) and POST (initialize, logout, send-test) forwarding to NestJS `/web/whatsapp-gateway/*` attaching admin JWT token.

### 4.3 Admin UI Components
- **Status Header**:
  - Badge indicator: `READY` (Green), `SCAN_QR` (Yellow/Pulse), `INITIALIZING` (Blue), `DISCONNECTED` (Red/Gray).
  - Manual "Refresh Status" button.
- **QR Code View**:
  - Displayed when `state === 'SCAN_QR'`.
  - Displays base64 QR image with clear instructions on how to link device from WhatsApp mobile.
  - Auto-polls status every 3 seconds while in `SCAN_QR` or `INITIALIZING`.
- **Connected Device Card**:
  - Displayed when `state === 'READY'`.
  - Shows connected phone number, push name, and connection timestamp.
  - "Putuskan Koneksi / Logout" button with confirmation modal.
- **Test Message Card**:
  - Inputs: Recipient phone number (`08...` or `62...`) and message body.
  - "Kirim Pesan Uji Coba" button with loading indicator and Sonner toast notification.

---

## 5. Data Flow & Lifecycle

```
[Admin User in SDM] 
       │ 
       ├─ (1) Open /dashboard/admin/whatsapp-gateway ──> GET /api/admin/whatsapp-gateway?action=status
       │                                                         │
       │                                                         ▼
       │                                              [NestJS Backend]
       │                                            WhatsappGatewayService
       │                                                         │
       ├─ (2) Click "Hubungkan WhatsApp" ───────────────> POST /web/whatsapp-gateway/initialize
       │                                                         │
       │                                                         ▼
       │                                                whatsapp-web.js
       │                                            (Spawns Puppeteer Browser)
       │                                                         │
       │                                               Event: 'qr' emitted
       │                                                         │
       ├─ (3) Poll status (every 3s) <────────────────── Returns QR Data URL
       │      Render QR in Browser
       │
       ├─ (4) User scans QR on phone
       │                                               Event: 'ready' emitted
       │                                                         │
       ├─ (5) Poll status <───────────────────────────── Returns state: 'READY'
       │      Render Device Info & Test Sender
       │
       └─ (6) Send Test Message ────────────────────────> POST /web/whatsapp-gateway/send-test
                                                                 │
                                                       client.sendMessage(...)
```

---

## 6. Error Handling & Edge Cases
- **Browser Launch Failures**: Catch Puppeteer spawn errors (e.g. missing sandbox flags `--no-sandbox`, `--disable-setuid-sandbox`).
- **Session Desync**: Provide explicit "Reset Session" button to purge `./.wwebjs_auth` directory if session becomes invalid or corrupted.
- **Phone Number Normalization**: Automatically convert Indonesian local format (`08xxx`, `+62xxx`) into WhatsApp JID format (`62xxx@c.us`). Reject non-numeric input.
- **Rate & Concurrency Guard**: Prevent duplicate calls to `initialize()` using `isInitializing` boolean lock.

---

## 7. Verification Plan

### Automated Verification
1. `npm test` in `website/backend` covering `WhatsappGatewayService` phone formatting and state transitions.
2. `npm run build` in `website/backend` to ensure TypeScript compilation passes.
3. `npm run build` in `sdm` to ensure Next.js pages and API routes compile without errors.

### Manual Verification
1. Open SDM dashboard: Navigate to `Admin > System Settings > WhatsApp Gateway`.
2. Click "Hubungkan WhatsApp" and verify QR code appears within a few seconds.
3. Scan QR code using a real WhatsApp account.
4. Verify status badge updates to `READY` and displays the connected phone number.
5. Send a test message to a verified phone number and confirm delivery on WhatsApp.
6. Click "Logout" and confirm session resets cleanly to `DISCONNECTED`.
