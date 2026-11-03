import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { cookies } from "next/headers";
import { createToken, setServerCookie } from "@/lib/auth";
import {
	validateLoginInput,
	checkRateLimit,
	recordFailedAttempt,
	clearRateLimit,
	safeComparePassword,
	verifyTurnstileToken,
} from "@/lib/login-security";

export async function POST(request) {
	try {
		// Extract client IP (handle proxy / reverse proxy headers)
		const forwardedFor = request.headers.get("x-forwarded-for");
		const realIp = request.headers.get("x-real-ip");
		const clientIp = forwardedFor
			? forwardedFor.split(",")[0].trim()
			: realIp?.trim() || "127.0.0.1";

		// Safely parse JSON payload
		let body;
		try {
			body = await request.json();
		} catch {
			return NextResponse.json(
				{ message: "Format payload JSON tidak valid" },
				{ status: 400 }
			);
		}

		// Input validation & sanitization (SQLi/XSS/Length check)
		const validationResult = validateLoginInput(body);
		if (!validationResult.valid) {
			return NextResponse.json(
				{ message: validationResult.error },
				{ status: 400 }
			);
		}

		const { nip, password } = validationResult;

		// Rate limit check before querying database
		const rateLimit = checkRateLimit(clientIp, nip);
		if (!rateLimit.allowed) {
			const retryAfterSeconds = rateLimit.retryAfterSeconds || 60;
			return NextResponse.json(
				{
					message: `Terlalu banyak percobaan login gagal. Silakan coba lagi dalam ${Math.ceil(retryAfterSeconds / 60)} menit.`,
				},
				{
					status: 429,
					headers: {
						"Retry-After": String(retryAfterSeconds),
					},
				}
			);
		}

		// Cloudflare Turnstile token verification
		const turnstileToken = body.turnstileToken || body.captchaToken;
		const turnstileResult = await verifyTurnstileToken(turnstileToken, clientIp);
		if (!turnstileResult.success) {
			return NextResponse.json(
				{
					message:
						turnstileResult.message || "Verifikasi keamanan (Turnstile) gagal",
				},
				{ status: 403 }
			);
		}

		// SECURITY FIX CVE-007: Gunakan environment variables untuk encryption keys
		const AES_USER_KEY = process.env.AES_USER_KEY || "nur";
		const AES_PASSWORD_KEY = process.env.AES_PASSWORD_KEY || "windi";

		// Query dengan AES encryption/decryption
		const users = await query(
			`
			SELECT 
				pegawai.id,
				AES_DECRYPT(user.id_user, ?) as username,
				AES_DECRYPT(user.password, ?) as password,
				pegawai.nama,
				pegawai.departemen as cap,
				pegawai.tmp_lahir,
				pegawai.tgl_lahir,
				pegawai.alamat,
				pegawai.photo
			FROM user
			JOIN pegawai ON pegawai.nik = AES_DECRYPT(user.id_user, ?)
			WHERE user.id_user = AES_ENCRYPT(?, ?)
			AND pegawai.stts_aktif = 'AKTIF'
		`,
			[AES_USER_KEY, AES_PASSWORD_KEY, AES_USER_KEY, nip, AES_USER_KEY]
		);

		if (!users || users.length === 0) {
			recordFailedAttempt(clientIp, nip);
			return NextResponse.json(
				{ message: "NIP atau password salah" },
				{ status: 401 }
			);
		}

		const user = users[0];

		// Timing-safe password comparison
		const isPasswordValid = safeComparePassword(user.password, password);
		if (!isPasswordValid) {
			recordFailedAttempt(clientIp, nip);
			return NextResponse.json(
				{ message: "NIP atau password salah" },
				{ status: 401 }
			);
		}

		// Clear rate limiting counter upon successful authentication
		clearRateLimit(clientIp, nip);

		// Create JWT token dengan payload
		const tokenPayload = {
			id: user.id,
			username: user.username ? user.username.toString() : "",
			nama: user.nama,
			departemen: user.cap,
			tmp_lahir: user.tmp_lahir,
			tgl_lahir: user.tgl_lahir,
			alamat: user.alamat,
			photo: user.photo,
		};

		const token = await createToken(tokenPayload);
		const cookieStore = await cookies();
		setServerCookie(cookieStore, token);

		// Hapus password dari memory user object sebelum response
		delete user.password;

		return NextResponse.json({
			message: "Login berhasil",
			token,
			user: {
				id: user.id,
				username: user.username ? user.username.toString() : "",
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
