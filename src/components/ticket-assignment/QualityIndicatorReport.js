import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import moment from "moment-timezone";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	FileText,
	Info,
	Activity,
	BarChart3,
	ListChecks,
	TrendingUp,
	Download,
} from "lucide-react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";

// Load ApexCharts dynamically to avoid SSR issues
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function QualityIndicatorReport({ tickets = [], filters = {}, setFilters = () => {} }) {
	const handleMonthChange = (e) => {
		const selectedMonthYear = e.target.value; // YYYY-MM
		if (!selectedMonthYear) return;
		const start = moment(selectedMonthYear + "-01").format("YYYY-MM-DD");
		const end = moment(start).endOf("month").format("YYYY-MM-DD");
		
		setFilters((prev) => ({
			...prev,
			start_date: start,
			end_date: end,
			enable_date_filter: true,
		}));
	};

	const monthValue = filters.start_date
		? moment(filters.start_date).format("YYYY-MM")
		: moment().format("YYYY-MM");
	const { sensusData, formB, totalN, totalD, totalCapaian, failedTicketsCount, reportDateText } = useMemo(() => {
		const processedData = tickets
			.filter((t) => t.submission_date_raw)
			.map((ticket) => {
				const jamLapor = moment(ticket.submission_date_raw);
				let jamSelesai = null;
				let jamMulai = ticket.assigned_date_raw ? moment(ticket.assigned_date_raw) : jamLapor;

				if (ticket.resolved_date_raw) {
					jamSelesai = moment(ticket.resolved_date_raw);
				}

				let durasiMenit = "-";
				if (jamSelesai) {
					// Hitung durasi kerja dari waktu ditugaskan sampai selesai
					const durasi = jamSelesai.diff(jamMulai, "minutes");
					durasiMenit = durasi >= 0 ? durasi : 0;
				}

				const isKriteria = ["Closed", "Resolved"].includes(ticket.current_status);

				return {
					id: ticket.ticket_id || Math.random(),
					tglLapor: jamLapor.format("DD/MM/YYYY"),
					jamLapor: jamLapor.format("HH:mm"),
					tglSelesai: jamSelesai ? jamSelesai.format("DD/MM/YYYY HH:mm") : "-",
					durasiMenit: durasiMenit,
					status: ticket.current_status,
					kategori: ticket.category_name || "Lainnya",
					kriteria: isKriteria,
					dateObj: jamLapor,
					judul: ticket.title || "-",
					departemen: ticket.departemen_name || "-",
				};
			})
			.sort((a, b) => a.dateObj - b.dateObj);

		const weeks = {
			"Minggu 1": { n: 0, d: 0 },
			"Minggu 2": { n: 0, d: 0 },
			"Minggu 3": { n: 0, d: 0 },
			"Minggu 4": { n: 0, d: 0 },
			"Minggu 5": { n: 0, d: 0 },
		};

		processedData.forEach((item) => {
			const date = item.dateObj.date();
			let weekStr = "Minggu 5";
			if (date <= 7) weekStr = "Minggu 1";
			else if (date <= 14) weekStr = "Minggu 2";
			else if (date <= 21) weekStr = "Minggu 3";
			else if (date <= 28) weekStr = "Minggu 4";

			weeks[weekStr].d += 1;
			if (item.kriteria) weeks[weekStr].n += 1;
		});

		const processedFormB = Object.keys(weeks)
			.map((week) => {
				const { n, d } = weeks[week];
				const capaian = d === 0 ? 0 : Math.round((n / d) * 100 * 10) / 10;
				return { week, n, d, capaian };
			})
			.filter((w) => w.d > 0 || w.week !== "Minggu 5");

		const tN = processedFormB.reduce((acc, curr) => acc + curr.n, 0);
		const tD = processedFormB.reduce((acc, curr) => acc + curr.d, 0);
		const tCapaian = tD === 0 ? 0 : Math.round((tN / tD) * 100 * 10) / 10;
		const fTickets = tD - tN;
		
		let text = moment().format("MMMM YYYY");
		if (tickets.length > 0) {
			const earliest = moment.min(processedData.map(d => d.dateObj));
			text = earliest.format("MMMM YYYY");
		}

		return {
			sensusData: processedData,
			formB: processedFormB,
			totalN: tN,
			totalD: tD,
			totalCapaian: tCapaian,
			failedTicketsCount: fTickets,
			reportDateText: text,
		};
	}, [tickets]);

	const handleExportSensus = () => {
		const wb = XLSX.utils.book_new();

		const data = sensusData.map((item) => ({
			"Tgl Lapor": `${item.tglLapor} ${item.jamLapor}`,
			"Judul Kendala": item.judul,
			"Departemen": item.departemen,
			"Tgl Selesai": item.tglSelesai,
			"Status": item.status,
			"Durasi (Menit)": item.durasiMenit,
			"Kategori Masalah": item.kategori,
			"Selesai (N)": item.kriteria ? "Ya" : "Tidak",
		}));

		const ws = XLSX.utils.json_to_sheet(data);

		const wscols = [
			{ wch: 18 }, // Tgl Lapor
			{ wch: 35 }, // Judul
			{ wch: 20 }, // Departemen
			{ wch: 18 }, // Tgl Selesai
			{ wch: 15 }, // Status
			{ wch: 15 }, // Durasi
			{ wch: 25 }, // Kategori
			{ wch: 15 }, // Selesai
		];
		ws["!cols"] = wscols;

		XLSX.utils.book_append_sheet(wb, ws, "Sensus Harian");
		XLSX.writeFile(wb, `sensus_harian_mutu_${moment().format("YYYYMMDD")}.xlsx`);
	};

	// Options for the Bar Chart
	const chartOptions = {
		chart: {
			type: "bar",
			toolbar: {
				show: true,
				tools: {
					download: true,
					selection: false,
					zoom: false,
					zoomin: false,
					zoomout: false,
					pan: false,
					reset: false,
				},
				export: {
					csv: { filename: "Grafik_Indikator_Mutu" },
					svg: { filename: "Grafik_Indikator_Mutu" },
					png: { filename: "Grafik_Indikator_Mutu" },
				},
			},
			fontFamily: "inherit",
		},
		plotOptions: {
			bar: {
				borderRadius: 4,
				columnWidth: "50%",
			},
		},
		colors: ["#3b82f6"],
		dataLabels: {
			enabled: true,
			formatter: (val) => val + "%",
			style: {
				fontSize: "12px",
				colors: ["#fff"],
			},
		},
		xaxis: {
			categories: formB.map((w) => w.week),
			axisBorder: { show: false },
			axisTicks: { show: false },
			labels: {
				style: { colors: "#64748b", fontSize: "12px" },
			},
		},
		yaxis: {
			min: 0,
			max: 100,
			labels: {
				formatter: (val) => val + "%",
				style: { colors: "#64748b", fontSize: "12px" },
			},
		},
		annotations: {
			yaxis: [
				{
					y: 100,
					borderColor: "#ef4444",
					strokeDashArray: 4,
					label: {
						borderColor: "#ef4444",
						style: {
							color: "#fff",
							background: "#ef4444",
							fontSize: "10px",
							fontWeight: 600,
						},
						text: "Target: 100%",
					},
				},
			],
		},
		grid: {
			borderColor: "#f1f5f9",
			strokeDashArray: 4,
		},
		tooltip: {
			theme: "light",
			y: {
				formatter: (val) => val + "%",
			},
		},
	};

	const chartSeries = [
		{
			name: "Capaian",
			data: formB.map((w) => w.capaian),
		},
	];

	return (
		<div className="space-y-6 mt-4 animate-in fade-in zoom-in-95 duration-200">
			{/* Filter Bulan Indikator Mutu */}
			<div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center">
				<div className="w-full sm:w-64 space-y-1">
					<label className="text-xs font-medium text-slate-500">
						Periode Bulan
					</label>
					<input
						type="month"
						value={monthValue}
						onChange={handleMonthChange}
						className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
					/>
				</div>
			</div>

			{/* Header Alert / Intro */}
			<div className="rounded-xl bg-blue-50 border border-blue-100 p-4 flex gap-4">
				<div className="flex-shrink-0 mt-0.5">
					<Info className="h-5 w-5 text-blue-600" />
				</div>
				<div>
					<h3 className="text-sm font-medium text-blue-900">
						Indikator Mutu Tambahan Unit SIMRS
					</h3>
					<p className="mt-1 text-sm text-blue-700 leading-relaxed text-justify">
						Berdasarkan <strong>Peraturan Menteri Kesehatan (PMK) No. 30 Tahun 2022</strong>, indikator mutu unit SIMRS dapat dikategorikan sebagai <strong>Indikator Mutu Tambahan</strong> yang ditetapkan oleh fasilitas pelayanan kesehatan sesuai dengan kondisi dan kebutuhan. Meskipun SIMRS tidak termasuk dalam 13 Indikator Nasional Mutu (INM) Rumah Sakit, pengukurannya harus tetap mengikuti standar profil dan tahapan yang diatur dalam peraturan tersebut.
					</p>
				</div>
			</div>

			<div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
				{/* 1. Profil Indikator */}
				<Card className="border-slate-200 shadow-sm">
					<CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
						<div className="flex items-center gap-2">
							<div className="p-2 bg-indigo-100 rounded-lg">
								<FileText className="h-4 w-4 text-indigo-600" />
							</div>
							<div>
								<CardTitle className="text-base">1. Profil Indikator (Dasar Laporan)</CardTitle>
								<CardDescription className="text-xs">
									Sebelum membuat laporan, unit harus memiliki profil indikator yang jelas.
								</CardDescription>
							</div>
						</div>
					</CardHeader>
					<CardContent className="pt-4 text-sm">
						<ul className="space-y-3">
							<li className="flex flex-col sm:flex-row gap-1 sm:gap-2 border-b border-slate-50 pb-2">
								<span className="font-semibold text-slate-700 min-w-[120px]">Judul Indikator:</span>
								<span className="text-slate-600">Persentase Penyelesaian Kendala <em>Software/Hardware</em> SIMRS</span>
							</li>
							<li className="flex flex-col sm:flex-row gap-1 sm:gap-2 border-b border-slate-50 pb-2">
								<span className="font-semibold text-slate-700 min-w-[120px]">Dimensi Mutu:</span>
								<span className="text-slate-600">Efektivitas dan Efisiensi</span>
							</li>
							<li className="flex flex-col sm:flex-row gap-1 sm:gap-2 border-b border-slate-50 pb-2">
								<span className="font-semibold text-slate-700 min-w-[120px]">Tujuan:</span>
								<span className="text-slate-600">Tergambarnya kemampuan unit SIMRS dalam menyelesaikan setiap tiket/kendala operasional yang masuk</span>
							</li>
							<li className="flex flex-col sm:flex-row gap-1 sm:gap-2 border-b border-slate-50 pb-2">
								<span className="font-semibold text-slate-700 min-w-[120px]">Target:</span>
								<span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded inline-flex w-fit">100% (Seluruh Tiket Diselesaikan)</span>
							</li>
							<li className="flex flex-col sm:flex-row gap-1 sm:gap-2 border-b border-slate-50 pb-2">
								<span className="font-semibold text-slate-700 min-w-[120px]">Numerator:</span>
								<span className="text-slate-600">Jumlah tiket kendala yang telah berhasil diselesaikan (Status Selesai)</span>
							</li>
							<li className="flex flex-col sm:flex-row gap-1 sm:gap-2">
								<span className="font-semibold text-slate-700 min-w-[120px]">Denominator:</span>
								<span className="text-slate-600">Total keseluruhan tiket yang masuk pada periode tersebut</span>
							</li>
						</ul>
					</CardContent>
				</Card>

				{/* 4. Form C (Analisis dan Validasi Data) */}
				<Card className="border-slate-200 shadow-sm">
					<CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
						<div className="flex items-center gap-2">
							<div className="p-2 bg-rose-100 rounded-lg">
								<Activity className="h-4 w-4 text-rose-600" />
							</div>
							<div>
								<CardTitle className="text-base">4. Form C (Analisis dan Validasi Data)</CardTitle>
								<CardDescription className="text-xs">
									Evaluasi capaian indikator mutu periode perhitungan.
								</CardDescription>
							</div>
						</div>
					</CardHeader>
					<CardContent className="pt-4 text-sm">
						<div className="space-y-4">
							<div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
								<p className="font-semibold text-slate-700 mb-1 flex items-center gap-1">
									<TrendingUp className="h-4 w-4" /> Analisis Capaian
								</p>
								<p className="text-slate-600 leading-relaxed text-justify">
									Capaian mutu untuk periode ini adalah <strong>{totalCapaian}%</strong>,{" "}
									{totalCapaian >= 100
										? "berhasil mencapai target 100%, seluruh kendala/tiket yang masuk berhasil diselesaikan."
										: `belum mencapai target 100% penyelesaian. Terdapat ${failedTicketsCount} tiket yang saat ini belum terselesaikan (masih dieksekusi atau pending).`}
								</p>
							</div>
							{totalCapaian < 100 && (
								<>
									<div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
										<p className="font-semibold text-orange-800 mb-1 flex items-center gap-1">
											Akar Masalah
										</p>
										<p className="text-orange-700 leading-relaxed text-justify">
											Belum tercapainya 100% penyelesaian masalah dipengaruhi oleh adanya kendala yang membutuhkan koordinasi pihak ketiga, pemesanan ketersediaan perangkat keras (hardware), atau kerumitan kendala sehingga membutuhkan waktu eksekusi yang lambat.
										</p>
									</div>
									<div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
										<p className="font-semibold text-blue-800 mb-1 flex items-center gap-1">
											Tindak Lanjut Perbaikan
										</p>
										<ol className="list-decimal list-inside text-blue-700 space-y-1">
											<li>Eskalasi prioritas pada kendala yang berstatus pending/in-progress secara harian.</li>
											<li>Evaluasi manajemen ketersediaan perangkat keras lebih awal.</li>
										</ol>
									</div>
								</>
							)}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* 2. Sensus Harian */}
			<Card className="border-slate-200 shadow-sm">
				<CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
					<div className="flex items-center gap-2">
						<div className="p-2 bg-amber-100 rounded-lg">
							<ListChecks className="h-4 w-4 text-amber-600" />
						</div>
						<div>
							<CardTitle className="text-base">2. Sensus Harian (Instrumen Pengambilan Data)</CardTitle>
							<CardDescription className="text-xs">
								Alat pengumpulan data berdasarkan periode laporan.
							</CardDescription>
						</div>
					</div>
					<Button
						variant="outline"
						size="sm"
						className="hidden sm:flex text-amber-700 hover:bg-amber-50 hover:text-amber-800 border-amber-200"
						onClick={handleExportSensus}
						disabled={sensusData.length === 0}
					>
						<Download className="w-4 h-4 mr-2" />
						Export Excel
					</Button>
				</CardHeader>
				<CardContent className="p-0">
					<div className="overflow-x-auto max-h-[400px]">
						<table className="w-full text-sm text-left">
							<thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold sticky top-0 shadow-sm z-10">
								<tr>
									<th className="px-4 py-3 border-b border-slate-200">Tgl Lapor</th>
									<th className="px-4 py-3 border-b border-slate-200">Judul Kendala</th>
									<th className="px-4 py-3 border-b border-slate-200">Departemen</th>
									<th className="px-4 py-3 border-b border-slate-200 text-center">Tgl Selesai</th>
									<th className="px-4 py-3 border-b border-slate-200 text-center">Status</th>
									<th className="px-4 py-3 border-b border-slate-200 text-center">Durasi (Menit)</th>
									<th className="px-4 py-3 border-b border-slate-200">Kategori Masalah</th>
									<th className="px-4 py-3 border-b border-slate-200 text-center">Selesai (N)</th>
								</tr>
							</thead>
							<tbody>
								{sensusData.length === 0 ? (
									<tr>
										<td colSpan="8" className="text-center py-6 text-slate-500 italic">Data kosong dalam periode ini</td>
									</tr>
								) : (
									sensusData.map((item) => (
										<tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50/50">
											<td className="px-4 py-3 font-medium text-slate-700">
												{item.tglLapor}
												<div className="text-xs font-normal text-slate-500">{item.jamLapor}</div>
											</td>
											<td className="px-4 py-3 text-slate-700 max-w-[200px] truncate" title={item.judul}>{item.judul}</td>
											<td className="px-4 py-3 text-slate-600">{item.departemen}</td>
											<td className="px-4 py-3 text-center text-slate-600">{item.tglSelesai}</td>
											<td className="px-4 py-3 text-center text-slate-600">
												<span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
													item.kriteria ? 'bg-slate-100 text-slate-700' : 'bg-amber-100 text-amber-700'
												}`}>
													{item.status}
												</span>
											</td>
											<td className="px-4 py-3 text-center text-slate-600 font-mono text-xs">{item.durasiMenit}</td>
											<td className="px-4 py-3 text-slate-600">{item.kategori}</td>
											<td className="px-4 py-3 text-center">
												{item.kriteria ? (
													<span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-xs font-medium">Ya</span>
												) : (
													<span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded text-xs font-medium">Tidak</span>
												)}
											</td>
										</tr>
									))
								)}
								{sensusData.length > 0 && (
									<tr className="hover:bg-slate-50/50 bg-slate-50 font-bold border-t border-slate-200 sticky bottom-0 z-10">
										<td className="px-4 py-3 text-slate-700" colSpan="3">Total</td>
										<td colSpan="4" className="px-4 py-3 text-center text-slate-500"></td>
										<td className="px-4 py-3 text-center text-slate-800">{totalN} Tiket</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				</CardContent>
			</Card>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* 3. Form B (Rekapitulasi Bulanan) */}
				<Card className="border-slate-200 shadow-sm flex flex-col">
					<CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
						<div className="flex items-center gap-2">
							<div className="p-2 bg-cyan-100 rounded-lg">
								<FileText className="h-4 w-4 text-cyan-600" />
							</div>
							<div>
								<CardTitle className="text-base">3. Form B (Rekapitulasi Mingguan)</CardTitle>
								<CardDescription className="text-xs">
									Data sensus harian dirangkum setiap minggu per bulan.
								</CardDescription>
							</div>
						</div>
					</CardHeader>
					<CardContent className="p-0 flex-1">
						<div className="overflow-x-auto h-full">
							<table className="w-full text-sm text-left h-full">
								<thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold border-b border-slate-200">
									<tr>
										<th className="px-4 py-4">Minggu</th>
										<th className="px-4 py-4 text-center">Numerator (N)</th>
										<th className="px-4 py-4 text-center">Denominator (D)</th>
										<th className="px-4 py-4 text-center">Capaian (%)</th>
										<th className="px-4 py-4 text-center">Target</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100">
									{formB.length === 0 ? (
										<tr>
											<td colSpan="5" className="text-center py-6 text-slate-500 italic">Belum ada data rekapitulasi</td>
										</tr>
									) : (
										formB.map((item) => (
											<tr key={item.week} className="hover:bg-slate-50/50">
												<td className="px-4 py-3 text-slate-600">{item.week}</td>
												<td className="px-4 py-3 text-center font-medium">{item.n}</td>
												<td className="px-4 py-3 text-center font-medium">{item.d}</td>
												<td className="px-4 py-3 text-center font-semibold text-blue-600">{item.capaian}%</td>
												<td className="px-4 py-3 text-center text-emerald-600 font-medium">100%</td>
											</tr>
										))
									)}
									{formB.length > 0 && (
										<tr className="bg-slate-50 font-bold border-t border-slate-200">
											<td className="px-4 py-4 text-slate-800">Total</td>
											<td className="px-4 py-4 text-center text-slate-800">{totalN}</td>
											<td className="px-4 py-4 text-center text-slate-800">{totalD}</td>
											<td className="px-4 py-4 text-center text-blue-600 text-base">{totalCapaian}%</td>
											<td className="px-4 py-4 text-center text-emerald-600 text-base">100%</td>
										</tr>
									)}
								</tbody>
							</table>
						</div>
					</CardContent>
				</Card>

				{/* 5. Grafik Indikator Mutu (Penyajian Data) */}
				<Card className="border-slate-200 shadow-sm flex flex-col">
					<CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<div className="p-2 bg-purple-100 rounded-lg">
									<BarChart3 className="h-4 w-4 text-purple-600" />
								</div>
								<div>
									<CardTitle className="text-base">5. Grafik Indikator Mutu (Penyajian Data)</CardTitle>
									<CardDescription className="text-xs">
										PMK No. 30 Tahun 2022 mensyaratkan penyajian data menggunakan <em>Run Chart</em> / Tabel.
									</CardDescription>
								</div>
							</div>
						</div>
					</CardHeader>
					<CardContent className="pt-6 flex-1 flex flex-col">
						<div className="flex-1 min-h-[250px] w-full">
							{formB.length > 0 ? (
								<Chart
									options={chartOptions}
									series={chartSeries}
									type="bar"
									height="100%"
									width="100%"
								/>
							) : (
								<div className="flex items-center justify-center h-full text-slate-500 italic">
									Tidak cukup data untuk menampilkan grafik
								</div>
							)}
						</div>
						<div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
							<div className="text-right">
								<p className="text-xs text-slate-500 mb-1">Penanggung Jawab:</p>
								<p className="font-semibold text-sm text-slate-800">Kepala Unit SIMRS</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
