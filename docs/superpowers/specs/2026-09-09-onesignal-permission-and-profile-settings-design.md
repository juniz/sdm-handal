# OneSignal Notification Permission Prompt & Profile Settings Design Specification

**Target System:** RS Bhayangkara Nganjuk — SDM Handal (`sdm`)  
**Date:** 2026-09-09  
**Status:** Approved

---

## 1. Overview & Problem Statement

Currently, OneSignal Web Push SDK v16 is initialized with only a floating `notifyButton` bell. Users frequently miss the button, leaving browser notification permission in `default` state. Because push alerts require explicit browser authorization (`Notification.permission === 'granted'`), notifications cannot be delivered to unregistered devices. Additionally, employees lack a self-service settings view to check or toggle their device push subscription status.

This specification details:
1. A soft clinical permission banner in the dashboard layout prompting employees to enable push notifications with context.
2. A dedicated notification settings card in the employee profile page (`/dashboard/profile`) allowing staff to view status, grant permissions, opt-in/opt-out, and read recovery instructions if blocked.

---

## 2. Architecture & Components

```
                +------------------------------------+
                |       src/app/layout.js            |
                |  OneSignal SDK v16 Initialization  |
                +-----------------+------------------+
                                  |
            +---------------------+--------------------+
            |                                          |
            v                                          v
+-----------------------+                  +-----------------------+
|  dashboard/layout.js  |                  | dashboard/profile/    |
| (NotificationBanner)  |                  | page.js (SettingsCard)|
+-----------+-----------+                  +-----------+-----------+
            |                                          |
            +---------------------+--------------------+
                                  |
                                  v
                    +---------------------------+
                    | window.OneSignalDeferred  |
                    | .Notifications.request... |
                    | .PushSubscription.opt...  |
                    +---------------------------+
```

### 2.1 Component 1: `NotificationPermissionBanner`
- **Path:** `src/components/notifications/NotificationPermissionBanner.jsx`
- **Render Location:** Mounted inside `src/app/dashboard/layout.js` directly above main page content.
- **Display Logic:**
  1. Detect browser support (`"Notification" in window`).
  2. Check `Notification.permission`:
     - `'granted'`: Banner hidden.
     - `'denied'`: Banner hidden (avoids nagging users who explicitly blocked).
     - `'default'`: Check `localStorage.getItem("sdm_push_prompt_dismissed_until")`.
       - If timestamp > `Date.now()`, banner hidden (snooze active).
       - Otherwise, banner visible.
- **User Actions:**
  - **"Aktifkan Notifikasi"**: Calls `OneSignal.Notifications.requestPermission()`. If granted, updates state, hides banner, and triggers `toast.success("Notifikasi SDM Handal berhasil diaktifkan")`.
  - **"Nanti Saja" / Dismiss**: Sets `sdm_push_prompt_dismissed_until` to `Date.now() + 7 * 24 * 60 * 60 * 1000` (7 days snooze), then hides banner.
- **Styling (`DESIGN.md`):**
  - Container: `bg-sky-50 border border-sky-200/80 rounded-xl p-4 shadow-xs`
  - Icon: `Bell` inside `bg-sky-100 text-sky-600 rounded-lg p-2`
  - Typography: Figtree bold title, Noto Sans 12px description.
  - Action button: `bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold`.

### 2.2 Component 2: `NotificationSettingsCard`
- **Path:** `src/components/profile/NotificationSettingsCard.jsx`
- **Render Location:** Mounted in `src/app/dashboard/profile/page.js` as a Bento grid card.
- **Features:**
  1. **Live State Inspection:**
     - Checks `Notification.permission` ('default', 'granted', 'denied').
     - Checks `OneSignal.User.PushSubscription.optedIn` (boolean).
     - Displays subscription ID preview (`OneSignal.User.PushSubscription.id`).
  2. **Status Badges:**
     - `Aktif & Terhubung`: Green badge (`bg-emerald-50 text-emerald-700 border-emerald-200`).
     - `Belum Diizinkan`: Amber badge (`bg-amber-50 text-amber-700 border-amber-200`).
     - `Diblokir di Browser`: Red badge (`bg-rose-50 text-rose-700 border-rose-200`).
  3. **Interactions:**
     - If `default`: Button *"Aktifkan Izin Notifikasi"* triggers `OneSignal.Notifications.requestPermission()`.
     - If `granted`: Toggle switch for Opt-In / Opt-Out via `OneSignal.User.PushSubscription.optOut()` and `OneSignal.User.PushSubscription.optIn()`.
     - If `denied`: Informative callout explaining how to unblock notifications via browser URL bar lock icon.

---

## 3. OneSignal Web SDK v16 API Reference

- Permission Check: `window.Notification.permission` (`'default'`, `'granted'`, `'denied'`)
- Prompt Trigger:
  ```javascript
  window.OneSignalDeferred.push(async function(OneSignal) {
    const granted = await OneSignal.Notifications.requestPermission();
  });
  ```
- Push Subscription Status:
  ```javascript
  window.OneSignalDeferred.push(async function(OneSignal) {
    const isOptedIn = OneSignal.User.PushSubscription.optedIn;
    const subscriptionId = OneSignal.User.PushSubscription.id;
  });
  ```
- Push Opt-Out / Opt-In:
  ```javascript
  await OneSignal.User.PushSubscription.optOut();
  await OneSignal.User.PushSubscription.optIn();
  ```

---

## 4. Edge Cases & Resilience

1. **Unsupported Browser / Private Mode:**
   - If `"Notification" in window === false`, component gracefully returns `null` or displays unsupported device message.
2. **Permission Denied Recovery:**
   - Profile card displays clear Indonesian instructions with visual lock icon indicating where to change browser permission.
3. **Hydration & SSR Safety:**
   - Wrap browser checks in `useEffect` and `typeof window !== "undefined"` guards to prevent hydration mismatch.
4. **Snooze Reset:**
   - If user visits Profile page, permission can be requested even if the dashboard banner was snoozed.

---

## 5. Verification Plan

1. **Component Verification:**
   - Run `node .agents/skills/impeccable/scripts/detect.mjs` on new and modified components.
2. **Build Verification:**
   - Run `npm run build` to ensure static generation and client boundaries are error-free.
3. **Interactive Verification:**
   - Verify banner shows on `default` permission.
   - Verify clicking "Aktifkan Sekarang" triggers browser permission dialog.
   - Verify profile card updates live when permission status changes.
