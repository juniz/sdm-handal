import moment from "moment-timezone";
import { generateSlipGajiHTMLSimple } from "./pdfSlipGeneratorSimple";

// Fungsi untuk format tanggal Indonesia
const formatTanggalIndo = (tanggal) => {
	const bulan = [
		"",
		"JANUARI",
		"FEBRUARI",
		"MARET",
		"APRIL",
		"MEI",
		"JUNI",
		"JULI",
		"AGUSTUS",
		"SEPTEMBER",
		"OKTOBER",
		"NOVEMBER",
		"DESEMBER",
	];
	const date = moment(tanggal);
	return `${date.format("DD")} ${
		bulan[parseInt(date.format("MM"))]
	} ${date.format("YYYY")}`;
};

// Format nama bulan Indonesia
const formatBulanIndo = (bulan) => {
	const bulanNama = [
		"",
		"JANUARI",
		"FEBRUARI",
		"MARET",
		"APRIL",
		"MEI",
		"JUNI",
		"JULI",
		"AGUSTUS",
		"SEPTEMBER",
		"OKTOBER",
		"NOVEMBER",
		"DESEMBER",
	];
	return bulanNama[bulan] || "";
};

export const generateSlipGajiHTML = (gajiData, pegawaiData) => {
	const periodeBulan = formatBulanIndo(gajiData.periode_bulan);
	const periodeTahun = gajiData.periode_tahun;
	const tanggalCetak = formatTanggalIndo(new Date());

	// Format rupiah
	const formatRupiah = (angka) => {
		return new Intl.NumberFormat("id-ID", {
			style: "currency",
			currency: "IDR",
			minimumFractionDigits: 0,
		}).format(angka);
	};

	return `
		<!doctype html>
		<html lang="id">
		<head>
			<meta charset="utf-8">
			<meta name="viewport" content="width=device-width, initial-scale=1">
			<title>SLIP GAJI - ${pegawaiData.nama}</title>
			<style>
				* {
					box-sizing: border-box;
					margin: 0;
					padding: 0;
				}
				
				html, body {
					width: 210mm;
					min-height: 297mm;
					font-family: "Times New Roman", Times, serif;
					font-size: 12pt;
					line-height: 1.5;
					color: #000000;
					background-color: #ffffff;
				}
				
				.container {
					padding: 20mm;
				}
				
				.header {
					text-align: center;
					margin-bottom: 20px;
					border-bottom: 2px solid #000000;
					padding-bottom: 15px;
				}
				
				.header h1 {
					font-size: 16pt;
					font-weight: bold;
					margin-bottom: 5px;
				}
				
				.header h2 {
					font-size: 14pt;
					font-weight: bold;
					margin-bottom: 3px;
				}
				
				.header h3 {
					font-size: 12pt;
					font-weight: bold;
					margin-top: 5px;
				}
				
				.title {
					text-align: center;
					font-size: 14pt;
					font-weight: bold;
					margin: 20px 0;
					text-decoration: underline;
				}
				
				.info-section {
					margin-bottom: 20px;
				}
				
				.info-row {
					display: flex;
					margin-bottom: 8px;
				}
				
				.info-label {
					width: 150px;
					font-weight: bold;
				}
				
				.info-value {
					flex: 1;
				}
				
				.table-section {
					margin: 20px 0;
				}
				
				table {
					width: 100%;
					border-collapse: collapse;
					margin-bottom: 20px;
				}
				
				table th,
				table td {
					border: 1px solid #000000;
					padding: 8px;
					text-align: left;
				}
				
				table th {
					background-color: #f0f0f0;
					font-weight: bold;
					text-align: center;
				}
				
				table td.text-right {
					text-align: right;
				}
				
				.total-row {
					font-weight: bold;
					font-size: 13pt;
				}
				
				.footer {
					margin-top: 40px;
					display: flex;
					justify-content: space-between;
				}
				
				.footer-section {
					text-align: center;
					width: 45%;
				}
				
				.signature-line {
					margin-top: 60px;
					border-top: 1px solid #000000;
					padding-top: 5px;
				}
				
				@media print {
					@page { 
						margin: 15mm; 
						size: A4; 
					}
					
					html, body {
						width: 210mm;
						min-height: 297mm;
						margin: 0;
						padding: 0;
					}
					
					body { 
						margin: 0;
						padding: 0;
					}
				}
			</style>
		</head>
		<body>
			<div class="container">
				<!-- Header dengan Logo -->
				<div class="header" style="display: flex; align-items: center;">
					<div style="width: 80px; flex-shrink: 0;">
						<img src="/logo.png" alt="Logo" style="width: 60px; height: 60px; object-fit: contain;" />
					</div>
					<div style="flex: 1; text-align: center;">
						<h1>POLRI DAERAH JAWA TIMUR</h1>
						<h2>BIDANG KEDOKTERAN DAN KESEHATAN</h2>
						<h3>RUMAH SAKIT BHAYANGKARA TK. III NGANJUK</h3>
					</div>
					<div style="width: 80px; flex-shrink: 0;"></div>
				</div>
				
				<!-- Title -->
				<div class="title">SLIP GAJI</div>
				
				<!-- Periode -->
				<div style="text-align: center; margin-bottom: 20px; font-weight: bold;">
					Periode: ${periodeBulan} ${periodeTahun}
				</div>
				
				<!-- Info Pegawai -->
				<div class="info-section">
					<div class="info-row">
						<div class="info-label">NIK:</div>
						<div class="info-value">${pegawaiData.nik || "-"}</div>
					</div>
					<div class="info-row">
						<div class="info-label">Nama:</div>
						<div class="info-value">${pegawaiData.nama || "-"}</div>
					</div>
					<div class="info-row">
						<div class="info-label">Jabatan:</div>
						<div class="info-value">${pegawaiData.jbtn || "-"}</div>
					</div>
					<div class="info-row">
						<div class="info-label">Departemen:</div>
						<div class="info-value">${pegawaiData.departemen_name || "-"}</div>
					</div>
				</div>
				
				<!-- Rincian Gaji -->
				<div class="table-section">
					<table>
						<thead>
							<tr>
								<th style="width: 30%;">Keterangan</th>
								<th style="width: 70%;">Jumlah</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td>Jenis</td>
								<td>${gajiData.jenis}</td>
							</tr>
							<tr class="total-row">
								<td>TOTAL GAJI</td>
								<td class="text-right">${formatRupiah(gajiData.gaji)}</td>
							</tr>
						</tbody>
					</table>
				</div>
				
				<!-- Footer -->
				<div class="footer">
					<div class="footer-section">
						<div>Nganjuk, ${tanggalCetak}</div>
						<div style="margin-top: 20px;">Yang Menerima</div>
						<div class="signature-line">
							<br>
							${pegawaiData.nama || ""}
						</div>
					</div>
					<div class="footer-section">
						<div>Mengetahui</div>
						<div style="margin-top: 20px;">KEPALA RUMAH SAKIT</div>
						<div class="signature-line">
							<br>
							drg. WAHYU ARI PRANANTO, M.A.R.S.<br>
							<span style="text-decoration: overline;">AJUN KOMISARIS BESAR POLISI NRP 76030927</span>
						</div>
					</div>
				</div>
			</div>
			<script>
				window.onload = function() {
					setTimeout(function() {
						window.print();
					}, 500);
				};
			</script>
		</body>
		</html>
	`;
};

export const generateSlipGajiPDF = async (gajiData, pegawaiData) => {
	let element = null;
	try {
		// Import libraries
		const html2canvas = (await import("html2canvas")).default;
		const { jsPDF } = await import("jspdf");

		// Buat element HTML untuk slip gaji (gunakan versi sederhana untuk menghindari CSS parsing issues)
		element = document.createElement("div");
		element.id = "slip-gaji-pdf-container";
		const htmlContent = generateSlipGajiHTMLSimple(gajiData, pegawaiData);
		element.innerHTML = htmlContent;

		// Style element untuk PDF - gunakan posisi fixed untuk memastikan terlihat di viewport
		element.style.position = "fixed";
		element.style.left = "0px";
		element.style.top = "0px";
		element.style.width = "210mm";
		element.style.minHeight = "297mm";
		element.style.backgroundColor = "#ffffff";
		element.style.padding = "0";
		element.style.margin = "0";
		element.style.fontFamily = "Times New Roman, serif";
		element.style.color = "#000000";
		element.style.zIndex = "-9999";
		element.style.overflow = "visible";

		// Tambahkan ke DOM
		document.body.appendChild(element);

		// Tunggu sebentar untuk render
		await new Promise((resolve) => setTimeout(resolve, 500));

		// Capture element sebagai canvas dengan konfigurasi sederhana
		const canvas = await html2canvas(element, {
			scale: 2,
			useCORS: true,
			allowTaint: true,
			backgroundColor: "#ffffff",
			logging: false,
			foreignObjectRendering: false,
		});

		// Hapus element dari DOM
		if (element && element.parentNode) {
			document.body.removeChild(element);
		}

		// Buat PDF
		const imgData = canvas.toDataURL("image/png");
		const pdf = new jsPDF("p", "mm", "a4");

		// Hitung dimensi untuk A4 (210mm x 297mm)
		const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
		const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

		// Hitung ratio berdasarkan pixel (scale 2 berarti 2x resolution)
		// html2canvas dengan scale 2 menghasilkan pixel yang lebih tinggi
		// Konversi pixel ke mm: 1mm = 3.7795 pixels (pada 96 DPI)
		const imgWidthMM = canvas.width / 2 / 3.7795; // Bagi 2 karena scale 2
		const imgHeightMM = canvas.height / 2 / 3.7795;

		// Hitung ratio untuk fit ke halaman A4
		const widthRatio = pdfWidth / imgWidthMM;
		const heightRatio = pdfHeight / imgHeightMM;
		const ratio = Math.min(widthRatio, heightRatio, 1); // Max ratio 1 untuk tidak melebihi ukuran asli

		// Hitung posisi untuk center
		const finalWidth = imgWidthMM * ratio;
		const finalHeight = imgHeightMM * ratio;
		const imgX = (pdfWidth - finalWidth) / 2;
		const imgY = 0;

		// Tambahkan gambar ke PDF
		pdf.addImage(imgData, "PNG", imgX, imgY, finalWidth, finalHeight);

		// Save PDF
		const fileName = `Slip_Gaji_${pegawaiData.nik}_${gajiData.periode_bulan}_${gajiData.periode_tahun}.pdf`;
		pdf.save(fileName);
	} catch (error) {
		console.error("Error generating PDF with html2canvas:", error);

		// Cleanup element jika masih ada
		if (element && element.parentNode) {
			try {
				document.body.removeChild(element);
			} catch (e) {
				// Ignore cleanup error
			}
		}

		// Fallback: gunakan jsPDF langsung tanpa html2canvas
		try {
			await generateSlipGajiPDFDirect(gajiData, pegawaiData);
			return;
		} catch (fallbackError) {
			console.error("Fallback jsPDF direct also failed:", fallbackError);
		}

		throw new Error(
			"Gagal generate PDF. Silakan gunakan tombol Print sebagai alternatif."
		);
	}
};

// Fungsi fallback: generate PDF langsung dengan jsPDF tanpa html2canvas
const generateSlipGajiPDFDirect = async (gajiData, pegawaiData) => {
	const { jsPDF } = await import("jspdf");

	const pdf = new jsPDF("p", "mm", "a4");
	const pageWidth = pdf.internal.pageSize.getWidth();

	// Format helper
	const formatBulanIndo = (bulan) => {
		const bulanNama = [
			"",
			"JANUARI",
			"FEBRUARI",
			"MARET",
			"APRIL",
			"MEI",
			"JUNI",
			"JULI",
			"AGUSTUS",
			"SEPTEMBER",
			"OKTOBER",
			"NOVEMBER",
			"DESEMBER",
		];
		return bulanNama[bulan] || "";
	};

	const formatTanggalIndo = (tanggal) => {
		const bulan = [
			"",
			"JANUARI",
			"FEBRUARI",
			"MARET",
			"APRIL",
			"MEI",
			"JUNI",
			"JULI",
			"AGUSTUS",
			"SEPTEMBER",
			"OKTOBER",
			"NOVEMBER",
			"DESEMBER",
		];
		const date = new Date(tanggal);
		return `${date.getDate()} ${
			bulan[date.getMonth() + 1]
		} ${date.getFullYear()}`;
	};

	const formatRupiah = (angka) => {
		return new Intl.NumberFormat("id-ID", {
			style: "currency",
			currency: "IDR",
			minimumFractionDigits: 0,
		}).format(angka);
	};

	let y = 20;

	// Tambahkan logo (jika tersedia)
	try {
		// Load logo sebagai base64
		const logoResponse = await fetch("/logo.png");
		if (logoResponse.ok) {
			const logoBlob = await logoResponse.blob();
			const logoBase64 = await new Promise((resolve) => {
				const reader = new FileReader();
				reader.onloadend = () => resolve(reader.result);
				reader.readAsDataURL(logoBlob);
			});

			// Tambahkan logo di kiri header
			pdf.addImage(logoBase64, "PNG", 20, y - 5, 20, 20);
		}
	} catch (logoError) {
		console.warn("Could not load logo:", logoError);
	}

	// Header (geser ke kanan untuk memberi ruang logo)
	const headerX = pageWidth / 2 + 10;

	pdf.setFontSize(14);
	pdf.setFont("helvetica", "bold");
	pdf.text("POLRI DAERAH JAWA TIMUR", headerX, y, { align: "center" });
	y += 7;

	pdf.setFontSize(12);
	pdf.text("BIDANG KEDOKTERAN DAN KESEHATAN", headerX, y, { align: "center" });
	y += 7;

	pdf.setFontSize(11);
	pdf.text("RUMAH SAKIT BHAYANGKARA TK. III NGANJUK", headerX, y, {
		align: "center",
	});
	y += 8;

	// Garis bawah header
	pdf.setLineWidth(0.5);
	pdf.line(20, y, pageWidth - 20, y);
	y += 15;

	// Title
	pdf.setFontSize(14);
	pdf.setFont("helvetica", "bold");
	pdf.text("SLIP GAJI", pageWidth / 2, y, { align: "center" });
	y += 10;

	// Periode
	pdf.setFontSize(11);
	pdf.text(
		`Periode: ${formatBulanIndo(gajiData.periode_bulan)} ${
			gajiData.periode_tahun
		}`,
		pageWidth / 2,
		y,
		{ align: "center" }
	);
	y += 15;

	// Info Pegawai
	pdf.setFont("helvetica", "normal");
	pdf.setFontSize(11);

	const leftMargin = 20;
	const labelWidth = 40;

	pdf.setFont("helvetica", "bold");
	pdf.text("NIK:", leftMargin, y);
	pdf.setFont("helvetica", "normal");
	pdf.text(pegawaiData.nik || "-", leftMargin + labelWidth, y);
	y += 7;

	pdf.setFont("helvetica", "bold");
	pdf.text("Nama:", leftMargin, y);
	pdf.setFont("helvetica", "normal");
	pdf.text(pegawaiData.nama || "-", leftMargin + labelWidth, y);
	y += 7;

	pdf.setFont("helvetica", "bold");
	pdf.text("Jabatan:", leftMargin, y);
	pdf.setFont("helvetica", "normal");
	pdf.text(pegawaiData.jbtn || "-", leftMargin + labelWidth, y);
	y += 7;

	pdf.setFont("helvetica", "bold");
	pdf.text("Departemen:", leftMargin, y);
	pdf.setFont("helvetica", "normal");
	pdf.text(pegawaiData.departemen_name || "-", leftMargin + labelWidth, y);
	y += 15;

	// Tabel Gaji
	const tableStartY = y;
	const col1Width = 60;
	const col2Width = pageWidth - 40 - col1Width;

	// Header tabel
	pdf.setFillColor(240, 240, 240);
	pdf.rect(leftMargin, y, col1Width, 10, "F");
	pdf.rect(leftMargin + col1Width, y, col2Width, 10, "F");

	pdf.setDrawColor(0);
	pdf.rect(leftMargin, y, col1Width, 10);
	pdf.rect(leftMargin + col1Width, y, col2Width, 10);

	pdf.setFont("helvetica", "bold");
	pdf.text("Keterangan", leftMargin + col1Width / 2, y + 7, {
		align: "center",
	});
	pdf.text("Jumlah", leftMargin + col1Width + col2Width / 2, y + 7, {
		align: "center",
	});
	y += 10;

	// Row 1: Jenis
	pdf.rect(leftMargin, y, col1Width, 10);
	pdf.rect(leftMargin + col1Width, y, col2Width, 10);
	pdf.setFont("helvetica", "normal");
	pdf.text("Jenis", leftMargin + 3, y + 7);
	pdf.text(gajiData.jenis || "-", leftMargin + col1Width + 3, y + 7);
	y += 10;

	// Row 2: Total Gaji
	pdf.rect(leftMargin, y, col1Width, 10);
	pdf.rect(leftMargin + col1Width, y, col2Width, 10);
	pdf.setFont("helvetica", "bold");
	pdf.text("TOTAL GAJI", leftMargin + 3, y + 7);
	pdf.text(
		formatRupiah(gajiData.gaji),
		leftMargin + col1Width + col2Width - 3,
		y + 7,
		{ align: "right" }
	);
	y += 25;

	// Footer - Tanda Tangan
	const footerY = y + 20;
	const colWidth = (pageWidth - 40) / 2;

	// Yang Menerima
	pdf.setFont("helvetica", "normal");
	pdf.text(
		`Nganjuk, ${formatTanggalIndo(new Date())}`,
		leftMargin + colWidth / 2,
		footerY,
		{ align: "center" }
	);
	pdf.text("Yang Menerima", leftMargin + colWidth / 2, footerY + 10, {
		align: "center",
	});
	pdf.line(
		leftMargin + 10,
		footerY + 50,
		leftMargin + colWidth - 10,
		footerY + 50
	);
	pdf.text(pegawaiData.nama || "", leftMargin + colWidth / 2, footerY + 55, {
		align: "center",
	});

	// Mengetahui
	pdf.text("Mengetahui", leftMargin + colWidth + colWidth / 2, footerY, {
		align: "center",
	});
	pdf.text(
		"KEPALA RUMAH SAKIT",
		leftMargin + colWidth + colWidth / 2,
		footerY + 10,
		{ align: "center" }
	);
	pdf.line(
		leftMargin + colWidth + 10,
		footerY + 50,
		leftMargin + colWidth + colWidth - 10,
		footerY + 50
	);
	pdf.setFontSize(10);
	pdf.text(
		"drg. WAHYU ARI PRANANTO, M.A.R.S.",
		leftMargin + colWidth + colWidth / 2,
		footerY + 55,
		{ align: "center" }
	);
	pdf.setFontSize(9);
	pdf.text(
		"AJUN KOMISARIS BESAR POLISI NRP 76030927",
		leftMargin + colWidth + colWidth / 2,
		footerY + 60,
		{ align: "center" }
	);

	// Save PDF
	const fileName = `Slip_Gaji_${pegawaiData.nik}_${gajiData.periode_bulan}_${gajiData.periode_tahun}.pdf`;
	pdf.save(fileName);
};
