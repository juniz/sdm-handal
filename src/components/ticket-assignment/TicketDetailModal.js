import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	X,
	FileText,
	User,
	Calendar,
	Tag,
	AlertTriangle,
	Building,
	Clock,
	UserCheck,
	MessageSquare,
} from "lucide-react";
import TicketTimeline from "./TicketTimeline";
import TicketNotes from "./TicketNotes";

const getPriorityStyle = (priority) => {
	switch (priority?.toLowerCase()) {
		case "low":
			return "bg-emerald-50 text-emerald-700 border-emerald-200";
		case "medium":
			return "bg-amber-50 text-amber-700 border-amber-200";
		case "high":
			return "bg-rose-50 text-rose-700 border-rose-200";
		case "critical":
			return "bg-rose-100 text-rose-800 border-rose-300 font-semibold";
		default:
			return "bg-slate-100 text-slate-700 border-slate-200";
	}
};

const getStatusStyle = (status) => {
	switch (status?.toLowerCase()) {
		case "open":
			return "bg-sky-50 text-sky-700 border-sky-200";
		case "assigned":
			return "bg-blue-50 text-blue-700 border-blue-200";
		case "in progress":
			return "bg-amber-50 text-amber-700 border-amber-200";
		case "on hold":
			return "bg-orange-50 text-orange-700 border-orange-200";
		case "resolved":
			return "bg-emerald-50 text-emerald-700 border-emerald-200";
		case "closed":
			return "bg-slate-100 text-slate-600 border-slate-200";
		default:
			return "bg-slate-100 text-slate-700 border-slate-200";
	}
};

const TicketDetailModal = ({ isOpen, onClose, ticket }) => {
	const [activeTab, setActiveTab] = useState("details");
	const [ticketDetail, setTicketDetail] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (isOpen && ticket) {
			setTicketDetail(ticket);
			setLoading(false);
		}
	}, [isOpen, ticket]);

	if (!isOpen) return null;

	return (
		<AnimatePresence>
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4"
				onClick={onClose}
			>
				<motion.div
					initial={{ opacity: 0, scale: 0.96, y: 12 }}
					animate={{ opacity: 1, scale: 1, y: 0 }}
					exit={{ opacity: 0, scale: 0.96, y: 12 }}
					className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-slate-200 flex flex-col"
					onClick={(e) => e.stopPropagation()}
				>
					{/* Header */}
					<div className="bg-slate-50 border-b border-slate-200 p-5 sm:p-6 flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="p-2.5 bg-sky-100 text-sky-700 rounded-lg">
								<FileText className="w-5 h-5" />
							</div>
							<div>
								<div className="flex items-center gap-2">
									<h3 className="text-lg font-bold text-slate-900">
										{ticketDetail?.no_ticket || `#${ticketDetail?.ticket_id}`}
									</h3>
									<span
										className={`px-2 py-0.5 rounded text-xs font-semibold border ${getStatusStyle(
											ticketDetail?.current_status
										)}`}
									>
										{ticketDetail?.current_status}
									</span>
								</div>
								<p className="text-xs text-slate-500 mt-0.5">Detail Lengkap Laporan Perbaikan IT</p>
							</div>
						</div>
						<button
							onClick={onClose}
							className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors"
						>
							<X className="w-5 h-5" />
						</button>
					</div>

					{/* Tabs */}
					<div className="bg-white border-b border-slate-200 px-5">
						<div className="flex space-x-6">
							<button
								type="button"
								onClick={() => setActiveTab("details")}
								className={`py-3 font-medium text-xs sm:text-sm border-b-2 transition-colors flex items-center gap-2 ${
									activeTab === "details"
										? "border-sky-600 text-sky-700 font-semibold"
										: "border-transparent text-slate-500 hover:text-slate-700"
								}`}
							>
								<FileText className="w-4 h-4" />
								<span>Detail</span>
							</button>
							<button
								type="button"
								onClick={() => setActiveTab("timeline")}
								className={`py-3 font-medium text-xs sm:text-sm border-b-2 transition-colors flex items-center gap-2 ${
									activeTab === "timeline"
										? "border-sky-600 text-sky-700 font-semibold"
										: "border-transparent text-slate-500 hover:text-slate-700"
								}`}
							>
								<Clock className="w-4 h-4" />
								<span>Timeline</span>
							</button>
							<button
								type="button"
								onClick={() => setActiveTab("notes")}
								className={`py-3 font-medium text-xs sm:text-sm border-b-2 transition-colors flex items-center gap-2 ${
									activeTab === "notes"
										? "border-sky-600 text-sky-700 font-semibold"
										: "border-transparent text-slate-500 hover:text-slate-700"
								}`}
							>
								<MessageSquare className="w-4 h-4" />
								<span>Catatan</span>
							</button>
						</div>
					</div>

					{/* Content */}
					<div className="p-5 sm:p-6 max-h-[calc(90vh-190px)] overflow-y-auto">
						{loading ? (
							<div className="flex justify-center items-center py-12">
								<div className="animate-spin rounded-full h-8 w-8 border-2 border-sky-600 border-t-transparent"></div>
								<span className="ml-2.5 text-xs text-slate-500 font-medium">
									Memuat detail ticket...
								</span>
							</div>
						) : (
							<>
								{activeTab === "details" && (
									<motion.div
										initial={{ opacity: 0, y: 10 }}
										animate={{ opacity: 1, y: 0 }}
										className="space-y-5"
									>
										{/* Basic Info */}
										<div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
											{/* Left Column */}
											<div className="space-y-4">
												<div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
													<h4 className="font-semibold text-xs uppercase tracking-wide text-slate-700 mb-3 flex items-center gap-2">
														<FileText className="w-3.5 h-3.5 text-slate-500" />
														Informasi Ticket
													</h4>
													<div className="space-y-3">
														<div>
															<label className="text-xs text-slate-500 block mb-0.5">
																Judul
															</label>
															<p className="text-slate-900 font-semibold text-sm">
																{ticketDetail?.title}
															</p>
														</div>
														<div>
															<label className="text-xs text-slate-500 block mb-0.5">
																Deskripsi
															</label>
															<p className="text-slate-700 text-xs leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
																{ticketDetail?.description || "Tidak ada deskripsi"}
															</p>
														</div>
													</div>
												</div>

												<div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
													<h4 className="font-semibold text-xs uppercase tracking-wide text-slate-700 mb-3 flex items-center gap-2">
														<User className="w-3.5 h-3.5 text-slate-500" />
														Informasi Pelapor
													</h4>
													<div className="space-y-2 text-xs">
														<div className="flex justify-between py-1 border-b border-slate-100">
															<span className="text-slate-500">Nama:</span>
															<span className="font-medium text-slate-900">
																{ticketDetail?.user_name}
															</span>
														</div>
														<div className="flex justify-between py-1">
															<span className="text-slate-500">Departemen:</span>
															<span className="font-medium text-slate-900">
																{ticketDetail?.departemen_name}
															</span>
														</div>
													</div>
												</div>
											</div>

											{/* Right Column */}
											<div className="space-y-4">
												<div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
													<h4 className="font-semibold text-xs uppercase tracking-wide text-slate-700 mb-3 flex items-center gap-2">
														<Tag className="w-3.5 h-3.5 text-slate-500" />
														Klasifikasi
													</h4>
													<div className="space-y-2.5 text-xs">
														<div className="flex justify-between items-center py-1 border-b border-slate-100">
															<span className="text-slate-500">Kategori:</span>
															<span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-md font-medium">
																{ticketDetail?.category_name}
															</span>
														</div>
														<div className="flex justify-between items-center py-1 border-b border-slate-100">
															<span className="text-slate-500">Prioritas:</span>
															<span
																className={`px-2.5 py-0.5 rounded-md font-medium border ${getPriorityStyle(
																	ticketDetail?.priority_name
																)}`}
															>
																{ticketDetail?.priority_name}
															</span>
														</div>
														<div className="flex justify-between items-center py-1">
															<span className="text-slate-500">Status:</span>
															<span
																className={`px-2.5 py-0.5 rounded-md font-medium border ${getStatusStyle(
																	ticketDetail?.current_status
																)}`}
															>
																{ticketDetail?.current_status}
															</span>
														</div>
													</div>
												</div>

												<div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
													<h4 className="font-semibold text-xs uppercase tracking-wide text-slate-700 mb-3 flex items-center gap-2">
														<Calendar className="w-3.5 h-3.5 text-slate-500" />
														Timeline & Jadwal
													</h4>
													<div className="space-y-2 text-xs">
														<div className="flex justify-between py-1 border-b border-slate-100">
															<span className="text-slate-500">Tanggal Buat:</span>
															<span className="font-medium text-slate-900">
																{ticketDetail?.submission_date}
															</span>
														</div>
														{ticketDetail?.resolved_date && (
															<div className="flex justify-between py-1 border-b border-slate-100">
																<span className="text-slate-500">Tanggal Selesai:</span>
																<span className="font-medium text-emerald-700">
																	{ticketDetail?.resolved_date}
																</span>
															</div>
														)}
														{ticketDetail?.closed_date && (
															<div className="flex justify-between py-1">
																<span className="text-slate-500">Tanggal Tutup:</span>
																<span className="font-medium text-slate-900">
																	{ticketDetail?.closed_date}
																</span>
															</div>
														)}
													</div>
												</div>

												{/* Assignment Info */}
												{ticketDetail?.assigned_to_name && (
													<div className="bg-sky-50/70 border border-sky-200 p-4 rounded-xl">
														<h4 className="font-semibold text-xs uppercase tracking-wide text-sky-900 mb-3 flex items-center gap-2">
															<UserCheck className="w-3.5 h-3.5 text-sky-700" />
															Penugasan Teknisi
														</h4>
														<div className="space-y-2 text-xs">
															<div className="flex justify-between py-1 border-b border-sky-100">
																<span className="text-sky-700">Ditugaskan ke:</span>
																<span className="font-semibold text-sky-900">
																	{ticketDetail?.assigned_to_name}
																</span>
															</div>
															<div className="flex justify-between py-1 border-b border-sky-100">
																<span className="text-sky-700">Tanggal Assignment:</span>
																<span className="font-medium text-sky-900">
																	{ticketDetail?.assigned_date}
																</span>
															</div>
															{ticketDetail?.assigned_by_name && (
																<div className="flex justify-between py-1">
																	<span className="text-sky-700">Ditugaskan oleh:</span>
																	<span className="font-medium text-sky-900">
																		{ticketDetail?.assigned_by_name}
																	</span>
																</div>
															)}
														</div>
													</div>
												)}
											</div>
										</div>
									</motion.div>
								)}

								{activeTab === "timeline" && (
									<motion.div
										initial={{ opacity: 0, y: 10 }}
										animate={{ opacity: 1, y: 0 }}
									>
										<TicketTimeline ticketId={ticketDetail?.ticket_id} />
									</motion.div>
								)}

								{activeTab === "notes" && (
									<motion.div
										initial={{ opacity: 0, y: 10 }}
										animate={{ opacity: 1, y: 0 }}
									>
										<TicketNotes ticketId={ticketDetail?.ticket_id} />
									</motion.div>
								)}
							</>
						)}
					</div>

					{/* Footer */}
					<div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex justify-end">
						<button
							type="button"
							onClick={onClose}
							className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-xs sm:text-sm font-medium rounded-lg hover:bg-slate-100 transition-colors shadow-xs"
						>
							Tutup
						</button>
					</div>
				</motion.div>
			</motion.div>
		</AnimatePresence>
	);
};

export default TicketDetailModal;
