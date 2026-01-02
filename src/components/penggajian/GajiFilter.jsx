"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

export default function GajiFilter({ filters, onFilterChange }) {
	const currentYear = new Date().getFullYear();
	const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
	const months = [
		{ value: 1, label: "Januari" },
		{ value: 2, label: "Februari" },
		{ value: 3, label: "Maret" },
		{ value: 4, label: "April" },
		{ value: 5, label: "Mei" },
		{ value: 6, label: "Juni" },
		{ value: 7, label: "Juli" },
		{ value: 8, label: "Agustus" },
		{ value: 9, label: "September" },
		{ value: 10, label: "Oktober" },
		{ value: 11, label: "November" },
		{ value: 12, label: "Desember" },
	];

	const handleSearchChange = (e) => {
		onFilterChange({ search: e.target.value });
	};

	const handleYearChange = (value) => {
		onFilterChange({ periode_tahun: parseInt(value) });
	};

	const handleMonthChange = (value) => {
		onFilterChange({ periode_bulan: parseInt(value) });
	};

	return (
		<Card className="mb-4">
			<CardContent className="pt-6">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					{/* Search */}
					<div className="space-y-2">
						<Label htmlFor="search">Cari NIK/Nama</Label>
						<Input
							id="search"
							type="text"
							value={filters.search || ""}
							onChange={handleSearchChange}
							placeholder="Cari NIK atau nama..."
							className="w-full"
						/>
					</div>

					{/* Tahun */}
					<div className="space-y-2">
						<Label htmlFor="year">Tahun</Label>
						<Select
							value={String(filters.periode_tahun || currentYear)}
							onValueChange={handleYearChange}
						>
							<SelectTrigger id="year" className="w-full">
								<SelectValue placeholder="Pilih tahun" />
							</SelectTrigger>
							<SelectContent>
								{years.map((year) => (
									<SelectItem key={year} value={String(year)}>
										{year}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Bulan */}
					<div className="space-y-2">
						<Label htmlFor="month">Bulan</Label>
						<Select
							value={String(filters.periode_bulan || new Date().getMonth() + 1)}
							onValueChange={handleMonthChange}
						>
							<SelectTrigger id="month" className="w-full">
								<SelectValue placeholder="Pilih bulan" />
							</SelectTrigger>
							<SelectContent>
								{months.map((month) => (
									<SelectItem key={month.value} value={String(month.value)}>
										{month.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
