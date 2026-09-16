import { FileText, RotateCcw, Plus } from "lucide-react";

const EmptyState = ({
	message = "Tidak ada pelaporan ditemukan",
	hasFilters = false,
	onResetFilters,
	onAddNew,
}) => (
	<div className="text-center py-12 px-4 bg-white rounded-xl border border-slate-200">
		<FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
		<h3 className="text-lg sm:text-xl font-semibold text-slate-800">{message}</h3>
		<p className="text-slate-500 mt-1.5 text-xs sm:text-sm max-w-md mx-auto">
			{hasFilters
				? "Tidak ada tiket yang cocok dengan kriteria filter yang diterapkan."
				: message.includes("berjalan")
				? "Semua tiket sedang dalam proses penanganan oleh tim teknis."
				: message.includes("selesai")
				? "Belum ada tiket yang telah diselesaikan."
				: "Buat pelaporan baru untuk melaporkan kendala teknis atau fasilitas."}
		</p>
		<div className="mt-5 flex justify-center gap-2.5">
			{hasFilters && onResetFilters ? (
				<button
					type="button"
					onClick={onResetFilters}
					className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
				>
					<RotateCcw className="w-3.5 h-3.5" />
					<span>Reset Filter</span>
				</button>
			) : onAddNew ? (
				<button
					type="button"
					onClick={onAddNew}
					className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm transition-colors"
				>
					<Plus className="w-3.5 h-3.5" />
					<span>Buat Pelaporan Baru</span>
				</button>
			) : null}
		</div>
	</div>
);

export default EmptyState;
