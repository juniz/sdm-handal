"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useGaji } from "@/hooks/useGaji";
import GajiTable from "@/components/penggajian/GajiTable";
import GajiFilter from "@/components/penggajian/GajiFilter";
import UploadExcelModal from "@/components/penggajian/UploadExcelModal";
import PenggajianSettingsModal from "@/components/penggajian/PenggajianSettingsModal";
import { Button } from "@/components/ui/button";

export default function PenggajianPage() {
	const {
		gajiList,
		validasiMap,
		loading,
		error,
		filters,
		uploadExcel,
		downloadSlipGaji,
		tandaTanganGaji,
		updateFilters,
	} = useGaji();

	const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
	const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
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

	const handleDownloadTemplate = async () => {
		try {
			const response = await fetch("/api/gaji/template");
			if (!response.ok) {
				throw new Error("Gagal download template");
			}

			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = "Template_Gaji_Pegawai.xlsx";
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);
		} catch (error) {
			console.error("Error downloading template:", error);
			alert("Gagal download template Excel. Silakan coba lagi.");
		}
	};

	if (checkingAccess) {
		return (
			<div className="max-w-7xl mx-auto p-4">
				<div className="bg-white p-8 rounded-lg shadow-sm text-center">
					<div className="animate-pulse text-gray-500">Memeriksa akses...</div>
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
							Riwayat Gaji
						</h1>
						<p className="text-gray-600 mt-1">History penerimaan gaji pegawai</p>
					</div>
					<div className="flex gap-2">
						{isKEU && (
							<>
								<Button variant="outline" onClick={() => setIsSettingsModalOpen(true)}>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										className="h-4 w-4 mr-2"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
										/>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
										/>
									</svg>
									Pengaturan
								</Button>
								<Button variant="outline" onClick={handleDownloadTemplate}>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										className="h-4 w-4 mr-2"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
										/>
									</svg>
									Download Template
								</Button>
								<Button onClick={() => setIsUploadModalOpen(true)}>
									Upload Excel
								</Button>
							</>
						)}
					</div>
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
				onTandaTangan={tandaTanganGaji}
				isKEU={isKEU}
				validasiMap={validasiMap}
			/>

			{/* Modals */}
			{isKEU && (
				<>
					<UploadExcelModal
						isOpen={isUploadModalOpen}
						onClose={() => setIsUploadModalOpen(false)}
						onUpload={handleUpload}
					/>
					<PenggajianSettingsModal
						isOpen={isSettingsModalOpen}
						onClose={() => setIsSettingsModalOpen(false)}
					/>
				</>
			)}
		</div>
	);
}
