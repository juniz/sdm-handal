import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { query } from "@/lib/db";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function PUT(request) {
	try {
		const cookieStore = cookies();
		const token = cookieStore.get("auth_token")?.value;

		if (!token) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		let verified;
		try {
			verified = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
		} catch (error) {
			if (error.code === "ERR_JWT_EXPIRED") {
				return NextResponse.json(
					{ error: "Token kedaluwarsa, silakan login kembali" },
					{ status: 401 }
				);
			}
			throw error;
		}

		const { oldPassword, newPassword } = await request.json();
		const username = verified.payload.username;

		// Validasi input
		if (!oldPassword || !newPassword) {
			return NextResponse.json(
				{ error: "Password lama dan baru harus diisi" },
				{ status: 400 }
			);
		}

		// Cek password lama
		const users = await query(
			`
			SELECT AES_DECRYPT(password, 'windi') as password
			FROM user
			WHERE id_user = AES_ENCRYPT(?, 'nur')
		`,
			[username]
		);

		if (!users || users.length === 0) {
			return NextResponse.json(
				{ error: "Data pengguna tidak ditemukan" },
				{ status: 404 }
			);
		}

		const user = users[0];
		const currentPassword = user.password.toString();

		if (currentPassword !== oldPassword) {
			return NextResponse.json(
				{ error: "Password lama tidak sesuai" },
				{ status: 400 }
			);
		}

		// Update password
		await query(
			`
			UPDATE user 
			SET password = AES_ENCRYPT(?, 'windi')
			WHERE id_user = AES_ENCRYPT(?, 'nur')
		`,
			[newPassword, username]
		);

		return NextResponse.json({
			status: "success",
			message: "Password berhasil diubah",
		});
	} catch (error) {
		console.error("Error updating password:", error);
		return NextResponse.json(
			{ error: "Terjadi kesalahan saat mengubah password" },
			{ status: 500 }
		);
	}
}
