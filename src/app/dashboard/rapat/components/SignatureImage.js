"use client";

const SignatureImage = ({ base64Data, signatureData, className = "", nama = "" }) => {
	const rawData = base64Data || signatureData;
	if (!rawData) return null;

	const isValidBase64 = (str) => {
		try {
			if (!str || typeof str !== "string") {
				return false;
			}
			if (!str.match(/^data:image\/(png|jpeg|jpg|gif);base64,/)) {
				str = `data:image/png;base64,${str.replace(
					/^data:image\/(png|jpeg|jpg|gif);base64,/,
					""
				)}`;
			}
			const base64Content = str.split(",")[1];
			return Boolean(base64Content && base64Content.length > 0);
		} catch (err) {
			console.error("Error validating base64:", err);
			return false;
		}
	};

	let normalizedBase64 = rawData;
	if (typeof rawData === "string" && !rawData.startsWith("data:image/")) {
		normalizedBase64 = `data:image/png;base64,${rawData.replace(
			/^data:image\/(png|jpeg|jpg|gif);base64,/,
			""
		)}`;
	}

	if (!isValidBase64(normalizedBase64)) {
		return (
			<div className="h-20 bg-slate-100 rounded-lg flex items-center justify-center p-2 text-center">
				<span className="text-xs text-slate-500">
					Format tanda tangan tidak valid
				</span>
			</div>
		);
	}

	return (
		<div className="relative inline-block">
			<img
				src={normalizedBase64}
				alt={nama ? `Tanda Tangan ${nama}` : "Tanda Tangan Peserta"}
				className={`max-h-20 rounded border border-slate-200 bg-white p-1 object-contain ${className}`}
				loading="lazy"
				onError={(e) => {
					e.target.onerror = null;
					e.target.src =
						"data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
					e.target.className = "max-h-20 border rounded p-1 bg-slate-100";
					e.target.alt = "Gagal memuat tanda tangan";
				}}
			/>
		</div>
	);
};

export default SignatureImage;
