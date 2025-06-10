"use client";

import {
	useRef,
	forwardRef,
	useImperativeHandle,
	useState,
	useEffect,
} from "react";
import Webcam from "react-webcam";
import { Camera, AlertTriangle, Loader2 } from "lucide-react";
import {
	fileToOptimizedBase64,
	getOptimalImageSettings,
} from "@/utils/imageOptimizer";

export const AttendanceCamera = forwardRef(function AttendanceCamera(
	{ onCapture },
	ref
) {
	const webcamRef = useRef(null);
	const [cameraReady, setCameraReady] = useState(false);
	const [cameraError, setCameraError] = useState(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isCapturing, setIsCapturing] = useState(false);
	const [optimalSettings, setOptimalSettings] = useState({
		quality: 0.8,
		maxWidth: 800,
		maxHeight: 600,
	});
	const [isMobile, setIsMobile] = useState(false);

	// Detect mobile device
	useEffect(() => {
		if (typeof window !== "undefined") {
			const checkMobile = () => {
				const isMobileDevice =
					window.innerWidth < 640 ||
					/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
						navigator.userAgent
					);
				setIsMobile(isMobileDevice);
			};

			checkMobile();
			window.addEventListener("resize", checkMobile);

			return () => window.removeEventListener("resize", checkMobile);
		}
	}, []);

	// Get optimal settings hanya di client-side
	useEffect(() => {
		if (typeof window !== "undefined") {
			const settings = getOptimalImageSettings();
			setOptimalSettings(settings);
		}
	}, []);

	// Get video constraints based on device
	const getVideoConstraints = () => {
		if (isMobile) {
			return {
				facingMode: "user",
				width: { ideal: 720, min: 480, max: 1280 },
				height: { ideal: 720, min: 480, max: 720 },
				aspectRatio: { ideal: 1, min: 0.75, max: 1.333 },
			};
		} else {
			return {
				facingMode: "user",
				width: { ideal: 1280, min: 640, max: 1920 },
				height: { ideal: 720, min: 480, max: 1080 },
				aspectRatio: { ideal: 16 / 9, min: 4 / 3, max: 16 / 9 },
			};
		}
	};

	// Check camera access
	useEffect(() => {
		const checkCameraAccess = async () => {
			try {
				if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
					throw new Error("Camera not supported");
				}

				// Test camera access
				const stream = await navigator.mediaDevices.getUserMedia({
					video: getVideoConstraints(),
				});

				// Stop stream immediately after test
				stream.getTracks().forEach((track) => track.stop());

				setCameraReady(true);
				setCameraError(null);
			} catch (error) {
				console.error("Camera access error:", error);
				let errorMessage = "Tidak dapat mengakses kamera";

				if (error.name === "NotAllowedError") {
					errorMessage =
						"Izin kamera ditolak. Aktifkan kamera di pengaturan browser.";
				} else if (error.name === "NotFoundError") {
					errorMessage = "Kamera tidak ditemukan di perangkat ini.";
				} else if (error.name === "NotSupportedError") {
					errorMessage = "Kamera tidak didukung di browser ini.";
				} else if (error.name === "NotReadableError") {
					errorMessage = "Kamera sedang digunakan aplikasi lain.";
				}

				setCameraError(errorMessage);
				setCameraReady(false);
			} finally {
				setIsLoading(false);
			}
		};

		// Only run in browser
		if (typeof window !== "undefined") {
			const timer = setTimeout(checkCameraAccess, 500);
			return () => clearTimeout(timer);
		} else {
			setIsLoading(false);
		}
	}, [isMobile]);

	// Convert dataURL to blob for optimization
	const dataURLToBlob = (dataURL) => {
		const arr = dataURL.split(",");
		const mime = arr[0].match(/:(.*?);/)[1];
		const bstr = atob(arr[1]);
		let n = bstr.length;
		const u8arr = new Uint8Array(n);
		while (n--) {
			u8arr[n] = bstr.charCodeAt(n);
		}
		return new Blob([u8arr], { type: mime });
	};

	// Optimize captured photo
	const optimizePhoto = async (dataURL) => {
		try {
			console.log("optimizePhoto input:", {
				type: typeof dataURL,
				length: dataURL?.length,
				startsWith: dataURL?.substring(0, 50),
			});

			// Convert to blob
			const blob = dataURLToBlob(dataURL);
			console.log("Blob created:", { size: blob.size, type: blob.type });

			// Create file object for optimization
			const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
			console.log("File created:", {
				size: file.size,
				type: file.type,
				name: file.name,
			});

			// Optimize dengan settings optimal
			const optimizedBase64 = await fileToOptimizedBase64(file, {
				maxWidth: optimalSettings.maxWidth,
				maxHeight: optimalSettings.maxHeight,
				quality: optimalSettings.quality,
				outputFormat: "image/jpeg",
			});

			console.log("Optimization complete:", {
				type: typeof optimizedBase64,
				length: optimizedBase64?.length,
				startsWith: optimizedBase64?.substring(0, 50),
			});

			return optimizedBase64;
		} catch (error) {
			console.error("Error optimizing photo:", error);
			// Fallback to original if optimization fails
			console.log("Falling back to original dataURL");
			return dataURL;
		}
	};

	// Expose methods to parent component
	useImperativeHandle(ref, () => ({
		capturePhoto: async () => {
			if (!webcamRef.current || !cameraReady) {
				console.error("Camera not ready for capture");
				return null;
			}

			try {
				setIsCapturing(true);
				console.log("Starting photo capture...");

				// Capture photo
				const imageSrc = webcamRef.current.getScreenshot({
					width: 1280,
					height: 720,
					screenshotFormat: "image/jpeg",
					screenshotQuality: 0.95,
				});

				console.log("Raw capture result:", {
					type: typeof imageSrc,
					length: imageSrc?.length,
					startsWith: imageSrc?.substring(0, 30),
				});

				if (!imageSrc) {
					throw new Error("Failed to capture photo");
				}

				// Optimize captured photo
				console.log("Starting photo optimization...");
				const optimizedPhoto = await optimizePhoto(imageSrc);

				console.log("Optimized photo result:", {
					type: typeof optimizedPhoto,
					length: optimizedPhoto?.length,
					startsWith: optimizedPhoto?.substring(0, 30),
				});

				if (onCapture) {
					onCapture(optimizedPhoto);
				}

				return optimizedPhoto;
			} catch (error) {
				console.error("Error capturing photo:", error);
				return null;
			} finally {
				setIsCapturing(false);
			}
		},
		isReady: () => {
			return cameraReady && webcamRef.current !== null && !isCapturing;
		},
	}));

	const handleWebcamUserMedia = () => {
		setCameraReady(true);
		setIsLoading(false);
		setCameraError(null);
	};

	const handleWebcamError = (error) => {
		console.error("Webcam error:", error);
		setCameraError("Gagal menginisialisasi kamera");
		setCameraReady(false);
		setIsLoading(false);
	};

	// Loading state
	if (isLoading) {
		return (
			<div className="relative w-full bg-gray-100 rounded-lg flex items-center justify-center mobile-camera-container">
				<div className="text-center">
					<Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
					<p className="text-sm text-gray-600">Memuat kamera...</p>
				</div>
			</div>
		);
	}

	// Error state
	if (cameraError) {
		return (
			<div className="relative w-full bg-red-50 border border-red-200 rounded-lg flex items-center justify-center mobile-camera-container">
				<div className="text-center p-4">
					<AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
					<p className="text-red-700 font-medium mb-2">Masalah Kamera</p>
					<p className="text-sm text-red-600 mb-3">{cameraError}</p>
					<button
						onClick={() => window.location.reload()}
						className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm transition-colors"
					>
						Coba Lagi
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="relative">
			<Webcam
				audio={false}
				ref={webcamRef}
				screenshotFormat="image/jpeg"
				screenshotQuality={0.95}
				className="w-full rounded-lg mobile-webcam"
				mirrored={true}
				videoConstraints={getVideoConstraints()}
				onUserMedia={handleWebcamUserMedia}
				onUserMediaError={handleWebcamError}
			/>

			{/* Status indicator */}
			<div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
				<Camera className="w-3 h-3" />
				<span>
					{isCapturing
						? "Mengambil foto..."
						: cameraReady
						? "Kamera Siap"
						: "Memuat..."}
				</span>
			</div>

			{/* Capture indicator */}
			{isCapturing && (
				<div className="absolute inset-0 bg-white bg-opacity-30 rounded-lg flex items-center justify-center">
					<div className="text-center text-gray-800">
						<Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
						<p className="text-sm font-medium">Memproses foto...</p>
					</div>
				</div>
			)}

			{/* Loading overlay saat kamera belum ready */}
			{!cameraReady && !cameraError && (
				<div className="absolute inset-0 bg-gray-900 bg-opacity-50 rounded-lg flex items-center justify-center">
					<div className="text-center text-white">
						<Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
						<p className="text-sm">Menyiapkan kamera...</p>
					</div>
				</div>
			)}
		</div>
	);
});
