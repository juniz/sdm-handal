const Pagination = ({ pagination, onPageChange }) => {
	if (pagination.totalPages <= 1) return null;

	return (
		<div className="flex justify-center items-center space-x-2 mt-6">
			<button
				onClick={() => onPageChange(pagination.page - 1)}
				disabled={pagination.page === 1}
				className="px-3 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
			>
				Sebelumnya
			</button>
			<span className="px-4 py-2 text-sm">
				Halaman {pagination.page} dari {pagination.totalPages}
			</span>
			<button
				onClick={() => onPageChange(pagination.page + 1)}
				disabled={pagination.page === pagination.totalPages}
				className="px-3 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
			>
				Selanjutnya
			</button>
		</div>
	);
};

export default Pagination;
