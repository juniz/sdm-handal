"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
	Server, 
	Grid, 
	ArrowRightLeft, 
	Clock, 
	ShieldAlert, 
	ArrowLeft, 
	Plus, 
	ChevronRight,
	AlertCircle,
	ShieldCheck,
	History
} from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function ITAssetsDashboard() {
	const [stats, setStats] = useState({
		totalAssets: 0,
		available: 0,
		borrowed: 0,
		maintenance: 0,
		broken: 0,
		overdueLoans: 0,
		warrantyExpiring: 0,
	});
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchStats = async () => {
			try {
				const res = await fetch("/api/it-assets/dashboard");
				if (res.ok) {
					const data = await res.json();
					setStats(data);
				}
			} catch (error) {
				console.error("Failed to fetch dashboard stats", error);
			} finally {
				setLoading(false);
			}
		};
		fetchStats();
	}, []);

	return (
		<div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 space-y-8">
			{/* Header Section */}
			<div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
				<div className="space-y-1">
					<div className="flex items-center gap-2 text-sm font-medium text-slate-500">
						<Link href="/dashboard" className="hover:text-[#0093dd] transition-colors">Dashboard</Link>
						<ChevronRight size={14} />
						<span className="text-slate-900">IT Assets</span>
					</div>
					<h1 className="text-3xl font-bold tracking-tight text-slate-900">IT Command Center</h1>
					<p className="text-slate-500">Overview dan Manajemen Fisik Inventaris IT Rumah Sakit.</p>
				</div>
				<div className="flex items-center gap-3">
					<Button className="bg-[#0093dd] hover:bg-[#007bbd] text-white shadow-lg shadow-blue-200/50" asChild>
						<Link href="/dashboard/it-assets/master">
							<Plus size={18} className="mr-2" /> Tambah Aset Baru
						</Link>
					</Button>
				</div>
			</div>

			{/* KPI Stats Grid */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
				{/* Total Assets */}
				<StatCard 
					title="Total Invetaris"
					value={stats.totalAssets}
					subtitle="Seluruh unit terdaftar"
					icon={<Server className="text-blue-600" size={24} />}
					color="blue"
					loading={loading}
				/>
				{/* Available */}
				<StatCard 
					title="Unit Tersedia"
					value={stats.available}
					subtitle="Siap untuk digunakan"
					icon={<ShieldCheck className="text-emerald-600" size={24} />}
					color="emerald"
					loading={loading}
				/>
				{/* Borrowed */}
				<StatCard 
					title="Sedang Dipinjam"
					value={stats.borrowed}
					subtitle="Aktif di departemen"
					icon={<ArrowRightLeft className="text-amber-600" size={24} />}
					color="amber"
					loading={loading}
				/>
				{/* Maintenance/Issues */}
				<StatCard 
					title="Isu & Maintenance"
					value={stats.maintenance + stats.broken}
					subtitle="Perlu tindak lanjut"
					icon={<ShieldAlert className="text-rose-600" size={24} />}
					color="rose"
					loading={loading}
				/>
			</div>

			{/* Middle Section: Alerts & Notifications */}
			{(stats.overdueLoans > 0 || stats.warrantyExpiring > 0) && (
				<div className="space-y-4">
					<h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
						<AlertCircle className="text-rose-500" size={20} />
						Perhatian Segera
					</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{stats.overdueLoans > 0 && (
							<Card className="border-l-4 border-l-rose-500 bg-rose-50/50">
								<CardContent className="p-4 flex items-center justify-between">
									<div className="flex items-center gap-4">
										<div className="p-2 bg-rose-100 text-rose-600 rounded-full">
											<Clock size={20} />
										</div>
										<div>
											<p className="font-semibold text-rose-900">{stats.overdueLoans} Pinjaman Terlambat</p>
											<p className="text-xs text-rose-700">Melewati batas waktu pengembalian</p>
										</div>
									</div>
									<Button variant="ghost" size="sm" className="text-rose-600 hover:bg-rose-100" asChild>
										<Link href="/dashboard/it-assets/loans">Lihat Detail</Link>
									</Button>
								</CardContent>
							</Card>
						)}
						{stats.warrantyExpiring > 0 && (
							<Card className="border-l-4 border-l-amber-500 bg-amber-50/50">
								<CardContent className="p-4 flex items-center justify-between">
									<div className="flex items-center gap-4">
										<div className="p-2 bg-amber-100 text-amber-600 rounded-full">
											<ShieldAlert size={20} />
										</div>
										<div>
											<p className="font-semibold text-amber-900">{stats.warrantyExpiring} Garansi Akan Habis</p>
											<p className="text-xs text-amber-700">Berakhir dalam 30 hari ke depan</p>
										</div>
									</div>
									<Button variant="ghost" size="sm" className="text-amber-600 hover:bg-amber-100" asChild>
										<Link href="/dashboard/it-assets/master">Periksa Aset</Link>
									</Button>
								</CardContent>
							</Card>
						)}
					</div>
				</div>
			)}

			{/* Quick Access Menu */}
			<div className="space-y-4">
				<h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
					Akses Cepat Manajemen
				</h2>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					<MenuCard 
						href="/dashboard/it-assets/master"
						title="Master Data Aset"
						description="Database lengkap seluruh unit hardware, spesifikasi, dan lokasi penyimpanan."
						icon={<Grid size={28} />}
						theme="blue"
					/>
					<MenuCard 
						href="/dashboard/it-assets/loans"
						title="Sistem Peminjaman"
						description="Kelola alur serah terima unit, riwayat peminjam, dan status pengembalian."
						icon={<ArrowRightLeft size={28} />}
						theme="emerald"
					/>
					<MenuCard 
						href="/dashboard/it-assets/logs"
						title="Audit & Aktivitas"
						description="Log historis mutasi aset, perubahan status, dan catatan pembersihan data."
						icon={<History size={28} />}
						theme="slate"
					/>
				</div>
			</div>
		</div>
	);
}

function StatCard({ title, value, subtitle, icon, color, loading }) {
	const colors = {
		blue: "from-blue-500/10 to-transparent border-blue-100 shadow-blue-100/50",
		emerald: "from-emerald-500/10 to-transparent border-emerald-100 shadow-emerald-100/50",
		amber: "from-amber-500/10 to-transparent border-amber-100 shadow-amber-100/50",
		rose: "from-rose-500/10 to-transparent border-rose-100 shadow-rose-100/50",
	};

	return (
		<Card className={`relative overflow-hidden border bg-white group hover:shadow-xl transition-all duration-300 ${colors[color]}`}>
			<div className={`absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-500`}>
				{React.cloneElement(icon, { size: 64 })}
			</div>
			<CardHeader className="pb-2">
				<div className="flex items-center justify-between">
					<span className="text-sm font-medium text-slate-500">{title}</span>
					<div className={`p-2 bg-white rounded-lg shadow-sm border border-slate-100`}>
						{icon}
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<div className="text-3xl font-bold text-slate-900 tracking-tight">
					{loading ? <Skeleton className="h-9 w-20" /> : value}
				</div>
				<p className="text-xs text-slate-500 mt-1 font-medium select-none">{subtitle}</p>
			</CardContent>
		</Card>
	);
}

function MenuCard({ href, title, description, icon, theme }) {
	const themes = {
		blue: "bg-blue-50 text-blue-600 border-blue-100 group-hover:bg-[#0093dd] group-hover:text-white",
		emerald: "bg-emerald-50 text-emerald-600 border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white",
		slate: "bg-slate-100 text-slate-600 border-slate-200 group-hover:bg-slate-900 group-hover:text-white",
	};

	return (
		<Link href={href} className="group block focus:outline-none focus:ring-2 focus:ring-[#0093dd] rounded-2xl transition-all">
			<Card className="h-full border-2 border-slate-100 group-hover:border-transparent group-hover:shadow-2xl group-hover:-translate-y-1 transition-all duration-300 rounded-2xl overflow-hidden bg-white">
				<CardContent className="p-8 space-y-4">
					<div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${themes[theme]}`}>
						{icon}
					</div>
					<div className="space-y-2">
						<CardTitle className="text-xl group-hover:text-slate-900 transition-colors">{title}</CardTitle>
						<p className="text-slate-500 font-normal text-sm leading-relaxed group-hover:text-slate-600 flex items-center gap-1">
							{description}
						</p>
					</div>
					<div className="pt-2 flex items-center text-[#0093dd] font-semibold text-sm opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300">
						Buka Menu <ChevronRight size={16} />
					</div>
				</CardContent>
			</Card>
		</Link>
	);
}
