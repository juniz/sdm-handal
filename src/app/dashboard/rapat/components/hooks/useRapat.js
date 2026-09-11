"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import moment from "moment-timezone";

export const useRapat = () => {
	const [rapatList, setRapatList] = useState([]);
	const [loading, setLoading] = useState(true);
	const [filterDate, setFilterDate] = useState(moment().format("YYYY-MM-DD"));
	const [searchNamaRapat, setSearchNamaRapat] = useState("");
	const [searchNamaPeserta, setSearchNamaPeserta] = useState("");
	const [debouncedNamaRapat, setDebouncedNamaRapat] = useState("");
	const [debouncedNamaPeserta, setDebouncedNamaPeserta] = useState("");
	const [isToday, setIsToday] = useState(true);
	const [errors, setErrors] = useState({});

	// Debounce search inputs by 300ms for smooth typing
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedNamaRapat(searchNamaRapat);
		}, 300);
		return () => clearTimeout(timer);
	}, [searchNamaRapat]);

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedNamaPeserta(searchNamaPeserta);
		}, 300);
		return () => clearTimeout(timer);
	}, [searchNamaPeserta]);

	// Fetch data rapat from API
	const fetchRapat = useCallback(
		async (
			date = filterDate,
			namaRapat = debouncedNamaRapat,
			namaPeserta = debouncedNamaPeserta
		) => {
			setLoading(true);
			try {
				const params = new URLSearchParams({
					tanggal: date,
				});

				if (namaRapat.trim()) {
					params.append("nama_rapat", namaRapat.trim());
				}

				if (namaPeserta.trim()) {
					params.append("nama_peserta", namaPeserta.trim());
				}

				const response = await fetch(`/api/rapat?${params.toString()}`);
				const data = await response.json();

				if (data.status === "success") {
					setRapatList(data.data || []);
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
		[filterDate, debouncedNamaRapat, debouncedNamaPeserta]
	);

	// Group rapatList by rapat session title
	const groupedRapat = useMemo(() => {
		const map = new Map();

		rapatList.forEach((item) => {
			const key = item.rapat ? item.rapat.trim() : "Rapat Tanpa Judul";
			if (!map.has(key)) {
				map.set(key, {
					namaRapat: key,
					tanggal: item.tanggal,
					pesertaList: [],
				});
			}
			map.get(key).pesertaList.push(item);
		});

		return Array.from(map.values());
	}, [rapatList]);

	// Extract unique active meeting titles on the selected date for autocomplete suggestions
	const existingMeetingTitles = useMemo(() => {
		const titles = new Set();
		rapatList.forEach((r) => {
			if (r.rapat && r.rapat.trim()) {
				titles.add(r.rapat.trim());
			}
		});
		return Array.from(titles);
	}, [rapatList]);

	// Form validation
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

			let urutan = 0;
			if (modalMode === "add") {
				const currentDate = formData.tanggal;
				const rapatOnSameDate = rapatList.filter(
					(r) =>
						moment(r.tanggal, "DD MMMM YYYY").format("YYYY-MM-DD") ===
						currentDate
				);
				const maxUrutan =
					rapatOnSameDate.length > 0
						? Math.max(...rapatOnSameDate.map((r) => r.urutan || 0))
						: 0;
				urutan = maxUrutan + 1;
			} else {
				urutan = selectedRapat?.urutan || 0;
			}

			const body = {
				...formData,
				tanda_tangan,
				urutan,
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
				await fetchRapat(filterDate, debouncedNamaRapat, debouncedNamaPeserta);
				return {
					success: true,
					message:
						modalMode === "add"
							? "Data presensi berhasil ditambahkan"
							: "Data presensi berhasil diperbarui",
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
				await fetchRapat(filterDate, debouncedNamaRapat, debouncedNamaPeserta);
				return {
					success: true,
					message: "Data presensi berhasil dihapus",
				};
			} else {
				throw new Error(data.error || "Gagal menghapus data");
			}
		} catch (error) {
			console.error("Error deleting rapat:", error);
			throw error;
		}
	};

	// Reset search filters
	const resetSearch = () => {
		const today = moment().format("YYYY-MM-DD");
		setFilterDate(today);
		setSearchNamaRapat("");
		setSearchNamaPeserta("");
		setDebouncedNamaRapat("");
		setDebouncedNamaPeserta("");
	};

	// Update urutan rapat (for IT staff)
	const updateUrutan = async (updates) => {
		try {
			const response = await fetch("/api/rapat", {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ updates }),
			});

			const data = await response.json();

			if (data.status === "success") {
				await fetchRapat(filterDate, debouncedNamaRapat, debouncedNamaPeserta);
				return {
					success: true,
					message: "Urutan rapat berhasil diperbarui",
				};
			} else {
				throw new Error(data.error || "Gagal memperbarui urutan");
			}
		} catch (error) {
			console.error("Error updating urutan:", error);
			throw error;
		}
	};

	// Re-fetch when filter parameters change
	useEffect(() => {
		fetchRapat(filterDate, debouncedNamaRapat, debouncedNamaPeserta);
	}, [filterDate, debouncedNamaRapat, debouncedNamaPeserta, fetchRapat]);

	return {
		rapatList,
		groupedRapat,
		existingMeetingTitles,
		loading,
		filterDate,
		setFilterDate,
		searchNamaRapat,
		setSearchNamaRapat,
		searchNamaPeserta,
		setSearchNamaPeserta,
		isToday,
		errors,
		setErrors,
		fetchRapat,
		resetSearch,
		validateForm,
		submitRapat,
		deleteRapat,
		updateUrutan,
	};
};
