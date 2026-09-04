"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/DatePicker";
import { PegawaiCombobox } from "@/components/PegawaiCombobox";
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
import { toast } from "sonner";
import {
	Loader2,
	Plus,
	RefreshCcw,
	UserCheck,
	FileText,
	ArrowRightLeft,
	Clock,
} from "lucide-react";
import moment from "moment-timezone";

const DEFAULT_SHIFTS = ["Pagi", "Siang", "Malam"];

const PengajuanFormModal = ({
	open,
	onOpenChange,
	onSubmit,
	shiftData = [],
	submitLoading = false,
	pegawaiLoading = false,
	userLoading = false,
	currentUserNik = null,
}) => {
	// Track mounting state untuk mencegah DOM errors pada mobile Radix portal
	const isMountedRef = useRef(true);
	const isClosingRef = useRef(false);

	// Form state
	const [formData, setFormData] = useState({
		tgl_dinas: "",
		shift1: "",
		nik_ganti: "",
		tgl_ganti: "",
		shift2: "",
		nik_pj: "",
		kepentingan: "",
	});

	// Date state for DatePicker components
	const [dateState, setDateState] = useState({
		tgl_dinas: undefined,
		tgl_ganti: undefined,
	});

	// Error state for form validation
	const [formErrors, setFormErrors] = useState({});

	// Available shift list (static enum)
	const availableShifts = DEFAULT_SHIFTS;

	// Track mounting lifecycle
	useEffect(() => {
		isMountedRef.current = true;
		return () => {
			isMountedRef.current = false;
		};
	}, []);

	const resetForm = useCallback(() => {
		if (!isMountedRef.current) return;

		setFormData({
			tgl_dinas: "",
			shift1: "",
			nik_ganti: "",
			tgl_ganti: "",
			shift2: "",
			nik_pj: "",
			kepentingan: "",
		});
		setDateState({
			tgl_dinas: undefined,
			tgl_ganti: undefined,
		});
		setFormErrors({});
	}, []);

	const handleClose = useCallback(() => {
		if (isClosingRef.current) return;
		isClosingRef.current = true;

		requestAnimationFrame(() => {
			if (isMountedRef.current) {
				onOpenChange(false);
			}
			setTimeout(() => {
				isClosingRef.current = false;
			}, 300);
		});
	}, [onOpenChange]);

	const handleOpenChange = useCallback(
		(newOpen) => {
			if (!newOpen && isClosingRef.current) return;

			try {
				if (!newOpen) {
					isClosingRef.current = true;
					requestAnimationFrame(() => {
						if (isMountedRef.current) {
							onOpenChange(newOpen);
						}
						setTimeout(() => {
							if (isMountedRef.current) {
								resetForm();
							}
							isClosingRef.current = false;
						}, 300);
					});
				} else {
					onOpenChange(newOpen);
				}
			} catch (error) {
				console.error("Error handling dialog open change:", error);
				isClosingRef.current = false;
			}
		},
		[onOpenChange, resetForm]
	);

	const validateForm = () => {
		const errors = {};

		if (!dateState.tgl_dinas || !formData.tgl_dinas) {
			errors.tgl_dinas = "Tanggal dinas asal harus diisi";
		}
		if (!formData.shift1) {
			errors.shift1 = "Shift dinas asal harus dipilih";
		}
		if (!formData.nik_ganti) {
			errors.nik_ganti = "Rekan pengganti harus dipilih";
		} else if (currentUserNik && formData.nik_ganti === currentUserNik) {
			errors.nik_ganti = "Tidak bisa menukar dinas dengan diri sendiri";
		}
		if (!dateState.tgl_ganti || !formData.tgl_ganti) {
			errors.tgl_ganti = "Tanggal dinas pengganti harus diisi";
		}
		if (!formData.shift2) {
			errors.shift2 = "Shift pengganti harus dipilih";
		}
		if (!formData.nik_pj) {
			errors.nik_pj = "Penanggung Jawab harus dipilih";
		}
		if (!formData.kepentingan || !formData.kepentingan.trim()) {
			errors.kepentingan = "Alasan tukar dinas harus diisi";
		}

		setFormErrors(errors);
		return Object.keys(errors).length === 0;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (!validateForm()) {
			toast.error("Harap lengkapi semua field yang diperlukan");
			return;
		}

		const submitData = {
			...formData,
			tanggal: moment().format("YYYY-MM-DD"),
		};

		const success = await onSubmit(submitData);

		if (success) {
			resetForm();
		}
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange} modal={false}>
			<DialogContent className="max-w-full sm:max-w-3xl lg:max-w-5xl max-h-[95vh] overflow-hidden flex flex-col mx-2 sm:mx-auto p-0 gap-0 rounded-xl border-slate-200 bg-white shadow-xl">
				{/* Dialog Header */}
				<DialogHeader className="p-4 sm:p-5 pb-3.5 border-b border-slate-100 flex-shrink-0 bg-white">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100 flex-shrink-0">
							<RefreshCcw className="w-5 h-5" />
						</div>
						<div className="min-w-0 flex-1">
							<DialogTitle className="text-base sm:text-lg lg:text-xl font-bold text-slate-900 leading-tight">
								Pengajuan Tukar Dinas
							</DialogTitle>
							<DialogDescription className="text-xs sm:text-sm text-slate-500 mt-0.5">
								Formulir pertukaran jadwal dinas antar pegawai rumah sakit
							</DialogDescription>
						</div>
					</div>
				</DialogHeader>

				{/* Scrollable Form Body */}
				<div className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6 space-y-4 lg:space-y-5">
					<form id="form-tukar-dinas" onSubmit={handleSubmit} className="space-y-4 lg:space-y-5">
						{/* DESKTOP SIDE-BY-SIDE EXCHANGE WORKSPACE (SEKSI 1 & 2) */}
						<div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] items-stretch gap-3 lg:gap-3">
							{/* SEKSI 1: Jadwal Dinas Pemohon (Asal) */}
							<div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5 space-y-3.5 flex flex-col justify-between">
								<div>
									<div className="flex items-center gap-2 pb-2 border-b border-slate-200/60 mb-3">
										<span className="w-5 h-5 rounded-full bg-sky-600 text-white text-[11px] font-bold flex items-center justify-center">
											1
										</span>
										<h3 className="text-xs sm:text-sm font-semibold text-slate-900 flex items-center gap-1.5">
											<Clock className="w-3.5 h-3.5 text-sky-600" />
											Jadwal Dinas Anda (Dinas Asal)
										</h3>
									</div>

									<div className="space-y-3">
										<div className="space-y-1.5">
											<Label htmlFor="tgl_dinas" className="text-xs font-medium text-slate-700">
												Tanggal Dinas Anda <span className="text-red-500">*</span>
											</Label>
											<DatePicker
												value={dateState.tgl_dinas}
												onChange={(value) => {
													setDateState((prev) => ({ ...prev, tgl_dinas: value }));
													setFormData((prev) => ({
														...prev,
														tgl_dinas: value ? moment(value).format("YYYY-MM-DD") : "",
													}));
													if (formErrors.tgl_dinas) {
														setFormErrors((prev) => ({ ...prev, tgl_dinas: "" }));
													}
												}}
												placeholder="Pilih tanggal dinas asal"
												error={formErrors.tgl_dinas}
												minDate={moment().startOf("day").toDate()}
											/>
											{formErrors.tgl_dinas && (
												<p className="text-[11px] text-red-600">{formErrors.tgl_dinas}</p>
											)}
										</div>

										<div className="space-y-1.5">
											<Label htmlFor="shift1" className="text-xs font-medium text-slate-700">
												Shift Anda <span className="text-red-500">*</span>
											</Label>
											<Select
												value={formData.shift1}
												onValueChange={(value) => {
													setFormData((prev) => ({ ...prev, shift1: value }));
													if (formErrors.shift1) {
														setFormErrors((prev) => ({ ...prev, shift1: "" }));
													}
												}}
											>
												<SelectTrigger className="w-full h-10 bg-white border-slate-200 text-sm">
													<SelectValue placeholder="Pilih shift Anda" />
												</SelectTrigger>
												<SelectContent>
													{availableShifts.map((shift) => (
														<SelectItem key={`shift1-${shift}`} value={shift}>
															{shift}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											{formErrors.shift1 && (
												<p className="text-[11px] text-red-600">{formErrors.shift1}</p>
											)}
										</div>
									</div>
								</div>

								<div className="pt-2 text-[11px] text-slate-500 bg-white/70 p-2.5 rounded-lg border border-slate-200/50">
									Jadwal dinas yang hendak Anda tukarkan kepada rekan sejawat.
								</div>
							</div>

							{/* CENTRAL EXCHANGE BRIDGE (Desktop Vertical / Mobile Horizontal) */}
							<div className="hidden lg:flex flex-col items-center justify-center px-1">
								<div className="w-px h-full bg-slate-200 flex-1 my-2" />
								<div className="w-8 h-8 rounded-full bg-sky-50 border border-sky-200 text-sky-600 flex items-center justify-center shadow-2xs my-1" title="Pertukaran">
									<ArrowRightLeft className="w-4 h-4" />
								</div>
								<div className="w-px h-full bg-slate-200 flex-1 my-2" />
							</div>

							{/* Mobile Visual Divider */}
							<div className="flex lg:hidden items-center justify-center gap-2 text-slate-400 py-0.5">
								<div className="h-px bg-slate-200 flex-1" />
								<div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full text-xs font-medium text-slate-600">
									<ArrowRightLeft className="w-3.5 h-3.5 text-sky-600" />
									<span>Ditukar Dengan</span>
								</div>
								<div className="h-px bg-slate-200 flex-1" />
							</div>

							{/* SEKSI 2: Rekan & Jadwal Pengganti (Ganti) */}
							<div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5 space-y-3 flex flex-col justify-between">
								<div>
									<div className="flex items-center gap-2 pb-2 border-b border-slate-200/60 mb-3">
										<span className="w-5 h-5 rounded-full bg-sky-600 text-white text-[11px] font-bold flex items-center justify-center">
											2
										</span>
										<h3 className="text-xs sm:text-sm font-semibold text-slate-900 flex items-center gap-1.5">
											<UserCheck className="w-3.5 h-3.5 text-sky-600" />
											Rekan & Jadwal Pengganti
										</h3>
									</div>

									<div className="space-y-3">
										<div className="space-y-1.5">
											<Label htmlFor="nik_ganti" className="text-xs font-medium text-slate-700">
												Pegawai Rekan Pengganti <span className="text-red-500">*</span>
											</Label>
											<PegawaiCombobox
												value={formData.nik_ganti}
												onValueChange={(value) => {
													setFormData((prev) => ({ ...prev, nik_ganti: value }));
													if (formErrors.nik_ganti) {
														setFormErrors((prev) => ({ ...prev, nik_ganti: "" }));
													}
												}}
												error={formErrors.nik_ganti}
											/>
											{formErrors.nik_ganti && (
												<p className="text-[11px] text-red-600">{formErrors.nik_ganti}</p>
											)}
										</div>

										<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
											<div className="space-y-1.5">
												<Label htmlFor="tgl_ganti" className="text-xs font-medium text-slate-700">
													Tanggal Ganti <span className="text-red-500">*</span>
												</Label>
												<DatePicker
													value={dateState.tgl_ganti}
													onChange={(value) => {
														setDateState((prev) => ({ ...prev, tgl_ganti: value }));
														setFormData((prev) => ({
															...prev,
															tgl_ganti: value ? moment(value).format("YYYY-MM-DD") : "",
														}));
														if (formErrors.tgl_ganti) {
															setFormErrors((prev) => ({ ...prev, tgl_ganti: "" }));
														}
													}}
													placeholder="Pilih tanggal"
													error={formErrors.tgl_ganti}
													minDate={moment().startOf("day").toDate()}
												/>
												{formErrors.tgl_ganti && (
													<p className="text-[11px] text-red-600">{formErrors.tgl_ganti}</p>
												)}
											</div>

											<div className="space-y-1.5">
												<Label htmlFor="shift2" className="text-xs font-medium text-slate-700">
													Shift Pengganti <span className="text-red-500">*</span>
												</Label>
												<Select
													value={formData.shift2}
													onValueChange={(value) => {
														setFormData((prev) => ({ ...prev, shift2: value }));
														if (formErrors.shift2) {
															setFormErrors((prev) => ({ ...prev, shift2: "" }));
														}
													}}
												>
													<SelectTrigger className="w-full h-10 bg-white border-slate-200 text-sm">
														<SelectValue placeholder="Pilih shift" />
													</SelectTrigger>
													<SelectContent>
														{availableShifts.map((shift) => (
															<SelectItem key={`shift2-${shift}`} value={shift}>
																{shift}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
												{formErrors.shift2 && (
													<p className="text-[11px] text-red-600">{formErrors.shift2}</p>
												)}
											</div>
										</div>
									</div>
								</div>

								<div className="pt-2 text-[11px] text-slate-500 bg-white/70 p-2.5 rounded-lg border border-slate-200/50">
									Jadwal dinas pengganti yang akan dijalankan oleh rekan yang ditunjuk.
								</div>
							</div>
						</div>

						{/* SEKSI 3: Penanggung Jawab & Alasan (DESKTOP 2-COLUMN BALANCED GRID) */}
						<div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5 space-y-3.5">
							<div className="flex items-center gap-2 pb-2 border-b border-slate-200/60">
								<span className="w-5 h-5 rounded-full bg-sky-600 text-white text-[11px] font-bold flex items-center justify-center">
									3
								</span>
								<h3 className="text-xs sm:text-sm font-semibold text-slate-900 flex items-center gap-1.5">
									<FileText className="w-3.5 h-3.5 text-sky-600" />
									Otorisasi & Alasan Pengajuan
								</h3>
							</div>

							<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
								{/* Left: PJ Combobox + Info */}
								<div className="space-y-2">
									<div className="space-y-1.5">
										<Label htmlFor="nik_pj" className="text-xs font-medium text-slate-700">
											Penanggung Jawab / Kepala Ruangan <span className="text-red-500">*</span>
										</Label>
										<PegawaiCombobox
											value={formData.nik_pj}
											onValueChange={(value) => {
												setFormData((prev) => ({ ...prev, nik_pj: value }));
												if (formErrors.nik_pj) {
													setFormErrors((prev) => ({ ...prev, nik_pj: "" }));
												}
											}}
											error={formErrors.nik_pj}
										/>
										{formErrors.nik_pj && (
											<p className="text-[11px] text-red-600">{formErrors.nik_pj}</p>
										)}
									</div>
									<p className="text-[11px] text-slate-500 leading-relaxed">
										Pilih Kepala Ruangan / Penanggung Jawab yang berwenang menyetujui jadwal shift di unit kerja Anda.
									</p>
								</div>

								{/* Right: Alasan / Kepentingan Textarea */}
								<div className="space-y-1.5">
									<Label htmlFor="kepentingan" className="text-xs font-medium text-slate-700">
										Alasan / Keperluan Tukar Dinas <span className="text-red-500">*</span>
									</Label>
									<Textarea
										id="kepentingan"
										value={formData.kepentingan}
										onChange={(e) => {
											setFormData((prev) => ({ ...prev, kepentingan: e.target.value }));
											if (formErrors.kepentingan) {
												setFormErrors((prev) => ({ ...prev, kepentingan: "" }));
											}
										}}
										rows={3}
										placeholder="Tuliskan alasan pertukaran dinas secara jelas..."
										className="resize-none bg-white border-slate-200 focus:border-sky-500 focus:ring-sky-500/20 text-xs sm:text-sm"
									/>
									{formErrors.kepentingan && (
										<p className="text-[11px] text-red-600">{formErrors.kepentingan}</p>
									)}
								</div>
							</div>
						</div>
					</form>
				</div>

				{/* Dialog Footer */}
				<DialogFooter className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/50 flex-shrink-0 flex flex-col sm:flex-row gap-2 sm:justify-end">
					<Button
						type="button"
						variant="outline"
						onClick={handleClose}
						className="w-full sm:w-auto h-10 text-xs sm:text-sm font-medium border-slate-200 text-slate-700 hover:bg-slate-100"
						disabled={submitLoading || pegawaiLoading || userLoading}
					>
						Batal
					</Button>
					<Button
						type="submit"
						form="form-tukar-dinas"
						disabled={submitLoading || pegawaiLoading || userLoading}
						className="w-full sm:w-auto h-10 text-xs sm:text-sm font-medium bg-sky-600 hover:bg-sky-700 text-white shadow-sm transition-all"
					>
						{submitLoading ? (
							<>
								<Loader2 className="w-4 h-4 animate-spin mr-1.5" />
								Mengirim Pengajuan...
							</>
						) : (
							<>
								<Plus className="w-4 h-4 mr-1.5" />
								Submit Pengajuan
							</>
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default PengajuanFormModal;

