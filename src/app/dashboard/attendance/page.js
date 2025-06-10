"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { AttendanceCamera } from "@/components/AttendanceCamera";
import SecureLocationMap from "@/components/SecureLocationMap";
import OptimizedPhotoDisplay from "@/components/OptimizedPhotoDisplay";
import moment from "moment";
import "moment/locale/id";
import {
	Clock,
	MapPin,
	Camera,
	CheckCircle,
	XCircle,
	Calendar,
	Shield,
	AlertTriangle,
	X,
} from "lucide-react";
import { useRealTime } from "@/hooks/useRealTime";

// Helper untuk format 2 digit
const padZero = (num) => {
	return num.toString().padStart(2, "0");
};

// Modal Component
const LocationModal = ({
	isOpen,
	onClose,
	onLocationVerified,
	onSecurityStatusChange,
}) => {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
				<div className="p-4 border-b flex items-center justify-between">
					<h3 className="text-lg font-semibold">
						Verifikasi Lokasi & Keamanan
					</h3>
					<button
						onClick={onClose}
						className="p-1 text-gray-400 hover:text-gray-600"
					>
						<X className="w-5 h-5" />
					</button>
				</div>
				<div className="p-4">
					<SecureLocationMap
						onLocationVerified={onLocationVerified}
						onSecurityStatusChange={onSecurityStatusChange}
					/>
				</div>
			</div>
		</div>
	);
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
	const cameraRef = useRef(null);
	const [todayAttendance, setTodayAttendance] = useState(null);
	const [isCheckingOut, setIsCheckingOut] = useState(false);
	const [jamPulang, setJamPulang] = useState(null);
	const [attendanceStatus, setAttendanceStatus] = useState({
		hasCheckedIn: false,
		hasCheckedOut: false,
		isCompleted: false,
	});
	const [mapPresensi, setMapPresensi] = useState(process.env.MAP_PRESENSI);
	const [securityStatus, setSecurityStatus] = useState({
		confidence: 0,
		warnings: [],
		isLocationSpoofed: false,
	});
	const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
	const [locationPermission, setLocationPermission] = useState("checking"); // checking, granted, denied, prompt

	// Check location permission on component mount
	useEffect(() => {
		checkLocationPermission();
	}, []);

	const checkLocationPermission = async () => {
		try {
			if (!navigator.geolocation) {
				setLocationPermission("denied");
				return;
			}

			// Try to get permission status if supported
			if (navigator.permissions) {
				try {
					const permission = await navigator.permissions.query({
						name: "geolocation",
					});
					setLocationPermission(permission.state);

					// Listen for permission changes
					permission.onchange = () => {
						setLocationPermission(permission.state);
					};
				} catch (error) {
					// Fallback: try to get current position to check permission
					navigator.geolocation.getCurrentPosition(
						() => setLocationPermission("granted"),
						(error) => {
							if (error.code === error.PERMISSION_DENIED) {
								setLocationPermission("denied");
							} else {
								setLocationPermission("prompt");
							}
						},
						{ timeout: 5000 }
					);
				}
			} else {
				// Fallback for browsers without permissions API
				navigator.geolocation.getCurrentPosition(
					() => setLocationPermission("granted"),
					(error) => {
						if (error.code === error.PERMISSION_DENIED) {
							setLocationPermission("denied");
						} else {
							setLocationPermission("prompt");
						}
					},
					{ timeout: 5000 }
				);
			}
		} catch (error) {
			console.error("Error checking location permission:", error);
			setLocationPermission("denied");
		}
	};

	const requestLocationPermission = async () => {
		try {
			const position = await new Promise((resolve, reject) => {
				navigator.geolocation.getCurrentPosition(resolve, reject, {
					enableHighAccuracy: true,
					timeout: 10000,
					maximumAge: 0,
				});
			});

			setLocationPermission("granted");
			setStatus("location_granted");

			// Auto close success message after 3 seconds
			setTimeout(() => {
				if (status === "location_granted") {
					setStatus(null);
				}
			}, 3000);
		} catch (error) {
			console.error("Error requesting location permission:", error);
			if (error.code === error.PERMISSION_DENIED) {
				setLocationPermission("denied");
				setStatus("location_denied");
			} else {
				setStatus("location_error");
			}

			// Auto close error message after 5 seconds
			setTimeout(() => {
				if (status === "location_denied" || status === "location_error") {
					setStatus(null);
				}
			}, 5000);
		}
	};

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

	const fetchAttendanceStatus = async () => {
		try {
			const response = await fetch("/api/attendance/status");
			const data = await response.json();
			if (data.data) {
				setAttendanceStatus(data.data);
				// Update todayAttendance dengan data terbaru
				if (data.data.attendance) {
					setTodayAttendance(data.data.attendance);
				}
			}
		} catch (error) {
			console.error("Error fetching attendance status:", error);
		}
	};

	useEffect(() => {
		fetchShift();
		fetchTodayAttendance();
		fetchAttendanceStatus();
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
		if (!isLocationValid || securityStatus.isLocationSpoofed) {
			if (securityStatus.isLocationSpoofed) {
				setStatus("security_error");
				setTimeout(() => {
					alertRef.current?.scrollIntoView({ behavior: "smooth" });
					alertRef.current?.focus();
				}, 100);
			}
			return;
		}

		// Check if camera is ready
		if (!cameraRef.current?.isReady()) {
			setStatus("camera_error");
			setTimeout(() => {
				alertRef.current?.scrollIntoView({ behavior: "smooth" });
				alertRef.current?.focus();
			}, 100);
			return;
		}

		setIsSubmitting(true);
		try {
			// Capture photo automatically
			const capturedPhoto = await cameraRef.current?.capturePhoto();
			if (!capturedPhoto) {
				throw new Error("Gagal mengambil foto");
			}

			// Debug logging
			console.log("Captured photo info:", {
				type: typeof capturedPhoto,
				length: capturedPhoto?.length,
				startsWith: capturedPhoto?.substring(0, 30),
			});

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
					photo: capturedPhoto,
					timestamp: momentInstance.format("YYYY-MM-DD HH:mm:ss"),
					latitude: position.coords.latitude.toString(),
					longitude: position.coords.longitude.toString(),
					isCheckingOut: false,
					securityData: {
						confidence: securityStatus.confidence,
						warnings: securityStatus.warnings,
						accuracy: position.coords.accuracy,
					},
				}),
			});

			if (!response.ok) throw new Error("Gagal melakukan presensi");

			const data = await response.json();
			setStatus("success");
			setPhoto(capturedPhoto); // Set photo for display

			// Update status presensi setelah berhasil checkin
			await fetchAttendanceStatus();
			await fetchTodayAttendance();

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
		if (securityStatus.isLocationSpoofed) {
			setStatus("security_error");
			setTimeout(() => {
				alertRef.current?.scrollIntoView({ behavior: "smooth" });
				alertRef.current?.focus();
			}, 100);
			return;
		}

		setIsSubmitting(true);
		try {
			// No photo required for checkout
			const capturedPhoto = null;

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
					photo: capturedPhoto,
					timestamp: momentInstance.format("YYYY-MM-DD HH:mm:ss"),
					latitude: position.coords.latitude.toString(),
					longitude: position.coords.longitude.toString(),
					isCheckingOut: true,
					securityData: {
						confidence: securityStatus.confidence,
						warnings: securityStatus.warnings,
						accuracy: position.coords.accuracy,
					},
				}),
			});

			if (!response.ok) throw new Error("Gagal melakukan presensi pulang");

			const data = await response.json();
			setStatus("success");

			// Update status presensi setelah berhasil checkout
			await fetchAttendanceStatus();

			// Refresh halaman setelah delay
			setTimeout(() => {
				window.location.reload();
			}, 2000);

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

	// Handler untuk perubahan status security dari SecureLocationMap
	const handleSecurityStatusChange = (newSecurityStatus) => {
		setSecurityStatus(newSecurityStatus);
	};

	// Check if form is ready for submission
	const isFormReady = () => {
		return (
			locationPermission === "granted" &&
			isLocationValid &&
			!securityStatus.isLocationSpoofed &&
			securityStatus.confidence >= 60 &&
			cameraRef.current?.isReady()
		);
	};

	// Get location button style based on security status
	const getLocationButtonStyle = () => {
		if (locationPermission !== "granted") {
			return "bg-gray-400 text-white cursor-not-allowed border-gray-400";
		}
		if (
			isLocationValid &&
			!securityStatus.isLocationSpoofed &&
			securityStatus.confidence >= 60
		) {
			return "bg-green-500 text-white hover:bg-green-600 border-green-500";
		} else {
			return "bg-red-500 text-white hover:bg-red-600 border-red-500";
		}
	};

	// Get location status text
	const getLocationStatusText = () => {
		if (locationPermission !== "granted") {
			return "Izin Lokasi Diperlukan";
		}
		if (
			isLocationValid &&
			!securityStatus.isLocationSpoofed &&
			securityStatus.confidence >= 60
		) {
			return "Lokasi Aman";
		} else {
			return "Lokasi Bermasalah";
		}
	};

	return (
		<div className="max-w-lg mx-auto space-y-6">
			<div className="bg-white p-6 rounded-lg shadow-sm">
				<h1 className="text-2xl font-semibold mb-6 text-center">Presensi</h1>

				{/* Status */}
				{status && (
					<div
						ref={alertRef}
						tabIndex={-1}
						className={`mb-6 p-4 rounded-lg ${
							status === "success"
								? "bg-green-50 text-green-700"
								: status === "security_error"
								? "bg-red-50 text-red-700"
								: status === "camera_error"
								? "bg-yellow-50 text-yellow-700"
								: status === "location_granted"
								? "bg-green-50 text-green-700"
								: status === "location_denied"
								? "bg-red-50 text-red-700"
								: status === "location_error"
								? "bg-yellow-50 text-yellow-700"
								: "bg-red-50 text-red-700"
						}`}
					>
						<div className="flex items-center gap-2">
							{status === "success" ? (
								<>
									<CheckCircle className="w-5 h-5" />
									<span>Presensi berhasil dicatat!</span>
								</>
							) : status === "security_error" ? (
								<>
									<Shield className="w-5 h-5" />
									<span>
										Presensi ditolak karena terdeteksi lokasi palsu atau tidak
										aman. Confidence level: {securityStatus.confidence}%
									</span>
								</>
							) : status === "camera_error" ? (
								<>
									<Camera className="w-5 h-5" />
									<span>
										Kamera belum siap. Pastikan kamera dapat diakses dan coba
										lagi.
									</span>
								</>
							) : status === "location_granted" ? (
								<>
									<CheckCircle className="w-5 h-5" />
									<span>
										Izin lokasi berhasil diberikan! Silakan lakukan verifikasi
										lokasi.
									</span>
								</>
							) : status === "location_denied" ? (
								<>
									<XCircle className="w-5 h-5" />
									<span>
										Izin lokasi ditolak. Silakan aktifkan lokasi di pengaturan
										browser dan refresh halaman ini.
									</span>
								</>
							) : status === "location_error" ? (
								<>
									<AlertTriangle className="w-5 h-5" />
									<span>
										Gagal mengakses lokasi. Pastikan GPS aktif dan koneksi
										internet stabil.
									</span>
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

				{/* Location Permission Request */}
				{locationPermission !== "granted" && (
					<div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
						<div className="flex items-start gap-3">
							<MapPin className="w-6 h-6 text-orange-600 mt-0.5 flex-shrink-0" />
							<div className="flex-1">
								<div className="font-medium text-orange-800 mb-2">
									Izin Lokasi Diperlukan
								</div>
								<p className="text-sm text-orange-700 mb-3">
									{locationPermission === "denied"
										? "Izin lokasi telah ditolak. Untuk melakukan presensi, silakan aktifkan lokasi di pengaturan browser Anda dan refresh halaman."
										: locationPermission === "checking"
										? "Memeriksa status izin lokasi..."
										: "Aplikasi memerlukan akses lokasi untuk memverifikasi kehadiran Anda. Klik tombol di bawah untuk memberikan izin."}
								</p>
								{locationPermission !== "denied" &&
									locationPermission !== "checking" && (
										<button
											onClick={requestLocationPermission}
											className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
											disabled={locationPermission === "checking"}
										>
											<MapPin className="w-4 h-4" />
											<span>Aktifkan Izin Lokasi</span>
										</button>
									)}
								{locationPermission === "denied" && (
									<button
										onClick={() => window.location.reload()}
										className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
									>
										<span>Refresh Halaman</span>
									</button>
								)}
							</div>
						</div>
					</div>
				)}

				{/* Security Warning */}
				{/* {securityStatus.warnings.length > 0 && (
					<div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
						<div className="flex items-start gap-2">
							<AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
							<div>
								<div className="font-medium text-yellow-800 mb-1">
									Peringatan Keamanan Lokasi:
								</div>
								<ul className="text-sm text-yellow-700 space-y-1">
									{securityStatus.warnings.map((warning, index) => (
										<li key={index}>• {warning}</li>
									))}
								</ul>
								<div className="mt-2 text-sm text-yellow-600">
									Confidence Level: {securityStatus.confidence}%
								</div>
							</div>
						</div>
					</div>
				)} */}

				{/* Data Presensi Hari Ini */}
				{(todayAttendance || attendanceStatus.checkout) && (
					<div className="mb-6 bg-blue-50 p-4 rounded-lg">
						<h2 className="text-lg font-semibold text-blue-800 mb-3">
							Data Presensi Hari Ini
						</h2>
						<div className="space-y-2">
							<div className="flex justify-between">
								<span className="text-blue-600">Jam Masuk:</span>
								<span className="font-medium">
									{formatTime(
										todayAttendance?.jam_datang ||
											attendanceStatus.checkout?.jam_datang
									)}
								</span>
							</div>
							{(attendanceStatus.isCompleted ||
								attendanceStatus.checkout?.jam_pulang) && (
								<div className="flex justify-between">
									<span className="text-blue-600">Jam Pulang:</span>
									<span className="font-medium">
										{formatTime(attendanceStatus.checkout.jam_pulang)}
									</span>
								</div>
							)}
							{attendanceStatus.isCompleted &&
								attendanceStatus.checkout?.durasi && (
									<div className="flex justify-between">
										<span className="text-blue-600">Durasi Kerja:</span>
										<span className="font-medium">
											{attendanceStatus.checkout.durasi}
										</span>
									</div>
								)}
							<div className="flex justify-between">
								<span className="text-blue-600">Status:</span>
								<span className="font-medium">
									{attendanceStatus.isCompleted
										? attendanceStatus.checkout?.status || "Selesai"
										: todayAttendance?.status}
								</span>
							</div>
							{(todayAttendance?.photo || attendanceStatus.checkout?.photo) && (
								<div className="mt-4">
									<span className="text-blue-600 block mb-2 text-center">
										Foto Presensi Masuk
									</span>
									<div className="flex justify-center">
										<OptimizedPhotoDisplay
											photoUrl={
												todayAttendance?.photo ||
												attendanceStatus.checkout?.photo
											}
											alt="Foto Presensi Masuk"
											width={200}
											height={200}
											priority={false}
											lazy={true}
										/>
									</div>
								</div>
							)}
							{attendanceStatus.isCompleted && (
								<div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
									<div className="flex items-center gap-2 text-green-700">
										<CheckCircle className="w-5 h-5" />
										<span className="font-medium">
											Presensi Hari Ini Telah Selesai
										</span>
									</div>
									<p className="text-sm text-green-600 mt-1">
										Anda telah menyelesaikan presensi masuk dan pulang untuk
										hari ini.
									</p>
								</div>
							)}
						</div>
					</div>
				)}

				{/* Form Presensi Masuk - Hanya tampilkan jika belum presensi dan belum selesai */}
				{!todayAttendance && !attendanceStatus.isCompleted && (
					<>
						{/* Waktu dan Tanggal */}
						<div className="mb-6 bg-gray-50 p-4 rounded-lg">
							<div className="flex items-center gap-4 mb-3">
								<div className="flex items-center gap-2 text-gray-600 text-sm">
									<Calendar className="w-5 h-5" />
									<span>Tanggal</span>
								</div>
								<div className="text-gray-900 font-medium">{formattedDate}</div>
							</div>
							<div className="flex items-center gap-4">
								<div className="flex items-center gap-2 text-gray-600 text-sm">
									<Clock className="w-5 h-5" />
									<span>Shift</span>
								</div>
								<div className="text-gray-900 font-medium">
									{shift ? shift : "Belum ada shift"}
								</div>
							</div>
						</div>

						{/* Foto */}
						<div className="mb-6">
							<div className="flex items-center gap-2 text-gray-600 mb-2">
								<Camera className="w-5 h-5" />
								<span>Kamera Live</span>
							</div>
							<AttendanceCamera ref={cameraRef} onCapture={setPhoto} />
							<p className="text-xs text-gray-500 mt-2 text-center">
								Foto akan diambil otomatis saat tombol presensi masuk ditekan
							</p>
						</div>

						{/* Tombol Lokasi */}
						<div className="mb-6">
							<div className="flex items-center gap-2 text-gray-600 mb-2">
								<MapPin className="w-5 h-5" />
								<span>Verifikasi Lokasi</span>
							</div>
							<button
								onClick={() =>
									locationPermission === "granted" &&
									setIsLocationModalOpen(true)
								}
								disabled={locationPermission !== "granted"}
								className={`w-full py-3 px-4 rounded-lg font-medium transition-all border-2 flex items-center justify-center gap-2 ${getLocationButtonStyle()}`}
							>
								<MapPin className="w-5 h-5" />
								<span>{getLocationStatusText()}</span>
								{locationPermission === "granted" ? (
									isLocationValid &&
									!securityStatus.isLocationSpoofed &&
									securityStatus.confidence >= 60 ? (
										<CheckCircle className="w-5 h-5" />
									) : (
										<XCircle className="w-5 h-5" />
									)
								) : (
									<AlertTriangle className="w-5 h-5" />
								)}
							</button>
							<p className="text-xs text-gray-500 mt-1 text-center">
								{locationPermission === "granted"
									? "Klik untuk verifikasi lokasi dan keamanan"
									: "Aktifkan izin lokasi terlebih dahulu"}
							</p>
						</div>

						{/* Tombol Presensi Masuk */}
						<button
							onClick={handleCheckIn}
							disabled={!isFormReady() || isSubmitting}
							className={`w-full py-3 rounded-lg font-medium transition-all ${
								!isFormReady() || isSubmitting
									? "bg-gray-100 text-gray-400 cursor-not-allowed"
									: "bg-blue-500 text-white hover:bg-blue-600"
							}`}
						>
							{isSubmitting ? (
								<div className="flex items-center justify-center gap-2">
									<div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
									<span>Memproses...</span>
								</div>
							) : !isFormReady() ? (
								<div className="flex items-center justify-center gap-2">
									<Shield className="w-5 h-5" />
									<span>
										{locationPermission !== "granted"
											? "Izin lokasi diperlukan"
											: !isLocationValid
											? "Lokasi tidak valid"
											: securityStatus.isLocationSpoofed
											? "Lokasi terdeteksi palsu"
											: securityStatus.confidence < 60
											? "Confidence level terlalu rendah"
											: !cameraRef.current?.isReady()
											? "Kamera belum siap"
											: "Persyaratan belum terpenuhi"}
									</span>
								</div>
							) : (
								<div className="flex items-center justify-center gap-2">
									<Camera className="w-5 h-5" />
									<span>Ambil Foto & Presensi Masuk</span>
								</div>
							)}
						</button>
					</>
				)}

				{/* Form Presensi Pulang - Hanya tampilkan jika sudah presensi masuk tapi belum pulang dan belum selesai */}
				{todayAttendance && !attendanceStatus.isCompleted && (
					<>
						{/* Info Presensi Pulang - Tanpa Kamera */}
						<div className="mb-6 bg-orange-50 p-4 rounded-lg">
							<div className="flex items-center gap-2 text-orange-700 mb-2">
								<Clock className="w-5 h-5" />
								<span className="font-medium">Presensi Pulang</span>
							</div>
							<p className="text-sm text-orange-600">
								Presensi pulang tidak memerlukan foto. Cukup verifikasi lokasi
								dan klik tombol presensi pulang.
							</p>
						</div>

						{/* Tombol Lokasi untuk Checkout */}
						<div className="mb-6">
							<div className="flex items-center gap-2 text-gray-600 mb-2">
								<MapPin className="w-5 h-5" />
								<span>Verifikasi Lokasi Pulang</span>
							</div>
							<button
								onClick={() => setIsLocationModalOpen(true)}
								className={`w-full py-3 px-4 rounded-lg font-medium transition-all border-2 flex items-center justify-center gap-2 ${getLocationButtonStyle()}`}
							>
								<MapPin className="w-5 h-5" />
								<span>{getLocationStatusText()}</span>
								{isLocationValid &&
								!securityStatus.isLocationSpoofed &&
								securityStatus.confidence >= 60 ? (
									<CheckCircle className="w-5 h-5" />
								) : (
									<XCircle className="w-5 h-5" />
								)}
							</button>
							<p className="text-xs text-gray-500 mt-1 text-center">
								Klik untuk verifikasi lokasi dan keamanan
							</p>
						</div>

						{/* Tombol Presensi Pulang */}
						<button
							onClick={handleCheckOut}
							disabled={
								!isCheckingOut ||
								!isLocationValid ||
								securityStatus.isLocationSpoofed ||
								securityStatus.confidence < 60
							}
							className={`w-full py-3 rounded-lg font-medium transition-all ${
								!isCheckingOut ||
								!isLocationValid ||
								securityStatus.isLocationSpoofed ||
								securityStatus.confidence < 60
									? "bg-gray-100 text-gray-400 cursor-not-allowed"
									: "bg-orange-500 text-white hover:bg-orange-600"
							}`}
						>
							{isSubmitting ? (
								<div className="flex items-center justify-center gap-2">
									<div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
									<span>Memproses...</span>
								</div>
							) : !isCheckingOut ? (
								"Belum waktunya pulang"
							) : !isLocationValid ? (
								"Lokasi tidak valid"
							) : securityStatus.isLocationSpoofed ? (
								"Lokasi terdeteksi palsu"
							) : securityStatus.confidence < 60 ? (
								"Confidence level terlalu rendah"
							) : (
								<div className="flex items-center justify-center gap-2">
									<Clock className="w-5 h-5" />
									<span>Presensi Pulang</span>
								</div>
							)}
						</button>
					</>
				)}

				{/* Location Modal */}
				<LocationModal
					isOpen={isLocationModalOpen}
					onClose={() => setIsLocationModalOpen(false)}
					onLocationVerified={setIsLocationValid}
					onSecurityStatusChange={handleSecurityStatusChange}
				/>
			</div>
		</div>
	);
}
