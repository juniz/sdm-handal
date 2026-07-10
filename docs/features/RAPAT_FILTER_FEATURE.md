# Fitur Filter Nama Rapat - Dokumentasi

## 🎯 **Overview**

Fitur filter nama rapat telah ditambahkan ke halaman daftar rapat untuk memudahkan pencarian rapat berdasarkan nama. Fitur ini memungkinkan pengguna untuk mencari rapat dengan cepat tanpa harus melihat semua data.

## ✨ **Fitur yang Ditambahkan**

### 1. **Filter Input Field**

- Input text untuk pencarian nama rapat
- Placeholder: "Cari nama rapat..."
- Icon search dan clear button
- Loading indicator saat pencarian

### 2. **Real-time Search**

- Pencarian otomatis saat mengetik
- Debouncing 500ms untuk mengurangi API calls
- Highlight hasil pencarian dengan background kuning

### 3. **Search Results Indicator**

- Badge hijau menunjukkan jumlah hasil
- Text helper: "Mencari: 'keyword' • X hasil ditemukan"
- Empty state yang informatif

### 4. **Enhanced UI/UX**

- Reset filter button untuk kembali ke hari ini
- Improved card layout dengan highlighting
- Better loading states

## 🔧 **Implementasi Teknis**

### **Backend Changes**

#### **API Route (`/api/rapat`)**

```javascript
// Tambahan parameter query
const namaRapat = searchParams.get("nama_rapat") || "";

// Filter dengan LIKE operator
if (namaRapat.trim()) {
	query.where.rapat = {
		operator: "LIKE",
		value: `%${namaRapat.trim()}%`,
	};
}
```

### **Frontend Changes**

#### **useRapat Hook**

```javascript
// State untuk filter
const [filterNamaRapat, setFilterNamaRapat] = useState("");
const [debouncedNamaRapat, setDebouncedNamaRapat] = useState("");

// Debouncing effect
useEffect(() => {
	const timer = setTimeout(() => {
		setDebouncedNamaRapat(filterNamaRapat);
	}, 500);
	return () => clearTimeout(timer);
}, [filterNamaRapat]);
```

#### **FilterAccordion Component**

```javascript
// Input field dengan icons
<input
	type="text"
	placeholder="Cari nama rapat..."
	value={filterNamaRapat}
	onChange={(e) => setFilterNamaRapat(e.target.value)}
/>;

// Loading indicator
{
	loading && filterNamaRapat && <Loader2 className="animate-spin" />;
}
```

#### **RapatCard Component**

```javascript
// Highlight search term
const highlightText = (text, searchTerm) => {
	if (!searchTerm || !text) return text;

	const regex = new RegExp(`(${searchTerm})`, "gi");
	const parts = text.split(regex);

	return parts.map((part, index) =>
		regex.test(part) ? (
			<span key={index} className="bg-yellow-200 font-semibold">
				{part}
			</span>
		) : (
			part
		)
	);
};
```

## 📱 **User Interface**

### **Filter Section**

```
┌─────────────────────────────────────┐
│ 🔍 Filter & Aksi [Hari Ini] [3 hasil] │
├─────────────────────────────────────┤
│ Tanggal: [2025-01-15]              │
│                                     │
│ Nama Rapat: [🔍 Cari nama rapat...] │
│ Mencari: "meeting" • 3 hasil ditemukan │
│                                     │
│ [➕ Tambah Rapat]                   │
│ [📥 Export PDF]                     │
│ [📅 Reset Filter]                   │
└─────────────────────────────────────┘
```

### **Search Results**

```
┌─────────────────────────────────────┐
│ 📋 Meeting Harian                   │
│ 📅 15 Januari 2025                  │
│                                     │
│ 👤 Peserta: John Doe               │
│ 🏢 Instansi: IT Department         │
│ ✓ Tanda Tangan: Tersedia           │
│                                     │
│ [✏️] [🗑️]                         │
└─────────────────────────────────────┘
```

## 🚀 **Cara Penggunaan**

### **1. Pencarian Dasar**

1. Buka halaman Daftar Rapat
2. Klik "Filter & Aksi" untuk membuka panel filter
3. Masukkan nama rapat di field "Nama Rapat"
4. Hasil akan muncul otomatis setelah 500ms

### **2. Pencarian Lanjutan**

- Gunakan partial match: "meet" akan menemukan "Meeting", "Team Meeting", dll
- Case insensitive: "MEETING" sama dengan "meeting"
- Clear search dengan tombol X atau Reset Filter

### **3. Kombinasi Filter**

- Filter tanggal + nama rapat: Cari rapat tertentu pada tanggal tertentu
- Reset filter: Kembali ke tampilan hari ini tanpa filter

## ⚡ **Performance Optimizations**

### **Debouncing**

- Delay 500ms sebelum API call
- Mencegah terlalu banyak request saat user mengetik cepat
- Menghemat bandwidth dan server resources

### **Efficient Queries**

- LIKE operator dengan wildcard `%keyword%`
- Case insensitive search
- Minimal database load

### **UI Responsiveness**

- Loading states yang jelas
- Smooth animations
- Non-blocking search

## 🐛 **Troubleshooting**

### **Common Issues**

#### **1. Search Tidak Berfungsi**

```bash
# Check browser console untuk errors
# Verify API endpoint berfungsi
curl "http://localhost:3000/api/rapat?tanggal=2025-01-15&nama_rapat=test"
```

#### **2. Loading Indicator Tidak Muncul**

- Pastikan state `loading` ter-update dengan benar
- Check debouncing logic berfungsi

#### **3. Highlight Tidak Muncul**

- Verify `searchTerm` prop ter-pass ke RapatCard
- Check regex pattern untuk special characters

### **Debug Commands**

```javascript
// Check filter state
console.log("Filter:", { filterDate, filterNamaRapat, debouncedNamaRapat });

// Check API response
console.log("API Response:", data);
```

## 📊 **Testing**

### **Manual Testing**

```bash
# Test basic search
1. Masukkan "meeting" di search field
2. Verify hasil muncul dengan highlight
3. Clear search dan verify semua data muncul

# Test debouncing
1. Ketik cepat "meeting" (5 karakter)
2. Verify hanya 1 API call yang terjadi
3. Check loading indicator muncul

# Test empty results
1. Masukkan keyword yang tidak ada
2. Verify empty state message muncul
3. Verify "0 hasil" badge muncul
```

### **API Testing**

```bash
# Test dengan curl
curl "http://localhost:3000/api/rapat?tanggal=2025-01-15&nama_rapat=meeting"

# Expected response
{
  "status": "success",
  "data": [...],
  "metadata": {
    "filter": {
      "tanggal": "2025-01-15",
      "nama_rapat": "meeting",
      "isToday": true
    }
  }
}
```

## 🔮 **Future Enhancements**

### **Planned Features**

- [ ] Advanced search dengan multiple criteria
- [ ] Search history/suggestions
- [ ] Export filtered results
- [ ] Search dalam nama peserta dan instansi
- [ ] Fuzzy search untuk typo tolerance

### **Performance Improvements**

- [ ] Caching search results
- [ ] Pagination untuk large datasets
- [ ] Virtual scrolling untuk performance
- [ ] Search index optimization

## 📝 **Changelog**

### **v1.0.0** (Current)

- ✅ Added nama rapat filter input
- ✅ Implemented debounced search
- ✅ Added search result highlighting
- ✅ Enhanced UI with loading states
- ✅ Added search results counter
- ✅ Improved empty state messages

---

**Status**: ✅ **COMPLETED** - Fitur filter nama rapat telah berhasil diimplementasikan dan siap digunakan!
