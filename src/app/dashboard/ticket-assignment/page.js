"use client";

import { useState, useEffect } from "react";
import { UserCheck, FileText, AlertCircle } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import moment from "moment-timezone";
import "moment/locale/id";

// Import komponen
import {
	AssignmentCard,
	AssignmentModal,
	AssignmentFilterAccordion,
	StatusUpdateModal,
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
	const [selectedTicket, setSelectedTicket] = useState(null);
	const [selectedTicketForStatus, setSelectedTicketForStatus] = useState(null);
	const [isFilterOpen, setIsFilterOpen] = useState(false);

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

	const handleRelease = async (ticket) => {
		if (
			!confirm(
				`Apakah Anda yakin ingin melepas assignment ticket ${
					ticket.no_ticket || `#${ticket.ticket_id}`
				}?`
			)
		) {
			return;
		}

		try {
			const result = await releaseAssignment(ticket.ticket_id);
			if (result.success) {
				showToast(result.message);
			}
		} catch (error) {
			showToast(error.message || "Terjadi kesalahan", "error");
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
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
			</div>
		);
	}

	// Show unauthorized message if user is not from IT department
	if (isAuthorized === false) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
				<AlertCircle className="w-16 h-16 text-red-500 mb-4" />
				<h2 className="text-xl font-semibold text-gray-900 mb-2">
					Akses Ditolak
				</h2>
				<p className="text-gray-600 text-center max-w-md">
					Halaman ini hanya dapat diakses oleh pegawai dari departemen IT.
					Silakan hubungi administrator jika Anda merasa ini adalah kesalahan.
				</p>
			</div>
		);
	}

	if (loading && tickets.length === 0) {
		return (
			<div className="flex justify-center items-center min-h-[60vh]">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
			</div>
		);
	}

	return (
		<>
			<div className="p-4 md:p-6 space-y-4">
				{/* Header */}
				<div className="flex items-center gap-2">
					<UserCheck className="w-5 h-5 text-blue-500" />
					<h2 className="text-lg md:text-xl font-semibold">
						Assignment Perbaikan IT
					</h2>
				</div>

				{/* Filter Accordion */}
				<AssignmentFilterAccordion
					filters={filters}
					setFilters={setFilters}
					isOpen={isFilterOpen}
					setIsOpen={setIsFilterOpen}
					loading={loading}
					masterData={masterData}
					itEmployees={itEmployees}
				/>

				{/* Content */}
				{loading ? (
					<LoadingSkeleton />
				) : tickets.length === 0 ? (
					<EmptyState />
				) : (
					<>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
							{tickets.map((ticket) => (
								<AssignmentCard
									key={ticket.ticket_id}
									ticket={ticket}
									onAssign={handleAssign}
									onRelease={handleRelease}
									onUpdateStatus={handleUpdateStatus}
									currentUser={currentUser}
								/>
							))}
						</div>

						{/* Pagination */}
						<Pagination pagination={pagination} onPageChange={fetchTickets} />
					</>
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
