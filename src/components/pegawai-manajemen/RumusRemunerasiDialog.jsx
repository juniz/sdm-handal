
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calculator, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function RumusRemunerasiDialog({ open, onOpenChange }) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col p-0">
				<DialogHeader className="p-6 pb-4 border-b">
					<div className="flex items-center gap-2">
						<div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
							<Calculator className="w-5 h-5" />
						</div>
						<div>
							<DialogTitle className="text-xl">
								Rumus Perhitungan Index Remunerasi
							</DialogTitle>
							<DialogDescription className="mt-1">
								Penjelasan metode perhitungan poin faktor remunerasi berdasarkan kinerja dan jabatan.
							</DialogDescription>
						</div>
					</div>
				</DialogHeader>

				<ScrollArea className="flex-1 p-6">
					<div className="space-y-6">
						{/* Konsep Dasar */}
						<section>
							<h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
								<Info className="w-5 h-5 text-blue-500" />
								Konsep Dasar
							</h3>
							<p className="text-gray-600 text-sm leading-relaxed mb-4">
								Perhitungan remunerasi membagi komponen menjadi dua kelompok utama dengan bobot asimetris untuk memberikan penghargaan lebih besar pada kinerja dan pencapaian personal (65%) dibandingkan faktor bawaan jabatan (35%).
							</p>
							
							<div className="grid sm:grid-cols-2 gap-4">
								<div className="bg-slate-50 border rounded-lg p-4">
									<h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
										<Badge variant="outline" className="bg-slate-200">35%</Badge>
										Index Jabatan
									</h4>
									<ul className="text-sm text-slate-600 space-y-1 list-disc pl-4">
										<li>Jenis Jabatan</li>
										<li>Kelompok Jabatan</li>
										<li>Resiko Kerja</li>
										<li>Emergency Index</li>
									</ul>
									<p className="text-xs text-slate-500 mt-2 italic">
										* Melekat pada jabatan, tidak bisa diubah langsung oleh pegawai.
									</p>
								</div>
								<div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
									<h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
										<Badge variant="default" className="bg-blue-600">65%</Badge>
										Index Personal
									</h4>
									<ul className="text-sm text-blue-700 space-y-1 list-disc pl-4">
										<li>Pendidikan</li>
										<li>Evaluasi Kinerja</li>
										<li>Pencapaian Kinerja</li>
									</ul>
									<p className="text-xs text-blue-600/80 mt-2 italic">
										* Dikendalikan oleh pegawai melalui peningkatan kompetensi dan kinerja.
									</p>
								</div>
							</div>
						</section>

						{/* Rumus Perhitungan */}
						<section>
							<h3 className="text-lg font-semibold text-gray-900 mb-3">
								Rumus Perhitungan
							</h3>
							
							<div className="bg-slate-900 text-slate-50 rounded-lg p-4 font-mono text-sm space-y-3 shadow-inner">
								<div>
									<span className="text-blue-400">Total Index</span> = 
									<span className="text-amber-300"> (Index Jabatan × 35%)</span> + 
									<span className="text-emerald-300"> (Index Personal × 65%)</span>
								</div>
								<div className="border-t border-slate-700 pt-3">
									<span className="text-purple-400">Persentase Remunerasi</span> = 
									<span className="text-white"> (Total Index / </span>
									<span className="text-rose-400">Threshold Kelompok Jabatan</span>
									<span className="text-white">) × 100%</span>
								</div>
							</div>
						</section>

						{/* Threshold Penjelasan */}
						<section>
							<h3 className="text-lg font-semibold text-gray-900 mb-3">
								Threshold Gaji Penuh (100%)
							</h3>
							<p className="text-gray-600 text-sm leading-relaxed mb-4">
								Setiap kelompok jabatan memiliki target (threshold) yang berbeda untuk mencapai remunerasi penuh. Hal ini memungkinkan staf pelaksana/klinis yang berkinerja tinggi untuk mendapatkan persentase yang maksimal.
							</p>
							
							<div className="bg-white border rounded-lg overflow-hidden">
								<table className="w-full text-sm text-left">
									<thead className="bg-slate-50 text-slate-700">
										<tr>
											<th className="px-4 py-2 border-b font-medium">Kelompok Pegawai</th>
											<th className="px-4 py-2 border-b font-medium text-right">Threshold</th>
										</tr>
									</thead>
									<tbody className="divide-y text-slate-600">
										<tr>
											<td className="px-4 py-2">Direktur / Pejabat Struktural</td>
											<td className="px-4 py-2 text-right font-semibold">88%</td>
										</tr>
										<tr>
											<td className="px-4 py-2">Dokter Spesialis / Fungsional Ahli Utama</td>
											<td className="px-4 py-2 text-right font-semibold">85%</td>
										</tr>
										<tr>
											<td className="px-4 py-2">Dokter Umum / Fungsional Ahli Muda</td>
											<td className="px-4 py-2 text-right font-semibold">82%</td>
										</tr>
										<tr>
											<td className="px-4 py-2">Perawat / Bidan / Nakes Fungsional</td>
											<td className="px-4 py-2 text-right font-semibold">78%</td>
										</tr>
										<tr>
											<td className="px-4 py-2">Tenaga Penunjang</td>
											<td className="px-4 py-2 text-right font-semibold">75%</td>
										</tr>
										<tr>
											<td className="px-4 py-2">Tenaga Administrasi & Umum</td>
											<td className="px-4 py-2 text-right font-semibold">70%</td>
										</tr>
										<tr>
											<td className="px-4 py-2">Staf Pelaksana / Non-Klinis</td>
											<td className="px-4 py-2 text-right font-semibold">65%</td>
										</tr>
									</tbody>
								</table>
							</div>
						</section>
						
						{/* Contoh Kasus */}
						<section className="bg-amber-50/50 border border-amber-100 rounded-lg p-4">
							<h3 className="text-md font-semibold text-amber-900 mb-2">
								Contoh Kasus
							</h3>
							<p className="text-sm text-amber-800 leading-relaxed">
								Seorang <strong>Perawat</strong> (Threshold 78%) memiliki total nilai komponen jabatan <strong>15</strong> dan total nilai komponen personal <strong>8</strong>.<br/><br/>
								<strong>Perhitungan:</strong><br/>
								1. Index Jabatan = 15 × 35% = 5.25<br/>
								2. Index Personal = 8 × 65% = 5.20<br/>
								3. Total Index = 5.25 + 5.20 = <strong>10.45</strong><br/>
								4. Persentase = (10.45 / 78) × 100% = <strong>13.39%</strong>
							</p>
						</section>
					</div>
				</ScrollArea>
			</DialogContent>
		</Dialog>
	);
}