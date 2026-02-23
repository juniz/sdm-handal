import { NextResponse } from "next/server";
import { createConnection } from "@/lib/db";

export async function GET() {
    let connection;
    try {
        connection = await createConnection();
        
        // Check if signed_by column exists
        const [columns] = await connection.execute(
            "SHOW COLUMNS FROM gaji_validasi LIKE 'signed_by'"
        );
        
        if (columns.length === 0) {
            return NextResponse.json({ message: "Column signed_by already removed" });
        }

        // Drop Foreign Key if exists
        // We need to find the FK name first
        const [fks] = await connection.execute(
            `SELECT CONSTRAINT_NAME 
             FROM information_schema.KEY_COLUMN_USAGE 
             WHERE TABLE_NAME = 'gaji_validasi' 
             AND COLUMN_NAME = 'signed_by' 
             AND TABLE_SCHEMA = DATABASE()`
        );

        for (const fk of fks) {
            await connection.execute(`ALTER TABLE gaji_validasi DROP FOREIGN KEY ${fk.CONSTRAINT_NAME}`);
        }

        // Drop Index if exists
        // Need to check indices containing signed_by
        const [indices] = await connection.execute(
            `SHOW INDEX FROM gaji_validasi WHERE Column_name = 'signed_by'`
        );
        
        // We can just try to drop known indices or the unique key
        try {
             await connection.execute("ALTER TABLE gaji_validasi DROP INDEX uk_gaji_validasi");
        } catch (e) {
            console.log("Index uk_gaji_validasi might not exist or already dropped", e.message);
        }
        
         try {
             await connection.execute("ALTER TABLE gaji_validasi DROP INDEX idx_signed_by");
        } catch (e) {
            console.log("Index idx_signed_by might not exist or already dropped", e.message);
        }

        // Add new unique key
        try {
            await connection.execute("ALTER TABLE gaji_validasi ADD UNIQUE KEY uk_gaji_validasi (gaji_id)");
        } catch (e) {
             console.log("Index uk_gaji_validasi could not be added (maybe exists)", e.message);
        }

        // Drop Column
        await connection.execute("ALTER TABLE gaji_validasi DROP COLUMN signed_by");

        return NextResponse.json({ success: true, message: "Migration completed successfully" });
    } catch (error) {
        console.error("Migration failed:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    } finally {
        if (connection) await connection.end();
    }
}
