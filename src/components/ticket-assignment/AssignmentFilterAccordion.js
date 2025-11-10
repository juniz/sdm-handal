import { motion, AnimatePresence } from "framer-motion";
import {
	Filter,
	ChevronDown,
	ChevronUp,
	Search,
	UserCheck,
} from "lucide-react";

const AssignmentFilterAccordion = ({
	filters,
	setFilters,
	isOpen,
	setIsOpen,
	loading,
	masterData,
	itEmployees,
	tickets,
}) => {
	return (
		<div className="bg-white rounded-lg shadow-sm overflow-hidden">
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
			>
				<div className="flex items-center gap-2">
					<Filter className="w-4 h-4 text-gray-500" />
					<span className="font-medium text-sm">Filter Ticket Assignment</span>
				</div>
				{isOpen ? (
					<ChevronUp className="w-4 h-4 text-gray-500" />
				) : (
					<ChevronDown className="w-4 h-4 text-gray-500" />
				)}
			</button>

			<AnimatePresence>
				{isOpen && (
					<motion.div
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: "auto", opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						transition={{ duration: 0.2 }}
						className="overflow-hidden"
					>
						<div className="p-4 space-y-4">
							{/* Filter Controls */}
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
								<div>
									<label className="block text-sm text-gray-600 mb-1">
										Status
									</label>
									<select
										value={filters.status}
										onChange={(e) =>
											setFilters({ ...filters, status: e.target.value })
										}
										className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
									>
										<option value="">Semua Status</option>
										{masterData.statuses?.map((status) => (
											<option key={status.status_id} value={status.status_name}>
												{status.status_name}
											</option>
										))}
									</select>
								</div>

								<div>
									<label className="block text-sm text-gray-600 mb-1">
										Prioritas
									</label>
									<select
										value={filters.priority}
										onChange={(e) =>
											setFilters({ ...filters, priority: e.target.value })
										}
										className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
									>
										<option value="">Semua Prioritas</option>
										{masterData.priorities?.map((priority) => (
											<option
												key={priority.priority_id}
												value={priority.priority_name}
											>
												{priority.priority_name}
											</option>
										))}
									</select>
								</div>

								<div>
									<label className="block text-sm text-gray-600 mb-1">
										Kategori
									</label>
									<select
										value={filters.category}
										onChange={(e) =>
											setFilters({ ...filters, category: e.target.value })
										}
										className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
									>
										<option value="">Semua Kategori</option>
										{masterData.categories?.map((category) => (
											<option
												key={category.category_id}
												value={category.category_name}
											>
												{category.category_name}
											</option>
										))}
									</select>
								</div>

								<div>
									<label className="block text-sm text-gray-600 mb-1">
										<UserCheck className="w-4 h-4 inline mr-1" />
										Ditugaskan Ke
									</label>
									<select
										value={filters.assigned_to}
										onChange={(e) =>
											setFilters({ ...filters, assigned_to: e.target.value })
										}
										className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
									>
										<option value="">Semua</option>
										<option value="unassigned">Belum Ditugaskan</option>
										{itEmployees?.map((employee) => (
											<option key={employee.nik} value={employee.nik}>
												{employee.nama}
											</option>
										))}
									</select>
								</div>

								<div>
									<label className="block text-sm text-gray-600 mb-1">
										Cari
									</label>
									<div className="relative">
										<Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
										<input
											type="text"
											placeholder="Cari ticket..."
											value={filters.search}
											onChange={(e) =>
												setFilters({ ...filters, search: e.target.value })
											}
											className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
										/>
									</div>
								</div>
							</div>

							{/* Summary Stats */}
							<div className="border-t pt-4">
								<div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
									<div className="p-3 bg-blue-50 rounded-lg">
										<div className="text-lg font-semibold text-blue-600">
											{itEmployees?.length || 0}
										</div>
										<div className="text-xs text-blue-600">Pegawai IT</div>
									</div>
									<div className="p-3 bg-orange-50 rounded-lg">
										<div className="text-lg font-semibold text-orange-600">
											{tickets?.filter(
												(t) =>
													!["Closed", "Resolved"].includes(t.current_status)
											).length || 0}
										</div>
										<div className="text-xs text-orange-600">Ticket Aktif</div>
									</div>
									<div className="p-3 bg-green-50 rounded-lg">
										<div className="text-lg font-semibold text-green-600">
											{itEmployees?.filter((emp) => emp.active_tickets === 0)
												.length || 0}
										</div>
										<div className="text-xs text-green-600">
											Pegawai Tersedia
										</div>
									</div>
									<div className="p-3 bg-purple-50 rounded-lg">
										<div className="text-lg font-semibold text-purple-600">
											{Math.round(
												(itEmployees?.reduce(
													(sum, emp) => sum + emp.active_tickets,
													0
												) || 0) / (itEmployees?.length || 1)
											)}
										</div>
										<div className="text-xs text-purple-600">
											Rata-rata Beban
										</div>
									</div>
								</div>
							</div>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
};

export default AssignmentFilterAccordion;
