# Komponen Rapat - Struktur Modular

Dokumentasi ini menjelaskan struktur komponen yang telah direfactor untuk halaman Daftar Rapat agar lebih mudah dimaintenance dan dibaca.

## Struktur Folder

```
src/app/dashboard/rapat/
├── components/
│   ├── hooks/
│   │   └── useRapat.js          # Custom hook untuk logika rapat
│   ├── utils/
│   │   └── pdfGenerator.js      # Utility untuk export PDF
│   ├── FilterAccordion.js       # Komponen filter dan aksi
│   ├── LoadingSkeleton.js       # Komponen loading skeleton
│   ├── RapatCard.js            # Komponen kartu rapat
│   ├── RapatModal.js           # Komponen modal form
│   ├── SignatureImage.js       # Komponen display tanda tangan
│   ├── Toast.js                # Komponen notifikasi
│   └── README.md               # Dokumentasi ini
├── page.js                     # Halaman utama (refactored)
└── error.js                    # Error boundary
```

## Deskripsi Komponen

### 1. **useRapat.js** (Custom Hook)

**Lokasi:** `components/hooks/useRapat.js`

Custom hook yang mengelola semua logika bisnis untuk rapat:

- State management (rapatList, loading, filterDate, etc.)
- API calls (fetchRapat, submitRapat, deleteRapat)
- Form validation
- Data fetching dengan useEffect

**Export:**

```javascript
{
	rapatList,
		loading,
		filterDate,
		setFilterDate,
		isToday,
		errors,
		setErrors,
		fetchRapat,
		validateForm,
		submitRapat,
		deleteRapat;
}
```

### 2. **pdfGenerator.js** (Utility)

**Lokasi:** `components/utils/pdfGenerator.js`

Utility functions untuk export PDF:

- `generatePrintHTML()` - Generate HTML untuk print
- `generateDaftarHadirHTML()` - Generate HTML untuk PDF
- `exportToPDF()` - Export ke PDF dengan html2canvas
- `openPrintWindow()` - Fallback print window

### 3. **Toast.js**

**Lokasi:** `components/Toast.js`

Komponen notifikasi dengan animasi:

- Support success/error type
- Auto-close dengan timer
- Animasi masuk/keluar dengan Framer Motion

**Props:**

```javascript
{
  message: string,
  type: 'success' | 'error',
  onClose: function
}
```

### 4. **LoadingSkeleton.js**

**Lokasi:** `components/LoadingSkeleton.js`

Komponen loading state dengan skeleton UI:

- Grid layout yang responsive
- Animasi pulse
- Placeholder untuk 6 cards

### 5. **SignatureImage.js**

**Lokasi:** `components/SignatureImage.js`

Komponen untuk menampilkan tanda tangan:

- Validasi base64 format
- Error handling untuk gambar rusak
- Hover effect untuk zoom
- Normalisasi format data URL

**Props:**

```javascript
{
	base64Data: string;
}
```

### 6. **RapatCard.js**

**Lokasi:** `components/RapatCard.js`

Komponen kartu untuk menampilkan data rapat:

- Responsive design
- Action buttons (edit/delete)
- Integration dengan SignatureImage
- Animasi dengan Framer Motion

**Props:**

```javascript
{
  rapat: object,
  onEdit: function,
  onDelete: function
}
```

### 7. **FilterAccordion.js**

**Lokasi:** `components/FilterAccordion.js`

Komponen filter dan aksi:

- Collapsible accordion
- Date filter
- Add button
- Export PDF button
- Today indicator

**Props:**

```javascript
{
	filterDate,
		setFilterDate,
		isOpen,
		setIsOpen,
		onAddClick,
		loading,
		isToday,
		rapatList;
}
```

### 8. **RapatModal.js**

**Lokasi:** `components/RapatModal.js`

Komponen modal untuk form tambah/edit:

- Form validation
- Signature pad integration
- Loading state
- Mode-aware (add/edit)

**Props:**

```javascript
{
	showModal,
		setShowModal,
		modalMode,
		formData,
		setFormData,
		errors,
		onSubmit,
		onReset;
}
```

## Keuntungan Refactoring

### 1. **Separation of Concerns**

- Logika bisnis terpisah di custom hook
- UI components fokus pada rendering
- Utility functions terpisah

### 2. **Reusability**

- Komponen dapat digunakan di halaman lain
- Custom hook dapat digunakan untuk fitur serupa
- Utility functions dapat digunakan di modul lain

### 3. **Maintainability**

- Kode lebih mudah dibaca dan dipahami
- Bug fixing lebih mudah karena scope terbatas
- Testing lebih mudah karena komponen terisolasi

### 4. **Performance**

- Komponen kecil lebih optimal untuk re-rendering
- Lazy loading bisa diterapkan per komponen
- Bundle splitting lebih efektif

### 5. **Developer Experience**

- Auto-completion lebih baik di IDE
- Debugging lebih mudah
- Code review lebih fokus

## Cara Penggunaan

### Import di halaman utama:

```javascript
import Toast from "./components/Toast";
import LoadingSkeleton from "./components/LoadingSkeleton";
import FilterAccordion from "./components/FilterAccordion";
import RapatCard from "./components/RapatCard";
import RapatModal from "./components/RapatModal";
import { useRapat } from "./components/hooks/useRapat";
```

### Penggunaan custom hook:

```javascript
const {
	rapatList,
	loading,
	filterDate,
	setFilterDate,
	isToday,
	errors,
	validateForm,
	submitRapat,
	deleteRapat,
} = useRapat();
```

## Best Practices

1. **Props Drilling**: Gunakan custom hook untuk menghindari props drilling
2. **Error Boundaries**: Setiap komponen harus handle error dengan graceful
3. **Loading States**: Setiap komponen async harus memiliki loading state
4. **Accessibility**: Gunakan semantic HTML dan ARIA labels
5. **Performance**: Gunakan React.memo untuk komponen yang sering re-render

## Future Improvements

1. **TypeScript**: Tambahkan type definitions
2. **Testing**: Unit tests untuk setiap komponen
3. **Storybook**: Component documentation dan testing
4. **Performance**: Implementasi React.memo dan useMemo
5. **Accessibility**: Audit dan improve a11y compliance
