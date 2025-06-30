"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
} from "lucide-react";

const PengajuanPagination = ({
	currentPage = 1,
	totalItems = 0,
	itemsPerPage = 10,
	onPageChange,
}) => {
	const totalPages = Math.ceil(totalItems / itemsPerPage);
	const startIndex = (currentPage - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;

	const goToPage = (page) => {
		if (page >= 1 && page <= totalPages) {
			onPageChange(page);
		}
	};

	const goToFirstPage = () => onPageChange(1);
	const goToLastPage = () => onPageChange(totalPages);
	const goToPreviousPage = () => {
		if (currentPage > 1) onPageChange(currentPage - 1);
	};
	const goToNextPage = () => {
		if (currentPage < totalPages) onPageChange(currentPage + 1);
	};

	// Generate page numbers for pagination
	const getPageNumbers = () => {
		const pages = [];
		const maxVisiblePages = 5;

		if (totalPages <= maxVisiblePages) {
			for (let i = 1; i <= totalPages; i++) {
				pages.push(i);
			}
		} else {
			const startPage = Math.max(
				1,
				currentPage - Math.floor(maxVisiblePages / 2)
			);
			const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

			for (let i = startPage; i <= endPage; i++) {
				pages.push(i);
			}
		}

		return pages;
	};

	// Don't render if there's only one page or no items
	if (totalItems === 0 || totalPages <= 1) {
		return null;
	}

	return (
		<Card>
			<CardContent className="py-4">
				<div className="flex flex-col sm:flex-row items-center justify-between gap-4">
					{/* Info */}
					<div className="text-sm text-gray-600">
						Menampilkan {startIndex + 1} - {Math.min(endIndex, totalItems)} dari{" "}
						{totalItems} data
					</div>

					{/* Pagination Controls */}
					<div className="flex items-center gap-2">
						{/* First Page */}
						<Button
							variant="outline"
							size="sm"
							onClick={goToFirstPage}
							disabled={currentPage === 1}
							className="hidden sm:flex"
						>
							<ChevronsLeft className="w-4 h-4" />
						</Button>

						{/* Previous Page */}
						<Button
							variant="outline"
							size="sm"
							onClick={goToPreviousPage}
							disabled={currentPage === 1}
						>
							<ChevronLeft className="w-4 h-4" />
						</Button>

						{/* Page Numbers */}
						<div className="flex items-center gap-1">
							{getPageNumbers().map((pageNum) => (
								<Button
									key={`page-${pageNum}`}
									variant={currentPage === pageNum ? "default" : "outline"}
									size="sm"
									onClick={() => goToPage(pageNum)}
									className={`min-w-[40px] ${
										currentPage === pageNum
											? "bg-blue-600 hover:bg-blue-700 text-white"
											: ""
									}`}
								>
									{pageNum}
								</Button>
							))}
						</div>

						{/* Next Page */}
						<Button
							variant="outline"
							size="sm"
							onClick={goToNextPage}
							disabled={currentPage === totalPages}
						>
							<ChevronRight className="w-4 h-4" />
						</Button>

						{/* Last Page */}
						<Button
							variant="outline"
							size="sm"
							onClick={goToLastPage}
							disabled={currentPage === totalPages}
							className="hidden sm:flex"
						>
							<ChevronsRight className="w-4 h-4" />
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	);
};

export default PengajuanPagination;
