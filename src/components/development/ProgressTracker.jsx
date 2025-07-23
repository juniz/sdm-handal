"use client";

import { useState, useEffect } from "react";
import {
	TrendingUp,
	Target,
	Clock,
	PlayCircle,
	CheckCircle,
	AlertTriangle,
	Loader2,
	Activity,
	GitBranch,
	MessageSquare,
} from "lucide-react";
import { isITUser } from "@/lib/development-helper";

export default function ProgressTracker({
	request,
	user,
	onProgressUpdate,
	isLoading = false,
}) {
	const [showProgressForm, setShowProgressForm] = useState(false);
	const [progressHistory, setProgressHistory] = useState([]);
	const [currentProgress, setCurrentProgress] = useState(null);
	const [progressPercentage, setProgressPercentage] = useState(0);
	const [progressDescription, setProgressDescription] = useState("");
	const [milestone, setMilestone] = useState("");
	const [newStatus, setNewStatus] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isLoadingData, setIsLoadingData] = useState(false);

	// Check if user is from IT department or assigned developer
	const isUserFromIT = isITUser(user);
	const isAssignedDeveloper = request?.assigned_developer === user?.nik;

	// Check if user can update progress
	const canUpdateProgress = isUserFromIT || isAssignedDeveloper;

	// Check if request can have progress updated
	const canHaveProgress =
		request &&
		[
			"Assigned",
			"In Development",
			"Development Complete",
			"In Testing",
			"Bug Found",
		].includes(request.current_status);

	// Available status options based on current status
	const getStatusOptions = () => {
		const statusOptions = {
			Assigned: ["In Development"],
			"In Development": ["Development Complete", "Bug Found"],
			"Development Complete": ["In Testing"],
			"In Testing": ["Testing Complete", "Bug Found"],
			"Bug Found": ["In Development"],
		};
		return statusOptions[request?.current_status] || [];
	};

	// Fetch progress data
	const fetchProgressData = async () => {
		if (!request) return;

		setIsLoadingData(true);
		try {
			const response = await fetch(
				`/api/development/${request.request_id}/progress`
			);
			const result = await response.json();

			if (response.ok) {
				setProgressHistory(result.data.progress_history || []);
				setCurrentProgress(result.data.current_progress);
				if (result.data.current_progress) {
					setProgressPercentage(
						result.data.current_progress.progress_percentage || 0
					);
				}
			}
		} catch (error) {
			console.error("Error fetching progress data:", error);
		} finally {
			setIsLoadingData(false);
		}
	};

	useEffect(() => {
		if (request && canUpdateProgress && canHaveProgress) {
			fetchProgressData();
		}
	}, [request?.request_id, canUpdateProgress]);

	const handleProgressClick = () => {
		setShowProgressForm(true);
		setProgressDescription("");
		setMilestone("");
		setNewStatus("");
	};

	const handleSubmitProgress = async () => {
		if (progressPercentage < 0 || progressPercentage > 100) {
			alert("Progress harus antara 0-100%");
			return;
		}

		setIsSubmitting(true);
		try {
			await onProgressUpdate({
				progress_percentage: progressPercentage,
				progress_description: progressDescription.trim(),
				milestone: milestone.trim(),
				new_status: newStatus || undefined,
			});

			setShowProgressForm(false);
			await fetchProgressData(); // Refresh data
		} catch (error) {
			console.error("Error in progress update:", error);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleCancel = () => {
		setShowProgressForm(false);
		// Reset to current progress
		setProgressPercentage(currentProgress?.progress_percentage || 0);
		setProgressDescription("");
		setMilestone("");
		setNewStatus("");
	};

	// Don't show panel if user can't update progress
	if (!canUpdateProgress) {
		return null;
	}

	// Don't show if request can't have progress
	if (!canHaveProgress) {
		return null;
	}

	return (
		<div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
			<div className="flex items-center gap-3 mb-4">
				<TrendingUp className="w-6 h-6 text-green-600" />
				<h3 className="text-lg font-semibold text-gray-900">
					Progress Tracking
					{isAssignedDeveloper && (
						<span className="text-sm text-green-600 ml-2">
							(Anda adalah developer yang di-assign)
						</span>
					)}
				</h3>
			</div>

			{isLoadingData ? (
				<div className="flex items-center justify-center py-8">
					<Loader2 className="w-6 h-6 animate-spin text-green-600" />
					<span className="ml-2 text-gray-600">Loading progress data...</span>
				</div>
			) : (
				<div className="space-y-6">
					{/* Current Progress Display */}
					<div className="p-4 bg-gray-50 rounded-lg">
						<div className="flex items-center justify-between mb-3">
							<h4 className="text-sm font-medium text-gray-900">
								Progress Saat Ini
							</h4>
							<span className="text-2xl font-bold text-green-600">
								{currentProgress?.progress_percentage || 0}%
							</span>
						</div>

						{/* Progress Bar */}
						<div className="w-full bg-gray-200 rounded-full h-3 mb-3">
							<div
								className="bg-green-600 h-3 rounded-full transition-all duration-300"
								style={{
									width: `${currentProgress?.progress_percentage || 0}%`,
								}}
							/>
						</div>

						{currentProgress && (
							<div className="text-sm text-gray-600">
								<p>
									Terakhir diupdate oleh:{" "}
									<strong>{currentProgress.updated_by_name}</strong>
								</p>
								<p>
									Tanggal:{" "}
									{new Date(currentProgress.update_date).toLocaleString(
										"id-ID"
									)}
								</p>
								{currentProgress.milestone && (
									<p>
										Milestone: <strong>{currentProgress.milestone}</strong>
									</p>
								)}
								{currentProgress.progress_description && (
									<p className="mt-2">{currentProgress.progress_description}</p>
								)}
							</div>
						)}
					</div>

					{/* Update Progress Form */}
					{!showProgressForm ? (
						<div className="flex gap-3">
							<button
								onClick={handleProgressClick}
								disabled={isLoading}
								className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
							>
								<PlayCircle className="w-5 h-5" />
								<span>Update Progress</span>
							</button>
						</div>
					) : (
						<div className="space-y-4 p-4 border border-green-200 rounded-lg bg-green-50">
							<div className="flex items-center gap-2 p-3 bg-green-100 border border-green-300 rounded-lg">
								<Activity className="w-5 h-5 text-green-600" />
								<span className="text-sm text-green-800">
									Update progress untuk: {request.title}
								</span>
							</div>

							{/* Progress Percentage */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Progress Percentage (0-100%){" "}
									<span className="text-red-500">*</span>
								</label>
								<div className="flex items-center gap-3">
									<input
										type="range"
										min="0"
										max="100"
										value={progressPercentage}
										onChange={(e) =>
											setProgressPercentage(parseInt(e.target.value))
										}
										className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
										style={{
											background: `linear-gradient(to right, #16a34a 0%, #16a34a ${progressPercentage}%, #e5e7eb ${progressPercentage}%, #e5e7eb 100%)`,
										}}
									/>
									<input
										type="number"
										min="0"
										max="100"
										value={progressPercentage}
										onChange={(e) =>
											setProgressPercentage(parseInt(e.target.value) || 0)
										}
										className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
									/>
									<span className="text-sm text-gray-600">%</span>
								</div>
							</div>

							{/* Milestone */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Milestone
								</label>
								<input
									type="text"
									value={milestone}
									onChange={(e) => setMilestone(e.target.value)}
									placeholder="Contoh: API Integration Complete, Database Setup Done"
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
								/>
							</div>

							{/* Progress Description */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Deskripsi Progress
								</label>
								<textarea
									value={progressDescription}
									onChange={(e) => setProgressDescription(e.target.value)}
									placeholder="Jelaskan progress yang telah dicapai..."
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
									rows={3}
								/>
							</div>

							{/* Status Update */}
							{getStatusOptions().length > 0 && (
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Update Status (Opsional)
									</label>
									<select
										value={newStatus}
										onChange={(e) => setNewStatus(e.target.value)}
										className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
									>
										<option value="">-- Tetap di status saat ini --</option>
										{getStatusOptions().map((status) => (
											<option key={status} value={status}>
												{status}
											</option>
										))}
									</select>
								</div>
							)}

							{/* Action Buttons */}
							<div className="flex gap-3">
								<button
									onClick={handleSubmitProgress}
									disabled={isSubmitting}
									className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
								>
									{isSubmitting ? (
										<Loader2 className="w-5 h-5 animate-spin" />
									) : (
										<CheckCircle className="w-5 h-5" />
									)}
									<span>
										{isSubmitting ? "Memproses..." : "Update Progress"}
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
						</div>
					)}

					{/* Progress History */}
					{progressHistory.length > 0 && (
						<div className="space-y-4">
							<h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
								<GitBranch className="w-4 h-4" />
								Riwayat Progress
							</h4>
							<div className="space-y-3 max-h-60 overflow-y-auto">
								{progressHistory.map((progress, index) => (
									<div
										key={progress.progress_id}
										className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg border-l-4 border-green-500"
									>
										<div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
											<Target className="w-4 h-4 text-green-600" />
										</div>
										<div className="flex-1">
											<div className="flex items-center gap-2 mb-1">
												<span className="font-medium text-gray-900">
													{progress.progress_percentage}%
												</span>
												{progress.milestone && (
													<span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
														{progress.milestone}
													</span>
												)}
											</div>
											<p className="text-sm text-gray-600">
												oleh {progress.updated_by_name} •{" "}
												{new Date(progress.update_date).toLocaleString("id-ID")}
											</p>
											{progress.progress_description && (
												<p className="text-sm text-gray-700 mt-2">
													{progress.progress_description}
												</p>
											)}
										</div>
									</div>
								))}
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
