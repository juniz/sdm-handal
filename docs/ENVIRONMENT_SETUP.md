# Environment Setup Guide

## Required Environment Variables

Untuk sistem upload foto presensi bekerja dengan baik, pastikan environment variables berikut sudah diset:

### 1. NEXT_PUBLIC_URL (Required)

Variable ini digunakan untuk membuat full URL foto presensi.

**Development:**

```bash
NEXT_PUBLIC_URL=http://localhost:3000
```

**Production:**

```bash
NEXT_PUBLIC_URL=https://yourdomain.com
```

### 2. Database Configuration

```bash
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=your_database_name
DB_PORT=3306
```

### 3. JWT Configuration

```bash
JWT_SECRET=your-super-secret-jwt-key
```

### 4. Optional Configuration

```bash
# Location Validation (default: true)
ENABLE_LOCATION_VALIDATION=true

# Custom Upload Path (optional)
UPLOAD_PATH=/custom/path/uploads
```

## Setup Instructions

### 1. Create .env.local file

```bash
# Copy dari template
cp .env.example .env.local

# Edit sesuai kebutuhan
nano .env.local
```

### 2. Minimum Configuration

File `.env.local` minimal harus berisi:

```env
NEXT_PUBLIC_URL=http://localhost:3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=your_database
JWT_SECRET=your-secret-key
```

### 3. Production Setup

Untuk production, pastikan:

1. **NEXT_PUBLIC_URL** menggunakan domain production
2. **JWT_SECRET** menggunakan key yang aman dan unik
3. **Database credentials** sesuai dengan production database

```env
NEXT_PUBLIC_URL=https://your-production-domain.com
DB_HOST=your-db-host
DB_USER=your-db-user
DB_PASSWORD=your-secure-password
DB_NAME=your-production-db
JWT_SECRET=your-very-secure-and-long-jwt-secret-key
```

## Verification

### 1. Check Environment Variables

```bash
# Development
echo $NEXT_PUBLIC_URL

# In Next.js app
console.log(process.env.NEXT_PUBLIC_URL);
```

### 2. Test Photo Upload

1. Upload foto presensi
2. Check URL di database
3. Pastikan URL menggunakan full domain

Expected URL format:

```
https://yourdomain.com/api/uploads/attendance/attendance_123_1734567890.jpg
```

### 3. Test Photo Access

```bash
# Test direct access
curl https://yourdomain.com/api/uploads/attendance/filename.jpg
```

## Troubleshooting

### 1. URL Tidak Lengkap

**Problem:** URL foto hanya `/api/uploads/attendance/filename.jpg`

**Solution:**

- Check `NEXT_PUBLIC_URL` environment variable
- Restart development server
- Verify `.env.local` file

### 2. Foto Tidak Bisa Diakses

**Problem:** 404 atau 500 error saat akses foto

**Solution:**

- Check folder `uploads/attendance/` exists
- Verify file permissions (755)
- Check server logs

### 3. Migration Issues

**Problem:** Migration script tidak menggunakan full URL

**Solution:**

- Set `NEXT_PUBLIC_URL` before running migration
- Re-run migration script: `npm run migrate-photos`

## Best Practices

### 1. Development

- Gunakan `http://localhost:3000` untuk development
- Jangan commit file `.env.local`
- Test dengan berbagai environment

### 2. Production

- Gunakan HTTPS untuk production URL
- Backup environment variables
- Use secure JWT secrets (minimum 32 characters)
- Monitor photo access logs

### 3. Security

- Never expose sensitive environment variables to client
- Use `NEXT_PUBLIC_` prefix only for public variables
- Rotate JWT secrets regularly
- Monitor unauthorized access attempts
