"use client";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Calendar, Send } from "lucide-react";
import { DatePicker } from "@/components/DatePicker";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PegawaiCombobox } from "@/components/PegawaiCombobox";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import moment from "moment";

const fadeIn = {
	initial: { opacity: 0, y: 20 },
	animate: { opacity: 1, y: 0 },
	transition: { duration: 0.5 },
};

const staggerContainer = {
	animate: {
		transition: {
			staggerChildren: 0.1,
		},
	},
};

export default function PengajuanCutiForm() {
	const router = useRouter();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [form, setForm] = useState({
		tanggal_awal: "",
		tanggal_akhir: "",
		nik_pj: "",
		urgensi: "Tahunan",
		kepentingan: "",
		alamat: "",
		status: "Proses Pengajuan",
	});

	const [date, setDate] = useState({
		tanggal_awal: undefined,
		tanggal_akhir: undefined,
	});

	const [errors, setErrors] = useState({
		tanggal_awal: "",
		tanggal_akhir: "",
		nik_pj: "",
		kepentingan: "",
		urgensi: "",
		alamat: "",
	});

	const validateDates = () => {
		const newErrors = {};
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		if (!date.tanggal_awal) {
			newErrors.tanggal_awal = "Tanggal awal wajib diisi";
		} else if (date.tanggal_awal < today) {
			newErrors.tanggal_awal = "Tanggal awal tidak boleh kurang dari hari ini";
		}

		if (!date.tanggal_akhir) {
			newErrors.tanggal_akhir = "Tanggal akhir wajib diisi";
		} else if (date.tanggal_akhir < date.tanggal_awal) {
			newErrors.tanggal_akhir =
				"Tanggal akhir tidak boleh kurang dari tanggal awal";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleDateChange = (value, field) => {
		setDate((prev) => ({ ...prev, [field]: value }));
		setForm((prev) => ({
			...prev,
			[field]: value ? moment(value).format("YYYY-MM-DD") : "",
		}));
		setErrors((prev) => ({ ...prev, [field]: "" }));
	};

	const handleChange = (e) => {
		const { name, value } = e.target;
		setForm({ ...form, [name]: value });
		setErrors((prev) => ({ ...prev, [name]: "" }));
	};

	const handlePegawaiChange = (value) => {
		setForm((prev) => ({ ...prev, nik_pj: value }));
		setErrors((prev) => ({ ...prev, nik_pj: "" }));
	};

	const validateForm = () => {
		const newErrors = {};

		if (!form.nik_pj) {
			newErrors.nik_pj = "Penanggung jawab wajib dipilih";
		}
		if (!form.kepentingan) {
			newErrors.kepentingan = "Kepentingan wajib diisi";
		}
		if (!form.alamat) {
			newErrors.alamat = "Alamat selama cuti wajib diisi";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!validateDates() || !validateForm()) {
			toast.error("Mohon lengkapi semua field yang wajib diisi");
			return;
		}

		try {
			setIsSubmitting(true);

			const response = await fetch("/api/cuti", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					tanggal_awal: form.tanggal_awal,
					tanggal_akhir: form.tanggal_akhir,
					urgensi: form.urgensi,
					kepentingan: form.kepentingan,
					alamat: form.alamat,
					nik_pj: form.nik_pj,
				}),
			});

			const data = await response.json();

			if (data.status === "success") {
				toast.success("Pengajuan cuti berhasil disimpan");
				router.push("/dashboard/cuti/list");
			} else {
				throw new Error(data.message || "Terjadi kesalahan");
			}
		} catch (error) {
			console.error("Error submitting form:", error);
			toast.error(error.message || "Gagal menyimpan pengajuan cuti");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="min-h-[80vh] bg-gradient-to-br from-blue-50 to-indigo-50">
			<motion.div
				initial="initial"
				animate="animate"
				variants={staggerContainer}
				className="max-w-2xl mx-auto"
			>
				<motion.div variants={fadeIn}>
					<Card className="backdrop-blur-sm bg-white/90 shadow-xl border-0 overflow-hidden">
						<CardHeader className="space-y-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
							<motion.div
								initial={{ scale: 0.95 }}
								animate={{ scale: 1 }}
								transition={{ duration: 0.3 }}
							>
								<CardTitle className="text-2xl font-bold text-center">
									Form Pengajuan Cuti
								</CardTitle>
							</motion.div>
						</CardHeader>
						<CardContent>
							<form onSubmit={handleSubmit} className="space-y-6 py-4">
								<motion.div
									variants={staggerContainer}
									className="grid grid-cols-1 md:grid-cols-2 gap-6"
								>
									<motion.div variants={fadeIn} className="space-y-2">
										<label className="text-sm font-medium text-gray-700 flex items-center gap-1">
											<span className="text-red-500">*</span>
											Tanggal Awal
										</label>
										<DatePicker
											value={date.tanggal_awal}
											onChange={(value) =>
												handleDateChange(value, "tanggal_awal")
											}
											placeholder="Pilih tanggal awal"
											error={errors.tanggal_awal}
											minDate={new Date()}
										/>
									</motion.div>

									<motion.div variants={fadeIn} className="space-y-2">
										<label className="text-sm font-medium text-gray-700 flex items-center gap-1">
											<span className="text-red-500">*</span>
											Tanggal Akhir
										</label>
										<DatePicker
											value={date.tanggal_akhir}
											onChange={(value) =>
												handleDateChange(value, "tanggal_akhir")
											}
											placeholder="Pilih tanggal akhir"
											error={errors.tanggal_akhir}
											minDate={date.tanggal_awal}
										/>
									</motion.div>

									<motion.div variants={fadeIn} className="space-y-2">
										<label className="text-sm font-medium text-gray-700 flex items-center gap-1">
											<span className="text-red-500">*</span>
											Jenis Cuti
										</label>
										<Select
											name="urgensi"
											value={form.urgensi}
											onValueChange={(value) =>
												setForm({ ...form, urgensi: value })
											}
											required
										>
											<SelectTrigger className="w-full">
												<SelectValue placeholder="Pilih jenis cuti" />
											</SelectTrigger>
											<SelectContent>
												<SelectGroup>
													<SelectItem value="Tahunan">Cuti Tahunan</SelectItem>
													<SelectItem value="Sakit">Cuti Sakit</SelectItem>
													<SelectItem value="Istimewa">
														Cuti Istimewa
													</SelectItem>
													<SelectItem value="Ibadah Keagamaan">
														Cuti Ibadah Keagamaan
													</SelectItem>
													<SelectItem value="Melahirkan">
														Cuti Melahirkan
													</SelectItem>
													<SelectItem value="Di Luar Tanggungan">
														Cuti Di Luar Tanggungan
													</SelectItem>
												</SelectGroup>
											</SelectContent>
										</Select>
									</motion.div>

									<motion.div variants={fadeIn} className="space-y-2">
										<label className="text-sm font-medium text-gray-700 flex items-center gap-1">
											<span className="text-red-500">*</span>
											Penanggung Jawab
										</label>
										<PegawaiCombobox
											value={form.nik_pj}
											onValueChange={handlePegawaiChange}
											error={errors.nik_pj}
										/>
									</motion.div>

									<motion.div
										variants={fadeIn}
										className="space-y-2 md:col-span-2"
									>
										<label className="text-sm font-medium text-gray-700 flex items-center gap-1">
											<span className="text-red-500">*</span>
											Kepentingan
										</label>
										<Textarea
											name="kepentingan"
											value={form.kepentingan}
											onChange={handleChange}
											required
											placeholder="Jelaskan kepentingan cuti..."
											error={errors.kepentingan}
										/>
									</motion.div>

									<motion.div
										variants={fadeIn}
										className="space-y-2 md:col-span-2"
									>
										<label className="text-sm font-medium text-gray-700 flex items-center gap-1">
											<span className="text-red-500">*</span>
											Alamat Selama Cuti
										</label>
										<Textarea
											name="alamat"
											value={form.alamat}
											onChange={handleChange}
											required
											placeholder="Masukkan alamat lengkap selama cuti..."
											error={errors.alamat}
										/>
									</motion.div>
								</motion.div>

								<motion.div variants={fadeIn} className="pt-6 flex justify-end">
									<Button
										type="submit"
										className="w-full md:w-auto px-8 py-2 text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
										disabled={isSubmitting}
									>
										{isSubmitting ? (
											<>
												<div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
												<span>Menyimpan...</span>
											</>
										) : (
											<>
												<Send className="w-5 h-5" />
												<span>Ajukan Cuti</span>
											</>
										)}
									</Button>
								</motion.div>
							</form>
						</CardContent>
					</Card>
				</motion.div>
			</motion.div>
		</div>
	);
}
