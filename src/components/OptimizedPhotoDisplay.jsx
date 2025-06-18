"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { ImageIcon, Loader2, AlertCircle, RefreshCw } from "lucide-react";

const OptimizedPhotoDisplay = ({
	photoUrl,
	alt = "Foto",
	width = 200,
	height = 200,
	className = "",
	priority = false,
	lazy = true,
}) => {
	const [imageError, setImageError] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [isVisible, setIsVisible] = useState(!lazy);
	const [retryCount, setRetryCount] = useState(0);
	const [isMounted, setIsMounted] = useState(false);
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
			// Jika sudah URL lengkap
			if (url.startsWith("http://") || url.startsWith("https://")) {
				return url;
			}

			// Jika path relatif, gunakan base URL
			const baseUrl = process.env.NEXT_PUBLIC_URL || "";
			const cleanPath = url.startsWith("/") ? url : `/${url}`;
			return `${baseUrl}${cleanPath}`;
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
	};

	const handleRetry = () => {
		if (retryCount < maxRetries) {
			setRetryCount((prev) => prev + 1);
			setImageError(false);
			setIsLoading(true);
		}
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
				{retryCount < maxRetries && (
					<button
						onClick={handleRetry}
						className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 mx-auto"
					>
						<RefreshCw className="w-3 h-3" />
						Coba lagi
					</button>
				)}
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
		<div
			ref={imgRef}
			className={`relative ${className}`}
			style={{ width, height }}
		>
			{/* Loading overlay */}
			{isLoading && <LoadingState />}

			{/* Error overlay saat retry */}
			{imageError && retryCount < maxRetries && <LoadingState />}

			{/* Main image */}
			<Image
				src={`${formattedUrl}?timestamp=${Date.now()}`} // Add retry parameter to bust cache
				alt={alt}
				width={width}
				height={height}
				className="rounded-lg object-fit object-center"
				onLoad={handleImageLoad}
				onError={handleImageError}
				priority={priority}
				loading={lazy ? "lazy" : "eager"}
				unoptimized={false} // Let Next.js optimize the image
				quality={85} // Balanced quality vs file size
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
		</div>
	);
};

export default OptimizedPhotoDisplay;
