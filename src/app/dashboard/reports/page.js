"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
	BarChart3,
	Calendar,
	TrendingUp,
	Users,
	Clock,
	Trophy,
	FileText,
	ArrowRight,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function ReportsPage() {
	const router = useRouter();

	const reportMenus = [
		{
			id: "monthly-attendance",
			title: "Laporan Presensi Bulanan",
			description:
				"Analisis kinerja presensi pegawai per bulan dengan sistem perangkingan berdasarkan kedisiplinan dan ketepatan waktu",
			icon: Calendar,
			color: "bg-blue-50 text-blue-600 border-blue-200",
			iconColor: "text-blue-600",
			features: [
				"Perangkingan berdasarkan skor kinerja",
				"Statistik tepat waktu vs terlambat",
				"Top 10 pegawai terbaik dan terburuk",
				"Filter per departemen dan bulan",
				"Export data ke CSV",
			],
			href: "/dashboard/reports/monthly-attendance",
		},
		// Placeholder untuk laporan lainnya yang bisa ditambahkan nanti
		{
			id: "yearly-summary",
			title: "Ringkasan Tahunan",
			description:
				"Laporan komprehensif kinerja presensi seluruh pegawai dalam satu tahun",
			icon: BarChart3,
			color: "bg-green-50 text-green-600 border-green-200",
			iconColor: "text-green-600",
			features: [
				"Tren presensi sepanjang tahun",
				"Perbandingan antar departemen",
				"Analisis pola keterlambatan",
				"Grafik visualisasi data",
			],
			href: "#",
			comingSoon: true,
		},
		{
			id: "department-analysis",
			title: "Analisis per Departemen",
			description:
				"Perbandingan kinerja presensi antar departemen dengan metrik detail",
			icon: Users,
			color: "bg-purple-50 text-purple-600 border-purple-200",
			iconColor: "text-purple-600",
			features: [
				"Ranking departemen terbaik",
				"Rata-rata skor per departemen",
				"Identifikasi area perbaikan",
				"Rekomendasi tindakan",
			],
			href: "#",
			comingSoon: true,
		},
	];

	const handleNavigate = (href, comingSoon) => {
		if (comingSoon) {
			alert("Fitur ini akan segera hadir!");
			return;
		}
		router.push(href);
	};

	return (
		<div className="container mx-auto p-6 space-y-6">
			{/* Header */}
			<div className="text-center space-y-2">
				<h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-3">
					<FileText className="h-8 w-8 text-blue-600" />
					Pusat Laporan
				</h1>
				<p className="text-gray-600 max-w-2xl mx-auto">
					Akses berbagai laporan dan analisis data presensi pegawai untuk
					mendukung pengambilan keputusan yang lebih baik
				</p>
			</div>

			{/* Quick Stats */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-gray-600">
									Total Laporan
								</p>
								<p className="text-2xl font-bold text-gray-900">3</p>
							</div>
							<BarChart3 className="h-8 w-8 text-blue-600" />
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-gray-600">Tersedia</p>
								<p className="text-2xl font-bold text-green-600">1</p>
							</div>
							<Trophy className="h-8 w-8 text-green-600" />
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-gray-600">
									Segera Hadir
								</p>
								<p className="text-2xl font-bold text-yellow-600">2</p>
							</div>
							<Clock className="h-8 w-8 text-yellow-600" />
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-gray-600">Kategori</p>
								<p className="text-2xl font-bold text-purple-600">3</p>
							</div>
							<TrendingUp className="h-8 w-8 text-purple-600" />
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Report Menus */}
			<div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
				{reportMenus.map((report) => {
					const IconComponent = report.icon;
					return (
						<Card
							key={report.id}
							className={`relative overflow-hidden border-2 ${report.color} hover:shadow-lg transition-all duration-200`}
						>
							{report.comingSoon && (
								<div className="absolute top-4 right-4 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-semibold">
									Segera Hadir
								</div>
							)}
							<CardHeader className="pb-4">
								<div className="flex items-start justify-between">
									<div className="flex items-center gap-3">
										<div className={`p-2 rounded-lg ${report.color}`}>
											<IconComponent
												className={`h-6 w-6 ${report.iconColor}`}
											/>
										</div>
										<div>
											<CardTitle className="text-lg font-semibold text-gray-900">
												{report.title}
											</CardTitle>
										</div>
									</div>
								</div>
								<p className="text-sm text-gray-600 mt-2">
									{report.description}
								</p>
							</CardHeader>
							<CardContent className="pt-0">
								<div className="space-y-3">
									<div>
										<h4 className="text-sm font-semibold text-gray-700 mb-2">
											Fitur Utama:
										</h4>
										<ul className="space-y-1">
											{report.features.map((feature, index) => (
												<li
													key={index}
													className="text-xs text-gray-600 flex items-center gap-2"
												>
													<div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
													{feature}
												</li>
											))}
										</ul>
									</div>
									<Button
										onClick={() =>
											handleNavigate(report.href, report.comingSoon)
										}
										className={`w-full mt-4 ${
											report.comingSoon ? "opacity-50 cursor-not-allowed" : ""
										}`}
										disabled={report.comingSoon}
									>
										{report.comingSoon ? (
											<>
												<Clock className="h-4 w-4 mr-2" />
												Segera Hadir
											</>
										) : (
											<>
												Buka Laporan
												<ArrowRight className="h-4 w-4 ml-2" />
											</>
										)}
									</Button>
								</div>
							</CardContent>
						</Card>
					);
				})}
			</div>

			{/* Information Section */}
			<Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
				<CardHeader>
					<CardTitle className="text-lg font-semibold text-blue-900">
						Tentang Sistem Perangkingan
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div>
							<h4 className="font-semibold text-blue-800 mb-2">
								Metode Penilaian:
							</h4>
							<ul className="space-y-1 text-sm text-blue-700">
								<li>
									• <strong>Skor Dasar:</strong> 100 poin untuk setiap pegawai
								</li>
								<li>
									• <strong>Terlambat Toleransi:</strong> -5 poin per kejadian
								</li>
								<li>
									• <strong>Terlambat I:</strong> -10 poin per kejadian
								</li>
								<li>
									• <strong>Terlambat II:</strong> -15 poin per kejadian
								</li>
							</ul>
						</div>
						<div>
							<h4 className="font-semibold text-blue-800 mb-2">
								Kategori Kinerja:
							</h4>
							<ul className="space-y-1 text-sm text-blue-700">
								<li>
									• <strong>90-100:</strong> Sangat Baik
								</li>
								<li>
									• <strong>75-89:</strong> Baik
								</li>
								<li>
									• <strong>60-74:</strong> Cukup
								</li>
								<li>
									• <strong>0-59:</strong> Perlu Perbaikan
								</li>
							</ul>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
