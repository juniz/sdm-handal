"use client";

import { useState, useEffect } from "react";
import {
	AlertTriangle,
	Shield,
	XCircle,
	CheckCircle,
	Eye,
	Filter,
	Download,
	Calendar,
	User,
	Monitor,
	RefreshCw,
	ChevronDown,
	ChevronUp,
	X,
} from "lucide-react";
import moment from "moment";
import "moment/locale/id";

const ErrorLogsPage = () => {
	const [errorLogs, setErrorLogs] = useState([]);
	const [loading, setLoading] = useState(true);
	const [pagination, setPagination] = useState({});
	const [statistics, setStatistics] = useState({});
	const [filters, setFilters] = useState({
		severity: "",
		status: "",
		error_type: "",
		date_from: "",
		date_to: "",
		page: 1,
		limit: 20,
	});
	const [selectedLog, setSelectedLog] = useState(null);
	const [showDetailModal, setShowDetailModal] = useState(false);
	const [showFilters, setShowFilters] = useState(false);
	const [resolutionData, setResolutionData] = useState({
		resolution_notes: "",
		resolution_type: "FIXED",
	});

	// Fetch error logs
	const fetchErrorLogs = async () => {
		setLoading(true);
		try {
			const queryParams = new URLSearchParams();
			Object.entries(filters).forEach(([key, value]) => {
				if (value) queryParams.append(key, value);
			});

			const response = await fetch(`/api/error-logs?${queryParams}`);
			const data = await response.json();

			if (data.success) {
				setErrorLogs(data.data);
				setPagination(data.pagination);
				setStatistics(data.statistics);
			} else {
				console.error("Failed to fetch error logs:", data.message);
			}
		} catch (error) {
			console.error("Error fetching error logs:", error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchErrorLogs();
	}, [filters]);

	// Update error status
	const updateErrorStatus = async (logId, status) => {
		try {
			const payload = {
				log_id: logId,
				status,
				...resolutionData,
			};

			const response = await fetch("/api/error-logs", {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(payload),
			});

			const data = await response.json();
			if (data.success) {
				fetchErrorLogs(); // Refresh data
				setShowDetailModal(false);
				setResolutionData({ resolution_notes: "", resolution_type: "FIXED" });
			}
		} catch (error) {
			console.error("Error updating status:", error);
		}
	};

	// Get severity color
	const getSeverityColor = (severity) => {
		switch (severity) {
			case "CRITICAL":
				return "text-red-600 bg-red-50";
			case "HIGH":
				return "text-orange-600 bg-orange-50";
			case "MEDIUM":
				return "text-yellow-600 bg-yellow-50";
			case "LOW":
				return "text-green-600 bg-green-50";
			default:
				return "text-gray-600 bg-gray-50";
		}
	};

	// Get status color
	const getStatusColor = (status) => {
		switch (status) {
			case "NEW":
				return "text-blue-600 bg-blue-50";
			case "REVIEWED":
				return "text-yellow-600 bg-yellow-50";
			case "RESOLVED":
				return "text-green-600 bg-green-50";
			case "IGNORED":
				return "text-gray-600 bg-gray-50";
			default:
				return "text-gray-600 bg-gray-50";
		}
	};

	// Format timestamp
	const formatTimestamp = (timestamp) => {
		return moment(timestamp).format("DD/MM/YYYY HH:mm:ss");
	};

	// Format timestamp for mobile (shorter)
	const formatTimestampMobile = (timestamp) => {
		return moment(timestamp).format("DD/MM HH:mm");
	};

	// Export error logs
	const exportLogs = () => {
		const csvContent = [
			[
				"Timestamp",
				"User",
				"Error Type",
				"Message",
				"Severity",
				"Status",
				"Component",
				"Page",
			],
			...errorLogs.map((log) => [
				formatTimestamp(log.timestamp),
				log.user_name || "Anonymous",
				log.error_type,
				log.error_message,
				log.severity,
				log.status,
				log.component_name,
				log.page_url,
			]),
		]
			.map((row) => row.join(","))
			.join("\n");

		const blob = new Blob([csvContent], { type: "text/csv" });
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `error-logs-${moment().format("YYYY-MM-DD")}.csv`;
		a.click();
	};

	return (
		<div className="max-w-7xl mx-auto p-3 sm:p-6">
			<div className="mb-6 sm:mb-8">
				<h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
					Error Logs Management
				</h1>
				<p className="text-sm sm:text-base text-gray-600">
					Monitor dan kelola error yang dialami pengguna aplikasi
				</p>
			</div>

			{/* Statistics Cards */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-4 sm:mb-6">
				<div className="bg-red-50 p-3 sm:p-4 rounded-lg">
					<div className="flex items-center">
						<XCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-600 mr-2 sm:mr-3" />
						<div>
							<p className="text-xs sm:text-sm text-red-600">Critical</p>
							<p className="text-lg sm:text-2xl font-bold text-red-900">
								{statistics.critical || 0}
							</p>
						</div>
					</div>
				</div>
				<div className="bg-orange-50 p-3 sm:p-4 rounded-lg">
					<div className="flex items-center">
						<AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600 mr-2 sm:mr-3" />
						<div>
							<p className="text-xs sm:text-sm text-orange-600">High</p>
							<p className="text-lg sm:text-2xl font-bold text-orange-900">
								{statistics.high || 0}
							</p>
						</div>
					</div>
				</div>
				<div className="bg-yellow-50 p-3 sm:p-4 rounded-lg">
					<div className="flex items-center">
						<Shield className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600 mr-2 sm:mr-3" />
						<div>
							<p className="text-xs sm:text-sm text-yellow-600">Medium</p>
							<p className="text-lg sm:text-2xl font-bold text-yellow-900">
								{statistics.medium || 0}
							</p>
						</div>
					</div>
				</div>
				<div className="bg-green-50 p-3 sm:p-4 rounded-lg">
					<div className="flex items-center">
						<CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 mr-2 sm:mr-3" />
						<div>
							<p className="text-xs sm:text-sm text-green-600">Low</p>
							<p className="text-lg sm:text-2xl font-bold text-green-900">
								{statistics.low || 0}
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Filters */}
			<div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm mb-4 sm:mb-6">
				<div className="flex items-center justify-between mb-4">
					<div className="flex items-center gap-2 sm:gap-4">
						<Filter className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
						<h3 className="text-base sm:text-lg font-medium text-gray-900">
							Filter
						</h3>
					</div>
					<button
						onClick={() => setShowFilters(!showFilters)}
						className="sm:hidden flex items-center gap-1 text-blue-600"
					>
						{showFilters ? (
							<ChevronUp className="w-4 h-4" />
						) : (
							<ChevronDown className="w-4 h-4" />
						)}
						<span className="text-sm">Filter</span>
					</button>
				</div>

				<div
					className={`space-y-3 sm:space-y-0 ${
						showFilters ? "block" : "hidden sm:block"
					}`}
				>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
						<select
							value={filters.severity}
							onChange={(e) =>
								setFilters({ ...filters, severity: e.target.value, page: 1 })
							}
							className="border border-gray-300 rounded-md px-3 py-2 text-sm"
						>
							<option value="">Semua Severity</option>
							<option value="CRITICAL">Critical</option>
							<option value="HIGH">High</option>
							<option value="MEDIUM">Medium</option>
							<option value="LOW">Low</option>
						</select>

						<select
							value={filters.status}
							onChange={(e) =>
								setFilters({ ...filters, status: e.target.value, page: 1 })
							}
							className="border border-gray-300 rounded-md px-3 py-2 text-sm"
						>
							<option value="">Semua Status</option>
							<option value="NEW">New</option>
							<option value="REVIEWED">Reviewed</option>
							<option value="RESOLVED">Resolved</option>
							<option value="IGNORED">Ignored</option>
						</select>

						<input
							type="text"
							placeholder="Error Type"
							value={filters.error_type}
							onChange={(e) =>
								setFilters({ ...filters, error_type: e.target.value, page: 1 })
							}
							className="border border-gray-300 rounded-md px-3 py-2 text-sm"
						/>

						<input
							type="date"
							value={filters.date_from}
							onChange={(e) =>
								setFilters({ ...filters, date_from: e.target.value, page: 1 })
							}
							className="border border-gray-300 rounded-md px-3 py-2 text-sm"
						/>

						<input
							type="date"
							value={filters.date_to}
							onChange={(e) =>
								setFilters({ ...filters, date_to: e.target.value, page: 1 })
							}
							className="border border-gray-300 rounded-md px-3 py-2 text-sm"
						/>
					</div>

					<div className="flex flex-col sm:flex-row gap-2 mt-4">
						<button
							onClick={() =>
								setFilters({
									severity: "",
									status: "",
									error_type: "",
									date_from: "",
									date_to: "",
									page: 1,
									limit: 20,
								})
							}
							className="px-3 sm:px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
						>
							Reset Filter
						</button>
						<button
							onClick={fetchErrorLogs}
							className="px-3 sm:px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center justify-center gap-2 text-sm"
						>
							<RefreshCw className="w-4 h-4" />
							Refresh
						</button>
						<button
							onClick={exportLogs}
							className="px-3 sm:px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center justify-center gap-2 text-sm"
						>
							<Download className="w-4 h-4" />
							Export CSV
						</button>
					</div>
				</div>
			</div>

			{/* Error Logs - Desktop Table & Mobile Cards */}
			<div className="bg-white rounded-lg shadow-sm overflow-hidden">
				{loading ? (
					<div className="p-8 text-center">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
						<p className="mt-2 text-gray-600">Loading error logs...</p>
					</div>
				) : (
					<>
						{/* Desktop View */}
						<div className="hidden lg:block overflow-x-auto">
							<table className="min-w-full divide-y divide-gray-200">
								<thead className="bg-gray-50">
									<tr>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Timestamp
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											User
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Error
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Severity
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Status
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Component
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Actions
										</th>
									</tr>
								</thead>
								<tbody className="bg-white divide-y divide-gray-200">
									{errorLogs.map((log) => (
										<tr key={log.id} className="hover:bg-gray-50">
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
												<div className="flex items-center">
													<Calendar className="w-4 h-4 text-gray-400 mr-2" />
													{formatTimestamp(log.timestamp)}
												</div>
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
												<div className="flex items-center">
													<User className="w-4 h-4 text-gray-400 mr-2" />
													<div>
														<div className="font-medium">
															{log.user_name || "Anonymous"}
														</div>
														<div className="text-gray-500">{log.user_id}</div>
													</div>
												</div>
											</td>
											<td className="px-6 py-4 text-sm text-gray-900">
												<div className="max-w-xs">
													<div className="font-medium text-red-600">
														{log.error_type}
													</div>
													<div className="text-gray-500 truncate">
														{log.error_message}
													</div>
													<div className="text-xs text-gray-400 mt-1">
														{log.page_url}
													</div>
												</div>
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<span
													className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(
														log.severity
													)}`}
												>
													{log.severity}
												</span>
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<span
													className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
														log.status
													)}`}
												>
													{log.status}
												</span>
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
												<div className="flex items-center">
													<Monitor className="w-4 h-4 text-gray-400 mr-2" />
													{log.component_name}
												</div>
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
												<button
													onClick={() => {
														setSelectedLog(log);
														setShowDetailModal(true);
													}}
													className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
												>
													<Eye className="w-4 h-4" />
													Detail
												</button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>

						{/* Mobile/Tablet View - Cards */}
						<div className="lg:hidden divide-y divide-gray-200">
							{errorLogs.map((log) => (
								<div key={log.id} className="p-4 hover:bg-gray-50">
									<div className="flex justify-between items-start mb-3">
										<div className="flex-1">
											<div className="flex items-center gap-2 mb-1">
												<span
													className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(
														log.severity
													)}`}
												>
													{log.severity}
												</span>
												<span
													className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
														log.status
													)}`}
												>
													{log.status}
												</span>
											</div>
											<h3 className="font-medium text-red-600 text-sm mb-1">
												{log.error_type}
											</h3>
											<p className="text-xs text-gray-500 line-clamp-2 mb-2">
												{log.error_message}
											</p>
										</div>
										<button
											onClick={() => {
												setSelectedLog(log);
												setShowDetailModal(true);
											}}
											className="ml-2 p-2 text-blue-600 hover:bg-blue-50 rounded-full"
										>
											<Eye className="w-4 h-4" />
										</button>
									</div>

									<div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
										<div className="flex items-center gap-1">
											<Calendar className="w-3 h-3" />
											<span>{formatTimestampMobile(log.timestamp)}</span>
										</div>
										<div className="flex items-center gap-1">
											<User className="w-3 h-3" />
											<span className="truncate">
												{log.user_name || "Anonymous"}
											</span>
										</div>
										<div className="flex items-center gap-1">
											<Monitor className="w-3 h-3" />
											<span className="truncate">{log.component_name}</span>
										</div>
										<div className="truncate">
											<span className="text-blue-600">{log.page_url}</span>
										</div>
									</div>
								</div>
							))}
						</div>
					</>
				)}

				{/* Pagination */}
				{pagination.total_pages > 1 && (
					<div className="bg-white px-4 py-3 flex flex-col sm:flex-row items-center justify-between border-t border-gray-200 gap-3">
						<div className="text-sm text-gray-700 text-center sm:text-left">
							Showing{" "}
							<span className="font-medium">
								{(filters.page - 1) * filters.limit + 1}
							</span>{" "}
							to{" "}
							<span className="font-medium">
								{Math.min(
									filters.page * filters.limit,
									pagination.total_records
								)}
							</span>{" "}
							of <span className="font-medium">{pagination.total_records}</span>{" "}
							results
						</div>
						<div className="flex gap-2">
							<button
								onClick={() =>
									setFilters({
										...filters,
										page: Math.max(1, filters.page - 1),
									})
								}
								disabled={filters.page <= 1}
								className="px-3 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								Previous
							</button>
							<button
								onClick={() =>
									setFilters({
										...filters,
										page: Math.min(pagination.total_pages, filters.page + 1),
									})
								}
								disabled={filters.page >= pagination.total_pages}
								className="px-3 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								Next
							</button>
						</div>
					</div>
				)}
			</div>

			{/* Detail Modal */}
			{showDetailModal && selectedLog && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
					<div className="bg-white rounded-lg w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
						<div className="p-4 sm:p-6 border-b flex justify-between items-center">
							<h3 className="text-lg font-semibold">Error Log Detail</h3>
							<button
								onClick={() => setShowDetailModal(false)}
								className="p-1 hover:bg-gray-100 rounded-full"
							>
								<X className="w-5 h-5" />
							</button>
						</div>

						<div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div>
									<label className="text-sm font-medium text-gray-500">
										Error Type
									</label>
									<p className="text-red-600 font-medium text-sm sm:text-base">
										{selectedLog.error_type}
									</p>
								</div>
								<div>
									<label className="text-sm font-medium text-gray-500">
										Severity
									</label>
									<div>
										<span
											className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(
												selectedLog.severity
											)}`}
										>
											{selectedLog.severity}
										</span>
									</div>
								</div>
								<div>
									<label className="text-sm font-medium text-gray-500">
										User
									</label>
									<p className="text-sm sm:text-base">
										{selectedLog.user_name || "Anonymous"} (
										{selectedLog.user_id})
									</p>
								</div>
								<div>
									<label className="text-sm font-medium text-gray-500">
										Component
									</label>
									<p className="text-sm sm:text-base">
										{selectedLog.component_name}
									</p>
								</div>
								<div className="sm:col-span-2">
									<label className="text-sm font-medium text-gray-500">
										Page URL
									</label>
									<p className="text-blue-600 text-sm break-all">
										{selectedLog.page_url}
									</p>
								</div>
								<div>
									<label className="text-sm font-medium text-gray-500">
										IP Address
									</label>
									<p className="text-sm sm:text-base">
										{selectedLog.ip_address}
									</p>
								</div>
								<div>
									<label className="text-sm font-medium text-gray-500">
										Timestamp
									</label>
									<p className="text-sm sm:text-base">
										{formatTimestamp(selectedLog.timestamp)}
									</p>
								</div>
							</div>

							<div>
								<label className="text-sm font-medium text-gray-500">
									Error Message
								</label>
								<p className="bg-red-50 p-3 rounded text-red-800 mt-1 text-sm break-words">
									{selectedLog.error_message}
								</p>
							</div>

							<div>
								<label className="text-sm font-medium text-gray-500">
									Action Attempted
								</label>
								<p className="text-sm break-words">
									{selectedLog.action_attempted}
								</p>
							</div>

							{selectedLog.browser_info && (
								<div>
									<label className="text-sm font-medium text-gray-500">
										Browser Info
									</label>
									<pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto">
										{JSON.stringify(
											JSON.parse(selectedLog.browser_info),
											null,
											2
										)}
									</pre>
								</div>
							)}

							{selectedLog.device_info && (
								<div>
									<label className="text-sm font-medium text-gray-500">
										Device Info
									</label>
									<pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto">
										{JSON.stringify(
											JSON.parse(selectedLog.device_info),
											null,
											2
										)}
									</pre>
								</div>
							)}

							{/* Resolution Form */}
							{selectedLog.status !== "RESOLVED" && (
								<div className="border-t pt-4">
									<h4 className="font-medium text-gray-900 mb-3">
										Resolve Error
									</h4>
									<div className="space-y-3">
										<div>
											<label className="block text-sm font-medium text-gray-700">
												Resolution Type
											</label>
											<select
												value={resolutionData.resolution_type}
												onChange={(e) =>
													setResolutionData({
														...resolutionData,
														resolution_type: e.target.value,
													})
												}
												className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
											>
												<option value="FIXED">Fixed</option>
												<option value="WORKAROUND">Workaround</option>
												<option value="WONT_FIX">Won't Fix</option>
												<option value="DUPLICATE">Duplicate</option>
											</select>
										</div>
										<div>
											<label className="block text-sm font-medium text-gray-700">
												Resolution Notes
											</label>
											<textarea
												value={resolutionData.resolution_notes}
												onChange={(e) =>
													setResolutionData({
														...resolutionData,
														resolution_notes: e.target.value,
													})
												}
												className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
												rows="3"
												placeholder="Describe the resolution..."
											/>
										</div>
									</div>
								</div>
							)}
						</div>

						<div className="p-4 sm:p-6 border-t flex flex-col sm:flex-row gap-2 justify-end">
							<button
								onClick={() => setShowDetailModal(false)}
								className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 text-sm order-last sm:order-first"
							>
								Close
							</button>
							{selectedLog.status === "NEW" && (
								<button
									onClick={() => updateErrorStatus(selectedLog.id, "REVIEWED")}
									className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 text-sm"
								>
									Mark as Reviewed
								</button>
							)}
							{selectedLog.status !== "RESOLVED" && (
								<button
									onClick={() => updateErrorStatus(selectedLog.id, "RESOLVED")}
									className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm"
									disabled={!resolutionData.resolution_notes}
								>
									Mark as Resolved
								</button>
							)}
							<button
								onClick={() => updateErrorStatus(selectedLog.id, "IGNORED")}
								className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-sm"
							>
								Ignore
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default ErrorLogsPage;
