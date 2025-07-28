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
} from "lucide-react";
import moment from "moment-timezone";
import { exportToPDF } from "./utils/pdfGenerator";

const FilterAccordion = ({
	filterDate,
	setFilterDate,
	filterNamaRapat,
	setFilterNamaRapat,
	isOpen,
	setIsOpen,
	onAddClick,
	loading,
	isToday,
	rapatList,
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
					{filterNamaRapat && (
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
									value={filterDate}
									onChange={(e) => setFilterDate(e.target.value)}
									className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
								/>
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
										value={filterNamaRapat}
										onChange={(e) => setFilterNamaRapat(e.target.value)}
										className="w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
									/>
									{loading && filterNamaRapat && (
										<Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
									)}
									{!loading && filterNamaRapat && (
										<button
											onClick={() => setFilterNamaRapat("")}
											className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
										>
											<X className="w-4 h-4" />
										</button>
									)}
									{!loading && !filterNamaRapat && (
										<Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
									)}
								</div>
								{filterNamaRapat && (
									<p className="text-xs text-gray-500 mt-1">
										Mencari: "{filterNamaRapat}" • {rapatList.length} hasil
										ditemukan
									</p>
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

								{(!isToday || filterNamaRapat) && (
									<button
										onClick={() => {
											setFilterDate(moment().format("YYYY-MM-DD"));
											setFilterNamaRapat("");
										}}
										className="text-sm text-blue-500 hover:text-blue-600 px-4 py-2 rounded-lg border border-blue-500 hover:border-blue-600 transition-colors w-full flex items-center justify-center gap-2"
									>
										<Calendar className="w-4 h-4" />
										<span>Reset Filter</span>
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
