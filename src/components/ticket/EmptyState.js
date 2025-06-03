import { FileText } from "lucide-react";

const EmptyState = () => (
	<div className="text-center py-12">
		<FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
		<h3 className="text-xl font-medium text-gray-600">
			Tidak ada pelaporan ditemukan
		</h3>
		<p className="text-gray-500 mt-2">
			Buat pelaporan baru untuk melaporkan masalah IT
		</p>
	</div>
);

export default EmptyState;
