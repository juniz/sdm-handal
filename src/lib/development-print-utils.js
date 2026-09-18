/**
 * Utility helper for printing and PDF generation in Development modules.
 */

export const triggerBrowserPrint = () => {
	if (typeof window !== "undefined") {
		window.print();
	}
};

/**
 * Mathematical conversion from oklch(...) CSS color to standard rgba(...)
 * Ensures complete compatibility with html2canvas and canvas renderers.
 */
const oklchToRgb = (str) => {
	const match = str.match(
		/oklch\(\s*([\d.%]+)\s+([\d.%]+)\s+([\d.%]+)(?:\s*\/\s*([\d.%]+))?\s*\)/i
	);
	if (!match) return "#1e293b";

	let L = parseFloat(match[1]);
	let C = parseFloat(match[2]);
	let H = parseFloat(match[3]);
	let A = match[4] ? parseFloat(match[4]) : 1;
	if (match[1].endsWith("%")) L /= 100;

	const hRad = (H * Math.PI) / 180;
	const a = C * Math.cos(hRad);
	const b = C * Math.sin(hRad);

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

const replaceOklchInString = (str) => {
	if (!str || typeof str !== "string" || !str.includes("oklch")) return str;
	return str.replace(/oklch\([^)]+\)/gi, (match) => {
		try {
			return oklchToRgb(match);
		} catch {
			return "#1e293b";
		}
	});
};

/**
 * Creates a proxied getComputedStyle to sanitize any returned oklch color values.
 */
const createStyleProxy = (originalFn, context) => {
	return function (el, pseudo) {
		const style = originalFn.call(context, el, pseudo);
		if (!style) return style;

		return new Proxy(style, {
			get(target, prop) {
				const val = target[prop];
				if (typeof val === "string" && val.includes("oklch")) {
					return replaceOklchInString(val);
				}
				if (typeof val === "function") {
					if (prop === "getPropertyValue") {
						return function (name) {
							const v = target.getPropertyValue(name);
							return replaceOklchInString(v);
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
					if (styleTag.textContent && styleTag.textContent.includes("oklch")) {
						styleTag.textContent = replaceOklchInString(styleTag.textContent);
					}
				});
			},
		});

		const imgData = canvas.toDataURL("image/png");
		const pdf = new jsPDF(orientation, "mm", "a4");

		const pdfWidth = pdf.internal.pageSize.getWidth();
		const pdfHeight = pdf.internal.pageSize.getHeight();

		const imgWidth = canvas.width;
		const imgHeight = canvas.height;

		// Calculate scaled height matching pdfWidth
		const renderHeight = (imgHeight * pdfWidth) / imgWidth;

		let heightLeft = renderHeight;
		let position = 0;

		// First page
		pdf.addImage(imgData, "PNG", 0, position, pdfWidth, renderHeight, "", "FAST");
		heightLeft -= pdfHeight;

		// Subsequent pages if content overflows A4 height
		while (heightLeft > 0) {
			position = heightLeft - renderHeight;
			pdf.addPage();
			pdf.addImage(imgData, "PNG", 0, position, pdfWidth, renderHeight, "", "FAST");
			heightLeft -= pdfHeight;
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
