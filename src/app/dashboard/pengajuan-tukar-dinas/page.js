"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, RefreshCcw } from "lucide-react";
import moment from "moment-timezone";
import "moment/locale/id";

// Import komponen yang sudah dipecah
import PengajuanFormModal from "@/components/PengajuanFormModal";
import PengajuanTable from "@/components/PengajuanTable";
import PengajuanPagination from "@/components/PengajuanPagination";
import PengajuanDialogs from "@/components/PengajuanDialogs";
import usePengajuanTukarDinas from "@/hooks/usePengajuanTukarDinas";

// Set locale ke Indonesia
moment.locale("id");
moment.tz.setDefault("Asia/Jakarta");

export default function PengajuanTukarDinasPage() {
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

		// Functions
		handleSubmit,
		handleUpdateStatus,
		handleDeleteConfirm,
		handleView,
		handleEdit,
		handleDelete,
	} = usePengajuanTukarDinas();

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<Loader2 className="w-8 h-8 animate-spin" />
			</div>
		);
	}

	return (
		<div className="container mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
			{/* Header */}
			<div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center md:space-y-0">
				<div className="flex-1">
					<h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
						<RefreshCcw className="w-6 h-6 md:w-8 md:h-8 text-blue-600 flex-shrink-0" />
						<span className="leading-tight">Pengajuan Tukar Dinas</span>
					</h1>
					<p className="text-sm md:text-base text-gray-600 mt-1 md:mt-2 leading-relaxed">
						Kelola pengajuan tukar dinas/shift pegawai. Pengajuan dengan status
						proses dapat dihapus.
					</p>
				</div>

				{(userDepartment === "USER" || userDepartment === "IT_HRD") && (
					<div className="flex-shrink-0">
						<Button
							onClick={() => setShowFormDialog(true)}
							className="w-full md:w-auto flex items-center justify-center gap-2 h-10 md:h-9 text-sm font-medium"
						>
							<Plus className="w-4 h-4 flex-shrink-0" />
							<span className="whitespace-nowrap">Ajukan Tukar Dinas</span>
						</Button>
					</div>
				)}
			</div>

			{/* Form Pengajuan Modal */}
			<PengajuanFormModal
				open={showFormDialog}
				onOpenChange={setShowFormDialog}
				onSubmit={handleSubmit}
				shiftData={shiftData}
				submitLoading={submitLoading}
				pegawaiLoading={pegawaiLoading}
				userLoading={userLoading}
			/>

			{/* Tabel Data */}
			<Card>
				<CardHeader>
					<CardTitle>Data Pengajuan Tukar Dinas</CardTitle>
				</CardHeader>
				<CardContent>
					<PengajuanTable
						data={currentData}
						currentPage={currentPage}
						itemsPerPage={itemsPerPage}
						userDepartment={userDepartment}
						onView={handleView}
						onEdit={handleEdit}
						onDelete={handleDelete}
					/>
				</CardContent>
			</Card>

			{/* Pagination */}
			<PengajuanPagination
				currentPage={currentPage}
				totalItems={pengajuanData.length}
				itemsPerPage={itemsPerPage}
				onPageChange={handlePageChange}
			/>

			{/* All Dialogs */}
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
				// Delete Dialog
				showDeleteDialog={showDeleteDialog}
				setShowDeleteDialog={setShowDeleteDialog}
				pengajuanToDelete={pengajuanToDelete}
				setPengajuanToDelete={setPengajuanToDelete}
				onDeleteConfirm={handleDeleteConfirm}
			/>
		</div>
	);
}
