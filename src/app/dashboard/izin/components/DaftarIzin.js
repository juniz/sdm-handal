"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
	FileText,
	Clock,
	Search,
	X,
	ChevronLeft,
	ChevronRight,
	Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { DatePicker } from "@/components/DatePicker";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "sonner";

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

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
	const pages = [];
	let startPage = Math.max(1, currentPage - 2);
	let endPage = Math.min(totalPages, currentPage + 2);

	// Selalu tampilkan 5 halaman jika tersedia
	if (endPage - startPage < 4) {
		if (startPage === 1) {
			endPage = Math.min(5, totalPages);
		} else {
			startPage = Math.max(1, endPage - 4);
		}
	}

	for (let i = startPage; i <= endPage; i++) {
		pages.push(i);
	}

	return (
		<div className="flex items-center justify-between px-2 py-4">
			<div className="flex items-center gap-2">
				<Button
					variant="outline"
					size="icon"
					onClick={() => onPageChange(currentPage - 1)}
					disabled={currentPage === 1}
				>
					<ChevronLeft className="h-4 w-4" />
				</Button>

				{startPage > 1 && (
					<>
						<Button
							variant={currentPage === 1 ? "default" : "outline"}
							size="icon"
							onClick={() => onPageChange(1)}
						>
							1
						</Button>
						{startPage > 2 && <span className="px-2">...</span>}
					</>
				)}

				{pages.map((page) => (
					<Button
						key={page}
						variant={currentPage === page ? "default" : "outline"}
						size="icon"
						onClick={() => onPageChange(page)}
					>
						{page}
					</Button>
				))}

				{endPage < totalPages && (
					<>
						{endPage < totalPages - 1 && <span className="px-2">...</span>}
						<Button
							variant={currentPage === totalPages ? "default" : "outline"}
							size="icon"
							onClick={() => onPageChange(totalPages)}
						>
							{totalPages}
						</Button>
					</>
				)}

				<Button
					variant="outline"
					size="icon"
					onClick={() => onPageChange(currentPage + 1)}
					disabled={currentPage === totalPages}
				>
					<ChevronRight className="h-4 w-4" />
				</Button>
			</div>
		</div>
	);
};

const getStatusBadge = (status) => {
	switch (status) {
		case "Proses Pengajuan":
			return (
				<Badge
					variant="outline"
					className="bg-yellow-50 text-yellow-600 border-yellow-300"
				>
					{status}
				</Badge>
			);
		case "Disetujui":
			return (
				<Badge
					variant="outline"
					className="bg-green-50 text-green-600 border-green-300"
				>
					{status}
				</Badge>
			);
		case "Ditolak":
			return (
				<Badge
					variant="outline"
					className="bg-red-50 text-red-600 border-red-300"
				>
					{status}
				</Badge>
			);
		default:
			return (
				<Badge
					variant="outline"
					className="bg-gray-50 text-gray-600 border-gray-300"
				>
					{status}
				</Badge>
			);
	}
};

const IzinCard = ({ item, onDelete }) => {
	return (
		<Accordion type="single" collapsible className="w-full">
			<AccordionItem
				value={item.no_pengajuan}
				className="border rounded-lg mb-2"
			>
				<AccordionTrigger className="px-4 py-2 hover:no-underline">
					<div className="flex flex-col items-start text-left">
						<div className="font-medium">{item.no_pengajuan}</div>
						<div className="text-sm text-gray-500">
							{format(new Date(item.tanggal), "dd MMM yyyy", {
								locale: id,
							})}
						</div>
					</div>
				</AccordionTrigger>
				<AccordionContent className="px-4 pb-4">
					<div className="space-y-3">
						<div>
							<div className="text-sm font-medium text-gray-500">Periode</div>
							<div className="flex items-center mt-1">
								<Clock className="w-4 h-4 mr-1 text-blue-600" />
								<div className="text-sm">
									{format(new Date(item.tanggal_awal), "dd MMM yyyy", {
										locale: id,
									})}{" "}
									-{" "}
									{format(new Date(item.tanggal_akhir), "dd MMM yyyy", {
										locale: id,
									})}
								</div>
							</div>
							<Badge variant="outline" className="mt-1">
								{item.jumlah} hari
							</Badge>
						</div>

						<div>
							<div className="text-sm font-medium text-gray-500">Urgensi</div>
							<div className="text-sm mt-1">{item.urgensi}</div>
						</div>

						<div>
							<div className="text-sm font-medium text-gray-500">
								Kepentingan
							</div>
							<div className="text-sm mt-1">{item.kepentingan}</div>
						</div>

						<div>
							<div className="text-sm font-medium text-gray-500">
								Penanggung Jawab
							</div>
							<div className="text-sm mt-1">{item.nama_pj}</div>
						</div>

						<div className="flex items-center justify-between">
							<div>{getStatusBadge(item.status)}</div>
							{item.status !== "Disetujui" && (
								<Button
									variant="ghost"
									size="sm"
									className="text-red-500 hover:text-red-600 hover:bg-red-50"
									onClick={() => onDelete(item.no_pengajuan)}
								>
									<Trash2 className="w-4 h-4 mr-2" />
									Hapus
								</Button>
							)}
						</div>
					</div>
				</AccordionContent>
			</AccordionItem>
		</Accordion>
	);
};

export default function DaftarIzin() {
	const [izin, setIzin] = useState([]);
	const [loading, setLoading] = useState(true);
	const [filterDate, setFilterDate] = useState({
		start: undefined,
		end: undefined,
	});
	const [pagination, setPagination] = useState({
		currentPage: 1,
		totalPages: 1,
		total: 0,
		perPage: 10,
	});
	const [deleteDialog, setDeleteDialog] = useState({
		isOpen: false,
		noPengajuan: null,
	});

	const fetchIzin = async (filters = {}, page = 1) => {
		try {
			setLoading(true);
			// Buat URL dengan parameter filter
			const url = new URL("/api/izin", window.location.origin);
			if (filters.start) {
				url.searchParams.append(
					"start_date",
					format(filters.start, "yyyy-MM-dd")
				);
			}
			if (filters.end) {
				url.searchParams.append("end_date", format(filters.end, "yyyy-MM-dd"));
			}
			url.searchParams.append("page", page.toString());
			url.searchParams.append("limit", pagination.perPage.toString());

			const response = await fetch(url);
			const data = await response.json();
			if (data.status === "success") {
				setIzin(data.data);
				setPagination({
					currentPage: data.meta.currentPage,
					totalPages: data.meta.totalPages,
					total: data.meta.total,
					perPage: data.meta.perPage,
				});
			}
		} catch (error) {
			console.error("Error fetching izin:", error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchIzin();
	}, []);

	useEffect(() => {
		// Reset halaman ke 1 ketika filter berubah
		fetchIzin(filterDate, 1);
	}, [filterDate]);

	const handlePageChange = (page) => {
		fetchIzin(filterDate, page);
	};

	const handleDateChange = (value, type) => {
		setFilterDate((prev) => ({
			...prev,
			[type]: value,
		}));
	};

	const clearFilters = () => {
		setFilterDate({
			start: undefined,
			end: undefined,
		});
	};

	const handleDelete = async () => {
		try {
			const response = await fetch(
				`/api/izin?no_pengajuan=${deleteDialog.noPengajuan}`,
				{
					method: "DELETE",
				}
			);

			const data = await response.json();

			if (data.status === "success") {
				toast.success("Pengajuan izin berhasil dihapus");
				// Refresh data
				fetchIzin(filterDate, pagination.currentPage);
			} else {
				toast.error(data.message || "Gagal menghapus pengajuan izin");
			}
		} catch (error) {
			console.error("Error deleting izin:", error);
			toast.error("Gagal menghapus pengajuan izin");
		} finally {
			setDeleteDialog({ isOpen: false, noPengajuan: null });
		}
	};

	const showDeleteDialog = (noPengajuan) => {
		setDeleteDialog({
			isOpen: true,
			noPengajuan,
		});
	};

	return (
		<div>
			{/* Filter Section */}
			<Accordion type="single" collapsible className="w-full md:hidden mb-4">
				<AccordionItem value="filter">
					<AccordionTrigger className="hover:no-underline">
						<div className="flex items-center">
							<Search className="w-4 h-4 mr-2" />
							Filter Data
						</div>
					</AccordionTrigger>
					<AccordionContent>
						<div className="space-y-4">
							<div>
								<label className="text-sm font-medium text-gray-700 mb-2 block">
									Tanggal Awal
								</label>
								<DatePicker
									value={filterDate.start}
									onChange={(value) => handleDateChange(value, "start")}
									placeholder="Pilih tanggal awal"
								/>
							</div>
							<div>
								<label className="text-sm font-medium text-gray-700 mb-2 block">
									Tanggal Akhir
								</label>
								<DatePicker
									value={filterDate.end}
									onChange={(value) => handleDateChange(value, "end")}
									placeholder="Pilih tanggal akhir"
									minDate={filterDate.start}
								/>
							</div>
							<Button
								variant="outline"
								onClick={clearFilters}
								className="w-full"
							>
								<X className="w-4 h-4 mr-2" />
								Reset Filter
							</Button>
						</div>
					</AccordionContent>
				</AccordionItem>
			</Accordion>

			{/* Desktop Filter */}
			<div className="hidden md:block mb-6">
				<div className="flex flex-col md:flex-row gap-4 items-end">
					<div className="w-full md:w-1/3">
						<label className="text-sm font-medium text-gray-700 mb-2 block">
							Tanggal Awal
						</label>
						<DatePicker
							value={filterDate.start}
							onChange={(value) => handleDateChange(value, "start")}
							placeholder="Pilih tanggal awal"
						/>
					</div>
					<div className="w-full md:w-1/3">
						<label className="text-sm font-medium text-gray-700 mb-2 block">
							Tanggal Akhir
						</label>
						<DatePicker
							value={filterDate.end}
							onChange={(value) => handleDateChange(value, "end")}
							placeholder="Pilih tanggal akhir"
							minDate={filterDate.start}
						/>
					</div>
					<div className="flex gap-2">
						<Button variant="outline" onClick={clearFilters} className="h-12">
							<X className="w-4 h-4 mr-2" />
							Reset
						</Button>
					</div>
				</div>
			</div>

			{/* Mobile View */}
			<div className="md:hidden">
				{loading ? (
					<div className="flex items-center justify-center py-10">
						<div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
						<span className="ml-2">Memuat data...</span>
					</div>
				) : izin.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-10 text-gray-500">
						<FileText className="w-12 h-12 mb-2" />
						<p>Belum ada pengajuan izin</p>
					</div>
				) : (
					<div className="space-y-2">
						{izin.map((item) => (
							<IzinCard
								key={item.no_pengajuan}
								item={item}
								onDelete={showDeleteDialog}
							/>
						))}
					</div>
				)}
			</div>

			{/* Desktop View */}
			<div className="hidden md:block">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>No. Pengajuan</TableHead>
							<TableHead>Tanggal</TableHead>
							<TableHead>Periode</TableHead>
							<TableHead>Urgensi</TableHead>
							<TableHead>Kepentingan</TableHead>
							<TableHead>Penanggung Jawab</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Aksi</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{loading ? (
							<TableRow>
								<TableCell colSpan={8} className="text-center py-10">
									<div className="flex items-center justify-center">
										<div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
										<span className="ml-2">Memuat data...</span>
									</div>
								</TableCell>
							</TableRow>
						) : izin.length === 0 ? (
							<TableRow>
								<TableCell colSpan={8} className="text-center py-10">
									<div className="flex flex-col items-center justify-center text-gray-500">
										<FileText className="w-12 h-12 mb-2" />
										<p>Belum ada pengajuan izin</p>
									</div>
								</TableCell>
							</TableRow>
						) : (
							izin.map((item) => (
								<TableRow key={item.no_pengajuan}>
									<TableCell className="font-medium">
										{item.no_pengajuan}
									</TableCell>
									<TableCell>
										{format(new Date(item.tanggal), "dd MMM yyyy", {
											locale: id,
										})}
									</TableCell>
									<TableCell>
										<div className="flex items-center">
											<Clock className="w-4 h-4 mr-1 text-blue-600" />
											{format(new Date(item.tanggal_awal), "dd MMM yyyy", {
												locale: id,
											})}{" "}
											-{" "}
											{format(new Date(item.tanggal_akhir), "dd MMM yyyy", {
												locale: id,
											})}
											<Badge variant="outline" className="ml-2">
												{item.jumlah} hari
											</Badge>
										</div>
									</TableCell>
									<TableCell>{item.urgensi}</TableCell>
									<TableCell className="max-w-xs truncate">
										{item.kepentingan}
									</TableCell>
									<TableCell>{item.nama_pj}</TableCell>
									<TableCell>{getStatusBadge(item.status)}</TableCell>
									<TableCell>
										{item.status !== "Disetujui" && (
											<Button
												variant="ghost"
												size="icon"
												className="text-red-500 hover:text-red-600 hover:bg-red-50"
												onClick={() => showDeleteDialog(item.no_pengajuan)}
											>
												<Trash2 className="w-4 h-4" />
											</Button>
										)}
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>

			{/* Pagination */}
			{!loading && izin.length > 0 && (
				<div className="mt-4 flex justify-center">
					<Pagination
						currentPage={pagination.currentPage}
						totalPages={pagination.totalPages}
						onPageChange={handlePageChange}
					/>
				</div>
			)}

			{/* Delete Confirmation Dialog */}
			<AlertDialog
				open={deleteDialog.isOpen}
				onOpenChange={(isOpen) =>
					setDeleteDialog({ isOpen, noPengajuan: null })
				}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
						<AlertDialogDescription>
							Apakah Anda yakin ingin menghapus pengajuan izin ini? Tindakan ini
							tidak dapat dibatalkan.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Batal</AlertDialogCancel>
						<AlertDialogAction
							className="bg-red-500 hover:bg-red-600"
							onClick={handleDelete}
						>
							Hapus
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
