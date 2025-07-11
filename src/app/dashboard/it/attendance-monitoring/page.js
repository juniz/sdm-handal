"use client";

import { useState, useEffect, useCallback } from "react";
import {
	Users,
	Calendar,
	Clock,
	TrendingUp,
	Search,
	Filter,
	ChevronDown,
	CheckCircle,
	XCircle,
	AlertCircle,
	Building2,
	Camera,
	Download,
	RefreshCw,
} from "lucide-react";
import moment from "moment";

export default function AttendanceMonitoringPage() {
	const [attendanceData, setAttendanceData] = useState([]);
	const [statistics, setStatistics] = useState({});
	const [departments, setDepartments] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState(null);

	// Filter states
	const [selectedDate, setSelectedDate] = useState(
		moment().format("YYYY-MM-DD")
	);
	const [selectedDepartment, setSelectedDepartment] = useState("ALL");
	const [selectedStatus, setSelectedStatus] = useState("ALL");
	const [searchTerm, setSearchTerm] = useState("");
	const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
	const [showFilters, setShowFilters] = useState(false);

	// Pagination states
	const [currentPage, setCurrentPage] = useState(1);
	const [hasMore, setHasMore] = useState(false);
	const [isLoadingMore, setIsLoadingMore] = useState(false);

	// Photo modal states
	const [selectedPhoto, setSelectedPhoto] = useState(null);
	const [showPhotoModal, setShowPhotoModal] = useState(false);

	// Debounce search term
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearchTerm(searchTerm);
		}, 500); // 500ms delay

		return () => clearTimeout(timer);
	}, [searchTerm]);

	const fetchAttendanceData = async (reset = false) => {
		if (reset) {
			setIsLoading(true);
			setCurrentPage(1);
		} else {
			setIsLoadingMore(true);
		}

		try {
			const offset = reset ? 0 : (currentPage - 1) * 50;
			const params = new URLSearchParams({
				date: selectedDate,
				department: selectedDepartment,
				status: selectedStatus,
				search: debouncedSearchTerm,
				limit: "50",
				offset: offset.toString(),
			});

			const response = await fetch(`/api/it/attendance-monitoring?${params}`);
			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || "Gagal mengambil data");
			}

			if (reset) {
				setAttendanceData(result.data.attendance);
			} else {
				setAttendanceData((prev) => [...prev, ...result.data.attendance]);
			}

			setStatistics(result.data.statistics);
			setDepartments(result.data.departments);
			setHasMore(result.data.pagination.hasMore);
			setError(null);
		} catch (err) {
			console.error("Error fetching attendance data:", err);
			setError(err.message);
		} finally {
			setIsLoading(false);
			setIsLoadingMore(false);
		}
	};

	useEffect(() => {
		setCurrentPage(1); // Reset to first page when filters change
		fetchAttendanceData(true);
	}, [selectedDate, selectedDepartment, selectedStatus, debouncedSearchTerm]);

	const handleLoadMore = () => {
		if (!isLoadingMore && hasMore) {
			setCurrentPage((prev) => prev + 1);
			fetchAttendanceData(false);
		}
	};

	const handleRefresh = () => {
		fetchAttendanceData(true);
	};

	const handlePhotoClick = (photoUrl, employeeName) => {
		setSelectedPhoto({ url: photoUrl, name: employeeName });
		setShowPhotoModal(true);
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

	const getStatusBadge = (status, statusColor) => {
		const colors = {
			success: "bg-green-100 text-green-800 border-green-200",
			danger: "bg-red-100 text-red-800 border-red-200",
			warning: "bg-yellow-100 text-yellow-800 border-yellow-200",
		};

		return (
			<span
				className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
					colors[statusColor] || colors.warning
				}`}
			>
				{status}
			</span>
		);
	};

	const getCheckoutStatusBadge = (status) => {
		if (status === "Sudah Checkout") {
			return (
				<span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
					<CheckCircle className="w-3 h-3 mr-1" />
					Pulang
				</span>
			);
		} else {
			return (
				<span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
					<AlertCircle className="w-3 h-3 mr-1" />
					Belum Pulang
				</span>
			);
		}
	};

	if (isLoading) {
		return (
			<div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
				<div className="flex justify-center items-center h-64">
					<div className="text-center">
						<RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
						<p className="text-gray-600">Memuat data monitoring presensi...</p>
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
							Monitoring Presensi Hari Ini
						</h1>
					</div>
					<div className="flex gap-2 mt-3 sm:mt-0">
						<button
							onClick={handleRefresh}
							className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
						>
							<RefreshCw className="w-4 h-4" />
							<span className="hidden sm:inline">Refresh</span>
						</button>
						<button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
							<Download className="w-4 h-4" />
							<span className="hidden sm:inline">Export</span>
						</button>
					</div>
				</div>

				{/* Statistics Cards */}
				<div className="hidden md:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6">
					<div className="bg-white p-4 rounded-lg border border-gray-200">
						<div className="flex items-center justify-between mb-2">
							<div className="p-2 bg-blue-100 rounded-lg">
								<Users className="w-5 h-5 text-blue-600" />
							</div>
						</div>
						<p className="text-2xl font-bold text-gray-900">
							{statistics.total_attendance || 0}
						</p>
						<p className="text-sm text-gray-600">Total Presensi</p>
					</div>

					<div className="bg-white p-4 rounded-lg border border-gray-200">
						<div className="flex items-center justify-between mb-2">
							<div className="p-2 bg-green-100 rounded-lg">
								<CheckCircle className="w-5 h-5 text-green-600" />
							</div>
						</div>
						<p className="text-2xl font-bold text-gray-900">
							{statistics.tepat_waktu || 0}
						</p>
						<p className="text-sm text-gray-600">Tepat Waktu</p>
					</div>

					<div className="bg-white p-4 rounded-lg border border-gray-200">
						<div className="flex items-center justify-between mb-2">
							<div className="p-2 bg-red-100 rounded-lg">
								<AlertCircle className="w-5 h-5 text-red-600" />
							</div>
						</div>
						<p className="text-2xl font-bold text-gray-900">
							{statistics.terlambat || 0}
						</p>
						<p className="text-sm text-gray-600">Terlambat</p>
					</div>

					<div className="bg-white p-4 rounded-lg border border-gray-200">
						<div className="flex items-center justify-between mb-2">
							<div className="p-2 bg-purple-100 rounded-lg">
								<Clock className="w-5 h-5 text-purple-600" />
							</div>
						</div>
						<p className="text-2xl font-bold text-gray-900">
							{statistics.sudah_checkout || 0}
						</p>
						<p className="text-sm text-gray-600">Sudah Pulang</p>
					</div>

					<div className="bg-white p-4 rounded-lg border border-gray-200">
						<div className="flex items-center justify-between mb-2">
							<div className="p-2 bg-orange-100 rounded-lg">
								<XCircle className="w-5 h-5 text-orange-600" />
							</div>
						</div>
						<p className="text-2xl font-bold text-gray-900">
							{statistics.belum_checkout || 0}
						</p>
						<p className="text-sm text-gray-600">Belum Pulang</p>
					</div>

					<div className="bg-white p-4 rounded-lg border border-gray-200">
						<div className="flex items-center justify-between mb-2">
							<div className="p-2 bg-indigo-100 rounded-lg">
								<Building2 className="w-5 h-5 text-indigo-600" />
							</div>
						</div>
						<p className="text-2xl font-bold text-gray-900">
							{statistics.total_departments || 0}
						</p>
						<p className="text-sm text-gray-600">Departemen</p>
					</div>
				</div>
			</div>

			{/* Filters */}
			<div className="bg-white rounded-lg border border-gray-200 mb-6">
				<div className="p-4 border-b border-gray-200">
					<button
						onClick={() => setShowFilters(!showFilters)}
						className="flex items-center gap-2 text-gray-700 hover:text-gray-900 lg:hidden"
					>
						<Filter className="w-4 h-4" />
						<span>Filter & Pencarian</span>
						<ChevronDown
							className={`w-4 h-4 transition-transform ${
								showFilters ? "rotate-180" : ""
							}`}
						/>
					</button>
				</div>

				<div className={`p-4 ${showFilters ? "block" : "hidden"} lg:block`}>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
						{/* Date Filter */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Tanggal
							</label>
							<div className="relative">
								<Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
								<input
									type="date"
									value={selectedDate}
									onChange={(e) => setSelectedDate(e.target.value)}
									className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
								/>
							</div>
						</div>

						{/* Department Filter */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Departemen
							</label>
							<div className="relative">
								<Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
								<select
									value={selectedDepartment}
									onChange={(e) => setSelectedDepartment(e.target.value)}
									className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
								>
									<option value="ALL">Semua Departemen</option>
									{departments.map((dept) => (
										<option key={dept.dep_id} value={dept.dep_id}>
											{dept.nama}
										</option>
									))}
								</select>
								<ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
							</div>
						</div>

						{/* Status Filter */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Status
							</label>
							<div className="relative">
								<AlertCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
								<select
									value={selectedStatus}
									onChange={(e) => setSelectedStatus(e.target.value)}
									className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
								>
									<option value="ALL">Semua Status</option>
									<option value="Tepat Waktu">Tepat Waktu</option>
									<option value="Terlambat Toleransi">
										Terlambat Toleransi
									</option>
									<option value="Terlambat I">Terlambat I</option>
									<option value="Terlambat II">Terlambat II</option>
								</select>
								<ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
							</div>
						</div>

						{/* Search */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Cari Pegawai
								{searchTerm !== debouncedSearchTerm && (
									<span className="text-xs text-blue-600 ml-2">
										(menunggu...)
									</span>
								)}
							</label>
							<div className="relative">
								<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
								<input
									type="text"
									placeholder="Nama, NIK, atau Departemen..."
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
					</div>
				</div>
			</div>

			{/* Attendance List - Desktop Table */}
			<div className="hidden lg:block bg-white rounded-lg border border-gray-200 overflow-hidden">
				<div className="overflow-x-auto">
					<table className="w-full">
						<thead className="bg-gray-50">
							<tr>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Pegawai
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Departemen
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Shift
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Jam Masuk
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Jam Pulang
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Keterlambatan
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Status
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Pulang
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Foto
								</th>
							</tr>
						</thead>
						<tbody className="bg-white divide-y divide-gray-200">
							{attendanceData.map((attendance) => (
								<tr
									key={`${attendance.pegawai_id}-${attendance.attendance_id}`}
									className="hover:bg-gray-50"
								>
									<td className="px-6 py-4 whitespace-nowrap">
										<div>
											<div className="text-sm font-medium text-gray-900">
												{attendance.nama}
											</div>
											<div className="text-sm text-gray-500">
												{attendance.nik} • {attendance.jnj_jabatan}
											</div>
										</div>
									</td>
									<td className="px-6 py-4 whitespace-nowrap">
										<span className="text-sm text-gray-900">
											{attendance.departemen_nama}
										</span>
									</td>
									<td className="px-6 py-4 whitespace-nowrap">
										<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
											{attendance.shift}
										</span>
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
										{moment(attendance.jam_datang).format("HH:mm")}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
										{attendance.jam_pulang
											? moment(attendance.jam_pulang).format("HH:mm")
											: "-"}
									</td>
									<td className="px-6 py-4 whitespace-nowrap">
										{attendance.keterlambatan ? (
											<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
												{attendance.keterlambatan}
											</span>
										) : (
											<span className="text-sm text-gray-500">-</span>
										)}
									</td>
									<td className="px-6 py-4 whitespace-nowrap">
										{getStatusBadge(attendance.status, attendance.status_color)}
									</td>
									<td className="px-6 py-4 whitespace-nowrap">
										{getCheckoutStatusBadge(attendance.checkout_status)}
									</td>
									<td className="px-6 py-4 whitespace-nowrap">
										{attendance.photo && (
											<button
												onClick={() =>
													handlePhotoClick(attendance.photo, attendance.nama)
												}
												className="flex items-center gap-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
											>
												<Camera className="w-4 h-4 text-gray-600" />
												<span className="text-xs text-gray-600">Lihat</span>
											</button>
										)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

			{/* Attendance List - Mobile Cards */}
			<div className="lg:hidden space-y-4">
				{attendanceData.map((attendance) => (
					<div
						key={`${attendance.pegawai_id}-${attendance.attendance_id}`}
						className="bg-white rounded-lg border border-gray-200 p-4"
					>
						<div className="flex items-start justify-between mb-3">
							<div className="flex-1">
								<h3 className="font-semibold text-gray-900 mb-1">
									{attendance.nama}
								</h3>
								<p className="text-sm text-gray-600 mb-1">
									{attendance.nik} • {attendance.jnj_jabatan}
								</p>
								<p className="text-sm text-gray-600">
									{attendance.departemen_nama}
								</p>
							</div>
							<div className="flex flex-col gap-2 items-end">
								{getStatusBadge(attendance.status, attendance.status_color)}
								{getCheckoutStatusBadge(attendance.checkout_status)}
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4 mb-3">
							<div>
								<p className="text-xs text-gray-500 mb-1">Shift</p>
								<span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
									{attendance.shift}
								</span>
							</div>
							<div>
								<p className="text-xs text-gray-500 mb-1">Jam Masuk</p>
								<p className="text-sm font-medium text-gray-900">
									{moment(attendance.jam_datang).format("HH:mm")}
								</p>
							</div>
							<div>
								<p className="text-xs text-gray-500 mb-1">Jam Pulang</p>
								<p className="text-sm font-medium text-gray-900">
									{attendance.jam_pulang
										? moment(attendance.jam_pulang).format("HH:mm")
										: "-"}
								</p>
							</div>
							<div>
								<p className="text-xs text-gray-500 mb-1">Keterlambatan</p>
								{attendance.keterlambatan ? (
									<span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
										{attendance.keterlambatan}
									</span>
								) : (
									<p className="text-sm text-gray-500">-</p>
								)}
							</div>
						</div>

						{attendance.photo && (
							<button
								onClick={() =>
									handlePhotoClick(attendance.photo, attendance.nama)
								}
								className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
							>
								<Camera className="w-4 h-4 text-gray-600" />
								<span className="text-sm text-gray-600">
									Lihat Foto Presensi
								</span>
							</button>
						)}
					</div>
				))}
			</div>

			{/* Load More Button */}
			{hasMore && (
				<div className="text-center mt-8">
					<button
						onClick={handleLoadMore}
						disabled={isLoadingMore}
						className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
					>
						{isLoadingMore ? (
							<>
								<RefreshCw className="w-4 h-4 animate-spin" />
								<span>Memuat...</span>
							</>
						) : (
							<>
								<TrendingUp className="w-4 h-4" />
								<span>Muat Lebih Banyak</span>
							</>
						)}
					</button>
				</div>
			)}

			{/* No Data */}
			{attendanceData.length === 0 && !isLoading && (
				<div className="text-center py-12">
					<Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
					<h3 className="text-lg font-semibold text-gray-900 mb-2">
						Tidak Ada Data
					</h3>
					<p className="text-gray-600">
						Tidak ada data presensi untuk filter yang dipilih
					</p>
				</div>
			)}

			{/* Photo Modal */}
			{showPhotoModal && selectedPhoto && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
					<div className="bg-white rounded-lg max-w-lg w-full max-h-[80vh] overflow-hidden">
						<div className="flex items-center justify-between p-4 border-b border-gray-200">
							<h3 className="text-lg font-semibold text-gray-900">
								Foto Presensi - {selectedPhoto.name}
							</h3>
							<button
								onClick={() => setShowPhotoModal(false)}
								className="text-gray-400 hover:text-gray-600 transition-colors"
							>
								<XCircle className="w-6 h-6" />
							</button>
						</div>
						<div className="p-4">
							<img
								src={selectedPhoto.url}
								alt={`Foto presensi ${selectedPhoto.name}`}
								className="w-full h-auto rounded-lg"
								onError={(e) => {
									e.target.src = "/api/placeholder/400/300";
								}}
							/>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
