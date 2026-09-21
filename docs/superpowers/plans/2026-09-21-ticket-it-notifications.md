# Ticket IT Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement automated in-app bell (`user_notifications`) and OneSignal web push notifications for IT Ticket lifecycle events (ticket creation, technician assignment, status change).

**Architecture:** Next.js API route (`src/app/api/ticket/route.js`) handles notification dispatch for newly created tickets using existing `sendPushNotification` helper. NestJS backend creates `SdmNotifService` to persist in-app notifications and trigger OneSignal push during ticket assignment and status updates within `TicketAssignmentService`.

**Tech Stack:** Next.js, NestJS, TypeORM, MySQL, OneSignal REST API, Jest.

## Global Constraints

- Notifications must be non-blocking (failures must never rollback ticket creation, assignment, or status update transactions).
- Target channels: MySQL table `user_notifications` and OneSignal Web Push.
- Deep links: `/dashboard/ticket-assignment` for IT staff/technicians, `/dashboard/ticket` for ticket creators.

---

### Task 1: Next.js Frontend - Dispatch Notification on Ticket Creation

**Files:**
- Modify: `sdm/src/app/api/ticket/route.js:290-335`

**Interfaces:**
- Consumes: `sendPushNotification` from `@/lib/onesignal`, `rawQuery` from `@/lib/db-helper`
- Produces: Dispatches notifications to all active IT staff when a ticket is created via `POST /api/ticket`.

- [ ] **Step 1: Inspect `src/app/api/ticket/route.js` around ticket creation**

Verify where `tickets` insert and `recordStatusHistory` finish in `POST`.

- [ ] **Step 2: Add IT staff query and notification dispatch**

In `sdm/src/app/api/ticket/route.js`:
```javascript
import { sendPushNotification } from "@/lib/onesignal";

// Inside POST handler, after recordStatusHistory:
try {
  const itStaff = await rawQuery(
    "SELECT nik FROM pegawai WHERE departemen = 'IT' AND stts_aktif != 'KELUAR'"
  );
  const targetNiks = itStaff.map((s) => s.nik).filter(Boolean);

  if (targetNiks.length > 0) {
    const priorityRow = await selectFirst({
      table: "priorities_ticket",
      where: { priority_id: parseInt(priority_id) },
    });
    const priorityName = priorityRow ? priorityRow.priority_name : "Normal";

    sendPushNotification({
      targetNiks,
      title: `Tiket IT Baru: ${ticketNumber}`,
      message: `${title.trim()} - Prioritas: ${priorityName} (${user.nama || user.username})`,
      url: "/dashboard/ticket-assignment",
    }).catch((notifErr) =>
      console.warn("Failed to dispatch ticket creation notification:", notifErr)
    );
  }
} catch (notifErr) {
  console.warn("Error preparing ticket creation notification:", notifErr);
}
```

- [ ] **Step 3: Verify syntax and lint**

Run in `sdm`:
```bash
npm run lint
```
Expected: PASS with no syntax errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/ticket/route.js
git commit -m "feat(ticket): dispatch notification to it staff on ticket creation"
```

---

### Task 2: NestJS Backend - Create `SdmNotifService`

**Files:**
- Create: `website/backend/src/sdm/sdm-notif.service.ts`
- Create: `website/backend/src/sdm/sdm-notif.service.spec.ts`
- Modify: `website/backend/src/sdm/sdm.module.ts`

**Interfaces:**
- Consumes: `ConfigService`, `DataSource ('sdm')`
- Produces: `SdmNotifService` with methods:
  - `sendPushAndPersist({ targetNiks: string[], title: string, message: string, url?: string, type?: string }): Promise<void>`
  - `notifyTicketAssigned({ noTicket: string, title: string, technicianNik: string, technicianName: string, creatorNik: string }): Promise<void>`
  - `notifyTicketStatusChanged({ noTicket: string, title: string, newStatus: string, creatorNik: string }): Promise<void>`

- [ ] **Step 1: Write failing unit test `sdm-notif.service.spec.ts`**

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { SdmNotifService } from './sdm-notif.service';

describe('SdmNotifService', () => {
  let service: SdmNotifService;
  let mockDataSource: any;
  let mockConfigService: any;

  beforeEach(async () => {
    mockDataSource = {
      manager: {
        query: jest.fn().mockResolvedValue([]),
      },
    };
    mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'ONESIGNAL_APP_ID') return 'test-app-id';
        if (key === 'ONESIGNAL_API_KEY' || key === 'ONESIGNAL_REST_API_KEY') return 'test-api-key';
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SdmNotifService,
        { provide: 'sdm_DataSource', useValue: mockDataSource },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<SdmNotifService>(SdmNotifService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should persist notification to user_notifications', async () => {
    await service.sendPushAndPersist({
      targetNiks: ['12345'],
      title: 'Test Title',
      message: 'Test Message',
      url: '/dashboard/ticket',
      type: 'ticket',
    });

    expect(mockDataSource.manager.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO user_notifications'),
      expect.arrayContaining(['12345', 'Test Title', 'Test Message', '/dashboard/ticket', 'ticket']),
    );
  });

  it('should notify technician and creator on ticket assigned', async () => {
    const spy = jest.spyOn(service, 'sendPushAndPersist').mockResolvedValue(undefined);

    await service.notifyTicketAssigned({
      noTicket: 'TKT-20260921-0001',
      title: 'Printer Rusak',
      technicianNik: 'TECH01',
      technicianName: 'Budi Santoso',
      creatorNik: 'USER01',
    });

    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        targetNiks: ['TECH01'],
        url: '/dashboard/ticket-assignment',
      }),
    );
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        targetNiks: ['USER01'],
        url: '/dashboard/ticket',
      }),
    );
  });

  it('should notify creator on ticket status changed', async () => {
    const spy = jest.spyOn(service, 'sendPushAndPersist').mockResolvedValue(undefined);

    await service.notifyTicketStatusChanged({
      noTicket: 'TKT-20260921-0001',
      title: 'Printer Rusak',
      newStatus: 'Resolved',
      creatorNik: 'USER01',
    });

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        targetNiks: ['USER01'],
        title: expect.stringContaining('Resolved'),
        url: '/dashboard/ticket',
      }),
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run in `website/backend`:
```bash
npm test -- src/sdm/sdm-notif.service.spec.ts
```
Expected: FAIL with "Cannot find module './sdm-notif.service'".

- [ ] **Step 3: Implement `SdmNotifService`**

Create `website/backend/src/sdm/sdm-notif.service.ts`:
```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

export interface SendPushAndPersistParams {
  targetNiks: string[];
  title: string;
  message: string;
  url?: string;
  type?: string;
}

export interface NotifyTicketAssignedParams {
  noTicket: string;
  title: string;
  technicianNik: string;
  technicianName: string;
  creatorNik: string;
}

export interface NotifyTicketStatusChangedParams {
  noTicket: string;
  title: string;
  newStatus: string;
  creatorNik: string;
}

@Injectable()
export class SdmNotifService {
  private readonly logger = new Logger(SdmNotifService.name);
  private readonly appId: string;
  private readonly apiKey: string;
  private readonly apiUrl = 'https://api.onesignal.com/notifications';

  constructor(
    @InjectDataSource('sdm') private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {
    this.appId =
      this.configService.get<string>('ONESIGNAL_APP_ID') ||
      '2f714dce-3685-47a3-9a02-4350d1186f71';
    this.apiKey =
      this.configService.get<string>('ONESIGNAL_REST_API_KEY') ||
      this.configService.get<string>('ONESIGNAL_API_KEY') ||
      '';
  }

  async sendPushAndPersist(params: SendPushAndPersistParams): Promise<void> {
    const { targetNiks, title, message, url, type = 'ticket' } = params;
    const cleanNiks = Array.from(
      new Set(
        (targetNiks || [])
          .map((n) => String(n).trim())
          .filter(Boolean),
      ),
    );

    if (cleanNiks.length === 0 || !title || !message) {
      return;
    }

    const appUrl =
      this.configService.get<string>('NEXT_PUBLIC_APP_URL') ||
      'https://presensi.itbhayangkara.id';
    let targetUrl = url || '/dashboard/ticket';
    if (targetUrl.startsWith('/')) {
      targetUrl = `${appUrl.replace(/\/+$/, '')}${targetUrl}`;
    }

    // 1. Persist to user_notifications table
    try {
      for (const nik of cleanNiks) {
        await this.dataSource.manager.query(
          `INSERT INTO user_notifications (nik, title, message, url, type, is_read, created_at)
           VALUES (?, ?, ?, ?, ?, 0, NOW())`,
          [nik, title, message, targetUrl, type],
        );
      }
    } catch (dbErr) {
      this.logger.warn(`Failed to persist user_notifications: ${dbErr.message}`);
    }

    // 2. Dispatch OneSignal push
    if (!this.apiKey) {
      this.logger.warn('OneSignal API key not configured. Push skipped.');
      return;
    }

    const payload = {
      app_id: this.appId,
      target_channel: 'push',
      headings: { en: title, id: title },
      contents: { en: message, id: message },
      include_aliases: {
        external_id: cleanNiks,
      },
      url: targetUrl,
    };

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          Authorization: `Key ${this.apiKey.trim().replace(/^["']|["']$/g, '')}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.warn(`OneSignal push failed: ${errorBody}`);
      }
    } catch (pushErr) {
      this.logger.warn(`OneSignal HTTP error: ${pushErr.message}`);
    }
  }

  async notifyTicketAssigned(params: NotifyTicketAssignedParams): Promise<void> {
    const { noTicket, title, technicianNik, technicianName, creatorNik } = params;

    // To Technician
    if (technicianNik) {
      await this.sendPushAndPersist({
        targetNiks: [technicianNik],
        title: `Penugasan Tiket IT: ${noTicket}`,
        message: `Tiket "${title}" telah ditugaskan kepada Anda.`,
        url: '/dashboard/ticket-assignment',
        type: 'ticket',
      }).catch((err) => this.logger.warn(`Notify technician failed: ${err.message}`));
    }

    // To Creator
    if (creatorNik && creatorNik !== technicianNik) {
      await this.sendPushAndPersist({
        targetNiks: [creatorNik],
        title: `Tiket IT Sedang Ditangani: ${noTicket}`,
        message: `Tiket Anda "${title}" sedang ditangani oleh ${technicianName}.`,
        url: '/dashboard/ticket',
        type: 'ticket',
      }).catch((err) => this.logger.warn(`Notify creator failed: ${err.message}`));
    }
  }

  async notifyTicketStatusChanged(params: NotifyTicketStatusChangedParams): Promise<void> {
    const { noTicket, title, newStatus, creatorNik } = params;

    if (!creatorNik) return;

    await this.sendPushAndPersist({
      targetNiks: [creatorNik],
      title: `Status Tiket IT Diperbarui (${newStatus}): ${noTicket}`,
      message: `Tiket "${title}" kini berstatus ${newStatus}.`,
      url: '/dashboard/ticket',
      type: 'ticket',
    }).catch((err) => this.logger.warn(`Notify status changed failed: ${err.message}`));
  }
}
```

- [ ] **Step 4: Register in `sdm.module.ts`**

Add `SdmNotifService` to `providers` and `exports` of `SdmModule`.

- [ ] **Step 5: Run test to verify it passes**

Run in `website/backend`:
```bash
npm test -- src/sdm/sdm-notif.service.spec.ts
```
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/sdm/sdm-notif.service.ts src/sdm/sdm-notif.service.spec.ts src/sdm/sdm.module.ts
git commit -m "feat(sdm): add SdmNotifService for in-app and push notifications"
```

---

### Task 3: NestJS Backend - Integrate Notifications into `TicketAssignmentService`

**Files:**
- Modify: `website/backend/src/sdm/ticket-assignment.service.ts`
- Modify: `website/backend/src/sdm/ticket-assignment.service.spec.ts`

**Interfaces:**
- Consumes: `SdmNotifService`
- Produces: Calls `notifyTicketAssigned` on `assignTicket` and `notifyTicketStatusChanged` on `updateStatus`.

- [ ] **Step 1: Update unit tests in `ticket-assignment.service.spec.ts`**

Add assertions that `sdmNotifService.notifyTicketAssigned` and `sdmNotifService.notifyTicketStatusChanged` are called after transactions commit.

- [ ] **Step 2: Run test to verify it fails**

Run in `website/backend`:
```bash
npm test -- src/sdm/ticket-assignment.service.spec.ts
```
Expected: FAIL until `SdmNotifService` is injected and called.

- [ ] **Step 3: Inject `SdmNotifService` and trigger notifications in `TicketAssignmentService`**

In `src/sdm/ticket-assignment.service.ts`:
- Constructor injection: `private readonly sdmNotifService: SdmNotifService`
- In `assignTicket()` after `queryRunner.commitTransaction()`:
```typescript
const creatorNik = existingTicket.userId;
const technicianName = assignedEmployee.nama || input.assignedTo;

this.sdmNotifService
  .notifyTicketAssigned({
    noTicket: existingTicket.noTicket,
    title: existingTicket.title,
    technicianNik: input.assignedTo,
    technicianName,
    creatorNik,
  })
  .catch((err) =>
    this.logger.warn(`Failed to dispatch assignment notification: ${err.message}`)
  );
```
- In `updateStatus()` after `queryRunner.commitTransaction()`:
```typescript
const creatorNik = existingTicket.userId;

this.sdmNotifService
  .notifyTicketStatusChanged({
    noTicket: existingTicket.noTicket,
    title: existingTicket.title,
    newStatus: input.status,
    creatorNik,
  })
  .catch((err) =>
    this.logger.warn(`Failed to dispatch status update notification: ${err.message}`)
  );
```

- [ ] **Step 4: Run unit tests to verify they pass**

Run in `website/backend`:
```bash
npm test -- src/sdm/ticket-assignment.service.spec.ts
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/sdm/ticket-assignment.service.ts src/sdm/ticket-assignment.service.spec.ts
git commit -m "feat(sdm): dispatch ticket notifications on assignment and status change"
```

---

### Task 4: End-to-End Verification & Documentation

**Files:**
- Test all components end-to-end.

- [ ] **Step 1: Run NestJS build & linter**

Run in `website/backend`:
```bash
npm run build && npm run lint
```
Expected: PASS with 0 errors.

- [ ] **Step 2: Run SDM frontend linter**

Run in `sdm`:
```bash
npm run lint
```
Expected: PASS with 0 errors.

- [ ] **Step 3: Verify notification display**

Verify queries in `user_notifications` and display in `NotificationBell` component.
