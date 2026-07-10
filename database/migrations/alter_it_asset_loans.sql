-- 1. Modifikasi asset_id agar boleh NULL (karena diawal pengajuan aset belum dialokasikan)
-- Namun perhatikan, karena Foreign Key ke `it_assets(id)` ada, kita perlu drop foreign key constraintnya dulu jika database strict, 
-- tapi jika diizinkan ON DELETE SET NULL, akan lebih mudah. Oleh karena itu kita ubah kolomnya:

ALTER TABLE it_asset_loans
MODIFY asset_id INT(11) NULL;

-- 2. Tambah kolom untuk mencatat kategori barang apa yang direquest pegawai
ALTER TABLE it_asset_loans
ADD COLUMN jenis_aset_diminta VARCHAR(100) AFTER pegawai_id;

-- 3. Ubah ENUM status untuk menampung aliran Approval 
ALTER TABLE it_asset_loans
MODIFY status_peminjaman ENUM('Menunggu Approval', 'Ditolak', 'Aktif', 'Dikembalikan', 'Terlambat', 'Hilang') DEFAULT 'Menunggu Approval';

-- 4. Tambah field untuk mencatat alasan jika IT menolak pengajuan
ALTER TABLE it_asset_loans
ADD COLUMN alasan_penolakan TEXT AFTER status_peminjaman;
