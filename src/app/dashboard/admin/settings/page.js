"use client";

import { Settings, Database, Shield, AlertTriangle } from "lucide-react";

export default function AdminSettingsPage() {
	return (
		<div className="max-w-4xl mx-auto p-6">
			<div className="mb-8">
				<h1 className="text-2xl font-bold text-gray-900 mb-2">
					System Settings
				</h1>
				<p className="text-gray-600">
					Konfigurasi dan pengaturan sistem aplikasi SDM
				</p>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				<div className="bg-white p-6 rounded-lg shadow-sm border">
					<div className="flex items-center gap-3 mb-4">
						<Database className="w-8 h-8 text-blue-500" />
						<h3 className="text-lg font-medium">Database</h3>
					</div>
					<p className="text-gray-600 text-sm mb-4">
						Konfigurasi koneksi database dan backup
					</p>
					<button className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm">
						Kelola Database
					</button>
				</div>

				<div className="bg-white p-6 rounded-lg shadow-sm border">
					<div className="flex items-center gap-3 mb-4">
						<Shield className="w-8 h-8 text-green-500" />
						<h3 className="text-lg font-medium">Security</h3>
					</div>
					<p className="text-gray-600 text-sm mb-4">
						Pengaturan keamanan dan akses kontrol
					</p>
					<button className="w-full px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm">
						Pengaturan Keamanan
					</button>
				</div>

				<div className="bg-white p-6 rounded-lg shadow-sm border">
					<div className="flex items-center gap-3 mb-4">
						<AlertTriangle className="w-8 h-8 text-orange-500" />
						<h3 className="text-lg font-medium">Monitoring</h3>
					</div>
					<p className="text-gray-600 text-sm mb-4">
						Monitor performa dan kesehatan sistem
					</p>
					<button className="w-full px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 text-sm">
						Lihat Monitoring
					</button>
				</div>
			</div>

			<div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
				<div className="flex items-center gap-2">
					<Settings className="w-5 h-5 text-blue-500" />
					<h4 className="font-medium text-blue-900">Status Development</h4>
				</div>
				<p className="text-blue-700 text-sm mt-2">
					Halaman ini sedang dalam pengembangan. Saat ini yang tersedia adalah{" "}
					<strong>Error Logs</strong> untuk monitoring error aplikasi.
				</p>
			</div>
		</div>
	);
}
