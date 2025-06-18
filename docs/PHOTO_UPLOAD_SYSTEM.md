# Sistem Upload Foto Presensi

## Overview

Sistem upload foto presensi telah diubah dari menggunakan folder `public/photos` ke folder `uploads/attendance` di root project untuk kompatibilitas yang lebih baik dengan production environment.

## Perubahan Utama

### Sebelum (Old System)

- Foto disimpan di: `public/photos/`
- URL akses: `https://domain.com/photos/filename.jpg`
- Masalah: Folder public hanya untuk file statis, tidak cocok untuk production

### Sesudah (New System)

- Foto disimpan di: `uploads/attendance/`
- URL akses: `https://domain.com/api/uploads/attendance/filename.jpg` (full URL)
- Keuntungan:
  - URL lengkap dengan domain dari NEXT_PUBLIC_URL
  - Tidak memerlukan authentication (public access)
  - Tidak ter-commit ke repository
  - Lebih mudah untuk CDN dan sharing

## Struktur Folder

```
project-root/
├── uploads/
│   ├── attendance/          # Foto-foto presensi
│   │   ├── attendance_123_1734567890.jpg
│   │   └── attendance_456_1734567891.jpg
│   └── README.md
├── src/
│   └── app/
│       └── api/
│           └── uploads/
│               └── attendance/
│                   └── [filename]/
│                       └── route.js    # API endpoint untuk serve foto
└── scripts/
    └── migrate-photos.js               # Script migrasi foto lama
```

## API Endpoint

### GET /api/uploads/attendance/[filename]

Endpoint untuk mengakses foto presensi tanpa authentication.

**Headers Required:**

- Tidak ada (public access)

**Response:**

- Success: File foto dengan headers caching
- Error 400: Invalid filename
- Error 404: File tidak ditemukan

**Security Features:**

- Path traversal protection
- Filename validation
- Long-term caching headers
- Public access untuk kemudahan integrasi

## Migration

### Automatic Migration

Jalankan script migration untuk memindahkan foto lama:

```bash
npm run migrate-photos
```

Script ini akan:

1. Copy semua foto dari `public/photos/` ke `uploads/attendance/`
2. Update URL di database dari old format ke new format
3. Memberikan laporan hasil migration

### Manual Migration

Jika perlu migration manual:

```bash
# 1. Buat folder uploads
mkdir -p uploads/attendance

# 2. Copy foto-foto lama
cp -r public/photos/* uploads/attendance/

# 3. Update database (manual SQL)
UPDATE temporary_presensi
SET photo = REPLACE(photo, '/photos/', '/api/uploads/attendance/')
WHERE photo LIKE '%/photos/%';

UPDATE rekap_presensi
SET photo = REPLACE(photo, '/photos/', '/api/uploads/attendance/')
WHERE photo LIKE '%/photos/%';
```

## Development Setup

### Local Development

1. Folder `uploads/` akan dibuat otomatis saat first upload
2. File-file tidak di-commit (ada di .gitignore)
3. Untuk testing, bisa manual create folder:

```bash
mkdir -p uploads/attendance
```

### Production Setup

1. **Folder Permissions:**

   ```bash
   chmod 755 uploads/
   chmod 755 uploads/attendance/
   ```

2. **Web Server Configuration:**

   **Nginx:**

   ```nginx
   # Block direct access to uploads folder
   location /uploads {
       deny all;
       return 404;
   }
   ```

   **Apache:**

   ```apache
   <Directory "/path/to/project/uploads">
       Require all denied
   </Directory>
   ```

3. **Environment Variables:**
   ```env
   # Optional: Set custom upload path
   UPLOAD_PATH=/custom/path/uploads
   ```

## Security Considerations

### Public Access

- Foto presensi dapat diakses tanpa authentication
- URL menggunakan filename yang unik dengan timestamp
- Tidak ada informasi sensitif dalam URL

### File Validation

- Filename validation untuk prevent path traversal
- Content-Type detection
- File size limits (handled by upload process)

### Access Control

- Public access untuk kemudahan sharing dan integrasi
- Future: Optional authentication layer jika diperlukan

## Performance Optimization

### Caching

- Long-term browser caching (1 year)
- Immutable cache headers
- CDN-friendly headers

### File Serving

- Efficient file streaming
- Proper Content-Length headers
- Content-Type detection

## Backup Strategy

### Production Backup

```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d)
tar -czf "backup_photos_$DATE.tar.gz" uploads/attendance/
```

### Database Backup

```sql
-- Backup photo URLs
SELECT id, jam_datang, photo
FROM temporary_presensi
WHERE photo IS NOT NULL;

SELECT id, jam_datang, photo
FROM rekap_presensi
WHERE photo IS NOT NULL;
```

## Troubleshooting

### Common Issues

1. **403 Forbidden Error**

   - Check authentication token
   - Verify JWT_SECRET environment variable

2. **404 File Not Found**

   - Check if file exists in uploads/attendance/
   - Verify filename in database matches actual file

3. **Migration Issues**
   - Check database connection in migrate script
   - Verify old files exist in public/photos/
   - Check file permissions

### Debug Commands

```bash
# Check uploads folder
ls -la uploads/attendance/

# Check database URLs
mysql -e "SELECT photo FROM temporary_presensi WHERE photo LIKE '%/api/uploads/%' LIMIT 5;"

# Test API endpoint
curl -H "Cookie: auth_token=YOUR_TOKEN" http://localhost:3000/api/uploads/attendance/filename.jpg
```

## Future Enhancements

### Planned Features

- [ ] Image compression on upload
- [ ] Multiple image formats support
- [ ] Thumbnail generation
- [ ] CDN integration
- [ ] S3/Cloud storage support
- [ ] Image optimization pipeline

### Configuration Options

- [ ] Custom upload paths
- [ ] File size limits
- [ ] Allowed file types
- [ ] Compression settings

## Monitoring

### File System Monitoring

```bash
# Check disk usage
du -sh uploads/

# Monitor file count
find uploads/attendance -name "*.jpg" | wc -l
```

### API Monitoring

- Monitor `/api/uploads/attendance/*` endpoint performance
- Track authentication failures
- Monitor file access patterns
