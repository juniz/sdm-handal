# OneSignal Web Push Notification Design Specification

- **Date**: 2026-09-09
- **Target Application**: SDM Handal (`/Users/hardiko/Documents/Developer/NEXT/sdm`)
- **Status**: Draft for User Review

## 1. Overview
Integrate OneSignal Web Push SDK v16 into SDM Handal (`sdm`) to support browser push notifications and prompt subscriptions via notifyButton.

## 2. Architecture & Components

### 2.1 Service Worker (`public/OneSignalSDK.sw.js`)
- Static file placed under `public/OneSignalSDK.sw.js`.
- Next.js serves this at origin root: `/OneSignalSDK.sw.js`.
- Imports official OneSignal v16 worker script:
  ```javascript
  importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");
  ```

### 2.2 Root Layout Integration (`src/app/layout.js`)
- Import `Script` component from `next/script`.
- Load OneSignal page SDK v16 with `strategy="afterInteractive"`:
  ```jsx
  <Script
    src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
    strategy="afterInteractive"
  />
  ```
- Initialize OneSignal via `OneSignalDeferred` array queue:
  ```jsx
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

## 3. Data Flow & Lifecyle
1. Browser loads SDM Handal HTML.
2. Next.js injects OneSignal SDK after hydration (`afterInteractive`).
3. `OneSignalDeferred` callback executes `await OneSignal.init(...)`.
4. OneSignal registers service worker at `/OneSignalSDK.sw.js`.
5. Bell widget (`notifyButton`) renders to let users subscribe / manage notifications.

## 4. Testing & Verification
- Lint check: `npm run lint` in `sdm` must pass without syntax/component errors.
- Build test: `npm run build` or Next.js dry-run verify clean compilation.
- Static file availability: Ensure `public/OneSignalSDK.sw.js` exists and syntax is valid.
