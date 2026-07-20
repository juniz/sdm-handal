"use client";

import React from "react";
import { AlertTriangle, Info, X } from "lucide-react";

export function ConfirmationDialog({ 
	isOpen, 
	onClose, 
	onConfirm, 
	title = "Konfirmasi Tindakan", 
	description = "Apakah Anda yakin ingin melakukan tindakan ini?", 
	confirmText = "Ya, Lanjutkan", 
	cancelText = "Batal", 
	variant = "primary" // "primary", "danger", "warning"
}) {
	if (!isOpen) return null;

	const iconMap = {
		danger: <AlertTriangle className="h-6 w-6 text-rose-600" />,
		warning: <AlertTriangle className="h-6 w-6 text-amber-500" />,
		primary: <Info className="h-6 w-6 text-primary-600" />
	};

	const buttonClasses = {
		danger: "bg-rose-600 hover:bg-rose-500 text-white",
		warning: "bg-amber-500 hover:bg-amber-400 text-slate-800",
		primary: "bg-primary-600 hover:bg-primary-500 text-white"
	};

	return (
		<div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
			<div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200">
				{/* Header */}
				<div className="px-6 pt-6 pb-2 flex items-start gap-4">
					<div className="p-2 bg-slate-50 border border-slate-100 rounded-xl shrink-0">
						{iconMap[variant]}
					</div>
					<div className="space-y-1.5 flex-1">
						<h3 className="font-extrabold text-slate-800 text-base leading-snug font-figtree">
							{title}
						</h3>
						<p className="text-slate-500 text-xs font-semibold leading-relaxed">
							{description}
						</p>
					</div>
					<button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-lg transition-all cursor-pointer shrink-0">
						<X className="h-4 w-4" />
					</button>
				</div>

				{/* Footer */}
				<div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2 mt-4">
					<button 
						onClick={onClose}
						className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-750 font-bold rounded-xl text-xs transition-colors cursor-pointer"
					>
						{cancelText}
					</button>
					<button 
						onClick={onConfirm}
						className={`px-4 py-2 font-bold rounded-xl text-xs transition-all active:scale-95 cursor-pointer ${buttonClasses[variant]}`}
					>
						{confirmText}
					</button>
				</div>
			</div>
		</div>
	);
}
