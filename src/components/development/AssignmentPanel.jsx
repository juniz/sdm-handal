"use client";

import { useState, useEffect } from "react";
import {
	UserPlus,
	User,
	Clock,
	FileText,
	Loader2,
	Shield,
	CheckCircle,
	AlertTriangle,
} from "lucide-react";
import { isITUser } from "@/lib/development-helper";
import { DatePicker } from "@/components/ui/date-picker";

export default function AssignmentPanel({
	request,
	user,
	onAssignmentAction,
	isLoading = false,
}) {
	const [showAssignmentForm, setShowAssignmentForm] = useState(false);
	const [developers, setDevelopers] = useState([]);
	const [currentAssignment, setCurrentAssignment] = useState(null);
	const [selectedDeveloper, setSelectedDeveloper] = useState("");
	const [assignmentNotes, setAssignmentNotes] = useState("");
	const [estimatedHours, setEstimatedHours] = useState("");
	const [estimatedCompletionDate, setEstimatedCompletionDate] = useState(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isLoadingData, setIsLoadingData] = useState(false);

	// Check if user is from IT department
	const isUserFromIT = isITUser(user);

	// Check if request can be assigned (Approved or development statuses for re-assignment)
	const assignableStatuses = [
		"Approved",
		"Assigned",
		"In Development",
		"Development Complete",
		"In Testing",
		"Bug Found",
	];

	const canAssign =
		request && assignableStatuses.includes(request.current_status);

	// Check if request is already assigned (for UI display purposes)
	const isAssigned =
		request &&
		[
			"Assigned",
			"In Development",
			"Development Complete",
			"In Testing",
			"Testing Complete",
			"In Deployment",
			"UAT",
			"Completed",
		].includes(request.current_status);

	// Fetch developers and current assignment
	const fetchAssignmentData = async () => {
		if (!request) return;

		setIsLoadingData(true);
		try {
			const response = await fetch(
				`/api/development/${request.request_id}/assign`
			);
			const result = await response.json();

			if (response.ok) {
				setDevelopers(result.data.developers || []);
				setCurrentAssignment(result.data.current_assignment);
				if (result.data.current_assignment) {
					setSelectedDeveloper(result.data.current_assignment.assigned_to);
					setAssignmentNotes(
						result.data.current_assignment.assignment_notes || ""
					);
					setEstimatedHours(
						result.data.current_assignment.estimated_hours || ""
					);
					// Set estimated completion date if available
					if (result.data.current_assignment.estimated_completion_date) {
						const date = new Date(
							result.data.current_assignment.estimated_completion_date
						);
						setEstimatedCompletionDate(date);
					}
				}
			}
		} catch (error) {
			console.error("Error fetching assignment data:", error);
		} finally {
			setIsLoadingData(false);
		}
	};

	useEffect(() => {
		if (request && isUserFromIT && (canAssign || isAssigned)) {
			fetchAssignmentData();
		}
	}, [request?.request_id, isUserFromIT]);

	const handleAssignClick = () => {
		setShowAssignmentForm(true);
		if (!currentAssignment) {
			setSelectedDeveloper("");
			setAssignmentNotes("");
			setEstimatedHours("");
			setEstimatedCompletionDate(null);
		}
	};

	const handleSubmitAssignment = async () => {
		if (!selectedDeveloper) {
			alert("Developer harus dipilih");
			return;
		}

		setIsSubmitting(true);
		try {
			await onAssignmentAction({
				assigned_to: selectedDeveloper,
				assignment_notes: assignmentNotes.trim(),
				estimated_completion_date: estimatedCompletionDate
					? estimatedCompletionDate.toISOString().split("T")[0]
					: null,
			});

			setShowAssignmentForm(false);
			await fetchAssignmentData(); // Refresh data
		} catch (error) {
			console.error("Error in assignment:", error);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleCancel = () => {
		setShowAssignmentForm(false);
		// Reset to current assignment data
		if (currentAssignment) {
			setSelectedDeveloper(currentAssignment.assigned_to);
			setAssignmentNotes(currentAssignment.assignment_notes || "");
			setEstimatedHours(currentAssignment.estimated_hours || "");
			if (currentAssignment.estimated_completion_date) {
				const date = new Date(currentAssignment.estimated_completion_date);
				setEstimatedCompletionDate(date);
			} else {
				setEstimatedCompletionDate(null);
			}
		} else {
			setSelectedDeveloper("");
			setAssignmentNotes("");
			setEstimatedHours("");
			setEstimatedCompletionDate(null);
		}
	};

	// Don't show panel if user is not IT
	if (!isUserFromIT) {
		return null;
	}

	// Don't show if request can't be assigned and is not already assigned
	if (!canAssign && !isAssigned) {
		return null;
	}

	return (
		<div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
			<div className="flex items-center gap-3 mb-4">
				<Shield className="w-6 h-6 text-blue-600" />
				<h3 className="text-lg font-semibold text-gray-900">
					Assignment Panel - IT Manager
				</h3>
			</div>

			{isLoadingData ? (
				<div className="flex items-center justify-center py-8">
					<Loader2 className="w-6 h-6 animate-spin text-blue-600" />
					<span className="ml-2 text-gray-600">Loading assignment data...</span>
				</div>
			) : !showAssignmentForm ? (
				<div className="space-y-4">
					{/* Current Assignment Status */}
					{currentAssignment ? (
						<div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
							<CheckCircle className="w-5 h-5 text-green-600" />
							<span className="text-sm text-green-800">
								Request sudah di-assign ke{" "}
								<strong>{currentAssignment.assigned_to_name}</strong>
								{currentAssignment.estimated_hours && (
									<span>
										{" "}
										(Estimasi: {currentAssignment.estimated_hours} jam)
									</span>
								)}
							</span>
						</div>
					) : canAssign ? (
						<div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
							<AlertTriangle className="w-5 h-5 text-yellow-600" />
							<span className="text-sm text-yellow-800">
								{request.current_status === "Approved"
									? "Request sudah approved dan siap untuk di-assign ke developer"
									: "Request dapat di-assign ulang ke developer lain atau developer yang sama"}
							</span>
						</div>
					) : null}

					{/* Assignment Actions */}
					<div className="flex gap-3">
						{canAssign || isAssigned ? (
							<button
								onClick={handleAssignClick}
								disabled={isLoading}
								className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
							>
								<UserPlus className="w-5 h-5" />
								<span>
									{currentAssignment
										? "Re-assign Developer"
										: "Assign Developer"}
								</span>
							</button>
						) : null}
					</div>

					{/* Current Assignment Details */}
					{currentAssignment && (
						<div className="mt-4 p-4 bg-gray-50 rounded-lg">
							<h4 className="text-sm font-medium text-gray-900 mb-3">
								Detail Assignment
							</h4>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
								<div>
									<span className="text-gray-600">Developer:</span>
									<p className="font-medium">
										{currentAssignment.assigned_to_name}
									</p>
								</div>
								<div>
									<span className="text-gray-600">Tanggal Assignment:</span>
									<p className="font-medium">
										{new Date(
											currentAssignment.assignment_date
										).toLocaleDateString("id-ID")}
									</p>
								</div>
								{currentAssignment.estimated_hours && (
									<div>
										<span className="text-gray-600">Estimasi Waktu:</span>
										<p className="font-medium">
											{currentAssignment.estimated_hours} jam
										</p>
									</div>
								)}
								{currentAssignment.estimated_completion_date && (
									<div>
										<span className="text-gray-600">Target Selesai:</span>
										<p className="font-medium">
											{new Date(
												currentAssignment.estimated_completion_date
											).toLocaleDateString("id-ID")}
										</p>
									</div>
								)}
								{currentAssignment.assignment_notes && (
									<div className="md:col-span-2">
										<span className="text-gray-600">Catatan:</span>
										<p className="font-medium">
											{currentAssignment.assignment_notes}
										</p>
									</div>
								)}
							</div>
						</div>
					)}
				</div>
			) : (
				<div className="space-y-4">
					<div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
						<User className="w-5 h-5 text-blue-600" />
						<span className="text-sm text-blue-800">
							{currentAssignment ? "Re-assign" : "Assign"} request:{" "}
							{request.title}
						</span>
					</div>

					{/* Developer Selection */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Pilih Developer <span className="text-red-500">*</span>
						</label>
						<select
							value={selectedDeveloper}
							onChange={(e) => setSelectedDeveloper(e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
							required
						>
							<option value="">-- Pilih Developer --</option>
							{developers.map((dev) => (
								<option key={dev.nik} value={dev.nik}>
									{dev.nama} - {dev.jabatan}
								</option>
							))}
						</select>
					</div>

					{/* Estimated Completion Date */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Target Tanggal Selesai
						</label>
						<DatePicker
							value={estimatedCompletionDate}
							onChange={setEstimatedCompletionDate}
							placeholder="Pilih target tanggal selesai..."
							disabled={isSubmitting}
						/>
						<p className="text-xs text-gray-500 mt-1">
							Estimasi jam kerja akan dihitung otomatis berdasarkan hari kerja
							(8 jam/hari, Senin-Jumat)
						</p>
					</div>

					{/* Assignment Notes */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Catatan Assignment
						</label>
						<textarea
							value={assignmentNotes}
							onChange={(e) => setAssignmentNotes(e.target.value)}
							placeholder="Tambahkan catatan khusus untuk developer..."
							className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
							rows={3}
						/>
					</div>

					{/* Action Buttons */}
					<div className="flex gap-3">
						<button
							onClick={handleSubmitAssignment}
							disabled={isSubmitting || !selectedDeveloper}
							className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						>
							{isSubmitting ? (
								<Loader2 className="w-5 h-5 animate-spin" />
							) : (
								<UserPlus className="w-5 h-5" />
							)}
							<span>
								{isSubmitting
									? "Memproses..."
									: currentAssignment
									? "Re-assign"
									: "Assign"}
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

					{!selectedDeveloper && (
						<div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
							<AlertTriangle className="w-5 h-5 text-red-600" />
							<span className="text-sm text-red-800">
								Developer harus dipilih
							</span>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
