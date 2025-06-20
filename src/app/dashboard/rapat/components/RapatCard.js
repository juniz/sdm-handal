"use client";

import { motion } from "framer-motion";
import {
	Calendar,
	Users,
	Building2,
	FileText,
	Pencil,
	Trash2,
} from "lucide-react";
import SignatureImage from "./SignatureImage";

const RapatCard = ({ rapat, onEdit, onDelete }) => (
	<motion.div
		initial={{ opacity: 0, y: 20 }}
		animate={{ opacity: 1, y: 0 }}
		className="bg-white rounded-lg p-4 shadow-sm"
	>
		<div className="flex items-start justify-between">
			<div className="flex items-center gap-2">
				<Calendar className="w-5 h-5 text-blue-500" />
				<span className="font-medium">{rapat.tanggal}</span>
			</div>
			<div className="flex gap-2">
				<button
					onClick={() => onEdit(rapat)}
					className="p-1 text-gray-500 hover:text-blue-500"
					title="Edit"
				>
					<Pencil className="w-4 h-4" />
				</button>
				<button
					onClick={() => onDelete(rapat.id)}
					className="p-1 text-gray-500 hover:text-red-500"
					title="Hapus"
				>
					<Trash2 className="w-4 h-4" />
				</button>
			</div>
		</div>
		<div className="mt-3 space-y-2">
			<div className="flex items-start gap-2">
				<FileText className="w-5 h-5 text-gray-400 mt-1" />
				<div>
					<p className="font-medium">{rapat.rapat}</p>
				</div>
			</div>
			<div className="flex items-center gap-2">
				<Users className="w-5 h-5 text-gray-400" />
				<span>{rapat.nama}</span>
			</div>
			<div className="flex items-center gap-2">
				<Building2 className="w-5 h-5 text-gray-400" />
				<span>{rapat.instansi}</span>
			</div>
			{rapat.tanda_tangan && (
				<div className="mt-3">
					<SignatureImage base64Data={rapat.tanda_tangan} />
				</div>
			)}
		</div>
	</motion.div>
);

export default RapatCard;
