# Sistem Ticket Assignment IT Support

Sistem ini memungkinkan user dari departemen IT untuk menugaskan ticket kepada pegawai IT yang tersedia.

## Fitur Utama

### 1. Authorization

- Hanya user dengan departemen "IT" yang dapat mengakses halaman ini
- Validasi dilakukan di level API dan frontend
- Redirect otomatis jika user tidak memiliki akses

### 2. Assignment Management

- Menugaskan ticket ke pegawai IT
- Melepas assignment ticket
- Tracking beban kerja pegawai IT
- History assignment dengan timestamp

### 3. Filtering & Search

- Filter berdasarkan status, prioritas, kategori
- Filter berdasarkan pegawai yang ditugaskan
- Pencarian berdasarkan nomor ticket, judul, deskripsi
- Filter ticket yang belum ditugaskan

## Komponen

### AssignmentCard.js

Komponen card untuk menampilkan ticket dengan informasi assignment.

**Props:**

- `ticket` (object): Data ticket dengan informasi assignment
- `onAssign` (function): Callback untuk menugaskan ticket
- `onRelease` (function): Callback untuk melepas assignment
- `onViewDetails` (function): Callback untuk melihat detail ticket

**Fitur:**

- Menampilkan informasi ticket lengkap
- Status assignment dengan color coding
- Tombol assign untuk ticket yang belum ditugaskan
- Tombol release untuk ticket yang sudah ditugaskan
- Informasi pegawai yang ditugaskan dan tanggal assignment

### AssignmentModal.js

Modal untuk menugaskan ticket ke pegawai IT.

**Props:**

- `showModal` (boolean): Status modal terbuka/tertutup
- `ticket` (object): Data ticket yang akan ditugaskan
- `itEmployees` (array): Daftar pegawai IT
- `onAssign` (function): Callback untuk submit assignment
- `onClose` (function): Callback untuk menutup modal
- `showToast` (function): Function untuk menampilkan toast

**Fitur:**

- Dropdown pegawai IT dengan jumlah ticket aktif
- Validasi form
- Loading state

### AssignmentFilterAccordion.js

Komponen filter dan statistik untuk ticket assignment.

**Props:**

- `filters` (object): State filter saat ini
- `setFilters` (function): Function untuk mengubah filter
- `isOpen` (boolean): Status accordion terbuka/tertutup
- `setIsOpen` (function): Function untuk toggle accordion
- `loading` (boolean): Status loading
- `masterData` (object): Data master untuk dropdown
- `itEmployees` (array): Daftar pegawai IT

**Fitur:**

- Filter status, prioritas, kategori
- Filter berdasarkan pegawai yang ditugaskan
- Pencarian ticket
- Statistik real-time:
  - Jumlah pegawai IT
  - Total ticket aktif
  - Pegawai tersedia (0 ticket)
  - Rata-rata beban kerja

## Custom Hook

### useTicketAssignment.js

Hook untuk mengelola logika ticket assignment.

**Returns:**

- `tickets`: Array data ticket dengan informasi assignment
- `itEmployees`: Array pegawai IT dengan jumlah ticket aktif
- `masterData`: Data master (categories, priorities, statuses)
- `loading`: Status loading
- `filters`: State filter
- `setFilters`: Function untuk mengubah filter
- `pagination`: Data pagination
- `fetchTickets`: Function untuk fetch data ticket
- `assignTicket`: Function untuk menugaskan ticket
- `releaseAssignment`: Function untuk melepas assignment
- `fetchItEmployees`: Function untuk refresh data pegawai IT

## API Endpoints

### /api/ticket-assignment

**GET** - Mengambil daftar ticket untuk assignment

- Query parameters: status, priority, category, assigned_to, search, page, limit
- Authorization: Hanya departemen IT
- Response: Data ticket dengan informasi assignment

**POST** - Menugaskan ticket ke pegawai IT

- Body: ticket_id, assigned_to
- Authorization: Hanya departemen IT
- Validasi: Pegawai harus dari departemen IT

**PUT** - Melepas assignment (set released_date)

- Body: ticket_id
- Authorization: Hanya departemen IT
- Action: Set released_date dan hapus assigned_to dari ticket

### /api/it-employees

**GET** - Mengambil daftar pegawai IT

- Authorization: Hanya departemen IT
- Response: Data pegawai IT dengan jumlah ticket aktif

## Database Schema

### Tabel assignments_ticket

```sql
CREATE TABLE assignments_ticket (
    assignment_id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    assigned_to VARCHAR(20) NOT NULL,
    assigned_by VARCHAR(20) NOT NULL,
    assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    released_date TIMESTAMP NULL,

    FOREIGN KEY (ticket_id) REFERENCES tickets(ticket_id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES pegawai(nik) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES pegawai(nik) ON DELETE CASCADE
);
```

### Kolom Tambahan di Tabel tickets

```sql
ALTER TABLE tickets
ADD COLUMN assigned_to VARCHAR(20) NULL;
```

### Status Baru

- **Assigned**: Ticket telah ditugaskan ke pegawai IT
- **In Progress**: Ticket sedang dikerjakan oleh pegawai IT
- **Pending Review**: Ticket menunggu review dari user

## Workflow Assignment

1. **User IT** melihat daftar ticket yang masuk
2. **Filter** ticket berdasarkan kriteria (prioritas, kategori, dll)
3. **Pilih ticket** yang belum ditugaskan
4. **Klik tombol "Tugaskan"** untuk membuka modal assignment
5. **Pilih pegawai IT** dari dropdown (menampilkan beban kerja)
6. **Submit** assignment
7. **Ticket status** berubah menjadi "Assigned"
8. **Pegawai IT** yang ditugaskan dapat melihat ticket di dashboard mereka
9. **User IT** dapat **melepas assignment** jika diperlukan

## Security Features

- **Departemen Validation**: Hanya user IT yang dapat mengakses
- **JWT Token**: Validasi token untuk setiap request
- **Assignment Ownership**: Tracking siapa yang menugaskan
- **Employee Validation**: Memastikan pegawai yang ditugaskan dari departemen IT

## Monitoring & Analytics

- **Real-time Statistics**: Jumlah pegawai, ticket aktif, beban kerja
- **Load Balancing**: Menampilkan jumlah ticket aktif per pegawai
- **Assignment History**: Tracking semua assignment dengan timestamp
- **Release Tracking**: Monitoring kapan assignment dilepas

## Fitur Baru

### Assignment Release

- User IT dapat melepas assignment yang sudah diberikan
- Ticket akan kembali ke status "Open" dan assigned_to menjadi null
- History assignment tetap tersimpan dengan released_date
- Konfirmasi sebelum melepas assignment

### Simplified Structure

- Menghilangkan field notes dan status dari assignment
- Fokus pada tracking assignment dan release
- Struktur tabel yang lebih sederhana dan efisien

## Penggunaan

```jsx
import TicketAssignmentPage from "@/app/dashboard/ticket-assignment/page";

// Halaman akan otomatis:
// 1. Validasi authorization user IT
// 2. Fetch data ticket dan pegawai IT
// 3. Menampilkan interface assignment
// 4. Handle assignment dan release workflow
```

## Testing Checklist

- [ ] Authorization: User non-IT tidak dapat mengakses
- [ ] Assignment: Ticket berhasil ditugaskan ke pegawai IT
- [ ] Release: Assignment berhasil dilepas dan ticket kembali ke status Open
- [ ] Filtering: Semua filter berfungsi dengan benar
- [ ] Statistics: Data statistik akurat dan real-time
- [ ] Load Balancing: Beban kerja pegawai ditampilkan dengan benar
- [ ] Validation: Form assignment tervalidasi dengan benar
- [ ] Error Handling: Error ditangani dan ditampilkan dengan baik
- [ ] Responsive: Interface responsive di berbagai device
