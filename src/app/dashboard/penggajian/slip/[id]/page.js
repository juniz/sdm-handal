"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Download, Printer } from "lucide-react";
import { generateSlipGajiPDF } from "@/components/penggajian/utils/pdfSlipGenerator";

// Style untuk print
const printStyles = `
	@media print {
		@page {
			margin: 15mm;
			size: A4;
		}
		
		body {
			background: white;
		}
		
		.print\\:hidden {
			display: none !important;
		}
		
		.print\\:p-0 {
			padding: 0 !important;
		}
		
		.print\\:shadow-none {
			box-shadow: none !important;
		}
	}
`;

export default function SlipGajiPage() {
	const params = useParams();
	const router = useRouter();
	const [gajiData, setGajiData] = useState(null);
	const [pegawaiData, setPegawaiData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [downloading, setDownloading] = useState(false);

	useEffect(() => {
		fetchSlipGaji();
	}, [params.id]);

	const fetchSlipGaji = async () => {
		try {
			setLoading(true);
			setError(null);

			// Fetch data gaji dari API
			const response = await fetch(`/api/gaji`);
			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || "Gagal mengambil data gaji");
			}

			const gaji = data.data?.find((g) => g.id === parseInt(params.id));
			if (!gaji) {
				throw new Error("Data gaji tidak ditemukan");
			}

			setGajiData(gaji);
			setPegawaiData({
				nik: gaji.nik,
				nama: gaji.nama,
				jbtn: gaji.jbtn,
				departemen_name: gaji.departemen_name,
			});
		} catch (err) {
			setError(err.message);
			console.error("Error fetching slip gaji:", err);
		} finally {
			setLoading(false);
		}
	};

	const handleDownloadPDF = async () => {
		if (!gajiData || !pegawaiData) return;

		try {
			setDownloading(true);
			// Gunakan fungsi dari pdfSlipGenerator yang sudah memiliki fallback
			// Jika html2canvas gagal, akan menggunakan jsPDF langsung
			await generateSlipGajiPDF(gajiData, pegawaiData);
		} catch (err) {
			console.error("Error downloading PDF:", err);
			alert("Terjadi kesalahan saat download PDF. Silakan coba lagi atau gunakan tombol Print.");
		} finally {
			setDownloading(false);
		}
	};

	const handlePrint = () => {
		window.print();
	};

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
					<p className="text-gray-600">Memuat slip gaji...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50">
				<div className="text-center max-w-md mx-auto p-6">
					<div className="bg-red-50 border border-red-200 rounded-lg p-6">
						<h2 className="text-xl font-bold text-red-800 mb-2">Error</h2>
						<p className="text-red-600 mb-4">{error}</p>
						<button
							onClick={() => router.back()}
							className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center mx-auto"
						>
							<ArrowLeft className="h-4 w-4 mr-2" />
							Kembali
						</button>
					</div>
				</div>
			</div>
		);
	}

	if (!gajiData || !pegawaiData) {
		return null;
	}

	return (
		<>
			<style dangerouslySetInnerHTML={{ __html: printStyles }} />
			<div className="min-h-screen bg-gray-50">
				{/* Header dengan tombol action */}
				<div className="bg-white shadow-sm border-b sticky top-0 z-10 print:hidden">
					<div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
						<button
							onClick={() => router.back()}
							className="flex items-center text-gray-600 hover:text-gray-900"
						>
							<ArrowLeft className="h-5 w-5 mr-2" />
							Kembali
						</button>
						<div className="flex items-center space-x-3">
							<button
								onClick={handlePrint}
								className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center"
							>
								<Printer className="h-4 w-4 mr-2" />
								Print
							</button>
							<button
								onClick={handleDownloadPDF}
								disabled={downloading}
								className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
							>
								<Download className="h-4 w-4 mr-2" />
								{downloading ? "Mengunduh..." : "Download PDF"}
							</button>
						</div>
					</div>
				</div>

				{/* Slip Gaji Content */}
				<div className="max-w-4xl mx-auto p-4 print:p-0">
					<div
						className="bg-white shadow-lg rounded-lg overflow-hidden print:shadow-none"
						id="slip-gaji-content"
					>
						<SlipGajiHTML gajiData={gajiData} pegawaiData={pegawaiData} />
					</div>
				</div>
			</div>
		</>
	);
}

// Komponen untuk render HTML slip gaji
function SlipGajiHTML({ gajiData, pegawaiData }) {
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

	const periodeBulan = formatBulanIndo(gajiData.periode_bulan);
	const periodeTahun = gajiData.periode_tahun;
	const tanggalCetak = formatTanggalIndo(new Date());

	return (
		<div 
			className="p-8 print:p-6 bg-white" 
			style={{ 
				fontFamily: "Times New Roman, serif",
				maxWidth: "210mm",
				margin: "0 auto"
			}}
		>
			{/* Header dengan Logo */}
			<div className="flex items-center mb-5 pb-4 border-b-2 border-black">
				<div className="w-20 flex-shrink-0">
					<img 
						src="/logo.png" 
						alt="Logo RSB Nganjuk" 
						className="w-16 h-16 object-contain"
					/>
				</div>
				<div className="flex-1 text-center">
					<h1 className="text-xl font-bold mb-1">POLRI DAERAH JAWA TIMUR</h1>
					<h2 className="text-lg font-bold mb-1">BIDANG KEDOKTERAN DAN KESEHATAN</h2>
					<h3 className="text-base font-bold mt-1">RUMAH SAKIT BHAYANGKARA TK. III NGANJUK</h3>
				</div>
				<div className="w-20 flex-shrink-0"></div>
			</div>

			{/* Title */}
			<div className="text-center text-lg font-bold my-5 underline">
				SLIP GAJI
			</div>

			{/* Periode */}
			<div className="text-center mb-5 font-bold">
				Periode: {periodeBulan} {periodeTahun}
			</div>

			{/* Info Pegawai */}
			<div className="mb-5">
				<div className="flex mb-2">
					<div className="w-40 font-bold">NIK:</div>
					<div className="flex-1">{pegawaiData.nik || "-"}</div>
				</div>
				<div className="flex mb-2">
					<div className="w-40 font-bold">Nama:</div>
					<div className="flex-1">{pegawaiData.nama || "-"}</div>
				</div>
				<div className="flex mb-2">
					<div className="w-40 font-bold">Jabatan:</div>
					<div className="flex-1">{pegawaiData.jbtn || "-"}</div>
				</div>
				<div className="flex mb-2">
					<div className="w-40 font-bold">Departemen:</div>
					<div className="flex-1">{pegawaiData.departemen_name || "-"}</div>
				</div>
			</div>

			{/* Rincian Gaji */}
			<div className="my-5">
				<table className="w-full border-collapse">
					<thead>
						<tr>
							<th className="w-1/3 border border-black p-2 text-center font-bold bg-gray-100">
								Keterangan
							</th>
							<th className="w-2/3 border border-black p-2 text-center font-bold bg-gray-100">
								Jumlah
							</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td className="border border-black p-2">Jenis</td>
							<td className="border border-black p-2">{gajiData.jenis}</td>
						</tr>
						<tr className="font-bold text-base">
							<td className="border border-black p-2">TOTAL GAJI</td>
							<td className="border border-black p-2 text-right">
								{formatRupiah(gajiData.gaji)}
							</td>
						</tr>
					</tbody>
				</table>
			</div>

			{/* Footer */}
			<div className="mt-10 flex justify-between">
				<div className="text-center w-[45%]">
					<div>Nganjuk, {tanggalCetak}</div>
					<div className="mt-5">Yang Menerima</div>
					<div className="mt-16 pt-2 border-t border-black">
						<br />
						{pegawaiData.nama || ""}
					</div>
				</div>
				<div className="text-center w-[45%]">
					<div>Mengetahui</div>
					<div className="mt-5">KEPALA RUMAH SAKIT</div>
					<div className="mt-16 pt-2 border-t border-black">
						<br />
						drg. WAHYU ARI PRANANTO, M.A.R.S.
						<br />
						<span className="overline">
							AJUN KOMISARIS BESAR POLISI NRP 76030927
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}

