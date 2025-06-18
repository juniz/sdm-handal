"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { AttendanceCamera } from "@/components/AttendanceCamera";
import SecureLocationMap from "@/components/SecureLocationMap";
import OptimizedPhotoDisplay from "@/components/OptimizedPhotoDisplay";
import { useErrorLogger } from "@/hooks/useErrorLogger";
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
	const [locationPermission, setLocationPermission] = useState("checking"); // checking, granted, denied, prompt
	const [locationValidationEnabled, setLocationValidationEnabled] = useState(
		true
	);
	const [unfinishedAttendance, setUnfinishedAttendance] = useState(null);
	const [showUnfinishedAlert, setShowUnfinishedAlert] = useState(false);

	// Error logging
	const { logError } = useErrorLogger();

	// Check location permission and settings on component mount
	useEffect(() => {
		checkLocationPermission();
		fetchLocationSettings();
	}, []);

	const fetchLocationSettings = async () => {
		try {
			const response = await fetch("/api/attendance/location-settings");
			const data = await response.json();
			if (data.data) {
				setLocationValidationEnabled(data.data.isLocationValidationEnabled);
			}
		} catch (error) {
			console.error("Error fetching location settings:", error);
			// Default ke enabled jika gagal
			setLocationValidationEnabled(true);
		}
	};

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

	const fetchUnfinishedAttendance = async () => {
		try {
			const response = await fetch("/api/attendance/unfinished");
			const data = await response.json();
			if (data.has_unfinished) {
				setUnfinishedAttendance(data.data);
				setShowUnfinishedAlert(true);
			} else {
				setUnfinishedAttendance(null);
				setShowUnfinishedAlert(false);
			}
		} catch (error) {
			console.error("Error fetching unfinished attendance:", error);
		}
	};

	const handleAutoCheckout = async () => {
		try {
			setIsSubmitting(true);
			const response = await fetch("/api/attendance/auto-checkout", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
			});

			const data = await response.json();

			if (response.ok) {
				setStatus("success");
				setUnfinishedAttendance(null);
				setShowUnfinishedAlert(false);

				// Refresh data
				await fetchAttendanceStatus();
				await fetchTodayAttendance();
				await fetchUnfinishedAttendance();

				// Scroll ke alert
				setTimeout(() => {
					alertRef.current?.scrollIntoView({ behavior: "smooth" });
					alertRef.current?.focus();
				}, 100);
			} else {
				setStatus("error");
				console.error("Auto checkout failed:", data);
			}
		} catch (error) {
			console.error("Error in auto checkout:", error);
			setStatus("error");
		} finally {
			setIsSubmitting(false);
		}
	};

	const dismissUnfinishedAlert = () => {
		setShowUnfinishedAlert(false);
	};

	useEffect(() => {
		fetchShift();
		fetchTodayAttendance();
		fetchAttendanceStatus();
		fetchUnfinishedAttendance();
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
		// Hanya lakukan validasi lokasi jika diaktifkan
		if (
			locationValidationEnabled &&
			(!isLocationValid || securityStatus.isLocationSpoofed)
		) {
			if (securityStatus.isLocationSpoofed) {
				await logError({
					error: "Location spoofing detected",
					errorType: "SecurityError",
					componentName: "AttendancePage",
					actionAttempted: "Check-in with location verification",
					severity: "HIGH",
					additionalData: {
						securityStatus,
						isLocationValid,
					},
				});
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
			await logError({
				error: "Camera not ready when attempting check-in",
				errorType: "CameraError",
				componentName: "AttendancePage",
				actionAttempted: "Pre-flight check for attendance",
				severity: "MEDIUM",
			});
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
				const error = new Error("Gagal mengambil foto");
				await logError({
					error,
					errorType: "PhotoCaptureError",
					componentName: "AttendancePage",
					actionAttempted: "Capturing photo for check-in",
					severity: "HIGH",
				});
				throw error;
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

			if (!response.ok) {
				let errorData;
				try {
					errorData = await response.json();
				} catch (jsonError) {
					// Jika response bukan JSON, gunakan text
					errorData = { error: "UNKNOWN", message: await response.text() };
				}

				// Handle specific error for unfinished attendance
				if (errorData.error === "UNFINISHED_ATTENDANCE") {
					// Refresh unfinished attendance data
					await fetchUnfinishedAttendance();
					setStatus("unfinished_attendance");
					setTimeout(() => {
						alertRef.current?.scrollIntoView({ behavior: "smooth" });
						alertRef.current?.focus();
					}, 100);
					return;
				}

				const error = new Error(`Gagal melakukan presensi: ${response.status}`);
				await logError({
					error,
					errorType: "AttendanceSubmissionError",
					componentName: "AttendancePage",
					actionAttempted: "Submitting check-in data to API",
					severity: "HIGH",
					additionalData: {
						responseStatus: response.status,
						errorData: errorData,
						hasPhoto: !!capturedPhoto,
						securityStatus,
					},
				});
				throw error;
			}

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

			// Log error if not already logged
			if (
				!error.message.includes("Gagal mengambil foto") &&
				!error.message.includes("Gagal melakukan presensi")
			) {
				await logError({
					error,
					errorType: "UnexpectedCheckInError",
					componentName: "AttendancePage",
					actionAttempted: "Check-in process",
					severity: "HIGH",
					additionalData: {
						step: "unknown",
						securityStatus,
						isLocationValid,
					},
				});
			}

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
		// Hanya lakukan validasi lokasi jika diaktifkan
		if (locationValidationEnabled && securityStatus.isLocationSpoofed) {
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
		const baseRequirements =
			locationPermission === "granted" && cameraRef.current?.isReady();

		// Jika validasi lokasi diaktifkan, tambahkan syarat lokasi
		const locationRequirements = locationValidationEnabled
			? isLocationValid &&
			  !securityStatus.isLocationSpoofed &&
			  securityStatus.confidence >= 60
			: true; // Jika disabled, lokasi selalu dianggap valid

		return baseRequirements && locationRequirements;
	};

	return (
		<div className="max-w-lg mx-auto space-y-6 pb-32">
			<div className="bg-white p-2 rounded-lg shadow-sm">
				<h1 className="text-2xl font-semibold mb-6 text-center">Presensi</h1>

				{/* Unfinished Attendance Alert */}
				{showUnfinishedAlert && unfinishedAttendance && (
					<div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
						<div className="flex items-start gap-3">
							<AlertTriangle className="w-6 h-6 text-orange-600 mt-0.5 flex-shrink-0" />
							<div className="flex-1">
								<div className="font-medium text-orange-800 mb-2">
									Presensi Sebelumnya Belum Selesai
								</div>
								<div className="text-sm text-orange-700 space-y-1">
									<p>
										<strong>Tanggal:</strong>{" "}
										{unfinishedAttendance.status_info?.work_date}
									</p>
									<p>
										<strong>Jam Masuk:</strong>{" "}
										{unfinishedAttendance.status_info?.jam_datang_formatted}
									</p>
									<p>
										<strong>Shift:</strong>{" "}
										{unfinishedAttendance.status_info?.shift_info}
									</p>
									<p>
										<strong>Durasi Kerja:</strong>{" "}
										{unfinishedAttendance.current_duration}
									</p>
									{unfinishedAttendance.time_info && (
										<p>
											<strong>Status:</strong>{" "}
											{unfinishedAttendance.time_info.formatted}
										</p>
									)}
								</div>
								<div className="mt-3 flex flex-wrap gap-2">
									{unfinishedAttendance.can_auto_checkout ? (
										<button
											onClick={handleAutoCheckout}
											disabled={isSubmitting}
											className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2 text-sm"
										>
											{isSubmitting ? (
												<>
													<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
													<span>Memproses...</span>
												</>
											) : (
												<>
													<Clock className="w-4 h-4" />
													<span>Pulang</span>
												</>
											)}
										</button>
									) : (
										<div className="text-xs text-orange-600 bg-orange-100 px-3 py-1 rounded">
											Belum bisa pulang
										</div>
									)}
									<button
										onClick={dismissUnfinishedAlert}
										className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2 text-sm"
									>
										<X className="w-4 h-4" />
										<span>Tutup</span>
									</button>
								</div>
							</div>
						</div>
					</div>
				)}

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
								: status === "unfinished_attendance"
								? "bg-orange-50 text-orange-700"
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
							) : status === "unfinished_attendance" ? (
								<>
									<AlertTriangle className="w-5 h-5" />
									<span>
										Anda masih memiliki presensi sebelumnya yang belum
										di-checkout. Silakan selesaikan presensi tersebut terlebih
										dahulu atau gunakan tombol Auto Checkout jika sudah melewati
										batas waktu.
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
												todayAttendance?.photo + "?timestamp=" + Date.now() ||
												attendanceStatus.checkout?.photo +
													"?timestamp=" +
													Date.now()
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

						{/* Verifikasi Lokasi Otomatis - Hanya tampilkan jika validasi diaktifkan */}
						{locationValidationEnabled && (
							<div className="mb-6">
								<div className="flex items-center gap-2 text-gray-600 mb-2">
									<MapPin className="w-5 h-5" />
									<span>Status Lokasi</span>
									{locationPermission === "granted" && (
										<div className="flex items-center gap-1">
											<div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
											<span className="text-xs text-green-600">Memantau</span>
										</div>
									)}
								</div>

								{/* Status Card */}
								<div
									className={`w-full py-3 px-4 rounded-lg border-2 flex items-center justify-between transition-all ${
										locationPermission !== "granted"
											? "bg-gray-50 border-gray-300"
											: !locationValidationEnabled
											? "bg-blue-50 border-blue-300" // Status biru jika validasi disabled
											: isLocationValid &&
											  !securityStatus.isLocationSpoofed &&
											  securityStatus.confidence >= 60
											? "bg-green-50 border-green-300"
											: "bg-red-50 border-red-300"
									}`}
								>
									<div className="flex items-center gap-3">
										<MapPin className="w-5 h-5" />
										<div>
											<span className="font-medium">
												{locationPermission !== "granted"
													? "Izin Lokasi Diperlukan"
													: !locationValidationEnabled
													? "Lokasi Dicatat (Validasi Nonaktif)"
													: isLocationValid &&
													  !securityStatus.isLocationSpoofed &&
													  securityStatus.confidence >= 60
													? "Lokasi Aman"
													: "Lokasi Bermasalah"}
											</span>
											{locationPermission === "granted" && (
												<div className="text-xs text-gray-600 mt-1">
													{!locationValidationEnabled && (
														<span className="text-blue-600">
															Validasi lokasi dinonaktifkan
														</span>
													)}
													{locationValidationEnabled &&
														securityStatus.confidence > 0 && (
															<span>
																Confidence: {securityStatus.confidence}%
															</span>
														)}
													{locationValidationEnabled &&
														securityStatus.warnings.length > 0 && (
															<span className="text-red-600 ml-2">
																⚠ {securityStatus.warnings.length} peringatan
															</span>
														)}
												</div>
											)}
										</div>
									</div>
									<div className="flex items-center gap-2">
										{locationPermission === "granted" ? (
											!locationValidationEnabled ? (
												<CheckCircle className="w-6 h-6 text-blue-600" />
											) : isLocationValid &&
											  !securityStatus.isLocationSpoofed &&
											  securityStatus.confidence >= 60 ? (
												<CheckCircle className="w-6 h-6 text-green-600" />
											) : (
												<XCircle className="w-6 h-6 text-red-600" />
											)
										) : (
											<AlertTriangle className="w-6 h-6 text-gray-400" />
										)}
									</div>
								</div>

								{/* Security Warnings - hanya tampilkan jika validasi diaktifkan */}
								{locationValidationEnabled &&
									securityStatus.warnings.length > 0 && (
										<div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
											<div className="flex items-start gap-2">
												<AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
												<div>
													<div className="font-medium text-yellow-800 text-sm mb-1">
														Peringatan Keamanan:
													</div>
													<ul className="text-xs text-yellow-700 space-y-1">
														{securityStatus.warnings.map((warning, index) => (
															<li key={index}>• {warning}</li>
														))}
													</ul>
												</div>
											</div>
										</div>
									)}

								<p className="text-xs text-gray-500 mt-2 text-center">
									{locationPermission === "granted"
										? !locationValidationEnabled
											? "Lokasi dicatat untuk pencatatan (validasi nonaktif)"
											: "Lokasi dipantau secara otomatis untuk keamanan"
										: "Aktifkan izin lokasi untuk verifikasi otomatis"}
								</p>
							</div>
						)}

						{/* Hidden Auto Location Verification Component */}
						{locationPermission === "granted" && (
							<div className="hidden">
								<SecureLocationMap
									onLocationVerified={setIsLocationValid}
									onSecurityStatusChange={handleSecurityStatusChange}
								/>
							</div>
						)}

						{/* Status Kesiapan Presensi */}
						<div
							className={`w-full py-3 px-4 rounded-lg border-2 text-center ${
								!isFormReady()
									? "bg-yellow-50 border-yellow-300 text-yellow-700"
									: "bg-green-50 border-green-300 text-green-700"
							}`}
						>
							<div className="flex items-center justify-center gap-2">
								{!isFormReady() ? (
									<>
										<AlertTriangle className="w-5 h-5" />
										<span className="font-medium">
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
									</>
								) : (
									<>
										<CheckCircle className="w-5 h-5" />
										<span className="font-medium">
											Siap untuk presensi masuk
										</span>
									</>
								)}
							</div>
						</div>
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
								Presensi pulang tidak memerlukan foto. Lokasi akan dipantau
								secara otomatis.
							</p>
						</div>

						{/* Status Lokasi untuk Checkout - Otomatis - Hanya tampilkan jika validasi diaktifkan */}
						{locationValidationEnabled && (
							<div className="mb-6">
								<div className="flex items-center gap-2 text-gray-600 mb-2">
									<MapPin className="w-5 h-5" />
									<span>Status Lokasi Pulang</span>
									<div className="flex items-center gap-1">
										<div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
										<span className="text-xs text-green-600">Memantau</span>
									</div>
								</div>

								{/* Status Card untuk Checkout */}
								<div
									className={`w-full py-3 px-4 rounded-lg border-2 flex items-center justify-between transition-all ${
										!locationValidationEnabled
											? "bg-blue-50 border-blue-300" // Status biru jika validasi disabled
											: isLocationValid &&
											  !securityStatus.isLocationSpoofed &&
											  securityStatus.confidence >= 60
											? "bg-green-50 border-green-300"
											: "bg-red-50 border-red-300"
									}`}
								>
									<div className="flex items-center gap-3">
										<MapPin className="w-5 h-5" />
										<div>
											<span className="font-medium">
												{!locationValidationEnabled
													? "Lokasi Dicatat (Validasi Nonaktif)"
													: isLocationValid &&
													  !securityStatus.isLocationSpoofed &&
													  securityStatus.confidence >= 60
													? "Lokasi Aman untuk Pulang"
													: "Lokasi Bermasalah"}
											</span>
											<div className="text-xs text-gray-600 mt-1">
												{!locationValidationEnabled && (
													<span className="text-blue-600">
														Validasi lokasi dinonaktifkan
													</span>
												)}
												{locationValidationEnabled &&
													securityStatus.confidence > 0 && (
														<span>
															Confidence: {securityStatus.confidence}%
														</span>
													)}
												{locationValidationEnabled &&
													securityStatus.warnings.length > 0 && (
														<span className="text-red-600 ml-2">
															⚠ {securityStatus.warnings.length} peringatan
														</span>
													)}
											</div>
										</div>
									</div>
									<div className="flex items-center gap-2">
										{!locationValidationEnabled ? (
											<CheckCircle className="w-6 h-6 text-blue-600" />
										) : isLocationValid &&
										  !securityStatus.isLocationSpoofed &&
										  securityStatus.confidence >= 60 ? (
											<CheckCircle className="w-6 h-6 text-green-600" />
										) : (
											<XCircle className="w-6 h-6 text-red-600" />
										)}
									</div>
								</div>

								{/* Security Warnings untuk Checkout - hanya tampilkan jika validasi diaktifkan */}
								{locationValidationEnabled &&
									securityStatus.warnings.length > 0 && (
										<div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
											<div className="flex items-start gap-2">
												<AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
												<div>
													<div className="font-medium text-yellow-800 text-sm mb-1">
														Peringatan Keamanan:
													</div>
													<ul className="text-xs text-yellow-700 space-y-1">
														{securityStatus.warnings.map((warning, index) => (
															<li key={index}>• {warning}</li>
														))}
													</ul>
												</div>
											</div>
										</div>
									)}

								<p className="text-xs text-gray-500 mt-2 text-center">
									{!locationValidationEnabled
										? "Lokasi dicatat untuk pencatatan (validasi nonaktif)"
										: "Lokasi dipantau secara otomatis untuk keamanan"}
								</p>
							</div>
						)}

						{/* Hidden Auto Location Verification Component untuk Checkout */}
						<div className="hidden">
							<SecureLocationMap
								onLocationVerified={setIsLocationValid}
								onSecurityStatusChange={handleSecurityStatusChange}
							/>
						</div>

						{/* Status Kesiapan Presensi Pulang */}
						<div
							className={`w-full py-3 px-4 rounded-lg border-2 text-center ${
								!isCheckingOut ||
								(locationValidationEnabled &&
									(!isLocationValid ||
										securityStatus.isLocationSpoofed ||
										securityStatus.confidence < 60))
									? "bg-yellow-50 border-yellow-300 text-yellow-700"
									: "bg-green-50 border-green-300 text-green-700"
							}`}
						>
							<div className="flex items-center justify-center gap-2">
								{!isCheckingOut ? (
									<>
										<Clock className="w-5 h-5" />
										<span className="font-medium">Belum waktunya pulang</span>
									</>
								) : locationValidationEnabled && !isLocationValid ? (
									<>
										<MapPin className="w-5 h-5" />
										<span className="font-medium">Lokasi tidak valid</span>
									</>
								) : locationValidationEnabled &&
								  securityStatus.isLocationSpoofed ? (
									<>
										<Shield className="w-5 h-5" />
										<span className="font-medium">Lokasi terdeteksi palsu</span>
									</>
								) : locationValidationEnabled &&
								  securityStatus.confidence < 60 ? (
									<>
										<AlertTriangle className="w-5 h-5" />
										<span className="font-medium">
											Confidence level terlalu rendah
										</span>
									</>
								) : (
									<>
										<CheckCircle className="w-5 h-5" />
										<span className="font-medium">
											Siap untuk presensi pulang
										</span>
									</>
								)}
							</div>
						</div>
					</>
				)}
			</div>

			{/* Sticky Button Container */}
			<div className="fixed bottom-25 left-0 right-0 p-3 mx-3 shadow-lg z-40 rounded-t-lg">
				<div className="max-w-lg mx-auto">
					{/* Tombol Presensi Masuk - Sticky */}
					{!todayAttendance && !attendanceStatus.isCompleted && (
						<button
							onClick={handleCheckIn}
							disabled={!isFormReady() || isSubmitting}
							className={`w-full py-3 rounded-lg font-medium text-base transition-all shadow-md ${
								!isFormReady() || isSubmitting
									? "bg-gray-100 text-gray-400 cursor-not-allowed"
									: "bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700"
							}`}
						>
							{isSubmitting ? (
								<div className="flex items-center justify-center gap-2">
									<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
									<span>Memproses...</span>
								</div>
							) : !isFormReady() ? (
								<div className="flex items-center justify-center gap-2">
									<Shield className="w-4 h-4" />
									<span className="text-sm">
										{locationPermission !== "granted"
											? "Izin Lokasi Diperlukan"
											: !isLocationValid
											? "Lokasi Tidak Valid"
											: securityStatus.isLocationSpoofed
											? "Lokasi Terdeteksi Palsu"
											: securityStatus.confidence < 60
											? "Confidence Level Rendah"
											: !cameraRef.current?.isReady()
											? "Kamera Belum Siap"
											: "Persyaratan Belum Terpenuhi"}
									</span>
								</div>
							) : (
								<div className="flex items-center justify-center gap-2">
									<Camera className="w-5 h-5" />
									<span>Presensi Masuk</span>
								</div>
							)}
						</button>
					)}

					{/* Tombol Presensi Pulang - Sticky */}
					{todayAttendance && !attendanceStatus.isCompleted && (
						<button
							onClick={handleCheckOut}
							disabled={
								!isCheckingOut ||
								(locationValidationEnabled &&
									(!isLocationValid ||
										securityStatus.isLocationSpoofed ||
										securityStatus.confidence < 60)) ||
								isSubmitting
							}
							className={`w-full py-3 rounded-lg font-medium text-base transition-all shadow-md ${
								!isCheckingOut ||
								(locationValidationEnabled &&
									(!isLocationValid ||
										securityStatus.isLocationSpoofed ||
										securityStatus.confidence < 60)) ||
								isSubmitting
									? "bg-gray-100 text-gray-400 cursor-not-allowed"
									: "bg-orange-500 text-white hover:bg-orange-600 active:bg-orange-700"
							}`}
						>
							{isSubmitting ? (
								<div className="flex items-center justify-center gap-2">
									<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
									<span>Memproses...</span>
								</div>
							) : !isCheckingOut ? (
								<div className="flex items-center justify-center gap-2">
									<Clock className="w-5 h-5" />
									<span>Belum Waktunya Pulang</span>
								</div>
							) : locationValidationEnabled && !isLocationValid ? (
								<div className="flex items-center justify-center gap-2">
									<MapPin className="w-5 h-5" />
									<span className="text-sm">Lokasi Tidak Valid</span>
								</div>
							) : locationValidationEnabled &&
							  securityStatus.isLocationSpoofed ? (
								<div className="flex items-center justify-center gap-2">
									<Shield className="w-5 h-5" />
									<span className="text-sm">Lokasi Terdeteksi Palsu</span>
								</div>
							) : locationValidationEnabled &&
							  securityStatus.confidence < 60 ? (
								<div className="flex items-center justify-center gap-2">
									<AlertTriangle className="w-5 h-5" />
									<span className="text-sm">Confidence Level Rendah</span>
								</div>
							) : (
								<div className="flex items-center justify-center gap-2">
									<Clock className="w-5 h-5" />
									<span>Presensi Pulang</span>
								</div>
							)}
						</button>
					)}

					{/* Status Selesai */}
					{attendanceStatus.isCompleted && (
						<div className="w-full py-3 bg-green-50 border-2 border-green-200 rounded-lg">
							<div className="flex items-center justify-center gap-2 text-green-700">
								<CheckCircle className="w-5 h-5" />
								<span className="font-medium">Presensi Selesai</span>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
