import { motion } from "framer-motion";
import { CheckCircle, AlertCircle, X } from "lucide-react";

const Toast = ({ message, type, onClose }) => (
	<motion.div
		initial={{ opacity: 0, y: 50 }}
		animate={{ opacity: 1, y: 0 }}
		exit={{ opacity: 0, y: 50 }}
		className={`fixed bottom-4 right-4 p-4 rounded-xl shadow-lg border flex items-center space-x-2.5 text-white z-50 text-sm font-medium ${
			type === "success"
				? "bg-emerald-600 border-emerald-700"
				: "bg-rose-600 border-rose-700"
		}`}
	>
		{type === "success" ? (
			<CheckCircle className="w-5 h-5 shrink-0" />
		) : (
			<AlertCircle className="w-5 h-5 shrink-0" />
		)}
		<span>{message}</span>
		<button
			type="button"
			onClick={onClose}
			className="ml-2 p-1 hover:bg-white/20 rounded-md transition-colors"
			aria-label="Tutup notifikasi"
		>
			<X className="w-4 h-4" />
		</button>
	</motion.div>
);

export default Toast;
