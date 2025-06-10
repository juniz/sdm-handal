"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Eye,
	Shield,
	AlertTriangle,
	CheckCircle,
	XCircle,
	Activity,
	Users,
	MapPin,
	Clock,
	RefreshCw,
	Download,
	Filter,
	Calendar,
	ShieldCheck,
	ShieldAlert,
	ShieldX,
	TrendingUp,
	Search,
	ChevronDown,
	ChevronUp,
} from "lucide-react";

// Simple toast hook
const useToast = () => {
	const toast = ({ title, description, variant }) => {
		if (variant === "destructive") {
			alert(`Error: ${title}\n${description}`);
		} else {
			alert(`${title}\n${description}`);
		}
	};
	return { toast };
};

export default function SecurityMonitoringPage() {
	const [securityLogs, setSecurityLogs] = useState([]);
	const [dailyStats, setDailyStats] = useState(null);
	const [suspiciousEmployees, setSuspiciousEmployees] = useState([]);
	const [loading, setLoading] = useState(true);
	const [selectedDate, setSelectedDate] = useState(
		new Date().toISOString().split("T")[0]
	);
	const [filterRisk, setFilterRisk] = useState("ALL");
	const [searchEmployee, setSearchEmployee] = useState("");
	const [showFilters, setShowFilters] = useState(false);

	// Fetch security data
	const fetchSecurityData = async () => {
		setLoading(true);
		try {
			const [logsRes, statsRes, suspiciousRes] = await Promise.all([
				fetch(
					`/api/admin/security-logs?date=${selectedDate}&risk=${filterRisk}&search=${searchEmployee}`
				),
				fetch(`/api/admin/security-stats?date=${selectedDate}`),
				fetch(`/api/admin/suspicious-employees`),
			]);

			if (logsRes.ok) {
				const logsData = await logsRes.json();
				setSecurityLogs(logsData.data || []);
			}

			if (statsRes.ok) {
				const statsData = await statsRes.json();
				setDailyStats(statsData.data);
			}

			if (suspiciousRes.ok) {
				const suspiciousData = await suspiciousRes.json();
				setSuspiciousEmployees(suspiciousData.data || []);
			}
		} catch (error) {
			console.error("Error fetching security data:", error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchSecurityData();
	}, [selectedDate, filterRisk, searchEmployee]);

	// Format functions
	const formatTime = (timestamp) => {
		return new Date(timestamp).toLocaleTimeString("id-ID");
	};

	const formatDate = (timestamp) => {
		return new Date(timestamp).toLocaleDateString("id-ID");
	};

	const formatTimestampMobile = (timestamp) => {
		const date = new Date(timestamp);
		return date.toLocaleString("id-ID", {
			day: "2-digit",
			month: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const getRiskBadge = (riskLevel) => {
		const badges = {
			LOW: "bg-green-100 text-green-800",
			MEDIUM: "bg-yellow-100 text-yellow-800",
			HIGH: "bg-red-100 text-red-800",
		};
		return badges[riskLevel] || badges.LOW;
	};

	const getRiskIcon = (riskLevel) => {
		switch (riskLevel) {
			case "LOW":
				return <ShieldCheck className="w-4 h-4 text-green-600" />;
			case "MEDIUM":
				return <ShieldAlert className="w-4 h-4 text-yellow-600" />;
			case "HIGH":
				return <ShieldX className="w-4 h-4 text-red-600" />;
			default:
				return <Shield className="w-4 h-4 text-gray-600" />;
		}
	};

	const getConfidenceColor = (confidence) => {
		if (confidence >= 80) return "text-green-600";
		if (confidence >= 60) return "text-yellow-600";
		if (confidence >= 40) return "text-orange-600";
		return "text-red-600";
	};

	// Export data
	const exportData = async () => {
		try {
			const response = await fetch(
				`/api/admin/security-export?date=${selectedDate}&risk=${filterRisk}`
			);
			if (response.ok) {
				const blob = await response.blob();
				const url = window.URL.createObjectURL(blob);
				const a = document.createElement("a");
				a.href = url;
				a.download = `security-logs-${selectedDate}.csv`;
				document.body.appendChild(a);
				a.click();
				window.URL.revokeObjectURL(url);
				document.body.removeChild(a);
			}
		} catch (error) {
			console.error("Error exporting data:", error);
		}
	};

	return (
		<div className="space-y-4 sm:space-y-6 p-3 sm:p-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div>
					<h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
						Monitoring Keamanan Lokasi
					</h1>
					<p className="text-sm sm:text-base text-gray-600">
						Pantau dan analisis aktivitas presensi yang mencurigakan
					</p>
				</div>
				<div className="flex items-center gap-2 sm:gap-3">
					<button
						onClick={fetchSecurityData}
						disabled={loading}
						className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 text-sm"
					>
						<RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
						<span className="hidden sm:inline">Refresh</span>
					</button>
					<button
						onClick={exportData}
						className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm"
					>
						<Download className="w-4 h-4" />
						<span className="hidden sm:inline">Export</span>
					</button>
				</div>
			</div>

			{/* Statistics Cards */}
			{dailyStats && (
				<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
					<div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
						<div className="flex items-center gap-2 sm:gap-3">
							<div className="p-2 bg-blue-100 rounded-lg">
								<Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
							</div>
							<div>
								<p className="text-xs sm:text-sm text-gray-600">
									Total Aktivitas
								</p>
								<p className="text-lg sm:text-2xl font-semibold">
									{dailyStats.total_aktivitas || 0}
								</p>
							</div>
						</div>
					</div>

					<div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
						<div className="flex items-center gap-2 sm:gap-3">
							<div className="p-2 bg-red-100 rounded-lg">
								<ShieldX className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
							</div>
							<div>
								<p className="text-xs sm:text-sm text-gray-600">High Risk</p>
								<p className="text-lg sm:text-2xl font-semibold text-red-600">
									{dailyStats.high_risk || 0}
								</p>
							</div>
						</div>
					</div>

					<div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
						<div className="flex items-center gap-2 sm:gap-3">
							<div className="p-2 bg-yellow-100 rounded-lg">
								<ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
							</div>
							<div>
								<p className="text-xs sm:text-sm text-gray-600">Medium Risk</p>
								<p className="text-lg sm:text-2xl font-semibold text-yellow-600">
									{dailyStats.medium_risk || 0}
								</p>
							</div>
						</div>
					</div>

					<div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
						<div className="flex items-center gap-2 sm:gap-3">
							<div className="p-2 bg-green-100 rounded-lg">
								<TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
							</div>
							<div>
								<p className="text-xs sm:text-sm text-gray-600">
									Avg Confidence
								</p>
								<p className="text-lg sm:text-2xl font-semibold text-green-600">
									{Math.round(dailyStats.avg_confidence || 0)}%
								</p>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Filters */}
			<div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
				<div className="flex items-center justify-between mb-4">
					<h3 className="text-base sm:text-lg font-medium text-gray-900">
						Filter
					</h3>
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
					<div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 sm:gap-4">
						<div className="flex flex-col sm:flex-row sm:items-center gap-2">
							<Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 self-start sm:self-auto" />
							<label className="text-sm font-medium text-gray-700">
								Tanggal:
							</label>
							<input
								type="date"
								value={selectedDate}
								onChange={(e) => setSelectedDate(e.target.value)}
								className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full sm:w-auto"
							/>
						</div>

						<div className="flex flex-col sm:flex-row sm:items-center gap-2">
							<Filter className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 self-start sm:self-auto" />
							<label className="text-sm font-medium text-gray-700">
								Risk Level:
							</label>
							<select
								value={filterRisk}
								onChange={(e) => setFilterRisk(e.target.value)}
								className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full sm:w-auto"
							>
								<option value="ALL">Semua</option>
								<option value="HIGH">High Risk</option>
								<option value="MEDIUM">Medium Risk</option>
								<option value="LOW">Low Risk</option>
							</select>
						</div>

						<div className="flex flex-col sm:flex-row sm:items-center gap-2">
							<Search className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 self-start sm:self-auto" />
							<label className="text-sm font-medium text-gray-700">
								Pegawai:
							</label>
							<input
								type="text"
								placeholder="Cari ID atau nama pegawai..."
								value={searchEmployee}
								onChange={(e) => setSearchEmployee(e.target.value)}
								className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full sm:w-64"
							/>
						</div>
					</div>
				</div>
			</div>

			{/* Suspicious Employees Alert */}
			{suspiciousEmployees.length > 0 && (
				<div className="bg-red-50 border border-red-200 rounded-lg p-4">
					<div className="flex items-start gap-3">
						<AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
						<div className="flex-1">
							<h3 className="font-medium text-red-800 text-sm sm:text-base">
								Pegawai dengan Aktivitas Mencurigakan
							</h3>
							<p className="text-xs sm:text-sm text-red-600 mt-1">
								{suspiciousEmployees.length} pegawai terdeteksi memiliki
								aktivitas mencurigakan dalam 30 hari terakhir
							</p>
							<div className="mt-3 space-y-2">
								{suspiciousEmployees.slice(0, 3).map((emp, index) => (
									<div key={index} className="text-xs sm:text-sm">
										<span className="font-medium">{emp.nama_lengkap}</span>
										<span className="text-red-600 ml-2 block sm:inline">
											(High Risk: {emp.high_risk_count}, Avg Confidence:{" "}
											{Math.round(emp.avg_confidence)}%)
										</span>
									</div>
								))}
								{suspiciousEmployees.length > 3 && (
									<p className="text-xs sm:text-sm text-red-600">
										+{suspiciousEmployees.length - 3} pegawai lainnya
									</p>
								)}
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Security Logs */}
			<div className="bg-white rounded-lg shadow-sm border">
				<div className="p-4 sm:p-6 border-b">
					<h2 className="text-base sm:text-lg font-semibold">
						Log Keamanan Hari Ini
					</h2>
					<p className="text-gray-600 text-xs sm:text-sm">
						Daftar aktivitas presensi dengan detail keamanan lokasi
					</p>
				</div>

				{/* Desktop Table */}
				<div className="hidden lg:block overflow-x-auto">
					<table className="w-full">
						<thead className="bg-gray-50">
							<tr>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Waktu
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Pegawai
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Aksi
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Risk Level
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Confidence
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									GPS Accuracy
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Lokasi
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Warning
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Aksi
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-200">
							{loading ? (
								<tr>
									<td
										colSpan="9"
										className="px-6 py-8 text-center text-gray-500"
									>
										<div className="flex items-center justify-center gap-2">
											<RefreshCw className="w-4 h-4 animate-spin" />
											Loading...
										</div>
									</td>
								</tr>
							) : securityLogs.length === 0 ? (
								<tr>
									<td
										colSpan="9"
										className="px-6 py-8 text-center text-gray-500"
									>
										Tidak ada data untuk periode ini
									</td>
								</tr>
							) : (
								securityLogs.map((log) => (
									<tr key={log.id} className="hover:bg-gray-50">
										<td className="px-6 py-4 whitespace-nowrap text-sm">
											<div>
												<div className="font-medium">
													{formatTime(log.created_at)}
												</div>
												<div className="text-gray-500">
													{formatDate(log.created_at)}
												</div>
											</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm">
											<div>
												<div className="font-medium">{log.nama_lengkap}</div>
												<div className="text-gray-500">{log.id_pegawai}</div>
											</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<span
												className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
													log.action_type === "CHECKIN"
														? "bg-green-100 text-green-800"
														: "bg-blue-100 text-blue-800"
												}`}
											>
												{log.action_type === "CHECKIN"
													? "Check In"
													: "Check Out"}
											</span>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="flex items-center gap-2">
												{getRiskIcon(log.risk_level)}
												<span
													className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskBadge(
														log.risk_level
													)}`}
												>
													{log.risk_level}
												</span>
											</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<span
												className={`text-sm font-medium ${getConfidenceColor(
													log.confidence_level
												)}`}
											>
												{log.confidence_level}%
											</span>
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm">
											{log.gps_accuracy
												? `±${Math.round(log.gps_accuracy)}m`
												: "N/A"}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm">
											<div className="flex items-center gap-1">
												<MapPin className="w-4 h-4 text-gray-400" />
												<span className="font-mono text-xs">
													{parseFloat(log.latitude).toFixed(4)},{" "}
													{parseFloat(log.longitude).toFixed(4)}
												</span>
											</div>
										</td>
										<td className="px-6 py-4 text-sm">
											{log.warnings && JSON.parse(log.warnings).length > 0 ? (
												<div className="space-y-1">
													{JSON.parse(log.warnings)
														.slice(0, 2)
														.map((warning, idx) => (
															<div
																key={idx}
																className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded"
															>
																{warning}
															</div>
														))}
													{JSON.parse(log.warnings).length > 2 && (
														<div className="text-xs text-gray-500">
															+{JSON.parse(log.warnings).length - 2} lainnya
														</div>
													)}
												</div>
											) : (
												<span className="text-gray-400">-</span>
											)}
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<button
												onClick={() =>
													window.open(
														`https://www.google.com/maps?q=${log.latitude},${log.longitude}`,
														"_blank"
													)
												}
												className="text-blue-600 hover:text-blue-800"
												title="Lihat di Google Maps"
											>
												<Eye className="w-4 h-4" />
											</button>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>

				{/* Mobile/Tablet View - Cards */}
				<div className="lg:hidden divide-y divide-gray-200">
					{loading ? (
						<div className="p-8 text-center text-gray-500">
							<div className="flex items-center justify-center gap-2">
								<RefreshCw className="w-4 h-4 animate-spin" />
								Loading...
							</div>
						</div>
					) : securityLogs.length === 0 ? (
						<div className="p-8 text-center text-gray-500">
							Tidak ada data untuk periode ini
						</div>
					) : (
						securityLogs.map((log) => (
							<div key={log.id} className="p-4 hover:bg-gray-50">
								<div className="flex justify-between items-start mb-3">
									<div className="flex-1">
										<div className="flex items-center gap-2 mb-2">
											<span
												className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
													log.action_type === "CHECKIN"
														? "bg-green-100 text-green-800"
														: "bg-blue-100 text-blue-800"
												}`}
											>
												{log.action_type === "CHECKIN"
													? "Check In"
													: "Check Out"}
											</span>
											<div className="flex items-center gap-1">
												{getRiskIcon(log.risk_level)}
												<span
													className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskBadge(
														log.risk_level
													)}`}
												>
													{log.risk_level}
												</span>
											</div>
										</div>
										<h3 className="font-medium text-sm mb-1">
											{log.nama_lengkap}
										</h3>
										<p className="text-xs text-gray-500">
											ID: {log.id_pegawai}
										</p>
									</div>
									<button
										onClick={() =>
											window.open(
												`https://www.google.com/maps?q=${log.latitude},${log.longitude}`,
												"_blank"
											)
										}
										className="ml-2 p-2 text-blue-600 hover:bg-blue-50 rounded-full"
									>
										<Eye className="w-4 h-4" />
									</button>
								</div>

								<div className="grid grid-cols-2 gap-3 text-xs text-gray-600 mb-3">
									<div>
										<span className="font-medium">Waktu:</span>
										<div>{formatTimestampMobile(log.created_at)}</div>
									</div>
									<div>
										<span className="font-medium">Confidence:</span>
										<div className={getConfidenceColor(log.confidence_level)}>
											{log.confidence_level}%
										</div>
									</div>
									<div>
										<span className="font-medium">GPS Accuracy:</span>
										<div>
											{log.gps_accuracy
												? `±${Math.round(log.gps_accuracy)}m`
												: "N/A"}
										</div>
									</div>
									<div>
										<span className="font-medium">Lokasi:</span>
										<div className="font-mono">
											{parseFloat(log.latitude).toFixed(4)},{" "}
											{parseFloat(log.longitude).toFixed(4)}
										</div>
									</div>
								</div>

								{log.warnings && JSON.parse(log.warnings).length > 0 && (
									<div className="mt-2">
										<span className="text-xs font-medium text-gray-600">
											Warnings:
										</span>
										<div className="space-y-1 mt-1">
											{JSON.parse(log.warnings)
												.slice(0, 2)
												.map((warning, idx) => (
													<div
														key={idx}
														className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded"
													>
														{warning}
													</div>
												))}
											{JSON.parse(log.warnings).length > 2 && (
												<div className="text-xs text-gray-500">
													+{JSON.parse(log.warnings).length - 2} lainnya
												</div>
											)}
										</div>
									</div>
								)}
							</div>
						))
					)}
				</div>
			</div>
		</div>
	);
}
