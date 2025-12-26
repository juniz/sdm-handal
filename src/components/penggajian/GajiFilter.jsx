"use client";

import { useState } from "react";

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

	const handleYearChange = (e) => {
		onFilterChange({ periode_tahun: parseInt(e.target.value) });
	};

	const handleMonthChange = (e) => {
		onFilterChange({ periode_bulan: parseInt(e.target.value) });
	};

	return (
		<div className="bg-white p-4 rounded-lg shadow-sm mb-4">
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				{/* Search */}
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1">
						Cari NIK/Nama
					</label>
					<input
						type="text"
						value={filters.search || ""}
						onChange={handleSearchChange}
						placeholder="Cari NIK atau nama..."
						className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</div>

				{/* Tahun */}
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1">
						Tahun
					</label>
					<select
						value={filters.periode_tahun || currentYear}
						onChange={handleYearChange}
						className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						{years.map((year) => (
							<option key={year} value={year}>
								{year}
							</option>
						))}
					</select>
				</div>

				{/* Bulan */}
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1">
						Bulan
					</label>
					<select
						value={filters.periode_bulan || new Date().getMonth() + 1}
						onChange={handleMonthChange}
						className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						{months.map((month) => (
							<option key={month.value} value={month.value}>
								{month.label}
							</option>
						))}
					</select>
				</div>
			</div>
		</div>
	);
}


