/**
 * Utility untuk optimasi dan kompresi gambar
 */

// Kompres gambar dengan quality control
export const compressImage = (file, options = {}) => {
	const {
		maxWidth = 800,
		maxHeight = 600,
		quality = 0.8,
		outputFormat = "image/jpeg",
	} = options;

	return new Promise((resolve, reject) => {
		const canvas = document.createElement("canvas");
		const ctx = canvas.getContext("2d");
		const img = new Image();

		img.onload = () => {
			// Calculate new dimensions
			let { width, height } = img;

			if (width > height) {
				if (width > maxWidth) {
					height = (height * maxWidth) / width;
					width = maxWidth;
				}
			} else {
				if (height > maxHeight) {
					width = (width * maxHeight) / height;
					height = maxHeight;
				}
			}

			// Set canvas dimensions
			canvas.width = width;
			canvas.height = height;

			// Draw and compress
			ctx.drawImage(img, 0, 0, width, height);

			canvas.toBlob(
				(blob) => {
					if (blob) {
						resolve(blob);
					} else {
						reject(new Error("Canvas compression failed"));
					}
				},
				outputFormat,
				quality
			);
		};

		img.onerror = () => reject(new Error("Image load failed"));
		img.src = URL.createObjectURL(file);
	});
};

// Convert blob to base64
export const blobToBase64 = (blob) => {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result);
		reader.onerror = reject;
		reader.readAsDataURL(blob);
	});
};

// Convert file to optimized base64
export const fileToOptimizedBase64 = async (file, options = {}) => {
	try {
		const compressedBlob = await compressImage(file, options);
		const base64 = await blobToBase64(compressedBlob);
		return base64;
	} catch (error) {
		console.error("Error optimizing image:", error);
		throw error;
	}
};

// Generate responsive image sizes
export const generateResponsiveSizes = (baseWidth, baseHeight) => {
	const sizes = [];
	const breakpoints = [320, 480, 768, 1024, 1200];

	breakpoints.forEach((breakpoint) => {
		if (breakpoint <= baseWidth) {
			const ratio = breakpoint / baseWidth;
			sizes.push({
				width: breakpoint,
				height: Math.round(baseHeight * ratio),
				descriptor: `${breakpoint}w`,
			});
		}
	});

	return sizes;
};

// Create blur placeholder untuk loading state
export const createBlurPlaceholder = (width = 10, height = 10) => {
	const canvas = document.createElement("canvas");
	const ctx = canvas.getContext("2d");

	canvas.width = width;
	canvas.height = height;

	// Create simple gradient
	const gradient = ctx.createLinearGradient(0, 0, width, height);
	gradient.addColorStop(0, "#f3f4f6");
	gradient.addColorStop(1, "#e5e7eb");

	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, width, height);

	return canvas.toDataURL("image/jpeg", 0.1);
};

// Validate image file
export const validateImageFile = (file, options = {}) => {
	const {
		maxSize = 5 * 1024 * 1024, // 5MB
		allowedTypes = ["image/jpeg", "image/png", "image/webp"],
		minWidth = 100,
		minHeight = 100,
		maxWidth = 4000,
		maxHeight = 4000,
	} = options;

	return new Promise((resolve, reject) => {
		// Check file size
		if (file.size > maxSize) {
			reject(
				new Error(`File terlalu besar. Maksimal ${maxSize / 1024 / 1024}MB`)
			);
			return;
		}

		// Check file type
		if (!allowedTypes.includes(file.type)) {
			reject(
				new Error(
					`Format file tidak didukung. Gunakan: ${allowedTypes.join(", ")}`
				)
			);
			return;
		}

		// Check image dimensions
		const img = new Image();
		img.onload = () => {
			if (img.width < minWidth || img.height < minHeight) {
				reject(
					new Error(
						`Resolusi terlalu kecil. Minimal ${minWidth}x${minHeight}px`
					)
				);
				return;
			}

			if (img.width > maxWidth || img.height > maxHeight) {
				reject(
					new Error(
						`Resolusi terlalu besar. Maksimal ${maxWidth}x${maxHeight}px`
					)
				);
				return;
			}

			resolve({
				valid: true,
				width: img.width,
				height: img.height,
				size: file.size,
				type: file.type,
			});
		};

		img.onerror = () => reject(new Error("File bukan gambar yang valid"));
		img.src = URL.createObjectURL(file);
	});
};

// Format file size untuk display
export const formatFileSize = (bytes) => {
	if (bytes === 0) return "0 Bytes";

	const k = 1024;
	const sizes = ["Bytes", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// Calculate compression ratio
export const calculateCompressionRatio = (originalSize, compressedSize) => {
	const ratio = ((originalSize - compressedSize) / originalSize) * 100;
	return Math.round(ratio);
};

// Progressive image loading dengan multiple qualities
export const createProgressiveImage = async (
	file,
	qualities = [0.3, 0.6, 0.9]
) => {
	const versions = {};

	for (const quality of qualities) {
		const compressed = await compressImage(file, { quality });
		const base64 = await blobToBase64(compressed);
		versions[`q${Math.round(quality * 100)}`] = {
			data: base64,
			size: compressed.size,
			quality,
		};
	}

	return versions;
};

// Smart image optimization based pada device capabilities
export const getOptimalImageSettings = () => {
	// Default settings untuk server-side rendering
	const defaultSettings = {
		quality: 0.8,
		maxWidth: 800,
		maxHeight: 600,
	};

	// Check if running in browser
	if (typeof window === "undefined") {
		return defaultSettings;
	}

	const connection =
		navigator?.connection ||
		navigator?.mozConnection ||
		navigator?.webkitConnection;
	const devicePixelRatio = window.devicePixelRatio || 1;
	const screenWidth = window.screen?.width || 1024;

	let quality = 0.8;
	let maxWidth = 800;

	// Adjust based on connection speed
	if (connection) {
		switch (connection.effectiveType) {
			case "slow-2g":
			case "2g":
				quality = 0.5;
				maxWidth = 400;
				break;
			case "3g":
				quality = 0.7;
				maxWidth = 600;
				break;
			case "4g":
				quality = 0.85;
				maxWidth = 1000;
				break;
		}
	}

	// Adjust for high DPI screens
	if (devicePixelRatio > 1) {
		maxWidth *= Math.min(devicePixelRatio, 2);
	}

	// Adjust for screen size
	maxWidth = Math.min(maxWidth, screenWidth * 2);

	return {
		quality,
		maxWidth,
		maxHeight: Math.round(maxWidth * 0.75), // 4:3 aspect ratio
	};
};
