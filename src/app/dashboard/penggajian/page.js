"use client";

import { useState, useEffect } from "react";
import { useGaji } from "@/hooks/useGaji";
import GajiTable from "@/components/penggajian/GajiTable";
import GajiFilter from "@/components/penggajian/GajiFilter";
import UploadExcelModal from "@/components/penggajian/UploadExcelModal";

export default function PenggajianPage() {
	const {
		gajiList,
		loading,
		error,
		filters,
		uploadExcel,
		downloadSlipGaji,
		updateFilters,
	} = useGaji();

	const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
	const [isKEU, setIsKEU] = useState(false);
	const [checkingAccess, setCheckingAccess] = useState(true);

	// Check if user is KEU
	useEffect(() => {
		const checkAccess = async () => {
			try {
				const response = await fetch("/api/auth/user");
				if (response.ok) {
					const data = await response.json();
					const userDepartment = data.user?.departemen;
					const userDepartmentName = data.user?.departemen_name;

					const keuAccess =
						userDepartment === "KEU" ||
						userDepartmentName?.toLowerCase().includes("keu") ||
						userDepartmentName?.toLowerCase().includes("keuangan");

					setIsKEU(keuAccess);
				}
			} catch (error) {
				console.error("Error checking access:", error);
			} finally {
				setCheckingAccess(false);
			}
		};

		checkAccess();
	}, []);

	const handleUpload = async (file, periodeTahun, periodeBulan) => {
		const result = await uploadExcel(file, periodeTahun, periodeBulan);
		return result;
	};

	if (checkingAccess) {
		return (
			<div className="max-w-7xl mx-auto p-4">
				<div className="bg-white p-8 rounded-lg shadow-sm text-center">
					<div className="animate-pulse text-gray-500">
						Memeriksa akses...
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="max-w-7xl mx-auto p-4">
			{/* Header */}
			<div className="mb-6">
				<div className="flex justify-between items-center">
					<div>
						<h1 className="text-2xl font-bold text-gray-900">
							Modul Penggajian
						</h1>
						<p className="text-gray-600 mt-1">
							Kelola data gaji pegawai
						</p>
					</div>
					{isKEU && (
						<button
							onClick={() => setIsUploadModalOpen(true)}
							className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
						>
							Upload Excel
						</button>
					)}
				</div>
			</div>

			{/* Error Message */}
			{error && (
				<div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
					{error}
				</div>
			)}

			{/* Filter */}
			<GajiFilter filters={filters} onFilterChange={updateFilters} />

			{/* Table */}
			<GajiTable
				gajiList={gajiList}
				loading={loading}
				onDownloadSlip={downloadSlipGaji}
				isKEU={isKEU}
			/>

			{/* Upload Modal */}
			{isKEU && (
				<UploadExcelModal
					isOpen={isUploadModalOpen}
					onClose={() => setIsUploadModalOpen(false)}
					onUpload={handleUpload}
				/>
			)}
		</div>
	);
}

