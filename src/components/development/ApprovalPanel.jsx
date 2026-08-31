"use client";

import { useState } from "react";
import {
	CheckCircle,
	XCircle,
	AlertTriangle,
	MessageSquare,
	Loader2,
	Shield,
	Clock,
} from "lucide-react";
import {
	isITUser,
	canApproveRequest,
	validateApprovalAction,
} from "@/lib/development-helper";

export default function ApprovalPanel({
	request,
	user,
	onApprovalAction,
	isLoading = false,
}) {
	const [showApprovalForm, setShowApprovalForm] = useState(false);
	const [action, setAction] = useState(""); // 'approve' or 'reject'
	const [reason, setReason] = useState("");
	const [validationError, setValidationError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Check if user is from IT department
	const isUserFromIT = isITUser(user);

	// Check if request can be approved/rejected
	const canApprove = canApproveRequest(request);

	const handleApprovalAction = async (selectedAction) => {
		setAction(selectedAction);
		setShowApprovalForm(true);
		setReason("");
		setValidationError("");
	};

	const handleSubmitApproval = async () => {
		// Use validation helper
		const validation = validateApprovalAction(action, reason);

		if (!validation.isValid) {
			setValidationError(Object.values(validation.errors).join(", "));
			return;
		}

		setIsSubmitting(true);
		setValidationError("");
		try {
			await onApprovalAction(action, reason.trim());
			setShowApprovalForm(false);
			setAction("");
			setReason("");
		} catch (error) {
			console.error("Error in approval:", error);
			setValidationError(error.message || "Terjadi kesalahan saat memproses approval");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleCancel = () => {
		setShowApprovalForm(false);
		setAction("");
		setReason("");
		setValidationError("");
	};

	// Don't show panel if user is not IT or request cannot be approved
	if (!isUserFromIT || !canApprove) {
		return null;
	}

	return (
		<div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
			<div className="flex items-center gap-3 mb-4">
				<Shield className="w-6 h-6 text-sky-600" />
				<h3 className="text-lg font-semibold text-gray-900">
					Approval Panel - IT Manager
				</h3>
			</div>

			{!showApprovalForm ? (
				<div className="space-y-4">
					<div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
						<Clock className="w-5 h-5 text-amber-600" />
						<span className="text-sm text-amber-800 font-medium">
							Pengajuan ini menunggu approval dari IT Manager
						</span>
					</div>

					<div className="flex gap-3">
						<button
							onClick={() => handleApprovalAction("approve")}
							disabled={isLoading}
							className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm shadow-sm"
						>
							<CheckCircle className="w-5 h-5" />
							<span>Setujui</span>
						</button>

						<button
							onClick={() => handleApprovalAction("reject")}
							disabled={isLoading}
							className="flex items-center gap-2 px-4 py-2 bg-white border border-red-300 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
						>
							<XCircle className="w-5 h-5" />
							<span>Tolak</span>
						</button>
					</div>
				</div>
			) : (
				<div className="space-y-4">
					<div className="flex items-center gap-2 p-3 bg-sky-50 border border-sky-200 rounded-lg">
						<MessageSquare className="w-5 h-5 text-sky-600" />
						<span className="text-sm text-sky-900 font-medium">
							{action === "approve" ? "Menyetujui" : "Menolak"} pengajuan:{" "}
							{request.title}
						</span>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							{action === "approve"
								? "Catatan Persetujuan (Opsional)"
								: "Alasan Penolakan (Wajib)"}
						</label>
						<textarea
							value={reason}
							onChange={(e) => {
								setReason(e.target.value);
								if (validationError) setValidationError("");
							}}
							placeholder={
								action === "approve"
									? "Tambahkan catatan persetujuan..."
									: "Jelaskan alasan penolakan pengajuan ini..."
							}
							className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none text-sm"
							rows={4}
							required={action === "reject"}
						/>
					</div>

					{validationError && (
						<div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
							<AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
							<span className="text-sm text-red-800">
								{validationError}
							</span>
						</div>
					)}

					<div className="flex gap-3">
						<button
							onClick={handleSubmitApproval}
							disabled={isSubmitting || (action === "reject" && !reason.trim())}
							className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium shadow-sm ${
								action === "approve"
									? "bg-emerald-600 hover:bg-emerald-700"
									: "bg-red-600 hover:bg-red-700"
							}`}
						>
							{isSubmitting ? (
								<Loader2 className="w-5 h-5 animate-spin" />
							) : action === "approve" ? (
								<CheckCircle className="w-5 h-5" />
							) : (
								<XCircle className="w-5 h-5" />
							)}
							<span>
								{isSubmitting
									? "Memproses..."
									: action === "approve"
									? "Setujui"
									: "Tolak"}
							</span>
						</button>

						<button
							onClick={handleCancel}
							disabled={isSubmitting}
							className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
						>
							<span>Batal</span>
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
