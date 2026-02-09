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
import { Loader2, Plus, RefreshCcw, Clock, Users, Edit } from "lucide-react";
import moment from "moment-timezone";

const PengajuanFormModal = ({
	open,
	onOpenChange,
	onSubmit,
	shiftData = [],
	submitLoading = false,
	pegawaiLoading = false,
	userLoading = false,
}) => {
	// Track mounting state untuk mencegah DOM errors
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
	const [formErrors, setFormErrors] = useState({
		tgl_dinas: "",
		shift1: "",
		nik_ganti: "",
		tgl_ganti: "",
		shift2: "",
		nik_pj: "",
		kepentingan: "",
	});
	
	// Track mounting lifecycle
	useEffect(() => {
		isMountedRef.current = true;
		return () => {
			isMountedRef.current = false;
		};
	}, []);

	const handleSubmit = async (e) => {
		e.preventDefault();

		// Validasi form
		const requiredFields = ["shift1", "shift2", "kepentingan"];
		for (let field of requiredFields) {
			if (!formData[field]) {
				toast.error(`Field ${field.replace("_", " ")} harus diisi`);
				return;
			}
		}

		// Validasi date fields
		if (!dateState.tgl_dinas) {
			toast.error("Tanggal dinas harus diisi");
			return;
		}

		if (!formData.nik_ganti) {
			toast.error("NIK pengganti harus diisi");
			return;
		}

		if (!dateState.tgl_ganti) {
			toast.error("Tanggal dinas pengganti harus diisi");
			return;
		}

		// Prepare submit data
		const submitData = {
			...formData,
			tanggal: moment().format("YYYY-MM-DD"),
		};

		// Call parent submit function
		const success = await onSubmit(submitData);

		if (success) {
			// Reset form
			resetForm();
		}
	};

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
		setFormErrors({
			tgl_dinas: "",
			shift1: "",
			nik_ganti: "",
			tgl_ganti: "",
			shift2: "",
			nik_pj: "",
			kepentingan: "",
		});
	}, []);

	const handleClose = useCallback(() => {
		if (isClosingRef.current) return;
		isClosingRef.current = true;
		
		// Gunakan requestAnimationFrame untuk mencegah race condition
		requestAnimationFrame(() => {
			if (isMountedRef.current) {
				onOpenChange(false);
			}
			// Reset closing flag setelah animasi selesai
			setTimeout(() => {
				isClosingRef.current = false;
			}, 300);
		});
	}, [onOpenChange]);

	// Handle onOpenChange dengan error handling yang lebih robust
	const handleOpenChange = useCallback((newOpen) => {
		// Cegah multiple closing calls
		if (!newOpen && isClosingRef.current) return;
		
		try {
			if (!newOpen) {
				isClosingRef.current = true;
				
				// Delay untuk memastikan nested popovers sudah tertutup
				requestAnimationFrame(() => {
					if (isMountedRef.current) {
						onOpenChange(newOpen);
					}
					
					// Reset form setelah dialog tertutup
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
	}, [onOpenChange, resetForm]);

	return (
		<Dialog open={open} onOpenChange={handleOpenChange} modal={false}>
			<DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden flex flex-col mx-2 sm:mx-auto">
				<DialogHeader className="flex-shrink-0 pb-4 md:pb-6 border-b">
					<div className="flex items-center gap-3 md:gap-4">
						<div className="flex-shrink-0 w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
							<RefreshCcw className="w-6 h-6 md:w-7 md:h-7 text-white" />
						</div>
						<div className="min-w-0 flex-1">
							<DialogTitle className="text-lg md:text-xl font-bold text-gray-900 leading-tight">
								Pengajuan Tukar Dinas
							</DialogTitle>
							<DialogDescription className="text-sm md:text-base text-gray-600 mt-1 leading-relaxed">
								Lengkapi formulir berikut untuk mengajukan pertukaran jadwal
								dinas
							</DialogDescription>
						</div>
					</div>
				</DialogHeader>

				<div className="flex-1 overflow-y-auto py-4 md:py-6">
					<form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
						{/* Section 1: Penanggung Jawab */}
						<div className="space-y-3 md:space-y-4">
							<div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
								<div className="w-7 h-7 md:w-8 md:h-8 bg-blue-100 rounded-lg flex items-center justify-center">
									<Users className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-600" />
								</div>
								<h3 className="text-base md:text-lg font-semibold text-gray-900">
									Penanggung Jawab
								</h3>
							</div>

							<div className="bg-gray-50 rounded-xl p-4 md:p-6">
								<div className="space-y-2">
									<Label
										htmlFor="nik_pj"
										className="text-sm font-medium text-gray-700"
									>
										Penanggung Jawab
									</Label>
									<PegawaiCombobox
										value={formData.nik_pj}
										onValueChange={(value) =>
											setFormData({ ...formData, nik_pj: value })
										}
										error={formErrors.nik_pj}
									/>
								</div>
							</div>
						</div>

						{/* Section 2: Jadwal Dinas Asal */}
						<div className="space-y-3 md:space-y-4">
							<div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
								<div className="w-7 h-7 md:w-8 md:h-8 bg-orange-100 rounded-lg flex items-center justify-center">
									<Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-orange-600" />
								</div>
								<h3 className="text-base md:text-lg font-semibold text-gray-900">
									Jadwal Dinas Anda
								</h3>
							</div>

							<div className="bg-orange-50 rounded-xl p-4 md:p-6">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
									<div className="space-y-2">
										<Label
											htmlFor="tgl_dinas"
											className="text-sm font-medium text-gray-700"
										>
											Tanggal Dinas
										</Label>
										<DatePicker
											value={dateState.tgl_dinas}
											onChange={(value) => {
												setDateState({ ...dateState, tgl_dinas: value });
												setFormData({
													...formData,
													tgl_dinas: value
														? moment(value).format("YYYY-MM-DD")
														: "",
												});
											}}
											placeholder="Pilih tanggal dinas"
											error={formErrors.tgl_dinas}
											minDate={moment().startOf("day").toDate()}
										/>
										<p className="text-xs text-gray-500 flex items-center gap-1">
											<span className="w-1 h-1 bg-gray-400 rounded-full"></span>
											Minimal mulai dari hari ini
										</p>
									</div>

									<div className="space-y-2">
										<Label
											htmlFor="shift1"
											className="text-sm font-medium text-gray-700"
										>
											Shift Anda
										</Label>
										<Select
											value={formData.shift1}
											onValueChange={(value) =>
												setFormData({ ...formData, shift1: value })
											}
										>
											<SelectTrigger className="w-full h-11">
												<SelectValue placeholder="Pilih shift Anda" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="Pagi">Pagi</SelectItem>
												<SelectItem value="Siang">Siang</SelectItem>
												<SelectItem value="Malam">Malam</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</div>
							</div>
						</div>

						{/* Section 3: Jadwal Dinas Pengganti */}
						<div className="space-y-3 md:space-y-4">
							<div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
								<div className="w-7 h-7 md:w-8 md:h-8 bg-green-100 rounded-lg flex items-center justify-center">
									<RefreshCcw className="w-3.5 h-3.5 md:w-4 md:h-4 text-green-600" />
								</div>
								<h3 className="text-base md:text-lg font-semibold text-gray-900">
									Jadwal Dinas Pengganti
								</h3>
							</div>

							<div className="bg-green-50 rounded-xl p-4 md:p-6">
								<div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
									<div className="space-y-2">
										<Label
											htmlFor="nik_ganti"
											className="text-sm font-medium text-gray-700"
										>
											Pegawai Pengganti
										</Label>
										<PegawaiCombobox
											value={formData.nik_ganti}
											onValueChange={(value) =>
												setFormData({ ...formData, nik_ganti: value })
											}
											error={formErrors.nik_ganti}
										/>
									</div>

									<div className="space-y-2">
										<Label
											htmlFor="tgl_ganti"
											className="text-sm font-medium text-gray-700"
										>
											Tanggal Dinas Pengganti
										</Label>
										<DatePicker
											value={dateState.tgl_ganti}
											onChange={(value) => {
												setDateState({ ...dateState, tgl_ganti: value });
												setFormData({
													...formData,
													tgl_ganti: value
														? moment(value).format("YYYY-MM-DD")
														: "",
												});
											}}
											placeholder="Pilih tanggal dinas pengganti"
											error={formErrors.tgl_ganti}
											minDate={moment().startOf("day").toDate()}
										/>
										<p className="text-xs text-gray-500 flex items-center gap-1">
											<span className="w-1 h-1 bg-gray-400 rounded-full"></span>
											Minimal mulai dari hari ini
										</p>
									</div>

									<div className="space-y-2">
										<Label
											htmlFor="shift2"
											className="text-sm font-medium text-gray-700"
										>
											Shift Pengganti
										</Label>
										<Select
											value={formData.shift2}
											onValueChange={(value) =>
												setFormData({ ...formData, shift2: value })
											}
										>
											<SelectTrigger className="w-full h-11">
												<SelectValue placeholder="Pilih shift pengganti" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="Pagi">Pagi</SelectItem>
												<SelectItem value="Siang">Siang</SelectItem>
												<SelectItem value="Malam">Malam</SelectItem>
												{/* {shiftData.map((shift, index) => (
													<SelectItem
														key={`shift2-${shift.shift || index}`}
														value={shift.shift}
													>
														{shift.shift}
													</SelectItem>
												))} */}
											</SelectContent>
										</Select>
									</div>
								</div>
							</div>
						</div>

						{/* Section 4: Alasan */}
						<div className="space-y-3 md:space-y-4">
							<div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
								<div className="w-7 h-7 md:w-8 md:h-8 bg-purple-100 rounded-lg flex items-center justify-center">
									<Edit className="w-3.5 h-3.5 md:w-4 md:h-4 text-purple-600" />
								</div>
								<h3 className="text-base md:text-lg font-semibold text-gray-900">
									Kepentingan & Alasan
								</h3>
							</div>

							<div className="bg-purple-50 rounded-xl p-4 md:p-6">
								<div className="space-y-2">
									<Label
										htmlFor="kepentingan"
										className="text-sm font-medium text-gray-700"
									>
										Jelaskan alasan tukar dinas
									</Label>
									<Textarea
									id="kepentingan"
									value={formData.kepentingan}
									onChange={(e) =>
										setFormData({ ...formData, kepentingan: e.target.value })
									}
									rows={4}
									className="resize-none min-h-[100px] focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
									error={formErrors.kepentingan}
									/>
								</div>
							</div>
						</div>
					</form>
				</div>

				<DialogFooter className="flex-shrink-0 pt-4 md:pt-6 border-t bg-gray-50 -mx-2 sm:-mx-6 -mb-6 px-4 sm:px-6 py-4">
					<div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto sm:ml-auto">
						<Button
							type="button"
							variant="outline"
							onClick={handleClose}
							className="w-full sm:w-auto h-10 md:h-11 font-medium"
							disabled={submitLoading || pegawaiLoading || userLoading}
						>
							Batal
						</Button>
						<Button
							onClick={handleSubmit}
							disabled={submitLoading || pegawaiLoading || userLoading}
							className="w-full sm:w-auto h-10 md:h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 font-medium shadow-lg"
						>
							{submitLoading ? (
								<>
									<Loader2 className="w-4 h-4 animate-spin mr-2" />
									Mengirim Pengajuan...
								</>
							) : (
								<>
									<Plus className="w-4 h-4 mr-2" />
									Submit Pengajuan
								</>
							)}
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default PengajuanFormModal;
