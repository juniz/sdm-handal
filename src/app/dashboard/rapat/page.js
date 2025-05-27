"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
	Calendar,
	Users,
	Building2,
	FileText,
	Pencil,
	Trash2,
	Plus,
	X,
	CheckCircle,
	AlertCircle,
	Search,
	Filter,
	ChevronDown,
	ChevronUp,
	Download,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import SignaturePad from "react-signature-canvas";
import moment from "moment-timezone";
import "moment/locale/id";

moment.locale("id");
moment.tz.setDefault("Asia/Jakarta");

const Toast = ({ message, type, onClose }) => (
	<motion.div
		initial={{ opacity: 0, y: 50 }}
		animate={{ opacity: 1, y: 0 }}
		exit={{ opacity: 0, y: 50 }}
		className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg flex items-center space-x-2 ${
			type === "success" ? "bg-green-500" : "bg-red-500"
		} text-white z-50`}
	>
		{type === "success" ? (
			<CheckCircle className="w-5 h-5" />
		) : (
			<AlertCircle className="w-5 h-5" />
		)}
		<span>{message}</span>
		<button onClick={onClose} className="ml-2">
			<X className="w-4 h-4" />
		</button>
	</motion.div>
);

const LoadingSkeleton = () => (
	<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
		{[1, 2, 3, 4, 5, 6].map((i) => (
			<div key={i} className="bg-white rounded-lg p-6 shadow-md animate-pulse">
				<div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
				<div className="space-y-3">
					<div className="flex items-center space-x-2">
						<div className="w-8 h-8 bg-gray-200 rounded"></div>
						<div className="h-4 bg-gray-200 rounded w-1/2"></div>
					</div>
					<div className="flex items-center space-x-2">
						<div className="w-8 h-8 bg-gray-200 rounded"></div>
						<div className="h-4 bg-gray-200 rounded w-2/3"></div>
					</div>
					<div className="flex items-center space-x-2">
						<div className="w-8 h-8 bg-gray-200 rounded"></div>
						<div className="h-4 bg-gray-200 rounded w-1/3"></div>
					</div>
				</div>
				<div className="mt-4 flex justify-end space-x-2">
					<div className="w-8 h-8 bg-gray-200 rounded"></div>
					<div className="w-8 h-8 bg-gray-200 rounded"></div>
				</div>
			</div>
		))}
	</div>
);

const FilterAccordion = ({
	filterDate,
	setFilterDate,
	isOpen,
	setIsOpen,
	onAddClick,
	loading,
	isToday,
	rapatList,
}) => {
	const exportToPDF = async () => {
		try {
			// Import libraries
			const html2canvas = (await import("html2canvas")).default;
			const { jsPDF } = await import("jspdf");

			// Buat element HTML untuk daftar hadir
			const element = document.createElement("div");
			element.innerHTML = generateDaftarHadirHTML();

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
				await openPrintWindow();
			} catch (fallbackError) {
				console.error("Print fallback failed:", fallbackError);
				alert(
					"Terjadi kesalahan saat membuat PDF. Silakan coba refresh halaman atau gunakan print browser (Ctrl+P)."
				);
			}
		}
	};

	const openPrintWindow = async () => {
		// Buat window baru untuk print
		const printWindow = window.open("", "_blank");

		if (!printWindow) {
			alert("Popup diblokir. Silakan izinkan popup untuk export PDF.");
			return;
		}

		const htmlContent = generatePrintHTML();

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

	const generatePrintHTML = () => {
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

	const exportToPDFSimple = async () => {
		// Fungsi ini sekarang tidak diperlukan karena sudah ada fallback print
		await openPrintWindow();
	};

	const generateSimpleDaftarHadirHTML = () => {
		// Fungsi ini sekarang tidak diperlukan
		return generateDaftarHadirHTML();
	};

	const generateDaftarHadirHTML = () => {
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

	return (
		<div className="bg-white rounded-lg shadow-sm overflow-hidden">
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
			>
				<div className="flex items-center gap-2">
					<Filter className="w-4 h-4 text-gray-500" />
					<span className="font-medium text-sm">Filter & Aksi</span>
					{isToday && (
						<span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
							Hari Ini
						</span>
					)}
				</div>
				{isOpen ? (
					<ChevronUp className="w-4 h-4 text-gray-500" />
				) : (
					<ChevronDown className="w-4 h-4 text-gray-500" />
				)}
			</button>

			<AnimatePresence>
				{isOpen && (
					<motion.div
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: "auto", opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						transition={{ duration: 0.2 }}
						className="overflow-hidden"
					>
						<div className="p-4 space-y-4">
							<div>
								<label className="block text-sm text-gray-600 mb-1">
									Tanggal
								</label>
								<input
									type="date"
									value={filterDate}
									onChange={(e) => setFilterDate(e.target.value)}
									className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
								/>
							</div>
							<div className="border-t"></div>
							<div className="flex flex-col gap-2">
								<button
									onClick={onAddClick}
									className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm w-full"
									disabled={loading}
								>
									<Plus className="w-4 h-4" />
									<span>Tambah Rapat</span>
								</button>

								{rapatList.length > 0 && (
									<button
										onClick={exportToPDF}
										className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm w-full"
										disabled={loading}
									>
										<Download className="w-4 h-4" />
										<span>Export PDF</span>
									</button>
								)}

								{!isToday && (
									<button
										onClick={() => setFilterDate(moment().format("YYYY-MM-DD"))}
										className="text-sm text-blue-500 hover:text-blue-600 px-4 py-2 rounded-lg border border-blue-500 hover:border-blue-600 transition-colors w-full flex items-center justify-center gap-2"
									>
										<Calendar className="w-4 h-4" />
										<span>Tampilkan Hari Ini</span>
									</button>
								)}
							</div>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
};

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

const RapatCard = ({ rapat, onEdit, onDelete }) => (
	<motion.div
		initial={{ opacity: 0, y: 20 }}
		animate={{ opacity: 1, y: 0 }}
		className="bg-white rounded-lg p-4 shadow-sm"
	>
		<div className="flex items-start justify-between">
			<div className="flex items-center gap-2">
				<Calendar className="w-5 h-5 text-blue-500" />
				<span className="font-medium">{rapat.tanggal}</span>
			</div>
			<div className="flex gap-2">
				<button
					onClick={() => onEdit(rapat)}
					className="p-1 text-gray-500 hover:text-blue-500"
					title="Edit"
				>
					<Pencil className="w-4 h-4" />
				</button>
				<button
					onClick={() => onDelete(rapat.id)}
					className="p-1 text-gray-500 hover:text-red-500"
					title="Hapus"
				>
					<Trash2 className="w-4 h-4" />
				</button>
			</div>
		</div>
		<div className="mt-3 space-y-2">
			<div className="flex items-start gap-2">
				<FileText className="w-5 h-5 text-gray-400 mt-1" />
				<div>
					<p className="font-medium">{rapat.rapat}</p>
				</div>
			</div>
			<div className="flex items-center gap-2">
				<Users className="w-5 h-5 text-gray-400" />
				<span>{rapat.nama}</span>
			</div>
			<div className="flex items-center gap-2">
				<Building2 className="w-5 h-5 text-gray-400" />
				<span>{rapat.instansi}</span>
			</div>
			{rapat.tanda_tangan && (
				<div className="mt-3">
					<SignatureImage base64Data={rapat.tanda_tangan} />
				</div>
			)}
		</div>
	</motion.div>
);

const RapatPage = () => {
	const [rapatList, setRapatList] = useState([]);
	const [loading, setLoading] = useState(true);
	const [showModal, setShowModal] = useState(false);
	const [modalMode, setModalMode] = useState("add");
	const [selectedRapat, setSelectedRapat] = useState(null);
	const [filterDate, setFilterDate] = useState(moment().format("YYYY-MM-DD"));
	const [isFilterOpen, setIsFilterOpen] = useState(false);
	const [isToday, setIsToday] = useState(true);
	const [formData, setFormData] = useState({
		tanggal: moment().format("YYYY-MM-DD"),
		rapat: "",
		nama: "",
		instansi: "",
	});
	const signPadRef = useRef(null);
	const [errors, setErrors] = useState({});
	const [toast, setToast] = useState({
		show: false,
		message: "",
		type: "success",
	});

	// Fetch data rapat
	const fetchRapat = async (date = filterDate) => {
		setLoading(true);
		try {
			const response = await fetch(`/api/rapat?tanggal=${date}`);
			const data = await response.json();

			if (data.status === "success") {
				setRapatList(data.data);
				setIsToday(data.metadata?.filter?.isToday ?? false);
			} else {
				showToast(data.error || "Gagal mengambil data rapat", "error");
			}
		} catch (error) {
			console.error("Error fetching rapat:", error);
			showToast("Terjadi kesalahan saat mengambil data", "error");
		} finally {
			setLoading(false);
		}
	};

	// Effect untuk fetch data awal
	useEffect(() => {
		fetchRapat();
	}, []);

	// Effect untuk fetch data saat filter berubah
	useEffect(() => {
		fetchRapat(filterDate);
	}, [filterDate]);

	const validateForm = () => {
		const newErrors = {};

		if (!formData.tanggal) {
			newErrors.tanggal = "Tanggal harus diisi";
		}

		if (!formData.rapat || formData.rapat.trim().length < 3) {
			newErrors.rapat = "Nama rapat minimal 3 karakter";
		}

		if (!formData.nama || formData.nama.trim().length < 3) {
			newErrors.nama = "Nama peserta minimal 3 karakter";
		}

		if (!formData.instansi || formData.instansi.trim().length < 2) {
			newErrors.instansi = "Nama instansi minimal 2 karakter";
		}

		if (!signPadRef.current || signPadRef.current.isEmpty()) {
			newErrors.tanda_tangan = "Tanda tangan harus diisi";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const showToast = (message, type = "success") => {
		setToast({ show: true, message, type });
		setTimeout(
			() => setToast({ show: false, message: "", type: "success" }),
			3000
		);
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (!validateForm()) {
			showToast("Mohon lengkapi semua field dengan benar", "error");
			return;
		}

		setLoading(true);

		try {
			// Ambil data tanda tangan
			const tanda_tangan = signPadRef.current
				? signPadRef.current.toDataURL()
				: null;

			const method = modalMode === "add" ? "POST" : "PUT";
			const url = "/api/rapat";
			const body = {
				...formData,
				tanda_tangan,
			};

			if (modalMode === "edit") {
				body.id = selectedRapat.id;
			}

			const response = await fetch(url, {
				method,
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(body),
			});

			const data = await response.json();

			if (data.status === "success") {
				setShowModal(false);
				fetchRapat();
				resetForm();
				showToast(
					modalMode === "add"
						? "Data rapat berhasil ditambahkan"
						: "Data rapat berhasil diperbarui"
				);
			}
		} catch (error) {
			console.error("Error submitting rapat:", error);
			showToast("Terjadi kesalahan saat menyimpan data", "error");
		} finally {
			setLoading(false);
		}
	};

	const handleDelete = async (id) => {
		if (!confirm("Apakah Anda yakin ingin menghapus data rapat ini?")) return;

		setLoading(true);
		try {
			const response = await fetch("/api/rapat", {
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ id }),
			});

			const data = await response.json();

			if (data.status === "success") {
				fetchRapat();
				showToast("Data rapat berhasil dihapus");
			}
		} catch (error) {
			console.error("Error deleting rapat:", error);
			showToast("Terjadi kesalahan saat menghapus data", "error");
		} finally {
			setLoading(false);
		}
	};

	const handleEdit = (rapat) => {
		setSelectedRapat(rapat);
		setFormData({
			tanggal: moment(rapat.tanggal, "DD MMMM YYYY").format("YYYY-MM-DD"),
			rapat: rapat.rapat,
			nama: rapat.nama,
			instansi: rapat.instansi,
		});
		setModalMode("edit");
		setShowModal(true);
	};

	const resetForm = () => {
		setFormData({
			tanggal: moment().format("YYYY-MM-DD"),
			rapat: "",
			nama: "",
			instansi: "",
		});
		if (signPadRef.current) {
			signPadRef.current.clear();
		}
		setSelectedRapat(null);
		setModalMode("add");
	};

	const handleAddClick = () => {
		resetForm();
		setShowModal(true);
		setIsFilterOpen(false); // Tutup accordion setelah klik tambah
	};

	const RapatModal = () => {
		const [isSubmitting, setIsSubmitting] = useState(false);

		const handleModalSubmit = async (e) => {
			e.preventDefault();

			if (!validateForm()) {
				showToast("Mohon lengkapi semua field dengan benar", "error");
				return;
			}

			setIsSubmitting(true);
			try {
				const tanda_tangan = signPadRef.current
					? signPadRef.current.toDataURL()
					: null;

				const method = modalMode === "add" ? "POST" : "PUT";
				const url = "/api/rapat";
				const body = {
					...formData,
					tanda_tangan,
				};

				if (modalMode === "edit") {
					body.id = selectedRapat.id;
				}

				const response = await fetch(url, {
					method,
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(body),
				});

				const data = await response.json();

				if (data.status === "success") {
					setShowModal(false);
					fetchRapat();
					resetForm();
					showToast(
						modalMode === "add"
							? "Data rapat berhasil ditambahkan"
							: "Data rapat berhasil diperbarui"
					);
				}
			} catch (error) {
				console.error("Error submitting rapat:", error);
				showToast("Terjadi kesalahan saat menyimpan data", "error");
			} finally {
				setIsSubmitting(false);
			}
		};

		return (
			<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
				<motion.div
					initial={{ scale: 0.9, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					className="bg-white rounded-lg p-6 w-full max-w-lg"
				>
					<h3 className="text-lg font-semibold mb-4">
						{modalMode === "add" ? "Tambah Rapat" : "Edit Rapat"}
					</h3>
					<form onSubmit={handleModalSubmit}>
						<div className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Tanggal
								</label>
								<input
									type="date"
									value={formData.tanggal}
									onChange={(e) =>
										setFormData({ ...formData, tanggal: e.target.value })
									}
									className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
										errors.tanggal ? "border-red-500" : ""
									}`}
									required
								/>
								{errors.tanggal && (
									<p className="text-red-500 text-sm mt-1">{errors.tanggal}</p>
								)}
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Nama Rapat
								</label>
								<input
									type="text"
									value={formData.rapat}
									onChange={(e) =>
										setFormData({ ...formData, rapat: e.target.value })
									}
									className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
									placeholder="Masukkan nama rapat"
									required
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Nama Peserta
								</label>
								<input
									type="text"
									value={formData.nama}
									onChange={(e) =>
										setFormData({ ...formData, nama: e.target.value })
									}
									className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
									placeholder="Masukkan nama peserta"
									required
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Instansi
								</label>
								<input
									type="text"
									value={formData.instansi}
									onChange={(e) =>
										setFormData({ ...formData, instansi: e.target.value })
									}
									className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
									placeholder="Masukkan nama instansi"
									required
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Tanda Tangan
								</label>
								<div className="border rounded-lg p-2 bg-white">
									<SignaturePad
										ref={signPadRef}
										canvasProps={{
											className: "w-full h-40",
										}}
									/>
									<button
										type="button"
										onClick={() => signPadRef.current.clear()}
										className="text-sm text-gray-500 hover:text-gray-700 mt-2"
									>
										Hapus Tanda Tangan
									</button>
								</div>
							</div>
						</div>
						<div className="flex justify-end space-x-2 mt-6">
							<button
								type="button"
								onClick={() => {
									resetForm();
									setShowModal(false);
								}}
								className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
								disabled={isSubmitting}
							>
								Batal
							</button>
							<button
								type="submit"
								className={`px-4 py-2 bg-blue-500 text-white rounded-lg transition-colors ${
									isSubmitting
										? "opacity-75 cursor-not-allowed"
										: "hover:bg-blue-600"
								}`}
								disabled={isSubmitting}
							>
								{isSubmitting ? (
									<div className="flex items-center space-x-2">
										<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
										<span>Menyimpan...</span>
									</div>
								) : modalMode === "add" ? (
									"Tambah"
								) : (
									"Simpan"
								)}
							</button>
						</div>
					</form>
				</motion.div>
			</div>
		);
	};

	if (loading && rapatList.length === 0) {
		return (
			<div className="flex justify-center items-center min-h-[60vh]">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
			</div>
		);
	}

	return (
		<>
			<div className="p-4 md:p-6 space-y-4">
				{/* Simple Header */}
				<div className="flex items-center gap-2">
					<Calendar className="w-5 h-5 text-blue-500" />
					<h2 className="text-lg md:text-xl font-semibold">Daftar Rapat</h2>
				</div>

				{/* Filter Accordion with Add Button */}
				<FilterAccordion
					filterDate={filterDate}
					setFilterDate={setFilterDate}
					isOpen={isFilterOpen}
					setIsOpen={setIsFilterOpen}
					onAddClick={handleAddClick}
					loading={loading}
					isToday={isToday}
					rapatList={rapatList}
				/>

				{/* Content */}
				{loading ? (
					<LoadingSkeleton />
				) : rapatList.length === 0 ? (
					<div className="text-center py-12">
						<FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
						<h3 className="text-xl font-medium text-gray-600">
							Tidak ada rapat pada tanggal ini
						</h3>
						<p className="text-gray-500 mt-2">
							Pilih tanggal lain atau tambah rapat baru
						</p>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
						{rapatList.map((rapat) => (
							<RapatCard
								key={rapat.id}
								rapat={rapat}
								onEdit={handleEdit}
								onDelete={handleDelete}
							/>
						))}
					</div>
				)}
			</div>

			{showModal && <RapatModal />}
			{toast.show && (
				<Toast
					message={toast.message}
					type={toast.type}
					onClose={() =>
						setToast({ show: false, message: "", type: "success" })
					}
				/>
			)}
		</>
	);
};

export default RapatPage;
