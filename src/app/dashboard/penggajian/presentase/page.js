"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
	Loader2, 
	PieChart, 
	Building2, 
	Users, 
	Calculator,
	Plus,
	ChevronRight,
	AlertCircle,
	CheckCircle2
} from "lucide-react";
import { toast } from "sonner";

// Import komponen
import KategoriPresentase from "@/components/presentase/KategoriPresentase";
import UnitPresentase from "@/components/presentase/UnitPresentase";
import PegawaiPresentase from "@/components/presentase/PegawaiPresentase";
import KalkulasiDistribusi from "@/components/presentase/KalkulasiDistribusi";

export default function PresentaseGajiPage() {
	const [loading, setLoading] = useState(true);
	const [summary, setSummary] = useState(null);
	const [activeTab, setActiveTab] = useState("kategori");

	// Fetch summary data
	const fetchSummary = useCallback(async () => {
		try {
			const response = await fetch("/api/presentase/kalkulasi");
			if (response.ok) {
				const result = await response.json();
				setSummary(result.data);
			}
		} catch (error) {
			console.error("Error fetching summary:", error);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchSummary();
	}, [fetchSummary]);

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<Loader2 className="w-8 h-8 animate-spin" />
			</div>
		);
	}

	return (
		<div className="container mx-auto p-4 md:p-6 space-y-6">
			{/* Header */}
			<div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-start md:space-y-0">
				<div>
					<h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
						<PieChart className="w-8 h-8 text-emerald-600" />
						Pengaturan Persentase Jasa
					</h1>
					<p className="text-gray-600 mt-2">
						Kelola distribusi persentase jasa rumah sakit secara berjenjang: 
						Kategori → Unit/Departemen → Pegawai
					</p>
				</div>
			</div>

			{/* Summary Cards */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-emerald-600 font-medium">Total Kategori</p>
								<p className="text-2xl font-bold text-emerald-700">
									{summary?.summary?.jumlah_kategori || 0}
								</p>
							</div>
							<div className="w-12 h-12 bg-emerald-200 rounded-full flex items-center justify-center">
								<PieChart className="w-6 h-6 text-emerald-700" />
							</div>
						</div>
						<div className="mt-2">
							<div className="flex justify-between text-xs text-emerald-600">
								<span>Terpakai</span>
								<span>{summary?.summary?.total_kategori_pct || 0}%</span>
							</div>
							<div className="w-full bg-emerald-200 rounded-full h-2 mt-1">
								<div 
									className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
									style={{ width: `${summary?.summary?.total_kategori_pct || 0}%` }}
								/>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-blue-600 font-medium">Total Unit</p>
								<p className="text-2xl font-bold text-blue-700">
									{summary?.summary?.jumlah_unit || 0}
								</p>
							</div>
							<div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
								<Building2 className="w-6 h-6 text-blue-700" />
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-purple-600 font-medium">Pegawai Aktif</p>
								<p className="text-2xl font-bold text-purple-700">
									{summary?.summary?.jumlah_pegawai_aktif || 0}
								</p>
							</div>
							<div className="w-12 h-12 bg-purple-200 rounded-full flex items-center justify-center">
								<Users className="w-6 h-6 text-purple-700" />
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-amber-600 font-medium">Sisa Alokasi</p>
								<p className="text-2xl font-bold text-amber-700">
									{(100 - (summary?.summary?.total_kategori_pct || 0)).toFixed(2)}%
								</p>
							</div>
							<div className="w-12 h-12 bg-amber-200 rounded-full flex items-center justify-center">
								<Calculator className="w-6 h-6 text-amber-700" />
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Flow Diagram */}
			<Card className="bg-gradient-to-r from-gray-50 to-gray-100">
				<CardContent className="p-4">
					<div className="flex items-center justify-center gap-2 text-sm">
						<div className="flex items-center gap-2 px-4 py-2 bg-emerald-100 rounded-lg">
							<PieChart className="w-4 h-4 text-emerald-600" />
							<span className="font-medium text-emerald-700">Total Jasa RS</span>
						</div>
						<ChevronRight className="w-5 h-5 text-gray-400" />
						<div className="flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-lg">
							<Building2 className="w-4 h-4 text-blue-600" />
							<span className="font-medium text-blue-700">Kategori</span>
						</div>
						<ChevronRight className="w-5 h-5 text-gray-400" />
						<div className="flex items-center gap-2 px-4 py-2 bg-purple-100 rounded-lg">
							<Building2 className="w-4 h-4 text-purple-600" />
							<span className="font-medium text-purple-700">Unit/Dept</span>
						</div>
						<ChevronRight className="w-5 h-5 text-gray-400" />
						<div className="flex items-center gap-2 px-4 py-2 bg-amber-100 rounded-lg">
							<Users className="w-4 h-4 text-amber-600" />
							<span className="font-medium text-amber-700">Pegawai</span>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Main Content Tabs */}
			<Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
				<TabsList className="grid w-full grid-cols-4 h-auto">
					<TabsTrigger value="kategori" className="data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-700 py-3">
						<PieChart className="w-4 h-4 mr-2" />
						Kategori
					</TabsTrigger>
					<TabsTrigger value="unit" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 py-3">
						<Building2 className="w-4 h-4 mr-2" />
						Unit
					</TabsTrigger>
					<TabsTrigger value="pegawai" className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700 py-3">
						<Users className="w-4 h-4 mr-2" />
						Pegawai
					</TabsTrigger>
					<TabsTrigger value="kalkulasi" className="data-[state=active]:bg-amber-100 data-[state=active]:text-amber-700 py-3">
						<Calculator className="w-4 h-4 mr-2" />
						Kalkulasi
					</TabsTrigger>
				</TabsList>

				<TabsContent value="kategori">
					<KategoriPresentase onDataChange={fetchSummary} />
				</TabsContent>

				<TabsContent value="unit">
					<UnitPresentase onDataChange={fetchSummary} />
				</TabsContent>

				<TabsContent value="pegawai">
					<PegawaiPresentase onDataChange={fetchSummary} />
				</TabsContent>

				<TabsContent value="kalkulasi">
					<KalkulasiDistribusi />
				</TabsContent>
			</Tabs>
		</div>
	);
}

