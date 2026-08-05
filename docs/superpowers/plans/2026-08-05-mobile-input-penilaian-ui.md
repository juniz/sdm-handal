# Mobile Input Penilaian Harian UI Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menampilkan catatan revisi supervisor di tab Laporan Kegiatan (tab depan) saat status `revisi`, serta merapikan tata letak form tambah kegiatan agar tombol "Tambah" berada di bawah textarea penjabaran pada layar mobile.

**Architecture:** Memodifikasi file `src/app/dashboard/penilaian-kinerja/input/page.js` untuk (1) merender banner catatan revisi di atas sheet kegiatan jika `harianRecord?.status === 'revisi'`, dan (2) mengubah struktur form tambah kegiatan dengan Tailwind responsive display (`hidden md:block` / flex ordering) sehingga tombol Tambah tampil di bawah textarea pada mobile, tetapi tetap 1 baris di desktop.

**Tech Stack:** Next.js 14 App Router, React, TailwindCSS, Lucide React.

## Global Constraints

- Tidak ada perubahan logika state atau API call.
- Tampilan desktop (`≥ md`) untuk form tambah kegiatan tetap mempertahankan layout 1 baris di atas textarea.
- Tampilan mobile (`< md`) menampilkan tombol Tambah full-width di bagian bawah textarea.

---

### Task 1: Update `input/page.js` (Catatan Revisi Tab Depan & Form Responsif)

**Files:**
- Modify: `src/app/dashboard/penilaian-kinerja/input/page.js`

**Interfaces:**
- Consumes: `harianRecord`, `isReadOnly`, `handleAddActivity`, `newActivityTitle`, `newActivityDesc`, `newActivityPriority`
- Produces: Updated JSX layout in `input/page.js`

- [ ] **Step 1: Update `src/app/dashboard/penilaian-kinerja/input/page.js`**

1. Tambahkan banner catatan revisi supervisor di atas `/* Activities sheet */` (sekitar baris 823):

```jsx
{/* Revision notes banner for mobile / activity tab view */}
{harianRecord?.status === "revisi" && (
  <div className="bg-red-50 border border-red-200/80 p-4 rounded-2xl space-y-2 mb-5">
    <div className="flex items-center gap-2 text-red-800 font-bold text-sm font-figtree">
      <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
      Catatan Revisi Supervisor
    </div>
    <p className="text-red-700 text-xs font-medium leading-relaxed bg-white/80 p-3 rounded-xl border border-red-100/80">
      {harianRecord.catatan_supervisor || "Harap sesuaikan kegiatan dengan jadwal yang telah disepakati."}
    </p>
  </div>
)}
```

2. Perbarui struktur `<form>` penambahan kegiatan (sekitar baris 854) menjadi layout responsif:

```jsx
{/* ── Add-activity inline form */}
{!isReadOnly && (
  <form onSubmit={handleAddActivity} className="p-4 bg-[#F8FAFC] border border-slate-200/80 rounded-xl space-y-3">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
      {/* Title input + autocomplete */}
      <div className="md:col-span-2 relative">
        <input
          type="text"
          placeholder="Nama kegiatan kerja…"
          value={newActivityTitle}
          onChange={(e) => handleActivityTitleChange(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setShowSuggestions(false)}
          maxLength={200}
          required
          className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/10 font-medium placeholder:text-slate-300 transition-all"
        />
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-56 overflow-y-auto divide-y divide-slate-100 animate-in fade-in slide-in-from-top-1 duration-150">
            {filteredSuggestions.map((sug) => (
              <button
                key={sug.id}
                type="button"
                onMouseDown={() => handleSelectSuggestion(sug)}
                className="w-full text-left px-4 py-2.5 hover:bg-primary-50 transition-colors text-xs font-semibold text-slate-700 flex flex-col gap-0.5 cursor-pointer"
              >
                <span className="text-slate-800 font-bold">{sug.nama_kegiatan}</span>
                {sug.deskripsi && <span className="text-[10px] text-slate-400 font-medium line-clamp-1">{sug.deskripsi}</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Priority select */}
      <div className="md:col-span-1">
        <select
          value={newActivityPriority}
          disabled={saving}
          onChange={(e) => setNewActivityPriority(e.target.value)}
          className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/10 font-bold text-slate-800 cursor-pointer"
        >
          <option value="tinggi">Tinggi (x{wTinggi})</option>
          <option value="sedang">Sedang (x{wSedang})</option>
          <option value="rendah">Rendah (x{wRendah})</option>
        </select>
      </div>

      {/* Desktop Submit Button (Col 4) */}
      <div className="hidden md:block md:col-span-1">
        <button
          type="submit"
          disabled={saving || !newActivityTitle.trim()}
          className="w-full py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-lg text-sm transition-all duration-200 flex items-center justify-center gap-1.5 shadow-sm hover:shadow cursor-pointer active:scale-[0.98]"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Tambah
        </button>
      </div>
    </div>

    {/* Textarea Penjabaran */}
    <textarea
      placeholder="Penjabaran singkat / catatan hasil pekerjaan (opsional)"
      value={newActivityDesc}
      onChange={(e) => setNewActivityDesc(e.target.value)}
      rows={2}
      className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/10 resize-none font-medium placeholder:text-slate-300 transition-all"
    />

    {/* Mobile Submit Button (Below Textarea) */}
    <div className="block md:hidden">
      <button
        type="submit"
        disabled={saving || !newActivityTitle.trim()}
        className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-lg text-sm transition-all duration-200 flex items-center justify-center gap-1.5 shadow-sm hover:shadow cursor-pointer active:scale-[0.98]"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        + Tambah Kegiatan
      </button>
    </div>
  </form>
)}
```

- [ ] **Step 2: Check compilation and build**

Run: `cd /Users/hardiko/Documents/Developer/NEXT/sdm && npm run build`
Expected: Next.js build succeeds with exit code 0.

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/penilaian-kinerja/input/page.js
git commit -m "feat: show revision note on activity tab and position add button below textarea on mobile"
```

---

## Verification Plan

### Automated Verification
```bash
cd /Users/hardiko/Documents/Developer/NEXT/sdm && npm run build
```
Ensure static build completes cleanly with exit code 0.

### Manual Verification
1. Open `/dashboard/penilaian-kinerja/input` with a record in `revisi` status on mobile view.
2. Confirm the red revision note banner appears at the very top of the "Laporan Kegiatan" tab.
3. Confirm on mobile resolution that the form layout shows: Title -> Priority -> Description Textarea -> "+ Tambah Kegiatan" Button at the bottom.
4. Expand screen to desktop resolution (`≥ md`) and verify the "+ Tambah" button returns to 1-line position next to Priority.
