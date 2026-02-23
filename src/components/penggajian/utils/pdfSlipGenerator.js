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
					font-family: "Arial Narrow", Arial, sans-serif;
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
                            ${gajiData.jenis && gajiData.jenis.toString().trim().toUpperCase() === "GAJI" && gajiData.gaji_original ? `
                            <tr>
                                <td>Sisa Gaji (Sebelum Potongan)</td>
                                <td class="text-right">${formatRupiah(gajiData.gaji_original)}</td>
                            </tr>
                            ` : ""}
                            ${gajiData.jenis && gajiData.jenis.toString().trim().toUpperCase() === "GAJI" && gajiData.bpjs_kesehatan_nominal > 0 ? `
                            <tr>
                                <td>Potongan BPJS Kesehatan</td>
                                <td class="text-right" style="color: #d00000;">- ${formatRupiah(gajiData.bpjs_kesehatan_nominal)}</td>
                            </tr>
                            ` : ""}
                            ${gajiData.jenis && gajiData.jenis.toString().trim().toUpperCase() === "GAJI" && gajiData.bpjs_ketenagakerjaan_nominal > 0 ? `
                            <tr>
                                <td>Potongan BPJS Ketenagakerjaan</td>
                                <td class="text-right" style="color: #d00000;">- ${formatRupiah(gajiData.bpjs_ketenagakerjaan_nominal)}</td>
                            </tr>
                            ` : ""}
							<tr class="total-row" style="background-color: #f0f7ff;">
								<td>TOTAL GAJI (DITERIMA)</td>
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
						<div class="signature-line" style="display: flex; flex-direction: column; align-items: center; min-height: 80px; justify-content: flex-end;">
							${
								gajiData.tanda_tangan
									? `<img src="${gajiData.tanda_tangan}" alt="Tanda Tangan" style="max-height: 70px; margin-bottom: -10px;" />`
									: '<div style="height: 60px;"></div>'
							}
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

// Helper to get PDF Blob
export const getSlipGajiPDFBlob = async (gajiData, pegawaiData) => {
    const { jsPDF } = await import("jspdf");
    
    // We'll use the DIRECT generation logic for consistency and quality
    // similar to PrintGajiReport.js
    
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const formatBulanIndo = (bulan) => {
        const bulanNama = ["", "JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI", "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"];
        return bulanNama[bulan] || "";
    };

    const formatTanggalIndo = (tanggal) => {
        const bulan = ["", "JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI", "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"];
        const date = new Date(tanggal);
        return `${date.getDate()} ${bulan[date.getMonth() + 1]} ${date.getFullYear()}`;
    };

    const formatRupiah = (angka) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(angka);
    };

    let y = 20;

    // Logo
    try {
        const logoResponse = await fetch("/logo.png");
        if (logoResponse.ok) {
            const logoBlob = await logoResponse.blob();
            const logoBase64 = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(logoBlob);
            });
            pdf.addImage(logoBase64, "PNG", 20, y - 5, 20, 20);
        }
    } catch (e) { console.warn("Logo failed", e); }

    const headerX = pageWidth / 2 + 10;
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text("POLRI DAERAH JAWA TIMUR", headerX, y, { align: "center" });
    y += 7;
    pdf.setFontSize(12);
    pdf.text("BIDANG KEDOKTERAN DAN KESEHATAN", headerX, y, { align: "center" });
    y += 7;
    pdf.setFontSize(11);
    pdf.text("RUMAH SAKIT BHAYANGKARA TK. III NGANJUK", headerX, y, { align: "center" });
    y += 8;
    pdf.setLineWidth(0.5);
    pdf.line(20, y, pageWidth - 20, y);
    y += 15;

    // Title
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text("SLIP GAJI", pageWidth / 2, y, { align: "center" });
    y += 10;
    pdf.setFontSize(11);
    pdf.text(`Periode: ${formatBulanIndo(gajiData.periode_bulan)} ${gajiData.periode_tahun}`, pageWidth / 2, y, { align: "center" });
    y += 15;

    // Info
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

    // Table
    const col1Width = 60;
    const col2Width = pageWidth - 40 - col1Width;
    pdf.setFillColor(240, 240, 240);
    pdf.rect(leftMargin, y, col1Width, 10, "F");
    pdf.rect(leftMargin + col1Width, y, col2Width, 10, "F");
    pdf.setDrawColor(0);
    pdf.rect(leftMargin, y, col1Width, 10);
    pdf.rect(leftMargin + col1Width, y, col2Width, 10);
    pdf.setFont("helvetica", "bold");
    pdf.text("Keterangan", leftMargin + col1Width / 2, y + 7, { align: "center" });
    pdf.text("Jumlah", leftMargin + col1Width + col2Width / 2, y + 7, { align: "center" });
    y += 10;

    pdf.rect(leftMargin, y, col1Width, 10);
    pdf.rect(leftMargin + col1Width, y, col2Width, 10);
    pdf.setFont("helvetica", "normal");
    pdf.text("Jenis", leftMargin + 3, y + 7);
    pdf.text(gajiData.jenis || "-", leftMargin + col1Width + 3, y + 7);
    y += 10;

    if (gajiData.jenis && gajiData.jenis.toString().trim().toUpperCase() === "GAJI") {
        if (gajiData.gaji_original) {
            pdf.rect(leftMargin, y, col1Width, 10);
            pdf.rect(leftMargin + col1Width, y, col2Width, 10);
            pdf.text("Sisa Gaji (Awal)", leftMargin + 3, y + 7);
            pdf.text(formatRupiah(gajiData.gaji_original), leftMargin + col1Width + col2Width - 3, y + 7, { align: "right" });
            y += 10;
        }
        if (gajiData.bpjs_kesehatan_nominal > 0) {
            pdf.rect(leftMargin, y, col1Width, 10);
            pdf.rect(leftMargin + col1Width, y, col2Width, 10);
            pdf.setTextColor(200, 0, 0);
            pdf.text("Pot. BPJS Kesehatan", leftMargin + 3, y + 7);
            pdf.text("- " + formatRupiah(gajiData.bpjs_kesehatan_nominal), leftMargin + col1Width + col2Width - 3, y + 7, { align: "right" });
            pdf.setTextColor(0, 0, 0);
            y += 10;
        }
        if (gajiData.bpjs_ketenagakerjaan_nominal > 0) {
            pdf.rect(leftMargin, y, col1Width, 10);
            pdf.rect(leftMargin + col1Width, y, col2Width, 10);
            pdf.setTextColor(200, 0, 0);
            pdf.text("Pot. BPJS TK", leftMargin + 3, y + 7);
            pdf.text("- " + formatRupiah(gajiData.bpjs_ketenagakerjaan_nominal), leftMargin + col1Width + col2Width - 3, y + 7, { align: "right" });
            pdf.setTextColor(0, 0, 0);
            y += 10;
        }
    }

    pdf.setFillColor(240, 247, 255);
    pdf.rect(leftMargin, y, col1Width, 10, "FD");
    pdf.rect(leftMargin + col1Width, y, col2Width, 10, "FD");
    pdf.setFont("helvetica", "bold");
    pdf.text("TOTAL GAJI (DITERIMA)", leftMargin + 3, y + 7);
    pdf.text(formatRupiah(gajiData.gaji), leftMargin + col1Width + col2Width - 3, y + 7, { align: "right" });
    y += 25;

    // Footer
    const footerY = y + 20;
    const colWidth = (pageWidth - 40) / 2;
    pdf.setFont("helvetica", "normal");
    pdf.text(`Nganjuk, ${formatTanggalIndo(new Date())}`, leftMargin + colWidth / 2, footerY, { align: "center" });
    pdf.text("Yang Menerima", leftMargin + colWidth / 2, footerY + 10, { align: "center" });

    if (gajiData.tanda_tangan) {
        try {
            pdf.addImage(gajiData.tanda_tangan, "PNG", leftMargin + colWidth / 2 - 15, footerY + 15, 30, 30);
        } catch (e) { console.warn("Signature failed", e); }
    }

    pdf.line(leftMargin + 10, footerY + 50, leftMargin + colWidth - 10, footerY + 50);
    pdf.text(pegawaiData.nama || "", leftMargin + colWidth / 2, footerY + 55, { align: "center" });

    pdf.text("Mengetahui", leftMargin + colWidth + colWidth / 2, footerY, { align: "center" });
    pdf.text("KEPALA RUMAH SAKIT", leftMargin + colWidth + colWidth / 2, footerY + 10, { align: "center" });
    pdf.line(leftMargin + colWidth + 10, footerY + 50, leftMargin + colWidth + colWidth - 10, footerY + 50);
    pdf.setFontSize(10);
    pdf.text("drg. WAHYU ARI PRANANTO, M.A.R.S.", leftMargin + colWidth + colWidth / 2, footerY + 55, { align: "center" });
    pdf.setFontSize(9);
    pdf.text("AJUN KOMISARIS BESAR POLISI NRP 76030927", leftMargin + colWidth + colWidth / 2, footerY + 60, { align: "center" });

    return pdf.output('blob');
};

export const generateSlipGajiPDF = async (gajiData, pegawaiData) => {
	try {
		const blob = await getSlipGajiPDFBlob(gajiData, pegawaiData);
		const url = URL.createObjectURL(blob);
		const fileName = `Slip_Gaji_${pegawaiData.nik}_${gajiData.periode_bulan}_${gajiData.periode_tahun}.pdf`;
		
		const link = document.createElement('a');
		link.href = url;
		link.download = fileName;
		link.click();
		URL.revokeObjectURL(url);
	} catch (error) {
		console.error("Error generating PDF:", error);
		alert("Gagal generate PDF.");
	}
};

