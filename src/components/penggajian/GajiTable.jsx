"use client";

import { useState } from "react";
import { Download, Pen } from "lucide-react";
import { Button } from "@/components/ui/button";
import TandaTanganModal from "./TandaTanganModal";

export default function GajiTable({
	gajiList,
	loading,
	onDownloadSlip,
	onTandaTangan,
	isKEU,
	validasiMap,
}) {
	const [selectedGaji, setSelectedGaji] = useState(null);
	const [isTandaTanganModalOpen, setIsTandaTanganModalOpen] = useState(false);
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
									<div className="flex items-center justify-center gap-2">
										<Button
											variant="outline"
											size="sm"
											onClick={() => onDownloadSlip(gaji.id)}
											className="h-8"
										>
											<Download className="h-3 w-3 mr-1" />
											Slip
										</Button>
										{!isKEU && (
											<Button
												variant={validasiMap?.[gaji.id] ? "default" : "outline"}
												size="sm"
												onClick={() => {
													setSelectedGaji(gaji);
													setIsTandaTanganModalOpen(true);
												}}
												className="h-8"
												disabled={!!validasiMap?.[gaji.id]}
											>
												<Pen className="h-3 w-3 mr-1" />
												{validasiMap?.[gaji.id]
													? "Sudah Ditandatangani"
													: "Tanda Tangan"}
											</Button>
										)}
									</div>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{/* Tanda Tangan Modal */}
			{selectedGaji && (
				<TandaTanganModal
					open={isTandaTanganModalOpen}
					onOpenChange={setIsTandaTanganModalOpen}
					gajiData={selectedGaji}
					onSubmit={async (data) => {
						await onTandaTangan(data);
						setIsTandaTanganModalOpen(false);
						setSelectedGaji(null);
					}}
				/>
			)}
		</div>
	);
}
