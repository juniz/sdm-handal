import moment from "moment-timezone";

export const generatePrintHTML = (filterDate, rapatList) => {
	const tanggalFormatted = moment(filterDate).format("DD MMMM YYYY");
	const hariFormatted = moment(filterDate).format("dddd").toUpperCase();
	const namaRapat = rapatList.length > 0 ? rapatList[0].rapat : "";

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
			<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.0-beta1/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-0evHe/X+R7YkIZDRvuzKMRqM+OrBnVFBL6DOitfPri4tjfHxaWutUpFmBp4vmVor" crossorigin="anonymous">
			<style>
				html, body {
					width: 210mm;
					height: 297mm;
				}
				table {
					page-break-inside: auto;
				}
				tr {
					page-break-inside: avoid;
					page-break-after: auto;
				}
				thead {
					display: table-header-group;
				}
				tfoot {
					display: table-footer-group;
				}
				@media print {
					@page { 
						margin: 15mm; 
						size: A4; 
					}
					body { 
						margin: 0; 
						-webkit-print-color-adjust: exact;
						print-color-adjust: exact;
					}
				}
			</style>
		</head>
		<body class="fw-bold">
			<div class="row">
				<div class="col-5 text-center fw-bold" style="font-size:12px;">
					POLRI DAERAH JAWA TIMUR<br>
					BIDANG KEDOKTERAN DAN KESEHATAN<br>
					<u>RUMAH SAKIT BHAYANGKARA TK. III NGANJUK</u>
				</div>
				<div class="col"></div>
				<div class="col"></div>
			</div>
			<div class="row p-3" style="font-size:12px;">
				<div class="col-12 text-center">DAFTAR HADIR</div>
			</div>
			<div class="row" style="font-size:12px;">
				<div class="col-2">HARI</div>
				<div class="col-4">: ${hariFormatted}</div>
				<div class="col-1">ACARA</div>
				<div class="col-5">: .......................................................</div>
			</div>
			<div class="row" style="font-size:12px;">
				<div class="col-2">TANGGAL</div>
				<div class="col-4">: ${formatTanggalIndo(filterDate)}</div>
				<div class="col-1">JUMLAH</div>
				<div class="col-5">: ${rapatList.length}</div>
			</div>
			<div class="row pt-3">
				<div class="col-12">
					<table class="table table-bordered border-dark" style="font-size:12px;">
						<thead>
							<tr>
								<th class="text-center" style="width:10%">NO</th>
								<th class="text-center" style="width:30%">NAMA</th>
								<th class="text-center" style="width:30%">NRP/INSTANSI/JABATAN</th>
								<th class="text-center" colspan="2" style="width:30%">HADIR</th>
							</tr>
						</thead>
						<tbody>
							${rapatList
								.map(
									(rapat, index) => `
								<tr>
									<td>${index + 1}</td>
									<td>${rapat.nama.toUpperCase()}</td>
									<td>${rapat.instansi.toUpperCase()}</td>
									<td style="width:15%">
										${
											(index + 1) % 2 !== 0 && rapat.tanda_tangan
												? `${index + 1}<img src="${
														rapat.tanda_tangan
												  }" width="80" height="50"/>`
												: ""
										}
									</td>
									<td style="width:15%">
										${
											(index + 1) % 2 === 0 && rapat.tanda_tangan
												? `${index + 1}<img src="${
														rapat.tanda_tangan
												  }" width="80" height="50"/>`
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
				<div class="col-6 text-center" style="font-size:12px;">
					Mengetahui<br>
					KEPALA RUMAH SAKIT BHAYANGKARA TK.III NGANJUK<br><br><br><br><br>
					dr. LUSIANTO MADYO NUGROHO M.M.Kes<br>
					<span style="text-decoration:overline">AJUN KOMISARIS BESAR POLISI NRP 72010480</span>
				</div>
				<div class="col-6 text-center" style="font-size:12px;">
					PEMIMPIN ACARA<br>
					<br><br><br><br><br>
					........................................<br>
				</div>
			</div>
			<script>
				window.print();
			</script>
			<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.2.0-beta1/dist/js/bootstrap.bundle.min.js" integrity="sha384-pprn3073KE6tl6bjs2QrFaJGz5/SUsLqktiwsUTF55Jfv3qYSDhgCecCxMW52nD2" crossorigin="anonymous"></script>
		</body>
		</html>
	`;
};

export const generateDaftarHadirHTML = (filterDate, rapatList) => {
	const hariFormatted = moment(filterDate).format("dddd").toUpperCase();
	const namaRapat = rapatList.length > 0 ? rapatList[0].rapat : "";

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
					<div style="width: 41.66%;">: ${rapatList.length}</div>
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
					${rapatList
						.map(
							(rapat, index) => `
						<tr style="background-color: #ffffff;">
							<td style="border: 1px solid #000000; padding: 8px; text-align: left; vertical-align: middle; color: #000000; background-color: #ffffff;">${
								index + 1
							}</td>
							<td style="border: 1px solid #000000; padding: 8px; text-align: left; vertical-align: middle; color: #000000; background-color: #ffffff;">${rapat.nama.toUpperCase()}</td>
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
						dr. LUSIANTO MADYO NUGROHO M.M.Kes<br>
						<span style="text-decoration: overline;">AJUN KOMISARIS BESAR POLISI NRP 72010480</span>
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
	try {
		// Import libraries
		const html2canvas = (await import("html2canvas")).default;
		const { jsPDF } = await import("jspdf");

		// Buat element HTML untuk daftar hadir
		const element = document.createElement("div");
		element.innerHTML = generateDaftarHadirHTML(filterDate, rapatList);

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
			await openPrintWindow(filterDate, rapatList);
		} catch (fallbackError) {
			console.error("Print fallback failed:", fallbackError);
			alert(
				"Terjadi kesalahan saat membuat PDF. Silakan coba refresh halaman atau gunakan print browser (Ctrl+P)."
			);
		}
	}
};

export const openPrintWindow = async (filterDate, rapatList) => {
	// Buat window baru untuk print
	const printWindow = window.open("", "_blank");

	if (!printWindow) {
		alert("Popup diblokir. Silakan izinkan popup untuk export PDF.");
		return;
	}

	const htmlContent = generatePrintHTML(filterDate, rapatList);

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
