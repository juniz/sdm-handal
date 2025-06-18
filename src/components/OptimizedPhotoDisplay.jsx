"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { ImageIcon, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import PhotoDebugger from "./PhotoDebugger";

const OptimizedPhotoDisplay = ({
	photoUrl,
	alt = "Foto",
	width = 200,
	height = 200,
	className = "",
	priority = false,
	lazy = true,
	debug = false,
}) => {
	const [imageError, setImageError] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [isVisible, setIsVisible] = useState(!lazy);
	const [retryCount, setRetryCount] = useState(0);
	const [isMounted, setIsMounted] = useState(false);
	const [showDebugger, setShowDebugger] = useState(false);
	const imgRef = useRef(null);
	const maxRetries = 3;

	// Handle mounting untuk menghindari hydration mismatch
	useEffect(() => {
		setIsMounted(true);
	}, []);

	// Format URL foto dengan fallback
	const getFormattedPhotoUrl = (url) => {
		if (!url) return null;

		try {
			// Jika sudah URL lengkap (http/https), tambahkan cache busting hanya untuk retry
			if (url.startsWith("http://") || url.startsWith("https://")) {
				if (retryCount > 0) {
					const retryParam = `retry=${retryCount}`;
					const separator = url.includes("?") ? "&" : "?";
					return `${url}${separator}${retryParam}`;
				}
				return url;
			}

			// Jika path API endpoint (/api/uploads/...), gunakan langsung tanpa cache busting
			if (url.startsWith("/api/uploads/")) {
				if (retryCount > 0) {
					const retryParam = `retry=${retryCount}`;
					const separator = url.includes("?") ? "&" : "?";
					return `${url}${separator}${retryParam}`;
				}
				return url;
			}

			// Jika path relatif biasa (sistem lama), tambahkan base URL dan cache busting
			const baseUrl = process.env.NEXT_PUBLIC_URL || "";
			const cleanPath = url.startsWith("/") ? url : `/${url}`;
			const fullUrl = `${baseUrl}${cleanPath}`;

			// Tambahkan cache busting untuk URL lama
			const timestamp = Date.now();
			const retryParam = retryCount > 0 ? `retry=${retryCount}` : "";
			const cacheParam = `t=${timestamp}`;
			const params = [cacheParam, retryParam].filter(Boolean).join("&");
			const separator = fullUrl.includes("?") ? "&" : "?";
			return `${fullUrl}${separator}${params}`;
		} catch (error) {
			console.error("Error formatting photo URL:", error);
			return null;
		}
	};

	// Intersection Observer untuk lazy loading
	useEffect(() => {
		if (!isMounted || !lazy || isVisible) return;

		// Check jika IntersectionObserver tersedia
		if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
			setIsVisible(true);
			return;
		}

		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						setIsVisible(true);
						observer.unobserve(entry.target);
					}
				});
			},
			{
				threshold: 0.1,
				rootMargin: "50px", // Load image 50px before it comes into view
			}
		);

		if (imgRef.current) {
			observer.observe(imgRef.current);
		}

		return () => {
			if (imgRef.current) {
				observer.unobserve(imgRef.current);
			}
		};
	}, [lazy, isVisible, isMounted]);

	const handleImageLoad = () => {
		setIsLoading(false);
		setImageError(false);
	};

	const handleImageError = (error) => {
		console.error("Image load error:", error);
		setIsLoading(false);
		setImageError(true);

		// Auto retry dengan delay yang bertambah
		if (retryCount < maxRetries) {
			const delay = Math.min(1000 * Math.pow(2, retryCount), 5000); // Exponential backoff
			console.log(
				`Retrying image load in ${delay}ms, attempt ${
					retryCount + 1
				}/${maxRetries}`
			);

			setTimeout(() => {
				setRetryCount((prev) => prev + 1);
				setImageError(false);
				setIsLoading(true);
			}, delay);
		} else {
			console.error(`Failed to load image after ${maxRetries} attempts`);
		}
	};

	const handleRetry = () => {
		console.log("Manual retry triggered");
		setRetryCount(0);
		setImageError(false);
		setIsLoading(true);
	};

	const formattedUrl = getFormattedPhotoUrl(photoUrl);

	// Skeleton/Placeholder component
	const SkeletonPlaceholder = () => (
		<div
			className={`flex items-center justify-center bg-gray-100 border border-gray-200 rounded-lg animate-pulse ${className}`}
			style={{ width, height }}
		>
			<div className="text-center p-4">
				<div className="w-8 h-8 bg-gray-300 rounded mx-auto mb-2 animate-pulse"></div>
				<div className="h-3 bg-gray-300 rounded w-16 mx-auto animate-pulse"></div>
			</div>
		</div>
	);

	// Error/Fallback component
	const ErrorFallback = () => (
		<div
			className={`flex items-center justify-center bg-gray-50 border border-gray-200 rounded-lg ${className}`}
			style={{ width, height }}
		>
			<div className="text-center p-4">
				<AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
				<p className="text-xs text-gray-500 mb-2">Gagal memuat foto</p>
				<div className="flex flex-col gap-2">
					{retryCount < maxRetries && (
						<button
							onClick={handleRetry}
							className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 mx-auto"
						>
							<RefreshCw className="w-3 h-3" />
							Coba lagi
						</button>
					)}
					{debug && (
						<button
							onClick={() => setShowDebugger(true)}
							className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 mx-auto"
						>
							🔍 Debug
						</button>
					)}
				</div>
			</div>
		</div>
	);

	// No photo placeholder
	const NoPhotoPlaceholder = () => (
		<div
			className={`flex items-center justify-center bg-gray-50 border border-gray-200 rounded-lg ${className}`}
			style={{ width, height }}
		>
			<div className="text-center p-4">
				<ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
				<p className="text-xs text-gray-500">Tidak ada foto</p>
			</div>
		</div>
	);

	// Loading component
	const LoadingState = () => (
		<div className={`relative ${className}`} style={{ width, height }}>
			<div
				className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg border border-gray-200"
				style={{ width, height }}
			>
				<div className="text-center">
					<Loader2 className="w-6 h-6 text-blue-500 animate-spin mx-auto mb-2" />
					<p className="text-xs text-gray-500">Memuat foto...</p>
				</div>
			</div>
		</div>
	);

	// Show skeleton saat belum mounted untuk mencegah hydration mismatch
	if (!isMounted) {
		return <SkeletonPlaceholder />;
	}

	// Jika tidak ada URL foto
	if (!formattedUrl) {
		return <NoPhotoPlaceholder />;
	}

	// Jika error loading dan sudah mencoba retry maksimal
	if (imageError && retryCount >= maxRetries) {
		return <ErrorFallback />;
	}

	// Jika lazy loading dan belum visible
	if (lazy && !isVisible) {
		return (
			<div ref={imgRef}>
				<SkeletonPlaceholder />
			</div>
		);
	}

	return (
		<>
			<div
				ref={imgRef}
				className={`relative ${className}`}
				style={{ width, height }}
			>
				{isLoading && <LoadingState />}
				{imageError && retryCount < maxRetries && <LoadingState />}

				<Image
					src={formattedUrl}
					alt={alt}
					width={width}
					height={height}
					className="rounded-lg object-fit object-center"
					onLoad={handleImageLoad}
					onError={handleImageError}
					priority={priority}
					loading={lazy ? "lazy" : "eager"}
					unoptimized={true}
					quality={85}
					placeholder="blur"
					blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
					sizes={`${width}px`}
					style={{
						width: "100%",
						height: "100%",
						maxWidth: width,
						maxHeight: height,
					}}
				/>

				{/* Debug button overlay */}
				{debug && (
					<button
						onClick={() => setShowDebugger(true)}
						className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded opacity-75 hover:opacity-100"
					>
						🔍
					</button>
				)}
			</div>

			{/* Debug modal */}
			{showDebugger && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
						<div className="flex justify-between items-center mb-4">
							<h3 className="text-lg font-semibold">Photo Debug Info</h3>
							<button
								onClick={() => setShowDebugger(false)}
								className="text-gray-500 hover:text-gray-700"
							>
								✕
							</button>
						</div>

						<div className="space-y-3 text-sm">
							<div>
								<strong>Original URL:</strong>
								<div className="bg-gray-100 p-2 rounded mt-1 break-all">
									{photoUrl || "No URL"}
								</div>
							</div>

							<div>
								<strong>Formatted URL:</strong>
								<div className="bg-gray-100 p-2 rounded mt-1 break-all">
									{formattedUrl || "No formatted URL"}
								</div>
							</div>

							<div>
								<strong>Status:</strong>
								<div className="mt-1">
									<span
										className={`px-2 py-1 rounded text-xs ${
											isLoading
												? "bg-blue-100 text-blue-800"
												: imageError
												? "bg-red-100 text-red-800"
												: "bg-green-100 text-green-800"
										}`}
									>
										{isLoading ? "Loading" : imageError ? "Error" : "Loaded"}
									</span>
									<span className="ml-2 text-gray-600">
										Retry: {retryCount}/{maxRetries}
									</span>
								</div>
							</div>

							<div className="flex gap-2 pt-2">
								<button
									onClick={handleRetry}
									className="px-3 py-1 bg-blue-500 text-white rounded text-xs"
								>
									Retry Load
								</button>
								<button
									onClick={() => window.open(formattedUrl, "_blank")}
									className="px-3 py-1 bg-green-500 text-white rounded text-xs"
								>
									Open URL
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</>
	);
};

export default OptimizedPhotoDisplay;
