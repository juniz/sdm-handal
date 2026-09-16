const Pagination = ({ pagination, onPageChange }) => {
	if (pagination.totalPages <= 1) return null;

	return (
		<div className="flex justify-center items-center space-x-2 mt-6">
			<button
				onClick={() => onPageChange(pagination.page - 1)}
				disabled={pagination.page === 1}
				className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors"
			>
				Sebelumnya
			</button>
			<span className="px-3 py-1.5 text-xs sm:text-sm text-slate-600 font-medium">
				Halaman {pagination.page} dari {pagination.totalPages}
			</span>
			<button
				onClick={() => onPageChange(pagination.page + 1)}
				disabled={pagination.page === pagination.totalPages}
				className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors"
			>
				Selanjutnya
			</button>
		</div>
	);
};

export default Pagination;
