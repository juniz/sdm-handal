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
	Loader2,
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
	const [completedAttendance, setCompletedAttendance] = useState(null);

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
			const timestamp = new Date().getTime();
			const response = await fetch(`/api/attendance/today?t=${timestamp}`, {
				cache: "no-cache",
				headers: {
					"Cache-Control": "no-cache",
					Pragma: "no-cache",
				},
			});
			const data = await response.json();

			if (data.data) {
				setTodayAttendance(data.data);
				setJamPulang(data.jam_pulang);
			} else {
				// Jika tidak ada presensi aktif, reset state
				setTodayAttendance(null);
				setJamPulang(null);
			}
		} catch (error) {
			console.error("Error fetching today attendance:", error);
			setTodayAttendance(null);
			setJamPulang(null);
		}
	};

	const fetchCompletedAttendance = async () => {
		try {
			const timestamp = new Date().getTime();
			const response = await fetch(`/api/attendance/completed?t=${timestamp}`, {
				cache: "no-cache",
				headers: {
					"Cache-Control": "no-cache",
					Pragma: "no-cache",
				},
			});
			const data = await response.json();

			if (data.data) {
				setCompletedAttendance(data.data);
			} else {
				setCompletedAttendance(null);
			}
		} catch (error) {
			console.error("Error fetching completed attendance:", error);
			setCompletedAttendance(null);
		}
	};

	const fetchAttendanceStatus = async () => {
		try {
			const timestamp = new Date().getTime();
			const response = await fetch(`/api/attendance/status?t=${timestamp}`, {
				cache: "no-cache",
				headers: {
					"Cache-Control": "no-cache",
					Pragma: "no-cache",
				},
			});
			const data = await response.json();

			if (data.data) {
				setAttendanceStatus(data.data);
				// PERBAIKAN: Jangan update todayAttendance dari status API
				// karena bisa menyebabkan konflik dengan data dari /today API
				// Status API hanya untuk mendapatkan informasi status, bukan data attendance
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
				await fetchCompletedAttendance();
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
		// PERBAIKAN: Clear state terlebih dahulu saat component mount
		// untuk memastikan tidak ada data lama yang tertinggal
		setTodayAttendance(null);
		setCompletedAttendance(null);
		setAttendanceStatus({
			hasCheckedIn: false,
			hasCheckedOut: false,
			isCompleted: false,
		});
		setUnfinishedAttendance(null);
		setShowUnfinishedAlert(false);
		setJamPulang(null);

		// Kemudian fetch data fresh
		const fetchAllData = async () => {
			await fetchShift();
			await fetchTodayAttendance();
			await fetchCompletedAttendance();
			await fetchAttendanceStatus();
			await fetchUnfinishedAttendance();
		};

		fetchAllData();
	}, []);

	// Auto-clear state jika semua API mengembalikan null (tidak ada data)
	useEffect(() => {
		// Jika semua data API mengembalikan null, pastikan state juga null
		if (
			!todayAttendance &&
			!completedAttendance &&
			!attendanceStatus.isCompleted
		) {
			// Auto-clear state jika tidak ada data
			// Pastikan state benar-benar null
			if (todayAttendance !== null) setTodayAttendance(null);
			if (completedAttendance !== null) setCompletedAttendance(null);
			if (jamPulang !== null) setJamPulang(null);
		}
	}, [
		todayAttendance,
		completedAttendance,
		attendanceStatus.isCompleted,
		jamPulang,
	]);

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

				// Handle specific error for no schedule
				if (errorData.error === "NO_SCHEDULE") {
					setStatus("no_schedule");
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
			await fetchCompletedAttendance();

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
		<div className="max-w-lg mx-auto space-y-6 pb-44 px-4 md:px-0 font-sans">
			{/* Header */}
			<div className="flex flex-col mb-4 pt-6">
				<h1 className="text-2xl font-bold tracking-tight text-slate-800 font-figtree">Presensi</h1>
				<p className="text-xs text-slate-500">Pencatatan kehadiran harian pegawai RS Bhayangkara</p>
			</div>

			{/* Status Strip / Info */}
			<div className="flex flex-wrap items-center gap-2">
				<div className="flex items-center gap-1.5 bg-slate-100/80 text-slate-700 px-3 py-1.5 rounded-full text-xs font-semibold">
					<Calendar className="w-3.5 h-3.5 text-slate-500" />
					<span>{formattedDate}</span>
				</div>
				<div className="flex items-center gap-1.5 bg-slate-100/80 text-slate-700 px-3 py-1.5 rounded-full text-xs font-semibold">
					<Clock className="w-3.5 h-3.5 text-slate-500" />
					<span>Shift: {shift || "Tidak ada shift"}</span>
				</div>
				<div className="flex items-center gap-1.5 bg-primary-50 text-primary-700 px-3 py-1.5 rounded-full text-xs font-bold border border-primary-100">
					<Clock className="w-3.5 h-3.5 text-primary-600 animate-pulse" />
					<span>{formattedTime}</span>
				</div>

				{/* Location status pill */}
				{locationValidationEnabled && (
					<div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
						locationPermission !== "granted"
							? "bg-slate-50 border-slate-205/60 text-slate-500"
							: isLocationValid && !securityStatus.isLocationSpoofed && securityStatus.confidence >= 60
							? "bg-emerald-50 border-emerald-100 text-emerald-700"
							: "bg-rose-50 border-rose-100 text-rose-750"
					}`}>
						<MapPin className={`w-3.5 h-3.5 ${
							locationPermission !== "granted"
								? "text-slate-400"
								: isLocationValid && !securityStatus.isLocationSpoofed && securityStatus.confidence >= 60
								? "text-emerald-500"
								: "text-rose-500"
						}`} />
						<span>
							{locationPermission !== "granted"
								? "Izin Lokasi"
								: isLocationValid && !securityStatus.isLocationSpoofed && securityStatus.confidence >= 60
								? "Lokasi Aman"
								: "Lokasi Bermasalah"}
						</span>
					</div>
				)}

				{/* Security status pill */}
				{locationValidationEnabled && locationPermission === "granted" && (
					<div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
						!securityStatus.isLocationSpoofed && securityStatus.confidence >= 60
							? "bg-emerald-50 border-emerald-100 text-emerald-700"
							: "bg-rose-50 border-rose-100 text-rose-750"
					}`}>
						<Shield className={`w-3.5 h-3.5 ${
							!securityStatus.isLocationSpoofed && securityStatus.confidence >= 60
								? "text-emerald-500"
								: "text-rose-500"
						}`} />
						<span>
							{!securityStatus.isLocationSpoofed && securityStatus.confidence >= 60
								? `Secure (${securityStatus.confidence}%)`
								: "Tidak Aman"}
						</span>
					</div>
				)}
			</div>

			{/* Status Alerts */}
			{status && (
				<div
					ref={alertRef}
					tabIndex={-1}
					className={`p-4 rounded-xl border flex items-start gap-3 transition-all animate-fade-in ${
						status === "success"
							? "bg-emerald-50 border-emerald-100 text-emerald-800"
							: status === "security_error"
							? "bg-rose-50 border-rose-100 text-rose-800"
							: status === "camera_error"
							? "bg-amber-50 border-amber-100 text-amber-800"
							: status === "location_granted"
							? "bg-emerald-50 border-emerald-100 text-emerald-800"
							: status === "location_denied"
							? "bg-rose-50 border-rose-100 text-rose-800"
							: status === "location_error"
							? "bg-amber-50 border-amber-100 text-amber-800"
							: status === "unfinished_attendance"
							? "bg-amber-50 border-amber-100 text-amber-800"
							: status === "no_schedule"
							? "bg-amber-50 border-amber-200 text-amber-800"
							: "bg-rose-50 border-rose-100 text-rose-800"
					}`}
				>
					{status === "success" || status === "location_granted" ? (
						<CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
					) : status === "security_error" ? (
						<Shield className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
					) : status === "camera_error" ? (
						<Camera className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
					) : (
						<AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
					)}
					<div className="flex-1 text-sm leading-relaxed">
						{status === "success" ? (
							<span>Presensi berhasil dicatat!</span>
						) : status === "security_error" ? (
							<span>
								Presensi ditolak karena terdeteksi lokasi palsu atau tidak
								aman. Confidence level: {securityStatus.confidence}%
							</span>
						) : status === "camera_error" ? (
							<span>
								Kamera belum siap. Pastikan kamera dapat diakses dan coba
								lagi.
							</span>
						) : status === "location_granted" ? (
							<span>
								Izin lokasi berhasil diberikan! Silakan lakukan verifikasi
								lokasi.
							</span>
						) : status === "location_denied" ? (
							<span>
								Izin lokasi ditolak. Silakan aktifkan lokasi di pengaturan
								browser dan refresh halaman ini.
							</span>
						) : status === "location_error" ? (
							<span>
								Gagal mengakses lokasi. Pastikan GPS aktif dan koneksi
								internet stabil.
							</span>
						) : status === "unfinished_attendance" ? (
							<span>
								Anda masih memiliki presensi sebelumnya yang belum
								di-checkout. Silakan selesaikan presensi tersebut terlebih
								dahulu atau gunakan tombol Auto Checkout jika sudah melewati
								batas waktu.
							</span>
						) : status === "no_schedule" ? (
							<div>
								<div className="font-semibold mb-1">
									Jadwal Shift Belum Diisi
								</div>
								<span className="text-xs">
									Jadwal shift untuk hari ini belum diisi. Silakan mengisi
									jadwal shift hari ini terlebih dahulu sebelum melakukan
									presensi.
								</span>
							</div>
						) : (
							<span>Gagal melakukan presensi. Silakan coba lagi.</span>
						)}
					</div>
				</div>
			)}

			{/* Location Permission Request */}
			{locationPermission !== "granted" && (
				<div className="p-5 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-4 animate-fade-in">
					<div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
						<MapPin className="w-5 h-5" />
					</div>
					<div className="flex-1 space-y-3">
						<div>
							<h3 className="font-bold text-amber-800">Izin Lokasi Diperlukan</h3>
							<p className="text-xs text-amber-700 leading-relaxed mt-1">
								{locationPermission === "denied"
									? "Izin lokasi telah ditolak. Untuk melakukan presensi, silakan aktifkan lokasi di pengaturan browser Anda dan refresh halaman."
									: locationPermission === "checking"
									? "Memeriksa status izin lokasi..."
									: "Aplikasi memerlukan akses lokasi untuk memverifikasi kehadiran Anda. Klik tombol di bawah untuk memberikan izin."}
							</p>
						</div>
						{locationPermission !== "denied" &&
							locationPermission !== "checking" && (
								<button
									onClick={requestLocationPermission}
									className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-white px-4 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-2 shadow-xs"
								>
									<MapPin className="w-3.5 h-3.5" />
									<span>Aktifkan Izin Lokasi</span>
								</button>
							)}
						{locationPermission === "denied" && (
							<button
								onClick={() => window.location.reload()}
								className="bg-primary-500 hover:bg-primary-600 active:scale-95 text-white px-4 py-2 rounded-full text-xs font-semibold transition-all shadow-xs"
							>
								Refresh Halaman
							</button>
						)}
					</div>
				</div>
			)}

			{/* Data Presensi Hari Ini (Post-checkin / Completed) */}
			{(todayAttendance || completedAttendance) && (
				<div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-5 space-y-5 animate-fade-in">
					<div className="flex justify-between items-center pb-3 border-b border-slate-100">
						<div>
							<h2 className="text-base font-bold text-slate-800 font-figtree">Data Presensi Hari Ini</h2>
							<p className="text-xs text-slate-500">Informasi kehadiran shift aktif Anda</p>
						</div>
						<span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
							attendanceStatus.isCompleted || completedAttendance?.jam_pulang
								? "bg-emerald-50 text-emerald-700 border border-emerald-100"
								: "bg-primary-50 text-primary-600 border border-primary-100"
						}`}>
							{attendanceStatus.isCompleted || completedAttendance?.jam_pulang
								? completedAttendance?.status || "Selesai"
								: todayAttendance?.status || "Sedang Berlangsung"}
						</span>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="bg-slate-50 p-4 rounded-xl space-y-1">
							<span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">JAM MASUK</span>
							<div className="text-lg font-bold text-slate-850">
								{formatTime(
									todayAttendance?.jam_datang ||
										completedAttendance?.jam_datang
								)}
							</div>
						</div>

						{(attendanceStatus.isCompleted || completedAttendance?.jam_pulang) ? (
							<div className="bg-slate-50 p-4 rounded-xl space-y-1">
								<span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">JAM PULANG</span>
								<div className="text-lg font-bold text-slate-850">
									{formatTime(completedAttendance?.jam_pulang)}
								</div>
							</div>
						) : (
							<div className="bg-slate-50 p-4 rounded-xl flex flex-col justify-center items-center text-center">
								<Clock className="w-5 h-5 text-slate-400 mb-1 animate-pulse" />
								<span className="text-[10px] font-semibold text-slate-500">Menunggu Pulang</span>
							</div>
						)}
					</div>

					{(attendanceStatus.isCompleted || completedAttendance?.durasi) && (
						<div className="bg-primary-50/60 p-4 rounded-xl flex items-center justify-between border border-primary-50">
							<div className="flex items-center gap-2.5">
								<div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center text-primary-600">
									<Clock className="w-4 h-4" />
								</div>
								<div>
									<p className="text-[9px] font-bold text-primary-600 uppercase tracking-wider font-mono">DURASI KERJA</p>
									<p className="text-xs font-bold text-slate-700">
										{completedAttendance?.durasi}
									</p>
								</div>
							</div>
						</div>
					)}

					{/* Photo display */}
					{(todayAttendance?.photo || completedAttendance?.photo) && (
						<div className="space-y-2 pt-2">
							<span className="text-[10px] font-bold text-slate-400 block text-center uppercase tracking-wider font-mono">Foto Presensi Masuk</span>
							<div className="flex justify-center">
								<div className="rounded-xl overflow-hidden border border-slate-100 shadow-xs max-w-[200px] w-full aspect-square">
									<OptimizedPhotoDisplay
										photoUrl={
											todayAttendance?.photo || completedAttendance?.photo
										}
										alt="Foto Presensi Masuk"
										width={200}
										height={200}
										priority={false}
										lazy={true}
									/>
								</div>
							</div>
						</div>
					)}

					{(attendanceStatus.isCompleted || completedAttendance) && (
						<div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-3">
							<CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
							<div>
								<p className="text-sm font-bold text-emerald-800">Presensi Hari Ini Telah Selesai</p>
								<p className="text-xs text-emerald-650 mt-0.5">Anda telah menyelesaikan presensi masuk dan pulang untuk hari ini.</p>
							</div>
						</div>
					)}
				</div>
			)}

			{/* Form Presensi Masuk (Camera Preview) */}
			{!todayAttendance &&
				!attendanceStatus.isCompleted &&
				!completedAttendance && (
					<>
						{/* Camera Box */}
						<div className="relative w-full rounded-2xl overflow-hidden shadow-sm bg-slate-900 border border-slate-200">
							<AttendanceCamera ref={cameraRef} onCapture={setPhoto} />
							
							{/* Camera Overlay */}
							<div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 z-10">
								<div className="self-start px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-[10px] text-emerald-400 font-semibold tracking-wide flex items-center gap-1.5">
									<span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
									<span>LIVE CAMERA</span>
								</div>
								
								<div className="flex-1 flex items-center justify-center opacity-20">
									<div className="w-40 h-40 rounded-full border-2 border-dashed border-white flex items-center justify-center">
										<span className="text-white text-[10px] font-mono font-medium tracking-wider">POSISIKAN WAJAH</span>
									</div>
								</div>
								
								<div className="self-center bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg text-[10px] text-slate-300 text-center font-medium">
									Wajah akan dipindai secara otomatis saat tombol ditekan
								</div>
							</div>
						</div>

						{/* Hidden Auto Location Verification */}
						{locationPermission === "granted" && (
							<div className="hidden">
								<SecureLocationMap
									onLocationVerified={setIsLocationValid}
									onSecurityStatusChange={handleSecurityStatusChange}
								/>
							</div>
						)}

						{/* Inline Readiness bar instead of large card */}
						<div
							className={`w-full py-3 px-4 rounded-xl border text-center transition-all ${
								!isFormReady()
									? "bg-amber-50 border-amber-200 text-amber-800"
									: "bg-emerald-50 border-emerald-200 text-emerald-800"
							}`}
						>
							<div className="flex items-center justify-center gap-2 text-xs">
								{!isFormReady() ? (
									<>
										<AlertTriangle className="w-4 h-4 shrink-0" />
										<span className="font-semibold">
											{locationPermission !== "granted"
												? "Izin lokasi diperlukan"
												: !isLocationValid
												? "Lokasi berada di luar radius presensi"
												: securityStatus.isLocationSpoofed
												? "Lokasi terdeteksi palsu"
												: securityStatus.confidence < 60
												? "Sinyal lokasi lemah, silakan coba di tempat terbuka"
												: !cameraRef.current?.isReady()
												? "Menunggu kamera siap..."
												: "Persyaratan belum terpenuhi"}
										</span>
									</>
								) : (
									<>
										<CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
										<span className="font-semibold">
											Seluruh persyaratan terpenuhi. Siap presensi masuk.
										</span>
									</>
								)}
							</div>
						</div>
					</>
				)}

			{/* Form Presensi Pulang */}
			{todayAttendance &&
				!attendanceStatus.isCompleted &&
				!completedAttendance && (
					<>
						{/* Checkout Info */}
						<div className="p-5 bg-primary-50/50 border border-primary-100 rounded-2xl flex items-start gap-4">
							<div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600 shrink-0">
								<Clock className="w-5 h-5" />
							</div>
							<div>
								<h3 className="font-bold text-primary-800 text-sm">Presensi Pulang</h3>
								<p className="text-xs text-primary-700 leading-relaxed mt-1">
									Presensi pulang tidak memerlukan foto. Lokasi Anda akan dipantau dan diverifikasi secara otomatis saat tombol ditekan.
								</p>
							</div>
						</div>

						{/* Hidden Auto Location Verification for Checkout */}
						<div className="hidden">
							<SecureLocationMap
								onLocationVerified={setIsLocationValid}
								onSecurityStatusChange={handleSecurityStatusChange}
							/>
						</div>

						{/* Status Kesiapan Presensi Pulang */}
						<div
							className={`w-full py-3 px-4 rounded-xl border text-center ${
								!isCheckingOut ||
								(locationValidationEnabled &&
									(!isLocationValid ||
										securityStatus.isLocationSpoofed ||
										securityStatus.confidence < 60))
									? "bg-amber-50 border-amber-200 text-amber-800"
									: "bg-emerald-50 border-emerald-200 text-emerald-800"
							}`}
						>
							<div className="flex items-center justify-center gap-2 text-xs">
								{!isCheckingOut ? (
									<>
										<Clock className="w-4 h-4" />
										<span className="font-semibold">Belum waktunya pulang (Jadwal pulang belum tercapai)</span>
									</>
								) : locationValidationEnabled && !isLocationValid ? (
									<>
										<MapPin className="w-4 h-4" />
										<span className="font-semibold">Lokasi berada di luar radius presensi</span>
									</>
								) : locationValidationEnabled &&
								  securityStatus.isLocationSpoofed ? (
									<>
										<Shield className="w-4 h-4" />
										<span className="font-semibold">
											Lokasi terdeteksi palsu
										</span>
									</>
								) : locationValidationEnabled &&
								  securityStatus.confidence < 60 ? (
									<>
										<AlertTriangle className="w-4 h-4" />
										<span className="font-semibold">
											Confidence level terlalu rendah
										</span>
									</>
								) : (
									<>
										<CheckCircle className="w-4 h-4 text-emerald-600" />
										<span className="font-semibold">
											Siap untuk presensi pulang
										</span>
									</>
								)}
							</div>
						</div>
					</>
				)}

			{/* Unfinished Attendance Slide-up Bottom Sheet */}
			{showUnfinishedAlert && unfinishedAttendance && (
				<div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300 animate-fade-in">
					<div className="bg-white w-full max-w-lg rounded-t-3xl shadow-xl p-6 space-y-6 animate-slide-in-from-bottom">
						<div className="flex justify-center">
							<div className="w-12 h-1 bg-slate-200 rounded-full"></div>
						</div>
						
						<div className="flex items-start gap-4">
							<div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
								<AlertTriangle className="w-5 h-5" />
							</div>
							<div className="flex-1">
								<h3 className="text-base font-bold text-slate-800 font-figtree">Presensi Belum Selesai</h3>
								<p className="text-xs text-slate-500 mt-0.5">Anda tercatat belum melakukan presensi pulang pada hari kerja sebelumnya.</p>
							</div>
							<button 
								onClick={dismissUnfinishedAlert}
								className="p-1 rounded-lg text-slate-400 hover:text-slate-655 hover:bg-slate-50 transition-colors"
							>
								<X className="w-5 h-5" />
							</button>
						</div>

						<div className="bg-slate-50 p-4 rounded-xl space-y-3.5 border border-slate-100 text-xs">
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-0.5">
									<span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">TANGGAL</span>
									<p className="font-bold text-slate-700">{unfinishedAttendance.status_info?.work_date}</p>
								</div>
								<div className="space-y-0.5">
									<span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">SHIFT</span>
									<p className="font-bold text-slate-700">{unfinishedAttendance.status_info?.shift_info}</p>
								</div>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-0.5">
									<span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">JAM MASUK</span>
									<p className="font-bold text-slate-700">{unfinishedAttendance.status_info?.jam_datang_formatted}</p>
								</div>
								<div className="space-y-0.5">
									<span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">DURASI KERJA</span>
									<p className="font-bold text-slate-700">{unfinishedAttendance.current_duration}</p>
								</div>
							</div>
							{unfinishedAttendance.time_info && (
								<div className="pt-2.5 border-t border-slate-200/60 flex justify-between items-center">
									<span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">STATUS WAKTU</span>
									<span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">{unfinishedAttendance.time_info.formatted}</span>
								</div>
							)}
						</div>

						<div className="flex gap-3">
							{unfinishedAttendance.can_auto_checkout ? (
								<button
									onClick={handleAutoCheckout}
									disabled={isSubmitting}
									className="flex-1 bg-amber-500 hover:bg-amber-600 active:scale-98 text-white py-3.5 rounded-full font-bold transition-all flex items-center justify-center gap-2 shadow-sm text-sm"
								>
									{isSubmitting ? (
										<>
											<Loader2 className="w-4 h-4 animate-spin" />
											<span>Memproses...</span>
										</>
									) : (
										<>
											<Clock className="w-4 h-4" />
											<span>Pulang Sekarang</span>
										</>
									)}
								</button>
							) : (
								<div className="flex-1 py-3 text-center text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-100 rounded-xl">
									Belum dapat pulang otomatis
								</div>
							)}
							<button
								onClick={dismissUnfinishedAlert}
								className="px-6 bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-750 py-3.5 rounded-full font-semibold transition-all text-sm"
							>
								Tutup
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Sticky Bottom Button Container */}
			<div className="fixed bottom-28 md:bottom-6 left-4 right-4 z-40">
				<div className="max-w-lg mx-auto">
					{/* Tombol Presensi Masuk - Sticky */}
					{!todayAttendance &&
						!attendanceStatus.isCompleted &&
						!completedAttendance && (
							<button
								onClick={handleCheckIn}
								disabled={!isFormReady() || isSubmitting}
								className={`w-full py-4 rounded-full font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 active:scale-98 ${
									!isFormReady() || isSubmitting
										? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
										: "bg-primary-600 text-white hover:bg-primary-700 shadow-primary-500/20"
								}`}
							>
								{isSubmitting ? (
									<>
										<Loader2 className="w-4 h-4 animate-spin" />
										<span>Memproses...</span>
									</>
								) : !isFormReady() ? (
									<>
										<Shield className="w-4 h-4" />
										<span>
											{locationPermission !== "granted"
												? "Izin Lokasi Diperlukan"
												: !isLocationValid
												? "Lokasi Tidak Valid"
												: securityStatus.isLocationSpoofed
												? "Lokasi Terdeteksi Palsu"
												: securityStatus.confidence < 60
												? "Sinyal Lokasi Lemah"
												: !cameraRef.current?.isReady()
												? "Kamera Belum Siap"
												: "Lengkapi Persyaratan"}
										</span>
									</>
								) : (
									<>
										<Camera className="w-4.5 h-4.5" />
										<span>Presensi Masuk</span>
									</>
								)}
							</button>
						)}

					{/* Tombol Presensi Pulang - Sticky */}
					{todayAttendance &&
						!attendanceStatus.isCompleted &&
						!completedAttendance && (
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
								className={`w-full py-4 rounded-full font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 active:scale-98 ${
									!isCheckingOut ||
									(locationValidationEnabled &&
										(!isLocationValid ||
											securityStatus.isLocationSpoofed ||
											securityStatus.confidence < 60)) ||
									isSubmitting
										? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
										: "bg-orange-500 text-white hover:bg-orange-600 shadow-orange-500/20"
								}`}
							>
								{isSubmitting ? (
									<>
										<Loader2 className="w-4 h-4 animate-spin" />
										<span>Memproses...</span>
									</>
								) : !isCheckingOut ? (
									<>
										<Clock className="w-4.5 h-4.5" />
										<span>Belum Waktunya Pulang</span>
									</>
								) : locationValidationEnabled && !isLocationValid ? (
									<>
										<MapPin className="w-4.5 h-4.5" />
										<span>Lokasi Tidak Valid</span>
									</>
								) : locationValidationEnabled &&
								  securityStatus.isLocationSpoofed ? (
									<>
										<Shield className="w-4.5 h-4.5" />
										<span>Lokasi Terdeteksi Palsu</span>
									</>
								) : locationValidationEnabled &&
								  securityStatus.confidence < 60 ? (
									<>
										<AlertTriangle className="w-4.5 h-4.5" />
										<span>Confidence Level Rendah</span>
									</>
								) : (
									<>
										<Clock className="w-4.5 h-4.5" />
										<span>Presensi Pulang</span>
									</>
								)}
							</button>
						)}

					{/* Status Selesai - Sticky */}
					{(attendanceStatus.isCompleted || completedAttendance) && (
						<div className="w-full py-4 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center gap-2 text-emerald-700 font-bold text-sm">
							<CheckCircle className="w-5 h-5 text-emerald-600" />
							<span>Presensi Hari Ini Selesai</span>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
