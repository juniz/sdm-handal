# OneSignal Web Push Notification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate OneSignal Web Push SDK v16 into SDM Handal Next.js application with service worker support and notifyButton subscription widget.

**Architecture:** Add static service worker `public/OneSignalSDK.sw.js` serving SDK worker v16 import, and integrate Next.js `Script` components into root `src/app/layout.js` executing `OneSignalDeferred.push` initialization.

**Tech Stack:** Next.js (App Router), OneSignal Web SDK v16.

## Global Constraints
- Target workspace: `/Users/hardiko/Documents/Developer/NEXT/sdm`
- App ID: `2f714dce-3685-47a3-9a02-4350d1186f71`
- Safari Web ID: `web.onesignal.auto.4d1813bb-fb28-4cd6-9039-144582b81585`
- Service Worker URL: `/OneSignalSDK.sw.js`

---

### Task 1: Create OneSignal Service Worker

**Files:**
- Create: `public/OneSignalSDK.sw.js`

**Interfaces:**
- Consumes: OneSignal CDN worker script
- Produces: Service worker endpoint at `/OneSignalSDK.sw.js`

- [ ] **Step 1: Write service worker file**
```javascript
importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");
```

- [ ] **Step 2: Verify service worker file exists and contains script**
Run: `test -f public/OneSignalSDK.sw.js && cat public/OneSignalSDK.sw.js`
Expected: `importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");`

- [ ] **Step 3: Commit**
```bash
git add public/OneSignalSDK.sw.js
git commit -m "feat: add OneSignal service worker script"
```

---

### Task 2: Inject OneSignal Web SDK in Root Layout

**Files:**
- Modify: `src/app/layout.js`

**Interfaces:**
- Consumes: Next.js `Script` from `next/script`, `public/OneSignalSDK.sw.js`
- Produces: Client-side OneSignal initialization and subscription prompt button

- [ ] **Step 1: Add `import Script from "next/script";` to `src/app/layout.js`**

- [ ] **Step 2: Add OneSignal SDK Script and initialization block in `RootLayout`**
```jsx
<Script
  src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
  strategy="afterInteractive"
/>
<Script id="onesignal-init" strategy="afterInteractive">
  {`
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    OneSignalDeferred.push(async function(OneSignal) {
      await OneSignal.init({
        appId: "2f714dce-3685-47a3-9a02-4350d1186f71",
        safari_web_id: "web.onesignal.auto.4d1813bb-fb28-4cd6-9039-144582b81585",
        notifyButton: {
          enable: true,
        },
      });
    });
  `}
</Script>
```

- [ ] **Step 3: Run Next.js lint to verify syntax and formatting**
Run: `npm run lint`

- [ ] **Step 4: Commit**
```bash
git add src/app/layout.js
git commit -m "feat: initialize OneSignal Web Push SDK in root layout"
```

---

### Task 3: Build & End-to-End Verification

**Files:**
- None (verification step)

- [ ] **Step 1: Run Next.js build verification**
Run: `npm run build` or inspect layout component imports

- [ ] **Step 2: Verify git status is clean and documented**
Run: `git status`
