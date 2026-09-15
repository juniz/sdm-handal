# NestJS-Backed OneSignal Bell Notification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a universal notification bell in the SDM header backed by NestJS GraphQL backend and OneSignal Web Push, displaying stored notification history for all employees.

**Architecture:** 
1. Database: Store push history in MySQL table `user_notifications`.
2. NestJS Backend: Create GraphQL queries & mutations for user notification retrieval and status updates using `GqlJwtSdmGuard`.
3. SDM Frontend: Auto-save sent push notifications to `user_notifications` in `src/lib/onesignal.js`, proxy GraphQL in `/api/notifications`, and open `<NotificationBell />` to all authenticated users.

**Tech Stack:** NestJS (GraphQL, TypeORM/DataSource), Next.js 15 (App Router), MySQL, OneSignal Web SDK.

## Global Constraints
- SDM workspace: `/Users/hardiko/Documents/Developer/NEXT/sdm`
- Backend workspace: `/Users/hardiko/Documents/Developer/NEXT/website/backend`
- NestJS authentication must use `@UseGuards(GqlJwtSdmGuard, GqlThrottlerGuard)`
- Table schema must be compatible with MySQL 5.7+ / 8.0 (`IF NOT EXISTS`, utf8mb4)
- Notification bell must be accessible to ALL authenticated employees (no IT department restriction)
- Notification insertion failures MUST NOT break push notification delivery

---

### Task 1: Database Migration Setup

**Files:**
- Create: `/Users/hardiko/Documents/Developer/NEXT/sdm/database/migrations/create_user_notifications_table.sql`

**Interfaces:**
- Produces: Table `user_notifications` with columns `id`, `nik`, `title`, `message`, `url`, `type`, `is_read`, `created_at`

- [ ] **Step 1: Write migration SQL file**

Create `database/migrations/create_user_notifications_table.sql`:
```sql
CREATE TABLE IF NOT EXISTS `user_notifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nik` VARCHAR(30) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `url` VARCHAR(255) DEFAULT NULL,
  `type` VARCHAR(50) DEFAULT 'system',
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_user_notif_nik_read` (`nik`, `is_read`),
  INDEX `idx_user_notif_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

- [ ] **Step 2: Commit migration file**

```bash
git add database/migrations/create_user_notifications_table.sql
git commit -m "feat(db): add user_notifications table migration"
```

---

### Task 2: NestJS Backend Notification Module

**Files:**
- Create: `/Users/hardiko/Documents/Developer/NEXT/website/backend/src/sdm/dto/user-notif-types.ts`
- Create: `/Users/hardiko/Documents/Developer/NEXT/website/backend/src/sdm/repositories/user-notif.repository.ts`
- Create: `/Users/hardiko/Documents/Developer/NEXT/website/backend/src/sdm/user-notif.service.ts`
- Create: `/Users/hardiko/Documents/Developer/NEXT/website/backend/src/sdm/user-notif.resolver.ts`
- Modify: `/Users/hardiko/Documents/Developer/NEXT/website/backend/src/sdm/sdm.module.ts`

**Interfaces:**
- Produces: GraphQL Query `userNotifications(limit: Int): UserNotificationResultDto`, Mutation `markNotificationRead(id: Int, all: Boolean): Boolean`

- [ ] **Step 1: Create DTOs**

Write `src/sdm/dto/user-notif-types.ts`:
```typescript
import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class UserNotificationDto {
  @Field(() => Int)
  id: number;

  @Field(() => String)
  nik: string;

  @Field(() => String)
  title: string;

  @Field(() => String)
  message: string;

  @Field(() => String, { nullable: true })
  url?: string;

  @Field(() => String, { nullable: true })
  type?: string;

  @Field(() => Boolean)
  is_read: boolean;

  @Field(() => String)
  created_at: string;
}

@ObjectType()
export class UserNotificationResultDto {
  @Field(() => [UserNotificationDto])
  notifications: UserNotificationDto[];

  @Field(() => Int)
  unread_count: number;
}
```

- [ ] **Step 2: Create Repository**

Write `src/sdm/repositories/user-notif.repository.ts`:
```typescript
import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { UserNotificationDto } from '../dto/user-notif-types';

@Injectable()
export class UserNotifRepository {
  constructor(
    @InjectDataSource('sdm') private readonly dataSource: DataSource,
  ) {}

  async getUserNotifications(
    nik: string,
    limit = 20,
  ): Promise<UserNotificationDto[]> {
    const safeLimit = Math.min(Math.max(1, limit), 50);
    const rows = await this.dataSource.manager.query(
      `SELECT id, nik, title, message, url, type, is_read,
              DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS created_at
       FROM user_notifications
       WHERE nik = ?
       ORDER BY created_at DESC
       LIMIT ?`,
      [nik, safeLimit],
    );

    return rows.map((r: any) => ({
      id: Number(r.id),
      nik: String(r.nik),
      title: String(r.title),
      message: String(r.message),
      url: r.url ? String(r.url) : undefined,
      type: r.type ? String(r.type) : 'system',
      is_read: Boolean(r.is_read),
      created_at: String(r.created_at),
    }));
  }

  async getUnreadCount(nik: string): Promise<number> {
    const result = await this.dataSource.manager.query(
      `SELECT COUNT(*) AS total FROM user_notifications WHERE nik = ? AND is_read = 0`,
      [nik],
    );
    return Number(result[0]?.total || 0);
  }

  async markAsRead(id: number, nik: string): Promise<void> {
    await this.dataSource.manager.query(
      `UPDATE user_notifications SET is_read = 1 WHERE id = ? AND nik = ?`,
      [id, nik],
    );
  }

  async markAllAsRead(nik: string): Promise<void> {
    await this.dataSource.manager.query(
      `UPDATE user_notifications SET is_read = 1 WHERE nik = ? AND is_read = 0`,
      [nik],
    );
  }
}
```

- [ ] **Step 3: Create Service**

Write `src/sdm/user-notif.service.ts`:
```typescript
import { Injectable } from '@nestjs/common';
import { UserNotifRepository } from './repositories/user-notif.repository';
import { UserNotificationResultDto } from './dto/user-notif-types';

@Injectable()
export class UserNotifService {
  constructor(private readonly repo: UserNotifRepository) {}

  async getNotifications(
    user: any,
    limit = 20,
  ): Promise<UserNotificationResultDto> {
    const nik = String(user.username || user.nik || '');
    if (!nik) {
      return { notifications: [], unread_count: 0 };
    }

    const [notifications, unread_count] = await Promise.all([
      this.repo.getUserNotifications(nik, limit),
      this.repo.getUnreadCount(nik),
    ]);

    return { notifications, unread_count };
  }

  async markRead(id?: number, all?: boolean, user?: any): Promise<boolean> {
    const nik = String(user?.username || user?.nik || '');
    if (!nik) return false;

    if (all) {
      await this.repo.markAllAsRead(nik);
    } else if (id) {
      await this.repo.markAsRead(id, nik);
    }
    return true;
  }
}
```

- [ ] **Step 4: Create Resolver**

Write `src/sdm/user-notif.resolver.ts`:
```typescript
import { UseGuards } from '@nestjs/common';
import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { GqlThrottlerGuard } from '../common/guards/gql-throttler.guard';
import { GqlJwtSdmGuard } from './guards/gql-jwt-sdm.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserNotifService } from './user-notif.service';
import { UserNotificationResultDto } from './dto/user-notif-types';

@Resolver()
@UseGuards(GqlJwtSdmGuard, GqlThrottlerGuard)
export class UserNotifResolver {
  constructor(private readonly userNotifService: UserNotifService) {}

  @Query(() => UserNotificationResultDto, { name: 'userNotifications' })
  async getUserNotifications(
    @CurrentUser() user: any,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 20 })
    limit: number,
  ): Promise<UserNotificationResultDto> {
    return this.userNotifService.getNotifications(user, limit);
  }

  @Mutation(() => Boolean, { name: 'markNotificationRead' })
  async markNotificationRead(
    @CurrentUser() user: any,
    @Args('id', { type: () => Int, nullable: true }) id?: number,
    @Args('all', { type: () => Boolean, nullable: true }) all?: boolean,
  ): Promise<boolean> {
    return this.userNotifService.markRead(id, all, user);
  }
}
```

- [ ] **Step 5: Register in `sdm.module.ts`**

In `src/sdm/sdm.module.ts`:
- Import `UserNotifRepository`, `UserNotifService`, `UserNotifResolver`
- Add them to `providers` array

- [ ] **Step 6: Build & Validate Backend**

Run:
```bash
npm run build
```
Expected: Compiles with exit code 0.

- [ ] **Step 7: Commit Backend Changes**

```bash
git add src/sdm/dto/user-notif-types.ts src/sdm/repositories/user-notif.repository.ts src/sdm/user-notif.service.ts src/sdm/user-notif.resolver.ts src/sdm/sdm.module.ts
git commit -m "feat(sdm): add user notifications GraphQL query and mutation"
```

---

### Task 3: SDM Frontend Auto-Save & Bell Notification UI

**Files:**
- Modify: `/Users/hardiko/Documents/Developer/NEXT/sdm/src/lib/onesignal.js`
- Create: `/Users/hardiko/Documents/Developer/NEXT/sdm/src/app/api/notifications/route.js`
- Create: `/Users/hardiko/Documents/Developer/NEXT/sdm/src/app/api/notifications/read/route.js`
- Create: `/Users/hardiko/Documents/Developer/NEXT/sdm/src/hooks/useUserNotifications.js`
- Modify: `/Users/hardiko/Documents/Developer/NEXT/sdm/src/components/notifications/NotificationBell.js`
- Modify: `/Users/hardiko/Documents/Developer/NEXT/sdm/src/components/notifications/NotificationBellMobile.js`

**Interfaces:**
- Consumes: NestJS GraphQL endpoint `/graphql`
- Produces: Synchronized in-app notification bell visible to all employees

- [ ] **Step 1: Update `src/lib/onesignal.js` with auto-save to `user_notifications`**

In `sendPushNotification`:
```javascript
// Auto-persist notification to user_notifications table for each target NIK
try {
	const { insert } = await import("@/lib/db-helper");
	for (const nik of niks) {
		await insert({
			table: "user_notifications",
			data: {
				nik: nik,
				title: title,
				message: message,
				url: targetUrl,
				type: "system",
				is_read: 0,
			},
		}).catch((dbErr) =>
			console.warn(`Failed to log notification for NIK ${nik}:`, dbErr.message)
		);
	}
} catch (persistErr) {
	console.warn("Auto-persist notification error:", persistErr.message);
}
```

- [ ] **Step 2: Create API Routes `/api/notifications` and `/api/notifications/read`**

`src/app/api/notifications/route.js`:
- Proxies GraphQL query `userNotifications(limit: 20)` to `process.env.NEXT_PUBLIC_BACKEND_URL/graphql` using `auth_token` cookie.
- Returns `{ status: "success", data: { notifications, unread_count } }`.

`src/app/api/notifications/read/route.js`:
- Proxies GraphQL mutation `markNotificationRead(id: $id, all: $all)` using `auth_token` cookie.
- Returns `{ status: "success" }`.

- [ ] **Step 3: Create Hook `src/hooks/useUserNotifications.js`**

Fetch from `/api/notifications` with auto-refresh every 30s or on window focus.
Expose `{ notifications, unreadCount, loading, markAsRead, markAllAsRead, refresh }`.

- [ ] **Step 4: Update `NotificationBell.js` and `NotificationBellMobile.js`**

- Remove IT restriction (`user.departemen !== "IT"`).
- Render combined or user notifications.
- Display red badge with count.
- Dropdown panel displays notification title, message, relative time, click-to-navigate action, and "Tandai Semua Dibaca" button.

- [ ] **Step 5: Verify Frontend Build**

Run:
```bash
npm run build
```
Expected: Exit code 0.

- [ ] **Step 6: Commit Frontend Changes**

```bash
git add src/lib/onesignal.js src/app/api/notifications/route.js src/app/api/notifications/read/route.js src/hooks/useUserNotifications.js src/components/notifications/NotificationBell.js src/components/notifications/NotificationBellMobile.js docs/superpowers/plans/2026-09-15-nestjs-onesignal-bell-notification.md
git commit -m "feat(notifications): add NestJS-backed universal notification bell"
```
