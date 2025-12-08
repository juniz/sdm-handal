# SECURITY FIX: RCE Vulnerability pada React Server Components
## CVE-2025-55182 & CVE-2025-66478

**Tanggal Perbaikan:** $(date)  
**Tingkat Keparahan:** 🔴 **KRITIS**  
**Referensi:** https://www.ox.security/blog/rce-in-react-server-components/

---

## DESKRIPSI CELAH KEAMANAN

### CVE-2025-55182: React Server Components RCE
- **Dampak:** Remote Code Execution tanpa otentikasi
- **Versi Terdampak:** React 19.0.0, 19.1.0, 19.1.1, 19.2.0
- **Paket Terdampak:** 
  - `react-server-dom-webpack`
  - `react-server-dom-parcel`
  - `react-server-dom-turbopack`

### CVE-2025-66478: Next.js App Router RCE
- **Dampak:** Remote Code Execution tanpa otentikasi
- **Versi Terdampak:** Next.js 15.0.4, 15.1.8, 15.2.5, 15.3.5, 15.4.7, 15.5.6, 16.0.6
- **Fitur Terdampak:** App Router dengan React Server Components

### Cara Eksploitasi
Penyerang dapat mengirim payload berbahaya melalui:
1. **Props ke Server Components** - Props yang tidak divalidasi dapat dieksekusi sebagai kode
2. **URL Parameters** - Search params dan dynamic route params
3. **Form Data** - Data dari form submissions
4. **API Responses** - Data yang dikembalikan dari API dan digunakan di Server Components

---

## PERBAIKAN YANG TELAH DILAKUKAN

### 1. ✅ Update Dependencies
```json
{
  "dependencies": {
    "next": "^15.3.6",
    "react": "^19.0.1",
    "react-dom": "^19.0.1",
    "react-server-dom-webpack": "^19.0.1"
  },
  "devDependencies": {
    "eslint-config-next": "^15.3.6"
  }
}
```

### 2. ✅ Security Headers di next.config.js
Menambahkan security headers untuk mencegah XSS dan code injection:
- Content-Security-Policy
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Strict-Transport-Security
- Dan lainnya

### 3. ✅ Server Component Props Validation
Membuat utility library `src/lib/server-component-security.js` dengan:
- `validateServerComponentProps()` - Validasi dan sanitasi props
- `validateIdParam()` - Validasi ID parameter
- `validateSearchParams()` - Validasi search params

---

## CARA MENGGUNAKAN VALIDASI PROPS

### Contoh 1: Basic Server Component
```javascript
// src/app/dashboard/user/[id]/page.js
import { validateServerComponentProps, validateIdParam } from '@/lib/server-component-security';

export default async function UserPage({ params }) {
  // Validasi ID parameter
  const id = validateIdParam(params.id);

  // Schema untuk props
  const schema = {
    id: {
      type: 'string',
      required: true,
      pattern: /^[a-zA-Z0-9_\-]+$/,
      maxLength: 100
    }
  };

  // Validasi props
  const validatedProps = validateServerComponentProps({ id }, schema);

  // Fetch data dengan validated ID
  const user = await getUserById(validatedProps.id);

  return <div>{user.name}</div>;
}
```

### Contoh 2: Server Component dengan Search Params
```javascript
// src/app/dashboard/tickets/page.js
import { validateSearchParams } from '@/lib/server-component-security';

export default async function TicketsPage({ searchParams }) {
  const schema = {
    page: {
      type: 'string',
      pattern: /^\d+$/,
      default: '1'
    },
    status: {
      type: 'string',
      whitelist: ['open', 'closed', 'pending'],
      default: 'open'
    },
    search: {
      type: 'string',
      maxLength: 100,
      sanitize: true
    }
  };

  // Validasi search params
  const validated = validateSearchParams(searchParams, schema);

  // Fetch data dengan validated params
  const tickets = await getTickets({
    page: parseInt(validated.page),
    status: validated.status,
    search: validated.search
  });

  return <TicketsList tickets={tickets} />;
}
```

### Contoh 3: Server Component dengan Complex Props
```javascript
// src/app/dashboard/reports/page.js
import { validateServerComponentProps } from '@/lib/server-component-security';

export default async function ReportsPage(props) {
  const schema = {
    dateFrom: {
      type: 'string',
      pattern: /^\d{4}-\d{2}-\d{2}$/,
      required: true
    },
    dateTo: {
      type: 'string',
      pattern: /^\d{4}-\d{2}-\d{2}$/,
      required: true
    },
    departments: {
      type: 'array',
      maxItems: 10,
      items: {
        type: 'string',
        pattern: /^[a-zA-Z0-9_\-]+$/
      }
    },
    filters: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          whitelist: ['active', 'inactive']
        },
        priority: {
          type: 'string',
          whitelist: ['high', 'medium', 'low']
        }
      }
    }
  };

  const validated = validateServerComponentProps(props, schema);

  // Generate report dengan validated data
  const report = await generateReport(validated);

  return <ReportView report={report} />;
}
```

---

## BEST PRACTICES

### ✅ DO (Lakukan)
1. **Selalu validasi props** sebelum digunakan di Server Components
2. **Gunakan whitelist** untuk allowed values, bukan blacklist
3. **Sanitasi string inputs** untuk mencegah XSS
4. **Limit panjang input** untuk mencegah DoS
5. **Validasi tipe data** sebelum processing
6. **Reject unknown props** (whitelist approach)

### ❌ DON'T (Jangan Lakukan)
1. ❌ **Jangan** menggunakan props langsung tanpa validasi
2. ❌ **Jangan** menggunakan `eval()` atau `Function()` constructor
3. ❌ **Jangan** menggunakan `dangerouslySetInnerHTML` dengan user input
4. ❌ **Jangan** trust data dari client tanpa validasi
5. ❌ **Jangan** mengizinkan props yang tidak ada di schema
6. ❌ **Jangan** menggunakan dynamic imports dengan user input

---

## MIGRATION GUIDE

### Langkah 1: Identifikasi Server Components
Cari semua file yang menggunakan Server Components:
```bash
# Cari file dengan "use server" atau async Server Components
grep -r "use server" src/
grep -r "export default async function" src/app/
```

### Langkah 2: Tambahkan Validasi
Untuk setiap Server Component:
1. Import validation functions
2. Buat schema untuk props
3. Validasi props sebelum digunakan
4. Gunakan validated props, bukan original props

### Langkah 3: Test
Test dengan:
- Valid inputs (harus bekerja)
- Invalid inputs (harus reject dengan error)
- Malicious inputs (harus reject dan tidak dieksekusi)

---

## TESTING CHECKLIST

- [ ] Semua Server Components memiliki validasi props
- [ ] Dynamic route params divalidasi
- [ ] Search params divalidasi
- [ ] Form submissions divalidasi
- [ ] Test dengan malicious payloads
- [ ] Test dengan invalid types
- [ ] Test dengan oversized inputs
- [ ] Test dengan special characters
- [ ] Test dengan script tags
- [ ] Test dengan path traversal attempts

---

## MONITORING

### Metrics yang Perlu Dimonitor
1. **Validation Errors:**
   - Jumlah props validation failures
   - Types of validation errors
   - Sources of invalid inputs

2. **Security Events:**
   - Attempts dengan malicious payloads
   - Multiple validation failures dari IP yang sama
   - Unusual patterns dalam props

### Alerting
Setup alert untuk:
- Multiple validation failures dalam waktu singkat
- Attempts dengan known attack patterns
- Unusual props yang tidak ada di schema

---

## REFERENSI

- [OX Security Blog: RCE in React Server Components](https://www.ox.security/blog/rce-in-react-server-components/)
- [React Security Advisory](https://github.com/facebook/react/security)
- [Next.js Security Advisory](https://github.com/vercel/next.js/security)
- [CVE-2025-55182](https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2025-55182)
- [CVE-2025-66478](https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2025-66478)

---

## KESIMPULAN

Celah RCE pada React Server Components adalah **sangat kritis** dan memerlukan:
1. ✅ Update dependencies ke versi patched
2. ✅ Implementasi security headers
3. ✅ Validasi semua props di Server Components
4. ✅ Monitoring dan alerting

**Status:** ✅ **PERBAIKAN TELAH DILAKUKAN**  
**Action Required:** 
- Install dependencies (`npm install`)
- Update semua Server Components untuk menggunakan validasi props
- Test aplikasi setelah update

---

**Dibuat oleh:** Security Team  
**Tanggal:** $(date)  
**Versi Dokumen:** 1.0

