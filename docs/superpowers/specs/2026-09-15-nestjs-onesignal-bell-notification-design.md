# NestJS-Backed OneSignal Bell Notification Design

## Summary
Build universal notification bell in SDM application header powered by NestJS GraphQL backend and OneSignal Web Push, storing notification history in MySQL `user_notifications` table for all employees.

## 1. Database Schema
Migration file: `database/migrations/create_user_notifications_table.sql`
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

## 2. NestJS Backend (`/Users/hardiko/Documents/Developer/NEXT/website/backend`)

### A. DTO (`src/sdm/dto/user-notif-types.ts`)
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

### B. Repository (`src/sdm/repositories/user-notif.repository.ts`)
- Target datasource: `'sdm'`
- `getUserNotifications(nik: string, limit = 20)`: Returns notifications ordered by `created_at DESC`.
- `getUnreadCount(nik: string)`: Returns count of `is_read = 0`.
- `markAsRead(id: number, nik: string)`: Updates `is_read = 1` for single record.
- `markAllAsRead(nik: string)`: Updates `is_read = 1` for all user unread records.

### C. Service (`src/sdm/user-notif.service.ts`)
- Resolves user NIK from JWT payload (`user.username || user.nik`).
- Delegates to `UserNotifRepository`.

### D. Resolver (`src/sdm/user-notif.resolver.ts`)
- Guard: `@UseGuards(GqlJwtSdmGuard, GqlThrottlerGuard)`
- Query: `userNotifications(limit: Int): Promise<UserNotificationResultDto>`
- Mutation: `markNotificationRead(id: Int, all: Boolean): Promise<boolean>`

### E. Module (`src/sdm/sdm.module.ts`)
- Register `UserNotifRepository`, `UserNotifService`, `UserNotifResolver`.

## 3. SDM Frontend (`/Users/hardiko/Documents/Developer/NEXT/sdm`)

### A. Auto-Save in Push Helper (`src/lib/onesignal.js`)
- In `sendPushNotification`, whenever notifications sent:
  Batch insert into `user_notifications` table using `insert` or `rawQuery`.
  Wrapped in `try/catch` so push errors don't affect DB and DB errors don't fail push.

### B. API Route (`src/app/api/notifications/route.js`)
- `GET`: Authenticates via JWT cookie, proxies GraphQL query `userNotifications` to NestJS.
- Returns `{ status: "success", data: { notifications: [...], unread_count: N } }`.

### C. API Route (`src/app/api/notifications/read/route.js`)
- `PUT`: Receives `{ id, all }`, proxies GraphQL mutation `markNotificationRead` to NestJS.

### D. Component (`src/components/notifications/NotificationBell.js` & `NotificationBellMobile.js`)
- Remove `if (!user || user.departemen !== "IT") return null;`.
- Fetch notifications from `/api/notifications`.
- Badge display: `unreadCount > 0` shows red badge (`9+` if > 9).
- Dropdown items:
  - Icon based on type (Calendar for tukar dinas, Award/Clipboard for penilaian, Bell for general).
  - Title, message, relative time (`moment(created_at).fromNow()`).
  - Unread blue dot indicator.
  - Click handler: calls mark as read, closes dropdown, navigates to notification `url`.
- "Tandai Semua Dibaca" button in dropdown header.
- Empty state when no notifications.

## 4. Verification Plan
1. Run migration in database.
2. Build & test NestJS backend (`npm run build`).
3. Build & test SDM frontend (`npm run build`).
4. Trigger push notification (e.g. submit tukar dinas or admin push).
5. Verify bell icon displays unread count badge.
6. Click bell icon, verify dropdown list displays notification title, message, time.
7. Click notification item, verify navigation to destination and unread count decrement.
8. Click "Tandai Semua Dibaca", verify badge disappears.
