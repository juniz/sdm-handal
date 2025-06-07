"use client";

import { useState, useEffect } from "react";
import {
	MapPin,
	Settings,
	Save,
	AlertTriangle,
	CheckCircle,
} from "lucide-react";

const RadiusSettings = () => {
	const [settings, setSettings] = useState({
		officeLatitude: "",
		officeLongitude: "",
		allowedRadius: "",
	});
	const [isEditing, setIsEditing] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [message, setMessage] = useState("");

	useEffect(() => {
		loadSettings();
	}, []);

	const loadSettings = () => {
		// Ambil dari environment variables yang ada di client side
		setSettings({
			officeLatitude: process.env.NEXT_PUBLIC_OFFICE_LAT || "",
			officeLongitude: process.env.NEXT_PUBLIC_OFFICE_LNG || "",
			allowedRadius: process.env.NEXT_PUBLIC_ALLOWED_RADIUS || "500",
		});
	};

	const handleSave = async () => {
		setIsSaving(true);
		try {
			// Validasi input
			const lat = parseFloat(settings.officeLatitude);
			const lng = parseFloat(settings.officeLongitude);
			const radius = parseFloat(settings.allowedRadius);

			if (isNaN(lat) || isNaN(lng) || isNaN(radius)) {
				throw new Error("Input tidak valid");
			}

			if (lat < -90 || lat > 90) {
				throw new Error("Latitude harus antara -90 dan 90");
			}

			if (lng < -180 || lng > 180) {
				throw new Error("Longitude harus antara -180 dan 180");
			}

			if (radius <= 0 || radius > 10000) {
				throw new Error("Radius harus antara 1 dan 10000 meter");
			}

			// Simulasi save (dalam implementasi nyata, ini akan save ke database atau file config)
			await new Promise((resolve) => setTimeout(resolve, 1000));

			setMessage(
				"✅ Pengaturan berhasil disimpan! Restart aplikasi untuk menerapkan perubahan."
			);
			setIsEditing(false);
		} catch (error) {
			setMessage(`❌ Error: ${error.message}`);
		} finally {
			setIsSaving(false);
		}
	};

	const handleCancel = () => {
		loadSettings();
		setIsEditing(false);
		setMessage("");
	};

	const formatCoordinate = (value, type) => {
		const num = parseFloat(value);
		if (isNaN(num)) return value;
		return `${num.toFixed(6)}° ${
			type === "lat" ? (num >= 0 ? "N" : "S") : num >= 0 ? "E" : "W"
		}`;
	};

	const getRadiusDescription = (radius) => {
		const r = parseFloat(radius);
		if (isNaN(r)) return "";

		if (r < 100) return "Sangat ketat - hanya dalam gedung";
		if (r < 300) return "Ketat - area gedung dan parkiran";
		if (r < 1000) return "Normal - area kompleks kantor";
		if (r < 2000) return "Luas - area sekitar kantor";
		return "Sangat luas - area yang besar";
	};

	return (
		<div className="bg-white rounded-lg shadow-sm p-6">
			<div className="flex items-center gap-3 mb-6">
				<div className="p-2 bg-blue-100 rounded-lg">
					<MapPin className="w-6 h-6 text-blue-600" />
				</div>
				<div>
					<h2 className="text-xl font-semibold text-gray-900">
						Pengaturan Radius Presensi
					</h2>
					<p className="text-sm text-gray-600">
						Konfigurasi lokasi kantor dan radius yang diperbolehkan untuk
						presensi
					</p>
				</div>
			</div>

			{message && (
				<div
					className={`mb-4 p-3 rounded-lg ${
						message.includes("✅")
							? "bg-green-50 text-green-700 border border-green-200"
							: "bg-red-50 text-red-700 border border-red-200"
					}`}
				>
					{message}
				</div>
			)}

			<div className="space-y-6">
				{/* Lokasi Kantor */}
				<div>
					<h3 className="text-lg font-medium text-gray-900 mb-3">
						Lokasi Kantor
					</h3>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Latitude
							</label>
							{isEditing ? (
								<input
									type="number"
									step="0.000001"
									value={settings.officeLatitude}
									onChange={(e) =>
										setSettings((prev) => ({
											...prev,
											officeLatitude: e.target.value,
										}))
									}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
									placeholder="-7.5999859439332385"
								/>
							) : (
								<div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm">
									{formatCoordinate(settings.officeLatitude, "lat")}
								</div>
							)}
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Longitude
							</label>
							{isEditing ? (
								<input
									type="number"
									step="0.000001"
									value={settings.officeLongitude}
									onChange={(e) =>
										setSettings((prev) => ({
											...prev,
											officeLongitude: e.target.value,
										}))
									}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
									placeholder="111.89475136290345"
								/>
							) : (
								<div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm">
									{formatCoordinate(settings.officeLongitude, "lng")}
								</div>
							)}
						</div>
					</div>
				</div>

				{/* Radius */}
				<div>
					<h3 className="text-lg font-medium text-gray-900 mb-3">
						Radius Presensi
					</h3>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Radius yang Diperbolehkan (meter)
						</label>
						{isEditing ? (
							<div className="space-y-2">
								<input
									type="number"
									min="1"
									max="10000"
									value={settings.allowedRadius}
									onChange={(e) =>
										setSettings((prev) => ({
											...prev,
											allowedRadius: e.target.value,
										}))
									}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
									placeholder="500"
								/>
								<p className="text-sm text-gray-600">
									{getRadiusDescription(settings.allowedRadius)}
								</p>
							</div>
						) : (
							<div className="space-y-2">
								<div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
									<span className="text-lg font-medium">
										{settings.allowedRadius} meter
									</span>
								</div>
								<p className="text-sm text-gray-600">
									{getRadiusDescription(settings.allowedRadius)}
								</p>
							</div>
						)}
					</div>
				</div>

				{/* Pratinjau Area */}
				<div>
					<h3 className="text-lg font-medium text-gray-900 mb-3">
						Pratinjau Area
					</h3>
					<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
						<div className="flex items-start gap-3">
							<AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
							<div>
								<p className="text-sm text-blue-800 font-medium">
									Informasi Area Presensi
								</p>
								<ul className="text-sm text-blue-700 mt-2 space-y-1">
									<li>
										• Lokasi kantor:{" "}
										{formatCoordinate(settings.officeLatitude, "lat")},{" "}
										{formatCoordinate(settings.officeLongitude, "lng")}
									</li>
									<li>
										• Radius yang diperbolehkan: {settings.allowedRadius} meter
									</li>
									<li>
										• Pegawai dapat melakukan presensi dalam radius ini dari
										titik pusat kantor
									</li>
									<li>
										• Semakin besar radius, semakin longgar validasi lokasi
									</li>
								</ul>
							</div>
						</div>
					</div>
				</div>

				{/* Action Buttons */}
				<div className="flex items-center justify-between pt-4 border-t border-gray-200">
					{!isEditing ? (
						<button
							onClick={() => setIsEditing(true)}
							className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
						>
							<Settings className="w-4 h-4" />
							Edit Pengaturan
						</button>
					) : (
						<div className="flex items-center gap-3">
							<button
								onClick={handleSave}
								disabled={isSaving}
								className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
							>
								{isSaving ? (
									<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
								) : (
									<Save className="w-4 h-4" />
								)}
								{isSaving ? "Menyimpan..." : "Simpan"}
							</button>
							<button
								onClick={handleCancel}
								disabled={isSaving}
								className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
							>
								Batal
							</button>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default RadiusSettings;
