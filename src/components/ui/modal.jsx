import * as React from "react";
import * as Portal from "@radix-ui/react-portal";
import { motion, AnimatePresence } from "framer-motion";

const Modal = React.forwardRef(({ open, onClose, children, ...props }, ref) => {
	return (
		<AnimatePresence>
			{open && (
				<Portal.Root>
					<div className="fixed inset-0 z-50 flex items-center justify-center">
						{/* Backdrop */}
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							onClick={onClose}
							className="absolute inset-0 bg-black/50 backdrop-blur-sm"
						/>

						{/* Modal Content */}
						<motion.div
							ref={ref}
							initial={{ scale: 0.95, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							exit={{ scale: 0.95, opacity: 0 }}
							transition={{ duration: 0.2 }}
							className="relative z-50 w-full max-w-md overflow-hidden rounded-lg bg-white shadow-xl"
							{...props}
						>
							{children}
						</motion.div>
					</div>
				</Portal.Root>
			)}
		</AnimatePresence>
	);
});
Modal.displayName = "Modal";

const ModalContent = React.forwardRef(({ className, ...props }, ref) => (
	<div ref={ref} className={`p-6 ${className}`} {...props} />
));
ModalContent.displayName = "ModalContent";

const ModalHeader = React.forwardRef(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={`space-y-1.5 text-center sm:text-left ${className}`}
		{...props}
	/>
));
ModalHeader.displayName = "ModalHeader";

const ModalFooter = React.forwardRef(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 ${className}`}
		{...props}
	/>
));
ModalFooter.displayName = "ModalFooter";

const ModalTitle = React.forwardRef(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={`text-lg font-semibold leading-none tracking-tight ${className}`}
		{...props}
	/>
));
ModalTitle.displayName = "ModalTitle";

const ModalDescription = React.forwardRef(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={`text-sm text-muted-foreground ${className}`}
		{...props}
	/>
));
ModalDescription.displayName = "ModalDescription";

export {
	Modal,
	ModalContent,
	ModalHeader,
	ModalFooter,
	ModalTitle,
	ModalDescription,
};
