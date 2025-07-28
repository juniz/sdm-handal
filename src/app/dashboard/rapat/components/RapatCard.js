"use client";

import { motion } from "framer-motion";
import { Calendar, User, Building, Edit, Trash2 } from "lucide-react";
import moment from "moment-timezone";

const RapatCard = ({ rapat, onEdit, onDelete, searchTerm = "" }) => {
	// Function to highlight search term in text
	const highlightText = (text, searchTerm) => {
		if (!searchTerm || !text) return text;

		const regex = new RegExp(`(${searchTerm})`, "gi");
		const parts = text.split(regex);

		return parts.map((part, index) =>
			regex.test(part) ? (
				<span key={index} className="bg-yellow-200 font-semibold">
					{part}
				</span>
			) : (
				part
			)
		);
	};

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -20 }}
			className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow"
		>
			<div className="space-y-3">
				{/* Header */}
				<div className="flex items-start justify-between">
					<div className="flex-1">
						<h3 className="font-semibold text-gray-900 text-lg leading-tight">
							{highlightText(rapat.rapat, searchTerm)}
						</h3>
						<div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
							<Calendar className="w-4 h-4" />
							<span>{rapat.tanggal}</span>
						</div>
					</div>

					{/* Action buttons */}
					<div className="flex gap-1">
						<button
							onClick={() => onEdit(rapat)}
							className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
							title="Edit rapat"
						>
							<Edit className="w-4 h-4" />
						</button>
						<button
							onClick={() => onDelete(rapat.id)}
							className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
							title="Hapus rapat"
						>
							<Trash2 className="w-4 h-4" />
						</button>
					</div>
				</div>

				{/* Participant info */}
				<div className="space-y-2">
					<div className="flex items-center gap-2 text-sm">
						<User className="w-4 h-4 text-gray-400" />
						<span className="text-gray-600">
							<strong>Peserta:</strong> {rapat.nama}
						</span>
					</div>
					<div className="flex items-center gap-2 text-sm">
						<Building className="w-4 h-4 text-gray-400" />
						<span className="text-gray-600">
							<strong>Instansi:</strong> {rapat.instansi}
						</span>
					</div>
				</div>

				{/* Signature preview */}
				{rapat.tanda_tangan && (
					<div className="pt-2 border-t">
						<div className="flex items-center gap-2 text-sm text-gray-500">
							<span className="font-medium">Tanda Tangan:</span>
							<span className="text-green-600">✓ Tersedia</span>
						</div>
					</div>
				)}
			</div>
		</motion.div>
	);
};

export default RapatCard;
