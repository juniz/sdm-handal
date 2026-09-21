# Design Spec: Ticket IT Notifications (In-App Bell & Web Push)

**Date**: 2026-09-21  
**Project**: SDM Handal & RS Backend  
**Author**: Antigravity  

---

## 1. Executive Summary

Implement automated notifications for the IT Ticket system across Next.js frontend (`sdm`) and NestJS backend (`website/backend`). Notifications are delivered via the in-app notification bell (`user_notifications` table in MySQL) and OneSignal Web Push.

Events covered:
1. **Ticket Created**: Notify all active IT staff (`departemen = 'IT'`).
2. **Ticket Assigned**: Notify assigned technician and ticket creator.
3. **Ticket Status Changed**: Notify ticket creator when status moves to `Resolved`, `Closed`, or `On Hold`.

---

## 2. Architecture & Data Flow

```
[ Event 1: New Ticket Created ]
  │
  ▼ Next.js POST /api/ticket
  ├─ Insert into `tickets` table
  ├─ Query active IT staff: SELECT nik FROM pegawai WHERE departemen = 'IT' AND stts_aktif != 'KELUAR'
  └─ Call sendPushNotification() from @/lib/onesignal.js
       ├─ Insert batch into `user_notifications` (type: 'ticket', url: '/dashboard/ticket-assignment')
       └─ Dispatch OneSignal Web Push to IT staff external IDs (NIK)

[ Event 2: Ticket Assigned ]
  │
  ▼ NestJS Mutation assignTicket(input)
  ├─ Update assignments_ticket & set status to 'In Progress' in TypeORM transaction
  └─ Post-commit: SdmNotifService.notifyTicketAssigned()
       ├─ To Technician: "Tiket IT [no_ticket] ditugaskan kepada Anda" (url: '/dashboard/ticket-assignment')
       ├─ To Creator: "Tiket IT [no_ticket] sedang ditangani oleh [nama_teknisi]" (url: '/dashboard/ticket')
       ├─ Insert into `user_notifications`
       └─ Dispatch OneSignal Web Push via REST API (non-blocking)

[ Event 3: Ticket Status Changed ]
  │
  ▼ NestJS Mutation updateTicketAssignmentStatus(input)
  ├─ Update status (Resolved, Closed, On Hold) in TypeORM transaction
  └─ Post-commit: SdmNotifService.notifyTicketStatusChanged()
       ├─ To Creator: "Status tiket [no_ticket] diperbarui menjadi [status]" (url: '/dashboard/ticket')
       ├─ Insert into `user_notifications`
       └─ Dispatch OneSignal Web Push via REST API (non-blocking)
```

---

## 3. Detailed Component Specifications

### 3.1 Next.js Frontend (`sdm`)

#### File: `src/app/api/ticket/route.js`
- In `POST` handler after ticket is successfully created and status history recorded:
  - Query IT staff NIKs:
    ```sql
    SELECT nik FROM pegawai WHERE departemen = 'IT' AND stts_aktif != 'KELUAR'
    ```
  - Fetch priority name and category name for message context.
  - Call `sendPushNotification`:
    - `targetNiks`: Array of IT staff NIKs.
    - `title`: `Tiket IT Baru: ${ticketNumber}`
    - `message`: `${title} - Prioritas: ${priorityName} (${user.nama || user.username})`
    - `url`: `/dashboard/ticket-assignment`
    - `type`: `'ticket'`
  - Ensure error in notification sending does not fail the HTTP 200 response of ticket creation.

### 3.2 NestJS Backend (`website/backend`)

#### New File: `src/sdm/sdm-notif.service.ts`
- Service responsible for sending notifications from the NestJS SDM module.
- Dependencies:
  - `@InjectDataSource('sdm') private readonly dataSource: DataSource`
  - `private readonly configService: ConfigService`
- Methods:
  1. `sendPushAndPersist({ targetNiks, title, message, url, type = 'ticket' })`:
     - Inserts rows into `user_notifications` table with fields `nik`, `title`, `message`, `url`, `type`, `is_read = 0`.
     - Calls OneSignal REST API `https://api.onesignal.com/notifications` with `app_id` and `Authorization: Key ${apiKey}`.
     - Wrapped in try/catch to ensure non-blocking execution.
  2. `notifyTicketAssigned({ ticket, technicianNik, technicianName, creatorNik })`:
     - Dispatches notification to technician:
       - `targetNiks`: `[technicianNik]`
       - `title`: `Penugasan Tiket IT: ${ticket.noTicket}`
       - `message`: `Tiket "${ticket.title}" telah ditugaskan kepada Anda.`
       - `url`: `/dashboard/ticket-assignment`
     - Dispatches notification to creator:
       - `targetNiks`: `[creatorNik]`
       - `title`: `Tiket IT Sedang Ditangani: ${ticket.noTicket}`
       - `message`: `Tiket Anda "${ticket.title}" sedang ditangani oleh ${technicianName}.`
       - `url`: `/dashboard/ticket`
  3. `notifyTicketStatusChanged({ ticket, newStatus, creatorNik })`:
     - Dispatches notification to creator:
       - `targetNiks`: `[creatorNik]`
       - `title`: `Status Tiket IT Diperbarui: ${ticket.noTicket}`
       - `message`: `Tiket "${ticket.title}" kini berstatus ${newStatus}.`
       - `url`: `/dashboard/ticket`

#### Modification: `src/sdm/ticket-assignment.service.ts`
- Inject `SdmNotifService`.
- In `assignTicket()`:
  - After transaction commits successfully:
    - Retrieve creator NIK from ticket entity.
    - Call `sdmNotifService.notifyTicketAssigned(...)`.
- In `updateStatus()`:
  - After transaction commits successfully:
    - Call `sdmNotifService.notifyTicketStatusChanged(...)`.

#### Modification: `src/sdm/sdm.module.ts`
- Register `SdmNotifService` in `providers` and `exports`.

---

## 4. Database Schema

Uses existing `user_notifications` table:
```sql
CREATE TABLE IF NOT EXISTS `user_notifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nik` VARCHAR(20) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `url` VARCHAR(255) NULL,
  `type` VARCHAR(50) DEFAULT 'system',
  `is_read` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_user_notif_nik_read` (`nik`, `is_read`),
  INDEX `idx_user_notif_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 5. Error Handling & Fault Tolerance

- All notification logic runs outside critical database transactions (post-commit).
- Uncaught notification errors are trapped with `logger.warn` or `logger.error`, preventing client request failure.
- Missing OneSignal API key logs a warning and gracefully skips push while keeping in-app `user_notifications` intact.

---

## 6. Testing & Verification

1. **Unit Tests**:
   - `sdm-notif.service.spec.ts`: Verify DB insert parameters and OneSignal payload creation.
   - `ticket-assignment.service.spec.ts`: Verify notification methods are called with correct data on assign and status update.
2. **Integration / Manual Verification**:
   - Create ticket in SDM frontend -> check `user_notifications` table for IT staff NIKs.
   - Assign technician in Ticket Assignment dashboard -> check notifications for technician and creator.
   - Change ticket status -> check notification for creator.
   - Verify unread count and item display in `<NotificationBell />`.
