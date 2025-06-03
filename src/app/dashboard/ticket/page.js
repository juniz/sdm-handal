"use client";

import { useState } from "react";
import { Ticket, FileText } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import moment from "moment-timezone";
import "moment/locale/id";

// Import komponen
import {
	Toast,
	LoadingSkeleton,
	FilterAccordion,
	TicketCard,
	TicketModal,
	CloseTicketModal,
	Pagination,
	EmptyState,
} from "@/components/ticket";

// Import hooks
import useTicket from "@/hooks/useTicket";
import useToast from "@/hooks/useToast";

moment.locale("id");
moment.tz.setDefault("Asia/Jakarta");

const TicketPage = () => {
	const {
		tickets,
		masterData,
		loading,
		filters,
		setFilters,
		pagination,
		fetchTickets,
		createTicket,
		updateTicket,
		deleteTicket,
		closeTicket,
	} = useTicket();

	const { toast, showToast, hideToast } = useToast();

	const [showModal, setShowModal] = useState(false);
	const [showCloseModal, setShowCloseModal] = useState(false);
	const [modalMode, setModalMode] = useState("add");
	const [selectedTicket, setSelectedTicket] = useState(null);
	const [selectedTicketForClose, setSelectedTicketForClose] = useState(null);
	const [isFilterOpen, setIsFilterOpen] = useState(false);
	const [formData, setFormData] = useState({
		category_id: "",
		priority_id: "",
		title: "",
		description: "",
	});
	const [errors, setErrors] = useState({});

	const handleSubmit = async (formData) => {
		try {
			let result;
			if (modalMode === "add") {
				result = await createTicket(formData);
			} else {
				result = await updateTicket(formData, selectedTicket.ticket_id);
			}

			if (result.success) {
				setShowModal(false);
				resetForm();
				showToast(result.message);
			}
		} catch (error) {
			showToast(error.message || "Terjadi kesalahan", "error");
		}
	};

	const handleDelete = async (ticketId) => {
		if (!confirm("Apakah Anda yakin ingin menghapus pelaporan ini?")) return;

		try {
			const result = await deleteTicket(ticketId);
			if (result.success) {
				showToast(result.message);
			}
		} catch (error) {
			showToast(error.message || "Terjadi kesalahan saat menghapus", "error");
		}
	};

	const handleEdit = (ticket) => {
		setSelectedTicket(ticket);
		setFormData({
			category_id: ticket.category_id,
			priority_id: ticket.priority_id,
			title: ticket.title,
			description: ticket.description,
		});
		setModalMode("edit");
		setShowModal(true);
	};

	const handleClose = (ticket) => {
		setSelectedTicketForClose(ticket);
		setShowCloseModal(true);
	};

	const handleCloseTicket = async (ticketId, feedback) => {
		try {
			const result = await closeTicket(ticketId, feedback);
			if (result.success) {
				setShowCloseModal(false);
				setSelectedTicketForClose(null);
				showToast(result.message);
			}
		} catch (error) {
			showToast(error.message || "Terjadi kesalahan", "error");
		}
	};

	const handleCloseModal = () => {
		setSelectedTicketForClose(null);
		setShowCloseModal(false);
	};

	const resetForm = () => {
		setFormData({
			category_id: "",
			priority_id: "",
			title: "",
			description: "",
		});
		setSelectedTicket(null);
		setModalMode("add");
		setErrors({});
	};

	const handleAddClick = () => {
		resetForm();
		setShowModal(true);
		setIsFilterOpen(false);
	};

	const handleCloseEditModal = () => {
		resetForm();
		setShowModal(false);
	};

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
					<Ticket className="w-5 h-5 text-blue-500" />
					<h2 className="text-lg md:text-xl font-semibold">
						Pelaporan IT Support
					</h2>
				</div>

				{/* Filter Accordion */}
				<FilterAccordion
					filters={filters}
					setFilters={setFilters}
					isOpen={isFilterOpen}
					setIsOpen={setIsFilterOpen}
					onAddClick={handleAddClick}
					loading={loading}
					masterData={masterData}
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
								<TicketCard
									key={ticket.ticket_id}
									ticket={ticket}
									onEdit={handleEdit}
									onDelete={handleDelete}
									onClose={handleClose}
								/>
							))}
						</div>

						{/* Pagination */}
						<Pagination pagination={pagination} onPageChange={fetchTickets} />
					</>
				)}
			</div>

			{/* Ticket Modal */}
			<TicketModal
				showModal={showModal}
				modalMode={modalMode}
				formData={formData}
				setFormData={setFormData}
				errors={errors}
				masterData={masterData}
				onSubmit={handleSubmit}
				onClose={handleCloseEditModal}
				showToast={showToast}
			/>

			{/* Close Ticket Modal */}
			<CloseTicketModal
				showModal={showCloseModal}
				ticket={selectedTicketForClose}
				onCloseTicket={handleCloseTicket}
				onClose={handleCloseModal}
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

export default TicketPage;
