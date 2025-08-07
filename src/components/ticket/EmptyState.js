import { FileText } from "lucide-react";

const EmptyState = ({ message = "Tidak ada pelaporan ditemukan" }) => (
	<div className="text-center py-12">
		<FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
		<h3 className="text-xl font-medium text-gray-600">{message}</h3>
		<p className="text-gray-500 mt-2">
			{message.includes("berjalan")
				? "Semua ticket sedang dalam proses penanganan"
				: message.includes("selesai")
				? "Belum ada ticket yang telah diselesaikan"
				: "Buat pelaporan baru untuk melaporkan masalah IT"}
		</p>
	</div>
);

export default EmptyState;
