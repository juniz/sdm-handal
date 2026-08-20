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

/**
 * Helper to wrap text into multiple lines based on maximum width on canvas
 */
const wrapText = (context, text, maxWidth) => {
	const paragraphs = String(text || "").split("\n");
	const lines = [];

	for (const paragraph of paragraphs) {
		const words = paragraph.split(" ");
		let currentLine = words[0] || "";

		for (let i = 1; i < words.length; i++) {
			const word = words[i];
			const testLine = currentLine + " " + word;
			const metrics = context.measureText(testLine);
			if (metrics.width > maxWidth) {
				lines.push(currentLine);
				currentLine = word;
			} else {
				currentLine = testLine;
			}
		}
		if (currentLine) {
			lines.push(currentLine);
		}
	}
	return lines;
};

/**
 * Stempel watermark GPS, pegawai, alamat, dan timestamp pada foto absensi
 * @param {string} dataUrl - Base64 image data URL
 * @param {Object} metadata - Metadata info (userName, nik, latitude, longitude, accuracy, timestamp, address)
 * @returns {Promise<string>} - Resolves with stamped base64 image data URL
 */
export const stampGpsWatermark = (dataUrl, metadata = {}) => {
	if (
		typeof window === "undefined" ||
		typeof document === "undefined" ||
		!dataUrl
	) {
		return Promise.resolve(dataUrl);
	}

	return new Promise((resolve) => {
		const img = new Image();
		img.crossOrigin = "anonymous";

		img.onload = () => {
			try {
				const canvas = document.createElement("canvas");
				const ctx = canvas.getContext("2d");
				if (!ctx) {
					resolve(dataUrl);
					return;
				}

				const width = img.naturalWidth || img.width || 640;
				const height = img.naturalHeight || img.height || 480;

				canvas.width = width;
				canvas.height = height;

				// 4. Draw original image onto canvas
				ctx.drawImage(img, 0, 0, width, height);

				// 5. Compute responsive scale factor
				const scale = Math.max(0.7, width / 600);

				const {
					userName = "Pegawai",
					nik = "",
					latitude = null,
					longitude = null,
					accuracy = null,
					timestamp = "",
					address = "",
				} = metadata;

				const paddingX = 16 * scale;
				const paddingY = 12 * scale;
				const accentBarWidth = 3 * scale;
				const gapToText = 10 * scale;
				const contentLeft = paddingX + accentBarWidth + gapToText;
				const maxTextWidth = width - contentLeft - paddingX;

				// Typography setups
				const fontLine1 = `bold ${Math.round(14 * scale)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
				const fontLine2 = `normal ${Math.round(12 * scale)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
				const fontLine3 = `600 ${Math.round(11 * scale)}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`;
				const fontLine4 = `600 ${Math.round(11 * scale)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;

				const items = [];

				// Line 1: User & NIK
				const line1Text = `👤 ${userName || "Pegawai"}${nik ? ` (${nik})` : ""}`;
				items.push({
					text: line1Text,
					font: fontLine1,
					color: "#FFFFFF",
					height: 18 * scale,
				});

				// Line 2: Address (with multi-line wrapping)
				const latStr =
					latitude !== null &&
					latitude !== undefined &&
					latitude !== "" &&
					!isNaN(Number(latitude))
						? Number(latitude).toFixed(6)
						: "-";
				const longStr =
					longitude !== null &&
					longitude !== undefined &&
					longitude !== "" &&
					!isNaN(Number(longitude))
						? Number(longitude).toFixed(6)
						: "-";
				const accStr =
					accuracy && !isNaN(Number(accuracy))
						? ` (±${Math.round(Number(accuracy))}m)`
						: "";

				const rawAddress = address || `Koordinat: ${latitude}, ${longitude}`;
				const addressFullText = `📍 ${rawAddress}`;

				ctx.font = fontLine2;
				const addressLines = wrapText(ctx, addressFullText, maxTextWidth);
				addressLines.forEach((line) => {
					items.push({
						text: line,
						font: fontLine2,
						color: "#E2E8F0",
						height: 16 * scale,
					});
				});

				// Line 3: Coordinates
				const line3Text = `🌐 Lat: ${latStr}, Long: ${longStr}${accStr}`;
				items.push({
					text: line3Text,
					font: fontLine3,
					color: "#38BDF8",
					height: 15 * scale,
				});

				// Line 4: Timestamp
				const timeDisplay = timestamp
					? timestamp.includes("WIB") ||
					  timestamp.includes("WITA") ||
					  timestamp.includes("WIT")
						? timestamp
						: `${timestamp} WIB`
					: `${new Date().toLocaleString("id-ID")} WIB`;
				const line4Text = `🕒 ${timeDisplay}`;
				items.push({
					text: line4Text,
					font: fontLine4,
					color: "#FEF08A",
					height: 15 * scale,
				});

				const lineGap = 4 * scale;
				const totalTextHeight =
					items.reduce((acc, item) => acc + item.height, 0) +
					(items.length - 1) * lineGap;
				const bannerHeight = totalTextHeight + paddingY * 2;
				const bannerY = height - bannerHeight;

				// 7. Draw translucent gradient banner at the bottom
				const bannerGradient = ctx.createLinearGradient(0, bannerY, 0, height);
				bannerGradient.addColorStop(0, "rgba(0, 0, 0, 0.70)");
				bannerGradient.addColorStop(1, "rgba(0, 0, 0, 0.88)");
				ctx.fillStyle = bannerGradient;
				ctx.fillRect(0, bannerY, width, bannerHeight);

				// Subtle top border line: rgba(255, 255, 255, 0.15)
				ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
				ctx.lineWidth = Math.max(1, 1 * scale);
				ctx.beginPath();
				ctx.moveTo(0, bannerY);
				ctx.lineTo(width, bannerY);
				ctx.stroke();

				// Left indicator accent bar (gradient cyan to emerald)
				const accentGradient = ctx.createLinearGradient(
					0,
					bannerY + paddingY,
					0,
					height - paddingY
				);
				accentGradient.addColorStop(0, "#06b6d4"); // cyan-500
				accentGradient.addColorStop(1, "#10b981"); // emerald-500
				ctx.fillStyle = accentGradient;
				ctx.fillRect(
					paddingX,
					bannerY + paddingY,
					accentBarWidth,
					totalTextHeight
				);

				// 8. Draw typography with shadow
				ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
				ctx.shadowBlur = 3 * scale;
				ctx.shadowOffsetX = 1 * scale;
				ctx.shadowOffsetY = 1 * scale;
				ctx.textBaseline = "top";

				let currentY = bannerY + paddingY;
				for (const item of items) {
					ctx.font = item.font;
					ctx.fillStyle = item.color;
					ctx.fillText(item.text, contentLeft, currentY);
					currentY += item.height + lineGap;
				}

				// Reset shadow
				ctx.shadowColor = "transparent";
				ctx.shadowBlur = 0;
				ctx.shadowOffsetX = 0;
				ctx.shadowOffsetY = 0;

				// 9. Export stamped image as image/jpeg 0.95
				const stampedDataUrl = canvas.toDataURL("image/jpeg", 0.95);
				resolve(stampedDataUrl);
			} catch (err) {
				console.error("Error stamping GPS watermark:", err);
				resolve(dataUrl);
			}
		};

		img.onerror = () => {
			console.error("Failed to load image for GPS watermarking");
			resolve(dataUrl);
		};

		img.src = dataUrl;
	});
};

