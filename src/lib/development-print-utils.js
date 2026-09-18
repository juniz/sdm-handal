/**
 * Utility helper for printing and PDF generation in Development modules.
 */

export const triggerBrowserPrint = () => {
	if (typeof window !== "undefined") {
		window.print();
	}
};

/**
 * Convert oklch(...) CSS color to standard rgba(...) string.
 */
const oklchToRgba = (str) => {
	const match = str.match(
		/oklch\(\s*([\d.%]+)\s+([\d.%]+)\s+([\d.%]+)(?:\s*\/\s*([\d.%]+))?\s*\)/i
	);
	if (!match) return null;

	let L = parseFloat(match[1]);
	let C = parseFloat(match[2]);
	let H = parseFloat(match[3]);
	let A = match[4] ? parseFloat(match[4]) : 1;
	if (match[1].endsWith("%")) L /= 100;

	const hRad = (H * Math.PI) / 180;
	const a = C * Math.cos(hRad);
	const b = C * Math.sin(hRad);

	return oklabValuesToRgba(L, a, b, A);
};

/**
 * Convert oklab(...) CSS color to standard rgba(...) string.
 */
const oklabToRgba = (str) => {
	const match = str.match(
		/oklab\(\s*([\d.%]+)\s+([-\d.%]+)\s+([-\d.%]+)(?:\s*\/\s*([\d.%]+))?\s*\)/i
	);
	if (!match) return null;

	let L = parseFloat(match[1]);
	let a = parseFloat(match[2]);
	let b = parseFloat(match[3]);
	let A = match[4] ? parseFloat(match[4]) : 1;
	if (match[1].endsWith("%")) L /= 100;

	return oklabValuesToRgba(L, a, b, A);
};

/**
 * Shared OKLab L,a,b → sRGB rgba() conversion.
 */
const oklabValuesToRgba = (L, a, b, A) => {
	const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
	const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
	const s_ = L - 0.0894841775 * a - 1.291485548 * b;

	const l = l_ * l_ * l_;
	const m = m_ * m_ * m_;
	const s = s_ * s_ * s_;

	let r = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
	let g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
	let b_rgb = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

	const gamma = (x) =>
		x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(Math.max(0, x), 1 / 2.4) - 0.055;
	const clamp = (x) => Math.min(255, Math.max(0, Math.round(gamma(x) * 255)));

	return `rgba(${clamp(r)}, ${clamp(g)}, ${clamp(b_rgb)}, ${A})`;
};

/**
 * Regex matching all modern CSS color functions html2canvas cannot parse:
 * oklch(), oklab(), lab(), lch(), color(), light-dark()
 */
const UNSUPPORTED_COLOR_RE = /(?:oklch|oklab|lab|lch|color|light-dark)\([^)]*(?:\([^)]*\))?[^)]*\)/gi;

const hasUnsupportedColor = (str) =>
	typeof str === "string" &&
	(str.includes("oklch") ||
		str.includes("oklab") ||
		str.includes("lab(") ||
		str.includes("lch(") ||
		str.includes("color(") ||
		str.includes("light-dark("));

/**
 * Replace all unsupported CSS color functions with rgba equivalents or fallback.
 */
const sanitizeColorString = (str) => {
	if (!str || !hasUnsupportedColor(str)) return str;
	return str.replace(UNSUPPORTED_COLOR_RE, (match) => {
		try {
			if (match.startsWith("oklch")) return oklchToRgba(match) || "#1e293b";
			if (match.startsWith("oklab")) return oklabToRgba(match) || "#1e293b";
			// For lab(), lch(), color(), light-dark() — no math converter, use safe fallback
			return "#1e293b";
		} catch {
			return "#1e293b";
		}
	});
};

/**
 * Creates a proxied getComputedStyle to sanitize any unsupported color values
 * before html2canvas tries to parse them.
 */
const createStyleProxy = (originalFn, context) => {
	return function (el, pseudo) {
		const style = originalFn.call(context, el, pseudo);
		if (!style) return style;

		return new Proxy(style, {
			get(target, prop) {
				const val = target[prop];
				if (typeof val === "string" && hasUnsupportedColor(val)) {
					return sanitizeColorString(val);
				}
				if (typeof val === "function") {
					if (prop === "getPropertyValue") {
						return function (name) {
							const v = target.getPropertyValue(name);
							return sanitizeColorString(v);
						};
					}
					return val.bind(target);
				}
				return val;
			},
		});
	};
};

/**
 * Export specific HTML element to PDF file via html2canvas & jsPDF.
 * Dynamically imports libraries to prevent SSR hydration errors.
 * 
 * @param {string} elementId - ID of the container element to export
 * @param {string} fileName - Destination filename (without or with .pdf)
 * @param {Object} options - Custom options (orientation: 'portrait'|'landscape')
 * @returns {Promise<boolean>}
 */
export const exportToPdfFromElement = async (
	elementId,
	fileName = "dokumen-pengembangan.pdf",
	options = {}
) => {
	if (typeof window === "undefined") return false;

	const element = document.getElementById(elementId);
	if (!element) {
		console.error(`Element #${elementId} not found for PDF export.`);
		return false;
	}

	const orientation = options.orientation === "landscape" ? "l" : "p";
	const cleanFileName = fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`;

	const originalWindowGetComputedStyle = window.getComputedStyle;

	try {
		// 1. Intercept main window getComputedStyle so html2canvas's parseBackgroundColor never sees oklch
		window.getComputedStyle = createStyleProxy(originalWindowGetComputedStyle, window);

		const html2canvas = (await import("html2canvas")).default;
		const { jsPDF } = await import("jspdf");

		// Temporarily reset minHeight & padding on capture element so it captures only actual content height
		const prevMinHeight = element.style.minHeight;
		const prevBoxShadow = element.style.boxShadow;
		element.style.minHeight = "auto";
		element.style.boxShadow = "none";

		// 2. Render element to canvas with high resolution scale and internal iframe interception
		const canvas = await html2canvas(element, {
			scale: 2,
			useCORS: true,
			allowTaint: true,
			backgroundColor: "#ffffff",
			logging: false,
			windowWidth: element.scrollWidth,
			onclone: (clonedDoc) => {
				// Intercept getComputedStyle inside the cloned document iframe
				if (clonedDoc.defaultView) {
					clonedDoc.defaultView.getComputedStyle = createStyleProxy(
						clonedDoc.defaultView.getComputedStyle,
						clonedDoc.defaultView
					);
				}

				// Sanitize all <style> tags in the cloned document
				const styles = clonedDoc.querySelectorAll("style");
				styles.forEach((styleTag) => {
					if (styleTag.textContent && hasUnsupportedColor(styleTag.textContent)) {
						styleTag.textContent = sanitizeColorString(styleTag.textContent);
					}
				});

				// Reset clone minHeight to prevent artificial trailing page
				const clonedTarget = clonedDoc.getElementById(elementId);
				if (clonedTarget) {
					clonedTarget.style.minHeight = "auto";
					clonedTarget.style.boxShadow = "none";
					clonedTarget.style.border = "none";
				}
			},
		});

		// Restore element styles
		element.style.minHeight = prevMinHeight;
		element.style.boxShadow = prevBoxShadow;

		const imgData = canvas.toDataURL("image/png");
		const pdf = new jsPDF(orientation, "mm", "a4");

		const pdfWidth = pdf.internal.pageSize.getWidth();
		const pdfHeight = pdf.internal.pageSize.getHeight();

		const imgWidth = canvas.width;
		const imgHeight = canvas.height;

		// Calculate scaled height matching pdfWidth
		const renderHeight = (imgHeight * pdfWidth) / imgWidth;

		// If content fits within a single A4 page (with a 4mm tolerance), render single page only
		if (renderHeight <= pdfHeight + 4) {
			pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, renderHeight, "", "FAST");
		} else {
			// Multi-page slicing without duplicate overlaps
			let heightLeft = renderHeight;
			let page = 0;

			while (heightLeft > 4) {
				if (page > 0) {
					pdf.addPage();
				}
				const position = -(page * pdfHeight);
				pdf.addImage(imgData, "PNG", 0, position, pdfWidth, renderHeight, "", "FAST");
				heightLeft -= pdfHeight;
				page++;
			}
		}

		pdf.save(cleanFileName);
		return true;
	} catch (error) {
		console.error("Failed to export PDF:", error);
		throw error;
	} finally {
		// Restore original getComputedStyle
		window.getComputedStyle = originalWindowGetComputedStyle;
	}
};
