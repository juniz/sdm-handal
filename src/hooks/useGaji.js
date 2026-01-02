import { useState, useEffect } from "react";

export function useGaji() {
	const [gajiList, setGajiList] = useState([]);
	const [validasiMap, setValidasiMap] = useState({});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [filters, setFilters] = useState({
		periode_tahun: new Date().getFullYear(),
		periode_bulan: new Date().getMonth() + 1,
		search: "",
	});

	// Fetch gaji data
	const fetchGaji = async (customFilters = null) => {
		setLoading(true);
		setError(null);

		try {
			const activeFilters = customFilters || filters;
			const params = new URLSearchParams();

			if (activeFilters.periode_tahun) {
				params.append("periode_tahun", activeFilters.periode_tahun);
			}
			if (activeFilters.periode_bulan) {
				params.append("periode_bulan", activeFilters.periode_bulan);
			}
			if (activeFilters.search) {
				params.append("search", activeFilters.search);
			}

			const response = await fetch(`/api/gaji?${params.toString()}`);
			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || "Gagal mengambil data gaji");
			}

			setGajiList(data.data || []);

			// Fetch validasi untuk setiap gaji
			await fetchValidasi(data.data || [], activeFilters);
		} catch (err) {
			setError(err.message);
			console.error("Error fetching gaji:", err);
		} finally {
			setLoading(false);
		}
	};

	// Fetch validasi gaji
	const fetchValidasi = async (gajiListData, customFilters = null) => {
		try {
			if (!gajiListData || gajiListData.length === 0) {
				setValidasiMap({});
				return;
			}

			const activeFilters = customFilters || filters;
			const params = new URLSearchParams();
			if (activeFilters.periode_tahun) {
				params.append("periode_tahun", activeFilters.periode_tahun);
			}
			if (activeFilters.periode_bulan) {
				params.append("periode_bulan", activeFilters.periode_bulan);
			}

			const response = await fetch(`/api/gaji/validasi?${params.toString()}`);
			const data = await response.json();

			if (response.ok && data.data) {
				// Buat map dari gaji_id ke validasi
				const map = {};
				data.data.forEach((validasi) => {
					map[validasi.gaji_id] = validasi;
				});
				setValidasiMap(map);
			} else {
				setValidasiMap({});
			}
		} catch (err) {
			console.error("Error fetching validasi:", err);
			setValidasiMap({});
		}
	};

	// Upload Excel
	const uploadExcel = async (file, periodeTahun, periodeBulan) => {
		setLoading(true);
		setError(null);

		try {
			const formData = new FormData();
			formData.append("file", file);
			formData.append("periode_tahun", periodeTahun);
			formData.append("periode_bulan", periodeBulan);

			const response = await fetch("/api/gaji/upload", {
				method: "POST",
				body: formData,
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || "Gagal upload file Excel");
			}

			// Refresh data setelah upload
			await fetchGaji();

			return {
				success_count: data.data?.success_count || 0,
				error_count: data.data?.error_count || 0,
				total_records: data.data?.total_records || 0,
				errors: data.data?.errors || [],
			};
		} catch (err) {
			setError(err.message);
			console.error("Error uploading Excel:", err);
			throw err;
		} finally {
			setLoading(false);
		}
	};

	// Buka halaman slip gaji HTML
	const downloadSlipGaji = async (gajiId) => {
		try {
			// Buka halaman slip gaji di tab baru
			const url = `/dashboard/penggajian/slip/${gajiId}`;
			window.open(url, "_blank");
		} catch (err) {
			setError(err.message || "Gagal membuka slip gaji");
			console.error("Error opening slip gaji:", err);
			throw err;
		}
	};

	// Tanda tangan validasi gaji
	const tandaTanganGaji = async (data) => {
		setLoading(true);
		setError(null);

		try {
			const response = await fetch("/api/gaji/validasi", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.message || "Gagal menyimpan tanda tangan");
			}

			// Refresh data setelah tanda tangan
			await fetchGaji();

			return result;
		} catch (err) {
			setError(err.message);
			console.error("Error signing gaji:", err);
			throw err;
		} finally {
			setLoading(false);
		}
	};

	// Update filters
	const updateFilters = (newFilters) => {
		setFilters((prev) => ({ ...prev, ...newFilters }));
	};

	// Reset filters
	const resetFilters = () => {
		setFilters({
			periode_tahun: new Date().getFullYear(),
			periode_bulan: new Date().getMonth() + 1,
			search: "",
		});
	};

	// Fetch on mount and when filters change
	useEffect(() => {
		fetchGaji();
	}, [filters.periode_tahun, filters.periode_bulan, filters.search]);

	return {
		gajiList,
		validasiMap,
		loading,
		error,
		filters,
		fetchGaji,
		uploadExcel,
		downloadSlipGaji,
		tandaTanganGaji,
		updateFilters,
		resetFilters,
	};
}

