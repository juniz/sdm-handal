"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { AttendanceCamera } from "@/components/AttendanceCamera";
import LocationMap from "@/components/LocationMap";
import moment from "moment";
import "moment/locale/id";
import {
	Clock,
	MapPin,
	Camera,
	CheckCircle,
	XCircle,
	Calendar,
} from "lucide-react";
import { useRealTime } from "@/hooks/useRealTime";

// Helper untuk format 2 digit
const padZero = (num) => {
	return num.toString().padStart(2, "0");
};

export default function AttendancePage() {
	const [photo, setPhoto] = useState(null);
	const [isLocationValid, setIsLocationValid] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [status, setStatus] = useState(null);
	const { formattedTime, formattedDate, momentInstance } = useRealTime();
	const [jadwal, setJadwal] = useState(null);
	const [tanggal, setTanggal] = useState(moment().format("D"));
	const [shift, setShift] = useState(null);
	const alertRef = useRef(null);
	const [todayAttendance, setTodayAttendance] = useState(null);
	const [isCheckingOut, setIsCheckingOut] = useState(false);
	const [jamPulang, setJamPulang] = useState(null);
	const [mapPresensi, setMapPresensi] = useState(process.env.MAP_PRESENSI);

	const fetchShift = async () => {
		const response = await fetch(`/api/attendance`);
		const data = await response.json();
		setJadwal(data.data[0]);
	};

	const fetchTodayAttendance = async () => {
		try {
			const response = await fetch("/api/attendance/today");
			const data = await response.json();
			if (data.data) {
				setTodayAttendance(data.data);
				setJamPulang(data.jam_pulang);
			}
		} catch (error) {
			console.error("Error fetching today attendance:", error);
		}
	};

	useEffect(() => {
		// Gunakan moment untuk mendapatkan tanggal
		// const day = moment().format("D");
		// setTanggal(day);
		fetchShift();
		fetchTodayAttendance();
	}, []);

	// Tambahkan useEffect baru untuk memantau perubahan tanggal
	useEffect(() => {
		console.log("Nilai tanggal berubah:", tanggal);
	}, [tanggal]);

	// Efek terpisah untuk menghitung status checkout
	useEffect(() => {
		const jamNow = moment().format("HH:mm:ss");
		if (jamPulang) {
			setIsCheckingOut(jamNow > jamPulang);
		}
	}, [jamPulang]);

	useEffect(() => {
		if (jadwal && tanggal) {
			// Mengambil nilai kolom berdasarkan tanggal (h01, h02, ..., h31)
			const columnName = `h${tanggal}`;
			setShift(jadwal[columnName] || "Tidak ada shift");
		}
	}, [jadwal, tanggal]);

	const handleCheckIn = async () => {
		if (!photo || !isLocationValid) return;

		setIsSubmitting(true);
		try {
			// Dapatkan lokasi terkini
			const position = await new Promise((resolve, reject) => {
				navigator.geolocation.getCurrentPosition(resolve, reject);
			});

			const response = await fetch("/api/attendance", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					photo,
					timestamp: momentInstance.format("YYYY-MM-DD HH:mm:ss"),
					latitude: position.coords.latitude.toString(),
					longitude: position.coords.longitude.toString(),
					isCheckingOut: false,
				}),
			});

			if (!response.ok) throw new Error("Gagal melakukan presensi");

			const data = await response.json();
			setStatus("success");
			setPhoto(null);

			// Update todayAttendance setelah berhasil presensi
			if (data.data) {
				setTodayAttendance(data.data);
			}

			// Scroll ke alert dan fokuskan
			setTimeout(() => {
				alertRef.current?.scrollIntoView({ behavior: "smooth" });
				alertRef.current?.focus();
			}, 100);
		} catch (error) {
			console.error("Error submitting attendance:", error);
			setStatus("error");

			// Scroll ke alert dan fokuskan juga saat error
			setTimeout(() => {
				alertRef.current?.scrollIntoView({ behavior: "smooth" });
				alertRef.current?.focus();
			}, 100);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleCheckOut = async () => {
		setIsSubmitting(true);
		try {
			// Dapatkan lokasi terkini
			const position = await new Promise((resolve, reject) => {
				navigator.geolocation.getCurrentPosition(resolve, reject);
			});

			const response = await fetch("/api/attendance", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					photo,
					timestamp: momentInstance.format("YYYY-MM-DD HH:mm:ss"),
					latitude: position.coords.latitude.toString(),
					longitude: position.coords.longitude.toString(),
					isCheckingOut: true,
				}),
			});

			if (!response.ok) throw new Error("Gagal melakukan presensi pulang");

			const data = await response.json();
			setStatus("success");
			setPhoto(null);

			// Update todayAttendance setelah berhasil presensi
			if (data.data) {
				window.location.reload();
				// setTodayAttendance(data.data);
			}

			// Scroll ke alert dan fokuskan
			setTimeout(() => {
				alertRef.current?.scrollIntoView({ behavior: "smooth" });
				alertRef.current?.focus();
			}, 100);
		} catch (error) {
			console.error("Error submitting check-out:", error);
			setStatus("error");

			// Scroll ke alert dan fokuskan juga saat error
			setTimeout(() => {
				alertRef.current?.scrollIntoView({ behavior: "smooth" });
				alertRef.current?.focus();
			}, 100);
		} finally {
			setIsSubmitting(false);
		}
	};

	// Fungsi untuk memformat jam
	const formatTime = (dateTimeString) => {
		return moment(dateTimeString).format("HH:mm:ss");
	};

	return (
		<div className="max-w-lg mx-auto space-y-6">
			<div className="bg-white p-6 rounded-lg shadow-sm">
				<h1 className="text-2xl font-semibold mb-6">Presensi</h1>

				{/* Status */}
				{status && (
					<div
						ref={alertRef}
						tabIndex={-1}
						className={`mb-6 p-4 rounded-lg ${
							status === "success"
								? "bg-green-50 text-green-700"
								: "bg-red-50 text-red-700"
						}`}
					>
						<div className="flex items-center gap-2">
							{status === "success" ? (
								<>
									<CheckCircle className="w-5 h-5" />
									<span>Presensi berhasil dicatat!</span>
								</>
							) : (
								<>
									<XCircle className="w-5 h-5" />
									<span>Gagal melakukan presensi. Silakan coba lagi.</span>
								</>
							)}
						</div>
					</div>
				)}

				{/* Data Presensi Hari Ini */}
				{todayAttendance && (
					<div className="mb-6 bg-blue-50 p-4 rounded-lg">
						<h2 className="text-lg font-semibold text-blue-800 mb-3">
							Data Presensi Hari Ini
						</h2>
						<div className="space-y-2">
							<div className="flex justify-between">
								<span className="text-blue-600">Jam Masuk:</span>
								<span className="font-medium">
									{formatTime(todayAttendance.jam_datang)}
								</span>
							</div>
							{todayAttendance.jam_pulang && (
								<div className="flex justify-between">
									<span className="text-blue-600">Jam Pulang:</span>
									<span className="font-medium">
										{formatTime(todayAttendance.jam_pulang)}
									</span>
								</div>
							)}
							<div className="flex justify-between">
								<span className="text-blue-600">Status:</span>
								<span className="font-medium">{todayAttendance.status}</span>
							</div>
							{todayAttendance.photo && (
								<div className="mt-4">
									<span className="text-blue-600 block mb-2 text-center">
										Foto Presensi Masuk
									</span>
									<div className="flex justify-center">
										<Image
											src={todayAttendance.photo}
											alt="Foto Presensi Masuk"
											width={200}
											height={200}
											className="rounded-lg"
										/>
									</div>
								</div>
							)}
							{todayAttendance.photo_pulang && (
								<div className="mt-4">
									<span className="text-blue-600 block mb-2 text-center">
										Foto Presensi Pulang
									</span>
									<div className="flex justify-center">
										<Image
											src={todayAttendance.photo_pulang}
											alt="Foto Presensi Pulang"
											width={200}
											height={200}
											className="rounded-lg"
										/>
									</div>
								</div>
							)}
						</div>
					</div>
				)}

				{/* Waktu dan Tanggal */}
				<div className="mb-6 bg-gray-50 p-4 rounded-lg">
					<div className="flex items-center gap-4 mb-3">
						<div className="flex items-center gap-2 text-gray-600">
							<Calendar className="w-5 h-5" />
							<span>Tanggal</span>
						</div>
						<div className="text-gray-900 font-medium">{formattedDate}</div>
					</div>
					<div className="flex items-center gap-4 mb-3">
						<div className="flex items-center gap-2 text-gray-600">
							<Clock className="w-5 h-5" />
							<span>Waktu</span>
						</div>
						<div className="text-2xl font-bold text-blue-600 font-mono tracking-wider">
							{formattedTime}
						</div>
					</div>
					<div className="flex items-center gap-4">
						<div className="flex items-center gap-2 text-gray-600">
							<Clock className="w-5 h-5" />
							<span>Shift</span>
						</div>
						<div className="text-gray-900 font-medium">
							{shift ? shift : "Belum ada shift"}
						</div>
					</div>
				</div>

				{/* Form Presensi Masuk - Hanya tampilkan jika belum presensi */}
				{!todayAttendance && (
					<>
						{/* Foto */}
						<div className="mb-6">
							<div className="flex items-center gap-2 text-gray-600 mb-2">
								<Camera className="w-5 h-5" />
								<span>Foto Diri</span>
							</div>
							{photo ? (
								<div className="relative">
									<Image
										src={photo}
										alt="Preview"
										width={500}
										height={500}
										className="w-full rounded-lg object-cover"
									/>
									<button
										onClick={() => setPhoto(null)}
										className="absolute top-2 right-2 bg-white p-2 rounded-full shadow-sm hover:bg-gray-100"
									>
										<XCircle className="w-5 h-5 text-gray-600" />
									</button>
								</div>
							) : (
								<AttendanceCamera onCapture={setPhoto} />
							)}
						</div>

						{/* Lokasi */}
						<div className="mb-6">
							<div className="flex items-center gap-2 text-gray-600 mb-2">
								<MapPin className="w-5 h-5" />
								<span>Lokasi</span>
							</div>
							<LocationMap onLocationVerified={setIsLocationValid} />
							{isLocationValid && (
								<div className="mt-2 text-sm text-green-600 flex items-center gap-1">
									<CheckCircle className="w-4 h-4" />
									<span>Lokasi Anda berada dalam radius kantor</span>
								</div>
							)}
						</div>

						{/* Tombol Presensi Masuk */}
						<button
							onClick={handleCheckIn}
							disabled={!photo || !isLocationValid || isSubmitting}
							className={`w-full py-3 rounded-lg font-medium ${
								!photo || !isLocationValid || isSubmitting
									? "bg-gray-100 text-gray-400 cursor-not-allowed"
									: "bg-blue-500 text-white hover:bg-blue-600"
							}`}
						>
							{isSubmitting ? (
								<div className="flex items-center justify-center gap-2">
									<div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
									<span>Memproses...</span>
								</div>
							) : (
								"Presensi Masuk"
							)}
						</button>
					</>
				)}

				{/* Form Presensi Pulang - Hanya tampilkan jika sudah presensi masuk tapi belum pulang */}
				{todayAttendance && !todayAttendance.jam_pulang && (
					<>
						{/* Tombol Presensi Pulang */}
						<button
							onClick={handleCheckOut}
							disabled={!isCheckingOut}
							className={`w-full py-3 rounded-lg font-medium ${
								!isCheckingOut
									? "bg-gray-100 text-gray-400 cursor-not-allowed"
									: "bg-orange-500 text-white hover:bg-orange-600"
							}`}
						>
							{isSubmitting ? (
								<div className="flex items-center justify-center gap-2">
									<div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
									<span>Memproses...</span>
								</div>
							) : (
								"Presensi Pulang"
							)}
						</button>
					</>
				)}
			</div>
		</div>
	);
}
