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

	// Authorization checks
	const isUserFromIT =
		user?.departement_id === "IT" ||
		user?.departemen === "IT" ||
		user?.jbtn?.toLowerCase().includes("it") ||
		user?.jabatan?.toLowerCase().includes("it");

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

	// Debug logging
	console.log("ProgressTracker Authorization Debug:", {
		user: user,
		request: request,
		userIdentifier: userIdentifier,
		userNik: user?.nik,
		userUsername: user?.username,
		userId: user?.id,
		userDepartment: user?.departement_id,
		userDepartemen: user?.departemen,
		userJbtn: user?.jbtn,
		userJabatan: user?.jabatan,
		assignedDeveloper: request?.assigned_developer,
		isUserFromIT,
		isAssignedDeveloper,
		canUpdateProgress,
		canHaveProgress,
		currentStatus: request?.current_status,
	});

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

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!canUpdateProgress) return;

		try {
			setUpdating(true);
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
				await fetchProgress();
				// Reset form but keep the new progress as minimum
				setFormData({
					progress_percentage: formData.progress_percentage,
					progress_description: "",
				});

				// Call parent callback if provided
				if (onProgressUpdate) {
					try {
						await onProgressUpdate(formData);
					} catch (error) {
						console.error("Error in parent progress update callback:", error);
					}
				}
			} else {
				console.error("Failed to update progress:", data.error);
				alert("Gagal mengupdate progress: " + (data.error || "Unknown error"));
			}
		} catch (error) {
			console.error("Error updating progress:", error);
		} finally {
			setUpdating(false);
		}
	};

	// Don't render if parent is still loading or essential data is missing
	if (parentLoading || !request || !user) {
		return (
			<div className="bg-white rounded-lg border border-gray-200 p-6">
				<div className="flex items-center gap-3 mb-4">
					<TrendingUp className="w-5 h-5 text-blue-600" />
					<h3 className="text-lg font-semibold text-gray-900">
						Progress Pengembangan
					</h3>
					<Loader2 className="w-4 h-4 animate-spin text-gray-500" />
				</div>
				<div className="text-gray-600">Memuat data...</div>
			</div>
		);
	}

	if (!canHaveProgress) {
		return null;
	}

	if (loading) {
		return (
			<div className="bg-white rounded-lg border border-gray-200 p-6">
				<div className="flex items-center gap-3 mb-4">
					<TrendingUp className="w-5 h-5 text-blue-600" />
					<h3 className="text-lg font-semibold text-gray-900">
						Progress Pengembangan
					</h3>
					<Loader2 className="w-4 h-4 animate-spin text-gray-500" />
				</div>
				<div className="text-gray-600">Memuat data progress...</div>
			</div>
		);
	}

	const currentProgress = progressData?.current_progress || 0;

	return (
		<div className="bg-white rounded-lg border border-gray-200 p-6">
			<div className="flex items-center gap-3 mb-4">
				<TrendingUp className="w-5 h-5 text-blue-600" />
				<h3 className="text-lg font-semibold text-gray-900">
					Progress Pengembangan
				</h3>
			</div>

			{/* Current Progress */}
			<div className="mb-6">
				<div className="flex items-center justify-between text-sm text-gray-600 mb-2">
					<span>Progress Saat Ini</span>
					<span className="font-semibold">{currentProgress}%</span>
				</div>
				<div className="w-full bg-gray-200 rounded-full h-3">
					<div
						className="bg-blue-600 h-3 rounded-full transition-all duration-300"
						style={{ width: `${currentProgress}%` }}
					/>
				</div>
			</div>

			{/* Debug Info */}
			{!canUpdateProgress && (
				<div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
					<h4 className="text-sm font-medium text-yellow-800 mb-2">
						Debug: Form tidak muncul
					</h4>
					<div className="text-xs text-yellow-700">
						<p>User Object: {user ? JSON.stringify(user, null, 2) : "null"}</p>
						<p>
							Request Object:{" "}
							{request
								? JSON.stringify(
										{
											request_id: request.request_id,
											assigned_developer: request.assigned_developer,
											current_status: request.current_status,
											title: request.title,
										},
										null,
										2
								  )
								: "null"}
						</p>
						<hr className="my-2" />
						<p>User Identifier: {userIdentifier || "null"}</p>
						<p>User NIK: {user?.nik || "null"}</p>
						<p>User Username: {user?.username || "null"}</p>
						<p>User ID: {user?.id || "null"}</p>
						<p>User Department: {user?.departement_id || "null"}</p>
						<p>User Departemen: {user?.departemen || "null"}</p>
						<p>User Jabatan: {user?.jabatan || "null"}</p>
						<p>Assigned Developer: {request?.assigned_developer || "null"}</p>
						<p>Current Status: {request?.current_status || "null"}</p>
						<p>Is User IT: {isUserFromIT ? "true" : "false"}</p>
						<p>
							Is Assigned Developer: {isAssignedDeveloper ? "true" : "false"}
						</p>
						<p>Can Update Progress: {canUpdateProgress ? "true" : "false"}</p>
						<p>Can Have Progress: {canHaveProgress ? "true" : "false"}</p>
						<p>Parent Loading: {parentLoading ? "true" : "false"}</p>
					</div>
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
										background: `linear-gradient(to right, #2563eb 0%, #2563eb ${formData.progress_percentage}%, #e5e7eb ${formData.progress_percentage}%, #e5e7eb 100%)`,
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
									className="w-20 px-2 py-1 border border-gray-300 rounded text-center text-sm"
								/>
								<span className="text-sm text-gray-600">%</span>
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
							className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="Jelaskan progress yang telah dicapai..."
							required
						/>
					</div>

					<button
						type="submit"
						disabled={updating}
						className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
								className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
							>
								<CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
								<div className="flex-1">
									<div className="flex items-center justify-between mb-1">
										<span className="text-sm font-medium text-gray-900">
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
										<p className="text-sm text-gray-600">
											{progress.progress_description}
										</p>
									)}
									{progress.milestone && (
										<span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
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
					background: #2563eb;
					cursor: pointer;
					box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
				}

				.slider::-moz-range-thumb {
					height: 20px;
					width: 20px;
					border-radius: 50%;
					background: #2563eb;
					cursor: pointer;
					border: none;
					box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
				}
			`}</style>
		</div>
	);
}
