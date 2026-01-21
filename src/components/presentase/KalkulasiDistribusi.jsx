"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { 
	Calculator,
	Loader2,
	Download,
	PieChart,
	Building2,
	Users,
	DollarSign,
	AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import moment from "moment-timezone";

export default function KalkulasiDistribusi() {
	const [loading, setLoading] = useState(false);
	const [totalJasa, setTotalJasa] = useState(""); // Nilai numerik untuk perhitungan
	const [totalJasaDisplay, setTotalJasaDisplay] = useState(""); // Nilai yang diformat untuk display
	const [tanggal, setTanggal] = useState(moment().format("YYYY-MM-DD"));
	const [result, setResult] = useState(null);

	const formatRupiah = (angka) => {
		return new Intl.NumberFormat("id-ID", {
			style: "currency",
			currency: "IDR",
			minimumFractionDigits: 0,
		}).format(angka);
	};

	// Fungsi untuk format input dengan separator ribuan
	const formatCurrencyInput = (value) => {
		// Hapus semua karakter non-digit
		const numericValue = value.replace(/\D/g, "");
		
		if (!numericValue) {
			return "";
		}

		// Format dengan separator ribuan (titik)
		const formatted = numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
		return formatted;
	};

	// Handler untuk perubahan input
	const handleTotalJasaChange = (e) => {
		const inputValue = e.target.value;
		const numericValue = inputValue.replace(/\D/g, "");
		
		// Simpan nilai numerik untuk perhitungan
		setTotalJasa(numericValue);
		
		// Format untuk display
		if (numericValue) {
			setTotalJasaDisplay(formatCurrencyInput(numericValue));
		} else {
			setTotalJasaDisplay("");
		}
	};

	const handleKalkulasi = async () => {
		const numericValue = totalJasa ? parseFloat(totalJasa) : 0;
		
		if (!totalJasa || numericValue <= 0) {
			toast.error("Masukkan nominal total jasa yang valid");
			return;
		}

		setLoading(true);
		try {
			const response = await fetch("/api/presentase/kalkulasi", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					total_jasa: numericValue,
					tanggal
				})
			});

			if (response.ok) {
				const data = await response.json();
				setResult(data);
				toast.success("Kalkulasi berhasil");
			} else {
				const error = await response.json();
				toast.error(error.message);
			}
		} catch (error) {
			console.error("Error calculating:", error);
			toast.error("Terjadi kesalahan saat kalkulasi");
		} finally {
			setLoading(false);
		}
	};

	const handleExport = () => {
		if (!result) return;

		const numericTotalJasa = totalJasa ? parseFloat(totalJasa) : 0;

		// Prepare data for export
		let csvContent = "data:text/csv;charset=utf-8,";
		csvContent += "Kategori,Departemen,NIK,Nama Pegawai,% dari Unit,% dari Total,Nominal\n";

		result.data.forEach(kategori => {
			kategori.units.forEach(unit => {
				unit.pegawai.forEach(peg => {
					const persentaseTotal = numericTotalJasa > 0 
						? (peg.nominal / numericTotalJasa * 100).toFixed(2)
						: "0.00";
					csvContent += `"${kategori.nama_kategori}","${unit.nama_departemen}","${peg.nik}","${peg.nama}",${peg.presentase}%,${persentaseTotal}%,${peg.nominal}\n`;
				});
			});
		});

		const encodedUri = encodeURI(csvContent);
		const link = document.createElement("a");
		link.setAttribute("href", encodedUri);
		link.setAttribute("download", `distribusi_jasa_${tanggal}.csv`);
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	return (
		<div className="space-y-6">
			{/* Input Form */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Calculator className="w-5 h-5 text-amber-600" />
						Kalkulasi Distribusi Jasa
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div className="space-y-2">
							<Label htmlFor="total_jasa">Total Jasa Rumah Sakit (Rp)</Label>
							<div className="relative">
								<DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
								<Input
									id="total_jasa"
									type="text"
									value={totalJasaDisplay}
									onChange={handleTotalJasaChange}
									placeholder="Masukkan nominal..."
									className="pl-10 pr-12"
									inputMode="numeric"
								/>
								<span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 font-medium">
									Rp
								</span>
							</div>
							{totalJasa && parseFloat(totalJasa) > 0 && (
								<p className="text-xs text-gray-500 italic">
									{formatRupiah(parseFloat(totalJasa))}
								</p>
							)}
						</div>
						<div className="space-y-2">
							<Label htmlFor="tanggal">Tanggal Kalkulasi</Label>
							<Input
								id="tanggal"
								type="date"
								value={tanggal}
								onChange={(e) => setTanggal(e.target.value)}
							/>
						</div>
						<div className="flex items-end gap-2">
							<Button 
								onClick={handleKalkulasi}
								disabled={loading}
								className="bg-amber-600 hover:bg-amber-700 flex-1"
							>
								{loading ? (
									<Loader2 className="w-4 h-4 mr-2 animate-spin" />
								) : (
									<Calculator className="w-4 h-4 mr-2" />
								)}
								Hitung Distribusi
							</Button>
							{result && (
								<Button variant="outline" onClick={handleExport}>
									<Download className="w-4 h-4 mr-2" />
									Export
								</Button>
							)}
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Results */}
			{result && (
				<>
					{/* Summary Cards */}
					<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
						<Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
							<CardContent className="p-4">
								<p className="text-sm text-amber-600 font-medium">Total Jasa</p>
								<p className="text-xl font-bold text-amber-700">
									{formatRupiah(result.summary.total_jasa)}
								</p>
							</CardContent>
						</Card>
						<Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
							<CardContent className="p-4">
								<p className="text-sm text-emerald-600 font-medium">Total Distribusi</p>
								<p className="text-xl font-bold text-emerald-700">
									{formatRupiah(result.summary.total_distribusi)}
								</p>
							</CardContent>
						</Card>
						<Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
							<CardContent className="p-4">
								<p className="text-sm text-red-600 font-medium">Belum Terdistribusi</p>
								<p className="text-xl font-bold text-red-700">
									{formatRupiah(result.summary.sisa_belum_terdistribusi)}
								</p>
							</CardContent>
						</Card>
						<Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
							<CardContent className="p-4">
								<p className="text-sm text-blue-600 font-medium">Jumlah Penerima</p>
								<p className="text-xl font-bold text-blue-700">
									{result.summary.jumlah_pegawai} pegawai
								</p>
							</CardContent>
						</Card>
					</div>

					{/* Warning if not fully distributed */}
					{result.summary.sisa_belum_terdistribusi > 0 && (
						<Card className="border-amber-300 bg-amber-50">
							<CardContent className="p-4 flex items-center gap-3">
								<AlertCircle className="w-5 h-5 text-amber-600" />
								<div>
									<p className="font-medium text-amber-800">Distribusi Belum Lengkap</p>
									<p className="text-sm text-amber-700">
										Masih ada {formatRupiah(result.summary.sisa_belum_terdistribusi)} yang belum terdistribusi.
										Periksa kembali pengaturan persentase kategori, unit, dan pegawai.
									</p>
								</div>
							</CardContent>
						</Card>
					)}

					{/* Detailed Results */}
					<Card>
						<CardHeader>
							<CardTitle>Detail Distribusi per Kategori</CardTitle>
						</CardHeader>
						<CardContent>
							{result.data.length === 0 ? (
								<div className="text-center py-8 text-gray-500">
									<PieChart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
									<p>Tidak ada data distribusi</p>
									<p className="text-sm">Pastikan sudah ada pengaturan kategori, unit, dan alokasi pegawai</p>
								</div>
							) : (
								<Accordion type="multiple" className="space-y-4">
									{result.data.map((kategori) => (
										<AccordionItem 
											key={kategori.id_kategori} 
											value={kategori.id_kategori.toString()}
											className="border rounded-lg overflow-hidden"
										>
											<AccordionTrigger className="px-4 py-3 bg-emerald-50 hover:bg-emerald-100 hover:no-underline">
												<div className="flex items-center justify-between w-full pr-4">
													<div className="flex items-center gap-3">
														<PieChart className="w-5 h-5 text-emerald-600" />
														<span className="font-medium text-emerald-900">
															{kategori.nama_kategori}
														</span>
														<span className="text-sm text-emerald-600">
															({kategori.presentase}%)
														</span>
													</div>
													<span className="font-medium text-emerald-700">
														{formatRupiah(kategori.nominal)}
													</span>
												</div>
											</AccordionTrigger>
											<AccordionContent className="p-0">
												{kategori.units.map((unit) => (
													<div key={unit.id_unit} className="border-t">
														<div className="px-4 py-3 bg-blue-50 flex items-center justify-between">
															<div className="flex items-center gap-2">
																<Building2 className="w-4 h-4 text-blue-600" />
																<span className="font-medium text-blue-900">
																	{unit.nama_departemen}
																</span>
																<span className="text-sm text-blue-600">
																	({unit.presentase}% dari kategori)
																</span>
															</div>
															<span className="font-medium text-blue-700">
																{formatRupiah(unit.nominal)}
															</span>
														</div>
														{unit.pegawai.length > 0 ? (
															<Table>
																<TableHeader>
																	<TableRow>
																		<TableHead>NIK</TableHead>
																		<TableHead>Nama Pegawai</TableHead>
																		<TableHead className="text-right">% dari Unit</TableHead>
																		<TableHead className="text-right">Nominal</TableHead>
																	</TableRow>
																</TableHeader>
																<TableBody>
																	{unit.pegawai.map((peg) => (
																		<TableRow key={peg.id_alokasi}>
																			<TableCell className="font-mono text-sm">{peg.nik}</TableCell>
																			<TableCell>{peg.nama}</TableCell>
																			<TableCell className="text-right">
																				<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
																					{peg.presentase}%
																				</span>
																			</TableCell>
																			<TableCell className="text-right font-medium text-green-700">
																				{formatRupiah(peg.nominal)}
																			</TableCell>
																		</TableRow>
																	))}
																</TableBody>
															</Table>
														) : (
															<div className="p-4 text-center text-gray-500 text-sm">
																<Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
																Belum ada pegawai teralokasi di unit ini
															</div>
														)}
													</div>
												))}
												{kategori.units.length === 0 && (
													<div className="p-4 text-center text-gray-500 text-sm">
														<Building2 className="w-8 h-8 mx-auto mb-2 text-gray-300" />
														Belum ada unit di kategori ini
													</div>
												)}
											</AccordionContent>
										</AccordionItem>
									))}
								</Accordion>
							)}
						</CardContent>
					</Card>
				</>
			)}
		</div>
	);
}

