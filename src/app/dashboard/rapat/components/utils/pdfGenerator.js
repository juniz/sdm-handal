import moment from "moment-timezone";

// Fungsi untuk mengurutkan data rapat berdasarkan kolom urutan
const sortRapatList = (rapatList) => {
	return [...rapatList].sort((a, b) => {
		// Urutkan berdasarkan kolom urutan (ascending)
		const urutanA = a.urutan || 0;
		const urutanB = b.urutan || 0;

		// Jika urutan sama, urutkan berdasarkan nama
		if (urutanA === urutanB) {
			return a.nama.localeCompare(b.nama);
		}

		return urutanA - urutanB;
	});
};

export const generatePrintHTML = (filterDate, rapatList) => {
	// Urutkan data berdasarkan kolom urutan
	const sortedRapatList = sortRapatList(rapatList);

	const tanggalFormatted = moment(filterDate).format("DD MMMM YYYY");
	const hariFormatted = moment(filterDate).format("dddd").toUpperCase();
	const namaRapat = sortedRapatList.length > 0 ? sortedRapatList[0].rapat : "";

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

	return `
		<!doctype html>
		<html lang="en">
		<head>
			<meta charset="utf-8">
			<meta name="viewport" content="width=device-width, initial-scale=1">
			<title>REKAP ABSENSI RAPAT RSB NGANJUK</title>
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
					font-weight: bold;
				}
				
				.row {
					display: flex;
					flex-wrap: wrap;
					margin-left: -15px;
					margin-right: -15px;
				}
				
				.col, .col-1, .col-2, .col-4, .col-5, .col-6, .col-12 {
					position: relative;
					padding-left: 15px;
					padding-right: 15px;
				}
				
				.col {
					flex: 1 0 0%;
				}
				
				.col-1 {
					flex: 0 0 auto;
					width: 8.33333333%;
				}
				
				.col-2 {
					flex: 0 0 auto;
					width: 16.66666667%;
				}
				
				.col-4 {
					flex: 0 0 auto;
					width: 33.33333333%;
				}
				
				.col-5 {
					flex: 0 0 auto;
					width: 41.66666667%;
				}
				
				.col-6 {
					flex: 0 0 auto;
					width: 50%;
				}
				
				.col-12 {
					flex: 0 0 auto;
					width: 100%;
				}
				
				.text-center {
					text-align: center !important;
				}
				
				.fw-bold {
					font-weight: bold !important;
				}
				
				.p-3 {
					padding: 1rem !important;
				}
				
				.pt-3 {
					padding-top: 1rem !important;
				}
				
				table {
					width: 100%;
					border-collapse: collapse;
					page-break-inside: auto;
					margin-bottom: 1rem;
				}
				
				.table {
					border-collapse: collapse !important;
				}
				
				.table-bordered {
					border: 1px solid #000000 !important;
				}
				
				.table-bordered th,
				.table-bordered td {
					border: 1px solid #000000 !important;
				}
				
				.border-dark {
					border-color: #000000 !important;
				}
				
				thead {
					display: table-header-group;
				}
				
				tbody {
					display: table-row-group;
				}
				
				tr {
					page-break-inside: avoid;
					page-break-after: auto;
				}
				
				th, td {
					padding: 8px;
					text-align: left;
					vertical-align: middle;
					border: 1px solid #000000;
				}
				
				th {
					font-weight: bold;
					text-align: center;
					background-color: #ffffff;
					color: #000000;
				}
				
				td {
					background-color: #ffffff;
					color: #000000;
				}
				
				u {
					text-decoration: underline;
				}
				
				img {
					max-width: 100%;
					height: auto;
					display: inline-block;
					vertical-align: middle;
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
					
					table {
						border-collapse: collapse !important;
					}
					
					th, td {
						border: 1px solid #000000 !important;
						-webkit-print-color-adjust: exact;
						print-color-adjust: exact;
						color-adjust: exact;
					}
					
					thead {
						display: table-header-group;
					}
					
					tfoot {
						display: table-footer-group;
					}
					
					tr {
						page-break-inside: avoid;
					}
				}
			</style>
		</head>
		<body style="font-weight: bold;">
			<div class="row" style="margin-bottom: 20px;">
				<div class="col-5 text-center fw-bold" style="font-size: 12px;">
					POLRI DAERAH JAWA TIMUR<br>
					BIDANG KEDOKTERAN DAN KESEHATAN<br>
					<u>RUMAH SAKIT BHAYANGKARA TK. III NGANJUK</u>
				</div>
				<div class="col"></div>
				<div class="col"></div>
			</div>
			<div class="row p-3" style="font-size: 12px; margin-bottom: 15px;">
				<div class="col-12 text-center fw-bold">DAFTAR HADIR</div>
			</div>
			<div class="row" style="font-size: 12px; margin-bottom: 5px;">
				<div class="col-2 fw-bold">HARI</div>
				<div class="col-4">: ${hariFormatted}</div>
				<div class="col-1 fw-bold">ACARA</div>
				<div class="col-5">: .......................................................</div>
			</div>
			<div class="row" style="font-size: 12px; margin-bottom: 20px;">
				<div class="col-2 fw-bold">TANGGAL</div>
				<div class="col-4">: ${formatTanggalIndo(filterDate)}</div>
				<div class="col-1 fw-bold">JUMLAH</div>
				<div class="col-5">: ${sortedRapatList.length}</div>
			</div>
			<div class="row pt-3" style="margin-bottom: 30px;">
				<div class="col-12">
					<table class="table table-bordered border-dark" style="font-size: 12px; width: 100%; border-collapse: collapse;">
						<thead>
							<tr>
								<th class="text-center fw-bold" style="width: 10%; border: 1px solid #000000; padding: 8px; text-align: center;">NO</th>
								<th class="text-center fw-bold" style="width: 30%; border: 1px solid #000000; padding: 8px; text-align: center;">NAMA</th>
								<th class="text-center fw-bold" style="width: 30%; border: 1px solid #000000; padding: 8px; text-align: center;">NRP/INSTANSI/JABATAN</th>
								<th class="text-center fw-bold" colspan="2" style="width: 30%; border: 1px solid #000000; padding: 8px; text-align: center;">HADIR</th>
							</tr>
						</thead>
						<tbody>
							${sortedRapatList
								.map(
									(rapat, index) => `
								<tr>
									<td style="border: 1px solid #000000; padding: 8px; text-align: left;">${
										index + 1
									}</td>
									<td style="border: 1px solid #000000; padding: 8px; text-align: left;">${
										rapat.nama
									}</td>
									<td style="border: 1px solid #000000; padding: 8px; text-align: left;">${rapat.instansi.toUpperCase()}</td>
									<td style="width: 15%; border: 1px solid #000000; padding: 8px; text-align: left;">
										${
											(index + 1) % 2 !== 0 && rapat.tanda_tangan
												? `${index + 1}<img src="${
														rapat.tanda_tangan
												  }" style="width: 80px; height: 50px; display: inline-block; vertical-align: middle;" />`
												: ""
										}
									</td>
									<td style="width: 15%; border: 1px solid #000000; padding: 8px; text-align: left;">
										${
											(index + 1) % 2 === 0 && rapat.tanda_tangan
												? `${index + 1}<img src="${
														rapat.tanda_tangan
												  }" style="width: 80px; height: 50px; display: inline-block; vertical-align: middle;" />`
												: ""
										}
									</td>
								</tr>
							`
								)
								.join("")}
						</tbody>
					</table>
				</div>
			</div>
			<div class="row pt-3">
				<div class="col-6 text-center" style="font-size: 12px;">
					Mengetahui<br>
					KEPALA RUMAH SAKIT BHAYANGKARA TK.III NGANJUK<br><br><br><br><br>
					drg. WAHYU ARI PRANANTO, M.A.R.S.<br>
					<span style="text-decoration: overline;">AJUN KOMISARIS BESAR POLISI NRP 76030927</span>
				</div>
				<div class="col-6 text-center" style="font-size: 12px;">
					PEMIMPIN ACARA<br>
					<br><br><br><br><br>
					........................................<br>
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

export const generateDaftarHadirHTML = (filterDate, rapatList) => {
	// Urutkan data berdasarkan kolom urutan
	const sortedRapatList = sortRapatList(rapatList);

	const hariFormatted = moment(filterDate).format("dddd").toUpperCase();
	const namaRapat = sortedRapatList.length > 0 ? sortedRapatList[0].rapat : "";

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

	return `
		<div style="font-family: Arial, sans-serif; padding: 20px; background-color: #ffffff; color: #000000; width: 210mm; min-height: 297mm; box-sizing: border-box; font-weight: bold;">
			<!-- Header dengan Bootstrap Grid -->
			<div style="display: flex; width: 100%; margin-bottom: 30px;">
				<div style="width: 41.66%; text-align: center; font-weight: bold; font-size: 12px;">
					POLRI DAERAH JAWA TIMUR<br>
					BIDANG KEDOKTERAN DAN KESEHATAN<br>
					<u>RUMAH SAKIT BHAYANGKARA TK. III NGANJUK</u>
				</div>
				<div style="width: 29.17%;"></div>
				<div style="width: 29.17%;"></div>
			</div>
			
			<!-- Judul -->
			<div style="text-align: center; font-weight: bold; font-size: 12px; margin-bottom: 30px; padding: 15px 0;">
				DAFTAR HADIR
			</div>
			
			<!-- Info Rapat -->
			<div style="margin-bottom: 25px; font-size: 12px;">
				<div style="display: flex; margin-bottom: 5px;">
					<div style="width: 16.66%;">HARI</div>
					<div style="width: 33.33%;">: ${hariFormatted}</div>
					<div style="width: 8.33%;">ACARA</div>
					<div style="width: 41.66%;">: .......................................................</div>
				</div>
				<div style="display: flex;">
					<div style="width: 16.66%;">TANGGAL</div>
					<div style="width: 33.33%;">: ${formatTanggalIndo(filterDate)}</div>
					<div style="width: 8.33%;">JUMLAH</div>
					<div style="width: 41.66%;">: ${sortedRapatList.length}</div>
				</div>
			</div>
			
			<!-- Tabel Daftar Hadir -->
			<table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 40px; background-color: #ffffff; border: 1px solid #000000;">
				<thead>
					<tr>
						<th style="border: 1px solid #000000; padding: 8px; text-align: center; width: 10%; color: #000000; background-color: #ffffff; font-weight: bold;">NO</th>
						<th style="border: 1px solid #000000; padding: 8px; text-align: center; width: 30%; color: #000000; background-color: #ffffff; font-weight: bold;">NAMA</th>
						<th style="border: 1px solid #000000; padding: 8px; text-align: center; width: 30%; color: #000000; background-color: #ffffff; font-weight: bold;">NRP/INSTANSI/JABATAN</th>
						<th style="border: 1px solid #000000; padding: 8px; text-align: center; width: 30%; color: #000000; background-color: #ffffff; font-weight: bold;" colspan="2">HADIR</th>
					</tr>
				</thead>
				<tbody>
					${sortedRapatList
						.map(
							(rapat, index) => `
						<tr style="background-color: #ffffff;">
							<td style="border: 1px solid #000000; padding: 8px; text-align: left; vertical-align: middle; color: #000000; background-color: #ffffff;">${
								index + 1
							}</td>
							<td style="border: 1px solid #000000; padding: 8px; text-align: left; vertical-align: middle; color: #000000; background-color: #ffffff;">${
								rapat.nama
							}</td>
							<td style="border: 1px solid #000000; padding: 8px; text-align: left; vertical-align: middle; color: #000000; background-color: #ffffff;">${rapat.instansi.toUpperCase()}</td>
							<td style="border: 1px solid #000000; padding: 8px; text-align: left; vertical-align: middle; color: #000000; background-color: #ffffff; width: 15%;">
								${
									(index + 1) % 2 !== 0 && rapat.tanda_tangan
										? `${index + 1}<img src="${
												rapat.tanda_tangan
										  }" style="width: 80px; height: 50px; object-fit: contain;" crossorigin="anonymous" />`
										: ""
								}
							</td>
							<td style="border: 1px solid #000000; padding: 8px; text-align: left; vertical-align: middle; color: #000000; background-color: #ffffff; width: 15%;">
								${
									(index + 1) % 2 === 0 && rapat.tanda_tangan
										? `${index + 1}<img src="${
												rapat.tanda_tangan
										  }" style="width: 80px; height: 50px; object-fit: contain;" crossorigin="anonymous" />`
										: ""
								}
							</td>
						</tr>
					`
						)
						.join("")}
				</tbody>
			</table>
			
			<!-- Footer -->
			<div style="margin-top: 60px; padding-top: 15px;">
				<div style="display: flex; width: 100%;">
					<div style="width: 50%; text-align: center; font-size: 12px;">
						Mengetahui<br>
						KEPALA RUMAH SAKIT BHAYANGKARA TK.III NGANJUK<br><br><br><br><br>
						drg. WAHYU ARI PRANANTO, M.A.R.S.<br>
						<span style="text-decoration: overline;">AJUN KOMISARIS BESAR POLISI NRP 76030927</span>
					</div>
					<div style="width: 50%; text-align: center; font-size: 12px;">
						PEMIMPIN ACARA<br>
						<br><br><br><br><br>
						........................................<br>
					</div>
				</div>
			</div>
		</div>
	`;
};

export const exportToPDF = async (filterDate, rapatList) => {
	// Urutkan data berdasarkan kolom urutan sebelum dikirim ke fungsi generateDaftarHadirHTML
	const sortedRapatList = sortRapatList(rapatList);

	try {
		// Import libraries
		const html2canvas = (await import("html2canvas")).default;
		const { jsPDF } = await import("jspdf");

		// Buat element HTML untuk daftar hadir
		const element = document.createElement("div");
		element.innerHTML = generateDaftarHadirHTML(filterDate, sortedRapatList);

		// Style element untuk PDF
		element.style.position = "absolute";
		element.style.left = "-9999px";
		element.style.top = "0px";
		element.style.width = "210mm";
		element.style.backgroundColor = "#ffffff";
		element.style.padding = "20px";
		element.style.fontFamily = "Arial, sans-serif";

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
		const fileName = `Daftar_Hadir_${moment(filterDate).format(
			"YYYY-MM-DD"
		)}.pdf`;
		pdf.save(fileName);
	} catch (error) {
		console.error("Error generating PDF:", error);

		// Fallback: buka window print
		try {
			await openPrintWindow(filterDate, sortedRapatList);
		} catch (fallbackError) {
			console.error("Print fallback failed:", fallbackError);
			alert(
				"Terjadi kesalahan saat membuat PDF. Silakan coba refresh halaman atau gunakan print browser (Ctrl+P)."
			);
		}
	}
};

export const openPrintWindow = async (filterDate, rapatList) => {
	// Urutkan data berdasarkan kolom urutan sebelum dikirim ke fungsi generatePrintHTML
	const sortedRapatList = sortRapatList(rapatList);

	// Buat window baru untuk print
	const printWindow = window.open("", "_blank");

	if (!printWindow) {
		alert("Popup diblokir. Silakan izinkan popup untuk export PDF.");
		return;
	}

	const htmlContent = generatePrintHTML(filterDate, sortedRapatList);

	printWindow.document.write(htmlContent);
	printWindow.document.close();

	// Tunggu load kemudian print
	printWindow.onload = () => {
		setTimeout(() => {
			printWindow.print();
			printWindow.close();
		}, 500);
	};
};
