# Ticket Assignment API Update - PATCH to PUT Method

## Overview

API endpoint `/api/ticket-assignment` telah diperbarui untuk menggunakan method PUT alih-alih PATCH karena method PATCH diblok di server production.

## Perubahan yang Dilakukan

### 1. API Endpoint Changes

#### Sebelum (PATCH Method)

```javascript
// PATCH - Update status ticket oleh pegawai IT
export async function PATCH(request) {
	// Logic untuk update status ticket
}

// PUT - Release assignment
export async function PUT(request) {
	// Logic untuk release assignment
}
```

#### Sesudah (PUT Method dengan Action Parameter)

```javascript
// PUT - Handle both release assignment and update status
export async function PUT(request) {
	const { ticket_id, status, notes, action } = body;

	if (action === "release") {
		// Logic untuk release assignment
	} else {
		// Logic untuk update status ticket
	}
}
```

### 2. Frontend Hook Changes

#### Sebelum

```javascript
// Update ticket status
const updateTicketStatus = async (ticketId, status, notes) => {
	const response = await fetch("/api/ticket-assignment", {
		method: "PATCH",
		body: JSON.stringify({
			ticket_id: ticketId,
			status: status,
			notes: notes,
		}),
	});
};

// Release assignment
const releaseAssignment = async (ticketId) => {
	const response = await fetch("/api/ticket-assignment", {
		method: "PUT",
		body: JSON.stringify({
			ticket_id: ticketId,
		}),
	});
};
```

#### Sesudah

```javascript
// Update ticket status
const updateTicketStatus = async (ticketId, status, notes) => {
	const response = await fetch("/api/ticket-assignment", {
		method: "PUT",
		body: JSON.stringify({
			ticket_id: ticketId,
			status: status,
			notes: notes,
			action: "update_status",
		}),
	});
};

// Release assignment
const releaseAssignment = async (ticketId) => {
	const response = await fetch("/api/ticket-assignment", {
		method: "PUT",
		body: JSON.stringify({
			ticket_id: ticketId,
			action: "release",
		}),
	});
};
```

## API Endpoint Specification

### PUT `/api/ticket-assignment`

#### Request Body Parameters

##### Untuk Update Status Ticket

```json
{
	"ticket_id": 123,
	"status": "Resolved",
	"notes": "Ticket telah diselesaikan",
	"action": "update_status"
}
```

##### Untuk Release Assignment

```json
{
	"ticket_id": 123,
	"action": "release"
}
```

#### Response Format

##### Success Response

```json
{
	"status": "success",
	"message": "Status ticket berhasil diubah ke Resolved"
}
```

##### Error Response

```json
{
	"status": "error",
	"error": "Ticket tidak ditemukan"
}
```

## Status yang Diizinkan untuk Update

- **In Progress** - Ticket sedang dalam proses pengerjaan
- **On Hold** - Ticket ditunda sementara
- **Resolved** - Ticket telah diselesaikan

## Validasi

### Update Status Ticket

1. User harus dari departemen IT
2. Ticket harus sudah di-assign
3. User yang update harus yang ditugaskan atau admin IT
4. Status harus valid (In Progress, On Hold, Resolved)
5. Ticket ID dan Status harus diisi

### Release Assignment

1. User harus dari departemen IT
2. Assignment aktif harus ada
3. User yang release harus yang ditugaskan atau admin IT
4. Ticket ID harus diisi

## Error Handling

### Common Error Messages

- `"Unauthorized - Token tidak valid"` - Token JWT tidak valid
- `"Akses ditolak - Hanya untuk departemen IT"` - User bukan dari departemen IT
- `"Ticket tidak ditemukan"` - Ticket ID tidak valid
- `"Ticket belum ditugaskan atau assignment sudah dilepas"` - Ticket belum di-assign
- `"Status tidak valid"` - Status tidak diizinkan
- `"Anda hanya bisa mengupdate ticket yang ditugaskan kepada Anda"` - User tidak memiliki izin

## Testing

### Test Cases

#### 1. Update Status to Resolved

```bash
curl -X PUT /api/ticket-assignment \
  -H "Content-Type: application/json" \
  -d '{
    "ticket_id": 123,
    "status": "Resolved",
    "notes": "Ticket telah diselesaikan",
    "action": "update_status"
  }'
```

#### 2. Release Assignment

```bash
curl -X PUT /api/ticket-assignment \
  -H "Content-Type: application/json" \
  -d '{
    "ticket_id": 123,
    "action": "release"
  }'
```

#### 3. Invalid Action

```bash
curl -X PUT /api/ticket-assignment \
  -H "Content-Type: application/json" \
  -d '{
    "ticket_id": 123,
    "status": "Resolved"
  }'
```

## Migration Notes

### Backward Compatibility

- Method PATCH tidak lagi tersedia
- Semua request harus menggunakan method PUT dengan parameter `action`
- Frontend sudah diperbarui untuk menggunakan method PUT

### Production Deployment

- Pastikan server production mengizinkan method PUT
- Test semua fungsi ticket assignment setelah deployment
- Monitor error logs untuk memastikan tidak ada masalah

## Benefits

1. **Production Compatibility** - Method PUT diizinkan di server production
2. **Unified Endpoint** - Satu endpoint untuk dua operasi terkait
3. **Better Error Handling** - Error handling yang lebih robust
4. **Consistent API Design** - Menggunakan action parameter untuk membedakan operasi

## Troubleshooting

### Common Issues

#### 1. "Method Not Allowed" Error

- Pastikan menggunakan method PUT, bukan PATCH
- Pastikan parameter `action` diisi dengan benar

#### 2. "Action Required" Error

- Pastikan parameter `action` diisi: `"update_status"` atau `"release"`

#### 3. "Status Not Valid" Error

- Pastikan status yang diinput valid: "In Progress", "On Hold", "Resolved"

#### 4. "Unauthorized" Error

- Pastikan user login dan token valid
- Pastikan user dari departemen IT

### Debug Steps

1. Cek browser console untuk error details
2. Cek server logs untuk error backend
3. Validasi request body format
4. Test dengan Postman atau curl untuk isolasi masalah
