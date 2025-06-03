# Notification System Documentation

## Overview

Sistem notifikasi untuk ticket assignment yang akan memberitahu pegawai IT ketika mereka ditugaskan untuk menangani ticket dari user. **Sistem ini menggunakan pendekatan hybrid: NotificationBell untuk desktop dan FloatingNotification untuk mobile.**

## Komponen

### 1. NotificationBell (Desktop Only)

Komponen bell icon dengan badge notifikasi yang ditampilkan di header dashboard desktop.

**Props:**

- Tidak ada props external, menggunakan `useNotifications` hook

**Features:**

- Badge menampilkan jumlah notifikasi belum dibaca
- Dropdown panel dengan daftar notifikasi
- Mark individual notification as read
- Mark all notifications as read
- Auto refresh setiap 30 detik
- **Desktop only** (hidden di mobile)

**Usage:**

```jsx
import { NotificationBell } from "@/components/notifications";

// Di header desktop saja
<div className="hidden md:block">
	<NotificationBell />
</div>;
```

### 2. FloatingNotification (Mobile Only)

Komponen floating icon yang berada di pojok kiri atas untuk mobile dengan bottom sheet modal.

**Props:**

- Tidak ada props external, menggunakan `useNotifications` hook

**Features:**

- **Floating button** di pojok kiri atas (fixed top-4 left-4)
- Circular button dengan warna blue-600
- Badge untuk unread count
- **Pulse animation** untuk notifikasi urgent
- **Bottom sheet modal** dengan spring animation
- Touch-optimized interactions
- **Mobile only** (hidden di desktop)

**Mobile Adaptations:**

- Bottom sheet modal dengan handle bar
- Enhanced header dengan unread count info
- Staggered animation untuk notification items
- Touch-friendly button sizes
- Spring transitions untuk smooth UX

**Usage:**

```jsx
import { FloatingNotification } from "@/components/notifications";

// Di layout global - otomatis hidden di desktop
<FloatingNotification />;
```

### 3. NotificationAlert (Cross-Platform)

Komponen alert banner yang menampilkan notifikasi urgent di dashboard utama.

**Props:**

- Tidak ada props external, menggunakan `useNotifications` hook

**Features:**

- Hanya menampilkan notifikasi yang urgent dan belum dibaca
- Maksimal 3 notifikasi ditampilkan
- Dismiss individual notification
- Link ke detail ticket (optional)
- Progress bar untuk indikator urgency
- **Fully responsive** untuk mobile dan desktop

**Usage:**

```jsx
import { NotificationAlert } from "@/components/notifications";

// Di dashboard page - responsive untuk both platforms
<NotificationAlert />;
```

## Mobile Implementation

### Layout Integration

#### Desktop Header

```jsx
// src/app/dashboard/layout.js
// Hidden on mobile (hidden md:block)
<div className="hidden md:block mb-4 bg-white p-4 rounded-lg shadow-sm">
	<div className="flex justify-between items-center">
		<button>...</button>
		<div className="flex items-center gap-4">
			<NotificationBell />
			<UserProfile />
		</div>
	</div>
</div>
```

#### Mobile Floating Notification

```jsx
// src/app/dashboard/layout.js
// Global floating notification - auto hidden di desktop
<FloatingNotification />
```

#### Dashboard Content

```jsx
// src/app/dashboard/page.js
// Works on both mobile and desktop
<div className="max-w-lg mx-auto space-y-4">
	<NotificationAlert />
	{/* ... rest of content */}
</div>
```

### Floating Design Benefits

#### **Better Mobile UX:**

- **Non-intrusive**: Tidak memakan space header
- **Always accessible**: Selalu terlihat di pojok layar
- **Familiar pattern**: Mengikuti design pattern aplikasi mobile modern
- **Gesture-friendly**: Bottom sheet dengan swipe gesture

#### **Visual Hierarchy:**

- **Primary action**: Floating button sebagai primary CTA
- **Clear positioning**: Pojok kiri atas untuk easy reach
- **Contextual feedback**: Badge dan pulse animation
- **Z-index management**: Proper layering (z-50)

### Responsive Features

#### Breakpoints

- **Mobile**: < 768px (md breakpoint) → FloatingNotification
- **Desktop**: ≥ 768px → NotificationBell

#### Key Responsive Elements

1. **Desktop (NotificationBell):**

   - Header integration dengan dropdown
   - Horizontal layout untuk info
   - Standard desktop interactions

2. **Mobile (FloatingNotification):**

   - Floating button (w-12 h-12) di top-4 left-4
   - Bottom sheet modal dengan spring animation
   - Vertical layout untuk touch optimization
   - Enhanced visual feedback

3. **Floating Button Features:**

   - Circular design (rounded-full)
   - Color: bg-blue-600 hover:bg-blue-700
   - Shadow: shadow-lg untuk elevation
   - Badge: Absolute positioned (-top-1 -right-1)
   - Pulse: Untuk urgent notifications

4. **Bottom Sheet Modal:**
   - Full width bottom sheet (fixed bottom-0 left-0 right-0)
   - Rounded top corners (rounded-t-2xl)
   - Handle bar untuk visual affordance
   - Spring animation dengan damping dan stiffness
   - Max height 85vh dengan overflow scroll

## Hooks

### useNotifications

Custom hook untuk mengelola state dan API call notifikasi.

**Returns:**

```javascript
{
  notifications: Array,     // Daftar notifikasi
  unreadCount: Number,      // Jumlah notifikasi belum dibaca
  loading: Boolean,         // Status loading
  fetchNotifications: Function,  // Fetch notifikasi
  markAsRead: Function,     // Mark notifikasi as read
  markAllAsRead: Function   // Mark semua notifikasi as read
}
```

**Functions:**

- `fetchNotifications(unreadOnly = false, limit = 10)` - Ambil daftar notifikasi
- `markAsRead(assignmentId)` - Tandai notifikasi sebagai sudah dibaca
- `markAllAsRead()` - Tandai semua notifikasi sebagai sudah dibaca

## API Endpoints

### GET /api/notifications/assignments

Mengambil daftar notifikasi assignment untuk user yang sedang login.

**Query Parameters:**

- `limit` (optional): Maksimal jumlah notifikasi (default: 10)
- `unread_only` (optional): Hanya notifikasi belum dibaca (default: false)

**Response:**

```json
{
	"status": "success",
	"data": {
		"notifications": [
			{
				"assignment_id": 1,
				"ticket_id": 123,
				"assigned_date": "01 Januari 2024 10:30",
				"is_read": false,
				"no_ticket": "TKT-2024-001",
				"title": "Computer not working",
				"description": "My computer won't start",
				"requester_name": "John Doe",
				"requester_department": "Finance",
				"category_name": "Hardware",
				"priority_name": "High",
				"priority_level": 4,
				"current_status": "Assigned",
				"assigned_by_name": "Admin IT",
				"time_ago": "2 jam yang lalu",
				"is_urgent": true
			}
		],
		"unread_count": 5
	}
}
```

### PUT /api/notifications/assignments

Mark notifikasi sebagai sudah dibaca.

**Request Body:**

```json
{
	"assignment_id": 1, // Optional: ID assignment spesifik
	"mark_all": false // Optional: Mark semua notifikasi as read
}
```

**Response:**

```json
{
	"status": "success",
	"message": "Notifikasi berhasil ditandai sebagai sudah dibaca"
}
```

## Database Schema

### Tambahan Kolom assignments_ticket

```sql
ALTER TABLE assignments_ticket
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE,
ADD INDEX IF NOT EXISTS idx_is_read (is_read);
```

## Installation & Setup

1. **Run database migration:**

```sql
-- Jalankan script di database/create_ticket_assignments_table.sql
-- untuk menambahkan kolom is_read
```

2. **Import komponen di layout:**

```jsx
// src/app/dashboard/layout.js
import { NotificationBell, FloatingNotification } from '@/components/notifications';

// Desktop header
<div className="hidden md:block ...">
  <NotificationBell />
</div>

// Mobile floating (global)
<FloatingNotification />
```

3. **Import komponen di dashboard:**

```jsx
// src/app/dashboard/page.js
import { NotificationAlert } from "@/components/notifications";

// Responsive - works on both platforms
<NotificationAlert />;
```

## Flow Notifikasi

1. **Assignment Creation:**

   - Saat ticket ditugaskan melalui `/dashboard/ticket-assignment`
   - Record dibuat di tabel `assignments_ticket` dengan `is_read = FALSE`

2. **Notification Display:**

   - **Desktop**: `NotificationBell` di header menampilkan badge
   - **Mobile**: `FloatingNotification` muncul di pojok kiri atas
   - **Both**: `NotificationAlert` di dashboard untuk notifikasi urgent

3. **User Interaction:**

   - **Desktop**: Click bell → dropdown muncul
   - **Mobile**: Tap floating button → bottom sheet slides up
   - **Touch**: Optimized untuk finger interaction

4. **Mark as Read:**

   - User dapat mark individual notification atau mark all
   - Update kolom `is_read = TRUE` di database
   - UI update secara real-time dengan animation

5. **Auto Refresh:**
   - Notifikasi di-refresh otomatis setiap 30 detik
   - Sync antar desktop dan mobile

## Mobile UX Features

### Floating Button Design

- **Position**: Fixed top-4 left-4 untuk easy thumb reach
- **Size**: w-12 h-12 optimal untuk touch target
- **Color**: Blue gradient untuk brand consistency
- **Shadow**: Elevated shadow untuk depth perception
- **Animation**: Hover scale dan tap feedback

### Bottom Sheet Modal

- **Native feel**: iOS/Android style bottom sheet
- **Handle bar**: Visual affordance untuk gesture
- **Spring animation**: Natural movement dengan physics
- **Backdrop**: Semi-transparent untuk focus
- **Scroll**: Proper overflow handling

### Touch Optimizations

- **Larger touch targets**: Minimum 44px untuk buttons
- **Proper spacing**: Adequate gap untuk finger navigation
- **Feedback animations**: Scale dan color changes
- **Gesture support**: Swipe to dismiss (backdrop tap)

### Visual Enhancements

- **Staggered animations**: Sequential item appearance
- **Pulse effect**: For urgent notifications
- **Enhanced typography**: Improved hierarchy
- **Color coding**: Urgent vs normal notifications

## Styling & Responsive Design

### Floating Button Classes

```css
/* Floating Button */
fixed top-4 left-4 z-50 md:hidden    /* Position & visibility */
w-12 h-12                            /* Size */
bg-blue-600 hover:bg-blue-700        /* Colors */
rounded-full shadow-lg               /* Shape & elevation */

/* Badge */
absolute -top-1 -right-1             /* Position */
bg-red-500 text-white                /* Colors */
h-5 w-5 rounded-full                 /* Shape */
text-[10px] font-bold                /* Typography */

/* Pulse Animation */
animate-pulse                        /* For urgent notifications */
bg-red-500 opacity-30                /* Pulse color */
```

### Bottom Sheet Classes

```css
/* Modal Container */
fixed bottom-0 left-0 right-0        /* Full width bottom */
bg-white rounded-t-2xl               /* Appearance */
shadow-2xl z-50                     /* Elevation */
max-h-[85vh] overflow-hidden         /* Size constraints */

/* Spring Animation */
transition: type="spring"            /* Natural movement */
damping: 25, stiffness: 200         /* Physics parameters */

/* Content Layout */
divide-y divide-gray-100             /* Separators */
p-4 hover:bg-gray-50                /* Touch targets */
```

### Animation Libraries

- **Framer Motion**: Advanced animations dengan spring physics
- **AnimatePresence**: Enter/exit transitions
- **Staggered animations**: Sequential item reveals

## Security & Performance

- **Platform-specific rendering**: Optimal code splitting
- **Touch optimizations**: Better mobile performance
- **Animation performance**: Hardware acceleration
- **Memory management**: Proper cleanup untuk floating elements

## Browser Compatibility

- **Desktop**: Chrome, Firefox, Safari, Edge (modern versions)
- **Mobile**: iOS Safari 12+, Chrome Mobile 80+, Samsung Browser
- **Floating elements**: Full support untuk fixed positioning
- **Spring animations**: Hardware acceleration support
