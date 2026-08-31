"use client";

import { useState, useEffect } from "react";
import {
	UserCheck,
	FileText,
	AlertCircle,
	CheckCircle,
	Clock,
	BarChart3,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import moment from "moment-timezone";
import "moment/locale/id";

// Import komponen
import {
	AssignmentCard,
	AssignmentModal,
	AssignmentFilterAccordion,
	StatusUpdateModal,
	CompletedTicketReport,
	QualityIndicatorReport,
} from "@/components/ticket-assignment";

import {
	Toast,
	LoadingSkeleton,
	Pagination,
	EmptyState,
} from "@/components/ticket";

// Import hooks
import useTicketAssignment from "@/hooks/useTicketAssignment";
import useToast from "@/hooks/useToast";

moment.locale("id");
moment.tz.setDefault("Asia/Jakarta");

const TicketAssignmentPage = () => {
	const {
		tickets,
		itEmployees,
		currentUser,
		masterData,
		loading,
		filters,
		setFilters,
		pagination,
		fetchTickets,
		assignTicket,
		releaseAssignment,
		updateTicketStatus,
	} = useTicketAssignment();

	const { toast, showToast, hideToast } = useToast();

	const [showAssignModal, setShowAssignModal] = useState(false);
	const [showStatusModal, setShowStatusModal] = useState(false);
	const [showReleaseModal, setShowReleaseModal] = useState(false);
	const [ticketToRelease, setTicketToRelease] = useState(null);
	const [selectedTicket, setSelectedTicket] = useState(null);
	const [selectedTicketForStatus, setSelectedTicketForStatus] = useState(null);
	const [isFilterOpen, setIsFilterOpen] = useState(false);
	const [activeTab, setActiveTab] = useState("active"); // "active", "completed", atau "quality"
	const [releasing, setReleasing] = useState(false);

	// Report State (shared between CompletedTicketReport and QualityIndicatorReport)
	const [completedTickets, setCompletedTickets] = useState([]);
	const [allReportTickets, setAllReportTickets] = useState([]);
	const [reportLoading, setReportLoading] = useState(false);
	const [reportFilters, setReportFilters] = useState({
		start_date: moment().subtract(1, "month").format("YYYY-MM-DD"),
		end_date: moment().format("YYYY-MM-DD"),
		department_id: "",
		assigned_to: "",
		category_id: "",
		search: "",
		enable_date_filter: true,
	});

	const fetchCompletedTickets = async () => {
		setReportLoading(true);
		try {
			const params = new URLSearchParams({ limit: "1000" });
			if (reportFilters.enable_date_filter) {
				params.append("start_date", reportFilters.start_date);
				params.append("end_date", reportFilters.end_date);
			}
			if (reportFilters.department_id) params.append("department_id", reportFilters.department_id);
			if (reportFilters.assigned_to) params.append("assigned_to", reportFilters.assigned_to);
			if (reportFilters.category_id) params.append("category_id", reportFilters.category_id);
			if (reportFilters.search) params.append("search", reportFilters.search);

			const response = await fetch(`/api/ticket-assignment?${params}`);
			const result = await response.json();

			if (result.status === "success") {
				const completed = result.data.filter((t) =>
					["Closed", "Resolved"].includes(t.current_status),
				);
				setCompletedTickets(completed);
				setAllReportTickets(result.data);
			}
		} catch (error) {
			console.error("Error fetching report data:", error);
		} finally {
			setReportLoading(false);
		}
	};

	useEffect(() => {
		if (activeTab === "completed" || activeTab === "quality") {
			fetchCompletedTickets();
		}
	}, [reportFilters, activeTab]);

	// Check if user is from IT department
	const [isAuthorized, setIsAuthorized] = useState(null);

	useEffect(() => {
		// Check authorization on component mount
		const checkAuth = async () => {
			try {
				const response = await fetch("/api/it-employees");
				if (response.status === 403) {
					setIsAuthorized(false);
				} else if (response.ok) {
					setIsAuthorized(true);
				} else {
					setIsAuthorized(false);
				}
			} catch (error) {
				setIsAuthorized(false);
			}
		};

		checkAuth();
	}, []);

	// Filter tickets berdasarkan tab yang aktif
	const filteredTickets = tickets.filter((ticket) => {
		if (activeTab === "active") {
			// Ticket yang masih berjalan (Open, In Progress, On Hold)
			return !["Closed", "Resolved"].includes(ticket.current_status);
		} else {
			// Ticket yang sudah selesai (Closed, Resolved)
			return ["Closed", "Resolved"].includes(ticket.current_status);
		}
	});

	const handleAssign = (ticket) => {
		setSelectedTicket(ticket);
		setShowAssignModal(true);
	};

	const handleAssignSubmit = async (ticketId, assignedTo) => {
		try {
			const result = await assignTicket(ticketId, assignedTo);
			if (result.success) {
				setShowAssignModal(false);
				setSelectedTicket(null);
				showToast(result.message);
			}
		} catch (error) {
			showToast(error.message || "Terjadi kesalahan", "error");
		}
	};

	const handleReleaseClick = (ticket) => {
		setTicketToRelease(ticket);
		setShowReleaseModal(true);
	};

	const handleConfirmRelease = async () => {
		if (!ticketToRelease) return;
		setReleasing(true);
		try {
			const result = await releaseAssignment(ticketToRelease.ticket_id);
			if (result.success) {
				showToast(result.message);
				setShowReleaseModal(false);
				setTicketToRelease(null);
			}
		} catch (error) {
			showToast(error.message || "Terjadi kesalahan", "error");
		} finally {
			setReleasing(false);
		}
	};

	const handleCloseAssignModal = () => {
		setSelectedTicket(null);
		setShowAssignModal(false);
	};

	const handleUpdateStatus = (ticket) => {
		setSelectedTicketForStatus(ticket);
		setShowStatusModal(true);
	};

	const handleStatusUpdate = async (ticketId, status, notes) => {
		try {
			const result = await updateTicketStatus(ticketId, status, notes);
			if (result.success) {
				setShowStatusModal(false);
				setSelectedTicketForStatus(null);
				showToast(result.message);
			}
		} catch (error) {
			showToast(error.message || "Terjadi kesalahan", "error");
		}
	};

	const handleCloseStatusModal = () => {
		setSelectedTicketForStatus(null);
		setShowStatusModal(false);
	};

	// Show loading while checking authorization
	if (isAuthorized === null) {
		return (
			<div className="flex justify-center items-center min-h-[60vh]">
				<div className="animate-spin rounded-full h-10 w-10 border-2 border-sky-600 border-t-transparent"></div>
			</div>
		);
	}

	// Show unauthorized message if user is not from IT department
	if (isAuthorized === false) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
				<div className="p-4 bg-rose-50 rounded-full mb-4">
					<AlertCircle className="w-12 h-12 text-rose-600" />
				</div>
				<h2 className="text-xl font-bold text-slate-900 mb-2">
					Akses Khusus Departemen IT
				</h2>
				<p className="text-slate-600 text-center max-w-md text-sm">
					Halaman manajemen assignment perbaikan ini hanya dapat diakses oleh personil IT yang berwenang.
				</p>
			</div>
		);
	}

	if (loading && tickets.length === 0) {
		return (
			<div className="flex justify-center items-center min-h-[60vh]">
				<div className="animate-spin rounded-full h-10 w-10 border-2 border-sky-600 border-t-transparent"></div>
			</div>
		);
	}

	return (
		<>
			<div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
				{/* Header */}
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2.5">
						<div className="p-2 bg-sky-100/70 rounded-lg text-sky-700">
							<UserCheck className="w-5 h-5" />
						</div>
						<div>
							<h1 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">
								Assignment Perbaikan IT
							</h1>
							<p className="text-xs text-slate-500">
								Manajemen penugasan, penyelesaian perbaikan, dan indikator mutu SIMRS
							</p>
						</div>
					</div>
				</div>

				{/* Filter Accordion */}
				{activeTab === "active" && (
					<AssignmentFilterAccordion
						filters={filters}
						setFilters={setFilters}
						isOpen={isFilterOpen}
						setIsOpen={setIsFilterOpen}
						loading={loading}
						masterData={masterData}
						itEmployees={itEmployees}
						tickets={tickets}
					/>
				)}

				{/* Navigation Tabs */}
				<div className="border-b border-slate-200">
					<nav className="-mb-px flex space-x-6">
						<button
							type="button"
							onClick={() => setActiveTab("active")}
							className={`py-3 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center gap-2 transition-colors ${
								activeTab === "active"
									? "border-sky-600 text-sky-700 font-semibold"
									: "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
							}`}
						>
							<Clock className="w-4 h-4" />
							<span>Ticket Berjalan</span>
							<span className="ml-1 bg-sky-100 text-sky-800 text-xs font-semibold px-2 py-0.5 rounded-full border border-sky-200">
								{
									tickets.filter(
										(t) => !["Closed", "Resolved"].includes(t.current_status),
									).length
								}
							</span>
						</button>
						<button
							type="button"
							onClick={() => setActiveTab("completed")}
							className={`py-3 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center gap-2 transition-colors ${
								activeTab === "completed"
									? "border-sky-600 text-sky-700 font-semibold"
									: "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
							}`}
						>
							<FileText className="w-4 h-4" />
							<span>Laporan & Ticket Selesai</span>
						</button>
						<button
							type="button"
							onClick={() => setActiveTab("quality")}
							className={`py-3 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center gap-2 transition-colors ${
								activeTab === "quality"
									? "border-sky-600 text-sky-700 font-semibold"
									: "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
							}`}
						>
							<BarChart3 className="w-4 h-4" />
							<span>Indikator Mutu (PMK 30/2022)</span>
						</button>
					</nav>
				</div>

				{/* Content Tab Panes */}
				{activeTab === "active" ? (
					loading ? (
						<LoadingSkeleton />
					) : filteredTickets.length === 0 ? (
						<EmptyState message="Tidak ada ticket yang sedang berjalan" />
					) : (
						<>
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
								{filteredTickets.map((ticket) => (
									<AssignmentCard
										key={ticket.ticket_id}
										ticket={ticket}
										onAssign={handleAssign}
										onRelease={handleReleaseClick}
										onUpdateStatus={handleUpdateStatus}
										currentUser={currentUser}
										isCompleted={false}
									/>
								))}
							</div>

							{/* Pagination */}
							<Pagination pagination={pagination} onPageChange={fetchTickets} />
						</>
					)
				) : activeTab === "completed" ? (
					<CompletedTicketReport
						masterData={masterData}
						itEmployees={itEmployees}
						tickets={completedTickets}
						loading={reportLoading}
						filters={reportFilters}
						setFilters={setReportFilters}
					/>
				) : (
					<QualityIndicatorReport
						tickets={allReportTickets}
						filters={reportFilters}
						setFilters={setReportFilters}
					/>
				)}
			</div>

			{/* Assignment Modal */}
			<AssignmentModal
				showModal={showAssignModal}
				ticket={selectedTicket}
				itEmployees={itEmployees}
				onAssign={handleAssignSubmit}
				onClose={handleCloseAssignModal}
				showToast={showToast}
			/>

			{/* Status Update Modal */}
			<StatusUpdateModal
				showModal={showStatusModal}
				ticket={selectedTicketForStatus}
				onUpdateStatus={handleStatusUpdate}
				onClose={handleCloseStatusModal}
				showToast={showToast}
			/>

			{/* Release Confirmation Dialog */}
			<AnimatePresence>
				{showReleaseModal && ticketToRelease && (
					<div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
						<motion.div
							initial={{ opacity: 0, scale: 0.96 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.96 }}
							className="bg-white rounded-xl shadow-xl p-5 sm:p-6 w-full max-w-sm border border-slate-200"
						>
							<div className="flex items-center gap-3 mb-3">
								<div className="p-2.5 bg-rose-50 text-rose-600 rounded-lg">
									<AlertCircle className="w-6 h-6" />
								</div>
								<div>
									<h3 className="font-semibold text-slate-900 text-sm sm:text-base">
										Lepas Penugasan?
									</h3>
									<p className="text-xs text-slate-500">
										{ticketToRelease.no_ticket || `#${ticketToRelease.ticket_id}`}
									</p>
								</div>
							</div>
							<p className="text-xs sm:text-sm text-slate-600 mb-5">
								Teknisi <span className="font-semibold text-slate-800">{ticketToRelease.assigned_to_name}</span> akan dilepas dari ticket ini dan status akan kembali menjadi terbuka untuk ditugaskan ulang.
							</p>
							<div className="flex gap-2.5">
								<button
									type="button"
									onClick={() => {
										setShowReleaseModal(false);
										setTicketToRelease(null);
									}}
									className="flex-1 px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
									disabled={releasing}
								>
									Batal
								</button>
								<button
									type="button"
									onClick={handleConfirmRelease}
									className="flex-1 px-4 py-2 text-xs sm:text-sm font-medium bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors shadow-sm disabled:opacity-50"
									disabled={releasing}
								>
									{releasing ? "Melepas..." : "Ya, Lepas"}
								</button>
							</div>
						</motion.div>
					</div>
				)}
			</AnimatePresence>

			{/* Toast */}
			<AnimatePresence>
				{toast.show && (
					<Toast
						message={toast.message}
						type={toast.type}
						onClose={hideToast}
					/>
				)}
			</AnimatePresence>
		</>
	);
};

export default TicketAssignmentPage;
