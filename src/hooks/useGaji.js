import { useState, useEffect } from "react";

export function useGaji() {
	const [gajiList, setGajiList] = useState([]);
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
		} catch (err) {
			setError(err.message);
			console.error("Error fetching gaji:", err);
		} finally {
			setLoading(false);
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

	// Download slip gaji
	const downloadSlipGaji = async (gajiId) => {
		try {
			const response = await fetch(`/api/gaji/slip/${gajiId}`);
			if (!response.ok) {
				throw new Error("Gagal generate slip gaji");
			}

			// Buka di window baru untuk print
			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const printWindow = window.open(url, "_blank");

			if (printWindow) {
				printWindow.onload = () => {
					setTimeout(() => {
						printWindow.print();
					}, 500);
				};
			}
		} catch (err) {
			setError(err.message);
			console.error("Error downloading slip gaji:", err);
			throw err;
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
		loading,
		error,
		filters,
		fetchGaji,
		uploadExcel,
		downloadSlipGaji,
		updateFilters,
		resetFilters,
	};
}

