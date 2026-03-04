"use client";

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
import { Loader2 } from "lucide-react";
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

export default function PencapaianFormDialog({
	open,
	onOpenChange,
	pegawai,
	onSuccess,
}) {
	const [year, setYear] = useState(new Date().getFullYear().toString());
	const [month, setMonth] = useState((new Date().getMonth() + 1).toString());
	const [pencapaianList, setPencapaianList] = useState([]);
	const [formData, setFormData] = useState({
		kode_pencapaian: "",
		keterangan: "",
	});
	const [loading, setLoading] = useState(false);

	// History state
	const [historyData, setHistoryData] = useState([]);
	const [historyLoading, setHistoryLoading] = useState(false);
	const [historyPage, setHistoryPage] = useState(1);
	const [hasMoreHistory, setHasMoreHistory] = useState(true);
	const observerTarget = useRef(null);

	useEffect(() => {
		if (open) {
			fetchPencapaianList();
			setFormData({ kode_pencapaian: "", keterangan: "" });
			setYear(new Date().getFullYear().toString());
			setMonth((new Date().getMonth() + 1).toString());
			setLoading(false);
		}
	}, [open]);

	// Fetch history when pegawai or open changes, or page increments
	const fetchHistory = useCallback(
		async (reset = false) => {
			if (!pegawai?.id) return;
			if (!reset && (historyLoading || !hasMoreHistory)) return;

			try {
				setHistoryLoading(true);
				const token = getClientToken();
				const headers = {};
				if (token) headers["Authorization"] = `Bearer ${token}`;

				const currentPage = reset ? 1 : historyPage;
				const params = new URLSearchParams({
					id: pegawai.id,
					page: currentPage,
					limit: HISTORY_LIMIT,
				});

				const res = await fetch(
					`/api/pegawai-manajemen/pencapaian-kinerja-pegawai?${params}`,
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
					toast.error("Gagal memuat riwayat pencapaian");
				}
			} catch (err) {
				console.error("Failed to fetch history", err);
				toast.error("Terjadi kesalahan saat memuat riwayat");
			} finally {
				setHistoryLoading(false);
			}
		},
		[pegawai?.id, historyPage, hasMoreHistory, historyLoading],
	);

	useEffect(() => {
		if (open && pegawai?.id) {
			// Initial fetch or reset when modal opens
			setHistoryData([]);
			setHistoryPage(1);
			setHasMoreHistory(true);
			fetchHistory(true);
		}
	}, [open, pegawai?.id]);

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

	const fetchPencapaianList = async () => {
		try {
			const token = getClientToken();
			const headers = {};
			if (token) headers["Authorization"] = `Bearer ${token}`;
			const res = await fetch("/api/pegawai-manajemen/pencapaian-kinerja", {
				headers,
			});
			const json = await res.json();
			if (res.ok) setPencapaianList(json.data || []);
		} catch (err) {
			console.error("Failed to fetch pencapaian types", err);
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!pegawai) return;

		setLoading(true);
		const token = getClientToken();
		const headers = {
			"Content-Type": "application/json",
			...(token && { Authorization: `Bearer ${token}` }),
		};

		const payload = {
			id: pegawai.id,
			kode_pencapaian: formData.kode_pencapaian,
			keterangan: formData.keterangan,
			tahun: year,
			bulan: month,
		};

		try {
			const res = await fetch(
				"/api/pegawai-manajemen/pencapaian-kinerja-pegawai",
				{
					method: "POST",
					headers,
					body: JSON.stringify(payload),
				},
			);
			const result = await res.json();

			if (res.ok) {
				toast.success(result.message);
				if (onSuccess) onSuccess();

				// Reset form fields
				setFormData({ kode_pencapaian: "", keterangan: "" });

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
					<DialogTitle>Input Pencapaian Kinerja</DialogTitle>
					<DialogDescription>
						Input pencapaian kinerja untuk <strong>{pegawai?.nama}</strong>
					</DialogDescription>
				</DialogHeader>

				<ScrollArea className="flex-1 w-full">
					<div className="px-6 py-2">
						<form onSubmit={handleSubmit} className="space-y-6">
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
								<Label htmlFor="jenis-pencapaian">
									Jenis Pencapaian <span className="text-red-500">*</span>
								</Label>
								<Select
									value={formData.kode_pencapaian}
									onValueChange={(v) =>
										setFormData((prev) => ({ ...prev, kode_pencapaian: v }))
									}
									required
								>
									<SelectTrigger id="jenis-pencapaian" className="w-full">
										<SelectValue placeholder="Pilih Jenis Pencapaian" />
									</SelectTrigger>
									<SelectContent>
										{pencapaianList.map((e) => (
											<SelectItem
												key={e.kode_pencapaian}
												value={e.kode_pencapaian}
											>
												{e.nama_pencapaian} (Indek: {e.indek})
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
									Riwayat Pencapaian
								</Label>
								{historyData.length === 0 && !historyLoading ? (
									<p className="text-sm text-gray-500 text-center py-4">
										Belum ada riwayat pencapaian
									</p>
								) : (
									<div className="space-y-3">
										{historyData.map((item, index) => (
											<div
												key={`${item.id}-${item.kode_pencapaian}-${item.tahun}-${item.bulan}-${index}`}
												className="p-3 border rounded-lg bg-gray-50/50 space-y-2"
											>
												<div className="flex justify-between items-start">
													<div>
														<p className="font-medium text-sm">
															{item.nama_pencapaian}
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
