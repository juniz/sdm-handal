"use client";

import React, { useState, useEffect } from "react";
import { TrendingUp, Loader2, PlayCircle, CheckCircle } from "lucide-react";
import { getClientToken } from "@/lib/client-auth";

export default function ProgressTracker({
	request,
	user,
	onProgressUpdate,
	isLoading: parentLoading,
}) {
	const [progressData, setProgressData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [updating, setUpdating] = useState(false);
	const [formData, setFormData] = useState({
		progress_percentage: 0,
		progress_description: "",
	});

	const isUserFromIT =
		user?.departement_id?.toUpperCase() === "IT" ||
		user?.departemen?.toUpperCase() === "IT";

	// Use username if nik is not available
	const userIdentifier = user?.nik || user?.username || user?.id;
	const isAssignedDeveloper = request?.assigned_developer === userIdentifier;
	const canUpdateProgress = isUserFromIT || isAssignedDeveloper;
	const canHaveProgress = [
		"Assigned",
		"In Development",
		"Development Complete",
		"In Testing",
		"Testing Complete",
		"In Deployment",
		"UAT",
	].includes(request?.current_status);

	useEffect(() => {
		if (request?.request_id) {
			fetchProgress();
		}
	}, [request?.request_id]);

	const fetchProgress = async () => {
		try {
			setLoading(true);
			// Get authentication token
			const token = getClientToken();

			const headers = {};
			if (token) {
				headers["Authorization"] = `Bearer ${token}`;
			}

			const response = await fetch(
				`/api/development/${request.request_id}/progress`,
				{ headers }
			);
			const data = await response.json();

			if (response.ok) {
				setProgressData(data.data);
				// Set minimum progress value from current progress
				const currentProgress = data.data?.current_progress || 0;
				setFormData((prev) => ({
					...prev,
					progress_percentage: Math.max(
						currentProgress,
						prev.progress_percentage
					),
				}));
			} else {
				console.error("Failed to fetch progress:", data.error);
			}
		} catch (error) {
			console.error("Error fetching progress:", error);
		} finally {
			setLoading(false);
		}
	};

	const [feedback, setFeedback] = useState(null);

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!canUpdateProgress || updating) return; // Prevent double submission

		try {
			setUpdating(true);
			setFeedback(null);
			// Get authentication token
			const token = getClientToken();

			const headers = {
				"Content-Type": "application/json",
			};

			if (token) {
				headers["Authorization"] = `Bearer ${token}`;
			}

			const response = await fetch(
				`/api/development/${request.request_id}/progress`,
				{
					method: "POST",
					headers,
					body: JSON.stringify(formData),
				}
			);

			const data = await response.json();

			if (response.ok) {
				// Reset form but keep the new progress as minimum
				setFormData({
					progress_percentage: formData.progress_percentage,
					progress_description: "",
				});

				// Refresh progress data
				await fetchProgress();

				// Call parent callback if provided (without duplicating API call)
				if (onProgressUpdate) {
					try {
						onProgressUpdate({
							...formData,
							success: true,
							message: data.message,
						});
					} catch (error) {
						console.error("Error in parent progress update callback:", error);
					}
				}

				setFeedback({ type: "success", message: "Progress berhasil diperbarui!" });
				setTimeout(() => setFeedback(null), 4000);
			} else {
				console.error("Failed to update progress:", data.error);
				setFeedback({
					type: "error",
					message: "Gagal mengupdate progress: " + (data.error || "Unknown error"),
				});
			}
		} catch (error) {
			console.error("Error updating progress:", error);
			setFeedback({
				type: "error",
				message: "Terjadi kesalahan saat mengupdate progress",
			});
		} finally {
			setUpdating(false);
		}
	};

	// Don't render if parent is still loading or essential data is missing
	if (parentLoading || !request || !user) {
		return (
			<div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
				<div className="flex items-center gap-3 mb-4">
					<TrendingUp className="w-5 h-5 text-sky-600" />
					<h3 className="text-lg font-semibold text-gray-900">
						Progress Pengembangan
					</h3>
					<Loader2 className="w-4 h-4 animate-spin text-gray-500" />
				</div>
				<div className="text-gray-600 text-sm">Memuat data...</div>
			</div>
		);
	}

	if (!canHaveProgress) {
		return null;
	}

	if (loading) {
		return (
			<div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
				<div className="flex items-center gap-3 mb-4">
					<TrendingUp className="w-5 h-5 text-sky-600" />
					<h3 className="text-lg font-semibold text-gray-900">
						Progress Pengembangan
					</h3>
					<Loader2 className="w-4 h-4 animate-spin text-gray-500" />
				</div>
				<div className="text-gray-600 text-sm">Memuat data progress...</div>
			</div>
		);
	}

	const currentProgress = progressData?.current_progress || 0;

	return (
		<div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
			<div className="flex items-center gap-3 mb-4">
				<TrendingUp className="w-5 h-5 text-sky-600" />
				<h3 className="text-lg font-semibold text-gray-900">
					Progress Pengembangan
				</h3>
			</div>

			{/* Current Progress */}
			<div className="mb-6">
				<div className="flex items-center justify-between text-sm text-gray-600 mb-2">
					<span>Progress Saat Ini</span>
					<span className="font-semibold text-sky-700">{currentProgress}%</span>
				</div>
				<div className="w-full bg-slate-100 rounded-full h-3">
					<div
						className="bg-sky-600 h-3 rounded-full transition-all duration-300"
						style={{ width: `${currentProgress}%` }}
					/>
				</div>
			</div>

			{feedback && (
				<div
					className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm font-medium ${
						feedback.type === "success"
							? "bg-emerald-50 text-emerald-800 border border-emerald-200"
							: "bg-red-50 text-red-800 border border-red-200"
					}`}
				>
					{feedback.type === "success" ? (
						<CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
					) : (
						<Loader2 className="w-4 h-4 text-red-600 flex-shrink-0" />
					)}
					<span>{feedback.message}</span>
				</div>
			)}

			{/* Update Progress Form */}
			{canUpdateProgress && (
				<form onSubmit={handleSubmit} className="space-y-4 mb-6">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Persentase Progress (Minimal: {currentProgress}%)
						</label>
						<div className="space-y-3">
							<div className="flex items-center gap-3">
								<input
									type="range"
									min={currentProgress}
									max="100"
									value={formData.progress_percentage}
									onChange={(e) =>
										setFormData({
											...formData,
											progress_percentage: parseInt(e.target.value),
										})
									}
									className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
									style={{
										background: `linear-gradient(to right, #0284c7 0%, #0284c7 ${formData.progress_percentage}%, #e2e8f0 ${formData.progress_percentage}%, #e2e8f0 100%)`,
									}}
								/>
								<input
									type="number"
									min={currentProgress}
									max="100"
									value={formData.progress_percentage}
									onChange={(e) =>
										setFormData({
											...formData,
											progress_percentage:
												parseInt(e.target.value) || currentProgress,
										})
									}
									className="w-20 px-2 py-1 border border-gray-300 rounded text-center text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
								/>
								<span className="text-sm text-gray-600 font-medium">%</span>
							</div>
							<div className="text-xs text-gray-500">
								Progress tidak bisa dikurangi dari nilai saat ini (
								{currentProgress}%)
							</div>
						</div>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Deskripsi Progress
						</label>
						<textarea
							value={formData.progress_description}
							onChange={(e) =>
								setFormData({
									...formData,
									progress_description: e.target.value,
								})
							}
							rows={3}
							className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
							placeholder="Jelaskan progress yang telah dicapai..."
							required
						/>
					</div>

					<button
						type="submit"
						disabled={updating}
						className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium shadow-sm"
					>
						{updating ? (
							<>
								<Loader2 className="w-4 h-4 animate-spin" />
								<span>Menyimpan...</span>
							</>
						) : (
							<>
								<PlayCircle className="w-4 h-4" />
								<span>Update Progress</span>
							</>
						)}
					</button>
				</form>
			)}

			{/* Progress History */}
			{progressData?.history && progressData.history.length > 0 && (
				<div>
					<h4 className="text-sm font-medium text-gray-900 mb-3">
						Riwayat Progress
					</h4>
					<div className="space-y-3">
						{progressData.history.map((progress, index) => (
							<div
								key={index}
								className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100"
							>
								<CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
								<div className="flex-1">
									<div className="flex items-center justify-between mb-1">
										<span className="text-sm font-semibold text-gray-900">
											{progress.progress_percentage}%
										</span>
										<span className="text-xs text-gray-500">
											{new Date(progress.update_date).toLocaleDateString(
												"id-ID",
												{
													day: "numeric",
													month: "short",
													year: "numeric",
													hour: "2-digit",
													minute: "2-digit",
												}
											)}
										</span>
									</div>
									{progress.updated_by_name && (
										<div className="text-xs text-gray-600 mb-1">
											Oleh:{" "}
											<span className="font-medium">
												{progress.updated_by_name}
											</span>
										</div>
									)}
									{progress.progress_description && (
										<p className="text-sm text-gray-600 leading-relaxed">
											{progress.progress_description}
										</p>
									)}
									{progress.milestone && (
										<span className="inline-block mt-1 px-2 py-0.5 bg-sky-50 text-sky-700 border border-sky-200 text-xs rounded-full font-medium">
											{progress.milestone}
										</span>
									)}
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			<style jsx>{`
				.slider::-webkit-slider-thumb {
					appearance: none;
					height: 20px;
					width: 20px;
					border-radius: 50%;
					background: #0284c7;
					cursor: pointer;
					box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
				}

				.slider::-moz-range-thumb {
					height: 20px;
					width: 20px;
					border-radius: 50%;
					background: #0284c7;
					cursor: pointer;
					border: none;
					box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
				}
			`}</style>
		</div>
	);
}
