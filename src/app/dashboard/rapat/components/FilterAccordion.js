"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
	Filter,
	ChevronDown,
	ChevronUp,
	Plus,
	Download,
	Calendar,
	Search,
	X,
	Loader2,
	Copy,
	User,
} from "lucide-react";
import moment from "moment-timezone";
import { exportToPDF } from "./utils/pdfGenerator";

const FilterAccordion = ({
	filterDate,
	setFilterDate,
	searchDate,
	setSearchDate,
	filterNamaRapat,
	setFilterNamaRapat,
	searchNamaRapat,
	setSearchNamaRapat,
	filterNamaPeserta,
	setFilterNamaPeserta,
	searchNamaPeserta,
	setSearchNamaPeserta,
	onSearch,
	onResetSearch,
	isOpen,
	setIsOpen,
	onAddClick,
	onDuplicateClick,
	loading,
	isToday,
	rapatList,
	isITUser = false,
}) => {
	const handleExportPDF = async () => {
		await exportToPDF(filterDate, rapatList);
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
					{(filterNamaRapat || filterNamaPeserta) && (
						<span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
							{rapatList.length} hasil
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
							{/* Filter Tanggal */}
							<div>
								<label className="block text-sm text-gray-600 mb-1">
									Tanggal
								</label>
								<input
									type="date"
									value={searchDate}
									onChange={(e) => setSearchDate(e.target.value)}
									className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
								/>
								{filterDate !== searchDate && (
									<p className="text-xs text-gray-500 mt-1">
										Filter aktif: {moment(filterDate).format("DD MMMM YYYY")}
									</p>
								)}
							</div>

							{/* Filter Nama Rapat */}
							<div>
								<label className="block text-sm text-gray-600 mb-1">
									Nama Rapat
								</label>
								<div className="relative">
									<input
										type="text"
										placeholder="Cari nama rapat..."
										value={searchNamaRapat}
										onChange={(e) => setSearchNamaRapat(e.target.value)}
										onKeyPress={(e) => {
											if (e.key === "Enter") {
												onSearch();
											}
										}}
										className="w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
									/>
									{searchNamaRapat && (
										<button
											onClick={() => setSearchNamaRapat("")}
											className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
										>
											<X className="w-4 h-4" />
										</button>
									)}
									{!searchNamaRapat && (
										<Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
									)}
								</div>
							</div>

							{/* Filter Nama Peserta */}
							<div>
								<label className="block text-sm text-gray-600 mb-1">
									Nama Peserta
								</label>
								<div className="relative">
									<input
										type="text"
										placeholder="Cari nama peserta..."
										value={searchNamaPeserta}
										onChange={(e) => setSearchNamaPeserta(e.target.value)}
										onKeyPress={(e) => {
											if (e.key === "Enter") {
												onSearch();
											}
										}}
										className="w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
									/>
									{searchNamaPeserta && (
										<button
											onClick={() => setSearchNamaPeserta("")}
											className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
										>
											<X className="w-4 h-4" />
										</button>
									)}
									{!searchNamaPeserta && (
										<User className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
									)}
								</div>
							</div>

							{/* Info Filter Aktif */}
							{(filterNamaRapat || filterNamaPeserta) && (
								<div className="mt-2 flex items-center justify-between bg-gray-50 p-2 rounded-lg">
									<div className="flex-1">
										<p className="text-xs text-gray-600">
											Filter aktif:
											{filterNamaRapat && (
												<span className="ml-1 font-medium">
													Nama Rapat: "{filterNamaRapat}"
												</span>
											)}
											{filterNamaPeserta && (
												<span className="ml-1 font-medium">
													{filterNamaRapat ? " • " : ""}Nama Peserta: "
													{filterNamaPeserta}"
												</span>
											)}
											<span className="ml-1">• {rapatList.length} hasil</span>
										</p>
									</div>
									<button
										onClick={onResetSearch}
										className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1 ml-2"
									>
										<X className="w-3 h-3" />
										Hapus Filter
									</button>
								</div>
							)}

							{/* Tombol Cari Gabungan */}
							<div className="flex gap-2">
								<button
									onClick={onSearch}
									disabled={loading}
									className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm"
								>
									{loading ? (
										<Loader2 className="w-4 h-4 animate-spin" />
									) : (
										<Search className="w-4 h-4" />
									)}
									<span>Cari Rapat</span>
								</button>
								{(filterDate !== searchDate ||
									filterNamaRapat ||
									filterNamaPeserta) && (
									<button
										onClick={onResetSearch}
										className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm"
									>
										<X className="w-4 h-4" />
										<span>Reset</span>
									</button>
								)}
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

								{isITUser && onDuplicateClick && (
									<button
										onClick={onDuplicateClick}
										className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm w-full"
										disabled={loading}
									>
										<Copy className="w-4 h-4" />
										<span>Duplikasi Rapat</span>
									</button>
								)}

								{rapatList.length > 0 && (
									<button
										onClick={handleExportPDF}
										className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm w-full"
										disabled={loading}
									>
										<Download className="w-4 h-4" />
										<span>Export PDF</span>
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

export default FilterAccordion;
