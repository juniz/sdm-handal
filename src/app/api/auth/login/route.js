import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { cookies } from "next/headers";
import { createToken, setServerCookie } from "@/lib/auth";

export async function POST(request) {
	try {
		const { nip, password } = await request.json();
		console.log("Login attempt for NIP:", nip);

		// Validasi input
		if (!nip || !password) {
			console.log("Missing credentials");
			return NextResponse.json(
				{ message: "NIP dan password harus diisi" },
				{ status: 400 }
			);
		}

		// Query dengan AES encryption/decryption
		const users = await query(
			`
			SELECT 
				pegawai.id,
				AES_DECRYPT(user.id_user, 'nur') as username,
				AES_DECRYPT(user.password, 'windi') as password,
				pegawai.nama,
				pegawai.departemen as cap,
				pegawai.tmp_lahir,
				pegawai.tgl_lahir,
				pegawai.alamat,
				pegawai.photo
			FROM user
			JOIN pegawai ON pegawai.nik = AES_DECRYPT(user.id_user, 'nur')
			WHERE user.id_user = AES_ENCRYPT(?, 'nur')
			AND pegawai.stts_aktif = 'AKTIF'
		`,
			[nip]
		);

		console.log("Query result:", users ? "User found" : "User not found");

		if (!users || users.length === 0) {
			console.log("Invalid credentials - user not found");
			return NextResponse.json(
				{ message: "NIP atau password salah" },
				{ status: 401 }
			);
		}

		const user = users[0];

		// Convert Buffer to string for comparison
		const decryptedPassword = user.password.toString();

		if (decryptedPassword !== password) {
			console.log("Invalid credentials - wrong password");
			return NextResponse.json(
				{ message: "NIP atau password salah" },
				{ status: 401 }
			);
		}

		// Create JWT token dengan payload
		const tokenPayload = {
			id: user.id,
			username: user.username.toString(),
			nama: user.nama,
			departemen: user.cap,
			tmp_lahir: user.tmp_lahir,
			tgl_lahir: user.tgl_lahir,
			alamat: user.alamat,
			photo: user.photo,
		};

		console.log("Creating token with payload:", {
			...tokenPayload,
			password: "[REDACTED]",
		});

		const token = await createToken(tokenPayload);
		const cookieStore = cookies();
		setServerCookie(cookieStore, token);

		// Hapus password dari response
		delete user.password;

		console.log("Login successful for user:", user.username.toString());

		return NextResponse.json({
			message: "Login berhasil",
			user: {
				id: user.id,
				username: user.username.toString(),
				nama: user.nama,
				departemen: user.cap,
				tmp_lahir: user.tmp_lahir,
				tgl_lahir: user.tgl_lahir,
				alamat: user.alamat,
				photo: user.photo,
			},
		});
	} catch (error) {
		console.error("Login error:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan pada server" },
			{ status: 500 }
		);
	}
}
