# Komponen Ticket

Folder ini berisi komponen-komponen yang digunakan untuk sistem pelaporan IT Support.

## Struktur Komponen

### 1. Toast.js

Komponen untuk menampilkan notifikasi toast.

**Props:**

- `message` (string): Pesan yang akan ditampilkan
- `type` (string): Tipe toast ('success' atau 'error')
- `onClose` (function): Callback ketika toast ditutup

### 2. LoadingSkeleton.js

Komponen skeleton loading untuk menampilkan placeholder saat data sedang dimuat.

### 3. FilterAccordion.js

Komponen accordion untuk filter dan aksi.

**Props:**

- `filters` (object): State filter saat ini
- `setFilters` (function): Function untuk mengubah filter
- `isOpen` (boolean): Status accordion terbuka/tertutup
- `setIsOpen` (function): Function untuk toggle accordion
- `onAddClick` (function): Callback ketika tombol tambah diklik
- `loading` (boolean): Status loading
- `masterData` (object): Data master untuk dropdown

**Fitur Filter:**

- Status ticket
- Prioritas ticket
- Kategori ticket
- Pencarian (nomor ticket, judul, deskripsi)
- Toggle "Hanya Ticket Saya"

### 4. TicketCard.js

Komponen card untuk menampilkan informasi ticket.

**Props:**

- `ticket` (object): Data ticket
- `onEdit` (function): Callback ketika tombol edit diklik
- `onDelete` (function): Callback ketika tombol hapus diklik

**Data yang ditampilkan:**

- Nomor ticket (no_ticket)
- Judul dan deskripsi
- Nama user dan departemen
- Kategori ticket
- Tanggal submission
- Prioritas dan status

### 5. TicketModal.js

Komponen modal untuk form tambah/edit ticket.

**Props:**

- `showModal` (boolean): Status modal terbuka/tertutup
- `modalMode` (string): Mode modal ('add' atau 'edit')
- `formData` (object): Data form
- `setFormData` (function): Function untuk mengubah data form
- `errors` (object): Error validasi
- `masterData` (object): Data master untuk dropdown
- `onSubmit` (function): Callback ketika form disubmit
- `onClose` (function): Callback ketika modal ditutup
- `showToast` (function): Function untuk menampilkan toast

### 6. Pagination.js

Komponen pagination untuk navigasi halaman.

**Props:**

- `pagination` (object): Data pagination
- `onPageChange` (function): Callback ketika halaman berubah

### 7. EmptyState.js

Komponen untuk menampilkan state kosong ketika tidak ada data.

## Custom Hooks

### useTicket.js

Hook untuk mengelola logika ticket (CRUD operations, filtering, pagination).

**Returns:**

- `tickets`: Array data ticket
- `masterData`: Data master (categories, priorities, statuses, departments)
- `loading`: Status loading
- `filters`: State filter (status, priority, category, search, myTickets)
- `setFilters`: Function untuk mengubah filter
- `pagination`: Data pagination
- `fetchTickets`: Function untuk fetch data ticket
- `createTicket`: Function untuk membuat ticket baru
- `updateTicket`: Function untuk update ticket
- `deleteTicket`: Function untuk hapus ticket

### useToast.js

Hook untuk mengelola toast notifications.

**Returns:**

- `toast`: State toast
- `showToast`: Function untuk menampilkan toast
- `hideToast`: Function untuk menyembunyikan toast

## Fitur Backend

### Nomor Ticket Otomatis

- Format: `TKT-YYYYMMDD-XXXX`
- Contoh: `TKT-20241201-0001`
- Auto-increment per hari
- Unique constraint

### JWT Token Integration

- User ID dan Departemen ID diambil dari JWT token
- Authorization untuk CRUD operations
- Filter "Ticket Saya" berdasarkan user login

### Pencarian

- Pencarian berdasarkan nomor ticket
- Pencarian berdasarkan judul ticket
- Pencarian berdasarkan deskripsi ticket
- Case-insensitive search

### Security

- User hanya bisa edit/hapus ticket miliknya sendiri
- Token validation untuk semua operations
- Error handling untuk unauthorized access

## Database Schema

### Kolom Baru: no_ticket

```sql
ALTER TABLE tickets
ADD COLUMN no_ticket VARCHAR(20) UNIQUE AFTER ticket_id;

CREATE INDEX idx_no_ticket ON tickets(no_ticket);
```

## Penggunaan

```jsx
import {
	Toast,
	LoadingSkeleton,
	FilterAccordion,
	TicketCard,
	TicketModal,
	Pagination,
	EmptyState,
} from "@/components/ticket";

import useTicket from "@/hooks/useTicket";
import useToast from "@/hooks/useToast";
```

## Keuntungan Pemecahan Komponen

1. **Reusability**: Komponen dapat digunakan kembali di tempat lain
2. **Maintainability**: Lebih mudah untuk maintenance dan debugging
3. **Readability**: Kode lebih mudah dibaca dan dipahami
4. **Testing**: Setiap komponen dapat ditest secara terpisah
5. **Performance**: Optimisasi rendering yang lebih baik
6. **Separation of Concerns**: Setiap komponen memiliki tanggung jawab yang jelas
