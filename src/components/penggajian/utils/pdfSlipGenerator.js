import moment from "moment-timezone";

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
						-webkit-print-color-adjust: exact;
						print-color-adjust: exact;
						color-adjust: exact;
					}
				}
			</style>
		</head>
		<body>
			<div class="container">
				<!-- Header -->
				<div class="header">
					<h1>POLRI DAERAH JAWA TIMUR</h1>
					<h2>BIDANG KEDOKTERAN DAN KESEHATAN</h2>
					<h3>RUMAH SAKIT BHAYANGKARA TK. III NGANJUK</h3>
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
	try {
		// Import libraries
		const html2canvas = (await import("html2canvas")).default;
		const { jsPDF } = await import("jspdf");

		// Buat element HTML untuk slip gaji
		const element = document.createElement("div");
		element.innerHTML = generateSlipGajiHTML(gajiData, pegawaiData);

		// Style element untuk PDF
		element.style.position = "absolute";
		element.style.left = "-9999px";
		element.style.top = "0px";
		element.style.width = "210mm";
		element.style.backgroundColor = "#ffffff";
		element.style.padding = "20px";
		element.style.fontFamily = "Times New Roman, serif";

		// Tambahkan ke DOM
		document.body.appendChild(element);

		// Tunggu sebentar untuk render
		await new Promise((resolve) => setTimeout(resolve, 500));

		// Capture element sebagai canvas
		const canvas = await html2canvas(element, {
			scale: 2,
			useCORS: true,
			allowTaint: true,
			backgroundColor: "#ffffff",
			logging: false,
			width: element.scrollWidth,
			height: element.scrollHeight,
		});

		// Hapus element dari DOM
		document.body.removeChild(element);

		// Buat PDF
		const imgData = canvas.toDataURL("image/png");
		const pdf = new jsPDF("p", "mm", "a4");

		// Hitung dimensi
		const pdfWidth = pdf.internal.pageSize.getWidth();
		const pdfHeight = pdf.internal.pageSize.getHeight();
		const imgWidth = canvas.width;
		const imgHeight = canvas.height;
		const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
		const imgX = (pdfWidth - imgWidth * ratio) / 2;
		const imgY = 0;

		pdf.addImage(
			imgData,
			"PNG",
			imgX,
			imgY,
			imgWidth * ratio,
			imgHeight * ratio
		);

		// Save PDF
		const fileName = `Slip_Gaji_${pegawaiData.nik}_${gajiData.periode_bulan}_${gajiData.periode_tahun}.pdf`;
		pdf.save(fileName);
	} catch (error) {
		console.error("Error generating PDF:", error);
		throw error;
	}
};

