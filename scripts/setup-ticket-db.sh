#!/bin/bash

# Script untuk setup database ticket IT Support
# Pastikan MySQL sudah running dan kredensial database sudah benar

echo "🚀 Setup Database Ticket IT Support"
echo "=================================="

# Konfigurasi database (sesuaikan dengan environment Anda)
DB_HOST=${DB_HOST:-"localhost"}
DB_PORT=${DB_PORT:-"3306"}
DB_NAME=${DB_NAME:-"sik"}
DB_USER=${DB_USER:-"root"}

# Prompt untuk password jika tidak ada di environment
if [ -z "$DB_PASSWORD" ]; then
    echo -n "Masukkan password database: "
    read -s DB_PASSWORD
    echo
fi

echo "📋 Informasi Database:"
echo "Host: $DB_HOST"
echo "Port: $DB_PORT"
echo "Database: $DB_NAME"
echo "User: $DB_USER"
echo

# Test koneksi database
echo "🔍 Testing koneksi database..."
mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1;" "$DB_NAME" > /dev/null 2>&1

if [ $? -ne 0 ]; then
    echo "❌ Gagal terhubung ke database. Periksa kredensial dan pastikan MySQL running."
    exit 1
fi

echo "✅ Koneksi database berhasil!"
echo

# Buat tabel ticket
echo "📦 Membuat tabel ticket..."
mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < database/create_ticket_tables.sql

if [ $? -eq 0 ]; then
    echo "✅ Tabel ticket berhasil dibuat!"
else
    echo "❌ Gagal membuat tabel ticket!"
    exit 1
fi

# Inisialisasi data master
echo "📊 Menginisialisasi data master..."
mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < database/init_ticket_data.sql

if [ $? -eq 0 ]; then
    echo "✅ Data master berhasil diinisialisasi!"
else
    echo "❌ Gagal menginisialisasi data master!"
    exit 1
fi

echo
echo "🎉 Setup database ticket selesai!"
echo "📝 Menu ticket dapat diakses di: /dashboard/ticket"
echo
echo "📋 Data yang telah dibuat:"
echo "- Tabel: categories_ticket, priorities_ticket, statuses_ticket, tickets"
echo "- Kategori: Hardware, Software, Network, Printer, Email, Database, Security, Backup, Other"
echo "- Prioritas: Low, Medium, High, Critical"
echo "- Status: Open, In Progress, Resolved, Closed"
echo
echo "✨ Selamat menggunakan sistem ticket IT Support!" 