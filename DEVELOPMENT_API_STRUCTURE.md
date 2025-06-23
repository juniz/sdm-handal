# Development Requests API Structure

## 📡 API Endpoints Overview

### Base URL

```
/api/development/
```

## 🔗 Main CRUD Operations

### GET /api/development

**Mengambil daftar pengajuan pengembangan dengan filter dan pagination**

**Query Parameters:**

```javascript
{
  page?: number = 1,
  limit?: number = 10,
  user_id?: string,
  status?: string,
  priority?: string,
  module_type?: string,
  search?: string,
  my_requests?: boolean,
  date_from?: string,
  date_to?: string,
  sort_by?: string = 'submission_date',
  sort_order?: 'asc' | 'desc' = 'desc'
}
```

**Response:**

```javascript
{
  status: "success",
  data: [
    {
      request_id: 1,
      no_request: "DEV-20241201-0001",
      user_id: "12345",
      user_name: "John Doe",
      departemen_name: "Finance",
      module_type: "Web Application",
      priority_name: "High",
      priority_level: 2,
      priority_color: "#fd7e14",
             title: "Sistem Manajemen Inventori",
       description: "Aplikasi untuk mengelola inventori...",
       current_system_issues: "Sistem manual yang lambat...",
       proposed_solution: "Membuat aplikasi web...",
       expected_completion_date: "2024-03-01",
      current_status: "Submitted",
      status_color: "#17a2b8",
      submission_date: "01 Desember 2024 10:30",
      notes_count: 3,
      attachments_count: 2
    }
  ],
  pagination: {
    page: 1,
    limit: 10,
    total: 25,
    totalPages: 3
  }
}
```

### POST /api/development

**Membuat pengajuan pengembangan baru**

**Request Body:**

```javascript
{
  module_type_id: number,
  priority_id: number,
  title: string,
  description: string,
  current_system_issues?: string,
  proposed_solution?: string,
  expected_completion_date?: string
}
```

**Response:**

```javascript
{
  status: "success",
  message: "Pengajuan pengembangan berhasil dibuat",
  data: {
    request_id: 123,
    no_request: "DEV-20241201-0001"
  }
}
```

### GET /api/development/[id]

**Mengambil detail pengajuan pengembangan**

**Response:**

```javascript
{
  status: "success",
  data: {
    request_id: 1,
    no_request: "DEV-20241201-0001",
    user_id: "12345",
    user_name: "John Doe",
    departemen_name: "Finance",
    module_type: "Web Application",
    priority_name: "High",
         title: "Sistem Manajemen Inventori",
     description: "Aplikasi untuk mengelola inventori...",
     current_system_issues: "Sistem manual yang lambat...",
     proposed_solution: "Membuat aplikasi web...",
    expected_completion_date: "2024-03-01",
    current_status: "In Development",
    status_color: "#fd7e14",
    submission_date: "01 Desember 2024 10:30",
    approved_date: "05 Desember 2024 14:20",
    approved_by: "IT001",
    approved_by_name: "Jane Smith",
    development_start_date: "10 Desember 2024 09:00",
    assigned_developer: "DEV001",
    assigned_developer_name: "Mike Johnson",
    progress_percentage: 45,
    notes_count: 5,
    attachments_count: 3
  }
}
```

### PUT /api/development/[id]

**Mengupdate pengajuan pengembangan**

**Request Body:** (sama seperti POST, semua field optional)

### DELETE /api/development/[id]

**Menghapus pengajuan pengembangan**

## 📝 Notes Management

### GET /api/development/[id]/notes

**Mengambil semua catatan/komentar untuk pengajuan**

**Response:**

```javascript
{
  status: "success",
  data: [
    {
      note_id: 1,
      note: "Perlu klarifikasi mengenai integrasi dengan sistem ERP",
      note_type: "clarification",
      created_by: "IT001",
      created_by_name: "Jane Smith",
      created_date: "02 Desember 2024 11:30"
    }
  ]
}
```

### POST /api/development/[id]/notes

**Menambah catatan/komentar baru**

**Request Body:**

```javascript
{
  note: string,
  note_type: "comment" | "feedback" | "approval" | "rejection" | "clarification" | "update"
}
```

## 📎 Attachments Management

### GET /api/development/[id]/attachments

**Mengambil daftar lampiran**

**Response:**

```javascript
{
  status: "success",
  data: [
    {
      attachment_id: 1,
      file_name: "spesifikasi_sistem.pdf",
      file_path: "/uploads/development/1/spesifikasi_sistem.pdf",
      file_type: "application/pdf",
      file_size: 2048576,
      attachment_type: "specification",
      uploaded_by: "12345",
      uploaded_by_name: "John Doe",
      upload_date: "01 Desember 2024 10:35"
    }
  ]
}
```

### POST /api/development/[id]/attachments

**Upload lampiran baru**

**Request:** Multipart form data

```javascript
{
  file: File,
  attachment_type: "document" | "image" | "mockup" | "specification" | "other"
}
```

### DELETE /api/development/[id]/attachments/[attachment_id]

**Menghapus lampiran**

## 👨‍💻 Assignment Management

### POST /api/development/[id]/assign

**Assign pengajuan ke developer**

**Request Body:**

```javascript
{
  assigned_to: string,
  assignment_notes?: string,
  estimated_hours?: number
}
```

### GET /api/development/[id]/assignments

**Mengambil riwayat assignment**

**Response:**

```javascript
{
  status: "success",
  data: [
    {
      assignment_id: 1,
      assigned_to: "DEV001",
      assigned_to_name: "Mike Johnson",
      assigned_by: "IT001",
      assigned_by_name: "Jane Smith",
      assignment_date: "10 Desember 2024 09:00",
      assignment_notes: "Prioritas tinggi, deadline akhir bulan",
      estimated_hours: 120,
      is_active: true
    }
  ]
}
```

## 📈 Progress Tracking

### GET /api/development/[id]/progress

**Mengambil riwayat progress**

**Response:**

```javascript
{
  status: "success",
  data: [
    {
      progress_id: 1,
      progress_percentage: 45,
      progress_description: "Selesai membuat database schema dan API endpoints",
      milestone: "Backend Development",
      updated_by: "DEV001",
      updated_by_name: "Mike Johnson",
      update_date: "15 Desember 2024 16:30"
    }
  ]
}
```

### POST /api/development/[id]/progress

**Update progress pengembangan**

**Request Body:**

```javascript
{
  progress_percentage: number,
  progress_description: string,
  milestone?: string
}
```

## 🔄 Status Management

### PATCH /api/development/[id]/status

**Mengubah status pengajuan**

**Request Body:**

```javascript
{
  status_id: number,
  change_reason?: string,
  additional_data?: {
    // Data tambahan sesuai status
    approval_notes?: string,
    rejection_reason?: string
  }
}
```

**Response:**

```javascript
{
  status: "success",
  message: "Status berhasil diubah",
  data: {
    old_status: "Submitted",
    new_status: "Approved",
    changed_by: "IT001"
  }
}
```

## 📊 Master Data APIs

### GET /api/development/master/types

**Mengambil master data jenis modul**

**Response:**

```javascript
{
  status: "success",
  data: [
    {
      type_id: 1,
      type_name: "Web Application",
      type_description: "Aplikasi berbasis web untuk internal/eksternal",
      is_active: true
    }
  ]
}
```

### GET /api/development/master/priorities

**Mengambil master data prioritas**

### GET /api/development/master/statuses

**Mengambil master data status**

## 📊 Dashboard & Statistics

### GET /api/development/dashboard

**Mengambil statistik untuk dashboard**

**Response:**

```javascript
{
  status: "success",
  data: {
         total_requests: 156,
     pending_review: 12,
     in_progress: 8,
     completed_this_month: 5,
     rejected: 3,
     avg_completion_days: 45.5,
    status_distribution: [
      { status_name: "Submitted", count: 12, percentage: 7.7 },
      { status_name: "In Development", count: 8, percentage: 5.1 }
    ],
    monthly_trends: [
      { month: "2024-10", submitted: 15, completed: 8 },
      { month: "2024-11", submitted: 18, completed: 12 }
    ],
         department_analysis: [
       { department: "Finance", total_requests: 25, avg_completion_days: 42 },
       { department: "HR", total_requests: 18, avg_completion_days: 38 }
     ],
    priority_distribution: [
      { priority_name: "High", count: 45, color: "#fd7e14" },
      { priority_name: "Medium", count: 78, color: "#ffc107" }
    ]
  }
}
```

### GET /api/development/dashboard/my-stats

**Statistik untuk user yang sedang login**

**Response:**

```javascript
{
  status: "success",
  data: {
    my_total_requests: 12,
    my_pending: 3,
    my_in_progress: 2,
    my_completed: 7,
    my_avg_completion_days: 42.3,
    recent_activities: [
      {
        type: "status_change",
        message: "Request DEV-20241201-0001 status changed to In Development",
        date: "15 Desember 2024 10:30"
      }
    ]
  }
}
```

## 📈 Reporting APIs

### GET /api/development/reports/summary

**Laporan ringkasan periode tertentu**

**Query Parameters:**

```javascript
{
  date_from: string,
  date_to: string,
  department?: string,
  status?: string,
  format?: "json" | "excel" | "pdf"
}
```

### GET /api/development/reports/timeline

**Laporan timeline analysis**

### GET /api/development/reports/performance

**Laporan performance metrics**

## 🔍 Search & Filter APIs

### GET /api/development/search

**Advanced search dengan multiple criteria**

**Query Parameters:**

```javascript
{
  q?: string,                    // General search
  title?: string,               // Search in title
  description?: string,         // Search in description
  business_case?: string,       // Search in business justification
  status_ids?: number[],        // Multiple status IDs
  priority_ids?: number[],      // Multiple priority IDs
  module_type_ids?: number[],   // Multiple module type IDs
  user_ids?: string[],          // Multiple user IDs
  department_ids?: number[],    // Multiple department IDs
     has_attachments?: boolean,    // Filter by attachment presence
  submission_date_from?: string,
  submission_date_to?: string,
  expected_completion_from?: string,
  expected_completion_to?: string
}
```

## 🔔 Notification APIs

### GET /api/development/notifications

**Mengambil notifikasi untuk user**

**Response:**

```javascript
{
  status: "success",
  data: [
    {
      notification_id: 1,
      type: "status_change",
      title: "Status Pengajuan Berubah",
      message: "Pengajuan DEV-20241201-0001 telah disetujui",
      request_id: 1,
      is_read: false,
      created_date: "15 Desember 2024 10:30"
    }
  ],
  unread_count: 5
}
```

### PATCH /api/development/notifications/[id]/read

**Menandai notifikasi sebagai dibaca**

## 📤 Export APIs

### GET /api/development/export/excel

**Export data ke Excel**

**Query Parameters:** (sama seperti GET /api/development)

### GET /api/development/export/pdf

**Export data ke PDF**

## 🔐 Authorization Headers

Semua API endpoints memerlukan JWT token dalam header:

```javascript
{
  "Authorization": "Bearer <jwt_token>",
  "Content-Type": "application/json"
}
```

## ⚠️ Error Responses

### Standard Error Format

```javascript
{
  status: "error",
  error: "Error message",
  code?: "ERROR_CODE",
  details?: {
    field: "validation error message"
  }
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate data)
- `422` - Unprocessable Entity (business logic error)
- `429` - Too Many Requests (rate limiting)
- `500` - Internal Server Error

## 🚀 Performance Considerations

### Caching Strategy

```javascript
// Cache configuration
const cacheConfig = {
	"/api/development/master/*": "1 hour", // Master data
	"/api/development/dashboard": "5 minutes", // Dashboard stats
	"/api/development": "30 seconds", // List data
	"/api/development/[id]": "1 minute", // Detail data
};
```

### Rate Limiting

```javascript
const rateLimits = {
	GET: "100 requests/minute",
	POST: "20 requests/minute",
	PUT: "20 requests/minute",
	DELETE: "10 requests/minute",
	upload: "5 requests/minute",
};
```

### Pagination Limits

```javascript
const paginationLimits = {
	default: 10,
	max: 100,
	export_max: 10000,
};
```
