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
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Check if user is from IT department
	const isUserFromIT = isITUser(user);

	// Check if request can be approved/rejected
	const canApprove = canApproveRequest(request);

	const handleApprovalAction = async (selectedAction) => {
		setAction(selectedAction);
		setShowApprovalForm(true);
		setReason("");
	};

	const handleSubmitApproval = async () => {
		// Use validation helper
		const validation = validateApprovalAction(action, reason);

		if (!validation.isValid) {
			alert(Object.values(validation.errors).join(", "));
			return;
		}

		setIsSubmitting(true);
		try {
			await onApprovalAction(action, reason.trim());
			setShowApprovalForm(false);
			setAction("");
			setReason("");
		} catch (error) {
			console.error("Error in approval:", error);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleCancel = () => {
		setShowApprovalForm(false);
		setAction("");
		setReason("");
	};

	// Don't show panel if user is not IT or request cannot be approved
	if (!isUserFromIT || !canApprove) {
		return null;
	}

	return (
		<div className="bg-white rounded-lg border border-gray-200 p-6">
			<div className="flex items-center gap-3 mb-4">
				<Shield className="w-6 h-6 text-blue-600" />
				<h3 className="text-lg font-semibold text-gray-900">
					Approval Panel - IT Manager
				</h3>
			</div>

			{!showApprovalForm ? (
				<div className="space-y-4">
					<div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
						<Clock className="w-5 h-5 text-yellow-600" />
						<span className="text-sm text-yellow-800">
							Pengajuan ini menunggu approval dari IT Manager
						</span>
					</div>

					<div className="flex gap-3">
						<button
							onClick={() => handleApprovalAction("approve")}
							disabled={isLoading}
							className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						>
							<CheckCircle className="w-5 h-5" />
							<span>Setujui</span>
						</button>

						<button
							onClick={() => handleApprovalAction("reject")}
							disabled={isLoading}
							className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						>
							<XCircle className="w-5 h-5" />
							<span>Tolak</span>
						</button>
					</div>
				</div>
			) : (
				<div className="space-y-4">
					<div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
						<MessageSquare className="w-5 h-5 text-blue-600" />
						<span className="text-sm text-blue-800">
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
							onChange={(e) => setReason(e.target.value)}
							placeholder={
								action === "approve"
									? "Tambahkan catatan persetujuan..."
									: "Jelaskan alasan penolakan pengajuan ini..."
							}
							className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
							rows={4}
							required={action === "reject"}
						/>
					</div>

					<div className="flex gap-3">
						<button
							onClick={handleSubmitApproval}
							disabled={isSubmitting || (action === "reject" && !reason.trim())}
							className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
								action === "approve"
									? "bg-green-600 hover:bg-green-700"
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
							className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						>
							<span>Batal</span>
						</button>
					</div>

					{action === "reject" && !reason.trim() && (
						<div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
							<AlertTriangle className="w-5 h-5 text-red-600" />
							<span className="text-sm text-red-800">
								Alasan penolakan harus diisi
							</span>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
