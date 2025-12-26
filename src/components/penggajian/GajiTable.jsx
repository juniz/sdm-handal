"use client";

import { useState } from "react";

export default function GajiTable({ gajiList, loading, onDownloadSlip, isKEU }) {
	const formatRupiah = (angka) => {
		return new Intl.NumberFormat("id-ID", {
			style: "currency",
			currency: "IDR",
			minimumFractionDigits: 0,
		}).format(angka);
	};

	const formatBulan = (bulan) => {
		const bulanNama = [
			"",
			"Januari",
			"Februari",
			"Maret",
			"April",
			"Mei",
			"Juni",
			"Juli",
			"Agustus",
			"September",
			"Oktober",
			"November",
			"Desember",
		];
		return bulanNama[bulan] || "";
	};

	if (loading) {
		return (
			<div className="bg-white p-8 rounded-lg shadow-sm text-center">
				<div className="animate-pulse text-gray-500">Memuat data gaji...</div>
			</div>
		);
	}

	if (gajiList.length === 0) {
		return (
			<div className="bg-white p-8 rounded-lg shadow-sm text-center">
				<p className="text-gray-500">Tidak ada data gaji untuk periode ini</p>
			</div>
		);
	}

	return (
		<div className="bg-white rounded-lg shadow-sm overflow-hidden">
			<div className="overflow-x-auto">
				<table className="min-w-full divide-y divide-gray-200">
					<thead className="bg-gray-50">
						<tr>
							{isKEU && (
								<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									NIK
								</th>
							)}
							<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Nama
							</th>
							{isKEU && (
								<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Departemen
								</th>
							)}
							<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Periode
							</th>
							<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Jenis
							</th>
							<th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
								Total Gaji
							</th>
							<th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
								Aksi
							</th>
						</tr>
					</thead>
					<tbody className="bg-white divide-y divide-gray-200">
						{gajiList.map((gaji) => (
							<tr key={gaji.id} className="hover:bg-gray-50">
								{isKEU && (
									<td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
										{gaji.nik}
									</td>
								)}
								<td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
									{gaji.nama}
								</td>
								{isKEU && (
									<td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
										{gaji.departemen_name || "-"}
									</td>
								)}
								<td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
									{formatBulan(gaji.periode_bulan)} {gaji.periode_tahun}
								</td>
								<td className="px-4 py-3 whitespace-nowrap">
									<span
										className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
											gaji.jenis === "GAJI"
												? "bg-blue-100 text-blue-800"
												: "bg-green-100 text-green-800"
										}`}
									>
										{gaji.jenis}
									</span>
								</td>
								<td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
									{formatRupiah(gaji.gaji)}
								</td>
								<td className="px-4 py-3 whitespace-nowrap text-center text-sm">
									<button
										onClick={() => onDownloadSlip(gaji.id)}
										className="text-blue-600 hover:text-blue-900 font-medium"
									>
										Download Slip
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}

