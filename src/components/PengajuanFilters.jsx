"use client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Filter, X } from "lucide-react";
import { useState } from "react";

const PengajuanFilters = ({
	searchTerm,
	setSearchTerm,
	statusFilter,
	setStatusFilter,
	onClearFilters,
}) => {
	const [isExpanded, setIsExpanded] = useState(false);

	const handleClearFilters = () => {
		setSearchTerm("");
		setStatusFilter("all");
		onClearFilters();
	};

	const hasActiveFilters = searchTerm !== "" || statusFilter !== "all";

	return (
		<Card className="mb-4 border-slate-200 shadow-sm bg-white">
			<CardContent className="p-4">
				<div className="space-y-4">
					{/* Filter Header */}
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<div className="w-7 h-7 rounded-md bg-slate-100 flex items-center justify-center text-slate-600">
								<Filter className="w-3.5 h-3.5" />
							</div>
							<h3 className="text-sm font-semibold text-slate-900">
								Filter & Pencarian
							</h3>
							{hasActiveFilters && (
								<span className="px-2 py-0.5 bg-sky-50 text-sky-700 border border-sky-200 text-xs font-semibold rounded-full">
									Aktif
								</span>
							)}
						</div>
						<div className="flex items-center gap-2">
							{hasActiveFilters && (
								<Button
									variant="outline"
									size="sm"
									onClick={handleClearFilters}
									className="h-8 text-xs border-rose-200 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
								>
									<X className="w-3 h-3 mr-1" />
									Hapus Filter
								</Button>
							)}
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setIsExpanded(!isExpanded)}
								className="md:hidden h-8 text-xs text-slate-600"
							>
								{isExpanded ? "Sembunyikan" : "Tampilkan Filter"}
							</Button>
						</div>
					</div>

					{/* Filter Content */}
					<div
						className={`space-y-4 ${isExpanded ? "block" : "hidden md:block"}`}
					>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							{/* Search Input */}
							<div className="space-y-1.5">
								<label
									htmlFor="search"
									className="text-xs font-medium text-slate-700"
								>
									Pencarian Data
								</label>
								<div className="relative">
									<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
									<Input
										id="search"
										placeholder="Cari pemohon, rekan pengganti, PJ, atau no pengajuan..."
										value={searchTerm}
										onChange={(e) => setSearchTerm(e.target.value)}
										className="pl-9 h-10 bg-white border-slate-200 text-sm focus:border-sky-500 focus:ring-sky-500/20"
									/>
								</div>
							</div>

							{/* Status Filter */}
							<div className="space-y-1.5">
								<label
									htmlFor="status"
									className="text-xs font-medium text-slate-700"
								>
									Status Pengajuan
								</label>
								<Select value={statusFilter} onValueChange={setStatusFilter}>
									<SelectTrigger className="h-10 bg-white border-slate-200 text-sm">
										<SelectValue placeholder="Pilih status" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">Semua Status</SelectItem>
										<SelectItem value="Proses Pengajuan">
											Proses Pengajuan
										</SelectItem>
										<SelectItem value="Disetujui">Disetujui</SelectItem>
										<SelectItem value="Ditolak">Ditolak</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>

						{/* Filter Summary */}
						{hasActiveFilters && (
							<div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
								<span className="font-medium">Filter aktif:</span>
								{searchTerm && (
									<span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-sky-50 text-sky-700 border border-sky-200 rounded-full font-medium">
										"{searchTerm}"
									</span>
								)}
								{statusFilter !== "all" && (
									<span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-full font-medium">
										Status: {statusFilter}
									</span>
								)}
							</div>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	);
};

export default PengajuanFilters;

