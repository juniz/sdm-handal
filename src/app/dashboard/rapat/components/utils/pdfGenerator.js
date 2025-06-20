import moment from "moment-timezone";

export const generatePrintHTML = (filterDate, rapatList) => {
	const tanggalFormatted = moment(filterDate).format("DD MMMM YYYY");
	const namaRapat = rapatList.length > 0 ? rapatList[0].rapat : "";

	return `
		<!DOCTYPE html>
		<html>
		<head>
			<title>Daftar Hadir - ${tanggalFormatted}</title>
			<style>
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
				body {
					font-family: Arial, sans-serif;
					font-size: 11px;
					line-height: 1.3;
					color: black;
					background: white;
					margin: 0;
					padding: 20px;
				}
				.header {
					text-align: center;
					margin-bottom: 40px;
					font-weight: bold;
					font-size: 12px;
					line-height: 1.3;
				}
				.header div {
					margin-bottom: 2px;
				}
				.header .underline {
					text-decoration: underline;
					margin-bottom: 15px;
				}
				.title {
					text-align: center;
					font-weight: bold;
					font-size: 14px;
					margin-bottom: 40px;
				}
				.info {
					margin-bottom: 25px;
					font-size: 11px;
				}
				.info-table {
					width: 100%;
					border: none;
					border-collapse: collapse;
				}
				.info-table td {
					padding: 3px 0;
					vertical-align: top;
				}
				.main-table {
					width: 100%;
					border-collapse: collapse;
					font-size: 9px;
					margin-bottom: 40px;
				}
				.main-table th,
				.main-table td {
					border: 1px solid black;
					padding: 6px;
					text-align: left;
					vertical-align: middle;
				}
				.main-table th {
					background-color: white;
					text-align: center;
					font-weight: bold;
					padding: 6px;
				}
				.main-table .center {
					text-align: center;
				}
				.main-table .nama-cell {
					font-weight: bold;
					font-size: 9px;
				}
				.signature-cell {
					height: 50px;
					text-align: center;
					position: relative;
					padding: 4px;
				}
				.signature-container {
					position: relative;
					width: 100%;
					height: 100%;
					display: flex;
					align-items: center;
					justify-content: center;
				}
				.signature-number {
					position: absolute;
					top: 2px;
					left: 4px;
					font-size: 8px;
					color: black;
				}
				.signature-img {
					max-width: 60px;
					max-height: 35px;
					object-fit: contain;
					display: block;
				}
				.footer {
					margin-top: 60px;
					font-size: 10px;
				}
				.footer-table {
					width: 100%;
					border: none;
					border-collapse: collapse;
				}
				.footer-left {
					width: 50%;
					text-align: left;
					vertical-align: top;
				}
				.footer-right {
					width: 50%;
					text-align: center;
					vertical-align: top;
				}
				.signature-line {
					border-bottom: 1px dotted black;
					width: 150px;
					margin: 50px auto 0;
				}
				.kepala-rs {
					font-size: 9px;
					margin-bottom: 50px;
				}
				.nama-kepala {
					font-weight: bold;
					font-size: 9px;
					margin-bottom: 3px;
				}
				.nrp-kepala {
					font-size: 8px;
				}
			</style>
		</head>
		<body>
			<div class="header">
				<div>POLRI DAERAH JAWA TIMUR</div>
				<div>BIDANG KEDOKTERAN DAN KESEHATAN</div>
				<div class="underline">RUMAH SAKIT BHAYANGKARA TK. III NGANJUK</div>
			</div>
			
			<div class="title">DAFTAR HADIR</div>
			
			<div class="info">
				<table class="info-table">
					<tr>
						<td style="width: 12%;">HARI</td>
						<td style="width: 38%;">: ${moment(filterDate)
							.format("dddd")
							.toUpperCase()}</td>
						<td style="width: 12%;">ACARA</td>
						<td style="width: 38%;">: ${
							namaRapat.length > 30
								? namaRapat.substring(0, 30) + "..."
								: namaRapat
						}</td>
					</tr>
					<tr>
						<td>TANGGAL</td>
						<td>: ${tanggalFormatted.toUpperCase()}</td>
						<td>JUMLAH</td>
						<td>: ${rapatList.length}</td>
					</tr>
				</table>
			</div>
			
			<table class="main-table">
				<thead>
					<tr>
						<th style="width: 6%;">NO</th>
						<th style="width: 30%;">NAMA</th>
						<th style="width: 44%;">NRP/INSTANSI/JABATAN</th>
						<th style="width: 20%;">HADIR</th>
					</tr>
				</thead>
				<tbody>
					${rapatList
						.map(
							(rapat, index) => `
						<tr>
							<td class="center" style="font-size: 10px;">${index + 1}</td>
							<td class="nama-cell">${rapat.nama.toUpperCase()}</td>
							<td style="font-size: 9px;">${rapat.instansi.toUpperCase()}</td>
							<td class="signature-cell">
								${
									rapat.tanda_tangan
										? `<div class="signature-container">
										<span class="signature-number">${index + 1}</span>
										<img src="${rapat.tanda_tangan}" class="signature-img" />
									</div>`
										: `${index + 1}`
								}
							</td>
						</tr>
					`
						)
						.join("")}
				</tbody>
			</table>
			
			<div class="footer">
				<table class="footer-table">
					<tr>
						<td class="footer-left">
							<div>Mengetahui</div>
							<div class="kepala-rs">KEPALA RUMAH SAKIT BHAYANGKARA TK.III NGANJUK</div>
							<div class="nama-kepala">dr. LUSIANTO MADYO NUGROHO M.M.Kes</div>
							<div class="nrp-kepala">AJUN KOMISARIS BESAR POLISI NRP 72010480</div>
						</td>
						<td class="footer-right">
							<div>PEMIMPIN ACARA</div>
							<div class="signature-line"></div>
						</td>
					</tr>
				</table>
			</div>
		</body>
		</html>
	`;
};

export const generateDaftarHadirHTML = (filterDate, rapatList) => {
	const tanggalFormatted = moment(filterDate).format("DD MMMM YYYY");
	const namaRapat = rapatList.length > 0 ? rapatList[0].rapat : "";

	return `
		<div style="font-family: Arial, sans-serif; padding: 20px; background-color: #ffffff; color: #000000; width: 210mm; min-height: 297mm; box-sizing: border-box;">
			<!-- Header -->
			<div style="text-align: center; margin-bottom: 40px;">
				<div style="font-weight: bold; font-size: 12px; line-height: 1.3; color: #000000;">
					<div style="margin-bottom: 2px;">POLRI DAERAH JAWA TIMUR</div>
					<div style="margin-bottom: 2px;">BIDANG KEDOKTERAN DAN KESEHATAN</div>
					<div style="text-decoration: underline; margin-bottom: 15px;">RUMAH SAKIT BHAYANGKARA TK. III NGANJUK</div>
				</div>
			</div>
			
			<!-- Judul -->
			<div style="text-align: center; font-weight: bold; font-size: 14px; margin-bottom: 40px; color: #000000;">
				DAFTAR HADIR
			</div>
			
			<!-- Info Rapat -->
			<div style="margin-bottom: 25px; font-size: 11px; color: #000000;">
				<table style="width: 100%; border: none; border-collapse: collapse;">
					<tr>
						<td style="width: 12%; padding: 3px 0; color: #000000;">HARI</td>
						<td style="width: 38%; padding: 3px 0; color: #000000;">: ${moment(filterDate)
							.format("dddd")
							.toUpperCase()}</td>
						<td style="width: 12%; padding: 3px 0; color: #000000;">ACARA</td>
						<td style="width: 38%; padding: 3px 0; color: #000000;">: ${
							namaRapat.length > 30
								? namaRapat.substring(0, 30) + "..."
								: namaRapat
						}</td>
					</tr>
					<tr>
						<td style="padding: 3px 0; color: #000000;">TANGGAL</td>
						<td style="padding: 3px 0; color: #000000;">: ${tanggalFormatted.toUpperCase()}</td>
						<td style="padding: 3px 0; color: #000000;">JUMLAH</td>
						<td style="padding: 3px 0; color: #000000;">: ${rapatList.length}</td>
					</tr>
				</table>
			</div>
			
			<!-- Tabel Daftar Hadir -->
			<table style="width: 100%; border-collapse: collapse; font-size: 9px; margin-bottom: 40px; background-color: #ffffff;">
				<thead>
					<tr>
						<th style="border: 1px solid #000000; padding: 6px; text-align: center; width: 6%; color: #000000; background-color: #ffffff; font-weight: bold;">NO</th>
						<th style="border: 1px solid #000000; padding: 6px; text-align: center; width: 30%; color: #000000; background-color: #ffffff; font-weight: bold;">NAMA</th>
						<th style="border: 1px solid #000000; padding: 6px; text-align: center; width: 44%; color: #000000; background-color: #ffffff; font-weight: bold;">NRP/INSTANSI/JABATAN</th>
						<th style="border: 1px solid #000000; padding: 6px; text-align: center; width: 20%; color: #000000; background-color: #ffffff; font-weight: bold;">HADIR</th>
					</tr>
				</thead>
				<tbody>
					${rapatList
						.map(
							(rapat, index) => `
						<tr style="background-color: #ffffff;">
							<td style="border: 1px solid #000000; padding: 8px; text-align: center; vertical-align: middle; color: #000000; background-color: #ffffff; font-size: 10px;">${
								index + 1
							}</td>
							<td style="border: 1px solid #000000; padding: 8px; text-align: left; vertical-align: middle; color: #000000; background-color: #ffffff; font-size: 9px; font-weight: bold;">${rapat.nama.toUpperCase()}</td>
							<td style="border: 1px solid #000000; padding: 8px; text-align: left; vertical-align: middle; color: #000000; background-color: #ffffff; font-size: 9px;">${rapat.instansi.toUpperCase()}</td>
							<td style="border: 1px solid #000000; padding: 4px; text-align: center; vertical-align: middle; height: 50px; color: #000000; background-color: #ffffff; position: relative;">
								${
									rapat.tanda_tangan
										? `<div style="position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
										<span style="position: absolute; top: 2px; left: 4px; font-size: 8px; color: #000000;">${
											index + 1
										}</span>
										<img src="${
											rapat.tanda_tangan
										}" style="max-width: 60px; max-height: 35px; object-fit: contain; display: block;" crossorigin="anonymous" />
									</div>`
										: `<span style="font-size: 10px; color: #000000;">${
												index + 1
										  }</span>`
								}
							</td>
						</tr>
					`
						)
						.join("")}
				</tbody>
			</table>
			
			<!-- Footer -->
			<div style="margin-top: 60px;">
				<table style="width: 100%; border: none; font-size: 10px; border-collapse: collapse;">
					<tr>
						<td style="width: 50%; text-align: left; vertical-align: top; color: #000000;">
							<div style="margin-bottom: 8px; color: #000000;">Mengetahui</div>
							<div style="margin-bottom: 50px; color: #000000; font-size: 9px;">KEPALA RUMAH SAKIT BHAYANGKARA TK.III NGANJUK</div>
							<div style="font-weight: bold; margin-bottom: 3px; color: #000000; font-size: 9px;">dr. LUSIANTO MADYO NUGROHO M.M.Kes</div>
							<div style="color: #000000; font-size: 8px;">AJUN KOMISARIS BESAR POLISI NRP 72010480</div>
						</td>
						<td style="width: 50%; text-align: center; vertical-align: top; color: #000000;">
							<div style="margin-bottom: 8px; color: #000000;">PEMIMPIN ACARA</div>
							<div style="margin-bottom: 50px;"></div>
							<div style="border-bottom: 1px dotted #000000; width: 150px; margin: 0 auto;"></div>
						</td>
					</tr>
				</table>
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
