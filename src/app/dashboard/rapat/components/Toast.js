"use client";

import { motion } from "framer-motion";
import { CheckCircle, AlertCircle, X } from "lucide-react";

const Toast = ({ message, type, onClose }) => (
	<motion.div
		initial={{ opacity: 0, y: 50 }}
		animate={{ opacity: 1, y: 0 }}
		exit={{ opacity: 0, y: 50 }}
		className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg flex items-center space-x-2 ${
			type === "success" ? "bg-green-500" : "bg-red-500"
		} text-white z-50`}
	>
		{type === "success" ? (
			<CheckCircle className="w-5 h-5" />
		) : (
			<AlertCircle className="w-5 h-5" />
		)}
		<span>{message}</span>
		<button onClick={onClose} className="ml-2">
			<X className="w-4 h-4" />
		</button>
	</motion.div>
);

export default Toast;
