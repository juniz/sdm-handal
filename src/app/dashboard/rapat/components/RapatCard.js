"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
	Calendar,
	User,
	Building,
	Edit,
	Trash2,
	ChevronUp,
	ChevronDown,
} from "lucide-react";
import moment from "moment-timezone";

const RapatCard = ({
	rapat,
	index,
	totalItems,
	onEdit,
	onDelete,
	onMoveUp,
	onMoveDown,
	onUrutanChange,
	searchTerm = "",
	isITUser = false,
}) => {
	const [urutanInput, setUrutanInput] = useState(
		rapat.urutan || index + 1
	);
	const [isEditingUrutan, setIsEditingUrutan] = useState(false);
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

	// Handler untuk input urutan
	const handleUrutanInputChange = (e) => {
		const value = e.target.value;
		// Hanya allow angka
		if (value === "" || /^\d+$/.test(value)) {
			setUrutanInput(value);
		}
	};

	const handleUrutanBlur = () => {
		setIsEditingUrutan(false);
		const urutanNum = parseInt(urutanInput);
		if (
			!isNaN(urutanNum) &&
			urutanNum >= 1 &&
			urutanNum <= totalItems &&
			urutanNum !== (rapat.urutan || index + 1)
		) {
			if (onUrutanChange) {
				onUrutanChange(rapat.id, urutanNum);
			}
		} else {
			// Reset ke nilai semula jika tidak valid
			setUrutanInput(rapat.urutan || index + 1);
		}
	};

	const handleUrutanKeyDown = (e) => {
		if (e.key === "Enter") {
			e.target.blur();
		} else if (e.key === "Escape") {
			setUrutanInput(rapat.urutan || index + 1);
			setIsEditingUrutan(false);
			e.target.blur();
		}
	};

	// Update input saat rapat.urutan berubah
	useEffect(() => {
		setUrutanInput(rapat.urutan || index + 1);
	}, [rapat.urutan, index]);

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
						<div className="flex items-center gap-2 flex-wrap">
							{isITUser && onUrutanChange ? (
								<div className="flex items-center gap-1">
									<label className="text-xs text-gray-500">Urutan:</label>
									<input
										type="text"
										inputMode="numeric"
										value={urutanInput}
										onChange={handleUrutanInputChange}
										onBlur={handleUrutanBlur}
										onKeyDown={handleUrutanKeyDown}
										onFocus={() => setIsEditingUrutan(true)}
										className={`w-12 px-2 py-1 text-xs font-medium border rounded text-center transition-all ${
											isEditingUrutan
												? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
												: "border-gray-300 bg-gray-100 hover:border-gray-400"
										}`}
										min="1"
										max={totalItems}
										title={`Masukkan urutan 1-${totalItems}`}
									/>
								</div>
							) : isITUser ? (
								<span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
									#{rapat.urutan || index + 1}
								</span>
							) : null}
							<h3 className="font-semibold text-gray-900 text-lg leading-tight">
								{highlightText(rapat.rapat, searchTerm)}
							</h3>
						</div>
						<div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
							<Calendar className="w-4 h-4" />
							<span>{rapat.tanggal}</span>
						</div>
					</div>

					{/* Action buttons */}
					<div className="flex flex-col gap-1">
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
						{/* Reorder buttons untuk IT */}
						{isITUser && (onMoveUp || onMoveDown) && (
							<div className="flex gap-1 justify-end">
								<button
									onClick={() => onMoveUp(index)}
									disabled={index === 0}
									className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
									title="Pindah ke atas"
								>
									<ChevronUp className="w-3.5 h-3.5" />
								</button>
								<button
									onClick={() => onMoveDown(index)}
									disabled={index === totalItems - 1}
									className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
									title="Pindah ke bawah"
								>
									<ChevronDown className="w-3.5 h-3.5" />
								</button>
							</div>
						)}
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
