"use client";

import { useState } from "react";
import RadiusSettings from "@/components/RadiusSettings";
import { MapPin, Shield, Cog, Info } from "lucide-react";

export default function LocationSettingsPage() {
	const [activeTab, setActiveTab] = useState("radius");

	const tabs = [
		{
			id: "radius",
			label: "Radius Presensi",
			icon: MapPin,
			description: "Pengaturan lokasi kantor dan radius yang diperbolehkan",
		},
		{
			id: "security",
			label: "Keamanan Lokasi",
			icon: Shield,
			description: "Konfigurasi validasi dan deteksi keamanan",
		},
		{
			id: "advanced",
			label: "Advanced",
			icon: Cog,
			description: "Pengaturan lanjutan untuk sistem lokasi",
		},
	];

	const SecuritySettings = () => (
		<div className="bg-white rounded-lg shadow-sm p-6">
			<div className="flex items-center gap-3 mb-6">
				<div className="p-2 bg-red-100 rounded-lg">
					<Shield className="w-6 h-6 text-red-600" />
				</div>
				<div>
					<h2 className="text-xl font-semibold text-gray-900">
						Pengaturan Keamanan Lokasi
					</h2>
					<p className="text-sm text-gray-600">
						Konfigurasi sistem deteksi dan validasi keamanan lokasi
					</p>
				</div>
			</div>

			<div className="space-y-6">
				<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
					<div className="flex items-start gap-3">
						<Info className="w-5 h-5 text-yellow-600 mt-0.5" />
						<div>
							<p className="text-sm text-yellow-800 font-medium">
								Environment Variables
							</p>
							<p className="text-sm text-yellow-700 mt-1">
								Pengaturan keamanan dikontrol melalui file .env:
							</p>
							<div className="mt-3 bg-yellow-100 rounded p-3 font-mono text-sm">
								<div>ENABLE_LOCATION_CHECK=true</div>
								<div>ENABLE_SECURITY_VALIDATION=true</div>
							</div>
						</div>
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div className="space-y-4">
						<h3 className="text-lg font-medium text-gray-900">
							Deteksi Mock Location
						</h3>
						<div className="space-y-3">
							<div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
								<span className="text-sm">GPS Accuracy Threshold</span>
								<span className="text-sm text-gray-600">50 meter</span>
							</div>
							<div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
								<span className="text-sm">Speed Threshold</span>
								<span className="text-sm text-gray-600">120 km/h</span>
							</div>
							<div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
								<span className="text-sm">Mock Location Detection</span>
								<span className="text-sm text-green-600">Aktif</span>
							</div>
						</div>
					</div>

					<div className="space-y-4">
						<h3 className="text-lg font-medium text-gray-900">
							Confidence Level
						</h3>
						<div className="space-y-3">
							<div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
								<span className="text-sm">Minimum Confidence</span>
								<span className="text-sm text-gray-600">60%</span>
							</div>
							<div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
								<span className="text-sm">High Security (&gt;80%)</span>
								<span className="text-sm text-green-600">Aman</span>
							</div>
							<div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
								<span className="text-sm">Low Security (&lt;40%)</span>
								<span className="text-sm text-red-600">Ditolak</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);

	const AdvancedSettings = () => (
		<div className="bg-white rounded-lg shadow-sm p-6">
			<div className="flex items-center gap-3 mb-6">
				<div className="p-2 bg-purple-100 rounded-lg">
					<Cog className="w-6 h-6 text-purple-600" />
				</div>
				<div>
					<h2 className="text-xl font-semibold text-gray-900">
						Pengaturan Advanced
					</h2>
					<p className="text-sm text-gray-600">
						Konfigurasi sistem tingkat lanjut dan monitoring
					</p>
				</div>
			</div>

			<div className="space-y-6">
				<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
					<h3 className="text-lg font-medium text-blue-900 mb-3">
						Current Environment
					</h3>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
						<div>
							<div className="font-medium text-blue-800">Lokasi Kantor:</div>
							<div className="text-blue-700 font-mono">
								{process.env.NEXT_PUBLIC_OFFICE_LAT},{" "}
								{process.env.NEXT_PUBLIC_OFFICE_LNG}
							</div>
						</div>
						<div>
							<div className="font-medium text-blue-800">Radius:</div>
							<div className="text-blue-700 font-mono">
								{process.env.NEXT_PUBLIC_ALLOWED_RADIUS} meter
							</div>
						</div>
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div>
						<h3 className="text-lg font-medium text-gray-900 mb-3">
							Monitoring
						</h3>
						<div className="space-y-3">
							<div className="p-3 border border-gray-200 rounded-lg">
								<div className="text-sm font-medium">Location History</div>
								<div className="text-xs text-gray-600 mt-1">
									Menyimpan riwayat 10 lokasi terakhir untuk analisis pola
								</div>
							</div>
							<div className="p-3 border border-gray-200 rounded-lg">
								<div className="text-sm font-medium">Security Logs</div>
								<div className="text-xs text-gray-600 mt-1">
									Log semua aktivitas keamanan dan deteksi anomali
								</div>
							</div>
						</div>
					</div>

					<div>
						<h3 className="text-lg font-medium text-gray-900 mb-3">
							Performance
						</h3>
						<div className="space-y-3">
							<div className="p-3 border border-gray-200 rounded-lg">
								<div className="text-sm font-medium">Watch Interval</div>
								<div className="text-xs text-gray-600 mt-1">
									Update lokasi setiap 5 detik saat monitoring aktif
								</div>
							</div>
							<div className="p-3 border border-gray-200 rounded-lg">
								<div className="text-sm font-medium">Cache Timeout</div>
								<div className="text-xs text-gray-600 mt-1">
									Cache lokasi maksimal 30 detik untuk efisiensi
								</div>
							</div>
						</div>
					</div>
				</div>

				<div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
					<h3 className="text-lg font-medium text-gray-900 mb-3">
						System Information
					</h3>
					<div className="text-sm text-gray-600 space-y-1">
						<div>
							• Sistem menggunakan Haversine formula untuk kalkulasi jarak
						</div>
						<div>• Deteksi mock location menggunakan multiple validation</div>
						<div>
							• Confidence level dihitung berdasarkan 6 parameter keamanan
						</div>
						<div>
							• GPS accuracy threshold disesuaikan dengan kondisi Indonesia
						</div>
					</div>
				</div>
			</div>
		</div>
	);

	const renderTabContent = () => {
		switch (activeTab) {
			case "radius":
				return <RadiusSettings />;
			case "security":
				return <SecuritySettings />;
			case "advanced":
				return <AdvancedSettings />;
			default:
				return <RadiusSettings />;
		}
	};

	return (
		<div className="max-w-6xl mx-auto space-y-6">
			<div className="bg-white rounded-lg shadow-sm p-6">
				<h1 className="text-2xl font-semibold text-gray-900 mb-2">
					Pengaturan Lokasi & Keamanan
				</h1>
				<p className="text-gray-600">
					Kelola konfigurasi sistem lokasi, radius presensi, dan pengaturan
					keamanan.
				</p>
			</div>

			{/* Tabs */}
			<div className="bg-white rounded-lg shadow-sm">
				<div className="border-b border-gray-200">
					<nav className="flex space-x-8 px-6">
						{tabs.map((tab) => {
							const Icon = tab.icon;
							return (
								<button
									key={tab.id}
									onClick={() => setActiveTab(tab.id)}
									className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
										activeTab === tab.id
											? "border-blue-500 text-blue-600"
											: "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
									}`}
								>
									<Icon className="w-4 h-4" />
									{tab.label}
								</button>
							);
						})}
					</nav>
				</div>
			</div>

			{/* Tab Content */}
			{renderTabContent()}
		</div>
	);
}
