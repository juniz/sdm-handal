"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Download, Printer } from "lucide-react";
import { generateSlipGajiPDF, getSlipGajiPDFBlob } from "@/components/penggajian/utils/pdfSlipGenerator";

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
	const [pdfUrl, setPdfUrl] = useState(null);

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

	useEffect(() => {
		if (gajiData && pegawaiData) {
			generatePreview();
		}
	}, [gajiData, pegawaiData]);

	const generatePreview = async () => {
		try {
			const blob = await getSlipGajiPDFBlob(gajiData, pegawaiData);
			const url = URL.createObjectURL(blob);
			setPdfUrl(url);
		} catch (err) {
			console.error("Error generating preview:", err);
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
							className="flex items-center text-gray-600 hover:text-gray-900 pr-2"
						>
							<ArrowLeft className="h-5 w-5 mr-1 sm:mr-2" />
							<span className="hidden sm:inline">Kembali</span>
						</button>
						<div className="flex items-center space-x-2 sm:space-x-3">
							<button
								onClick={handlePrint}
								className="px-3 sm:px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center transition-colors"
								title="Print"
							>
								<Printer className="h-4 w-4 sm:mr-2" />
								<span className="hidden sm:inline">Print</span>
							</button>
							<button
								onClick={handleDownloadPDF}
								disabled={downloading}
								className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
								title="Download PDF"
							>
								<Download className="h-4 w-4 sm:mr-2" />
								<span className="hidden sm:inline">
									{downloading ? "Mengunduh..." : "Download PDF"}
								</span>
								<span className="sm:hidden text-xs">
									{downloading ? "..." : "PDF"}
								</span>
							</button>
						</div>
					</div>
				</div>

				{/* Slip Gaji Content */}
				<div className="max-w-4xl mx-auto p-2 sm:p-4 print:p-0">
					<div
						className="bg-white shadow-lg rounded-lg overflow-hidden h-[600px] sm:h-[800px] print:shadow-none print:h-auto"
						id="slip-gaji-content"
					>
						{pdfUrl ? (
							<iframe 
								src={pdfUrl} 
								className="w-full h-full border-none print:hidden"
								title="Slip Gaji Preview"
							/>
						) : (
							<div className="flex items-center justify-center h-full">
								<p className="text-gray-500">Menyiapkan preview...</p>
							</div>
						)}
						{/* Fallback for print - original HTML component */}
						<div className="hidden print:block">
							<SlipGajiHTML gajiData={gajiData} pegawaiData={pegawaiData} />
						</div>
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
				fontFamily: "Arial Narrow, Arial, sans-serif",
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
                        {gajiData.jenis && gajiData.jenis.toString().trim().toUpperCase() === "GAJI" && (gajiData.gaji_original || gajiData.bpjs_kesehatan_nominal > 0 || gajiData.bpjs_ketenagakerjaan_nominal > 0) && (
                            <>
                            {gajiData.gaji_original && (
                                <tr>
                                    <td className="border border-black p-2">Sisa Gaji (Sebelum Potongan)</td>
                                    <td className="border border-black p-2 text-right">
                                        {formatRupiah(gajiData.gaji_original)}
                                    </td>
                                </tr>
                            )}
                            {gajiData.bpjs_kesehatan_nominal > 0 && (
                                <tr>
                                    <td className="border border-black p-2">Potongan BPJS Kesehatan</td>
                                    <td className="border border-black p-2 text-right text-red-600">
                                        - {formatRupiah(gajiData.bpjs_kesehatan_nominal)}
                                    </td>
                                </tr>
                            )}
                            {gajiData.bpjs_ketenagakerjaan_nominal > 0 && (
                                <tr>
                                    <td className="border border-black p-2">Potongan BPJS Ketenagakerjaan</td>
                                    <td className="border border-black p-2 text-right text-red-600">
                                        - {formatRupiah(gajiData.bpjs_ketenagakerjaan_nominal)}
                                    </td>
                                </tr>
                            )}
                            </>
                        )}
						<tr className="font-bold text-base bg-blue-50">
							<td className="border border-black p-2">TOTAL GAJI (DITERIMA)</td>
							<td className="border border-black p-2 text-right">
								{formatRupiah(gajiData.gaji)}
							</td>
						</tr>
					</tbody>
				</table>
			</div>

			{/* Footer */}
			<div className="mt-10 flex justify-between">
				<div className="text-center w-[45%] flex flex-col items-center">
					<div>Nganjuk, {tanggalCetak}</div>
					<div className="mt-5">Yang Menerima</div>
					<div className="mt-2 flex flex-col items-center justify-end min-h-[80px] w-full">
						{gajiData.tanda_tangan ? (
							<img 
								src={gajiData.tanda_tangan} 
								alt="Tanda Tangan" 
								className="max-h-[70px] mb-[-10px]"
							/>
						) : (
							<div className="h-[60px]"></div>
						)}
						<div className="w-full pt-2 border-t border-black">
							{pegawaiData.nama || ""}
						</div>
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

