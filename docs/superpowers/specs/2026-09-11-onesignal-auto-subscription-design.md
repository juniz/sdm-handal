# OneSignal Auto-Subscription on Dashboard Load Design

## Summary
Enable automatic web push subscription prompt for authenticated users upon loading the dashboard, binding their browser subscription directly to their NIK (`userData.username`) in OneSignal without requiring manual navigation to `/dashboard/profile`.

## Background & Problem
Previously, users had to manually navigate to `/dashboard/profile` and click "Aktifkan Notifikasi" to trigger `Notification.requestPermission()`. Consequently, users who did not visit the profile page remained unregistered with `invalid_identifier: true`, causing OneSignal to reject targeted notifications with `invalid_aliases: { external_id: [...] }`.

## Goals
1. Automatically trigger native browser notification permission prompt on `/dashboard` load for users whose permission state is `default`.
2. Ensure user NIK (`userData.username`) is attached to OneSignal via `OneSignal.login()` before/during permission grant.
3. Prevent repeated or intrusive prompt requests when permission is already `granted` or `denied`.
4. Delay prompt trigger by 1.5s after mount to ensure smooth DOM paint and prevent browser pop-up suppression.

## Non-Goals
- Bypassing browser-enforced permission prompt (impossible by browser security design).
- Modifying profile page notification controls (Profile page remains available for opt-in/opt-out/reset).

## Architecture & Implementation

### File to Modify
`src/app/dashboard/layout.js`

### Implementation Logic
Within `checkUserRoleAndMenus` after user authentication check:
```javascript
if (typeof window !== "undefined") {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async function(OneSignal) {
        if (userData?.username) {
            try {
                await OneSignal.login(userData.username);
            } catch (err) {
                console.warn("OneSignal login error:", err);
            }

            // Auto-prompt permission if status is default
            if (
                typeof Notification !== "undefined" &&
                Notification.permission === "default"
            ) {
                setTimeout(async () => {
                    try {
                        await OneSignal.Notifications.requestPermission();
                    } catch (permErr) {
                        console.warn("Auto request permission error:", permErr);
                    }
                }, 1500);
            }
        }
    });
}
```

## Behavior Matrix
| Permission State | Action Taken |
|---|---|
| `default` (unprompted) | Delay 1.5s -> Trigger native browser prompt -> If allowed, token issued and bound to NIK |
| `granted` (already allowed) | No prompt displayed -> `OneSignal.login()` keeps NIK synchronized |
| `denied` (blocked) | No prompt displayed -> User can re-enable via browser address bar or profile |

## Verification Plan
1. Reset subscription in browser / open incognito or fresh browser session.
2. Login as employee with valid NIK.
3. Land on `/dashboard`.
4. Observe native browser notification prompt appearing ~1.5s after load.
5. Click "Allow" / "Izinkan".
6. Verify player record in OneSignal has `external_user_id` set to NIK and `invalid_identifier: false`.
7. Dispatch push notification to that NIK from admin menu and confirm delivery.
