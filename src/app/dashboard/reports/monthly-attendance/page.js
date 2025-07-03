"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Trophy,
	TrendingDown,
	Users,
	Calendar,
	Clock,
	AlertTriangle,
	Download,
	Filter,
	Search,
	Medal,
	Award,
	ChevronDown,
	Building2,
	RefreshCw,
	X,
} from "lucide-react";
import moment from "moment";

export default function MonthlyAttendanceReport() {
	const [data, setData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [searchLoading, setSearchLoading] = useState(false);

	// Separate applied filters from form inputs
	const [appliedFilters, setAppliedFilters] = useState({
		month: moment().format("YYYY-MM"),
		department: "ALL",
		search: "",
	});

	const [formFilters, setFormFilters] = useState({
		month: moment().format("YYYY-MM"),
		department: "ALL",
		search: "",
	});

	const [pagination, setPagination] = useState({
		limit: 50,
		offset: 0,
	});
	const [departmentSearch, setDepartmentSearch] = useState("");
	const [filteredDepartments, setFilteredDepartments] = useState([]);

	const fetchData = useCallback(
		async (filters = appliedFilters) => {
			setSearchLoading(true);
			try {
				const params = new URLSearchParams({
					month: filters.month,
					department: filters.department,
					limit: pagination.limit.toString(),
					offset: pagination.offset.toString(),
				});

				// Only add search param if it's not empty
				if (filters.search.trim()) {
					params.append("search", filters.search.trim());
				}

				const response = await fetch(
					`/api/reports/monthly-attendance?${params}`
				);
				const result = await response.json();

				if (result.status === "success") {
					setData(result.data);
					setFilteredDepartments(result.data.departments || []);
				} else {
					console.error("Error:", result.error);
				}
			} catch (error) {
				console.error("Error fetching data:", error);
			} finally {
				setLoading(false);
				setSearchLoading(false);
			}
		},
		[appliedFilters, pagination.limit, pagination.offset]
	);

	// Initial load
	useEffect(() => {
		fetchData();
	}, []);

	// Refetch when applied filters or pagination changes
	useEffect(() => {
		if (!loading) {
			fetchData();
		}
	}, [appliedFilters, pagination, fetchData]);

	// Filter departments based on search
	useEffect(() => {
		if (data?.departments) {
			const filtered = data.departments.filter((dept) =>
				dept.nama.toLowerCase().includes(departmentSearch.toLowerCase())
			);
			setFilteredDepartments(filtered);
		}
	}, [departmentSearch, data?.departments]);

	const handleFormFilterChange = (key, value) => {
		setFormFilters((prev) => ({ ...prev, [key]: value }));

		// Auto-apply for month and department changes (not search)
		if (key !== "search") {
			setAppliedFilters((prev) => ({ ...prev, [key]: value }));
			setPagination((prev) => ({ ...prev, offset: 0 }));
		}
	};

	const handleSearch = () => {
		setAppliedFilters(formFilters);
		setPagination((prev) => ({ ...prev, offset: 0 }));
	};

	const handleClearSearch = () => {
		const clearedFilters = {
			...formFilters,
			search: "",
		};
		setFormFilters(clearedFilters);
		setAppliedFilters(clearedFilters);
		setPagination((prev) => ({ ...prev, offset: 0 }));
	};

	const handleResetFilters = () => {
		const defaultFilters = {
			month: moment().format("YYYY-MM"),
			department: "ALL",
			search: "",
		};
		setFormFilters(defaultFilters);
		setAppliedFilters(defaultFilters);
		setPagination((prev) => ({ ...prev, offset: 0 }));
		setDepartmentSearch("");
	};

	const handlePageChange = (newOffset) => {
		setPagination((prev) => ({ ...prev, offset: newOffset }));
	};

	const getScoreColor = (score) => {
		if (score >= 90) return "text-green-600 bg-green-50";
		if (score >= 75) return "text-blue-600 bg-blue-50";
		if (score >= 60) return "text-yellow-600 bg-yellow-50";
		return "text-red-600 bg-red-50";
	};

	const getRankingIcon = (rank) => {
		if (rank === 1)
			return <Trophy className="h-4 w-4 md:h-5 md:w-5 text-yellow-500" />;
		if (rank === 2)
			return <Medal className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />;
		if (rank === 3)
			return <Award className="h-4 w-4 md:h-5 md:w-5 text-amber-600" />;
		return (
			<span className="text-xs md:text-sm font-semibold text-gray-600">
				#{rank}
			</span>
		);
	};

	const exportToCSV = () => {
		if (!data?.attendance) return;

		const headers = [
			"Ranking",
			"NIK",
			"Nama",
			"Jabatan",
			"Departemen",
			"Total Presensi",
			"Tepat Waktu",
			"Terlambat",
			"% Tepat Waktu",
			"Skor Kinerja",
		];

		const csvData = data.attendance.map((item) => [
			item.ranking,
			item.nik,
			item.nama,
			item.jnj_jabatan,
			item.departemen_nama,
			item.total_presensi,
			item.tepat_waktu,
			item.terlambat,
			item.persentase_tepat_waktu + "%",
			item.skor_kinerja,
		]);

		const csvContent = [headers, ...csvData]
			.map((row) => row.map((cell) => `"${cell}"`).join(","))
			.join("\n");

		const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
		const link = document.createElement("a");
		link.href = URL.createObjectURL(blob);
		link.download = `laporan-presensi-${appliedFilters.month}.csv`;
		link.click();
	};

	const getSelectedDepartmentName = () => {
		if (formFilters.department === "ALL") return "Semua Departemen";
		const dept = data?.departments?.find(
			(d) => d.dep_id === formFilters.department
		);
		return dept?.nama || "Pilih Departemen";
	};

	const hasFiltersChanged = () => {
		return JSON.stringify(formFilters) !== JSON.stringify(appliedFilters);
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 md:h-12 md:w-12 border-b-2 border-blue-600 mx-auto"></div>
					<p className="mt-4 text-sm md:text-base text-gray-600">
						Memuat data laporan...
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="container mx-auto md:p-6 space-y-4 md:space-y-6">
			{/* Header */}
			<div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-center md:gap-4 p-3 md:p-0">
				<div>
					<h1 className="text-xl md:text-3xl font-bold text-gray-900">
						Laporan Presensi Bulanan
					</h1>
					<p className="text-sm md:text-base text-gray-600 mt-1">
						Analisis kinerja presensi pegawai dengan sistem perangkingan
					</p>
				</div>
				{/* <Button
					onClick={exportToCSV}
					className="flex items-center gap-2 text-xs md:text-sm"
				>
					<Download className="h-3 w-3 md:h-4 md:w-4" />
					Export CSV
				</Button> */}
			</div>

			{/* Filters */}
			<Card className="mx-3 md:mx-0">
				<CardHeader className="pb-3 md:pb-4">
					<CardTitle className="flex items-center gap-2 text-base md:text-lg">
						<Filter className="h-4 w-4 md:h-5 md:w-5" />
						Filter & Pencarian
					</CardTitle>
				</CardHeader>
				<CardContent className="pt-0">
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
						{/* Month Filter */}
						<div className="space-y-2">
							<label className="block text-xs md:text-sm font-medium text-gray-700">
								Periode Bulan
							</label>
							<div className="relative">
								<Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
								<Input
									type="month"
									value={formFilters.month}
									onChange={(e) =>
										handleFormFilterChange("month", e.target.value)
									}
									className="pl-10 text-sm font-medium bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
								/>
							</div>
							<p className="text-xs text-gray-500">
								{moment(formFilters.month).format("MMMM YYYY")}
							</p>
						</div>

						{/* Department Filter */}
						<div className="space-y-2">
							<label className="block text-xs md:text-sm font-medium text-gray-700">
								Departemen
							</label>
							<Select
								value={formFilters.department}
								onValueChange={(value) =>
									handleFormFilterChange("department", value)
								}
							>
								<SelectTrigger className="text-sm bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500">
									<div className="flex items-center gap-2">
										<Building2 className="h-4 w-4 text-gray-400" />
										<SelectValue placeholder="Pilih Departemen">
											{getSelectedDepartmentName()}
										</SelectValue>
									</div>
									<ChevronDown className="h-4 w-4 text-gray-400" />
								</SelectTrigger>
								<SelectContent className="max-h-80">
									{/* Search in dropdown */}
									<div className="p-2 border-b">
										<div className="relative">
											<Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
											<Input
												placeholder="Cari departemen..."
												value={departmentSearch}
												onChange={(e) => setDepartmentSearch(e.target.value)}
												className="pl-7 text-xs h-8 border-gray-200"
											/>
										</div>
									</div>
									<SelectItem value="ALL" className="font-medium">
										<div className="flex items-center gap-2">
											<Users className="h-3 w-3 text-blue-500" />
											Semua Departemen
										</div>
									</SelectItem>
									{filteredDepartments.length > 0 ? (
										filteredDepartments.map((dept) => (
											<SelectItem key={dept.dep_id} value={dept.dep_id}>
												<div className="flex items-center gap-2">
													<Building2 className="h-3 w-3 text-gray-500" />
													{dept.nama}
												</div>
											</SelectItem>
										))
									) : (
										<div className="p-2 text-xs text-gray-500 text-center">
											Tidak ada departemen ditemukan
										</div>
									)}
								</SelectContent>
							</Select>
							<p className="text-xs text-gray-500">
								{formFilters.department === "ALL"
									? `${data?.departments?.length || 0} departemen tersedia`
									: `Dipilih: ${getSelectedDepartmentName()}`}
							</p>
						</div>

						{/* Search Filter */}
						<div className="space-y-2">
							<label className="block text-xs md:text-sm font-medium text-gray-700">
								Pencarian Pegawai
							</label>
							<div className="flex gap-2">
								<div className="relative flex-1">
									<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
									<Input
										placeholder="Cari nama atau NIK pegawai..."
										value={formFilters.search}
										onChange={(e) =>
											handleFormFilterChange("search", e.target.value)
										}
										onKeyPress={(e) => {
											if (e.key === "Enter") {
												handleSearch();
											}
										}}
										className="pl-10 text-sm bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
									/>
									{formFilters.search && (
										<button
											onClick={handleClearSearch}
											className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
										>
											<X className="h-4 w-4" />
										</button>
									)}
								</div>
							</div>
							{formFilters.search && (
								<p className="text-xs text-gray-500">
									{appliedFilters.search === formFilters.search
										? `Mencari: "${formFilters.search}"`
										: `Ketik: "${formFilters.search}" (tekan Enter atau klik Cari)`}
								</p>
							)}
						</div>
					</div>

					{/* Action Buttons */}
					<div className="mt-4 pt-4 border-t border-gray-200">
						<div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
							{/* Filter Actions */}
							<div className="flex flex-wrap gap-2">
								<Button
									onClick={handleSearch}
									disabled={!hasFiltersChanged() || searchLoading}
									className="flex items-center gap-2 text-xs md:text-sm"
									size="sm"
								>
									{searchLoading ? (
										<RefreshCw className="h-3 w-3 animate-spin" />
									) : (
										<Search className="h-3 w-3" />
									)}
									{searchLoading ? "Mencari..." : "Cari"}
								</Button>

								<Button
									onClick={handleResetFilters}
									variant="outline"
									className="flex items-center gap-2 text-xs md:text-sm"
									size="sm"
								>
									<RefreshCw className="h-3 w-3" />
									Reset
								</Button>

								{formFilters.search && (
									<Button
										onClick={handleClearSearch}
										variant="outline"
										className="flex items-center gap-2 text-xs md:text-sm"
										size="sm"
									>
										<X className="h-3 w-3" />
										Hapus Pencarian
									</Button>
								)}
							</div>

							{/* Filter Summary */}
							<div className="flex flex-wrap items-center gap-2">
								<span className="text-xs font-medium text-gray-600">
									Filter Aktif:
								</span>
								<Badge variant="outline" className="text-xs">
									<Calendar className="h-3 w-3 mr-1" />
									{moment(appliedFilters.month).format("MMM YYYY")}
								</Badge>
								<Badge variant="outline" className="text-xs">
									<Building2 className="h-3 w-3 mr-1" />
									{appliedFilters.department === "ALL"
										? "Semua Departemen"
										: data?.departments?.find(
												(d) => d.dep_id === appliedFilters.department
										  )?.nama || "Departemen"}
								</Badge>
								{appliedFilters.search && (
									<Badge variant="outline" className="text-xs">
										<Search className="h-3 w-3 mr-1" />
										{appliedFilters.search}
									</Badge>
								)}
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Summary Statistics */}
			{data?.summary && (
				<div className="grid grid-cols-2 md:grid-cols-6 gap-3 md:gap-4 mx-3 md:mx-0">
					<Card>
						<CardContent className="p-3 md:p-6">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-xs md:text-sm font-medium text-gray-600">
										Total Pegawai
									</p>
									<p className="text-lg md:text-2xl font-bold text-gray-900">
										{data.summary.total_pegawai}
									</p>
								</div>
								<Users className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="p-3 md:p-6">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-xs md:text-sm font-medium text-gray-600">
										Total Presensi
									</p>
									<p className="text-lg md:text-2xl font-bold text-gray-900">
										{data.summary.total_presensi_bulan}
									</p>
								</div>
								<Calendar className="h-6 w-6 md:h-8 md:w-8 text-green-600" />
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="p-3 md:p-6">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-xs md:text-sm font-medium text-gray-600">
										Tepat Waktu
									</p>
									<p className="text-lg md:text-2xl font-bold text-green-600">
										{data.summary.total_tepat_waktu}
									</p>
								</div>
								<Clock className="h-6 w-6 md:h-8 md:w-8 text-green-600" />
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="p-3 md:p-6">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-xs md:text-sm font-medium text-gray-600">
										Terlambat
									</p>
									<p className="text-lg md:text-2xl font-bold text-red-600">
										{data.summary.total_terlambat}
									</p>
								</div>
								<AlertTriangle className="h-6 w-6 md:h-8 md:w-8 text-red-600" />
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="p-3 md:p-6">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-xs md:text-sm font-medium text-gray-600">
										Jadwal Masuk
									</p>
									<p className="text-lg md:text-2xl font-bold text-blue-600">
										{data.summary.total_jadwal_masuk}
									</p>
								</div>
								<Calendar className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="p-3 md:p-6">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-xs md:text-sm font-medium text-gray-600">
										Tidak Presensi
									</p>
									<p className="text-lg md:text-2xl font-bold text-orange-600">
										{data.summary.total_pegawai_tidak_presensi}
									</p>
								</div>
								<X className="h-6 w-6 md:h-8 md:w-8 text-orange-600" />
							</div>
						</CardContent>
					</Card>
				</div>
			)}

			{/* Main Content Tabs */}
			<div className="mx-3 md:mx-0">
				<Tabs defaultValue="ranking" className="space-y-3 md:space-y-4">
					<TabsList className="grid w-full grid-cols-3 text-xs md:text-sm">
						<TabsTrigger value="ranking" className="px-2 md:px-4">
							Perangkingan
						</TabsTrigger>
						<TabsTrigger value="top-performers" className="px-2 md:px-4">
							Terbaik
						</TabsTrigger>
						<TabsTrigger value="worst-performers" className="px-2 md:px-4">
							Terburuk
						</TabsTrigger>
					</TabsList>

					{/* Full Ranking Tab */}
					<TabsContent value="ranking">
						<Card>
							<CardHeader className="pb-3 md:pb-4">
								<CardTitle className="text-base md:text-lg">
									Perangkingan Presensi Pegawai
								</CardTitle>
								<p className="text-xs md:text-sm text-gray-600">
									Diurutkan berdasarkan skor kinerja (100 - penalty terlambat)
								</p>
							</CardHeader>
							<CardContent>
								{/* Loading State */}
								{searchLoading && (
									<div className="flex items-center justify-center py-8">
										<div className="flex items-center gap-2 text-sm text-gray-600">
											<RefreshCw className="h-4 w-4 animate-spin" />
											Memuat data...
										</div>
									</div>
								)}

								{/* Mobile Card View */}
								{!searchLoading && (
									<div className="block md:hidden space-y-3">
										{data?.attendance?.map((item) => (
											<Card
												key={item.pegawai_id}
												className="border border-gray-200"
											>
												<CardContent className="p-3 pt-3">
													<div className="flex items-start justify-between mb-2">
														<div className="flex items-center gap-2">
															{getRankingIcon(item.ranking)}
															<div>
																<h3 className="font-semibold text-sm text-gray-900">
																	{item.nama}
																</h3>
																<p className="text-xs text-gray-600 font-mono">
																	{item.nik}
																</p>
															</div>
														</div>
														<Badge
															className={`text-xs ${getScoreColor(
																item.skor_kinerja
															)}`}
														>
															{item.skor_kinerja}
														</Badge>
													</div>
													<div className="text-xs text-gray-600 mb-2">
														<p>
															{item.jnj_jabatan} • {item.departemen_nama}
														</p>
													</div>
													<div className="grid grid-cols-4 gap-2 text-center">
														<div>
															<p className="text-xs text-gray-500">Jadwal</p>
															<p className="font-semibold text-sm text-blue-600">
																{item.jumlah_jadwal_masuk || 0}
															</p>
														</div>
														<div>
															<p className="text-xs text-gray-500">Total</p>
															<p className="font-semibold text-sm">
																{item.total_presensi}
															</p>
														</div>
														<div>
															<p className="text-xs text-gray-500">
																Tepat Waktu
															</p>
															<p className="font-semibold text-sm text-green-600">
																{item.tepat_waktu}
															</p>
														</div>
														<div>
															<p className="text-xs text-gray-500">Terlambat</p>
															<p className="font-semibold text-sm text-red-600">
																{item.terlambat}
															</p>
														</div>
													</div>
													<div className="grid grid-cols-3 gap-2 text-center mt-2">
														<div>
															<p className="text-xs text-gray-500">
																Tidak Presensi
															</p>
															<p className="font-semibold text-sm text-orange-600">
																{item.tidak_presensi || 0}
															</p>
														</div>
														<div>
															<p className="text-xs text-gray-500">
																% Tepat Waktu
															</p>
															<Badge variant="outline" className="text-xs">
																{item.persentase_tepat_waktu}%
															</Badge>
														</div>
														<div>
															<p className="text-xs text-gray-500">
																% Kehadiran
															</p>
															<Badge variant="outline" className="text-xs">
																{item.persentase_kehadiran || 0}%
															</Badge>
														</div>
													</div>
												</CardContent>
											</Card>
										))}
									</div>
								)}

								{/* Desktop Table View */}
								{!searchLoading && (
									<div className="hidden md:block overflow-x-auto">
										<table className="w-full border-collapse">
											<thead>
												<tr className="border-b bg-gray-50">
													<th className="text-left p-3 font-semibold text-sm">
														Rank
													</th>
													<th className="text-left p-3 font-semibold text-sm">
														NIK
													</th>
													<th className="text-left p-3 font-semibold text-sm">
														Nama
													</th>
													<th className="text-left p-3 font-semibold text-sm">
														Jabatan
													</th>
													<th className="text-left p-3 font-semibold text-sm">
														Departemen
													</th>
													<th className="text-center p-3 font-semibold text-sm">
														Jadwal
													</th>
													<th className="text-center p-3 font-semibold text-sm">
														Total
													</th>
													<th className="text-center p-3 font-semibold text-sm">
														Tepat Waktu
													</th>
													<th className="text-center p-3 font-semibold text-sm">
														Terlambat
													</th>
													<th className="text-center p-3 font-semibold text-sm">
														Tidak Presensi
													</th>
													<th className="text-center p-3 font-semibold text-sm">
														% Tepat Waktu
													</th>
													<th className="text-center p-3 font-semibold text-sm">
														% Kehadiran
													</th>
													<th className="text-center p-3 font-semibold text-sm">
														Skor
													</th>
												</tr>
											</thead>
											<tbody>
												{data?.attendance?.map((item) => (
													<tr
														key={item.pegawai_id}
														className="border-b hover:bg-gray-50"
													>
														<td className="p-3">
															<div className="flex items-center gap-2">
																{getRankingIcon(item.ranking)}
															</div>
														</td>
														<td className="p-3 font-mono text-sm">
															{item.nik}
														</td>
														<td className="p-3 font-medium text-sm">
															{item.nama}
														</td>
														<td className="p-3 text-sm">{item.jnj_jabatan}</td>
														<td className="p-3 text-sm">
															{item.departemen_nama}
														</td>
														<td className="p-3 text-center font-semibold text-sm text-blue-600">
															{item.jumlah_jadwal_masuk || 0}
														</td>
														<td className="p-3 text-center font-semibold text-sm">
															{item.total_presensi}
														</td>
														<td className="p-3 text-center text-green-600 font-semibold text-sm">
															{item.tepat_waktu}
														</td>
														<td className="p-3 text-center text-red-600 font-semibold text-sm">
															{item.terlambat}
														</td>
														<td className="p-3 text-center text-orange-600 font-semibold text-sm">
															{item.tidak_presensi || 0}
														</td>
														<td className="p-3 text-center">
															<Badge variant="outline" className="text-xs">
																{item.persentase_tepat_waktu}%
															</Badge>
														</td>
														<td className="p-3 text-center">
															<Badge variant="outline" className="text-xs">
																{item.persentase_kehadiran || 0}%
															</Badge>
														</td>
														<td className="p-3 text-center">
															<Badge
																className={`text-xs ${getScoreColor(
																	item.skor_kinerja
																)}`}
															>
																{item.skor_kinerja}
															</Badge>
														</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>
								)}

								{/* Pagination */}
								{!searchLoading && data?.pagination && (
									<div className="flex flex-col md:flex-row items-center justify-between mt-4 md:mt-6 gap-3">
										<p className="text-xs md:text-sm text-gray-600 text-center md:text-left">
											Menampilkan {data.pagination.offset + 1} -{" "}
											{Math.min(
												data.pagination.offset + data.pagination.limit,
												data.pagination.total
											)}{" "}
											dari {data.pagination.total} pegawai
										</p>
										<div className="flex gap-2">
											<Button
												variant="outline"
												size="sm"
												disabled={data.pagination.offset === 0 || searchLoading}
												onClick={() =>
													handlePageChange(
														Math.max(
															0,
															data.pagination.offset - data.pagination.limit
														)
													)
												}
												className="text-xs md:text-sm"
											>
												Sebelumnya
											</Button>
											<Button
												variant="outline"
												size="sm"
												disabled={!data.pagination.hasMore || searchLoading}
												onClick={() =>
													handlePageChange(
														data.pagination.offset + data.pagination.limit
													)
												}
												className="text-xs md:text-sm"
											>
												Selanjutnya
											</Button>
										</div>
									</div>
								)}
							</CardContent>
						</Card>
					</TabsContent>

					{/* Top Performers Tab */}
					<TabsContent value="top-performers">
						<Card>
							<CardHeader className="pb-3 md:pb-4">
								<CardTitle className="flex items-center gap-2 text-base md:text-lg">
									<Trophy className="h-4 w-4 md:h-5 md:w-5 text-yellow-500" />
									10 Pegawai Terbaik
								</CardTitle>
								<p className="text-xs md:text-sm text-gray-600">
									Pegawai dengan skor kinerja tertinggi dan presensi tepat waktu
									terbanyak
								</p>
							</CardHeader>
							<CardContent className="pt-0">
								<div className="space-y-3 md:space-y-4">
									{data?.topPerformers?.map((item, index) => (
										<div
											key={index}
											className="flex flex-col md:flex-row md:items-center justify-between p-3 md:p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border gap-3 md:gap-0"
										>
											<div className="flex items-center gap-3 md:gap-4">
												<div className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full bg-white shadow-sm">
													{getRankingIcon(index + 1)}
												</div>
												<div>
													<h3 className="font-semibold text-sm md:text-base text-gray-900">
														{item.nama}
													</h3>
													<p className="text-xs md:text-sm text-gray-600">
														{item.nik} • {item.departemen_nama}
													</p>
												</div>
											</div>
											<div className="flex justify-between md:justify-end md:gap-4">
												<div className="text-center">
													<p className="text-xs text-gray-600">Jadwal</p>
													<p className="text-sm md:text-lg font-bold text-blue-600">
														{item.jumlah_jadwal_masuk || 0}
													</p>
												</div>
												<div className="text-center">
													<p className="text-xs text-gray-600">Tepat Waktu</p>
													<p className="text-sm md:text-lg font-bold text-green-600">
														{item.tepat_waktu}
													</p>
												</div>
												<div className="text-center">
													<p className="text-xs text-gray-600">Skor</p>
													<Badge
														className={`text-xs md:text-sm ${getScoreColor(
															item.skor_kinerja
														)}`}
													>
														{item.skor_kinerja}
													</Badge>
												</div>
											</div>
										</div>
									))}
								</div>
							</CardContent>
						</Card>
					</TabsContent>

					{/* Worst Performers Tab */}
					<TabsContent value="worst-performers">
						<Card>
							<CardHeader className="pb-3 md:pb-4">
								<CardTitle className="flex items-center gap-2 text-base md:text-lg">
									<TrendingDown className="h-4 w-4 md:h-5 md:w-5 text-red-500" />
									10 Pegawai dengan Keterlambatan Terbanyak
								</CardTitle>
								<p className="text-xs md:text-sm text-gray-600">
									Pegawai yang memerlukan perhatian khusus dalam hal
									kedisiplinan presensi
								</p>
							</CardHeader>
							<CardContent className="pt-0">
								<div className="space-y-3 md:space-y-4">
									{data?.worstPerformers?.map((item, index) => (
										<div
											key={index}
											className="flex flex-col md:flex-row md:items-center justify-between p-3 md:p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border gap-3 md:gap-0"
										>
											<div className="flex items-center gap-3 md:gap-4">
												<div className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full bg-white shadow-sm">
													<span className="text-xs md:text-sm font-semibold text-red-600">
														#{index + 1}
													</span>
												</div>
												<div>
													<h3 className="font-semibold text-sm md:text-base text-gray-900">
														{item.nama}
													</h3>
													<p className="text-xs md:text-sm text-gray-600">
														{item.nik} • {item.departemen_nama}
													</p>
												</div>
											</div>
											<div className="flex justify-between md:justify-end md:gap-4">
												<div className="text-center">
													<p className="text-xs text-gray-600">Jadwal</p>
													<p className="text-sm md:text-lg font-bold text-blue-600">
														{item.jumlah_jadwal_masuk || 0}
													</p>
												</div>
												<div className="text-center">
													<p className="text-xs text-gray-600">
														Total Terlambat
													</p>
													<p className="text-sm md:text-lg font-bold text-red-600">
														{item.total_terlambat}
													</p>
												</div>
												<div className="text-center">
													<p className="text-xs text-gray-600">
														Tidak Presensi
													</p>
													<p className="text-sm md:text-lg font-bold text-orange-600">
														{item.tidak_presensi || 0}
													</p>
												</div>
												<div className="text-center">
													<p className="text-xs text-gray-600">Skor</p>
													<Badge
														className={`text-xs md:text-sm ${getScoreColor(
															item.skor_kinerja
														)}`}
													>
														{item.skor_kinerja}
													</Badge>
												</div>
											</div>
										</div>
									))}
								</div>
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>
			</div>

			{/* Scoring System Info */}
			<Card className="mx-3 md:mx-0">
				<CardHeader className="pb-3 md:pb-4">
					<CardTitle className="text-base md:text-lg">
						Sistem Penilaian Skor Kinerja
					</CardTitle>
				</CardHeader>
				<CardContent className="pt-0">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
						<div>
							<h4 className="font-semibold mb-2 md:mb-3 text-sm md:text-base">
								Metode Perhitungan:
							</h4>
							<ul className="space-y-1 md:space-y-2 text-xs md:text-sm">
								<li>
									• <strong>Skor Dasar:</strong> 100 poin
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
								<li>
									• <strong>Skor Minimum:</strong> 0 poin
								</li>
								<li>
									• <strong>% Kehadiran:</strong> (Total Presensi / Jadwal
									Masuk) × 100
								</li>
								<li>
									• <strong>Tidak Presensi:</strong> Jadwal masuk tanpa presensi
								</li>
							</ul>
						</div>
						<div>
							<h4 className="font-semibold mb-2 md:mb-3 text-sm md:text-base">
								Kategori Skor:
							</h4>
							<div className="space-y-1 md:space-y-2 text-xs md:text-sm">
								<div className="flex items-center gap-2">
									<Badge className="text-xs text-green-600 bg-green-50">
										90-100
									</Badge>
									<span>Sangat Baik</span>
								</div>
								<div className="flex items-center gap-2">
									<Badge className="text-xs text-blue-600 bg-blue-50">
										75-89
									</Badge>
									<span>Baik</span>
								</div>
								<div className="flex items-center gap-2">
									<Badge className="text-xs text-yellow-600 bg-yellow-50">
										60-74
									</Badge>
									<span>Cukup</span>
								</div>
								<div className="flex items-center gap-2">
									<Badge className="text-xs text-red-600 bg-red-50">0-59</Badge>
									<span>Perlu Perbaikan</span>
								</div>
							</div>

							<h4 className="font-semibold mb-2 md:mb-3 text-sm md:text-base mt-4">
								Informasi Tambahan:
							</h4>
							<ul className="space-y-1 md:space-y-2 text-xs md:text-sm">
								<li>
									• <strong>Jadwal Masuk:</strong> Jumlah jadwal dari tabel
									jadwal_pegawai
								</li>
								<li>
									• <strong>Tidak Presensi:</strong> Jadwal masuk tanpa catatan
									presensi
								</li>
								<li>
									• <strong>% Kehadiran:</strong> Persentase kehadiran
									berdasarkan jadwal
								</li>
							</ul>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
