"use client";

import React from "react";
import { Filter, Search, X, Download, AlertTriangle, Printer } from "lucide-react";
import { SearchableSelect } from "@/components/ui/searchable-select";

const DEFAULT_MONTHS = [
	{ value: "01", label: "Januari" },
	{ value: "02", label: "Februari" },
	{ value: "03", label: "Maret" },
	{ value: "04", label: "April" },
	{ value: "05", label: "Mei" },
	{ value: "06", label: "Juni" },
	{ value: "07", label: "Juli" },
	{ value: "08", label: "Agustus" },
	{ value: "09", label: "September" },
	{ value: "10", label: "Oktober" },
	{ value: "11", label: "November" },
	{ value: "12", label: "Desember" },
];

const DEFAULT_YEARS = ["2024", "2025", "2026", "2027"];
const PAGE_LIMITS = [10, 25, 50, 100];

export default function AuditFilters({
	month,
	setMonth,
	year,
	setYear,
	departemen,
	setDepartemen,
	sttsKerja,
	setSttsKerja,
	searchNama,
	setSearchNama,
	limit = 10,
	setLimit,
	onlyAnomali = false,
	setOnlyAnomali,
	onExportCsv,
	onPrintReport,
	departemenList = [],
	sttsKerjaList = [],
	MONTHS = DEFAULT_MONTHS,
	YEARS = DEFAULT_YEARS,
}) {
	const deptOptions = [
		{ value: "ALL", label: "Semua Departemen" },
		...departemenList.map((d) => ({
			value: d.nama,
			label: d.nama,
			sublabel: d.dep_id ? `Kode: ${d.dep_id}` : undefined,
		})),
	];
	return (
		<div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm space-y-4 print:hidden transition-shadow duration-200 hover:shadow-md">
			{/* Top Bar: Title, Anomaly Filter Chips, and Export Button */}
			<div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-100 pb-3">
				<div className="flex items-center gap-3 flex-wrap">
					<div className="flex items-center gap-2">
						<Filter className="w-4 h-4 text-sky-600" />
						<span className="font-bold text-xs uppercase tracking-widest text-slate-700 font-mono">
							Filter & Pencarian
						</span>
					</div>

					{/* Quick Preset Chips */}
					<div className="flex items-center gap-1.5 ml-0 sm:ml-2">
						<button
							type="button"
							onClick={() => setOnlyAnomali && setOnlyAnomali(false)}
							className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
								!onlyAnomali
									? "bg-slate-900 text-white shadow-xs"
									: "bg-slate-100 text-slate-600 hover:bg-slate-200"
							}`}
						>
							Semua Pegawai
						</button>
						<button
							type="button"
							onClick={() => setOnlyAnomali && setOnlyAnomali(true)}
							className={`px-2.5 py-1 text-xs font-semibold rounded-lg inline-flex items-center gap-1 transition-all cursor-pointer ${
								onlyAnomali
									? "bg-rose-600 text-white shadow-xs"
									: "bg-rose-50 text-rose-800 border border-rose-200/80 hover:bg-rose-100"
							}`}
						>
							<AlertTriangle className="w-3 h-3" />
							Perlu Audit (Gap &gt; 0)
						</button>
					</div>
				</div>

				{/* Right Side: Page Size & Export */}
				<div className="flex items-center gap-2 self-end sm:self-auto">
					<div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
						<span>Baris:</span>
						<select
							value={limit}
							onChange={(e) => setLimit && setLimit(Number(e.target.value))}
							className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
						>
							{PAGE_LIMITS.map((lim) => (
								<option key={lim} value={lim}>
									{lim}
								</option>
							))}
						</select>
					</div>
					{onPrintReport && (
						<button
							type="button"
							onClick={onPrintReport}
							className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition-all"
							title="Cetak Laporan Audit (A4 Landscape)"
						>
							<Printer className="w-3.5 h-3.5 text-white" />
							<span>Cetak (A4)</span>
						</button>
					)}
					{onExportCsv && (
						<button
							type="button"
							onClick={onExportCsv}
							className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200/80 font-bold rounded-lg text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition-all"
							title="Ekspor data audit ke format CSV"
						>
							<Download className="w-3.5 h-3.5 text-sky-600" />
							<span>Export CSV</span>
						</button>
					)}
				</div>
			</div>

			{/* Filter Controls Grid */}
			<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
				{/* Bulan Selector */}
				<div className="space-y-1.5">
					<label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block">
						Bulan
					</label>
					<select
						value={month}
						onChange={(e) => setMonth(e.target.value)}
						className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-600/10 focus:bg-white text-sm font-semibold text-slate-700 cursor-pointer transition-all"
					>
						{MONTHS.map((m) => (
							<option key={m.value} value={m.value}>
								{m.label}
							</option>
						))}
					</select>
				</div>

				{/* Tahun Selector */}
				<div className="space-y-1.5">
					<label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block">
						Tahun
					</label>
					<select
						value={year}
						onChange={(e) => setYear(e.target.value)}
						className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-600/10 focus:bg-white text-sm font-semibold text-slate-700 cursor-pointer transition-all"
					>
						{YEARS.map((y) => (
							<option key={y} value={y}>
								{y}
							</option>
						))}
					</select>
				</div>

				{/* Departemen Filter (Searchable) */}
				<div className="space-y-1.5">
					<label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block">
						Departemen
					</label>
					<SearchableSelect
						options={deptOptions}
						value={departemen}
						onChange={(val) => setDepartemen(val)}
						placeholder="Pilih Departemen..."
					/>
				</div>

				{/* Status Kerja Filter */}
				<div className="space-y-1.5">
					<label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block">
						Status Kerja
					</label>
					<select
						value={sttsKerja}
						onChange={(e) => setSttsKerja(e.target.value)}
						className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-600/10 focus:bg-white text-sm font-semibold text-slate-700 cursor-pointer transition-all"
					>
						<option value="ALL">Semua Status Kerja</option>
						{sttsKerjaList.map((s) => (
							<option key={s.stts} value={s.stts}>
								{s.ktg || s.stts}
							</option>
						))}
					</select>
				</div>

				{/* Search Nama / NIK */}
				<div className="space-y-1.5">
					<label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block">
						Cari Nama / NIK
					</label>
					<div className="relative">
						<Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
						<input
							type="text"
							aria-label="Cari nama atau NIK pegawai"
							placeholder="Cari..."
							value={searchNama}
							onChange={(e) => setSearchNama(e.target.value)}
							className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-600/10 focus:bg-white text-sm font-semibold text-slate-700 transition-all"
						/>
						{searchNama && (
							<button
								type="button"
								onClick={() => setSearchNama("")}
								className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
								title="Hapus pencarian"
							>
								<X className="w-3.5 h-3.5" />
							</button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
