import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bug, Calculator } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function DebugPersentaseDialog({ open, onOpenChange, pegawai }) {
	if (!pegawai) return null;

	const dt = new Date().toLocaleString("id-ID", {
		dateStyle: "medium",
		timeStyle: "medium",
	});

	// Reconstruct the calculation to show intermediaries based on backend logic
	const jnj = parseFloat(pegawai.jnj_indek || 0);
	const kel = parseFloat(pegawai.kel_indek || 0);
	const res = parseFloat(pegawai.res_indek || 0);
	const em = parseFloat(pegawai.em_indek || 0);
	
	const pend = parseFloat(pegawai.pend_indek || 0);
	const eval_indek = parseFloat(pegawai.eval_indek || 0);
	const capai_indek = parseFloat(pegawai.capai_indek || 0);

	const bobot_jabatan = parseFloat(pegawai.bobot_jabatan || 35) / 100;
	const bobot_personal = parseFloat(pegawai.bobot_personal || 65) / 100;
	const threshold = parseFloat(pegawai.threshold_persen || 100);

	const sumJabatan = jnj + kel + res + em;
	const weightedJabatan = sumJabatan * bobot_jabatan;

	const sumPersonal = pend + eval_indek + capai_indek;
	const weightedPersonal = sumPersonal * bobot_personal;

	const totalIndex = weightedJabatan + weightedPersonal;
	
	let percentage = (totalIndex / threshold) * 100;
	let cappedPercentage = percentage;
	let isCapped = false;
	
	if (percentage > 100) {
		cappedPercentage = 100;
		isCapped = true;
	}
	
	if (isNaN(cappedPercentage) || !isFinite(cappedPercentage)) {
		cappedPercentage = 0;
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col p-0 font-mono">
				<DialogHeader className="p-6 pb-4 border-b bg-slate-900 text-slate-50">
					<div className="flex items-center gap-2">
						<Bug className="w-5 h-5 text-green-400" />
						<div>
							<DialogTitle className="text-xl font-bold text-slate-50">
								Debug: Kalkulasi Persentase Remunerasi
							</DialogTitle>
							<DialogDescription className="mt-1 text-slate-400">
								Target: {pegawai.nama} ({pegawai.nik}) | Waktu: {dt}
							</DialogDescription>
						</div>
					</div>
				</DialogHeader>

				<ScrollArea className="flex-1 p-6 bg-slate-950 text-slate-300">
					<div className="space-y-6 text-sm">
						{/* Variables */}
						<section>
							<h3 className="text-green-400 font-semibold mb-2 flex items-center gap-2 border-b border-slate-800 pb-1">
								[1] INPUT VARIABLES (RAW DATA)
							</h3>
							<div className="grid grid-cols-2 gap-4 pl-4">
								<div>
									<div className="text-slate-500 mb-1">// Komponen Jabatan</div>
									<div><span className="text-blue-300">jnj_indek</span> = {jnj}</div>
									<div><span className="text-blue-300">kel_indek</span> = {kel}</div>
									<div><span className="text-blue-300">res_indek</span> = {res}</div>
									<div><span className="text-blue-300">em_indek</span>  = {em}</div>
									<div className="mt-1 border-t border-slate-800 pt-1">
										<span className="text-blue-300">SUM_JABATAN</span> = {sumJabatan}
									</div>
								</div>
								<div>
									<div className="text-slate-500 mb-1">// Komponen Personal</div>
									<div><span className="text-amber-300">pend_indek</span>  = {pend}</div>
									<div><span className="text-amber-300">eval_indek</span>  = {eval_indek}</div>
									<div><span className="text-amber-300">capai_indek</span> = {capai_indek}</div>
									<div className="mt-1 border-t border-slate-800 pt-1">
										<span className="text-amber-300">SUM_PERSONAL</span> = {sumPersonal}
									</div>
								</div>
							</div>
							<div className="pl-4 mt-3">
								<div className="text-slate-500 mb-1">// Threshold & Bobot</div>
								<div className="mb-2 text-xs text-slate-400">Diambil dari tabel <span className="text-slate-300">threshold_kelompok_jabatan</span> berdasarkan <span className="text-slate-300">kode_kelompok</span> pegawai</div>
								<div><span className="text-purple-300">bobot_jabatan</span>  = {bobot_jabatan * 100}%</div>
								<div><span className="text-purple-300">bobot_personal</span> = {bobot_personal * 100}%</div>
								<div><span className="text-purple-300">threshold</span>      = {threshold}</div>
							</div>
						</section>

						{/* Formula */}
						<section>
							<h3 className="text-green-400 font-semibold mb-2 flex items-center gap-2 border-b border-slate-800 pb-1">
								[2] CALCULATION PROCESS
							</h3>
							<div className="pl-4 space-y-2">
								<div>
									<span className="text-slate-500">1. Apply Weights:</span>
									<br/>
									W_JABATAN = {sumJabatan} * {bobot_jabatan} = <span className="text-blue-300">{weightedJabatan.toFixed(4)}</span>
									<br/>
									W_PERSONAL = {sumPersonal} * {bobot_personal} = <span className="text-amber-300">{weightedPersonal.toFixed(4)}</span>
								</div>
								<div>
									<span className="text-slate-500">2. Calculate Total Index:</span>
									<br/>
									TOTAL_INDEX = W_JABATAN + W_PERSONAL
									<br/>
									TOTAL_INDEX = {weightedJabatan.toFixed(4)} + {weightedPersonal.toFixed(4)} = <span className="text-white font-bold">{totalIndex.toFixed(4)}</span>
								</div>
								<div>
									<span className="text-slate-500">3. Calculate Percentage against Threshold:</span>
									<br/>
									RAW_PERCENTAGE = (TOTAL_INDEX / threshold) * 100
									<br/>
									RAW_PERCENTAGE = ({totalIndex.toFixed(4)} / {threshold}) * 100 = <span className="text-white font-bold">{percentage.toFixed(4)}%</span>
								</div>
							</div>
						</section>

						{/* Edge cases and final result */}
						<section>
							<h3 className="text-green-400 font-semibold mb-2 flex items-center gap-2 border-b border-slate-800 pb-1">
								[3] EDGE CASES & FINAL RESULT
							</h3>
							<div className="pl-4 space-y-2">
								<div>
									<span className="text-slate-500">Edge Case Check: Is Percentage &gt; 100%?</span>
									<br/>
									{isCapped ? (
										<span className="text-red-400">TRUE. Capping at 100%.</span>
									) : (
										<span className="text-green-400">FALSE. No capping required.</span>
									)}
								</div>
								<div className="mt-4 p-3 bg-slate-900 border border-slate-700 rounded text-center">
									<div className="text-slate-400 mb-1">FINAL DB VALUE (remunerasi_percentage)</div>
									<div className="text-3xl text-emerald-400 font-bold">
										{cappedPercentage.toFixed(2)}%
									</div>
									<div className="text-xs text-slate-500 mt-1">
										Backend return value: {pegawai.remunerasi_percentage}%
									</div>
								</div>
							</div>
						</section>
					</div>
				</ScrollArea>
			</DialogContent>
		</Dialog>
	);
}
