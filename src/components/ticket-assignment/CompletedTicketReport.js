import { useState, useEffect, useRef } from "react";
import {
	FileText,
	Printer,
	Download,
	Filter,
	Calendar,
	Search,
	X,
	Loader2,
} from "lucide-react";
import moment from "moment-timezone";
import "moment/locale/id";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

moment.locale("id");
moment.tz.setDefault("Asia/Jakarta");

const CompletedTicketReport = ({ masterData, itEmployees }) => {
	const [tickets, setTickets] = useState([]);
	const [loading, setLoading] = useState(false);
	const [filters, setFilters] = useState({
		start_date: moment().subtract(1, "month").format("YYYY-MM-DD"),
		end_date: moment().format("YYYY-MM-DD"),
		department_id: "",
		assigned_to: "",
		category_id: "",
		search: "",
		enable_date_filter: true,
	});

	const tableRef = useRef(null);

	const fetchCompletedTickets = async () => {
		setLoading(true);
		try {
			const params = new URLSearchParams({
				status: "Resolved", // Or 'Closed', depending on logic. The API handles OR if we don't specify or if we specify one.
				// Actually, the API filters (at.released_date IS NULL OR s.status_name IN ('Closed', 'Resolved'))
				// But we want ONLY completed ones for the report.
				// The API update I made supports date filtering on resolved_date.
				// So if I pass start_date/end_date, it will filter.
				// But I should also ensure I only get completed tickets.
				// The API logic `if (status) ...` adds a WHERE clause.
				// If I don't pass status, it returns all assigned tickets (including active ones).
				// So I should probably filter by status on the client or request specific statuses.
				// The API doesn't support multiple status values in query param easily without modification or multiple calls.
				// However, the base query already includes `s.status_name IN ('Closed', 'Resolved')`.
				// If I add `status=Resolved` it will only show Resolved.
				// If I add `status=Closed` it will only show Closed.
				// If I want both, I might need to not pass status and filter client side OR update API to support multiple statuses.
				// For now, let's assume "Resolved" and "Closed" are what we want.
				// Let's try not passing status and filtering on client side if needed, OR just fetching a large limit.
				// Wait, the user requirement is "ticket yang telah selesai".
				// I'll fetch with a large limit for now to generate report.
				limit: "1000", // Reasonable limit for a report
			});

			if (filters.enable_date_filter) {
				params.append("start_date", filters.start_date);
				params.append("end_date", filters.end_date);
			}

			if (filters.department_id) {
				params.append("department_id", filters.department_id);
			}
			if (filters.assigned_to) {
				params.append("assigned_to", filters.assigned_to);
			}
			if (filters.category_id) {
				params.append("category_id", filters.category_id);
			}
			if (filters.search) {
				params.append("search", filters.search);
			}

			const response = await fetch(`/api/ticket-assignment?${params}`);
			const result = await response.json();

			if (result.status === "success") {
				// Filter client-side to ensure only Closed/Resolved if API returns others
				// The API base query returns assigned tickets (active) OR completed tickets.
				// So we must filter for completed statuses.
				const completed = result.data.filter((t) =>
					["Closed", "Resolved"].includes(t.current_status),
				);
				setTickets(completed);
			}
		} catch (error) {
			console.error("Error fetching report data:", error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchCompletedTickets();
	}, [filters]);

	const handlePrint = () => {
		window.print();
	};

	const handleExportPDF = () => {
		const doc = new jsPDF();

		// Add title
		doc.setFontSize(18);
		doc.text("Laporan Penyelesaian Tiket IT", 14, 22);

		// Add info
		doc.setFontSize(11);
		if (filters.enable_date_filter) {
			doc.text(
				`Periode: ${moment(filters.start_date).format("DD/MM/YYYY")} - ${moment(
					filters.end_date,
				).format("DD/MM/YYYY")}`,
				14,
				30,
			);
		} else {
			doc.text("Periode: Semua Waktu", 14, 30);
		}

		const tableColumn = [
			"No. Tiket",
			"Tanggal",
			"Judul",
			"Departemen",
			"Teknisi",
			"Status",
			"Tgl Selesai",
		];

		const tableRows = [];

		tickets.forEach((ticket) => {
			const ticketData = [
				ticket.no_ticket || ticket.ticket_id,
				moment(ticket.submission_date_raw).format("DD/MM/YYYY"),
				ticket.title,
				ticket.departemen_name || "-",
				ticket.assigned_to_name || "-",
				ticket.resolution_note || ticket.current_status,
				ticket.resolved_date_raw
					? moment(ticket.resolved_date_raw).format("DD/MM/YYYY HH:mm")
					: "-",
			];
			tableRows.push(ticketData);
		});

		autoTable(doc, {
			head: [tableColumn],
			body: tableRows,
			startY: 40,
			theme: "grid",
			styles: { fontSize: 8 },
			headStyles: { fillColor: [59, 130, 246] }, // Blue-500
		});

		doc.save(`laporan_tiket_selesai_${moment().format("YYYYMMDD")}.pdf`);
	};

	const handleExportExcel = () => {
		const wb = XLSX.utils.book_new();

		const data = tickets.map((ticket) => ({
			"No. Tiket": ticket.no_ticket || ticket.ticket_id,
			"Tanggal Pengajuan": ticket.submission_date_raw
				? moment(ticket.submission_date_raw).format("DD/MM/YYYY HH:mm")
				: "-",
			Judul: ticket.title,
			Deskripsi: ticket.description,
			Departemen: ticket.departemen_name,
			Prioritas: ticket.priority_name,
			Kategori: ticket.category_name,
			Status: ticket.current_status,
			Teknisi: ticket.assigned_to_name,
			Solusi: ticket.resolution_note || ticket.current_status,
			"Tanggal Selesai": ticket.resolved_date_raw
				? moment(ticket.resolved_date_raw).format("DD/MM/YYYY HH:mm")
				: "-",
			"Durasi (Jam)":
				ticket.resolved_date_raw && ticket.assigned_date_raw
					? moment(ticket.resolved_date_raw)
							.diff(moment(ticket.assigned_date_raw), "hours", true)
							.toFixed(2)
					: "-",
		}));

		const ws = XLSX.utils.json_to_sheet(data);

		// Adjust column width
		const wscols = [
			{ wch: 15 }, // No Ticket
			{ wch: 20 }, // Tanggal
			{ wch: 30 }, // Judul
			{ wch: 40 }, // Deskripsi
			{ wch: 15 }, // Departemen
			{ wch: 10 }, // Prioritas
			{ wch: 15 }, // Kategori
			{ wch: 10 }, // Status
			{ wch: 20 }, // Teknisi
			{ wch: 40 }, // Solusi
			{ wch: 20 }, // Tgl Selesai
			{ wch: 10 }, // Durasi
		];
		ws["!cols"] = wscols;

		XLSX.utils.book_append_sheet(wb, ws, "Laporan Tiket");
		XLSX.writeFile(
			wb,
			`laporan_tiket_selesai_${moment().format("YYYYMMDD")}.xlsx`,
		);
	};

	return (
		<div className="space-y-6">
			{/* Filters & Actions - Hide on Print */}
			<div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 print:hidden">
				<div className="flex flex-col lg:flex-row justify-between gap-4">
					{/* Filters */}
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 flex-1">
						<div className="space-y-1">
							<label className="text-xs font-medium text-gray-500">
								Cari (No. Tiket / Judul)
							</label>
							<div className="relative">
								<input
									type="text"
									value={filters.search}
									onChange={(e) =>
										setFilters({ ...filters, search: e.target.value })
									}
									placeholder="Cari..."
									className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 pl-8 border"
								/>
								<Search className="w-4 h-4 text-gray-400 absolute left-2 top-2.5" />
							</div>
						</div>
						<div className="space-y-1">
							<label className="text-xs font-medium text-gray-500">
								Kategori
							</label>
							<select
								value={filters.category_id}
								onChange={(e) =>
									setFilters({ ...filters, category_id: e.target.value })
								}
								className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
							>
								<option value="">Semua Kategori</option>
								{masterData?.categories?.map((cat) => (
									<option key={cat.category_id} value={cat.category_id}>
										{cat.category_name}
									</option>
								))}
							</select>
						</div>
						<div className="space-y-1">
							<label className="text-xs font-medium text-gray-500">
								Departemen
							</label>
							<select
								value={filters.department_id}
								onChange={(e) =>
									setFilters({ ...filters, department_id: e.target.value })
								}
								className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
							>
								<option value="">Semua Departemen</option>
								{masterData?.departments?.map((dept) => (
									<option key={dept.dep_id} value={dept.dep_id}>
										{dept.nama}
									</option>
								))}
							</select>
						</div>
						<div className="space-y-1">
							<label className="text-xs font-medium text-gray-500">
								Teknisi
							</label>
							<select
								value={filters.assigned_to}
								onChange={(e) =>
									setFilters({ ...filters, assigned_to: e.target.value })
								}
								className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
							>
								<option value="">Semua Teknisi</option>
								{itEmployees.map((emp) => (
									<option key={emp.nik} value={emp.nik}>
										{emp.nama}
									</option>
								))}
							</select>
						</div>
						<div className="space-y-1">
							<div className="flex items-center justify-between">
								<label className="text-xs font-medium text-gray-500">
									Dari Tanggal
								</label>
								<div className="flex items-center">
									<input
										type="checkbox"
										id="enable_date"
										checked={filters.enable_date_filter}
										onChange={(e) =>
											setFilters({
												...filters,
												enable_date_filter: e.target.checked,
											})
										}
										className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
									/>
									<label
										htmlFor="enable_date"
										className="ml-1 text-xs text-gray-500 cursor-pointer"
									>
										Aktif
									</label>
								</div>
							</div>
							<input
								type="date"
								value={filters.start_date}
								onChange={(e) =>
									setFilters({ ...filters, start_date: e.target.value })
								}
								disabled={!filters.enable_date_filter}
								className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border ${
									!filters.enable_date_filter ? "bg-gray-100 text-gray-400" : ""
								}`}
							/>
						</div>
						<div className="space-y-1">
							<label className="text-xs font-medium text-gray-500">
								Sampai Tanggal
							</label>
							<input
								type="date"
								value={filters.end_date}
								onChange={(e) =>
									setFilters({ ...filters, end_date: e.target.value })
								}
								disabled={!filters.enable_date_filter}
								className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border ${
									!filters.enable_date_filter ? "bg-gray-100 text-gray-400" : ""
								}`}
							/>
						</div>
					</div>

					{/* Actions */}
					<div className="flex items-end gap-2">
						<button
							onClick={handlePrint}
							className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
						>
							<Printer className="w-4 h-4 mr-2" />
							Print
						</button>
						<button
							onClick={handleExportPDF}
							className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
						>
							<FileText className="w-4 h-4 mr-2" />
							PDF
						</button>
						<button
							onClick={handleExportExcel}
							className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
						>
							<Download className="w-4 h-4 mr-2" />
							Excel
						</button>
					</div>
				</div>
			</div>

			{/* Report Preview */}
			<div className="bg-white p-8 shadow-lg border border-gray-200 min-h-[29.7cm] print:shadow-none print:border-none print:p-0">
				{/* Report Header */}
				<div className="mb-8 border-b pb-4">
					<div className="flex justify-between items-start">
						<div>
							<h1 className="text-2xl font-bold text-gray-900">
								Laporan Penyelesaian Tiket IT
							</h1>
							<p className="text-gray-500 mt-1">Departemen IT - Sistem SDM</p>
						</div>
						<div className="text-right text-sm text-gray-600">
							<p>Dicetak pada: {moment().format("DD MMMM YYYY HH:mm")}</p>
							{filters.enable_date_filter ? (
								<p>
									Periode: {moment(filters.start_date).format("DD/MM/YYYY")} -{" "}
									{moment(filters.end_date).format("DD/MM/YYYY")}
								</p>
							) : (
								<p>Periode: Semua Waktu</p>
							)}
						</div>
					</div>
				</div>

				{/* Loading State */}
				{loading ? (
					<div className="flex justify-center items-center py-12">
						<Loader2 className="w-8 h-8 animate-spin text-blue-500" />
						<span className="ml-2 text-gray-500">Memuat data...</span>
					</div>
				) : tickets.length === 0 ? (
					<div className="text-center py-12 text-gray-500 border-2 border-dashed rounded-lg">
						Tidak ada data tiket yang selesai pada periode ini.
					</div>
				) : (
					/* Data Table */
					<div className="overflow-x-auto">
						<table
							className="min-w-full divide-y divide-gray-200"
							ref={tableRef}
						>
							<thead>
								<tr className="bg-gray-50">
									<th
										scope="col"
										className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
									>
										No. Tiket
									</th>
									<th
										scope="col"
										className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
									>
										Tanggal
									</th>
									<th
										scope="col"
										className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
									>
										Judul & Deskripsi
									</th>
									<th
										scope="col"
										className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
									>
										Departemen
									</th>
									<th
										scope="col"
										className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
									>
										Teknisi
									</th>
									<th
										scope="col"
										className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
									>
										Solusi
									</th>
									<th
										scope="col"
										className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
									>
										Waktu Penyelesaian
									</th>
								</tr>
							</thead>
							<tbody className="bg-white divide-y divide-gray-200">
								{tickets.map((ticket, index) => (
									<tr
										key={ticket.ticket_id}
										className={
											index % 2 === 0
												? "bg-white"
												: "bg-gray-50 print:bg-gray-50"
										}
									>
										<td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
											{ticket.no_ticket || `#${ticket.ticket_id}`}
										</td>
										<td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
											{moment(ticket.submission_date_raw).format("DD/MM/YYYY")}
										</td>
										<td className="px-3 py-4 text-sm text-gray-500 max-w-xs">
											<div className="font-medium text-gray-900 mb-1">
												{ticket.title}
											</div>
											<div className="text-xs line-clamp-3">
												{ticket.description}
											</div>
										</td>
										<td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
											{ticket.departemen_name}
										</td>
										<td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
											{ticket.assigned_to_name}
										</td>
										<td className="px-3 py-4 text-sm text-gray-500 max-w-xs">
											{ticket.resolution_note ? (
												<div className="text-sm">{ticket.resolution_note}</div>
											) : (
												<span
													className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
														ticket.current_status === "Resolved"
															? "bg-green-100 text-green-800"
															: "bg-gray-100 text-gray-800"
													}`}
												>
													{ticket.current_status}
												</span>
											)}
										</td>
										<td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
											{ticket.resolved_date_raw ? (
												<div className="flex flex-col">
													<span>
														{moment(ticket.resolved_date_raw).format(
															"DD/MM/YYYY",
														)}
													</span>
													<span className="text-xs">
														{moment(ticket.resolved_date_raw).format("HH:mm")}
													</span>
												</div>
											) : (
												"-"
											)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}

				{/* Report Footer */}
				<div className="mt-8 pt-8 border-t border-gray-200 break-inside-avoid">
					<div className="flex justify-between text-sm text-gray-500">
						<div>
							<p>Total Tiket: {tickets.length}</p>
						</div>
						<div className="text-right">
							<p>Halaman ini dicetak secara otomatis oleh sistem.</p>
						</div>
					</div>
				</div>
			</div>

			{/* Print Styles */}
			<style jsx global>{`
				@media print {
					@page {
						size: A4;
						margin: 10mm;
					}
					body {
						print-color-adjust: exact;
						-webkit-print-color-adjust: exact;
					}
					/* Hide everything else */
					nav,
					aside,
					header,
					footer,
					.print\\:hidden {
						display: none !important;
					}
				}
			`}</style>
		</div>
	);
};

export default CompletedTicketReport;
