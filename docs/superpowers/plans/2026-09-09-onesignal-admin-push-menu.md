# OneSignal Push Notification Admin Menu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create an admin menu and backend REST API endpoint in SDM Handal to send targeted push notifications to specific users (or broadcast) using the OneSignal REST API and bind logged-in users to OneSignal.

**Architecture:** Bind employee NIK via `OneSignal.login()` in `DashboardLayout`, provide secure backend route `POST /api/admin/push-notification` communicating with OneSignal REST API (`https://api.onesignal.com/notifications`), and build a dedicated admin UI at `src/app/dashboard/admin/push-notification/page.js`.

**Tech Stack:** Next.js (App Router), OneSignal Web SDK v16 & REST API v1, Tailwind CSS, Lucide React, Sonner toasts.

## Global Constraints
- Target workspace: `/Users/hardiko/Documents/Developer/NEXT/sdm`
- OneSignal App ID: `process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID` (`2f714dce-3685-47a3-9a02-4350d1186f71`)
- OneSignal REST API Key: `process.env.ONESIGNAL_REST_API_KEY`
- External User ID format: Employee NIK (e.g. `user.username`)

---

### Task 1: Bind Employee NIK to OneSignal in DashboardLayout

**Files:**
- Modify: `src/app/dashboard/layout.js`

**Interfaces:**
- Consumes: `window.OneSignalDeferred`, `userData.username`
- Produces: `OneSignal.login(userData.username)` on login, `OneSignal.logout()` on logout

- [ ] **Step 1: In `checkUserRoleAndMenus`, enqueue `OneSignal.login(userData.username)`**
- [ ] **Step 2: In `handleLogout`, enqueue `OneSignal.logout()`**
- [ ] **Step 3: Verify syntax of `layout.js`**
- [ ] **Step 4: Commit**
```bash
git add src/app/dashboard/layout.js
git commit -m "feat(auth): bind logged-in employee NIK to OneSignal external_id"
```

---

### Task 2: Create OneSignal Admin REST API Route

**Files:**
- Create: `src/app/api/admin/push-notification/route.js`

**Interfaces:**
- Consumes: JWT cookies via `getUser()` from `@/lib/auth`, `ONESIGNAL_REST_API_KEY`, `NEXT_PUBLIC_ONESIGNAL_APP_ID`
- Produces: `POST /api/admin/push-notification` returning `{ status: "success", data: { id, recipients } }`

- [ ] **Step 1: Write `POST` handler in `src/app/api/admin/push-notification/route.js`**
  - Verify user is authenticated and is Admin/IT
  - Validate `title` and `message`
  - Send POST request to `https://api.onesignal.com/notifications`
  - Handle success and OneSignal error formats
- [ ] **Step 2: Test API endpoint route syntax with node**
- [ ] **Step 3: Commit**
```bash
git add src/app/api/admin/push-notification/route.js
git commit -m "feat(api): create OneSignal admin push notification endpoint"
```

---

### Task 3: Build Admin Push Notification Page and Settings Link

**Files:**
- Create: `src/app/dashboard/admin/push-notification/page.js`
- Modify: `src/app/dashboard/admin/settings/page.js`

**Interfaces:**
- Consumes: `GET /api/pegawai`, `POST /api/admin/push-notification`, `SearchableSelect`
- Produces: Interactive admin form with recipient selector, title, message, redirect URL, live preview card, and link in settings

- [ ] **Step 1: Create `src/app/dashboard/admin/push-notification/page.js`**
  - Implement form controls: target toggle (single / broadcast), employee SearchableSelect, title, message, url.
  - Implement live phone notification preview.
  - Integrate submit handler calling `POST /api/admin/push-notification` with Sonner toast feedback.
- [ ] **Step 2: Add quick navigation card in `src/app/dashboard/admin/settings/page.js`**
- [ ] **Step 3: Validate AST syntax**
- [ ] **Step 4: Commit**
```bash
git add src/app/dashboard/admin/push-notification/page.js src/app/dashboard/admin/settings/page.js
git commit -m "feat(ui): add push notification admin menu and settings link"
```

---

### Task 4: Production Build & End-to-End Verification

**Files:**
- None (verification)

- [ ] **Step 1: Run Next.js production build (`npm run build`)**
- [ ] **Step 2: Verify git status is clean**
