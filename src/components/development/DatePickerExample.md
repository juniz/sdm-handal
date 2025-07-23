# DatePicker Component - Shadcn UI

## Overview

Komponen DatePicker yang dibuat menggunakan Shadcn UI components (Calendar, Popover, Button) dengan lokalisasi Indonesia.

## Features

- ✅ Lokalisasi Bahasa Indonesia
- ✅ Disable tanggal masa lalu
- ✅ Format tanggal yang user-friendly
- ✅ Responsive design
- ✅ Keyboard accessible

## Usage

```jsx
import { DatePicker } from "@/components/ui/date-picker";

function MyComponent() {
	const [selectedDate, setSelectedDate] = useState(null);

	return (
		<DatePicker
			value={selectedDate}
			onChange={setSelectedDate}
			placeholder="Pilih tanggal..."
			disabled={false}
			className="custom-class"
		/>
	);
}
```

## Props

| Prop          | Type                   | Default              | Description                |
| ------------- | ---------------------- | -------------------- | -------------------------- |
| `value`       | `Date \| null`         | `null`               | Selected date value        |
| `onChange`    | `(date: Date) => void` | -                    | Callback when date changes |
| `placeholder` | `string`               | `"Pilih tanggal..."` | Placeholder text           |
| `disabled`    | `boolean`              | `false`              | Disable the picker         |
| `className`   | `string`               | -                    | Additional CSS classes     |

## Example in AssignmentPanel

```jsx
<DatePicker
	value={estimatedCompletionDate}
	onChange={setEstimatedCompletionDate}
	placeholder="Pilih target tanggal selesai..."
	disabled={isSubmitting}
/>
```

## Date Format

- Display format: `dd MMMM yyyy` (contoh: 25 Januari 2024)
- Internal format: JavaScript Date object
- API format: ISO string (`YYYY-MM-DD`)

## Dependencies

- `date-fns` - Date formatting and locale
- `date-fns/locale/id` - Indonesian locale
- `lucide-react` - Icons
- `@/components/ui/button` - Button component
- `@/components/ui/calendar` - Calendar component
- `@/components/ui/popover` - Popover component
