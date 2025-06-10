"use client";

import { useState, useCallback } from "react";

const useToast = () => {
	const [toasts, setToasts] = useState([]);

	const toast = useCallback(({ title, description, variant = "default" }) => {
		const id = Date.now();
		const newToast = { id, title, description, variant };

		setToasts((prev) => [...prev, newToast]);

		// Show browser notification or alert as fallback
		if (title && description) {
			if (variant === "destructive") {
				alert(`Error: ${title}\n${description}`);
			} else {
				alert(`${title}\n${description}`);
			}
		}

		// Auto remove after 3 seconds
		setTimeout(() => {
			setToasts((prev) => prev.filter((t) => t.id !== id));
		}, 3000);
	}, []);

	return { toast, toasts };
};

export { useToast };
