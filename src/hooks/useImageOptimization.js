import { useState, useEffect, useCallback } from "react";

export const useImageOptimization = (src, options = {}) => {
	const {
		lazy = true,
		retryAttempts = 3,
		retryDelay = 1000,
		preloadNext = [],
		cacheStrategy = "default",
	} = options;

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [retryCount, setRetryCount] = useState(0);
	const [imageUrl, setImageUrl] = useState(null);
	const [isMounted, setIsMounted] = useState(false);

	// Handle mounting
	useEffect(() => {
		setIsMounted(true);
	}, []);

	// Format dan validasi URL
	const formatImageUrl = useCallback((url) => {
		if (!url) return null;

		try {
			if (url.startsWith("http://") || url.startsWith("https://")) {
				return url;
			}

			const baseUrl = process.env.NEXT_PUBLIC_URL || "";
			const cleanPath = url.startsWith("/") ? url : `/${url}`;
			return `${baseUrl}${cleanPath}`;
		} catch (error) {
			console.error("Error formatting image URL:", error);
			return null;
		}
	}, []);

	// Load image dengan retry mechanism
	const loadImage = useCallback(
		(url, attempt = 0) => {
			if (!isMounted || typeof window === "undefined") {
				return;
			}

			if (!url) {
				setLoading(false);
				setError("No URL provided");
				return;
			}

			setLoading(true);
			setError(null);

			const img = new window.Image();

			const onLoad = () => {
				setLoading(false);
				setError(null);
				setImageUrl(url);
				setRetryCount(0);
			};

			const onError = () => {
				if (attempt < retryAttempts) {
					setTimeout(() => {
						setRetryCount(attempt + 1);
						loadImage(url, attempt + 1);
					}, retryDelay * (attempt + 1)); // Exponential backoff
				} else {
					setLoading(false);
					setError("Failed to load image after multiple attempts");
				}
			};

			img.onload = onLoad;
			img.onerror = onError;

			// Add cache busting for retry attempts
			const urlWithCache =
				attempt > 0 ? `${url}?retry=${attempt}&t=${Date.now()}` : url;
			img.src = urlWithCache;
		},
		[retryAttempts, retryDelay, isMounted]
	);

	// Preload next images untuk performance
	const preloadImages = useCallback(
		(urls) => {
			if (typeof window === "undefined") return;

			urls.forEach((url) => {
				const formattedUrl = formatImageUrl(url);
				if (formattedUrl) {
					const img = new window.Image();
					img.src = formattedUrl;
				}
			});
		},
		[formatImageUrl]
	);

	// Initialize loading
	useEffect(() => {
		if (!isMounted) return;

		const formattedUrl = formatImageUrl(src);
		if (formattedUrl && !lazy) {
			loadImage(formattedUrl);
		}
	}, [src, lazy, formatImageUrl, loadImage, isMounted]);

	// Preload next images
	useEffect(() => {
		if (isMounted && preloadNext.length > 0) {
			preloadImages(preloadNext);
		}
	}, [preloadNext, preloadImages, isMounted]);

	// Manual retry function
	const retry = useCallback(() => {
		if (!isMounted) return;

		const formattedUrl = formatImageUrl(src);
		if (formattedUrl) {
			setRetryCount(0);
			loadImage(formattedUrl);
		}
	}, [src, formatImageUrl, loadImage, isMounted]);

	// Manual load function untuk lazy loading
	const load = useCallback(() => {
		if (!isMounted) return;

		const formattedUrl = formatImageUrl(src);
		if (formattedUrl) {
			loadImage(formattedUrl);
		}
	}, [src, formatImageUrl, loadImage, isMounted]);

	return {
		loading,
		error,
		imageUrl: imageUrl || formatImageUrl(src),
		retryCount,
		retry,
		load,
		canRetry: retryCount < retryAttempts,
	};
};

// Hook untuk intersection observer lazy loading
export const useLazyLoading = (options = {}) => {
	const { threshold = 0.1, rootMargin = "50px", triggerOnce = true } = options;

	const [isVisible, setIsVisible] = useState(false);
	const [elementRef, setElementRef] = useState(null);
	const [isMounted, setIsMounted] = useState(false);

	// Handle mounting
	useEffect(() => {
		setIsMounted(true);
	}, []);

	useEffect(() => {
		if (!isMounted || !elementRef) {
			return;
		}

		// Fallback untuk browser tanpa IntersectionObserver
		if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
			setIsVisible(true);
			return;
		}

		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						setIsVisible(true);
						if (triggerOnce) {
							observer.unobserve(entry.target);
						}
					} else if (!triggerOnce) {
						setIsVisible(false);
					}
				});
			},
			{
				threshold,
				rootMargin,
			}
		);

		observer.observe(elementRef);

		return () => {
			if (elementRef) {
				observer.unobserve(elementRef);
			}
		};
	}, [elementRef, threshold, rootMargin, triggerOnce, isMounted]);

	return [setElementRef, isVisible];
};

// Hook untuk image prefetching
export const useImagePrefetch = (urls) => {
	const [prefetched, setPrefetched] = useState(new Set());
	const [isMounted, setIsMounted] = useState(false);

	// Handle mounting
	useEffect(() => {
		setIsMounted(true);
	}, []);

	useEffect(() => {
		if (!isMounted || typeof window === "undefined") return;

		const prefetchImages = async () => {
			const newPrefetched = new Set(prefetched);

			for (const url of urls) {
				if (!prefetched.has(url)) {
					try {
						const img = new window.Image();
						img.src = url;
						newPrefetched.add(url);
					} catch (error) {
						console.error("Error prefetching image:", url, error);
					}
				}
			}

			setPrefetched(newPrefetched);
		};

		if (urls.length > 0) {
			prefetchImages();
		}
	}, [urls, prefetched, isMounted]);

	return prefetched;
};
