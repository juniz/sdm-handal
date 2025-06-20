"use client";

const SignatureImage = ({ base64Data }) => {
	if (!base64Data) return null;

	const isValidBase64 = (str) => {
		try {
			if (!str || typeof str !== "string") {
				return false;
			}

			// Periksa apakah string dimulai dengan format data URL yang valid
			if (!str.match(/^data:image\/(png|jpeg|jpg|gif);base64,/)) {
				// Coba perbaiki format jika belum sesuai
				str = `data:image/png;base64,${str.replace(
					/^data:image\/(png|jpeg|jpg|gif);base64,/,
					""
				)}`;
			}

			const base64Content = str.split(",")[1];
			const isValid = base64Content && base64Content.length > 0;
			return isValid;
		} catch (err) {
			console.error("Error validating base64:", err);
			return false;
		}
	};

	// Normalisasi format base64 data
	let normalizedBase64 = base64Data;
	if (!base64Data.startsWith("data:image/")) {
		normalizedBase64 = `data:image/png;base64,${base64Data.replace(
			/^data:image\/(png|jpeg|jpg|gif);base64,/,
			""
		)}`;
	}

	// Jika data tidak valid, tampilkan placeholder
	if (!isValidBase64(normalizedBase64)) {
		return (
			<div className="h-20 bg-gray-100 rounded flex items-center justify-center">
				<span className="text-sm text-gray-400">
					Format tanda tangan tidak valid
				</span>
			</div>
		);
	}

	return (
		<div className="relative group">
			<img
				src={normalizedBase64}
				alt="Tanda Tangan"
				className="max-h-20 border rounded p-1 transition-transform group-hover:scale-[2] origin-bottom-left"
				loading="lazy"
				onError={(e) => {
					e.target.onerror = null;
					e.target.src =
						"data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
					e.target.className = "max-h-20 border rounded p-1 bg-gray-100";
					e.target.alt = "Gagal memuat tanda tangan";
				}}
			/>
			<div className="absolute bottom-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-tl">
				Hover untuk memperbesar
			</div>
		</div>
	);
};

export default SignatureImage;
