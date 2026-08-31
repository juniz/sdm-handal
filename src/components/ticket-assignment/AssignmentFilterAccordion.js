import { motion, AnimatePresence } from "framer-motion";
import {
	Filter,
	ChevronDown,
	ChevronUp,
	Search,
	UserCheck,
	RotateCcw,
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
	// Count active filters
	const activeFilterCount = [
		filters.status,
		filters.priority,
		filters.category,
		filters.assigned_to,
		filters.search,
	].filter(Boolean).length;

	const handleResetFilters = (e) => {
		e.stopPropagation();
		setFilters({
			status: "",
			priority: "",
			category: "",
			assigned_to: "",
			search: "",
		});
	};

	return (
		<div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className="w-full px-4 py-3.5 flex items-center justify-between bg-slate-50 hover:bg-slate-100/70 transition-colors"
			>
				<div className="flex items-center gap-2.5">
					<Filter className="w-4 h-4 text-slate-500" />
					<span className="font-semibold text-xs sm:text-sm text-slate-800">
						Filter & Pencarian Ticket
					</span>
					{activeFilterCount > 0 && (
						<span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-200">
							{activeFilterCount} Aktif
						</span>
					)}
				</div>
				<div className="flex items-center gap-2">
					{activeFilterCount > 0 && (
						<span
							role="button"
							tabIndex={0}
							onClick={handleResetFilters}
							onKeyDown={(e) => e.key === "Enter" && handleResetFilters(e)}
							className="text-xs font-medium text-slate-500 hover:text-rose-600 px-2 py-0.5 rounded hover:bg-slate-200/50 transition-colors"
						>
							Reset
						</span>
					)}
					{isOpen ? (
						<ChevronUp className="w-4 h-4 text-slate-500" />
					) : (
						<ChevronDown className="w-4 h-4 text-slate-500" />
					)}
				</div>
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
						<div className="p-4 sm:p-5 space-y-4 border-t border-slate-100">
							{/* Filter Controls */}
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
								<div>
									<label className="block text-xs font-medium text-slate-600 mb-1">
										Status
									</label>
									<select
										value={filters.status}
										onChange={(e) =>
											setFilters({ ...filters, status: e.target.value })
										}
										className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-xs sm:text-sm text-slate-800"
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
									<label className="block text-xs font-medium text-slate-600 mb-1">
										Prioritas
									</label>
									<select
										value={filters.priority}
										onChange={(e) =>
											setFilters({ ...filters, priority: e.target.value })
										}
										className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-xs sm:text-sm text-slate-800"
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
									<label className="block text-xs font-medium text-slate-600 mb-1">
										Kategori
									</label>
									<select
										value={filters.category}
										onChange={(e) =>
											setFilters({ ...filters, category: e.target.value })
										}
										className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-xs sm:text-sm text-slate-800"
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
									<label className="block text-xs font-medium text-slate-600 mb-1">
										<UserCheck className="w-3.5 h-3.5 inline mr-1 text-slate-400" />
										Ditugaskan Ke
									</label>
									<select
										value={filters.assigned_to}
										onChange={(e) =>
											setFilters({ ...filters, assigned_to: e.target.value })
										}
										className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-xs sm:text-sm text-slate-800"
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
									<label className="block text-xs font-medium text-slate-600 mb-1">
										Cari Ticket
									</label>
									<div className="relative">
										<Search className="w-3.5 h-3.5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
										<input
											type="text"
											placeholder="No. ticket / judul..."
											value={filters.search}
											onChange={(e) =>
												setFilters({ ...filters, search: e.target.value })
											}
											className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800"
										/>
									</div>
								</div>
							</div>

							{/* Workload Summary Stats */}
							<div className="border-t border-slate-100 pt-4">
								<div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
									<div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
										<div className="text-lg font-bold text-slate-800">
											{itEmployees?.length || 0}
										</div>
										<div className="text-xs text-slate-500 font-medium">Pegawai IT</div>
									</div>
									<div className="p-3 bg-sky-50 border border-sky-100 rounded-lg">
										<div className="text-lg font-bold text-sky-700">
											{tickets?.filter(
												(t) =>
													!["Closed", "Resolved"].includes(t.current_status)
											).length || 0}
										</div>
										<div className="text-xs text-sky-600 font-medium">Ticket Aktif</div>
									</div>
									<div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
										<div className="text-lg font-bold text-emerald-700">
											{itEmployees?.filter((emp) => emp.active_tickets === 0)
												.length || 0}
										</div>
										<div className="text-xs text-emerald-600 font-medium">
											Teknisi Idle
										</div>
									</div>
									<div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
										<div className="text-lg font-bold text-slate-700">
											{Math.round(
												(itEmployees?.reduce(
													(sum, emp) => sum + emp.active_tickets,
													0
												) || 0) / (itEmployees?.length || 1)
											)}
										</div>
										<div className="text-xs text-slate-500 font-medium">
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
