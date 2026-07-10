# Ticket Assignment Tabs Feature

## Overview

Fitur tab untuk memisahkan ticket yang masih berjalan (active) dengan ticket yang sudah selesai (completed) pada halaman Ticket Assignment.

## Fitur

### 1. **Tab "Ticket Berjalan"**

- Menampilkan ticket dengan status: Open, In Progress, On Hold
- Menampilkan counter jumlah ticket yang sedang berjalan
- Action buttons tersedia: Assign, Update Status, Release
- Icon: Clock

### 2. **Tab "Ticket Selesai"**

- Menampilkan ticket dengan status: Closed, Resolved
- Menampilkan counter jumlah ticket yang sudah selesai
- Hanya menampilkan button Detail (read-only)
- Menampilkan tanggal resolved dan closed
- Icon: CheckCircle

## Implementasi

### Frontend Changes

#### 1. **Page Component** (`src/app/dashboard/ticket-assignment/page.js`)

```javascript
// State untuk tab aktif
const [activeTab, setActiveTab] = useState("active");

// Filter tickets berdasarkan tab
const filteredTickets = tickets.filter((ticket) => {
	if (activeTab === "active") {
		return !["Closed", "Resolved"].includes(ticket.current_status);
	} else {
		return ["Closed", "Resolved"].includes(ticket.current_status);
	}
});
```

#### 2. **Tab Navigation**

```jsx
<div className="border-b border-gray-200">
	<nav className="-mb-px flex space-x-8">
		<button onClick={() => setActiveTab("active")}>
			<Clock className="w-4 h-4" />
			Ticket Berjalan
			<span className="counter">{activeCount}</span>
		</button>
		<button onClick={() => setActiveTab("completed")}>
			<CheckCircle className="w-4 h-4" />
			Ticket Selesai
			<span className="counter">{completedCount}</span>
		</button>
	</nav>
</div>
```

#### 3. **AssignmentCard Component** (`src/components/ticket-assignment/AssignmentCard.js`)

```javascript
// Prop untuk menentukan apakah ticket sudah selesai
const AssignmentCard = ({ ticket, isCompleted = false, ...props }) => {
    // Conditional rendering untuk action buttons
    {!isCompleted && (
        // Action buttons hanya untuk ticket aktif
    )}

    // Additional info untuk ticket selesai
    {isCompleted && ticket.resolved_date && (
        <div>Resolved: {ticket.resolved_date}</div>
    )}
    {isCompleted && ticket.closed_date && (
        <div>Closed: {ticket.closed_date}</div>
    )}
};
```

#### 4. **EmptyState Component** (`src/components/ticket/EmptyState.js`)

```javascript
const EmptyState = ({ message = "Tidak ada pelaporan ditemukan" }) => {
	// Dynamic message berdasarkan tab
	const description = message.includes("berjalan")
		? "Semua ticket sedang dalam proses penanganan"
		: message.includes("selesai")
		? "Belum ada ticket yang telah diselesaikan"
		: "Buat pelaporan baru untuk melaporkan masalah IT";
};
```

### Backend Changes

#### 1. **API Query Modification** (`src/app/api/ticket-assignment/route.js`)

```sql
-- Query untuk mengambil semua ticket (aktif dan selesai)
SELECT
    t.ticket_id,
    t.no_ticket,
    -- ... other fields
    t.resolved_date,
    t.closed_date,
    s.status_name as current_status,
    at.assigned_to,
    at.assigned_date,
    at.released_date
FROM tickets t
LEFT JOIN assignments_ticket at ON t.ticket_id = at.ticket_id
WHERE (at.released_date IS NULL OR s.status_name IN ('Closed', 'Resolved'))
```

## UI/UX Features

### 1. **Visual Indicators**

- **Active Tab**: Blue color scheme
- **Completed Tab**: Green color scheme
- **Completed Tickets**: Reduced opacity (75%)
- **Counters**: Badge dengan jumlah ticket per tab

### 2. **Responsive Design**

- Tab navigation responsive untuk mobile
- Counter badges compact di mobile
- Action buttons hidden untuk completed tickets

### 3. **State Management**

- Tab state preserved saat refresh
- Filter state independent dari tab state
- Pagination works per tab

## Data Flow

### 1. **Initial Load**

```
Page Load → Fetch All Tickets → Filter by Tab → Display
```

### 2. **Tab Switch**

```
Tab Click → Update activeTab → Re-filter tickets → Re-render
```

### 3. **Status Update**

```
Status Update → Refresh tickets → Re-filter → Update counters
```

## Benefits

### 1. **Better Organization**

- Clear separation antara active dan completed tickets
- Reduced cognitive load untuk user
- Focus pada ticket yang perlu action

### 2. **Improved Performance**

- Filtering di frontend (client-side)
- No additional API calls saat switch tab
- Efficient rendering dengan conditional components

### 3. **Enhanced UX**

- Visual feedback dengan counters
- Clear action availability
- Historical view untuk completed tickets

## Testing

### 1. **Tab Functionality**

```javascript
// Test tab switching
expect(filteredTickets).toHaveLength(activeCount);
setActiveTab("completed");
expect(filteredTickets).toHaveLength(completedCount);
```

### 2. **Action Buttons**

```javascript
// Test action button visibility
expect(screen.queryByText("Assign")).toBeInTheDocument(); // Active tab
setActiveTab("completed");
expect(screen.queryByText("Assign")).not.toBeInTheDocument(); // Completed tab
```

### 3. **Counter Accuracy**

```javascript
// Test counter accuracy
expect(screen.getByText(activeCount)).toBeInTheDocument();
expect(screen.getByText(completedCount)).toBeInTheDocument();
```

## Future Enhancements

### 1. **Additional Tabs**

- Tab untuk "My Assignments"
- Tab untuk "High Priority"
- Tab untuk "Overdue"

### 2. **Advanced Filtering**

- Date range filter
- Status-specific filters
- Search within tab

### 3. **Export Features**

- Export completed tickets
- Generate reports per tab
- Bulk actions per tab

## Configuration

### Environment Variables

```env
# No additional environment variables required
# Feature uses existing ticket data structure
```

### Database Requirements

```sql
-- Existing tables required:
-- - tickets (resolved_date, closed_date)
-- - assignments_ticket (released_date)
-- - statuses_ticket (status_name)
```

## Troubleshooting

### Common Issues

#### 1. **Tab Not Switching**

- Check `activeTab` state
- Verify filter logic
- Check console for errors

#### 2. **Counter Not Updating**

- Verify ticket status values
- Check filter conditions
- Ensure data refresh after status update

#### 3. **Action Buttons Still Visible**

- Check `isCompleted` prop
- Verify conditional rendering
- Check component re-render

### Debug Commands

```javascript
// Check tab state
console.log("Active Tab:", activeTab);

// Check filtered tickets
console.log("Filtered Tickets:", filteredTickets);

// Check ticket statuses
console.log(
	"Ticket Statuses:",
	tickets.map((t) => t.current_status)
);
```
