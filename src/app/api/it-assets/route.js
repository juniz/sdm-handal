import { NextResponse } from "next/server";
import { select, rawQuery, withTransaction, transactionHelpers, update } from "@/lib/db-helper";

// Get List of IT Assets
export async function GET(request) {
	try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const status = searchParams.get('status') || '';

        let queryStr = `
            SELECT a.*, d.nama as nama_departemen
            FROM it_assets a
            LEFT JOIN departemen d ON a.lokasi_departemen_id = d.dep_id
            WHERE 1=1
        `;
        const params = [];

        if (search) {
            queryStr += ` AND (a.nama LIKE ? OR a.serial_id LIKE ? OR a.jenis LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        
        if (status && status !== 'All') {
            queryStr += ` AND a.status = ?`;
            params.push(status);
        }

        queryStr += ` ORDER BY a.created_at DESC`;

		const data = await rawQuery(queryStr, params);
		return NextResponse.json(data);
	} catch (error) {
		console.error("GET IT Assets API Error:", error);
		return NextResponse.json({ error: error.message }, { status: 500 });
	}
}

// Create new IT Asset
export async function POST(request) {
    try {
        const body = await request.json();
        
        // 1. Validasi input
        if (!body.nama || !body.jenis) {
            return NextResponse.json({ error: "Nama dan Jenis barang wajib diisi" }, { status: 400 });
        }

        const newAssetId = await withTransaction(async (transaction) => {
            // A. Insert asset utama
            const assetData = {
                nama: body.nama,
                serial_id: body.serial_id || null,
                jenis: body.jenis,
                vendor: body.vendor || null,
                status: body.status || 'Tersedia',
                kondisi: body.kondisi || 'Baik',
                lokasi_departemen_id: body.lokasi_departemen_id || null,
            };

            // Parse tanggal jika ada
            if (body.tanggal_beli) assetData.tanggal_beli = body.tanggal_beli;
            if (body.garansi_berakhir) assetData.garansi_berakhir = body.garansi_berakhir;

            const insertResult = await transactionHelpers.insert(transaction, {
                table: "it_assets",
                data: assetData
            });

            const insertedId = insertResult.insertId;

            // B. Catat di Audit Log
            await transactionHelpers.insert(transaction, {
                table: "it_asset_logs",
                data: {
                    asset_id: insertedId,
                    action_type: 'CREATED',
                    description: `Aset baru diregistrasi: ${body.nama} (${body.jenis})`,
                    changed_by: body.user_id || null // IDEALNYA diamil dari user session token
                }
            });

            return insertedId;
        });

        return NextResponse.json({ success: true, id: newAssetId }, { status: 201 });
    } catch (error) {
        console.error("POST IT Assets API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Update existing IT Asset
export async function PUT(request) {
    try {
        const body = await request.json();
        const { id, ...updateData } = body;

        if (!id) {
            return NextResponse.json({ error: "Asset ID is required" }, { status: 400 });
        }

        await withTransaction(async (transaction) => {
            // A. Update asset
            await transactionHelpers.update(transaction, {
                table: "it_assets",
                data: {
                    nama: updateData.nama,
                    serial_id: updateData.serial_id || null,
                    jenis: updateData.jenis,
                    vendor: updateData.vendor || null,
                    status: updateData.status,
                    kondisi: updateData.kondisi,
                    lokasi_departemen_id: updateData.lokasi_departemen_id || null,
                    tanggal_beli: updateData.tanggal_beli || null,
                    garansi_berakhir: updateData.garansi_berakhir || null
                },
                where: { id: id }
            });

            // B. Catat di Audit Log
            await transactionHelpers.insert(transaction, {
                table: "it_asset_logs",
                data: {
                    asset_id: id,
                    action_type: 'STATUS_CHANGE',
                    description: `Data aset diperbarui: ${updateData.nama}. Status: ${updateData.status}`,
                    changed_by: updateData.user_id || null
                }
            });
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("PUT IT Assets API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Delete IT Asset
export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: "Asset ID is required" }, { status: 400 });
        }

        await withTransaction(async (transaction) => {
            // Check for active loans first? Usually cascading delete or check
            // For now, let's assume we can delete, but it's better to hide/archive
            
            // Delete from logs first if no cascade
            // For now, we'll just delete from assets
             await transactionHelpers.delete(transaction, {
                table: "it_assets",
                where: { id: id }
            });
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE IT Assets API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

