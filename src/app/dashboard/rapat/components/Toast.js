"use client";

import { motion } from "framer-motion";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

const Toast = ({ message, type = "success", onClose }) => (
	<motion.div
		initial={{ opacity: 0, y: 30, scale: 0.95 }}
		animate={{ opacity: 1, y: 0, scale: 1 }}
		exit={{ opacity: 0, y: 20, scale: 0.95 }}
		transition={{ duration: 0.15 }}
		role="status"
		aria-live="polite"
		className="fixed bottom-5 right-5 px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 bg-slate-900/95 text-white border border-slate-700/80 backdrop-blur-xs z-[140] max-w-md text-sm"
	>
		{type === "success" ? (
			<CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
		) : (
			<AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
		)}
		<span className="font-medium flex-1 leading-snug">{message}</span>
		<button
			type="button"
			onClick={onClose}
			className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
			aria-label="Tutup notifikasi"
		>
			<X className="w-4 h-4" />
		</button>
	</motion.div>
);

export default Toast;
