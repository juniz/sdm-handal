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
	const [showStats, setShowStats] = useState(false);

	// Pagination states
	const [currentPage, setCurrentPage] = useState(1);
	const [hasMore, setHasMore] = useState(false);
	const [isLoadingMore, setIsLoadingMore] = useState(false);

	// Modal states
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [selectedRequest, setSelectedRequest] = useState(null);
	const [toast, setToast] = useState({ show: false, message: "", type: "success" });

	const showToast = (message, type = "success") => {
		setToast({ show: true, message, type });
		setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3500);
	};

	const handleStatusFilterClick = (statusKey) => {
		if (!statusKey || statusKey === "ALL") {
			setSelectedStatus("ALL");
			return;
		}
		setSelectedStatus((prev) => (String(prev).toUpperCase() === String(statusKey).toUpperCase() ? "ALL" : statusKey));
	};

	const isStatusActive = (statusKey) => {
		if (statusKey === "ALL") return selectedStatus === "ALL" || !selectedStatus;
		return String(selectedStatus).toUpperCase() === String(statusKey).toUpperCase();
	};

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

			// Show success toast
			showToast(
				isEditing
					? "Pengajuan berhasil diperbarui"
					: "Pengajuan berhasil dibuat",
				"success"
			);
		} catch (error) {
			console.error("Error saving request:", error);
			showToast(error.message || "Gagal menyimpan pengajuan", "error");
			throw error; // Re-throw to be handled by modal
		}
	};

	if (isLoading) {
		return (
			<div className="max-w-7xl mx-auto px-2 sm:px-4 py-3 sm:py-6 space-y-6">
				{/* Header Shimmer */}
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-100">
					<div className="space-y-2">
						<div className="h-7 w-64 bg-slate-200 rounded-md animate-pulse" />
						<div className="h-4 w-80 bg-slate-100 rounded-md animate-pulse" />
					</div>
					<div className="flex items-center gap-2">
						<div className="h-9 w-24 bg-slate-100 rounded-lg animate-pulse" />
						<div className="h-9 w-32 bg-slate-200 rounded-lg animate-pulse" />
					</div>
				</div>

				{/* KPI Stats Grid Shimmer */}
				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
					{[...Array(6)].map((_, i) => (
						<div
							key={i}
							className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3"
						>
							<div className="flex items-center justify-between">
								<div className="h-3 w-16 bg-slate-100 rounded animate-pulse" />
								<div className="w-8 h-8 rounded-lg bg-slate-100 animate-pulse" />
							</div>
							<div className="h-6 w-12 bg-slate-200 rounded animate-pulse" />
						</div>
					))}
				</div>

				{/* Filter Toolbar Shimmer */}
				<div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
						<div className="h-9 bg-slate-100 rounded-lg lg:col-span-1 animate-pulse" />
						<div className="h-9 bg-slate-100 rounded-lg animate-pulse" />
						<div className="h-9 bg-slate-100 rounded-lg animate-pulse" />
						<div className="h-9 bg-slate-100 rounded-lg animate-pulse" />
						<div className="h-9 bg-slate-100 rounded-lg animate-pulse" />
					</div>
				</div>

				{/* Request Cards Shimmer */}
				<div className="space-y-4">
					{[...Array(3)].map((_, i) => (
						<div
							key={i}
							className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4"
						>
							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
								<div className="flex items-center gap-3">
									<div className="h-5 w-20 bg-slate-200 rounded-full animate-pulse" />
									<div className="h-5 w-16 bg-slate-100 rounded-full animate-pulse" />
									<div className="h-4 w-28 bg-slate-100 rounded animate-pulse" />
								</div>
								<div className="h-4 w-32 bg-slate-100 rounded animate-pulse" />
							</div>

							<div className="space-y-2">
								<div className="h-5 w-3/4 bg-slate-200 rounded animate-pulse" />
								<div className="h-4 w-full bg-slate-100 rounded animate-pulse" />
								<div className="h-4 w-2/3 bg-slate-100 rounded animate-pulse" />
							</div>

							<div className="flex items-center justify-between pt-3 border-t border-slate-100">
								<div className="flex items-center gap-4">
									<div className="h-4 w-24 bg-slate-100 rounded animate-pulse" />
									<div className="h-4 w-24 bg-slate-100 rounded animate-pulse" />
								</div>
								<div className="h-8 w-28 bg-slate-100 rounded-lg animate-pulse" />
							</div>
						</div>
					))}
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
					<p className="text-gray-600 mb-4 text-sm">{error}</p>
					<button
						onClick={handleRefresh}
						className="bg-sky-600 text-white px-4 py-2 rounded-lg hover:bg-sky-700 transition-colors text-sm font-medium shadow-sm"
					>
						Coba Lagi
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="max-w-7xl mx-auto px-2 sm:px-4 py-3 sm:py-6">
			{/* Header */}
			<div className="mb-4 sm:mb-6">
				<div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between mb-4">
					<div className="text-center sm:text-left">
						<h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
							Pengajuan Pengembangan Modul IT
						</h1>
						<p className="text-sm sm:text-base text-gray-600">
							Kelola pengajuan pengembangan software dan modul sistem
						</p>
					</div>
					<div className="flex gap-2 justify-center sm:justify-end">
						<button
							onClick={handleRefresh}
							className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors min-w-0 flex-1 sm:flex-initial"
						>
							<RefreshCw className="w-4 h-4 flex-shrink-0" />
							<span className="text-sm sm:text-base">Refresh</span>
						</button>
						<button
							onClick={() => setShowCreateModal(true)}
							className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors min-w-0 flex-1 sm:flex-initial text-sm sm:text-base font-medium shadow-sm"
						>
							<Plus className="w-4 h-4 flex-shrink-0" />
							<span>Buat Baru</span>
						</button>
					</div>
				</div>

				{/* Statistics Cards - Mobile Accordion and Desktop */}
				<div className="mb-4 sm:mb-6">
					{/* Mobile Stats Accordion */}
					<div className="sm:hidden bg-white rounded-xl border border-slate-200 shadow-sm mb-4">
						<button
							onClick={() => setShowStats(!showStats)}
							className="flex items-center justify-between w-full p-3 text-left"
						>
							<div className="flex items-center gap-2">
								<div className="p-1.5 bg-sky-100 rounded-lg">
									<TrendingUp className="w-4 h-4 text-sky-600" />
								</div>
								<span className="font-medium text-gray-900 text-sm">Ringkasan Statistik</span>
							</div>
							<ChevronDown
								className={`w-4 h-4 text-gray-500 transition-transform ${
									showStats ? "rotate-180" : ""
								}`}
							/>
						</button>

						{showStats && (
							<div className="p-3 pt-0 border-t border-slate-100 space-y-3">
								<div className="grid grid-cols-2 gap-2.5">
									<button
										type="button"
										onClick={() => handleStatusFilterClick("ALL")}
										className={`p-3 rounded-lg text-left transition-all border ${
											isStatusActive("ALL")
												? "border-sky-500 ring-2 ring-sky-300 bg-sky-50/50"
												: "bg-slate-50 border-slate-200"
										}`}
									>
										<div className="flex items-center justify-between mb-1.5">
											<div className="p-1.5 bg-sky-100 rounded-lg">
												<Users className="w-3.5 h-3.5 text-sky-600" />
											</div>
										</div>
										<p className="text-lg font-bold text-gray-900">
											{statistics.total_requests || 0}
										</p>
										<p className="text-xs text-gray-600">Total Permintaan</p>
									</button>

									<button
										type="button"
										onClick={() => handleStatusFilterClick("PENDING_REVIEW")}
										className={`p-3 rounded-lg text-left transition-all border ${
											isStatusActive("PENDING_REVIEW")
												? "border-amber-500 ring-2 ring-amber-300 bg-amber-50/50"
												: "bg-slate-50 border-slate-200"
										}`}
									>
										<div className="flex items-center justify-between mb-1.5">
											<div className="p-1.5 bg-amber-100 rounded-lg">
												<Clock className="w-3.5 h-3.5 text-amber-600" />
											</div>
										</div>
										<p className="text-lg font-bold text-gray-900">
											{statistics.pending_review || 0}
										</p>
										<p className="text-xs text-gray-600">Menunggu Review</p>
									</button>

									<button
										type="button"
										onClick={() => handleStatusFilterClick("IN_PROGRESS")}
										className={`p-3 rounded-lg text-left transition-all border ${
											isStatusActive("IN_PROGRESS")
												? "border-sky-500 ring-2 ring-sky-300 bg-sky-50/50"
												: "bg-slate-50 border-slate-200"
										}`}
									>
										<div className="flex items-center justify-between mb-1.5">
											<div className="p-1.5 bg-sky-100 rounded-lg">
												<TrendingUp className="w-3.5 h-3.5 text-sky-600" />
											</div>
										</div>
										<p className="text-lg font-bold text-gray-900">
											{statistics.in_progress || 0}
										</p>
										<p className="text-xs text-gray-600">Sedang Dikerjakan</p>
									</button>

									<button
										type="button"
										onClick={() => handleStatusFilterClick("COMPLETED")}
										className={`p-3 rounded-lg text-left transition-all border ${
											isStatusActive("COMPLETED")
												? "border-emerald-500 ring-2 ring-emerald-300 bg-emerald-50/50"
												: "bg-slate-50 border-slate-200"
										}`}
									>
										<div className="flex items-center justify-between mb-1.5">
											<div className="p-1.5 bg-emerald-100 rounded-lg">
												<CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
											</div>
										</div>
										<p className="text-lg font-bold text-gray-900">
											{statistics.completed || 0}
										</p>
										<p className="text-xs text-gray-600">Selesai</p>
									</button>

									<button
										type="button"
										onClick={() => handleStatusFilterClick("REJECTED")}
										className={`p-3 rounded-lg text-left transition-all border ${
											isStatusActive("REJECTED")
												? "border-red-500 ring-2 ring-red-300 bg-red-50/50"
												: "bg-slate-50 border-slate-200"
										}`}
									>
										<div className="flex items-center justify-between mb-1.5">
											<div className="p-1.5 bg-red-100 rounded-lg">
												<X className="w-3.5 h-3.5 text-red-600" />
											</div>
										</div>
										<p className="text-lg font-bold text-gray-900">
											{statistics.rejected || 0}
										</p>
										<p className="text-xs text-gray-600">Ditolak</p>
									</button>

									<div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
										<div className="flex items-center justify-between mb-1.5">
											<div className="p-1.5 bg-indigo-100 rounded-lg">
												<Calendar className="w-3.5 h-3.5 text-indigo-600" />
											</div>
										</div>
										<p className="text-lg font-bold text-gray-900">
											{statistics.avg_completion_days || 0} Hari
										</p>
										<p className="text-xs text-gray-600">Rata-rata Durasi</p>
									</div>
								</div>
							</div>
						)}
					</div>

					{/* Desktop Stats: Grouped into Volume & Performance */}
					<div className="hidden sm:grid grid-cols-12 gap-3 lg:gap-4">
						{/* Group 1: Volume & Workflow Stages (8 Cols) */}
						<div className="col-span-8 grid grid-cols-4 gap-3">
							{/* Total */}
							<button
								type="button"
								onClick={() => handleStatusFilterClick("ALL")}
								className={`bg-white p-4 rounded-xl border text-left cursor-pointer transition-all ${
									isStatusActive("ALL")
										? "border-sky-500 ring-2 ring-sky-300 bg-sky-50/40 shadow-sm"
										: "border-slate-200 hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5"
								}`}
							>
								<div className="flex items-center justify-between mb-2">
									<div className="p-2 bg-sky-100 rounded-lg">
										<Users className="w-4 h-4 text-sky-600" />
									</div>
								</div>
								<p className="text-2xl font-bold text-gray-900">
									{statistics.total_requests || 0}
								</p>
								<p className="text-xs font-medium text-gray-600 mt-0.5">Total Pengajuan</p>
							</button>

							{/* Pending Review */}
							<button
								type="button"
								onClick={() => handleStatusFilterClick("PENDING_REVIEW")}
								className={`bg-white p-4 rounded-xl border text-left cursor-pointer transition-all ${
									isStatusActive("PENDING_REVIEW")
										? "border-amber-500 ring-2 ring-amber-300 bg-amber-50/40 shadow-sm"
										: "border-slate-200 hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5"
								}`}
							>
								<div className="flex items-center justify-between mb-2">
									<div className="p-2 bg-amber-100 rounded-lg">
										<Clock className="w-4 h-4 text-amber-600" />
									</div>
								</div>
								<p className="text-2xl font-bold text-gray-900">
									{statistics.pending_review || 0}
								</p>
								<p className="text-xs font-medium text-gray-600 mt-0.5">Menunggu Review</p>
							</button>

							{/* In Progress */}
							<button
								type="button"
								onClick={() => handleStatusFilterClick("IN_PROGRESS")}
								className={`bg-white p-4 rounded-xl border text-left cursor-pointer transition-all ${
									isStatusActive("IN_PROGRESS")
										? "border-sky-500 ring-2 ring-sky-300 bg-sky-50/40 shadow-sm"
										: "border-slate-200 hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5"
								}`}
							>
								<div className="flex items-center justify-between mb-2">
									<div className="p-2 bg-sky-100 rounded-lg">
										<TrendingUp className="w-4 h-4 text-sky-600" />
									</div>
								</div>
								<p className="text-2xl font-bold text-gray-900">
									{statistics.in_progress || 0}
								</p>
								<p className="text-xs font-medium text-gray-600 mt-0.5">Pengerjaan</p>
							</button>

							{/* Completed */}
							<button
								type="button"
								onClick={() => handleStatusFilterClick("COMPLETED")}
								className={`bg-white p-4 rounded-xl border text-left cursor-pointer transition-all ${
									isStatusActive("COMPLETED")
										? "border-emerald-500 ring-2 ring-emerald-300 bg-emerald-50/40 shadow-sm"
										: "border-slate-200 hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5"
								}`}
							>
								<div className="flex items-center justify-between mb-2">
									<div className="p-2 bg-emerald-100 rounded-lg">
										<CheckCircle className="w-4 h-4 text-emerald-600" />
									</div>
								</div>
								<p className="text-2xl font-bold text-gray-900">
									{statistics.completed || 0}
								</p>
								<p className="text-xs font-medium text-gray-600 mt-0.5">Selesai</p>
							</button>
						</div>

						{/* Group 2: Outcomes & Throughput (4 Cols) */}
						<div className="col-span-4 grid grid-cols-2 gap-3 pl-1 border-l border-slate-200">
							{/* Rejected */}
							<button
								type="button"
								onClick={() => handleStatusFilterClick("REJECTED")}
								className={`bg-white p-4 rounded-xl border text-left cursor-pointer transition-all ${
									isStatusActive("REJECTED")
										? "border-red-500 ring-2 ring-red-300 bg-red-50/40 shadow-sm"
										: "border-slate-200 hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5"
								}`}
							>
								<div className="flex items-center justify-between mb-2">
									<div className="p-2 bg-red-100 rounded-lg">
										<X className="w-4 h-4 text-red-600" />
									</div>
								</div>
								<p className="text-2xl font-bold text-gray-900">
									{statistics.rejected || 0}
								</p>
								<p className="text-xs font-medium text-gray-600 mt-0.5">Ditolak</p>
							</button>

							{/* Avg Days */}
							<div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
								<div className="flex items-center justify-between mb-2">
									<div className="p-2 bg-indigo-100 rounded-lg">
										<Calendar className="w-4 h-4 text-indigo-600" />
									</div>
								</div>
								<p className="text-2xl font-bold text-gray-900">
									{statistics.avg_completion_days || 0} <span className="text-sm font-normal text-gray-500">Hari</span>
								</p>
								<p className="text-xs font-medium text-gray-600 mt-0.5">Rata-rata Durasi</p>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Filters */}
			<div className="bg-white rounded-lg border border-gray-200 mb-4 sm:mb-6">
				<div className="p-3 sm:p-4 border-b border-gray-200 lg:hidden">
					<button
						onClick={() => setShowFilters(!showFilters)}
						className="flex items-center gap-2 text-gray-700 hover:text-gray-900 w-full justify-between"
					>
						<div className="flex items-center gap-2">
							<Filter className="w-4 h-4" />
							<span className="text-sm sm:text-base font-medium">
								Filter & Pencarian
							</span>
						</div>
						<ChevronDown
							className={`w-4 h-4 transition-transform ${
								showFilters ? "rotate-180" : ""
							}`}
						/>
					</button>
				</div>

				<div
					className={`p-3 sm:p-4 ${showFilters ? "block" : "hidden"} lg:block`}
				>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
						{/* Status Filter */}
						<div className="sm:col-span-1">
							<label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
								Status
							</label>
							<div className="relative">
								<select
									value={selectedStatus}
									onChange={(e) => setSelectedStatus(e.target.value)}
									className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 appearance-none"
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
						<div className="sm:col-span-1">
							<label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
								Prioritas
							</label>
							<div className="relative">
								<select
									value={selectedPriority}
									onChange={(e) => setSelectedPriority(e.target.value)}
									className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 appearance-none"
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
						<div className="sm:col-span-1">
							<label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
								Jenis Modul
							</label>
							<div className="relative">
								<select
									value={selectedModuleType}
									onChange={(e) => setSelectedModuleType(e.target.value)}
									className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 appearance-none"
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
						<div className="sm:col-span-1">
							<label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
								Departemen
							</label>
							<div className="relative">
								<Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
								<select
									value={selectedDepartment}
									onChange={(e) => setSelectedDepartment(e.target.value)}
									className="w-full pl-10 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 appearance-none"
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
						<div className="sm:col-span-2 lg:col-span-1">
							<label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
								Pencarian
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
									} py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors ${
										searchTerm !== debouncedSearchTerm
											? "border-sky-300 bg-sky-50/50"
											: "border-gray-300"
									}`}
								/>
								{searchTerm !== debouncedSearchTerm ? (
									<RefreshCw className="w-4 h-4 text-sky-600 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
								) : searchTerm ? (
									<button
										onClick={handleClearSearch}
										className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
									>
										<X className="w-4 h-4" />
									</button>
								) : null}
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Request List */}
			<div className="space-y-3 sm:space-y-4">
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
						onDelete={null}
					/>
				))}
			</div>

			{/* Load More Button */}
			{hasMore && (
				<div className="text-center mt-6 sm:mt-8">
					<button
						onClick={handleLoadMore}
						disabled={isLoadingMore}
						className="inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base font-medium w-full sm:w-auto shadow-sm"
					>
						{isLoadingMore ? (
							<>
								<RefreshCw className="w-4 h-4 animate-spin flex-shrink-0" />
								<span>Memuat...</span>
							</>
						) : (
							<>
								<TrendingUp className="w-4 h-4 flex-shrink-0" />
								<span>Muat Lebih Banyak</span>
							</>
						)}
					</button>
				</div>
			)}

			{/* No Data */}
			{requests.length === 0 && !isLoading && (
				<div className="text-center py-8 sm:py-12 px-4 bg-white rounded-lg border border-gray-200">
					<Users className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
					<h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
						Tidak Ada Pengajuan
					</h3>
					<p className="text-sm sm:text-base text-gray-600 mb-4 max-w-md mx-auto">
						Belum ada pengajuan pengembangan untuk filter yang dipilih
					</p>
					<button
						onClick={() => setShowCreateModal(true)}
						className="bg-sky-600 text-white px-4 py-2 rounded-lg hover:bg-sky-700 transition-colors text-sm sm:text-base font-medium shadow-sm w-full sm:w-auto"
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

			{/* Toast Notification */}
			{toast.show && (
				<div
					className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-white z-50 text-sm font-medium transition-all ${
						toast.type === "success" ? "bg-emerald-600" : "bg-red-600"
					}`}
				>
					{toast.type === "success" ? (
						<CheckCircle className="w-4 h-4 flex-shrink-0" />
					) : (
						<AlertTriangle className="w-4 h-4 flex-shrink-0" />
					)}
					<span>{toast.message}</span>
					<button
						onClick={() =>
							setToast({ show: false, message: "", type: "success" })
						}
						className="ml-2 hover:opacity-80 p-0.5"
					>
						<X className="w-4 h-4" />
					</button>
				</div>
			)}
		</div>
	);
}
