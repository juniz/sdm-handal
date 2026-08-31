"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
	ArrowLeft,
	Calendar,
	Clock,
	AlertTriangle,
	Zap,
	User,
	Building2,
	FileText,
	MessageSquare,
	Paperclip,
	Edit,
	Download,
	Plus,
	Send,
	RefreshCw,
	CheckCircle,
	XCircle,
	Eye,
	Loader2,
	Activity,
	GitBranch,
	Target,
	Settings,
} from "lucide-react";
import moment from "moment";
import { getClientToken } from "@/lib/client-auth";
import { formatStatusIndonesian } from "@/lib/development-helper";
import {
	ApprovalPanel,
	AssignmentPanel,
	ProgressTracker,
} from "@/components/development";

export default function DevelopmentRequestDetail() {
	const params = useParams();
	const router = useRouter();
	const [request, setRequest] = useState(null);
	const [notes, setNotes] = useState([]);
	const [attachments, setAttachments] = useState([]);
	const [statusHistory, setStatusHistory] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState(null);
	const [activeTab, setActiveTab] = useState("details");
	const [newNote, setNewNote] = useState("");
	const [isAddingNote, setIsAddingNote] = useState(false);
	const [user, setUser] = useState(null);
	const [toast, setToast] = useState({ show: false, message: "", type: "success" });

	const showToast = (message, type = "success") => {
		setToast({ show: true, message, type });
		setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3500);
	};

	useEffect(() => {
		fetchRequestDetail();
		fetchUser();
	}, [params.id]);

	const fetchUser = async () => {
		try {
			// Get authentication token
			const token = getClientToken();

			const headers = {};
			if (token) {
				headers["Authorization"] = `Bearer ${token}`;
			}

			const response = await fetch("/api/auth/user", {
				headers,
			});
			if (response.ok) {
				const userData = await response.json();
				setUser(userData.user); // API mengembalikan { user: {...} }
			}
		} catch (err) {
			console.error("Error fetching user:", err);
		}
	};

	const fetchRequestDetail = async () => {
		setIsLoading(true);
		try {
			// Get authentication token
			const token = getClientToken();

			const headers = {};
			if (token) {
				headers["Authorization"] = `Bearer ${token}`;
			}

			const response = await fetch(`/api/development/${params.id}`, {
				headers,
			});
			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || "Gagal mengambil detail pengajuan");
			}

			setRequest(result.data);
			setNotes(result.data?.notes || []);
			setAttachments(result.data?.attachments || []);
			setStatusHistory(result.data?.statusHistory || []);
			setError(null);
		} catch (err) {
			console.error("Error fetching request detail:", err);
			setError(err.message);
		} finally {
			setIsLoading(false);
		}
	};

	const handleAddNote = async () => {
		if (!newNote.trim() || isAddingNote) return;

		setIsAddingNote(true);
		try {
			// Get authentication token
			const token = getClientToken();

			const headers = {
				"Content-Type": "application/json",
			};

			if (token) {
				headers["Authorization"] = `Bearer ${token}`;
			}

			const response = await fetch(`/api/development/${params.id}/notes`, {
				method: "POST",
				headers,
				body: JSON.stringify({
					note: newNote.trim(),
					note_type: "comment",
				}),
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || "Gagal menambahkan komentar");
			}

			setNotes((prev) => [result.data, ...prev]);
			setNewNote("");
			showToast("Komentar berhasil ditambahkan", "success");
		} catch (err) {
			console.error("Error adding note:", err);
			showToast("Gagal menambahkan komentar: " + err.message, "error");
		} finally {
			setIsAddingNote(false);
		}
	};

	const handleApprovalAction = async (action, reason) => {
		try {
			// Get authentication token
			const token = getClientToken();

			const headers = {
				"Content-Type": "application/json",
			};

			if (token) {
				headers["Authorization"] = `Bearer ${token}`;
			}

			const response = await fetch(`/api/development/${params.id}/approval`, {
				method: "POST",
				headers,
				body: JSON.stringify({
					action,
					reason,
				}),
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || "Gagal memproses approval");
			}

			// Refresh data after approval
			await fetchRequestDetail();

			// Show success message
			showToast(result.message || "Approval berhasil diproses", "success");
		} catch (err) {
			console.error("Error in approval action:", err);
			showToast("Gagal memproses approval: " + err.message, "error");
			throw err; // Re-throw to let ApprovalPanel handle the error state
		}
	};

	const handleAssignmentAction = async (assignmentData) => {
		try {
			// Get authentication token
			const token = getClientToken();

			const headers = {
				"Content-Type": "application/json",
			};

			if (token) {
				headers["Authorization"] = `Bearer ${token}`;
			}

			const response = await fetch(`/api/development/${params.id}/assign`, {
				method: "POST",
				headers,
				body: JSON.stringify(assignmentData),
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || "Gagal memproses assignment");
			}

			// Refresh data after assignment
			await fetchRequestDetail();

			// Show success message
			showToast(result.message || "Assignment berhasil disimpan", "success");
		} catch (err) {
			console.error("Error in assignment action:", err);
			showToast("Gagal memproses assignment: " + err.message, "error");
			throw err; // Re-throw to let AssignmentPanel handle the error state
		}
	};

	const handleProgressUpdate = async (progressData) => {
		try {
			// This callback is called AFTER ProgressTracker has successfully updated
			// No need to make another API call, just refresh the main request data

			console.log("Progress update callback received:", progressData);

			if (progressData.success) {
				// Refresh main request data to sync progress percentage
				await fetchRequestDetail();

				console.log("Request data refreshed after progress update");
			}
		} catch (err) {
			console.error("Error in progress update callback:", err);
			// Don't show alert here as ProgressTracker already handles it
		}
	};

	const getStatusBadge = (status, statusColor) => {
		const colors = {
			"#28a745": "bg-emerald-50 text-emerald-700 border-emerald-200",
			"#dc3545": "bg-red-50 text-red-700 border-red-200",
			"#ffc107": "bg-amber-50 text-amber-700 border-amber-200",
			"#17a2b8": "bg-sky-50 text-sky-700 border-sky-200",
			"#fd7e14": "bg-orange-50 text-orange-700 border-orange-200",
			"#6c757d": "bg-slate-50 text-slate-700 border-slate-200",
			"#007bff": "bg-sky-50 text-sky-700 border-sky-200",
			"#6f42c1": "bg-indigo-50 text-indigo-700 border-indigo-200",
		};

		return (
			<span
				className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
					colors[statusColor] || "bg-slate-50 text-slate-700 border-slate-200"
				}`}
			>
				{formatStatusIndonesian(status)}
			</span>
		);
	};

	const getPriorityBadge = (priority, priorityColor, priorityLevel) => {
		const getIcon = () => {
			if (priorityLevel <= 2) return <AlertTriangle className="w-4 h-4 mr-1" />;
			if (priorityLevel === 3) return <Clock className="w-4 h-4 mr-1" />;
			return <Zap className="w-4 h-4 mr-1" />;
		};

		return (
			<span
				className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white"
				style={{ backgroundColor: priorityColor }}
			>
				{getIcon()}
				{priority}
			</span>
		);
	};

	const formatDate = (dateString) => {
		if (!dateString) return "-";
		// Jika tanggal sudah berupa string yang di-format dari API (mengandung nama bulan Indonesia)
		if (
			typeof dateString === "string" &&
			(dateString.includes("Januari") ||
				dateString.includes("Februari") ||
				dateString.includes("Maret") ||
				dateString.includes("April") ||
				dateString.includes("Mei") ||
				dateString.includes("Juni") ||
				dateString.includes("Juli") ||
				dateString.includes("Agustus") ||
				dateString.includes("September") ||
				dateString.includes("Oktober") ||
				dateString.includes("November") ||
				dateString.includes("Desember"))
		) {
			return dateString; // Sudah di-format dari API
		}
		// Jika masih berupa raw date, format dengan moment
		try {
			return moment(dateString).format("DD MMM YYYY, HH:mm");
		} catch (error) {
			console.error("Error formatting date:", error);
			return dateString; // Fallback return original string
		}
	};

	const getTimeAgo = (dateString) => {
		if (!dateString) return "";
		// Jika tanggal sudah berupa string yang di-format dari API (mengandung nama bulan Indonesia)
		if (
			typeof dateString === "string" &&
			(dateString.includes("Januari") ||
				dateString.includes("Februari") ||
				dateString.includes("Maret") ||
				dateString.includes("April") ||
				dateString.includes("Mei") ||
				dateString.includes("Juni") ||
				dateString.includes("Juli") ||
				dateString.includes("Agustus") ||
				dateString.includes("September") ||
				dateString.includes("Oktober") ||
				dateString.includes("November") ||
				dateString.includes("Desember"))
		) {
			return ""; // Tidak bisa calculate time ago dari string yang sudah di-format
		}
		// Jika masih berupa raw date, hitung time ago dengan moment
		try {
			return moment(dateString).fromNow();
		} catch (error) {
			console.error("Error calculating time ago:", error);
			return "";
		}
	};

	const canEdit = () => {
		if (!request || !user) return false;
		return (
			request.user_id === user.nik &&
			["Draft", "Submitted", "Need Info"].includes(request.current_status)
		);
	};

	const canDelete = () => {
		if (!request || !user) return false;
		return request.user_id === user.nik && request.current_status === "Draft";
	};

	if (isLoading) {
		return (
			<div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-6">
				{/* Header Shimmer */}
				<div className="flex items-center gap-4 mb-6">
					<div className="h-5 w-20 bg-slate-100 rounded animate-pulse" />
					<div className="flex-1 space-y-2">
						<div className="h-7 w-72 bg-slate-200 rounded animate-pulse" />
						<div className="h-4 w-32 bg-slate-100 rounded animate-pulse" />
					</div>
					<div className="flex items-center gap-3">
						<div className="h-9 w-20 bg-slate-100 rounded-lg animate-pulse" />
						<div className="h-9 w-24 bg-slate-100 rounded-lg animate-pulse" />
					</div>
				</div>

				{/* Status and Metadata Card Shimmer */}
				<div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4 shadow-sm">
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
						<div className="flex items-center gap-3">
							<div className="h-6 w-24 bg-slate-200 rounded-full animate-pulse" />
							<div className="h-6 w-20 bg-slate-100 rounded-full animate-pulse" />
						</div>
						<div className="flex items-center gap-4">
							<div className="h-4 w-28 bg-slate-100 rounded animate-pulse" />
							<div className="h-4 w-28 bg-slate-100 rounded animate-pulse" />
							<div className="h-4 w-36 bg-slate-100 rounded animate-pulse" />
						</div>
					</div>

					<div className="pt-4 border-t border-slate-100 space-y-2">
						<div className="flex justify-between">
							<div className="h-4 w-36 bg-slate-100 rounded animate-pulse" />
							<div className="h-4 w-12 bg-slate-200 rounded animate-pulse" />
						</div>
						<div className="h-3 w-full bg-slate-100 rounded-full animate-pulse" />
					</div>
				</div>

				{/* Tabs & Content Shimmer */}
				<div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
					<div className="border-b border-slate-200 px-6 py-4 flex gap-8">
						<div className="h-5 w-20 bg-slate-200 rounded animate-pulse" />
						<div className="h-5 w-24 bg-slate-100 rounded animate-pulse" />
						<div className="h-5 w-24 bg-slate-100 rounded animate-pulse" />
						<div className="h-5 w-24 bg-slate-100 rounded animate-pulse" />
					</div>
					<div className="p-6 space-y-6">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div className="space-y-3">
								<div className="h-5 w-40 bg-slate-200 rounded animate-pulse" />
								<div className="h-4 w-56 bg-slate-100 rounded animate-pulse" />
								<div className="h-4 w-48 bg-slate-100 rounded animate-pulse" />
							</div>
							<div className="space-y-3">
								<div className="h-5 w-40 bg-slate-200 rounded animate-pulse" />
								<div className="h-4 w-56 bg-slate-100 rounded animate-pulse" />
								<div className="h-4 w-48 bg-slate-100 rounded animate-pulse" />
							</div>
						</div>
						<div className="space-y-2 pt-4 border-t border-slate-100">
							<div className="h-5 w-32 bg-slate-200 rounded animate-pulse" />
							<div className="h-4 w-full bg-slate-100 rounded animate-pulse" />
							<div className="h-4 w-5/6 bg-slate-100 rounded animate-pulse" />
						</div>
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
					<p className="text-gray-600 mb-4 text-sm">{error}</p>
					<button
						onClick={fetchRequestDetail}
						className="bg-sky-600 text-white px-4 py-2 rounded-lg hover:bg-sky-700 transition-colors text-sm font-medium shadow-sm"
					>
						Coba Lagi
					</button>
				</div>
			</div>
		);
	}

	if (!request) {
		return (
			<div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
				<div className="text-center py-12">
					<Eye className="w-16 h-16 text-gray-400 mx-auto mb-4" />
					<h3 className="text-lg font-semibold text-gray-900 mb-2">
						Pengajuan Tidak Ditemukan
					</h3>
					<p className="text-gray-600">
						Pengajuan yang Anda cari tidak ditemukan atau telah dihapus.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
			{/* Header */}
			<div className="flex items-center gap-4 mb-6">
				<button
					onClick={() => router.back()}
					className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
				>
					<ArrowLeft className="w-5 h-5" />
					<span>Kembali</span>
				</button>
				<div className="flex-1">
					<h1 className="text-2xl font-bold text-gray-900">{request.title}</h1>
					<p className="text-gray-600 font-mono text-sm">
						{request.no_request}
					</p>
				</div>
				<div className="flex items-center gap-3">
					{canEdit() && (
						<button
							onClick={() =>
								router.push(`/dashboard/development/${params.id}/edit`)
							}
							className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors text-sm font-medium shadow-sm"
						>
							<Edit className="w-4 h-4" />
							<span>Edit</span>
						</button>
					)}
					<button
						onClick={fetchRequestDetail}
						className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
					>
						<RefreshCw className="w-4 h-4" />
						<span>Refresh</span>
					</button>
				</div>
			</div>

			{/* Status and Priority */}
			<div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 shadow-sm">
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
					<div className="flex items-center gap-4">
						{getStatusBadge(request.current_status, request.status_color)}
						{getPriorityBadge(
							request.priority_name,
							request.priority_color,
							request.priority_level
						)}
					</div>
					<div className="flex items-center gap-4 text-sm text-gray-600">
						<span className="flex items-center gap-1">
							<User className="w-4 h-4" />
							{request.user_name}
						</span>
						<span className="flex items-center gap-1">
							<Building2 className="w-4 h-4" />
							{request.departemen_name}
						</span>
						<span className="flex items-center gap-1">
							<Calendar className="w-4 h-4" />
							{formatDate(request.submission_date)}
						</span>
					</div>
				</div>

				{/* Progress Bar for Development Status */}
				{[
					"Assigned",
					"In Development",
					"Development Complete",
					"In Testing",
					"Testing Complete",
					"In Deployment",
					"UAT",
				].includes(request.current_status) && (
					<div className="mt-4 pt-4 border-t border-gray-200">
						<div className="flex items-center justify-between text-sm text-gray-600 mb-2">
							<span>Progress Pengembangan</span>
							<span className="font-semibold text-sky-700">
								{request.progress_percentage || 0}%
							</span>
						</div>
						<div className="w-full bg-slate-100 rounded-full h-3">
							<div
								className="bg-sky-600 h-3 rounded-full transition-all duration-300"
								style={{ width: `${request.progress_percentage || 0}%` }}
							/>
						</div>
						{request.progress_percentage > 0 && (
							<div className="text-xs text-gray-500 mt-1">
								Progress terakhir: {request.progress_percentage}%
							</div>
						)}
					</div>
				)}
			</div>

			{/* Workflow Action Panels */}
			<div className="space-y-6 mb-6">
				{/* Approval Panel - Only for IT Reviewers */}
				<ApprovalPanel
					request={request}
					user={user}
					onApprovalAction={handleApprovalAction}
					isLoading={isLoading}
				/>

				{/* Assignment Panel - Only for IT Leads */}
				<AssignmentPanel
					request={request}
					user={user}
					onAssignmentAction={handleAssignmentAction}
					isLoading={isLoading}
				/>

				{/* Progress Tracker - For Assigned Developer & IT Team */}
				<ProgressTracker
					request={request}
					user={user}
					onProgressUpdate={handleProgressUpdate}
					isLoading={isLoading}
				/>
			</div>

			{/* Tabs */}
			<div className="bg-white rounded-lg border border-gray-200 mb-6">
				<div className="border-b border-gray-200">
					<nav className="flex space-x-8 px-6">
						{[
							{ id: "details", label: "Detail", icon: FileText },
							{
								id: "comments",
								label: "Komentar",
								icon: MessageSquare,
								count: notes.length,
							},
							{
								id: "attachments",
								label: "Lampiran",
								icon: Paperclip,
								count: attachments.length,
							},
							{
								id: "history",
								label: "Riwayat",
								icon: Activity,
								count: statusHistory.length,
							},
						].map((tab) => (
							<button
								key={tab.id}
								onClick={() => setActiveTab(tab.id)}
								className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
									activeTab === tab.id
										? "border-sky-600 text-sky-600"
										: "border-transparent text-gray-500 hover:text-gray-700"
								}`}
							>
								<tab.icon className="w-4 h-4" />
								<span>{tab.label}</span>
								{tab.count > 0 && (
									<span className="bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
										{tab.count}
									</span>
								)}
							</button>
						))}
					</nav>
				</div>

				<div className="p-6">
					{/* Details Tab */}
					{activeTab === "details" && (
						<div className="space-y-6">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div>
									<h3 className="text-lg font-semibold text-gray-900 mb-4">
										Informasi Pengajuan
									</h3>
									<div className="space-y-3">
										<div>
											<label className="block text-sm font-medium text-gray-700">
												Jenis Modul
											</label>
											<p className="mt-1 text-sm text-gray-900">
												{request.module_type}
											</p>
										</div>
										<div>
											<label className="block text-sm font-medium text-gray-700">
												Target Penyelesaian
											</label>
											<p className="mt-1 text-sm text-gray-900">
												{request.expected_completion_date
													? formatDate(request.expected_completion_date)
													: "Tidak ditentukan"}
											</p>
										</div>
										{request.assigned_developer_name && (
											<div>
												<label className="block text-sm font-medium text-gray-700">
													Developer
												</label>
												<p className="mt-1 text-sm text-gray-900">
													{request.assigned_developer_name}
												</p>
											</div>
										)}
									</div>
								</div>

								<div>
									<h3 className="text-lg font-semibold text-gray-900 mb-4">
										Timeline
									</h3>
									<div className="space-y-3">
										<div>
											<label className="block text-sm font-medium text-gray-700">
												Tanggal Pengajuan
											</label>
											<p className="mt-1 text-sm text-gray-900">
												{formatDate(request.submission_date)}
											</p>
										</div>
										{request.approved_date && (
											<div>
												<label className="block text-sm font-medium text-gray-700">
													Tanggal Persetujuan
												</label>
												<p className="mt-1 text-sm text-gray-900">
													{formatDate(request.approved_date)}
												</p>
											</div>
										)}
										{request.development_start_date && (
											<div>
												<label className="block text-sm font-medium text-gray-700">
													Mulai Pengembangan
												</label>
												<p className="mt-1 text-sm text-gray-900">
													{formatDate(request.development_start_date)}
												</p>
											</div>
										)}
										{request.completed_date && (
											<div>
												<label className="block text-sm font-medium text-gray-700">
													Tanggal Selesai
												</label>
												<p className="mt-1 text-sm text-gray-900">
													{formatDate(request.completed_date)}
												</p>
											</div>
										)}
									</div>
								</div>
							</div>

							<div>
								<h3 className="text-lg font-semibold text-gray-900 mb-4">
									Deskripsi
								</h3>
								<div className="prose max-w-none">
									<p className="text-gray-700 whitespace-pre-wrap">
										{request.description}
									</p>
								</div>
							</div>

							{request.current_system_issues && (
								<div>
									<h3 className="text-lg font-semibold text-gray-900 mb-4">
										Masalah Sistem Saat Ini
									</h3>
									<div className="prose max-w-none">
										<p className="text-gray-700 whitespace-pre-wrap">
											{request.current_system_issues}
										</p>
									</div>
								</div>
							)}

							{request.proposed_solution && (
								<div>
									<h3 className="text-lg font-semibold text-gray-900 mb-4">
										Solusi yang Diusulkan
									</h3>
									<div className="prose max-w-none">
										<p className="text-gray-700 whitespace-pre-wrap">
											{request.proposed_solution}
										</p>
									</div>
								</div>
							)}
						</div>
					)}

					{/* Comments Tab */}
					{activeTab === "comments" && (
						<div className="space-y-6">
							{/* Add Comment Form */}
							<div className="bg-gray-50 rounded-lg p-4">
								<h3 className="text-lg font-semibold text-gray-900 mb-4">
									Tambah Komentar
								</h3>
								<div className="space-y-4">
									<textarea
										value={newNote}
										onChange={(e) => setNewNote(e.target.value)}
										placeholder="Tulis komentar Anda..."
										rows={4}
										className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
									/>
									<div className="flex justify-end">
										<button
											onClick={handleAddNote}
											disabled={!newNote.trim() || isAddingNote}
											className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium shadow-sm"
										>
											{isAddingNote ? (
												<>
													<Loader2 className="w-4 h-4 animate-spin" />
													<span>Mengirim...</span>
												</>
											) : (
												<>
													<Send className="w-4 h-4" />
													<span>Kirim</span>
												</>
											)}
										</button>
									</div>
								</div>
							</div>

							{/* Comments List */}
							<div className="space-y-4">
								{notes.length === 0 ? (
									<div className="text-center py-8">
										<MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
										<p className="text-gray-500 text-sm">Belum ada komentar</p>
									</div>
								) : (
									notes.map((note) => (
										<div
											key={note.note_id}
											className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
										>
											<div className="flex items-start gap-3">
												<div className="flex-shrink-0 w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center">
													<User className="w-4 h-4 text-sky-600" />
												</div>
												<div className="flex-1">
													<div className="flex items-center gap-2 mb-2">
														<span className="font-medium text-gray-900 text-sm">
															{note.created_by_name}
														</span>
														<span className="text-xs text-gray-500">
															{formatDate(note.created_date)}
														</span>
														<span className="text-xs text-gray-400">
															{getTimeAgo(note.created_date)}
														</span>
													</div>
													<p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">
														{note.note}
													</p>
												</div>
											</div>
										</div>
									))
								)}
							</div>
						</div>
					)}

					{/* Attachments Tab */}
					{activeTab === "attachments" && (
						<div className="space-y-6">
							{attachments.length === 0 ? (
								<div className="text-center py-8">
									<Paperclip className="w-12 h-12 text-gray-400 mx-auto mb-4" />
									<p className="text-gray-500 text-sm">Belum ada lampiran</p>
								</div>
							) : (
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
									{attachments.map((attachment) => (
										<div
											key={attachment.attachment_id}
											className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
										>
											<div className="flex items-center gap-3">
												<div className="flex-shrink-0 w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
													<FileText className="w-5 h-5 text-slate-600" />
												</div>
												<div className="flex-1 min-w-0">
													<p className="text-sm font-medium text-gray-900 truncate">
														{attachment.file_name}
													</p>
													<p className="text-xs text-gray-500">
														{Math.round(attachment.file_size / 1024)} KB
													</p>
												</div>
												<button
													onClick={() =>
														window.open(attachment.file_path, "_blank")
													}
													className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
												>
													<Download className="w-4 h-4" />
												</button>
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					)}

					{/* History Tab */}
					{activeTab === "history" && (
						<div className="space-y-6">
							{statusHistory.length === 0 ? (
								<div className="text-center py-8">
									<Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
									<p className="text-gray-500 text-sm">Belum ada riwayat perubahan</p>
								</div>
							) : (
								<div className="space-y-4">
									{statusHistory.map((history, index) => (
										<div
											key={history.history_id}
											className="flex items-start gap-4 pb-4 border-b border-gray-200 last:border-b-0"
										>
											<div className="flex-shrink-0 w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center">
												<GitBranch className="w-4 h-4 text-sky-600" />
											</div>
											<div className="flex-1">
												<div className="flex items-center gap-2 mb-1">
													<span className="font-medium text-gray-900 text-sm">
														{history.changed_by_name}
													</span>
													<span className="text-xs text-gray-500">
														mengubah status dari{" "}
														<span className="font-medium text-gray-700">
															{history.old_status}
														</span>{" "}
														ke{" "}
														<span className="font-medium text-sky-700">
															{history.new_status}
														</span>
													</span>
												</div>
												<p className="text-xs text-gray-500">
													{formatDate(history.change_date)} (
													{getTimeAgo(history.change_date)})
												</p>
												{history.change_reason && (
													<p className="text-sm text-gray-700 mt-2">
														Alasan: {history.change_reason}
													</p>
												)}
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					)}
				</div>
			</div>

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
