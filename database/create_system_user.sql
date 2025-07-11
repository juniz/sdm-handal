-- SQL Script untuk membuat sistem user untuk auto-close tickets
-- Jalankan script ini jika Anda ingin membuat user khusus sistem

-- Periksa apakah sudah ada user sistem
SELECT nik, nama, jabatan FROM pegawai WHERE nik = 'SYSTEM001';

-- Jika tidak ada, buat user sistem baru
INSERT IGNORE INTO pegawai (
    nik,
    nama,
    jabatan,
    departemen,
    status,
    created_at,
    updated_at
) VALUES (
    'SYSTEM001',
    'SISTEM AUTO-CLOSE',
    'IT',
    'SISTEM',
    'aktif',
    NOW(),
    NOW()
);

-- Verifikasi user sistem telah dibuat
SELECT nik, nama, jabatan, departemen, status FROM pegawai WHERE nik = 'SYSTEM001';

-- Opsional: Buat user backup sistem
INSERT IGNORE INTO pegawai (
    nik,
    nama,
    jabatan,
    departemen,
    status,
    created_at,
    updated_at
) VALUES (
    'ADMIN001',
    'ADMINISTRATOR SISTEM',
    'IT',
    'SISTEM',
    'aktif',
    NOW(),
    NOW()
);

-- Verifikasi semua user sistem
SELECT nik, nama, jabatan, departemen FROM pegawai 
WHERE jabatan = 'IT' 
OR nama LIKE '%sistem%' 
OR nama LIKE '%admin%'
ORDER BY nik; 