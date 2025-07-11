"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
	Plus,
	Search,
	Filter,
	ChevronDown,
	Users,
	Clock,
	CheckCircle,
	AlertTriangle,
	Zap,
	TrendingUp,
	Calendar,
	Building2,
	RefreshCw,
	X,
	Eye,
	Edit,
	Trash2,
} from "lucide-react";
import moment from "moment";
import { RequestCard, RequestModal } from "@/components/development";
import { getClientToken } from "@/lib/client-auth";

export default function DevelopmentRequestsPage() {
	const router = useRouter();
	const [requests, setRequests] = useState([]);
	const [statistics, setStatistics] = useState({});
	const [masterData, setMasterData] = useState({
		moduleTypes: [],
		priorities: [],
		statuses: [],
		departments: [],
	});
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState(null);

	// Filter states
	const [selectedStatus, setSelectedStatus] = useState("ALL");
	const [selectedPriority, setSelectedPriority] = useState("ALL");
	const [selectedModuleType, setSelectedModuleType] = useState("ALL");
	const [selectedDepartment, setSelectedDepartment] = useState("ALL");
	const [searchTerm, setSearchTerm] = useState("");
	const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
	const [showFilters, setShowFilters] = useState(false);

	// Pagination states
	const [currentPage, setCurrentPage] = useState(1);
	const [hasMore, setHasMore] = useState(false);
	const [isLoadingMore, setIsLoadingMore] = useState(false);

	// Modal states
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [selectedRequest, setSelectedRequest] = useState(null);

	// Debounce search term
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearchTerm(searchTerm);
		}, 500);

		return () => clearTimeout(timer);
	}, [searchTerm]);

	const fetchData = async (reset = false) => {
		if (reset) {
			setIsLoading(true);
			setCurrentPage(1);
		} else {
			setIsLoadingMore(true);
		}

		try {
			const offset = reset ? 0 : (currentPage - 1) * 20;
			const params = new URLSearchParams({
				limit: "20",
				offset: offset.toString(),
				status: selectedStatus,
				priority: selectedPriority,
				module_type: selectedModuleType,
				department: selectedDepartment,
				search: debouncedSearchTerm,
			});

			// Get authentication token
			const token = getClientToken();

			const headers = {};
			if (token) {
				headers["Authorization"] = `Bearer ${token}`;
			}

			const response = await fetch(`/api/development?${params}`, {
				headers,
			});
			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || "Gagal mengambil data");
			}

			if (reset) {
				setRequests(result.data.requests);
			} else {
				setRequests((prev) => [...prev, ...result.data.requests]);
			}

			setStatistics(result.data.statistics);
			setMasterData(result.data.masterData);
			setHasMore(result.data.pagination.hasMore);
			setError(null);
		} catch (err) {
			console.error("Error fetching development requests:", err);
			setError(err.message);
		} finally {
			setIsLoading(false);
			setIsLoadingMore(false);
		}
	};

	useEffect(() => {
		setCurrentPage(1);
		fetchData(true);
	}, [
		selectedStatus,
		selectedPriority,
		selectedModuleType,
		selectedDepartment,
		debouncedSearchTerm,
	]);

	const handleLoadMore = () => {
		if (!isLoadingMore && hasMore) {
			setCurrentPage((prev) => prev + 1);
			fetchData(false);
		}
	};

	const handleRefresh = () => {
		fetchData(true);
	};

	const handleClearSearch = () => {
		setSearchTerm("");
		setDebouncedSearchTerm("");
	};

	const handleSaveRequest = async (formData) => {
		try {
			const isEditing = !!selectedRequest;
			const url = isEditing
				? `/api/development/${selectedRequest.request_id}`
				: "/api/development";
			const method = isEditing ? "PUT" : "POST";

			// Get authentication token
			const token = getClientToken();

			const headers = {
				"Content-Type": "application/json",
			};

			// Add authorization header if token exists
			if (token) {
				headers["Authorization"] = `Bearer ${token}`;
			}

			const response = await fetch(url, {
				method,
				headers,
				body: JSON.stringify(formData),
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || "Gagal menyimpan pengajuan");
			}

			// Refresh data
			fetchData(true);
			setShowCreateModal(false);
			setSelectedRequest(null);

			// Show success message
			alert(
				isEditing
					? "Pengajuan berhasil diperbarui"
					: "Pengajuan berhasil dibuat"
			);
		} catch (error) {
			console.error("Error saving request:", error);
			throw error; // Re-throw to be handled by modal
		}
	};

	if (isLoading) {
		return (
			<div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
				<div className="flex justify-center items-center h-64">
					<div className="text-center">
						<RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
						<p className="text-gray-600">
							Memuat data pengajuan pengembangan...
						</p>
					</div>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
				<div className="text-center py-12">
					<AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
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
							Pengajuan Pengembangan Modul IT
						</h1>
						<p className="text-gray-600">
							Kelola pengajuan pengembangan software dan modul sistem
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
						<button
							onClick={() => setShowCreateModal(true)}
							className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
						>
							<Plus className="w-4 h-4" />
							<span className="hidden sm:inline">Pengajuan Baru</span>
						</button>
					</div>
				</div>

				{/* Statistics Cards - Hidden on mobile */}
				<div className="hidden md:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6">
					<div className="bg-white p-4 rounded-lg border border-gray-200">
						<div className="flex items-center justify-between mb-2">
							<div className="p-2 bg-blue-100 rounded-lg">
								<Users className="w-5 h-5 text-blue-600" />
							</div>
						</div>
						<p className="text-2xl font-bold text-gray-900">
							{statistics.total_requests || 0}
						</p>
						<p className="text-sm text-gray-600">Total Pengajuan</p>
					</div>

					<div className="bg-white p-4 rounded-lg border border-gray-200">
						<div className="flex items-center justify-between mb-2">
							<div className="p-2 bg-yellow-100 rounded-lg">
								<Clock className="w-5 h-5 text-yellow-600" />
							</div>
						</div>
						<p className="text-2xl font-bold text-gray-900">
							{statistics.pending_review || 0}
						</p>
						<p className="text-sm text-gray-600">Menunggu Review</p>
					</div>

					<div className="bg-white p-4 rounded-lg border border-gray-200">
						<div className="flex items-center justify-between mb-2">
							<div className="p-2 bg-orange-100 rounded-lg">
								<TrendingUp className="w-5 h-5 text-orange-600" />
							</div>
						</div>
						<p className="text-2xl font-bold text-gray-900">
							{statistics.in_progress || 0}
						</p>
						<p className="text-sm text-gray-600">Dalam Pengembangan</p>
					</div>

					<div className="bg-white p-4 rounded-lg border border-gray-200">
						<div className="flex items-center justify-between mb-2">
							<div className="p-2 bg-green-100 rounded-lg">
								<CheckCircle className="w-5 h-5 text-green-600" />
							</div>
						</div>
						<p className="text-2xl font-bold text-gray-900">
							{statistics.completed || 0}
						</p>
						<p className="text-sm text-gray-600">Selesai</p>
					</div>

					<div className="bg-white p-4 rounded-lg border border-gray-200">
						<div className="flex items-center justify-between mb-2">
							<div className="p-2 bg-red-100 rounded-lg">
								<X className="w-5 h-5 text-red-600" />
							</div>
						</div>
						<p className="text-2xl font-bold text-gray-900">
							{statistics.rejected || 0}
						</p>
						<p className="text-sm text-gray-600">Ditolak</p>
					</div>

					<div className="bg-white p-4 rounded-lg border border-gray-200">
						<div className="flex items-center justify-between mb-2">
							<div className="p-2 bg-purple-100 rounded-lg">
								<Calendar className="w-5 h-5 text-purple-600" />
							</div>
						</div>
						<p className="text-2xl font-bold text-gray-900">
							{statistics.avg_completion_days || 0}
						</p>
						<p className="text-sm text-gray-600">Rata-rata Hari</p>
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
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
						{/* Status Filter */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Status
							</label>
							<div className="relative">
								<select
									value={selectedStatus}
									onChange={(e) => setSelectedStatus(e.target.value)}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
								>
									<option value="ALL">Semua Status</option>
									{masterData.statuses.map((status) => (
										<option key={status.status_id} value={status.status_id}>
											{status.status_name}
										</option>
									))}
								</select>
								<ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
							</div>
						</div>

						{/* Priority Filter */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Prioritas
							</label>
							<div className="relative">
								<select
									value={selectedPriority}
									onChange={(e) => setSelectedPriority(e.target.value)}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
								>
									<option value="ALL">Semua Prioritas</option>
									{masterData.priorities.map((priority) => (
										<option
											key={priority.priority_id}
											value={priority.priority_id}
										>
											{priority.priority_name}
										</option>
									))}
								</select>
								<ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
							</div>
						</div>

						{/* Module Type Filter */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Jenis Modul
							</label>
							<div className="relative">
								<select
									value={selectedModuleType}
									onChange={(e) => setSelectedModuleType(e.target.value)}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
								>
									<option value="ALL">Semua Jenis</option>
									{masterData.moduleTypes.map((type) => (
										<option key={type.type_id} value={type.type_id}>
											{type.type_name}
										</option>
									))}
								</select>
								<ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
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
									{masterData.departments.map((dept) => (
										<option key={dept.dep_id} value={dept.dep_id}>
											{dept.nama}
										</option>
									))}
								</select>
								<ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
							</div>
						</div>

						{/* Search */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Pencarian
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
									placeholder="Judul, deskripsi..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className={`w-full pl-10 ${
										searchTerm ? "pr-10" : "pr-4"
									} py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
										searchTerm !== debouncedSearchTerm
											? "border-blue-300 bg-blue-50"
											: "border-gray-300"
									}`}
								/>
								{searchTerm && (
									<button
										onClick={handleClearSearch}
										className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
									>
										<X className="w-4 h-4" />
									</button>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Request List */}
			<div className="space-y-4">
				{requests.map((request) => (
					<RequestCard
						key={request.request_id}
						request={request}
						onView={(request) =>
							router.push(`/dashboard/development/${request.request_id}`)
						}
						onEdit={(request) => {
							setSelectedRequest(request);
							setShowCreateModal(true);
						}}
						onDelete={null} // Will be implemented later
					/>
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
			{requests.length === 0 && !isLoading && (
				<div className="text-center py-12">
					<Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
					<h3 className="text-lg font-semibold text-gray-900 mb-2">
						Tidak Ada Pengajuan
					</h3>
					<p className="text-gray-600 mb-4">
						Belum ada pengajuan pengembangan untuk filter yang dipilih
					</p>
					<button
						onClick={() => setShowCreateModal(true)}
						className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
					>
						Buat Pengajuan Pertama
					</button>
				</div>
			)}

			{/* Request Modal */}
			<RequestModal
				isOpen={showCreateModal}
				onClose={() => {
					setShowCreateModal(false);
					setSelectedRequest(null);
				}}
				onSave={handleSaveRequest}
				request={selectedRequest}
				masterData={masterData}
			/>
		</div>
	);
}
