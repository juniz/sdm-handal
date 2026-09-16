"use client";

import { useState } from "react";
import { Ticket, Plus, PhoneCall } from "lucide-react";
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
	DeleteTicketModal,
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
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [modalMode, setModalMode] = useState("add");
	const [selectedTicket, setSelectedTicket] = useState(null);
	const [selectedTicketForClose, setSelectedTicketForClose] = useState(null);
	const [selectedTicketForDelete, setSelectedTicketForDelete] = useState(null);
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

	const handleDelete = (ticket) => {
		setSelectedTicketForDelete(ticket);
		setShowDeleteModal(true);
	};

	const handleConfirmDelete = async (ticketId) => {
		try {
			const result = await deleteTicket(ticketId);
			if (result.success) {
				showToast(result.message);
			}
		} catch (error) {
			showToast(error.message || "Terjadi kesalahan saat menghapus", "error");
		}
	};

	const handleCloseDeleteModal = () => {
		setSelectedTicketForDelete(null);
		setShowDeleteModal(false);
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
	};

	const handleCloseEditModal = () => {
		resetForm();
		setShowModal(false);
	};

	if (loading && tickets.length === 0) {
		return (
			<div className="flex justify-center items-center min-h-[60vh]">
				<div className="animate-spin rounded-full h-10 w-10 border-2 border-sky-600 border-t-transparent"></div>
			</div>
		);
	}

	return (
		<>
			<div className="p-4 md:p-6 space-y-4 max-w-7xl mx-auto">
				{/* Header with Prominent Primary Action Button */}
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
					<div className="flex items-center gap-3">
						<div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl border border-sky-100 shadow-sm">
							<Ticket className="w-6 h-6" />
						</div>
						<div>
							<h1 className="text-lg md:text-xl font-bold text-slate-900">
								Pelaporan Gangguan IT & Fasilitas
							</h1>
							<p className="text-xs text-slate-500">
								Layanan respon teknis RS Bhayangkara Nganjuk
							</p>
						</div>
					</div>

					<div className="flex items-center gap-2 sm:gap-2.5 self-stretch sm:self-auto justify-between sm:justify-end">
						<a
							href="tel:118"
							className="flex items-center gap-1.5 px-2.5 py-2 sm:px-3 sm:py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 text-xs font-medium transition-colors"
							title="Hubungi Tim IT Siaga Ext. 118"
						>
							<PhoneCall className="w-3.5 h-3.5 text-rose-600 shrink-0" />
							<span className="hidden sm:inline">Tim IT Siaga: </span>
							<strong className="text-slate-900 font-semibold">Ext. 118</strong>
						</a>

						<button
							type="button"
							onClick={handleAddClick}
							className="inline-flex items-center justify-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs sm:text-sm font-medium shadow-sm hover:shadow transition-all shrink-0"
						>
							<Plus className="w-4 h-4" />
							<span>Buat Pelaporan Baru</span>
						</button>
					</div>
				</div>

				{/* Filter Accordion */}
				<FilterAccordion
					filters={filters}
					setFilters={setFilters}
					isOpen={isFilterOpen}
					setIsOpen={setIsFilterOpen}
					loading={loading}
					masterData={masterData}
				/>

				{/* Content */}
				{loading ? (
					<LoadingSkeleton />
				) : tickets.length === 0 ? (
					<EmptyState
						hasFilters={Boolean(
							filters.status ||
								filters.priority ||
								filters.category ||
								filters.search ||
								filters.myTickets
						)}
						onResetFilters={() =>
							setFilters({
								status: "",
								priority: "",
								category: "",
								search: "",
								myTickets: false,
							})
						}
						onAddNew={handleAddClick}
					/>
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

			{/* Delete Ticket Modal */}
			<DeleteTicketModal
				showModal={showDeleteModal}
				ticket={selectedTicketForDelete}
				onConfirmDelete={handleConfirmDelete}
				onClose={handleCloseDeleteModal}
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
