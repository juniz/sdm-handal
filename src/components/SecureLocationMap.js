"use client";

import { useEffect, useState, useRef } from "react";
import {
	MapPin,
	Shield,
	ShieldAlert,
	ShieldCheck,
	ShieldX,
	Eye,
	AlertTriangle,
	CheckCircle,
	XCircle,
	Clock,
	Navigation,
	Zap,
	ChevronDown,
	ChevronRight,
} from "lucide-react";
import useLocationSecurity from "@/hooks/useLocationSecurity";

const SecureLocationMap = ({ onLocationVerified, onSecurityStatusChange }) => {
	const {
		currentLocation,
		locationHistory,
		isLocationValid,
		securityStatus,
		isWatching,
		error,
		startWatching,
		stopWatching,
		officeCoords,
		distanceFromOffice,
	} = useLocationSecurity({
		enableHighAccuracy: true,
		timeout: 10000,
		maximumAge: 5000,
		speedThreshold: 120, // km/h
		accuracyThreshold: 30, // meter
	});

	const [isMapVisible, setIsMapVisible] = useState(false);
	const [isSecurityDetailOpen, setIsSecurityDetailOpen] = useState(false);
	const [isMonitoringDetailOpen, setIsMonitoringDetailOpen] = useState(false);
	const hasStartedRef = useRef(false);

	// Notify parent components about location and security status
	useEffect(() => {
		if (onLocationVerified) {
			onLocationVerified(isLocationValid);
		}
	}, [isLocationValid, onLocationVerified]);

	useEffect(() => {
		if (onSecurityStatusChange) {
			onSecurityStatusChange(securityStatus);
		}
	}, [securityStatus, onSecurityStatusChange]);

	// Auto-start watching when component mounts (only once)
	useEffect(() => {
		if (!hasStartedRef.current) {
			hasStartedRef.current = true;
			startWatching();
		}

		return () => {
			if (hasStartedRef.current) {
				stopWatching();
				hasStartedRef.current = false;
			}
		};
	}, []); // Empty dependency array - only run once

	const getSecurityIcon = () => {
		if (securityStatus.confidence >= 80) {
			return <ShieldCheck className="w-5 h-5 text-green-600" />;
		} else if (securityStatus.confidence >= 60) {
			return <Shield className="w-5 h-5 text-yellow-600" />;
		} else if (securityStatus.confidence >= 40) {
			return <ShieldAlert className="w-5 h-5 text-orange-600" />;
		} else {
			return <ShieldX className="w-5 h-5 text-red-600" />;
		}
	};

	const getSecurityColor = () => {
		if (securityStatus.confidence >= 80) return "green";
		if (securityStatus.confidence >= 60) return "yellow";
		if (securityStatus.confidence >= 40) return "orange";
		return "red";
	};

	const formatDistance = (distance) => {
		if (distance < 1000) {
			return `${Math.round(distance)}m`;
		}
		return `${(distance / 1000).toFixed(1)}km`;
	};

	const formatAccuracy = (accuracy) => {
		return `±${Math.round(accuracy)}m`;
	};

	const getLocationStatusIcon = () => {
		if (isLocationValid) {
			return <CheckCircle className="w-5 h-5 text-green-600" />;
		} else if (currentLocation) {
			return <XCircle className="w-5 h-5 text-red-600" />;
		} else {
			return <Clock className="w-5 h-5 text-gray-400" />;
		}
	};

	const handleToggleMonitoring = () => {
		if (isWatching) {
			stopWatching();
		} else {
			startWatching();
		}
	};

	const getStatusSummary = () => {
		if (!currentLocation) return "Mencari lokasi...";
		if (isLocationValid && securityStatus.confidence >= 60) {
			return `Valid • ${formatDistance(distanceFromOffice)} • ${
				securityStatus.confidence
			}%`;
		}
		if (!isLocationValid) {
			return `Diluar area • ${formatDistance(distanceFromOffice)}`;
		}
		return `Keamanan rendah • ${securityStatus.confidence}%`;
	};

	return (
		<div className="space-y-3">
			{/* Main Status Card - Compact */}
			<div className="bg-white border rounded-lg p-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="flex items-center gap-2">
							<MapPin className="w-5 h-5 text-blue-600" />
							<span className="font-medium">Lokasi & Keamanan</span>
						</div>
						<div className="flex items-center gap-2">
							{getLocationStatusIcon()}
							{getSecurityIcon()}
						</div>
					</div>
					<div className="flex items-center gap-2">
						{isWatching && (
							<div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
						)}
						<button
							onClick={() => setIsMapVisible(!isMapVisible)}
							className="p-1 text-gray-400 hover:text-gray-600"
							title="Toggle Map"
						>
							<Eye className="w-4 h-4" />
						</button>
					</div>
				</div>

				{/* Status Summary */}
				<div className="mt-2">
					<p className="text-sm text-gray-600">{getStatusSummary()}</p>
				</div>

				{/* Error Display */}
				{error && (
					<div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
						<div className="flex items-center gap-2 text-red-700">
							<AlertTriangle className="w-4 h-4" />
							<span className="text-sm">{error}</span>
						</div>
					</div>
				)}

				{/* Warnings - Compact */}
				{securityStatus.warnings.length > 0 && (
					<div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
						<div className="flex items-center gap-2">
							<AlertTriangle className="w-4 h-4 text-yellow-600" />
							<span className="text-sm font-medium text-yellow-800">
								{securityStatus.warnings.length} Peringatan
							</span>
							<button
								onClick={() => setIsSecurityDetailOpen(!isSecurityDetailOpen)}
								className="ml-auto text-yellow-600"
							>
								{isSecurityDetailOpen ? (
									<ChevronDown className="w-4 h-4" />
								) : (
									<ChevronRight className="w-4 h-4" />
								)}
							</button>
						</div>

						{/* Collapsible Warning Details */}
						{isSecurityDetailOpen && (
							<div className="mt-2 space-y-1">
								{securityStatus.warnings.map((warning, index) => (
									<div key={index} className="text-xs text-yellow-700">
										• {warning}
									</div>
								))}
							</div>
						)}
					</div>
				)}
			</div>

			{/* Security Details Accordion */}
			<div className="bg-white border rounded-lg">
				<button
					onClick={() => setIsSecurityDetailOpen(!isSecurityDetailOpen)}
					className="w-full p-4 flex items-center justify-between hover:bg-gray-50"
				>
					<div className="flex items-center gap-2">
						{getSecurityIcon()}
						<span className="font-medium">Detail Keamanan</span>
						<span
							className={`text-sm font-medium text-${getSecurityColor()}-600`}
						>
							{securityStatus.confidence}%
						</span>
					</div>
					{isSecurityDetailOpen ? (
						<ChevronDown className="w-5 h-5 text-gray-400" />
					) : (
						<ChevronRight className="w-5 h-5 text-gray-400" />
					)}
				</button>

				{isSecurityDetailOpen && (
					<div className="px-4 pb-4 border-t">
						{/* Confidence Bar */}
						<div className="mb-3">
							<div className="flex justify-between text-xs text-gray-600 mb-1">
								<span>Tingkat Kepercayaan</span>
								<span>{securityStatus.confidence}%</span>
							</div>
							<div className="w-full bg-gray-200 rounded-full h-2">
								<div
									className={`h-2 rounded-full bg-${getSecurityColor()}-500 transition-all duration-300`}
									style={{ width: `${securityStatus.confidence}%` }}
								></div>
							</div>
						</div>

						{/* Security Checks */}
						<div className="space-y-2">
							<div className="flex items-center justify-between text-sm">
								<span>Mock Location:</span>
								<span
									className={`flex items-center gap-1 ${
										securityStatus.isMockLocation
											? "text-red-600"
											: "text-green-600"
									}`}
								>
									{securityStatus.isMockLocation ? (
										<XCircle className="w-4 h-4" />
									) : (
										<CheckCircle className="w-4 h-4" />
									)}
									{securityStatus.isMockLocation
										? "Terdeteksi"
										: "Tidak Terdeteksi"}
								</span>
							</div>

							<div className="flex items-center justify-between text-sm">
								<span>Kecepatan:</span>
								<span
									className={`flex items-center gap-1 ${
										securityStatus.isUnrealisticSpeed
											? "text-red-600"
											: "text-green-600"
									}`}
								>
									{securityStatus.isUnrealisticSpeed ? (
										<XCircle className="w-4 h-4" />
									) : (
										<CheckCircle className="w-4 h-4" />
									)}
									{securityStatus.isUnrealisticSpeed
										? "Tidak Realistis"
										: "Normal"}
								</span>
							</div>

							<div className="flex items-center justify-between text-sm">
								<span>Akurasi GPS:</span>
								<span
									className={`flex items-center gap-1 ${
										securityStatus.isLowAccuracy
											? "text-yellow-600"
											: "text-green-600"
									}`}
								>
									{securityStatus.isLowAccuracy ? (
										<AlertTriangle className="w-4 h-4" />
									) : (
										<CheckCircle className="w-4 h-4" />
									)}
									{securityStatus.isLowAccuracy ? "Rendah" : "Baik"}
								</span>
							</div>
						</div>

						{/* Location Info */}
						{currentLocation && (
							<div className="mt-3 pt-3 border-t space-y-2 text-sm">
								<div className="flex justify-between">
									<span className="text-gray-600">Jarak dari kantor:</span>
									<span
										className={`font-medium ${
											isLocationValid ? "text-green-600" : "text-red-600"
										}`}
									>
										{formatDistance(distanceFromOffice)}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-gray-600">Akurasi GPS:</span>
									<span className="font-medium">
										{formatAccuracy(currentLocation.accuracy)}
									</span>
								</div>
							</div>
						)}
					</div>
				)}
			</div>

			{/* Monitoring Controls Accordion */}
			<div className="bg-white border rounded-lg">
				<div className="p-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<Zap className="w-5 h-5 text-blue-600" />
							<span className="font-medium">Monitoring</span>
							{isWatching && (
								<div className="flex items-center gap-1">
									<div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
									<span className="text-xs text-green-600">Live</span>
								</div>
							)}
						</div>
						<div className="flex items-center gap-2">
							<button
								onClick={handleToggleMonitoring}
								className={`px-3 py-1 text-xs rounded-full transition-colors ${
									isWatching
										? "bg-red-100 text-red-700 hover:bg-red-200"
										: "bg-green-100 text-green-700 hover:bg-green-200"
								}`}
							>
								{isWatching ? "Stop" : "Start"}
							</button>
							<button
								onClick={() =>
									setIsMonitoringDetailOpen(!isMonitoringDetailOpen)
								}
								className="text-gray-400 hover:text-gray-600"
							>
								{isMonitoringDetailOpen ? (
									<ChevronDown className="w-5 h-5" />
								) : (
									<ChevronRight className="w-5 h-5" />
								)}
							</button>
						</div>
					</div>

					{isMonitoringDetailOpen && (
						<div className="mt-4 pt-4 border-t">
							{/* Location History */}
							{locationHistory.length > 0 && (
								<div className="text-sm">
									<span className="text-gray-600">Riwayat lokasi: </span>
									<span className="font-medium">
										{locationHistory.length} titik
									</span>
								</div>
							)}

							{/* Status Info */}
							<div className="mt-3 space-y-2 text-sm">
								<div className="flex justify-between">
									<span className="text-gray-600">Status:</span>
									<span
										className={`font-medium ${
											isLocationValid ? "text-green-600" : "text-red-600"
										}`}
									>
										{isWatching ? "Monitoring Aktif" : "Monitoring Nonaktif"}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-gray-600">Validasi Lokasi:</span>
									{isLocationValid ? (
										<span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
											Valid
										</span>
									) : (
										<span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
											Tidak Valid
										</span>
									)}
								</div>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Map Visualization - Collapsible */}
			{isMapVisible && currentLocation && (
				<div className="bg-white border rounded-lg p-4">
					<div className="flex items-center gap-2 mb-3">
						<Navigation className="w-5 h-5 text-blue-600" />
						<span className="font-medium">Peta Lokasi</span>
					</div>

					<div className="bg-gray-100 rounded-lg p-4 text-center">
						<div className="space-y-2 text-sm">
							<div>
								<span className="text-gray-600">Koordinat Anda:</span>
								<div className="font-mono text-xs">
									{currentLocation.latitude.toFixed(6)},{" "}
									{currentLocation.longitude.toFixed(6)}
								</div>
							</div>
							<div>
								<span className="text-gray-600">Koordinat Kantor:</span>
								<div className="font-mono text-xs">
									{officeCoords.latitude.toFixed(6)},{" "}
									{officeCoords.longitude.toFixed(6)}
								</div>
							</div>
							<div className="pt-2">
								<a
									href={`https://www.google.com/maps?q=${currentLocation.latitude},${currentLocation.longitude}`}
									target="_blank"
									rel="noopener noreferrer"
									className="text-blue-600 hover:text-blue-800 text-sm underline"
								>
									Buka di Google Maps
								</a>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default SecureLocationMap;
