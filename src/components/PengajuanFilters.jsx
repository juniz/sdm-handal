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
		<Card className="mb-4">
			<CardContent className="p-4">
				<div className="space-y-4">
					{/* Filter Header */}
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<Filter className="w-4 h-4 text-gray-600" />
							<h3 className="text-sm font-medium text-gray-900">
								Filter & Pencarian
							</h3>
							{hasActiveFilters && (
								<span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
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
									className="text-red-600 hover:text-red-700 hover:bg-red-50"
								>
									<X className="w-3 h-3 mr-1" />
									Hapus Filter
								</Button>
							)}
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setIsExpanded(!isExpanded)}
								className="md:hidden"
							>
								{isExpanded ? "Sembunyikan" : "Tampilkan"}
							</Button>
						</div>
					</div>

					{/* Filter Content */}
					<div
						className={`space-y-4 ${isExpanded ? "block" : "hidden md:block"}`}
					>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							{/* Search Input */}
							<div className="space-y-2">
								<label
									htmlFor="search"
									className="text-sm font-medium text-gray-700"
								>
									Cari Nama Pemohon
								</label>
								<div className="relative">
									<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
									<Input
										id="search"
										placeholder="Masukkan nama pemohon..."
										value={searchTerm}
										onChange={(e) => setSearchTerm(e.target.value)}
										className="pl-10"
									/>
								</div>
							</div>

							{/* Status Filter */}
							<div className="space-y-2">
								<label
									htmlFor="status"
									className="text-sm font-medium text-gray-700"
								>
									Filter Status
								</label>
								<Select value={statusFilter} onValueChange={setStatusFilter}>
									<SelectTrigger>
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
							<div className="flex flex-wrap gap-2 pt-2 border-t">
								<span className="text-xs text-gray-600">Filter aktif:</span>
								{searchTerm && (
									<span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
										Pencarian: "{searchTerm}"
									</span>
								)}
								{statusFilter !== "all" && (
									<span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
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
