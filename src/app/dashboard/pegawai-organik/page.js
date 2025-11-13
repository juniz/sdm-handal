"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
	Search,
	Shield,
	UserCheck,
	Users,
	XCircle,
	RefreshCw,
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
} from "lucide-react";
import { getClientToken } from "@/lib/client-auth";

export default function PegawaiOrganikPage() {
	const [pegawaiData, setPegawaiData] = useState({
		pns: [],
		polri: [],
	});
	const [filteredData, setFilteredData] = useState({
		pns: [],
		polri: [],
	});
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
	const [activeTab, setActiveTab] = useState("pns");
	const [currentPage, setCurrentPage] = useState({ pns: 1, polri: 1 });
	const [itemsPerPage] = useState(10);

	// Debounce search term
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearchTerm(searchTerm);
		}, 500);

		return () => clearTimeout(timer);
	}, [searchTerm]);

	useEffect(() => {
		fetchPegawaiOrganik();
	}, []);

	useEffect(() => {
		// Filter data berdasarkan search term
		if (debouncedSearchTerm.trim() === "") {
			setFilteredData(pegawaiData);
		} else {
			const searchLower = debouncedSearchTerm.toLowerCase();
			setFilteredData({
				pns: pegawaiData.pns.filter(
					(pegawai) =>
						pegawai.nik?.toLowerCase().includes(searchLower) ||
						pegawai.nama?.toLowerCase().includes(searchLower) ||
						pegawai.jbtn?.toLowerCase().includes(searchLower) ||
						pegawai.departemen?.toLowerCase().includes(searchLower)
				),
				polri: pegawaiData.polri.filter(
					(pegawai) =>
						pegawai.nik?.toLowerCase().includes(searchLower) ||
						pegawai.nama?.toLowerCase().includes(searchLower) ||
						pegawai.jbtn?.toLowerCase().includes(searchLower) ||
						pegawai.departemen?.toLowerCase().includes(searchLower)
				),
			});
		}
		// Reset page ke 1 saat search berubah
		setCurrentPage({ pns: 1, polri: 1 });
	}, [debouncedSearchTerm, pegawaiData]);

	// Reset page saat tab berubah
	useEffect(() => {
		// Page sudah di-manage per tab, tidak perlu reset
	}, [activeTab]);

	const fetchPegawaiOrganik = async () => {
		try {
			setIsLoading(true);
			setError(null);

			const token = getClientToken();
			const headers = {};
			if (token) {
				headers["Authorization"] = `Bearer ${token}`;
			}

			const response = await fetch("/api/pegawai-organik", {
				headers,
			});

			if (!response.ok) {
				throw new Error("Gagal mengambil data pegawai organik");
			}

			const result = await response.json();

			if (result.status === "success") {
				setPegawaiData(result.data);
				setFilteredData(result.data);
			} else {
				throw new Error(result.error || "Gagal mengambil data");
			}
		} catch (err) {
			console.error("Error fetching pegawai organik:", err);
			setError(err.message || "Terjadi kesalahan saat mengambil data");
		} finally {
			setIsLoading(false);
		}
	};

	const handleRefresh = () => {
		fetchPegawaiOrganik();
	};

	const handleClearSearch = () => {
		setSearchTerm("");
		setDebouncedSearchTerm("");
	};

	const handleSearchKeyDown = (e) => {
		if (e.key === "Escape") {
			handleClearSearch();
		}
	};

	// Pagination helpers
	const getPaginatedData = (data, page) => {
		const startIndex = (page - 1) * itemsPerPage;
		const endIndex = startIndex + itemsPerPage;
		return data.slice(startIndex, endIndex);
	};

	const getTotalPages = (data) => {
		return Math.ceil(data.length / itemsPerPage);
	};

	const handlePageChange = (page) => {
		setCurrentPage((prev) => ({
			...prev,
			[activeTab]: page,
		}));
		// Scroll to top of table
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	// Get current paginated data
	const paginatedPns = getPaginatedData(filteredData.pns, currentPage.pns);
	const paginatedPolri = getPaginatedData(
		filteredData.polri,
		currentPage.polri
	);

	const totalPagesPns = getTotalPages(filteredData.pns);
	const totalPagesPolri = getTotalPages(filteredData.polri);

	if (isLoading) {
		return (
			<div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
				<div className="flex justify-center items-center h-64">
					<div className="text-center">
						<RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
						<p className="text-gray-600">Memuat data pegawai organik...</p>
					</div>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
				<div className="text-center py-12">
					<XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
					<h3 className="text-lg font-semibold text-gray-900 mb-2">
						Gagal Memuat Data
					</h3>
					<p className="text-gray-600 mb-4">{error}</p>
					<button
						onClick={handleRefresh}
						className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
					>
						Coba Lagi
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
			{/* Header */}
			<div className="mb-6">
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
					<div>
						<h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
							Pegawai Organik
						</h1>
						<p className="text-gray-600">
							Daftar pegawai organik yang dikelompokkan berdasarkan status kerja
						</p>
					</div>
					<div className="flex gap-2 mt-3 sm:mt-0">
						<button
							onClick={handleRefresh}
							className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
						>
							<RefreshCw className="w-4 h-4" />
							<span className="hidden sm:inline">Refresh</span>
						</button>
					</div>
				</div>

				{/* Statistics Cards */}
				<div className="hidden md:grid grid-cols-2 gap-3 sm:gap-4 mb-6">
					<div className="bg-white p-4 rounded-lg border border-gray-200">
						<div className="flex items-center justify-between mb-2">
							<div className="p-2 bg-blue-100 rounded-lg">
								<UserCheck className="w-5 h-5 text-blue-600" />
							</div>
						</div>
						<p className="text-2xl font-bold text-gray-900">
							{pegawaiData.pns.length || 0}
						</p>
						<p className="text-sm text-gray-600">Total PNS</p>
					</div>

					<div className="bg-white p-4 rounded-lg border border-gray-200">
						<div className="flex items-center justify-between mb-2">
							<div className="p-2 bg-red-100 rounded-lg">
								<Shield className="w-5 h-5 text-red-600" />
							</div>
						</div>
						<p className="text-2xl font-bold text-gray-900">
							{pegawaiData.polri.length || 0}
						</p>
						<p className="text-sm text-gray-600">Total POLRI</p>
					</div>
				</div>
			</div>

			{/* Search Bar */}
			<div className="bg-white rounded-lg border border-gray-200 mb-6 p-4">
				<label className="block text-sm font-medium text-gray-700 mb-1">
					Cari Pegawai
					{searchTerm !== debouncedSearchTerm && (
						<span className="text-xs text-blue-600 ml-2">(menunggu...)</span>
					)}
				</label>
				<div className="relative">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
					<input
						type="text"
						placeholder="Nama, NIK, Jabatan, atau Departemen..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						onKeyDown={handleSearchKeyDown}
						className={`w-full pl-10 ${
							searchTerm ? "pr-20" : "pr-4"
						} py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
							searchTerm !== debouncedSearchTerm
								? "border-blue-300 bg-blue-50"
								: "border-gray-300"
						}`}
					/>
					<div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
						{searchTerm && searchTerm === debouncedSearchTerm && (
							<button
								onClick={handleClearSearch}
								className="text-gray-400 hover:text-gray-600 transition-colors"
								title="Hapus pencarian"
							>
								<XCircle className="w-4 h-4" />
							</button>
						)}
						{searchTerm !== debouncedSearchTerm && (
							<RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
						)}
					</div>
				</div>
				{searchTerm && (
					<p className="text-xs text-gray-500 mt-1">
						{searchTerm === debouncedSearchTerm
							? `Mencari: "${debouncedSearchTerm}"`
							: "Mengetik..."}
					</p>
				)}
			</div>

			{/* Tabs */}
			<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
				<div className="bg-gradient-to-r from-blue-50 via-white to-red-50 rounded-xl border border-gray-200 shadow-lg mb-6 overflow-hidden backdrop-blur-sm">
					<TabsList className="w-full justify-start bg-transparent h-auto gap-2">
						<TabsTrigger
							value="pns"
							className={`group flex items-center gap-2.5 px-6 py-3.5 rounded-lg transition-all duration-300 ease-in-out relative ${
								activeTab === "pns"
									? "bg-white shadow-lg scale-[1.02] text-blue-700 font-semibold"
									: "text-gray-600 hover:bg-white/60 hover:text-gray-800"
							}`}
						>
							<UserCheck
								className={`w-5 h-5 transition-all duration-300 ${
									activeTab === "pns"
										? "text-blue-600 scale-110"
										: "text-gray-500 group-hover:text-gray-700"
								}`}
							/>
							<span className="text-sm sm:text-base font-medium">
								<span className="hidden sm:inline">Pegawai Negeri Sipil</span>
								<span className="sm:hidden">PNS</span>
							</span>
							<span
								className={`ml-2 px-2.5 py-1 text-xs font-bold rounded-full transition-all duration-300 ${
									activeTab === "pns"
										? "bg-blue-600 text-white shadow-md"
										: "bg-blue-100 text-blue-700"
								}`}
							>
								{filteredData.pns.length}
							</span>
							{activeTab === "pns" && (
								<div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-t-full"></div>
							)}
						</TabsTrigger>
						<TabsTrigger
							value="polri"
							className={`group flex items-center gap-2.5 px-6 py-3.5 rounded-lg transition-all duration-300 ease-in-out relative ${
								activeTab === "polri"
									? "bg-white shadow-lg scale-[1.02] text-red-700 font-semibold"
									: "text-gray-600 hover:bg-white/60 hover:text-gray-800"
							}`}
						>
							<Shield
								className={`w-5 h-5 transition-all duration-300 ${
									activeTab === "polri"
										? "text-red-600 scale-110"
										: "text-gray-500 group-hover:text-gray-700"
								}`}
							/>
							<span className="text-sm sm:text-base font-medium">
								<span className="hidden sm:inline">Kepolisian RI</span>
								<span className="sm:hidden">POLRI</span>
							</span>
							<span
								className={`ml-2 px-2.5 py-1 text-xs font-bold rounded-full transition-all duration-300 ${
									activeTab === "polri"
										? "bg-red-600 text-white shadow-md"
										: "bg-red-100 text-red-700"
								}`}
							>
								{filteredData.polri.length}
							</span>
							{activeTab === "polri" && (
								<div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 to-red-600 rounded-t-full"></div>
							)}
						</TabsTrigger>
					</TabsList>
				</div>

				{/* PNS Tab Content */}
				<TabsContent value="pns" className="mt-0">
					{/* Desktop Table */}
					<div className="hidden lg:block bg-white rounded-lg border border-gray-200 overflow-hidden">
						<div className="overflow-x-auto">
							<table className="w-full">
								<thead className="bg-gray-50">
									<tr>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											NIK
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Nama
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Jabatan
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Departemen
										</th>
									</tr>
								</thead>
								<tbody className="bg-white divide-y divide-gray-200">
									{filteredData.pns.length === 0 ? (
										<tr>
											<td colSpan="4" className="px-6 py-12 text-center">
												<Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
												<h3 className="text-lg font-semibold text-gray-900 mb-2">
													Tidak Ada Data
												</h3>
												<p className="text-gray-600">
													{searchTerm
														? "Tidak ada pegawai PNS yang sesuai dengan pencarian"
														: "Tidak ada data pegawai PNS"}
												</p>
											</td>
										</tr>
									) : (
										paginatedPns.map((pegawai, index) => (
											<tr
												key={`pns-${pegawai.nik}-${index}`}
												className="hover:bg-gray-50"
											>
												<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
													{pegawai.nik || "-"}
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
													{pegawai.nama || "-"}
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
													{pegawai.jbtn || "-"}
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
													{pegawai.departemen || "-"}
												</td>
											</tr>
										))
									)}
								</tbody>
							</table>
						</div>
					</div>

					{/* Pagination Desktop */}
					{totalPagesPns > 1 && (
						<div className="hidden lg:block">
							<PaginationComponent
								currentPage={currentPage.pns}
								totalPages={totalPagesPns}
								totalItems={filteredData.pns.length}
								itemsPerPage={itemsPerPage}
								onPageChange={(page) => handlePageChange(page)}
							/>
						</div>
					)}

					{/* Mobile Cards */}
					<div className="lg:hidden space-y-4">
						{filteredData.pns.length === 0 ? (
							<div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
								<Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
								<h3 className="text-lg font-semibold text-gray-900 mb-2">
									Tidak Ada Data
								</h3>
								<p className="text-gray-600">
									{searchTerm
										? "Tidak ada pegawai PNS yang sesuai dengan pencarian"
										: "Tidak ada data pegawai PNS"}
								</p>
							</div>
						) : (
							paginatedPns.map((pegawai, index) => (
								<div
									key={`pns-${pegawai.nik}-${index}`}
									className="bg-white rounded-lg border border-gray-200 p-4"
								>
									<div className="flex items-start justify-between mb-3">
										<div className="flex-1">
											<h3 className="font-semibold text-gray-900 mb-1">
												{pegawai.nama || "-"}
											</h3>
											<p className="text-sm text-gray-600 mb-1">
												{pegawai.nik || "-"}
											</p>
											<p className="text-sm text-gray-600">
												{pegawai.departemen || "-"}
											</p>
										</div>
									</div>
									<div className="mt-3 pt-3 border-t border-gray-200">
										<p className="text-xs text-gray-500 mb-1">Jabatan</p>
										<p className="text-sm font-medium text-gray-900">
											{pegawai.jbtn || "-"}
										</p>
									</div>
								</div>
							))
						)}
					</div>

					{/* Pagination Mobile */}
					{totalPagesPns > 1 && (
						<div className="lg:hidden mt-4">
							<PaginationComponent
								currentPage={currentPage.pns}
								totalPages={totalPagesPns}
								totalItems={filteredData.pns.length}
								itemsPerPage={itemsPerPage}
								onPageChange={(page) => handlePageChange(page)}
							/>
						</div>
					)}
				</TabsContent>

				{/* POLRI Tab Content */}
				<TabsContent value="polri" className="mt-0">
					{/* Desktop Table */}
					<div className="hidden lg:block bg-white rounded-lg border border-gray-200 overflow-hidden">
						<div className="overflow-x-auto">
							<table className="w-full">
								<thead className="bg-gray-50">
									<tr>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											NIK
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Nama
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Jabatan
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Departemen
										</th>
									</tr>
								</thead>
								<tbody className="bg-white divide-y divide-gray-200">
									{filteredData.polri.length === 0 ? (
										<tr>
											<td colSpan="4" className="px-6 py-12 text-center">
												<Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
												<h3 className="text-lg font-semibold text-gray-900 mb-2">
													Tidak Ada Data
												</h3>
												<p className="text-gray-600">
													{searchTerm
														? "Tidak ada pegawai POLRI yang sesuai dengan pencarian"
														: "Tidak ada data pegawai POLRI"}
												</p>
											</td>
										</tr>
									) : (
										paginatedPolri.map((pegawai, index) => (
											<tr
												key={`polri-${pegawai.nik}-${index}`}
												className="hover:bg-gray-50"
											>
												<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
													{pegawai.nik || "-"}
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
													{pegawai.nama || "-"}
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
													{pegawai.jbtn || "-"}
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
													{pegawai.departemen || "-"}
												</td>
											</tr>
										))
									)}
								</tbody>
							</table>
						</div>
					</div>

					{/* Pagination Desktop */}
					{totalPagesPolri > 1 && (
						<div className="hidden lg:block">
							<PaginationComponent
								currentPage={currentPage.polri}
								totalPages={totalPagesPolri}
								totalItems={filteredData.polri.length}
								itemsPerPage={itemsPerPage}
								onPageChange={(page) => handlePageChange(page)}
							/>
						</div>
					)}

					{/* Mobile Cards */}
					<div className="lg:hidden space-y-4">
						{filteredData.polri.length === 0 ? (
							<div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
								<Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
								<h3 className="text-lg font-semibold text-gray-900 mb-2">
									Tidak Ada Data
								</h3>
								<p className="text-gray-600">
									{searchTerm
										? "Tidak ada pegawai POLRI yang sesuai dengan pencarian"
										: "Tidak ada data pegawai POLRI"}
								</p>
							</div>
						) : (
							paginatedPolri.map((pegawai, index) => (
								<div
									key={`polri-${pegawai.nik}-${index}`}
									className="bg-white rounded-lg border border-gray-200 p-4"
								>
									<div className="flex items-start justify-between mb-3">
										<div className="flex-1">
											<h3 className="font-semibold text-gray-900 mb-1">
												{pegawai.nama || "-"}
											</h3>
											<p className="text-sm text-gray-600 mb-1">
												{pegawai.nik || "-"}
											</p>
											<p className="text-sm text-gray-600">
												{pegawai.departemen || "-"}
											</p>
										</div>
									</div>
									<div className="mt-3 pt-3 border-t border-gray-200">
										<p className="text-xs text-gray-500 mb-1">Jabatan</p>
										<p className="text-sm font-medium text-gray-900">
											{pegawai.jbtn || "-"}
										</p>
									</div>
								</div>
							))
						)}
					</div>

					{/* Pagination Mobile */}
					{totalPagesPolri > 1 && (
						<div className="lg:hidden mt-4">
							<PaginationComponent
								currentPage={currentPage.polri}
								totalPages={totalPagesPolri}
								totalItems={filteredData.polri.length}
								itemsPerPage={itemsPerPage}
								onPageChange={(page) => handlePageChange(page)}
							/>
						</div>
					)}
				</TabsContent>
			</Tabs>
		</div>
	);
}

// Pagination Component
function PaginationComponent({
	currentPage,
	totalPages,
	totalItems,
	itemsPerPage,
	onPageChange,
}) {
	const startIndex = (currentPage - 1) * itemsPerPage;
	const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

	const goToPage = (page) => {
		if (page >= 1 && page <= totalPages) {
			onPageChange(page);
		}
	};

	const goToFirstPage = () => goToPage(1);
	const goToLastPage = () => goToPage(totalPages);
	const goToPreviousPage = () => goToPage(currentPage - 1);
	const goToNextPage = () => goToPage(currentPage + 1);

	// Generate page numbers for pagination
	const getPageNumbers = () => {
		const pages = [];
		const maxVisiblePages = 5;

		if (totalPages <= maxVisiblePages) {
			for (let i = 1; i <= totalPages; i++) {
				pages.push(i);
			}
		} else {
			const startPage = Math.max(
				1,
				currentPage - Math.floor(maxVisiblePages / 2)
			);
			const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

			for (let i = startPage; i <= endPage; i++) {
				pages.push(i);
			}
		}

		return pages;
	};

	return (
		<div className="bg-white rounded-lg border border-gray-200 p-4 mt-6">
			<div className="flex flex-col sm:flex-row items-center justify-between gap-4">
				{/* Info */}
				<div className="text-sm text-gray-600">
					Menampilkan <span className="font-semibold">{startIndex + 1}</span> -{" "}
					<span className="font-semibold">{endIndex}</span> dari{" "}
					<span className="font-semibold">{totalItems}</span> data
				</div>

				{/* Pagination Controls */}
				<div className="flex items-center gap-2">
					{/* First Page */}
					<button
						onClick={goToFirstPage}
						disabled={currentPage === 1}
						className="hidden sm:flex items-center justify-center w-9 h-9 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						title="Halaman pertama"
					>
						<ChevronsLeft className="w-4 h-4" />
					</button>

					{/* Previous Page */}
					<button
						onClick={goToPreviousPage}
						disabled={currentPage === 1}
						className="flex items-center justify-center w-9 h-9 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						title="Halaman sebelumnya"
					>
						<ChevronLeft className="w-4 h-4" />
					</button>

					{/* Page Numbers */}
					<div className="flex items-center gap-1">
						{getPageNumbers().map((pageNum) => (
							<button
								key={`page-${pageNum}`}
								onClick={() => goToPage(pageNum)}
								className={`min-w-[36px] h-9 px-2 text-sm font-medium rounded-lg transition-colors ${
									currentPage === pageNum
										? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
										: "border border-gray-300 text-gray-700 hover:bg-gray-50"
								}`}
							>
								{pageNum}
							</button>
						))}
					</div>

					{/* Next Page */}
					<button
						onClick={goToNextPage}
						disabled={currentPage === totalPages}
						className="flex items-center justify-center w-9 h-9 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						title="Halaman berikutnya"
					>
						<ChevronRight className="w-4 h-4" />
					</button>

					{/* Last Page */}
					<button
						onClick={goToLastPage}
						disabled={currentPage === totalPages}
						className="hidden sm:flex items-center justify-center w-9 h-9 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						title="Halaman terakhir"
					>
						<ChevronsRight className="w-4 h-4" />
					</button>
				</div>
			</div>
		</div>
	);
}
