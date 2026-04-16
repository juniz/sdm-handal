"use client";

const formatDate = (dateString) => {
	if (!dateString) return "-";
	const d = new Date(dateString);
	if (isNaN(d.getTime())) return dateString;
	const day = String(d.getDate()).padStart(2, "0");
	const month = String(d.getMonth() + 1).padStart(2, "0");
	const year = d.getFullYear();
	return `${day}-${month}-${year}`;
};

const formatRp = (num) => {
	if (!num) return "0,00";
	return new Intl.NumberFormat("id-ID", { minimumFractionDigits: 2 }).format(
		num
	);
};

export const printCVReport = async () => {
	try {
		// Import libraries
		const { jsPDF } = await import("jspdf");
		const { default: autoTable } = await import("jspdf-autotable");

		const response = await fetch(`/api/profile/print-cv`);
		const result = await response.json();

		if (result.status !== "success") {
			throw new Error(result.error || "Gagal mengambil data profil");
		}

		const {
			pegawai,
			jabatan,
			pendidikan,
			seminar,
			penghargaan,
			gaji,
		} = result.data;

		// Create PDF (portrait A4)
		const pdf = new jsPDF({
			orientation: "p",
			unit: "mm",
			format: "a4",
			compress: true,
		});

		pdf.setFont("helvetica", "normal");

		// Constants for colors matches CSS template
		const primaryColor = [26, 58, 92]; // var(--primary) #1a3a5c
		const lightBlue = [232, 241, 249]; // var(--light-blue) #e8f1f9
		const sectionBg = [240, 246, 252]; // var(--section-bg) #f0f6fc

		// --- Header ---
		pdf.setFontSize(16);
		pdf.setFont("helvetica", "bold");
		pdf.setTextColor(...primaryColor);
		pdf.text("DAFTAR RIWAYAT HIDUP", pdf.internal.pageSize.width / 2, 20, {
			align: "center",
		});
		pdf.setLineWidth(0.6);
		pdf.setDrawColor(...primaryColor);
		const textWidth = pdf.getTextWidth("DAFTAR RIWAYAT HIDUP");
		pdf.line(
			(pdf.internal.pageSize.width - textWidth) / 2,
			22,
			(pdf.internal.pageSize.width + textWidth) / 2,
			22
		);

		// --- 1. Identitas Pegawai ---
		autoTable(pdf, {
			startY: 32,
			body: [
				["NIP", pegawai.nik || "-"],
				["NAMA", pegawai.nama || "-"],
				["JENIS KELAMIN", pegawai.jk || "-"],
				["JABATAN", pegawai.jbtn || "-"],
				["TTL", `${pegawai.tmp_lahir}, ${formatDate(pegawai.tgl_lahir)}`],
			],
			theme: "grid",
			columnStyles: {
				0: {
					cellWidth: 40,
					fillColor: lightBlue,
					fontStyle: "bold",
					textColor: [90, 110, 130],
					fontSize: 9,
				},
				1: {
					fontStyle: "bold",
					textColor: [26, 37, 51],
					fontSize: 10,
				},
			},
			styles: {
				cellPadding: 4,
				lineColor: [197, 216, 236], // border color
			},
			margin: { left: 15, right: 15 },
		});

		let finalY = pdf.lastAutoTable.finalY + 12;

		const printSectionTitle = (title) => {
			if (finalY + 20 > pdf.internal.pageSize.height) {
				pdf.addPage();
				finalY = 20;
			}
			pdf.setFontSize(11);
			pdf.setFont("helvetica", "bold");
			pdf.setTextColor(...primaryColor);
			
			// Custom stripe box
			pdf.setFillColor(46, 109, 164); // accent color
			pdf.rect(15, finalY - 4, 3, 5, 'F');
			pdf.text(title.toUpperCase(), 20, finalY);
			finalY += 5;
		};

		const tableOpts = {
			theme: "striped",
			headStyles: {
				fillColor: primaryColor,
				textColor: [255, 255, 255],
				fontSize: 9,
				cellPadding: 3,
				fontStyle: "bold",
				halign: "left"
			},
			bodyStyles: {
				fontSize: 9,
				textColor: [26, 37, 51]
			},
			alternateRowStyles: {
				fillColor: sectionBg
			},
			margin: { left: 15, right: 15 },
			didDrawPage: (data) => {
				finalY = data.cursor.y;
			}
		};

		// --- 2. Riwayat Jabatan ---
		if (jabatan && jabatan.length > 0) {
			printSectionTitle("Riwayat Jabatan");
			autoTable(pdf, {
				...tableOpts,
				startY: finalY,
				columns: [
					{ header: "No", dataKey: "no" },
					{ header: "Jabatan", dataKey: "jabatan" },
					{ header: "Tanggal SK", dataKey: "tgl_sk" },
				],
				columnStyles: {
					no: { halign: "center", cellWidth: 15 },
					tgl_sk: { cellWidth: 40 }
				},
				body: jabatan.map((j, i) => ({
					no: i + 1,
					jabatan: j.jabatan,
					tgl_sk: formatDate(j.tgl_sk),
				})),
			});
			finalY = pdf.lastAutoTable.finalY + 12;
		}

		// --- 3. Riwayat Pendidikan ---
		if (pendidikan && pendidikan.length > 0) {
			printSectionTitle("Riwayat Pendidikan");
			autoTable(pdf, {
				...tableOpts,
				startY: finalY,
				columns: [
					{ header: "No", dataKey: "no" },
					{ header: "Pendidikan", dataKey: "pendidikan" },
					{ header: "Sekolah / Perguruan Tinggi", dataKey: "sekolah" },
					{ header: "Tahun Lulus", dataKey: "thn" },
				],
				columnStyles: {
					no: { halign: "center", cellWidth: 15 },
					pendidikan: { cellWidth: 35 },
					thn: { cellWidth: 35 }
				},
				body: pendidikan.map((p, i) => ({
					no: i + 1,
					pendidikan: p.pendidikan,
					sekolah: p.sekolah,
					thn: p.thn_lulus,
				})),
			});
			finalY = pdf.lastAutoTable.finalY + 12;
		}

		// --- 4. Riwayat Seminar & Pelatihan ---
		if (seminar && seminar.length > 0) {
			printSectionTitle("Riwayat Seminar & Pelatihan");
			autoTable(pdf, {
				...tableOpts,
				startY: finalY,
				columns: [
					{ header: "No", dataKey: "no" },
					{ header: "Nama Kegiatan", dataKey: "nama" },
					{ header: "Tanggal", dataKey: "tgl" },
					{ header: "Penyelenggara", dataKey: "penyelenggara" },
					{ header: "Tempat", dataKey: "tempat" },
				],
				columnStyles: {
					no: { halign: "center", cellWidth: 10 },
					tgl: { cellWidth: 25 },
					tempat: { cellWidth: 30 }
				},
				body: seminar.map((s, i) => ({
					no: i + 1,
					nama: s.nama_seminar,
					tgl: formatDate(s.mulai),
					penyelenggara: s.penyelengara,
					tempat: s.tempat,
				})),
			});
			finalY = pdf.lastAutoTable.finalY + 12;
		}

		// --- 5. Riwayat Penghargaan ---
		if (penghargaan && penghargaan.length > 0) {
			printSectionTitle("Riwayat Penghargaan");
			autoTable(pdf, {
				...tableOpts,
				startY: finalY,
				columns: [
					{ header: "No", dataKey: "no" },
					{ header: "Nama Penghargaan", dataKey: "nama" },
					{ header: "Tanggal", dataKey: "tgl" },
					{ header: "Instansi", dataKey: "instansi" },
					{ header: "Pejabat Pemberi", dataKey: "pejabat" },
				],
				columnStyles: {
					no: { halign: "center", cellWidth: 10 },
					tgl: { cellWidth: 25 },
					pejabat: { cellWidth: 35 }
				},
				body: penghargaan.map((p, i) => ({
					no: i + 1,
					nama: p.nama_penghargaan,
					tgl: formatDate(p.tanggal),
					instansi: p.instansi,
					pejabat: p.pejabat_pemberi,
				})),
			});
			finalY = pdf.lastAutoTable.finalY + 12;
		}

		// --- 6. Riwayat Kenaikan Gaji ---
		if (gaji && gaji.length > 0) {
			printSectionTitle("Riwayat Kenaikan Gaji Berkala");
			autoTable(pdf, {
				...tableOpts,
				startY: finalY,
				columns: [
					{ header: "No", dataKey: "no" },
					{ header: "Pangkat / Jabatan", dataKey: "pangkat" },
					{ header: "Gaji Pokok (Rp)", dataKey: "gapok" },
					{ header: "No. SK", dataKey: "noksk" },
					{ header: "Tanggal SK", dataKey: "tglsk" },
				],
				columnStyles: {
					no: { halign: "center", cellWidth: 10 },
					gapok: { cellWidth: 35 },
					tglsk: { cellWidth: 25 }
				},
				body: gaji.map((g, i) => ({
					no: i + 1,
					pangkat: g.pangkatjabatan,
					gapok: formatRp(g.gapok),
					noksk: g.no_sk,
					tglsk: formatDate(g.tgl_sk),
				})),
			});
			finalY = pdf.lastAutoTable.finalY + 12;
		}

		// --- 7. Signature Block ---
		const signatureHeight = 40;
		if (finalY + signatureHeight > pdf.internal.pageSize.height) {
			pdf.addPage();
			finalY = 20;
		}
		
		pdf.setFontSize(10);
		pdf.setFont("helvetica", "normal");
		pdf.setTextColor(26, 37, 51);
		
		const signatureAreaWidth = 60;
		const centerX = pdf.internal.pageSize.width - 15 - (signatureAreaWidth / 2);

		pdf.text("Nganjuk, .................................", centerX, finalY + 5, { align: "center" });

		pdf.setFont("helvetica", "bold");
		pdf.text(`( ${pegawai.nama} )`, centerX, finalY + 36, { align: "center" });

		// Bottom colored band for premium touch
		const pageHeight = pdf.internal.pageSize.height;
		pdf.setFillColor(...primaryColor);
		pdf.rect(0, pageHeight - 2, pdf.internal.pageSize.width, 2, 'F');

		// Download PDF directly
		pdf.save(`CV_${pegawai.nama.replace(/\s+/g, "_")}.pdf`);
	} catch (error) {
		console.error("Error generating CV PDF with autoTable:", error);
		throw error;
	}
};
