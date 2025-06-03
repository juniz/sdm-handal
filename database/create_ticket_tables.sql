-- Script untuk membuat tabel ticket IT Support

-- Tabel Kategori Masalah
CREATE TABLE IF NOT EXISTS categories_ticket (
    category_id INT PRIMARY KEY AUTO_INCREMENT,
    category_name VARCHAR(50) NOT NULL UNIQUE
);

-- Tabel Prioritas
CREATE TABLE IF NOT EXISTS priorities_ticket (
    priority_id INT PRIMARY KEY AUTO_INCREMENT,
    priority_name VARCHAR(20) NOT NULL UNIQUE,
    priority_level INT NOT NULL UNIQUE
);

-- Tabel Status
CREATE TABLE IF NOT EXISTS statuses_ticket (
    status_id INT PRIMARY KEY AUTO_INCREMENT,
    status_name VARCHAR(20) NOT NULL UNIQUE
);

-- Tabel Tiket
CREATE TABLE IF NOT EXISTS tickets (
    ticket_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(20) NOT NULL,
    departemen_id CHAR(1) NOT NULL,
    category_id INT NOT NULL,
    priority_id INT NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_date TIMESTAMP NULL,
    closed_date TIMESTAMP NULL,
    current_status_id INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES pegawai(nik),
    FOREIGN KEY (departemen_id) REFERENCES departemen(dep_id),
    FOREIGN KEY (category_id) REFERENCES categories_ticket(category_id),
    FOREIGN KEY (priority_id) REFERENCES priorities_ticket(priority_id),
    FOREIGN KEY (current_status_id) REFERENCES statuses_ticket(status_id)
); 