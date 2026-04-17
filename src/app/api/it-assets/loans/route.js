import { NextResponse } from "next/server";
import { select, rawQuery, withTransaction, transactionHelpers, update } from "@/lib/db-helper";
import moment from "moment-timezone";

// Retrieve list of loans & requests
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') || ''; // 'Aktif', 'Menunggu Approval', dll
        const pegawaiId = searchParams.get('pegawai_id') || ''; 

        let queryStr = `
            SELECT 
                l.*, 
                a.nama as asset_nama, 
                a.serial_id,
                a.jenis,
                p.nama as pegawai_nama,
                p.jbtn as jabatan,
                d.nama as departemen_nama
            FROM it_asset_loans l
            LEFT JOIN it_assets a ON l.asset_id = a.id
            LEFT JOIN pegawai p ON l.pegawai_id = p.id
            LEFT JOIN departemen d ON l.departemen_id = d.dep_id
            WHERE 1=1
        `;
        const params = [];

        if (status && status !== 'All') {
            queryStr += ` AND l.status_peminjaman = ?`;
            params.push(status);
        }
        
        if (pegawaiId) {
            queryStr += ` AND l.pegawai_id = ?`;
            params.push(pegawaiId);
        }

        queryStr += ` ORDER BY l.created_at DESC, l.tanggal_pinjam DESC`;

        const data = await rawQuery(queryStr, params);
        return NextResponse.json(data);
    } catch (error) {
        console.error("GET IT Asset Loans Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Create a new loan REQUEST (Pengajuan)
export async function POST(request) {
    try {
        const body = await request.json();
        const tz = "Asia/Jakarta";
        const now = moment().tz(tz).format("YYYY-MM-DD HH:mm:ss");

        if (!body.pegawai_id || !body.jenis_aset_diminta) {
            return NextResponse.json({ error: "Pegawai dan Jenis Aset wajib diisi" }, { status: 400 });
        }

        const newLoanId = await withTransaction(async (transaction) => {
            // Insert pengajuan (tanpa asset_id dulu)
            const insertResult = await transactionHelpers.insert(transaction, {
                table: "it_asset_loans",
                data: {
                    asset_id: null,
                    jenis_aset_diminta: body.jenis_aset_diminta,
                    pegawai_id: body.pegawai_id,
                    departemen_id: body.departemen_id || null,
                    tanggal_pinjam: body.tanggal_pinjam || now, 
                    tenggat_pengembalian: body.tenggat_pengembalian || null,
                    tujuan_peminjaman: body.tujuan_peminjaman || null,
                    status_peminjaman: 'Menunggu Approval',
                    created_by: body.user_id || body.pegawai_id, // By pegawai ybs
                    created_at: now
                }
            });

            return insertResult.insertId;
        });

        return NextResponse.json({ success: true, id: newLoanId }, { status: 201 });
    } catch (error) {
        console.error("POST IT Asset Loan Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Manage Asset Requests (Approve / Reject / Return)
export async function PUT(request) {
    try {
        const body = await request.json();
        const { action, loan_id, asset_id, user_id, kondisi_kembali, status_aset_baru, alasan_penolakan, kondisi_keluar } = body;
        const tz = "Asia/Jakarta";
        const now = moment().tz(tz).format("YYYY-MM-DD HH:mm:ss");

        if (!loan_id || !action) {
             return NextResponse.json({ error: "Missing loan_id or action" }, { status: 400 });
        }

        await withTransaction(async (transaction) => {
            
            if (action === 'APPROVE') {
                if (!asset_id) throw new Error("Approval harus menyertakan unit/asset fisik.");
                
                // 1. Assign Asset & Update status pengajuan jadi Aktif
                await transactionHelpers.update(transaction, {
                    table: "it_asset_loans",
                    data: {
                        asset_id: asset_id,
                        status_peminjaman: 'Aktif',
                        kondisi_keluar: kondisi_keluar || 'Baik',
                        created_by: user_id || null, // Di-Acc oleh IT
                        updated_at: now
                    },
                    where: { id: loan_id }
                });

                // 2. Ubah status Asset Master jadi "Dipinjam"
                await transactionHelpers.update(transaction, {
                    table: "it_assets",
                    data: {
                        status: 'Dipinjam',
                        updated_at: now
                    },
                    where: { id: asset_id }
                });

                // 3. Catat di Log
                await transactionHelpers.insert(transaction, {
                    table: "it_asset_logs",
                    data: {
                        asset_id: asset_id,
                        action_type: 'LOANED',
                        description: `Approval Peminjaman Aset. Tiket #${loan_id}`,
                        changed_by: user_id || null, 
                        created_at: now
                    }
                });

            } else if (action === 'REJECT') {
                await transactionHelpers.update(transaction, {
                    table: "it_asset_loans",
                    data: {
                        status_peminjaman: 'Ditolak',
                        alasan_penolakan: alasan_penolakan || 'Tidak memenuhi kriteria / Stok Kosong',
                        updated_at: now
                    },
                    where: { id: loan_id }
                });

            } else if (action === 'RETURN') {
                if (!asset_id || !kondisi_kembali || !status_aset_baru) throw new Error("Missing return params");
                
                await transactionHelpers.update(transaction, {
                    table: "it_asset_loans",
                    data: {
                        tanggal_kembali: now,
                        kondisi_kembali: kondisi_kembali,
                        status_peminjaman: 'Dikembalikan',
                        received_by: user_id || null,
                        updated_at: now
                    },
                    where: { id: loan_id }
                });

                await transactionHelpers.update(transaction, {
                    table: "it_assets",
                    data: {
                        status: status_aset_baru, 
                        kondisi: kondisi_kembali.includes("Rusak") ? kondisi_kembali : 'Baik',
                        lokasi_departemen_id: null,
                        updated_at: now
                    },
                    where: { id: asset_id }
                });

                 await transactionHelpers.insert(transaction, {
                    table: "it_asset_logs",
                    data: {
                        asset_id: asset_id,
                        action_type: 'RETURNED',
                        description: `Aset dikembalikan. Kondisi: ${kondisi_kembali}. Status kini: ${status_aset_baru}`,
                        changed_by: user_id || null, 
                        created_at: now
                    }
                });
            }
        });

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error("PUT IT Asset Return/Approve Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
