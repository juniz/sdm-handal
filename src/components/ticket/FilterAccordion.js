import { motion, AnimatePresence } from "framer-motion";
import {
	Filter,
	ChevronDown,
	ChevronUp,
	Plus,
	Search,
	User,
} from "lucide-react";

const FilterAccordion = ({
	filters,
	setFilters,
	isOpen,
	setIsOpen,
	onAddClick,
	loading,
	masterData,
}) => {
	return (
		<div className="bg-white rounded-lg shadow-sm overflow-hidden">
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
			>
				<div className="flex items-center gap-2">
					<Filter className="w-4 h-4 text-gray-500" />
					<span className="font-medium text-sm">Filter & Aksi</span>
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
							{/* Toggle Ticket Saya */}
							<div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
								<div className="flex items-center gap-2">
									<User className="w-4 h-4 text-gray-500" />
									<span className="text-sm font-medium text-gray-700">
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
									<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
								</label>
							</div>

							{/* Filter Controls */}
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
										Cari
									</label>
									<div className="relative">
										<Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
										<input
											type="text"
											placeholder="Cari nomor ticket, judul, atau deskripsi..."
											value={filters.search}
											onChange={(e) =>
												setFilters({ ...filters, search: e.target.value })
											}
											className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
										/>
									</div>
								</div>
							</div>

							<div className="border-t pt-4">
								<button
									onClick={onAddClick}
									className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm w-full md:w-auto"
									disabled={loading}
								>
									<Plus className="w-4 h-4" />
									<span>Buat Pelaporan Baru</span>
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
