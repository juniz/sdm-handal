# Print Gaji Berdasarkan Tahun Kontrak 2018 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membagi hasil cetak rekap gaji pada menu `/penggajian/data-gaji` ke dalam kelompok tahun kontrak `< 2018`, `>= 2018`, dan tanpa kontrak dalam satu dokumen PDF berurutan dengan nomor urut, total, dan tanda tangan tersendiri.

**Architecture:** Mengubah pengelompokan data pada `src/components/penggajian/PrintGajiReport.js` ketika flag `groupByContract` bernilai `true` agar mempartisi pegawai berdasarkan tahun `mulai_kontrak`. Memperbarui label tombol cetak di `src/app/dashboard/penggajian/data-gaji/page.js`.

**Tech Stack:** Next.js (React), jsPDF, jspdf-autotable.

## Global Constraints
- Target workspace: `/Users/hardiko/Documents/Developer/NEXT/sdm`.
- Pembagian kelompok:
  1. `< 2018` -> Label: `"DI BAWAH TAHUN 2018"`
  2. `>= 2018` -> Label: `"TAHUN 2018 KE ATAS"`
  3. Kosong/invalid -> Label: `"BELUM ADA TMT KONTRAK"`
- Tiap kelompok yang memiliki data dicetak pada halaman baru, dengan nomor urut dimulai dari 1, subtotal mandiri, dan lembar tanda tangan.

---

### Task 1: Update Grouping Logic in `PrintGajiReport.js`

**Files:**
- Modify: `src/components/penggajian/PrintGajiReport.js:239-264`

**Interfaces:**
- Consumes: `result.data` array containing `{ mulai_kontrak, gaji, ... }`
- Produces: `groupsToRender` array containing ordered groups (`BELOW_2018`, `2018_AND_ABOVE`, `NO_CONTRACT`)

- [ ] **Step 1: Write helper function for classifying contract year**

Add helper in `src/components/penggajian/PrintGajiReport.js`:
```javascript
const classifyContractGroup = (dateStr) => {
    if (!dateStr || dateStr === "0000-00-00") {
        return { key: "NO_CONTRACT", label: "BELUM ADA TMT KONTRAK", order: 3 };
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
        return { key: "NO_CONTRACT", label: "BELUM ADA TMT KONTRAK", order: 3 };
    }
    const year = d.getFullYear();
    if (year < 2018) {
        return { key: "BELOW_2018", label: "DI BAWAH TAHUN 2018", order: 1 };
    } else {
        return { key: "2018_AND_ABOVE", label: "TAHUN 2018 KE ATAS", order: 2 };
    }
};
```

- [ ] **Step 2: Update `groupsToRender` partition logic**

Replace the existing Month-Year `groupsMap` logic with:
```javascript
        let groupsToRender = [];
        if (groupByContract) {
            const groupsDef = {
                BELOW_2018: { key: "BELOW_2018", label: "DI BAWAH TAHUN 2018", items: [] },
                "2018_AND_ABOVE": { key: "2018_AND_ABOVE", label: "TAHUN 2018 KE ATAS", items: [] },
                NO_CONTRACT: { key: "NO_CONTRACT", label: "BELUM ADA TMT KONTRAK", items: [] }
            };

            result.data.forEach(item => {
                const groupInfo = classifyContractGroup(item.mulai_kontrak);
                groupsDef[groupInfo.key].items.push(item);
            });

            groupsToRender = [
                groupsDef.BELOW_2018,
                groupsDef["2018_AND_ABOVE"],
                groupsDef.NO_CONTRACT
            ].filter(g => g.items.length > 0);
        } else {
            groupsToRender = [{ key: "ALL", label: null, items: result.data }];
        }
```

- [ ] **Step 3: Verify syntax in `PrintGajiReport.js`**

Run build/lint check on `PrintGajiReport.js`.

- [ ] **Step 4: Commit changes**

```bash
git add src/components/penggajian/PrintGajiReport.js
git commit -m "feat(penggajian): group print gaji by contract year 2018 cutoff"
```

---

### Task 2: Update Print Button Label in `page.js`

**Files:**
- Modify: `src/app/dashboard/penggajian/data-gaji/page.js:251-264`

- [ ] **Step 1: Update button label for clarity**

Update button text from "Print per Kelompok Kontrak" to "Print Kelompok Kontrak (< 2018 / >= 2018)":
```jsx
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePrint(true)}
                        disabled={printing || loading}
                        className="gap-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                    >
                        {printing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Printer className="h-4 w-4 text-indigo-500" />
                        )}
                        Print Kelompok Kontrak (&lt; 2018 / &ge; 2018)
                    </Button>
```

- [ ] **Step 2: Commit changes**

```bash
git add src/app/dashboard/penggajian/data-gaji/page.js
git commit -m "feat(penggajian): update print button label to indicate 2018 contract grouping"
```

---

### Task 3: End-to-End Verification

- [ ] **Step 1: Run linter and check for syntax errors**

Run: `npm run lint` or Next.js build check on `sdm`.

- [ ] **Step 2: Verify grouping behavior logic with test script**

Create test script in scratch directory to verify partitioning of edge cases (pre-2018, 2018, post-2018, null dates).
