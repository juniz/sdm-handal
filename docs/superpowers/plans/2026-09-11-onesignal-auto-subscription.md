# OneSignal Auto-Subscription Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Automatically trigger browser push notification permission prompt on dashboard load and bind subscriber to NIK in OneSignal.

**Architecture:** Modify `src/app/dashboard/layout.js` inside OneSignalDeferred callback to evaluate `Notification.permission === "default"` after successful user authentication, then trigger `OneSignal.Notifications.requestPermission()` with 1.5s delay.

**Tech Stack:** Next.js (App Router), OneSignal Web SDK v16.

## Global Constraints
- Target workspace: `/Users/hardiko/Documents/Developer/NEXT/sdm`
- Only prompt when `Notification.permission === "default"`
- Preserve existing `OneSignal.login(userData.username)` call
- Delay auto-prompt by 1500ms to allow DOM render

---

### Task 1: Add Auto-Permission Prompt in Dashboard Layout

**Files:**
- Modify: `src/app/dashboard/layout.js:136-147`

**Interfaces:**
- Consumes: `userData.username` from `/api/auth/user`, `window.OneSignalDeferred`
- Produces: Native browser notification prompt on dashboard load, links device subscription to NIK

- [ ] **Step 1: Check current implementation**

Inspect lines 136-147 of `src/app/dashboard/layout.js` to ensure clean injection point.

- [ ] **Step 2: Update `src/app/dashboard/layout.js`**

Modify OneSignal deferred callback:
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
											console.warn(
												"Auto request notification permission error:",
												permErr
											);
										}
									}, 1500);
								}
							}
						});
					}
```

- [ ] **Step 3: Syntax check**

Run:
```bash
node --check src/app/dashboard/layout.js
```
Expected: Exit 0 with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/layout.js docs/superpowers/plans/2026-09-11-onesignal-auto-subscription.md
git commit -m "feat(notifications): auto-prompt push permission on dashboard load"
```
