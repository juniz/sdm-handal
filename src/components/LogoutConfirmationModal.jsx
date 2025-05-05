import { LogOut } from "lucide-react";
import {
	Modal,
	ModalContent,
	ModalHeader,
	ModalFooter,
	ModalTitle,
	ModalDescription,
} from "./ui/modal";

export function LogoutConfirmationModal({ isOpen, onClose, onConfirm }) {
	return (
		<Modal open={isOpen} onClose={onClose}>
			<ModalContent>
				<ModalHeader>
					<div className="flex items-center justify-center mb-6">
						<div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
							<LogOut className="h-6 w-6 text-red-600" />
						</div>
					</div>
					<ModalTitle className="text-center text-xl">
						Konfirmasi Keluar
					</ModalTitle>
					<ModalDescription className="text-center mt-2">
						Apakah Anda yakin ingin keluar dari sistem?
						<br />
						Anda perlu login kembali untuk mengakses sistem.
					</ModalDescription>
				</ModalHeader>
				<ModalFooter className="mt-6 space-y-2 sm:space-y-0">
					<button
						onClick={onClose}
						className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 rounded-md transition-colors"
					>
						Batal
					</button>
					<button
						onClick={onConfirm}
						className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-md transition-colors"
					>
						Ya, Keluar
					</button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}
