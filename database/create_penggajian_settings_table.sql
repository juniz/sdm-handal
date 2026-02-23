-- =============================================
-- Database Schema: Pengaturan Penggajian
-- =============================================

CREATE TABLE IF NOT EXISTS penggajian_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    karumkit_nama VARCHAR(255) NOT NULL,
    karumkit_pangkat VARCHAR(255) NOT NULL,
    karumkit_nip VARCHAR(50) NOT NULL,
    bendahara_nama VARCHAR(255) NOT NULL,
    bendahara_pangkat VARCHAR(255) NOT NULL,
    bendahara_nip VARCHAR(50) NOT NULL,
    bpjs_kesehatan_nominal DECIMAL(15,2) NOT NULL DEFAULT 0,
    bpjs_ketenagakerjaan_nominal DECIMAL(15,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Initial seed (optional, placeholder data)
-- INSERT INTO penggajian_settings (karumkit_nama, karumkit_nip, bendahara_nama, bendahara_nip, bpjs_kesehatan_nominal, bpjs_ketenagakerjaan_nominal)
-- VALUES ('drg. WAHYU ARI PRANANTO, M.A.R.S.', '123456789', 'SUNARTI, S. Kep., Ns', '987654321', 10000, 20000);
