import { motion, AnimatePresence } from "framer-motion";
import {
	Filter,
	ChevronDown,
	ChevronUp,
	Search,
	User,
	RotateCcw,
	X,
} from "lucide-react";

const FilterAccordion = ({
	filters,
	setFilters,
	isOpen,
	setIsOpen,
	loading,
	masterData,
}) => {
	const activeFilterCount = [
		filters.status,
		filters.priority,
		filters.category,
		filters.search,
		filters.myTickets,
	].filter(Boolean).length;

	return (
		<div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className="w-full px-4 py-3 flex items-center justify-between bg-slate-50 hover:bg-slate-100/80 transition-colors border-b border-slate-100"
			>
				<div className="flex items-center gap-2 text-slate-700">
					<Filter className="w-4 h-4 text-sky-600" />
					<span className="font-semibold text-sm">Filter & Pencarian</span>
					{activeFilterCount > 0 && (
						<span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-700 border border-sky-200">
							{activeFilterCount} aktif
						</span>
					)}
				</div>
				{isOpen ? (
					<ChevronUp className="w-4 h-4 text-slate-500" />
				) : (
					<ChevronDown className="w-4 h-4 text-slate-500" />
				)}
			</button>

			{!isOpen && activeFilterCount > 0 && (
				<div className="px-4 py-2 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center gap-1.5 text-xs">
					<span className="text-slate-500 font-medium">Filter aktif:</span>
					{filters.myTickets && (
						<button
							type="button"
							onClick={() => setFilters({ ...filters, myTickets: false })}
							className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 hover:border-slate-300 font-medium transition-colors"
						>
							<span>Hanya Pengajuan Saya</span>
							<X className="w-3 h-3 text-slate-400 hover:text-slate-600" />
						</button>
					)}
					{filters.status && (
						<button
							type="button"
							onClick={() => setFilters({ ...filters, status: "" })}
							className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 hover:border-slate-300 font-medium transition-colors"
						>
							<span>Status: {filters.status}</span>
							<X className="w-3 h-3 text-slate-400 hover:text-slate-600" />
						</button>
					)}
					{filters.priority && (
						<button
							type="button"
							onClick={() => setFilters({ ...filters, priority: "" })}
							className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 hover:border-slate-300 font-medium transition-colors"
						>
							<span>Prioritas: {filters.priority}</span>
							<X className="w-3 h-3 text-slate-400 hover:text-slate-600" />
						</button>
					)}
					{filters.category && (
						<button
							type="button"
							onClick={() => setFilters({ ...filters, category: "" })}
							className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 hover:border-slate-300 font-medium transition-colors"
						>
							<span>Kategori: {filters.category}</span>
							<X className="w-3 h-3 text-slate-400 hover:text-slate-600" />
						</button>
					)}
					{filters.search && (
						<button
							type="button"
							onClick={() => setFilters({ ...filters, search: "" })}
							className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 hover:border-slate-300 font-medium transition-colors max-w-[200px]"
						>
							<span className="truncate">&quot;{filters.search}&quot;</span>
							<X className="w-3 h-3 text-slate-400 hover:text-slate-600 shrink-0" />
						</button>
					)}
					<button
						type="button"
						onClick={() =>
							setFilters({
								status: "",
								priority: "",
								category: "",
								search: "",
								myTickets: false,
							})
						}
						className="text-sky-700 hover:text-sky-900 font-medium underline ml-1 cursor-pointer"
					>
						Hapus Semua
					</button>
				</div>
			)}

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
							{/* Toggle Ticket Saya */}
							<div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
								<div className="flex items-center gap-2">
									<User className="w-4 h-4 text-slate-500" />
									<span className="text-sm font-medium text-slate-700">
										Hanya Pengajuan Saya
									</span>
								</div>
								<label className="relative inline-flex items-center cursor-pointer">
									<input
										type="checkbox"
										checked={filters.myTickets}
										onChange={(e) =>
											setFilters({ ...filters, myTickets: e.target.checked })
										}
										className="sr-only peer"
									/>
									<div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-sky-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
								</label>
							</div>

							{/* Filter Controls */}
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
								<div>
									<label className="block text-xs font-semibold text-slate-600 mb-1">
										Status
									</label>
									<select
										value={filters.status}
										onChange={(e) =>
											setFilters({ ...filters, status: e.target.value })
										}
										className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm bg-white"
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
									<label className="block text-xs font-semibold text-slate-600 mb-1">
										Prioritas
									</label>
									<select
										value={filters.priority}
										onChange={(e) =>
											setFilters({ ...filters, priority: e.target.value })
										}
										className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm bg-white"
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
									<label className="block text-xs font-semibold text-slate-600 mb-1">
										Kategori
									</label>
									<select
										value={filters.category}
										onChange={(e) =>
											setFilters({ ...filters, category: e.target.value })
										}
										className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm bg-white"
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
									<label className="block text-xs font-semibold text-slate-600 mb-1">
										Cari
									</label>
									<div className="relative">
										<Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
										<input
											type="text"
											placeholder="No. tiket, judul, deskripsi..."
											value={filters.search}
											onChange={(e) =>
												setFilters({ ...filters, search: e.target.value })
											}
											className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
										/>
									</div>
								</div>
							</div>

							<div className="border-t border-slate-100 pt-3 flex justify-end">
								<button
									type="button"
									onClick={() =>
										setFilters({
											status: "",
											priority: "",
											category: "",
											search: "",
											myTickets: false,
										})
									}
									className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5"
									disabled={loading}
								>
									<RotateCcw className="w-3.5 h-3.5" />
									<span>Reset Filter</span>
								</button>
							</div>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
};

export default FilterAccordion;
