/**
 * Utility helper for printing and PDF generation in Development modules.
 */

export const triggerBrowserPrint = () => {
	if (typeof window !== "undefined") {
		window.print();
	}
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

	try {
		const html2canvas = (await import("html2canvas")).default;
		const { jsPDF } = await import("jspdf");

		// Render element to canvas with high resolution scale
		const canvas = await html2canvas(element, {
			scale: 2,
			useCORS: true,
			allowTaint: true,
			backgroundColor: "#ffffff",
			logging: false,
			windowWidth: element.scrollWidth,
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
	}
};
