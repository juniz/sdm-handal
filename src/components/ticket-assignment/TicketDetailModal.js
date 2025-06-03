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

const getPriorityColor = (priority) => {
	switch (priority?.toLowerCase()) {
		case "low":
			return "bg-green-100 text-green-800 border-green-200";
		case "medium":
			return "bg-yellow-100 text-yellow-800 border-yellow-200";
		case "high":
			return "bg-red-100 text-red-800 border-red-200";
		case "critical":
			return "bg-purple-100 text-purple-800 border-purple-200";
		default:
			return "bg-gray-100 text-gray-800 border-gray-200";
	}
};

const getStatusColor = (status) => {
	switch (status?.toLowerCase()) {
		case "open":
			return "bg-blue-100 text-blue-800 border-blue-200";
		case "assigned":
			return "bg-yellow-100 text-yellow-800 border-yellow-200";
		case "in progress":
			return "bg-orange-100 text-orange-800 border-orange-200";
		case "resolved":
			return "bg-green-100 text-green-800 border-green-200";
		case "closed":
			return "bg-gray-100 text-gray-800 border-gray-200";
		default:
			return "bg-gray-100 text-gray-800 border-gray-200";
	}
};

const TicketDetailModal = ({ isOpen, onClose, ticket }) => {
	const [activeTab, setActiveTab] = useState("details");
	const [ticketDetail, setTicketDetail] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (isOpen && ticket) {
			// Set the ticket detail from props (already have most info)
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
				className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
				onClick={onClose}
			>
				<motion.div
					initial={{ opacity: 0, scale: 0.95, y: 20 }}
					animate={{ opacity: 1, scale: 1, y: 0 }}
					exit={{ opacity: 0, scale: 0.95, y: 20 }}
					className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
					onClick={(e) => e.stopPropagation()}
				>
					{/* Header */}
					<div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								<FileText className="w-6 h-6" />
								<div>
									<h3 className="text-xl font-semibold">
										{ticketDetail?.no_ticket || `#${ticketDetail?.ticket_id}`}
									</h3>
									<p className="text-blue-100 text-sm">Detail Pengaduan</p>
								</div>
							</div>
							<button
								onClick={onClose}
								className="text-white hover:text-blue-200 transition-colors"
							>
								<X className="w-6 h-6" />
							</button>
						</div>
					</div>

					{/* Tabs */}
					<div className="bg-white border-b">
						<div className="flex">
							<button
								onClick={() => setActiveTab("details")}
								className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
									activeTab === "details"
										? "border-blue-500 text-blue-600 bg-blue-50"
										: "border-transparent text-gray-500 hover:text-gray-700"
								}`}
							>
								<div className="flex items-center gap-2">
									<FileText className="w-4 h-4" />
									Detail
								</div>
							</button>
							<button
								onClick={() => setActiveTab("timeline")}
								className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
									activeTab === "timeline"
										? "border-blue-500 text-blue-600 bg-blue-50"
										: "border-transparent text-gray-500 hover:text-gray-700"
								}`}
							>
								<div className="flex items-center gap-2">
									<Clock className="w-4 h-4" />
									Timeline
								</div>
							</button>
							<button
								onClick={() => setActiveTab("notes")}
								className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
									activeTab === "notes"
										? "border-blue-500 text-blue-600 bg-blue-50"
										: "border-transparent text-gray-500 hover:text-gray-700"
								}`}
							>
								<div className="flex items-center gap-2">
									<MessageSquare className="w-4 h-4" />
									Catatan
								</div>
							</button>
						</div>
					</div>

					{/* Content */}
					<div className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
						{loading ? (
							<div className="flex justify-center items-center py-12">
								<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
								<span className="ml-2 text-gray-600">
									Memuat detail ticket...
								</span>
							</div>
						) : (
							<>
								{activeTab === "details" && (
									<motion.div
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										className="space-y-6"
									>
										{/* Basic Info */}
										<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
											{/* Left Column */}
											<div className="space-y-4">
												<div className="bg-gray-50 p-4 rounded-lg">
													<h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
														<FileText className="w-4 h-4" />
														Informasi Ticket
													</h4>
													<div className="space-y-3">
														<div>
															<label className="text-sm font-medium text-gray-600">
																Judul
															</label>
															<p className="text-gray-900 font-medium">
																{ticketDetail?.title}
															</p>
														</div>
														<div>
															<label className="text-sm font-medium text-gray-600">
																Deskripsi
															</label>
															<p className="text-gray-800 text-sm leading-relaxed bg-white p-3 rounded border">
																{ticketDetail?.description}
															</p>
														</div>
													</div>
												</div>

												<div className="bg-gray-50 p-4 rounded-lg">
													<h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
														<User className="w-4 h-4" />
														Informasi Pelapor
													</h4>
													<div className="space-y-2">
														<div className="flex justify-between">
															<span className="text-sm text-gray-600">
																Nama:
															</span>
															<span className="text-sm font-medium text-gray-900">
																{ticketDetail?.user_name}
															</span>
														</div>
														<div className="flex justify-between">
															<span className="text-sm text-gray-600">
																Departemen:
															</span>
															<span className="text-sm font-medium text-gray-900">
																{ticketDetail?.departemen_name}
															</span>
														</div>
													</div>
												</div>
											</div>

											{/* Right Column */}
											<div className="space-y-4">
												<div className="bg-gray-50 p-4 rounded-lg">
													<h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
														<Tag className="w-4 h-4" />
														Klasifikasi
													</h4>
													<div className="space-y-3">
														<div className="flex justify-between items-center">
															<span className="text-sm text-gray-600">
																Kategori:
															</span>
															<span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full font-medium">
																{ticketDetail?.category_name}
															</span>
														</div>
														<div className="flex justify-between items-center">
															<span className="text-sm text-gray-600">
																Prioritas:
															</span>
															<span
																className={`px-3 py-1 text-sm rounded-full font-medium border ${getPriorityColor(
																	ticketDetail?.priority_name
																)}`}
															>
																{ticketDetail?.priority_name}
															</span>
														</div>
														<div className="flex justify-between items-center">
															<span className="text-sm text-gray-600">
																Status:
															</span>
															<span
																className={`px-3 py-1 text-sm rounded-full font-medium border ${getStatusColor(
																	ticketDetail?.current_status
																)}`}
															>
																{ticketDetail?.current_status}
															</span>
														</div>
													</div>
												</div>

												<div className="bg-gray-50 p-4 rounded-lg">
													<h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
														<Calendar className="w-4 h-4" />
														Timeline
													</h4>
													<div className="space-y-2">
														<div className="flex justify-between">
															<span className="text-sm text-gray-600">
																Tanggal Buat:
															</span>
															<span className="text-sm font-medium text-gray-900">
																{ticketDetail?.submission_date}
															</span>
														</div>
														{ticketDetail?.resolved_date && (
															<div className="flex justify-between">
																<span className="text-sm text-gray-600">
																	Tanggal Selesai:
																</span>
																<span className="text-sm font-medium text-gray-900">
																	{ticketDetail?.resolved_date}
																</span>
															</div>
														)}
														{ticketDetail?.closed_date && (
															<div className="flex justify-between">
																<span className="text-sm text-gray-600">
																	Tanggal Tutup:
																</span>
																<span className="text-sm font-medium text-gray-900">
																	{ticketDetail?.closed_date}
																</span>
															</div>
														)}
													</div>
												</div>

												{/* Assignment Info */}
												{ticketDetail?.assigned_to_name && (
													<div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
														<h4 className="font-semibold text-yellow-900 mb-3 flex items-center gap-2">
															<UserCheck className="w-4 h-4" />
															Assignment Info
														</h4>
														<div className="space-y-2">
															<div className="flex justify-between">
																<span className="text-sm text-yellow-700">
																	Ditugaskan ke:
																</span>
																<span className="text-sm font-medium text-yellow-900">
																	{ticketDetail?.assigned_to_name}
																</span>
															</div>
															<div className="flex justify-between">
																<span className="text-sm text-yellow-700">
																	Tanggal Assignment:
																</span>
																<span className="text-sm font-medium text-yellow-900">
																	{ticketDetail?.assigned_date}
																</span>
															</div>
															{ticketDetail?.assigned_by_name && (
																<div className="flex justify-between">
																	<span className="text-sm text-yellow-700">
																		Ditugaskan oleh:
																	</span>
																	<span className="text-sm font-medium text-yellow-900">
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
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
									>
										<TicketTimeline ticketId={ticketDetail?.ticket_id} />
									</motion.div>
								)}

								{activeTab === "notes" && (
									<motion.div
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
									>
										<TicketNotes ticketId={ticketDetail?.ticket_id} />
									</motion.div>
								)}
							</>
						)}
					</div>

					{/* Footer */}
					<div className="bg-gray-50 px-6 py-4 flex justify-end">
						<button
							onClick={onClose}
							className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
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
