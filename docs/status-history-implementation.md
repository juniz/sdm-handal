# Status History Tracking - Dokumentasi Implementasi

## Overview

Sistem status history tracking telah diimplementasikan untuk melacak setiap perubahan status pada ticket. Setiap kali terjadi perubahan status, sistem akan mencatat:

- Status lama dan status baru
- User yang melakukan perubahan
- Timestamp perubahan
- Ticket yang mengalami perubahan

## Database Schema

### Table: `status_history_ticket`

```sql
CREATE TABLE status_history_ticket (
    status_history_id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    old_status INT NULL,
    new_status INT NOT NULL,
    changed_by VARCHAR(20) NOT NULL,
    change_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (ticket_id) REFERENCES tickets(ticket_id),
    FOREIGN KEY (old_status) REFERENCES statuses_ticket(status_id),
    FOREIGN KEY (new_status) REFERENCES statuses_ticket(status_id),
    FOREIGN KEY (changed_by) REFERENCES pegawai(nik),

    INDEX idx_ticket_id (ticket_id),
    INDEX idx_change_date (change_date),
    INDEX idx_changed_by (changed_by)
);
```

**Keterangan Kolom:**

- `status_history_id`: Primary key auto increment
- `ticket_id`: ID ticket yang mengalami perubahan status
- `old_status`: Status sebelumnya (NULL untuk ticket baru)
- `new_status`: Status baru setelah perubahan
- `changed_by`: NIK pegawai yang melakukan perubahan
- `change_date`: Timestamp perubahan (auto update)

## Backend Implementation

### 1. Core Function: `recordStatusHistory`

**Location**: `src/app/api/ticket/route.js` dan `src/app/api/ticket-assignment/route.js`

```javascript
const recordStatusHistory = async (
	ticketId,
	oldStatusId,
	newStatusId,
	changedBy
) => {
	try {
		// Jangan record jika status sama
		if (oldStatusId === newStatusId) {
			return;
		}

		await insert({
			table: "status_history_ticket",
			data: {
				ticket_id: ticketId,
				old_status: oldStatusId,
				new_status: newStatusId,
				changed_by: changedBy,
				change_date: moment().format("YYYY-MM-DD HH:mm:ss"),
			},
		});

		console.log(
			`Status history recorded: Ticket ${ticketId}, ${oldStatusId} -> ${newStatusId} by ${changedBy}`
		);
	} catch (error) {
		console.error("Error recording status history:", error);
		// Tidak throw error karena ini bukan proses critical
	}
};
```

### 2. Integration Points

#### A. Ticket Creation (`POST /api/ticket`)

- **Trigger**: Saat ticket baru dibuat
- **Record**: `NULL` → `Open` status
- **Changed By**: User yang membuat ticket

```javascript
// Record status history untuk ticket baru (NULL -> Open)
await recordStatusHistory(
	result.insertId,
	null, // old_status null untuk ticket baru
	defaultStatus.status_id,
	user.username
);
```

#### B. Ticket Status Update (`PUT /api/ticket`)

- **Trigger**: Saat user update status ticket
- **Record**: `Old Status` → `New Status`
- **Changed By**: User yang melakukan update

```javascript
// Handle status update dengan timestamp
if (status_id) {
	const newStatusId = parseInt(status_id);
	updateData.current_status_id = newStatusId;

	// Record status history jika ada perubahan status
	if (oldStatusId !== newStatusId) {
		await recordStatusHistory(
			ticket_id,
			oldStatusId,
			newStatusId,
			user.username
		);
	}
}
```

#### C. Ticket Assignment (`POST /api/ticket-assignment`)

- **Trigger**: Saat ticket di-assign ke pegawai IT
- **Record**: `Current Status` → `Assigned`
- **Changed By**: Admin IT yang melakukan assignment

```javascript
// Record status history (old status -> Assigned)
await recordStatusHistory(
	ticket_id,
	oldStatusId,
	assignedStatus.status_id,
	user.username
);
```

#### D. Assignment Release (`PUT /api/ticket-assignment`)

- **Trigger**: Saat assignment ticket dilepas
- **Record**: `Assigned` → `Open`
- **Changed By**: Admin IT yang melepas assignment

```javascript
// Record status history (Assigned -> Open)
await recordStatusHistory(
	ticket_id,
	oldStatusId,
	openStatus.status_id,
	user.username
);
```

### 3. Status History API Endpoints

#### A. Get Ticket Status History (`GET /api/ticket/[id]/status-history`)

**Purpose**: Mengambil riwayat perubahan status untuk ticket tertentu

**Response Format**:

```json
{
	"status": "success",
	"data": {
		"ticket_info": {
			"no_ticket": "TKT-20241201-0001",
			"title": "Computer not working",
			"current_status": "Assigned"
		},
		"history": [
			{
				"status_history_id": 1,
				"ticket_id": 123,
				"old_status": null,
				"new_status": 1,
				"old_status_name": null,
				"new_status_name": "Open",
				"changed_by": "emp001",
				"changed_by_name": "John Doe",
				"changed_by_department": "Finance",
				"change_date": "01 Desember 2024 10:30:00",
				"change_date_relative": "2 hours ago",
				"old_status_display": "Ticket Baru",
				"new_status_display": "Open",
				"status_change": "Ticket Dibuat → Open"
			},
			{
				"status_history_id": 2,
				"ticket_id": 123,
				"old_status": 1,
				"new_status": 2,
				"old_status_name": "Open",
				"new_status_name": "Assigned",
				"changed_by": "admin_it",
				"changed_by_name": "Admin IT",
				"changed_by_department": "IT",
				"change_date": "01 Desember 2024 11:00:00",
				"change_date_relative": "1 hour ago",
				"old_status_display": "Open",
				"new_status_display": "Assigned",
				"status_change": "Open → Assigned"
			}
		],
		"total_changes": 2
	}
}
```

#### B. Get Status History Summary (`GET /api/ticket/status-history/summary`)

**Purpose**: Mengambil ringkasan statistik perubahan status untuk dashboard

**Query Parameters**:

- `date_from`: Filter tanggal mulai (YYYY-MM-DD)
- `date_to`: Filter tanggal akhir (YYYY-MM-DD)
- `changed_by`: Filter berdasarkan user yang melakukan perubahan

**Response Format**:

```json
{
	"status": "success",
	"data": {
		"total_stats": {
			"total_status_changes": 150,
			"total_tickets_with_changes": 75,
			"total_users_making_changes": 12,
			"first_change_date": "01 Nov 2024 08:00",
			"last_change_date": "01 Des 2024 15:30"
		},
		"daily_stats": [
			{
				"change_date": "01 Des 2024",
				"total_changes": 25,
				"unique_tickets": 15,
				"unique_users": 5
			}
		],
		"top_transitions": [
			{
				"old_status": "Open",
				"new_status": "Assigned",
				"transition_count": 45,
				"transition_label": "Open → Assigned"
			}
		],
		"top_users": [
			{
				"changed_by": "admin_it",
				"user_name": "Admin IT",
				"department_name": "IT",
				"total_changes": 35,
				"unique_tickets_changed": 20
			}
		],
		"recent_changes": [
			{
				"status_history_id": 150,
				"ticket_id": 123,
				"no_ticket": "TKT-20241201-0001",
				"title": "Computer issue",
				"old_status": "Open",
				"new_status": "Assigned",
				"changed_by": "admin_it",
				"changed_by_name": "Admin IT",
				"change_date": "01 Des 2024 15:30",
				"change_date_relative": "5 minutes ago",
				"status_change": "Open → Assigned"
			}
		]
	}
}
```

## Usage Examples

### 1. Mengambil History Ticket Tertentu

```javascript
// Frontend
const fetchTicketHistory = async (ticketId) => {
	try {
		const response = await fetch(`/api/ticket/${ticketId}/status-history`);
		const data = await response.json();

		if (data.status === "success") {
			console.log("Ticket Info:", data.data.ticket_info);
			console.log("History:", data.data.history);
		}
	} catch (error) {
		console.error("Error fetching ticket history:", error);
	}
};
```

### 2. Mengambil Summary untuk Dashboard

```javascript
// Frontend - Dashboard Statistics
const fetchStatusSummary = async (dateFrom = null, dateTo = null) => {
	try {
		const params = new URLSearchParams();
		if (dateFrom) params.append("date_from", dateFrom);
		if (dateTo) params.append("date_to", dateTo);

		const response = await fetch(
			`/api/ticket/status-history/summary?${params}`
		);
		const data = await response.json();

		if (data.status === "success") {
			// Update dashboard dengan statistik
			updateDashboardStats(data.data);
		}
	} catch (error) {
		console.error("Error fetching status summary:", error);
	}
};
```

## Data Flow

### 1. Ticket Creation Flow

```
User creates ticket
    ↓
Save to tickets table
    ↓
Record history: NULL → Open
    ↓
Status history saved
```

### 2. Status Update Flow

```
User updates ticket status
    ↓
Get current status (old_status)
    ↓
Update tickets table with new status
    ↓
Record history: old_status → new_status
    ↓
Status history saved
```

### 3. Assignment Flow

```
IT Admin assigns ticket
    ↓
Get current status (old_status)
    ↓
Update tickets table: status → Assigned
    ↓
Create assignment record
    ↓
Record history: old_status → Assigned
    ↓
Status history saved
```

## Benefits & Use Cases

### 1. **Audit Trail**

- Melacak siapa yang mengubah status dan kapan
- Accountability untuk setiap perubahan
- Compliance untuk proses IT

### 2. **Performance Analysis**

- Analisis waktu resolusi ticket
- Identifikasi bottleneck dalam workflow
- Tracking performa tim IT

### 3. **Reporting & Statistics**

- Dashboard dengan metrik status changes
- Trend analysis perubahan status
- User activity reporting

### 4. **Troubleshooting**

- Debug masalah workflow ticket
- Trace history perubahan untuk investigasi
- Monitoring automated vs manual changes

## Error Handling

### 1. **Non-Critical Errors**

- Status history recording tidak mengganggu flow utama
- Jika gagal record history, proses ticket tetap berjalan
- Error hanya di-log untuk monitoring

### 2. **Data Integrity**

- Foreign key constraints memastikan data konsisten
- Validation mencegah record status yang sama
- Null handling untuk ticket baru

### 3. **Performance Considerations**

- Index pada kolom yang sering di-query
- Async recording untuk menghindari bottleneck
- Pagination untuk data history yang banyak

## Maintenance & Monitoring

### 1. **Database Maintenance**

```sql
-- Cleanup old history (optional, jika diperlukan)
DELETE FROM status_history_ticket
WHERE change_date < DATE_SUB(NOW(), INTERVAL 2 YEAR);

-- Check data integrity
SELECT COUNT(*) FROM status_history_ticket sh
LEFT JOIN tickets t ON sh.ticket_id = t.ticket_id
WHERE t.ticket_id IS NULL;
```

### 2. **Monitoring Queries**

```sql
-- Daily status changes
SELECT DATE(change_date), COUNT(*)
FROM status_history_ticket
WHERE change_date >= CURDATE() - INTERVAL 7 DAY
GROUP BY DATE(change_date);

-- Top status transitions
SELECT
    CONCAT(COALESCE(old_st.status_name, 'New'), ' → ', new_st.status_name) as transition,
    COUNT(*) as count
FROM status_history_ticket sh
LEFT JOIN statuses_ticket old_st ON sh.old_status = old_st.status_id
LEFT JOIN statuses_ticket new_st ON sh.new_status = new_st.status_id
GROUP BY transition
ORDER BY count DESC;
```

## Future Enhancements

### 1. **Real-time Notifications**

- Notify stakeholders saat status berubah
- Email/SMS alerts untuk status critical
- Dashboard real-time updates

### 2. **Advanced Analytics**

- Machine learning untuk prediksi resolution time
- Pattern recognition untuk optimasi workflow
- Automated reporting

### 3. **Integration Points**

- Webhook untuk external systems
- API untuk third-party integrations
- Export capabilities untuk reporting tools
