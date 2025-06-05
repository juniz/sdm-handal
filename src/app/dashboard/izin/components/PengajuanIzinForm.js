"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/DatePicker";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PegawaiCombobox } from "@/components/PegawaiCombobox";
import { Send } from "lucide-react";
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

export default function PengajuanIzinForm() {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [form, setForm] = useState({
		tanggal_awal: "",
		tanggal_akhir: "",
		nik_pj: "",
		urgensi: "Perjalanan Dinas",
		kepentingan: "",
		status: "Proses Pengajuan",
	});

	const [date, setDate] = useState({
		tanggal_awal: undefined,
		tanggal_akhir: undefined,
	});

	const [errors, setErrors] = useState({});

	const validateDates = () => {
		const newErrors = {};
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		if (!date.tanggal_awal) {
			toast.error("Tanggal awal wajib diisi");
			newErrors.tanggal_awal = "Tanggal awal wajib diisi";
		} else if (date.tanggal_awal < today) {
			toast.error("Tanggal awal tidak boleh kurang dari hari ini");
			newErrors.tanggal_awal = "Tanggal awal tidak boleh kurang dari hari ini";
		}

		if (!date.tanggal_akhir) {
			toast.error("Tanggal akhir wajib diisi");
			newErrors.tanggal_akhir = "Tanggal akhir wajib diisi";
		} else if (date.tanggal_akhir < date.tanggal_awal) {
			toast.error("Tanggal akhir tidak boleh kurang dari tanggal awal");
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
	};

	const handlePegawaiChange = (value) => {
		setForm((prev) => ({ ...prev, nik_pj: value }));
		setErrors((prev) => ({ ...prev, nik_pj: "" }));
	};

	const validateForm = () => {
		const newErrors = { ...errors };

		if (!form.nik_pj) {
			newErrors.nik_pj = "Penanggung jawab wajib dipilih";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		// if (validateDates() && validateForm()) {
		try {
			setIsSubmitting(true);

			const response = await fetch("/api/izin", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					tanggal_awal: form.tanggal_awal,
					tanggal_akhir: form.tanggal_akhir,
					urgensi: form.urgensi,
					kepentingan: form.kepentingan,
					nik_pj: form.nik_pj,
				}),
			});

			const data = await response.json();

			if (data.status === "success") {
				toast.success("Pengajuan izin berhasil disimpan");
				// Reset form
				setForm({
					tanggal_awal: "",
					tanggal_akhir: "",
					nik_pj: "",
					urgensi: "Perjalanan Dinas",
					kepentingan: "",
					status: "Proses Pengajuan",
				});
				setDate({
					tanggal_awal: undefined,
					tanggal_akhir: undefined,
				});
			} else {
				throw new Error(data.message || "Terjadi kesalahan");
			}
		} catch (error) {
			console.error("Error submitting form:", error);
			toast.error(error.message || "Gagal menyimpan pengajuan izin");
		} finally {
			setIsSubmitting(false);
		}
		// } else {
		// 	toast.error(
		// 		"Form tidak boleh kosong " +
		// 			Object.keys(errors).map(
		// 				(key, index) =>
		// 					errors[key] + (index < Object.keys(errors).length - 1 ? ", " : "")
		// 			)
		// 	);
		// }
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
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
						onChange={(value) => handleDateChange(value, "tanggal_awal")}
						placeholder="Pilih tanggal awal"
						error={errors.tanggal_awal}
						// minDate={new Date()}
					/>
				</motion.div>

				<motion.div variants={fadeIn} className="space-y-2">
					<label className="text-sm font-medium text-gray-700 flex items-center gap-1">
						<span className="text-red-500">*</span>
						Tanggal Akhir
					</label>
					<DatePicker
						value={date.tanggal_akhir}
						onChange={(value) => handleDateChange(value, "tanggal_akhir")}
						placeholder="Pilih tanggal akhir"
						error={errors.tanggal_akhir}
						// minDate={
						// 	date.tanggal_awal ? new Date(date.tanggal_awal) : new Date()
						// }
					/>
				</motion.div>

				<motion.div variants={fadeIn} className="space-y-2">
					<label className="text-sm font-medium text-gray-700 flex items-center gap-1">
						<span className="text-red-500">*</span>
						Urgensi
					</label>
					<Select
						className="w-full"
						name="urgensi"
						value={form.urgensi}
						onValueChange={(e) => setForm({ ...form, urgensi: e })}
						required
					>
						<SelectTrigger name="urgensi" className="w-full">
							<SelectValue placeholder="Perjalanan Dinas" />
						</SelectTrigger>
						<SelectContent>
							<SelectGroup>
								<SelectItem value="Perjalanan Dinas">
									Perjalanan Dinas
								</SelectItem>
								<SelectItem value="Lain-lain">Lain-lain</SelectItem>
							</SelectGroup>
						</SelectContent>
					</Select>
				</motion.div>

				<motion.div variants={fadeIn} className="space-y-2 md:col-span-2">
					<label className="text-sm font-medium text-gray-700 flex items-center gap-1">
						<span className="text-red-500">*</span>
						Kepentingan
					</label>
					<Textarea
						name="kepentingan"
						value={form.kepentingan}
						onChange={handleChange}
						required
						placeholder="Jelaskan kepentingan izin..."
					/>
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
							<span>Ajukan Izin</span>
						</>
					)}
				</Button>
			</motion.div>
		</form>
	);
}
