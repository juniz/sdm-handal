"use client";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, RefreshCcw, Clock } from "lucide-react";
import moment from "moment-timezone";
import "moment/locale/id";

// Import komponen yang sudah dipecah
import PengajuanFormModal from "@/components/PengajuanFormModal";
import PengajuanTable from "@/components/PengajuanTable";
import PengajuanPagination from "@/components/PengajuanPagination";
import PengajuanDialogs from "@/components/PengajuanDialogs";
import PengajuanFilters from "@/components/PengajuanFilters";
import usePengajuanTukarDinas from "@/hooks/usePengajuanTukarDinas";
import ErrorBoundary from "@/components/ErrorBoundary";

// Set locale ke Indonesia
moment.locale("id");
moment.tz.setDefault("Asia/Jakarta");

export default function PengajuanTukarDinasPage() {
	const [isMounted, setIsMounted] = useState(false);

	const {
		// Data
		pengajuanData,
		currentData,
		shiftData,

		// Loading states
		loading,
		submitLoading,
		pegawaiLoading,
		userLoading,

		// User states
		userDepartment,
		currentUserNik,

		// Dialog states
		selectedPengajuan,
		showFormDialog,
		setShowFormDialog,
		showUpdateDialog,
		setShowUpdateDialog,
		showDetailDialog,
		setShowDetailDialog,
		showDeleteDialog,
		setShowDeleteDialog,
		pengajuanToDelete,
		setPengajuanToDelete,

		// Pagination
		currentPage,
		itemsPerPage,
		handlePageChange,

		// Update data
		updateData,
		setUpdateData,

		// Filter states
		searchTerm,
		setSearchTerm,
		statusFilter,
		setStatusFilter,
		filteredData,

		// Functions
		handleSubmit,
		handleUpdateStatus,
		handleDeleteConfirm,
		handleView,
		handleEdit,
		handleDelete,
	} = usePengajuanTukarDinas();

	// Track mounted state untuk mencegah DOM manipulation errors pada mobile
	useEffect(() => {
		setIsMounted(true);
		return () => {
			setIsMounted(false);
		};
	}, []);

	// Safe dialog handler untuk mencegah removeChild error
	const handleFormDialogChange = useCallback(
		(open) => {
			if (!isMounted) return;

			// Gunakan requestAnimationFrame untuk menunda state update
			// Ini membantu mencegah race condition saat closing dialog
			if (!open) {
				requestAnimationFrame(() => {
					if (isMounted) {
						setShowFormDialog(open);
					}
				});
			} else {
				setShowFormDialog(open);
			}
		},
		[isMounted, setShowFormDialog]
	);

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<Loader2 className="w-8 h-8 animate-spin" />
			</div>
		);
	}

	return (
		<ErrorBoundary
			componentName="PengajuanTukarDinasPage"
			actionAttempted="Rendering pengajuan tukar dinas page"
			showDetails={process.env.NODE_ENV === "development"}
		>
			<div className="container mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
				{/* Header */}
				<div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center md:space-y-0">
					<div className="flex-1">
						<h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-2.5">
							<div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100 flex-shrink-0">
								<RefreshCcw className="w-5 h-5 md:w-6 md:h-6" />
							</div>
							<span className="leading-tight">Pengajuan Tukar Dinas</span>
						</h1>
						<p className="text-xs md:text-sm text-slate-500 mt-1 md:mt-1.5 leading-relaxed">
							Kelola pengajuan tukar dinas dan shift kerja pegawai. Menampilkan pengajuan
							dimana Anda terdaftar sebagai pemohon atau penanggung jawab.
						</p>
					</div>

					{(userDepartment === "USER" || userDepartment === "IT_HRD") && (
						<div className="flex-shrink-0">
							<Button
								onClick={() => setShowFormDialog(true)}
								className="w-full md:w-auto flex items-center justify-center gap-2 h-10 md:h-9 text-xs sm:text-sm font-medium bg-sky-600 hover:bg-sky-700 text-white shadow-sm"
							>
								<Plus className="w-4 h-4 flex-shrink-0" />
								<span className="whitespace-nowrap">Ajukan Tukar Dinas</span>
							</Button>
						</div>
					)}
				</div>

				{/* Form Pengajuan Modal - Selalu render, kontrol via open prop
				    Ini mencegah error removeChild karena tidak ada unmounting */}
				<ErrorBoundary
					componentName="PengajuanFormModal"
					actionAttempted="Rendering form modal"
				>
					<PengajuanFormModal
						open={showFormDialog}
						onOpenChange={handleFormDialogChange}
						onSubmit={handleSubmit}
						shiftData={shiftData}
						submitLoading={submitLoading}
						pegawaiLoading={pegawaiLoading}
						userLoading={userLoading}
						currentUserNik={currentUserNik}
					/>
				</ErrorBoundary>

				{/* Filter Component */}
				<ErrorBoundary
					componentName="PengajuanFilters"
					actionAttempted="Rendering filters"
				>
					<PengajuanFilters
						searchTerm={searchTerm}
						setSearchTerm={setSearchTerm}
						statusFilter={statusFilter}
						setStatusFilter={setStatusFilter}
						onClearFilters={() => {
							setSearchTerm("");
							setStatusFilter("all");
						}}
					/>
				</ErrorBoundary>

				{/* Tabel Data */}
				<ErrorBoundary
					componentName="PengajuanTable"
					actionAttempted="Rendering data table"
				>
					<Card className="border-slate-200 shadow-sm bg-white">
						<CardHeader className="border-b border-slate-100 pb-4">
							<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
								<CardTitle className="text-base sm:text-lg font-bold text-slate-900">
									Data Pengajuan Tukar Dinas
								</CardTitle>
								<div className="text-xs text-slate-500">
									Menampilkan {currentData.length} dari {filteredData.length}{" "}
									pengajuan
									{filteredData.length !== pengajuanData.length && (
										<span className="text-sky-600 ml-1 font-medium">
											(difilter dari {pengajuanData.length} total)
										</span>
									)}
								</div>
							</div>
						</CardHeader>
						<CardContent className="p-0 sm:p-6">
							{filteredData.length === 0 ? (
								<div className="text-center py-12">
									<Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
									<p className="text-slate-500 text-sm font-medium mb-1">
										{searchTerm || statusFilter !== "all"
											? "Tidak ada pengajuan yang sesuai dengan kriteria filter"
											: "Belum ada data pengajuan tukar dinas"}
									</p>
									{(searchTerm || statusFilter !== "all") && (
										<Button
											variant="outline"
											size="sm"
											onClick={() => {
												setSearchTerm("");
												setStatusFilter("all");
											}}
											className="mt-2 h-8 text-xs border-slate-200 text-slate-700"
										>
											Hapus Filter
										</Button>
									)}
								</div>
							) : (
								<PengajuanTable
									data={currentData}
									currentPage={currentPage}
									itemsPerPage={itemsPerPage}
									userDepartment={userDepartment}
									currentUserNik={currentUserNik}
									onView={handleView}
									onEdit={handleEdit}
									onDelete={handleDelete}
								/>
							)}
						</CardContent>
					</Card>
				</ErrorBoundary>

				{/* Pagination */}
				<ErrorBoundary
					componentName="PengajuanPagination"
					actionAttempted="Rendering pagination"
				>
					<PengajuanPagination
						currentPage={currentPage}
						totalItems={filteredData.length}
						itemsPerPage={itemsPerPage}
						onPageChange={handlePageChange}
					/>
				</ErrorBoundary>

				{/* All Dialogs */}
				<ErrorBoundary
					componentName="PengajuanDialogs"
					actionAttempted="Rendering dialogs"
				>
					<PengajuanDialogs
						// Update Status Dialog
						showUpdateDialog={showUpdateDialog}
						setShowUpdateDialog={setShowUpdateDialog}
						selectedPengajuan={selectedPengajuan}
						updateData={updateData}
						setUpdateData={setUpdateData}
						onUpdateStatus={handleUpdateStatus}
						// Detail Dialog
						showDetailDialog={showDetailDialog}
						setShowDetailDialog={setShowDetailDialog}
						userDepartment={userDepartment}
						currentUserNik={currentUserNik}
						// Delete Dialog
						showDeleteDialog={showDeleteDialog}
						setShowDeleteDialog={setShowDeleteDialog}
						pengajuanToDelete={pengajuanToDelete}
						setPengajuanToDelete={setPengajuanToDelete}
						onDeleteConfirm={handleDeleteConfirm}
					/>
				</ErrorBoundary>
			</div>
		</ErrorBoundary>
	);
}
