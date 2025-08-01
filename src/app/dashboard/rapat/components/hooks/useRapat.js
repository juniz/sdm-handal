"use client";

import { useState, useEffect, useCallback } from "react";
import moment from "moment-timezone";

export const useRapat = () => {
	const [rapatList, setRapatList] = useState([]);
	const [loading, setLoading] = useState(true);
	const [filterDate, setFilterDate] = useState(moment().format("YYYY-MM-DD"));
	const [filterNamaRapat, setFilterNamaRapat] = useState("");
	const [debouncedNamaRapat, setDebouncedNamaRapat] = useState("");
	const [isToday, setIsToday] = useState(true);
	const [errors, setErrors] = useState({});

	// Fetch data rapat
	const fetchRapat = useCallback(
		async (date = filterDate, namaRapat = debouncedNamaRapat) => {
			setLoading(true);
			try {
				const params = new URLSearchParams({
					tanggal: date,
				});

				if (namaRapat.trim()) {
					params.append("nama_rapat", namaRapat.trim());
				}

				const response = await fetch(`/api/rapat?${params.toString()}`);
				const data = await response.json();

				if (data.status === "success") {
					setRapatList(data.data);
					setIsToday(data.metadata?.filter?.isToday ?? false);
				} else {
					throw new Error(data.error || "Gagal mengambil data rapat");
				}
			} catch (error) {
				console.error("Error fetching rapat:", error);
				throw error;
			} finally {
				setLoading(false);
			}
		},
		[filterDate, debouncedNamaRapat]
	);

	// Validasi form
	const validateForm = (formData, signPadRef) => {
		const newErrors = {};

		if (!formData.tanggal) {
			newErrors.tanggal = "Tanggal harus diisi";
		}

		if (!formData.rapat || formData.rapat.trim().length < 3) {
			newErrors.rapat = "Nama rapat minimal 3 karakter";
		}

		if (!formData.nama || formData.nama.trim().length < 3) {
			newErrors.nama = "Nama peserta minimal 3 karakter";
		}

		if (!formData.instansi || formData.instansi.trim().length < 2) {
			newErrors.instansi = "Nama instansi minimal 2 karakter";
		}

		if (!signPadRef?.current || signPadRef.current.isEmpty()) {
			newErrors.tanda_tangan = "Tanda tangan harus diisi";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	// Submit rapat (add/edit)
	const submitRapat = async (
		formData,
		tanda_tangan,
		modalMode,
		selectedRapat
	) => {
		try {
			const method = modalMode === "add" ? "POST" : "PUT";
			const url = "/api/rapat";
			const body = {
				...formData,
				tanda_tangan,
			};

			if (modalMode === "edit") {
				body.id = selectedRapat.id;
			}

			const response = await fetch(url, {
				method,
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(body),
			});

			const data = await response.json();

			if (data.status === "success") {
				await fetchRapat();
				return {
					success: true,
					message:
						modalMode === "add"
							? "Data rapat berhasil ditambahkan"
							: "Data rapat berhasil diperbarui",
				};
			} else {
				throw new Error(data.error || "Gagal menyimpan data");
			}
		} catch (error) {
			console.error("Error submitting rapat:", error);
			throw error;
		}
	};

	// Delete rapat
	const deleteRapat = async (id) => {
		try {
			const response = await fetch("/api/rapat", {
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ id }),
			});

			const data = await response.json();

			if (data.status === "success") {
				await fetchRapat();
				return {
					success: true,
					message: "Data rapat berhasil dihapus",
				};
			} else {
				throw new Error(data.error || "Gagal menghapus data");
			}
		} catch (error) {
			console.error("Error deleting rapat:", error);
			throw error;
		}
	};

	// Effect untuk fetch data awal
	useEffect(() => {
		fetchRapat();
	}, []);

	// Debounce effect untuk nama rapat
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedNamaRapat(filterNamaRapat);
		}, 500); // 500ms delay

		return () => clearTimeout(timer);
	}, [filterNamaRapat]);

	// Effect untuk fetch data saat filter berubah
	useEffect(() => {
		fetchRapat(filterDate, debouncedNamaRapat);
	}, [filterDate, debouncedNamaRapat, fetchRapat]);

	return {
		rapatList,
		loading,
		filterDate,
		setFilterDate,
		filterNamaRapat,
		setFilterNamaRapat,
		isToday,
		errors,
		setErrors,
		fetchRapat,
		validateForm,
		submitRapat,
		deleteRapat,
	};
};
