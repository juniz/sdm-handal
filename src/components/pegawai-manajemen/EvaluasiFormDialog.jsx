import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Loader2, Check, ChevronsUpDown } from "lucide-react";
import { toast } from "sonner";
import { getClientToken } from "@/lib/client-auth";

const MONTHS = [
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

const HISTORY_LIMIT = 5;

export default function EvaluasiFormDialog({
	open,
	onOpenChange,
	pegawai,
	onSuccess,
}) {
	const [year, setYear] = useState(new Date().getFullYear().toString());
	const [month, setMonth] = useState((new Date().getMonth() + 1).toString());
	const [evaluasiList, setEvaluasiList] = useState([]);
	const [formData, setFormData] = useState({
		kode_evaluasi: "",
		keterangan: "",
	});
	const [loading, setLoading] = useState(false);
	const [pegawaiList, setPegawaiList] = useState([]);
	const [openPegawai, setOpenPegawai] = useState(false);
	const [pegawaiSearch, setPegawaiSearch] = useState("");

	// Fetch employees for dropdown
	const fetchPegawaiList = useCallback(async () => {
		try {
			const token = getClientToken();
			const headers = {};
			if (token) headers["Authorization"] = `Bearer ${token}`;
			const res = await fetch(
				"/api/pegawai-manajemen?limit=1000&stts_aktif=AKTIF",
				{ headers },
			);
			const json = await res.json();
			if (res.ok) setPegawaiList(json.data || []);
		} catch (err) {
			console.error("Failed to fetch pegawai", err);
		}
	}, []);

	useEffect(() => {
		if (open) {
			fetchEvaluasiList();
			fetchPegawaiList();
			setFormData({ kode_evaluasi: "", keterangan: "" });
			setYear(new Date().getFullYear().toString());
			setMonth((new Date().getMonth() + 1).toString());
			setLoading(false);
		}
	}, [open]);

	// History state
	const [historyData, setHistoryData] = useState([]);
	const [historyLoading, setHistoryLoading] = useState(false);
	const [historyPage, setHistoryPage] = useState(1);
	const [hasMoreHistory, setHasMoreHistory] = useState(true);
	const observerTarget = useRef(null);

	// Fetch history when pegawai or open changes, or page increments
	// Define fetchHistory with useCallback to avoid dependency warnings and infinite loops
	const fetchHistory = useCallback(
		async (reset = false) => {
			const targetPegawaiId = pegawai?.id || formData.id;
			if (!targetPegawaiId) return;
			if (!reset && (historyLoading || !hasMoreHistory)) return;

			try {
				setHistoryLoading(true);
				const token = getClientToken();
				const headers = {};
				if (token) headers["Authorization"] = `Bearer ${token}`;

				const currentPage = reset ? 1 : historyPage;
				const params = new URLSearchParams({
					id: targetPegawaiId,
					page: currentPage,
					limit: HISTORY_LIMIT,
				});

				const res = await fetch(
					`/api/pegawai-manajemen/evaluasi-kinerja-pegawai?${params}`,
					{ headers },
				);
				const result = await res.json();

				if (res.ok) {
					const newData = result.data || [];
					if (newData.length < HISTORY_LIMIT) {
						setHasMoreHistory(false);
					} else {
						setHasMoreHistory(true);
					}

					setHistoryData((prev) => {
						if (currentPage === 1) return newData;
						return [...prev, ...newData];
					});
				} else {
					toast.error("Gagal memuat riwayat penilaian");
				}
			} catch (err) {
				console.error("Failed to fetch history", err);
				toast.error("Terjadi kesalahan saat memuat riwayat");
			} finally {
				setHistoryLoading(false);
			}
		},
		[pegawai?.id, formData.id, historyPage, hasMoreHistory, historyLoading],
	);

	useEffect(() => {
		if (open) {
			if (pegawai?.id) {
				// Initial fetch or reset when modal opens
				setHistoryData([]);
				setHistoryPage(1);
				setHasMoreHistory(true);
				fetchHistory(true);
			} else if (formData.id) {
				// If formData.id is set (e.g. from select), fetch history for that pegawai
				setHistoryData([]);
				setHistoryPage(1);
				setHasMoreHistory(true);
				fetchHistory(true);
			}
		}
	}, [open, pegawai?.id, formData.id]); // Trigger on open, pegawai change, or selected pegawai change

	// Trigger fetch when historyPage changes (for pagination/infinite scroll)
	useEffect(() => {
		if (open && historyPage > 1) {
			fetchHistory(false);
		}
	}, [historyPage]);

	// Intersection Observer for lazy loading
	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && hasMoreHistory && !historyLoading) {
					setHistoryPage((prev) => prev + 1);
				}
			},
			{ threshold: 1.0 },
		);

		if (observerTarget.current) {
			observer.observe(observerTarget.current);
		}

		return () => {
			if (observerTarget.current) {
				observer.unobserve(observerTarget.current);
			}
		};
	}, [hasMoreHistory, historyLoading]);

	const fetchEvaluasiList = async () => {
		try {
			const token = getClientToken();
			const headers = {};
			if (token) headers["Authorization"] = `Bearer ${token}`;
			const res = await fetch("/api/pegawai-manajemen/evaluasi-kinerja", {
				headers,
			});
			const json = await res.json();
			if (res.ok) setEvaluasiList(json.data || []);
		} catch (err) {
			console.error("Failed to fetch evaluasi types", err);
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		const targetPegawaiId = pegawai?.id || formData.id;
		if (!targetPegawaiId) {
			toast.error("Silakan pilih pegawai terlebih dahulu");
			return;
		}

		setLoading(true);
		const token = getClientToken();
		const headers = {
			"Content-Type": "application/json",
			...(token && { Authorization: `Bearer ${token}` }),
		};

		const payload = {
			id: targetPegawaiId,
			kode_evaluasi: formData.kode_evaluasi,
			keterangan: formData.keterangan,
			tahun: year,
			bulan: month,
		};

		try {
			const res = await fetch(
				"/api/pegawai-manajemen/evaluasi-kinerja-pegawai",
				{
					method: "POST",
					headers,
					body: JSON.stringify(payload),
				},
			);
			const result = await res.json();

			if (res.ok) {
				toast.success(result.message);
				// Don't close the modal, just refresh history and reset form
				// onOpenChange(false);
				if (onSuccess) onSuccess();

				// Reset form fields
				setFormData({ kode_evaluasi: "", keterangan: "" });

				// Refresh history to show the new entry
				setHistoryPage(1);
				setHasMoreHistory(true);
				fetchHistory(true);
			} else {
				toast.error(result.message || "Terjadi kesalahan");
			}
		} catch (err) {
			toast.error("Terjadi kesalahan");
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden sm:max-w-lg w-[95vw] sm:w-full"
				onCloseAutoFocus={(e) => {
					e.preventDefault();
				}}
			>
				<DialogHeader className="p-6 pb-2 shrink-0">
					<DialogTitle>Input Evaluasi Kinerja</DialogTitle>
					<DialogDescription>
						Input penilaian kinerja untuk <strong>{pegawai?.nama}</strong>
					</DialogDescription>
				</DialogHeader>

				<ScrollArea className="flex-1 w-full">
					<div className="px-6 py-2">
						<form onSubmit={handleSubmit} className="space-y-6">
							{!pegawai && (
								<div className="space-y-2">
									<Label>Pegawai *</Label>
									<Popover open={openPegawai} onOpenChange={setOpenPegawai}>
										<PopoverTrigger asChild>
											<Button
												variant="outline"
												role="combobox"
												aria-expanded={openPegawai}
												className={cn(
													"w-full justify-between font-normal",
													!formData.id && "text-muted-foreground",
												)}
											>
												{formData.id
													? (() => {
															const peg = pegawaiList.find(
																(p) => String(p.id) === String(formData.id),
															);
															return peg
																? `${peg.nik} - ${peg.nama}`
																: "Pilih Pegawai";
													  })()
													: "Pilih Pegawai"}
												<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
											</Button>
										</PopoverTrigger>
										<PopoverContent
											className="w-[var(--radix-popover-trigger-width)] p-0"
											align="start"
										>
											<Command shouldFilter={false}>
												<CommandInput
													placeholder="Cari NIK atau Nama..."
													value={pegawaiSearch}
													onValueChange={setPegawaiSearch}
												/>
												<CommandList>
													<CommandEmpty>
														{pegawaiList.length === 0
															? "Memuat data..."
															: "Pegawai tidak ditemukan."}
													</CommandEmpty>
													<CommandGroup>
														{pegawaiList
															.filter((p) => {
																if (!pegawaiSearch) return true;
																const searchLower = pegawaiSearch.toLowerCase();
																return (
																	p.nik?.toLowerCase().includes(searchLower) ||
																	p.nama?.toLowerCase().includes(searchLower)
																);
															})
															.slice(0, 50) // Limit to 50 for performance
															.map((p) => (
																<CommandItem
																	key={p.id}
																	value={String(p.id)}
																	onSelect={(currentValue) => {
																		setFormData((prev) => ({
																			...prev,
																			id:
																				currentValue === String(formData.id)
																					? ""
																					: currentValue,
																		}));
																		setOpenPegawai(false);
																	}}
																>
																	<Check
																		className={cn(
																			"mr-2 h-4 w-4",
																			String(formData.id) === String(p.id)
																				? "opacity-100"
																				: "opacity-0",
																		)}
																	/>
																	{p.nik} - {p.nama}
																</CommandItem>
															))}
													</CommandGroup>
												</CommandList>
											</Command>
										</PopoverContent>
									</Popover>
								</div>
							)}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div className="space-y-2">
									<Label htmlFor="bulan">Bulan</Label>
									<Select value={month} onValueChange={setMonth}>
										<SelectTrigger id="bulan" className="w-full">
											<SelectValue placeholder="Bulan" />
										</SelectTrigger>
										<SelectContent>
											{MONTHS.map((m, i) => (
												<SelectItem key={i + 1} value={(i + 1).toString()}>
													{m}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-2">
									<Label htmlFor="tahun">Tahun</Label>
									<Select value={year} onValueChange={setYear}>
										<SelectTrigger id="tahun" className="w-full">
											<SelectValue placeholder="Tahun" />
										</SelectTrigger>
										<SelectContent>
											{Array.from(
												{ length: 5 },
												(_, i) => new Date().getFullYear() - 2 + i,
											).map((y) => (
												<SelectItem key={y} value={y.toString()}>
													{y}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="jenis-evaluasi">
									Jenis Evaluasi <span className="text-red-500">*</span>
								</Label>
								<Select
									value={formData.kode_evaluasi}
									onValueChange={(v) =>
										setFormData((prev) => ({ ...prev, kode_evaluasi: v }))
									}
									required
								>
									<SelectTrigger id="jenis-evaluasi" className="w-full">
										<SelectValue placeholder="Pilih Jenis Evaluasi" />
									</SelectTrigger>
									<SelectContent>
										{evaluasiList.map((e) => (
											<SelectItem key={e.kode_evaluasi} value={String(e.kode_evaluasi)}>
												{e.nama_evaluasi} (Indek: {e.indek})
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label htmlFor="keterangan">Keterangan</Label>
								<Input
									id="keterangan"
									value={formData.keterangan}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											keterangan: e.target.value,
										}))
									}
									placeholder="Catatan tambahan (opsional)"
									className="w-full"
								/>
							</div>

							<div className="pt-4 border-t">
								<Label className="mb-4 block text-base font-semibold">
									Riwayat Penilaian
								</Label>
								{historyData.length === 0 && !historyLoading ? (
									<p className="text-sm text-gray-500 text-center py-4">
										Belum ada riwayat penilaian
									</p>
								) : (
									<div className="space-y-3">
										{historyData.map((item, index) => (
											<div
												key={`${item.id}-${item.kode_evaluasi}-${item.tahun}-${item.bulan}-${index}`}
												className="p-3 border rounded-lg bg-gray-50/50 space-y-2"
											>
												<div className="flex justify-between items-start">
													<div>
														<p className="font-medium text-sm">
															{item.nama_evaluasi}
														</p>
														<p className="text-xs text-gray-500">
															Periode: {MONTHS[parseInt(item.bulan) - 1]}{" "}
															{item.tahun}
														</p>
													</div>
													<Badge variant="secondary" className="text-xs">
														Indek: {item.indek}
													</Badge>
												</div>
												{item.keterangan && (
													<p className="text-xs text-gray-600 italic">
														"{item.keterangan}"
													</p>
												)}
											</div>
										))}

										{/* Loading indicator / sentinel */}
										<div
											ref={observerTarget}
											className="h-4 w-full flex justify-center items-center"
										>
											{historyLoading && (
												<Loader2 className="h-4 w-4 animate-spin text-gray-400" />
											)}
										</div>
									</div>
								)}
							</div>
						</form>
					</div>
				</ScrollArea>

				<DialogFooter className="p-6 pt-2 shrink-0">
					<Button
						type="button"
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={loading}
					>
						Batal
					</Button>
					<Button type="submit" disabled={loading} onClick={handleSubmit}>
						{loading ? "Menyimpan..." : "Simpan"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
