"use client";

import { useState, useEffect, useMemo } from "react";
import {
    flexRender,
    getCoreRowModel,
    useReactTable,
    getPaginationRowModel,
} from "@tanstack/react-table";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { 
    ChevronLeft, 
    ChevronRight, 
    Loader2, 
    Search, 
    FileText, 
    Printer, 
    Settings,
    RotateCcw,
    X,
    AlertCircle,
    FileX2,
    FilterX
} from "lucide-react";
import { toast } from "sonner";
import { printGajiReport } from "@/components/penggajian/PrintGajiReport";
import PenggajianSettingsModal from "@/components/penggajian/PenggajianSettingsModal";

// Format currency
const formatCurrency = (value) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0
    }).format(value);
};

// Format date
const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
};

export default function DataGajiPage() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        pageIndex: 0, // TanStack table is 0-indexed
        pageSize: 10,
    });
    const [totalPages, setTotalPages] = useState(0);
    const [totalRecords, setTotalRecords] = useState(0);
    const [fetchError, setFetchError] = useState(null);
    
    // Filters
    const currentMonthDefault = (new Date().getMonth() + 1).toString();
    const currentYearDefault = new Date().getFullYear().toString();
    const [search, setSearch] = useState("");
    const [month, setMonth] = useState(currentMonthDefault);
    const [year, setYear] = useState(currentYearDefault);
    const [jenis, setJenis] = useState("all");
    const [departemen, setDepartemen] = useState("all");
    const [departemenList, setDepartemenList] = useState([]);
    const [printing, setPrinting] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
    const [printGroupByContract, setPrintGroupByContract] = useState(false);

    // Dynamic year list: currentYear + 1 down to currentYear - 5
    const years = useMemo(() => {
        const curYear = new Date().getFullYear();
        return Array.from({ length: 7 }, (_, i) => (curYear + 1 - i).toString());
    }, []);

    // Check if any filter is different from initial state
    const hasActiveFilters = useMemo(() => {
        return Boolean(
            search.trim() !== "" ||
            month !== currentMonthDefault ||
            year !== currentYearDefault ||
            jenis !== "all" ||
            departemen !== "all"
        );
    }, [search, month, year, jenis, departemen, currentMonthDefault, currentYearDefault]);

    // Reset all filters to default
    const handleResetFilters = () => {
        setSearch("");
        setMonth(currentMonthDefault);
        setYear(currentYearDefault);
        setJenis("all");
        setDepartemen("all");
        setPagination(prev => ({ ...prev, pageIndex: 0 }));
    };

    // Handle Print
    const handlePrint = async (groupByContract = false) => {
        // Validate filters for print - need specific month and year
        if (month === "all") {
            toast.error("Pilih bulan tertentu untuk mencetak");
            return;
        }
        if (!year || year.length !== 4) {
            toast.error("Pilih tahun yang valid");
            return;
        }
        
        setPrinting(true);
        try {
            await printGajiReport(
                parseInt(month),
                parseInt(year),
                jenis === "all" ? "Gaji" : jenis,
                departemen === "all" ? undefined : departemen,
                groupByContract
            );
            toast.success("Laporan berhasil dibuka");
        } catch (error) {
            toast.error("Gagal mencetak", { description: error.message });
        } finally {
            setPrinting(false);
        }
    };

    // Columns definition
    const columns = useMemo(() => [
        {
            accessorKey: "nik",
            header: "NIK",
            cell: ({ row }) => <span className="font-mono text-xs">{row.getValue("nik")}</span>,
        },
        {
            accessorKey: "nama",
            header: "Nama Pegawai",
            cell: ({ row }) => <span className="font-medium">{row.getValue("nama")}</span>,
        },
        {
            accessorKey: "periode",
            header: "Periode",
            cell: ({ row }) => {
                const date = new Date(0, row.original.periode_bulan - 1);
                return `${date.toLocaleString('id-ID', { month: 'long' })} ${row.original.periode_tahun}`;
            },
        },
        {
            accessorKey: "jenis",
            header: "Jenis",
            cell: ({ row }) => (
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                    row.original.jenis && row.original.jenis.toString().trim().toUpperCase() === 'GAJI' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                }`}>
                    {row.getValue("jenis")}
                </span>
            )
        },
        {
            accessorKey: "gaji",
            header: () => <div className="text-right">Gaji</div>,
            cell: ({ row }) => <div className="text-right font-medium">{formatCurrency(row.getValue("gaji"))}</div>,
        },
        {
            accessorKey: "uploaded_by",
            header: "Diinput Oleh",
            cell: ({ row }) => <span className="text-muted-foreground text-xs">{row.getValue("uploaded_by") || "-"}</span>,
        },
        {
            accessorKey: "uploaded_at",
            header: "Tanggal Upload",
            cell: ({ row }) => <span className="text-muted-foreground text-xs">{row.getValue("uploaded_at") ? formatDate(row.getValue("uploaded_at")) : "-"}</span>,
        },
    ], []);

    // Fetch Data
    const fetchData = async () => {
        setLoading(true);
        setFetchError(null);
        try {
            const params = new URLSearchParams({
                page: (pagination.pageIndex + 1).toString(),
                limit: pagination.pageSize.toString(),
                search: search,
                bulan: month,
                tahun: year,
                jenis: jenis,
                departemen: departemen
            });

            const response = await fetch(`/api/gaji-pegawai?${params}`);
            const result = await response.json();

            if (result.status === "success") {
                setData(result.data || []);
                setTotalPages(result.pagination?.totalPages || 0);
                setTotalRecords(result.pagination?.total || 0);
            } else {
                setFetchError(result.message || "Gagal memuat data");
                toast.error("Gagal mengambil data", { description: result.message });
            }
        } catch (error) {
            setFetchError("Gagal menghubungi server untuk memuat data.");
            toast.error("Terjadi kesalahan", { description: "Gagal memuat data" });
        } finally {
            setLoading(false);
        }
    };

    // Fetch Departments List
    const fetchDepartments = async () => {
        try {
            const response = await fetch("/api/departemen");
            const result = await response.json();
            if (result.status === "success") {
                setDepartemenList(result.data);
            }
        } catch (error) {
            console.error("Error fetching departments:", error);
        }
    };

    useEffect(() => {
        fetchDepartments();
    }, []);

    // Debounce search and effect
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData();
        }, 500);
        return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pagination.pageIndex, pagination.pageSize, search, month, year, jenis, departemen]);

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        manualPagination: true,
        pageCount: totalPages,
        state: {
            pagination,
        },
        onPaginationChange: setPagination,
    });

    return (
        <div className="container mx-auto p-4 md:p-6 space-y-6">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2 tracking-tight text-slate-900">
                        <FileText className="w-8 h-8 text-blue-600" />
                        Data Gaji Pegawai
                    </h1>
                    <p className="text-sm text-slate-500">
                        Rekapitulasi data gaji yang telah digenerate per periode.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsPrintModalOpen(true)}
                        disabled={printing || loading}
                        className="gap-2 border-slate-200 hover:bg-slate-50 text-slate-700"
                    >
                        {printing ? (
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        ) : (
                            <Printer className="h-4 w-4 text-blue-600" aria-hidden="true" />
                        )}
                        Cetak Laporan
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsSettingsModalOpen(true)}
                        className="gap-2 text-slate-700 border-slate-200 hover:bg-slate-50"
                    >
                        <Settings className="h-4 w-4 text-slate-500" aria-hidden="true" />
                        Pengaturan
                    </Button>
                </div>
            </div>

            {/* Main Card */}
            <Card className="overflow-hidden border-slate-200 shadow-sm relative">
                {/* Brand Accent Bar on Top */}
                <div className="h-[3px] w-full bg-gradient-to-r from-blue-400 via-blue-600 to-blue-400" />
                
                <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold text-slate-900">Daftar Rekapitulasi Gaji</CardTitle>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Symmetrical Filter Panel */}
                    <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Filter Data</span>
                            {hasActiveFilters && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleResetFilters}
                                    className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 gap-1.5"
                                >
                                    <RotateCcw className="w-3 h-3" aria-hidden="true" />
                                    Reset Filter
                                </Button>
                            )}
                        </div>

                        {/* Search Bar - Full Width */}
                        <div className="relative w-full">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" aria-hidden="true" />
                            <Input
                                id="filter-search"
                                placeholder="Cari NIK atau Nama Pegawai..."
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPagination(prev => ({ ...prev, pageIndex: 0 })); }}
                                className="pl-9 pr-4 h-10 border-slate-200 bg-white focus-visible:ring-blue-500 w-full"
                                aria-label="Cari NIK atau Nama Pegawai"
                            />
                        </div>

                        {/* Dropdown Filters - 4-Column Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Month Filter */}
                            <div className="space-y-1.5">
                                <label htmlFor="filter-month" className="text-xs font-semibold text-slate-500">Bulan</label>
                                <Select value={month} onValueChange={(val) => { setMonth(val); setPagination(prev => ({ ...prev, pageIndex: 0 })); }}>
                                    <SelectTrigger id="filter-month" className="w-full bg-white border-slate-200 h-10">
                                        <SelectValue placeholder="Bulan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua Bulan</SelectItem>
                                        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                                            <SelectItem key={m} value={m.toString()}>
                                                {new Date(0, m - 1).toLocaleString('id-ID', { month: 'long' })}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Year Filter - Guarded Select */}
                            <div className="space-y-1.5">
                                <label htmlFor="filter-year" className="text-xs font-semibold text-slate-500">Tahun</label>
                                <Select value={year} onValueChange={(val) => { setYear(val); setPagination(prev => ({ ...prev, pageIndex: 0 })); }}>
                                    <SelectTrigger id="filter-year" className="w-full bg-white border-slate-200 h-10">
                                        <SelectValue placeholder="Pilih Tahun" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {years.map((y) => (
                                            <SelectItem key={y} value={y}>
                                                {y}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Jenis Filter */}
                            <div className="space-y-1.5">
                                <label htmlFor="filter-jenis" className="text-xs font-semibold text-slate-500">Jenis</label>
                                <Select value={jenis} onValueChange={(val) => { setJenis(val); setPagination(prev => ({ ...prev, pageIndex: 0 })); }}>
                                    <SelectTrigger id="filter-jenis" className="w-full bg-white border-slate-200 h-10">
                                        <SelectValue placeholder="Jenis" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua</SelectItem>
                                        <SelectItem value="Gaji">Gaji</SelectItem>
                                        <SelectItem value="Jasa">Jasa</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Departemen Filter */}
                            <div className="space-y-1.5">
                                <label htmlFor="filter-departemen" className="text-xs font-semibold text-slate-500">Departemen</label>
                                <Select value={departemen} onValueChange={(val) => { setDepartemen(val); setPagination(prev => ({ ...prev, pageIndex: 0 })); }}>
                                    <SelectTrigger id="filter-departemen" className="w-full bg-white border-slate-200 h-10">
                                        <SelectValue placeholder="Departemen" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua Departemen</SelectItem>
                                        {departemenList.map((dep) => (
                                            <SelectItem key={dep.dep_id} value={dep.dep_id}>
                                                {dep.nama}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Active Filter Chips */}
                    {hasActiveFilters && (
                        <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-lg bg-blue-50/40 border border-blue-100 text-xs">
                            <span className="font-semibold text-slate-600">Filter Aktif:</span>
                            {search && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-blue-200 text-slate-700 shadow-2xs">
                                    Cari: &quot;{search}&quot;
                                    <button 
                                        type="button" 
                                        onClick={() => { setSearch(""); setPagination(prev => ({ ...prev, pageIndex: 0 })); }}
                                        className="hover:text-red-600 p-0.5 rounded-xs"
                                        aria-label="Hapus filter pencarian"
                                    >
                                        <X className="w-3 h-3" aria-hidden="true" />
                                    </button>
                                </span>
                            )}
                            {month !== currentMonthDefault && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-blue-200 text-slate-700 shadow-2xs">
                                    Bulan: {month === "all" ? "Semua" : new Date(0, parseInt(month) - 1).toLocaleString('id-ID', { month: 'long' })}
                                    <button 
                                        type="button" 
                                        onClick={() => { setMonth(currentMonthDefault); setPagination(prev => ({ ...prev, pageIndex: 0 })); }}
                                        className="hover:text-red-600 p-0.5 rounded-xs"
                                        aria-label="Kembalikan bulan saat ini"
                                    >
                                        <X className="w-3 h-3" aria-hidden="true" />
                                    </button>
                                </span>
                            )}
                            {year !== currentYearDefault && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-blue-200 text-slate-700 shadow-2xs">
                                    Tahun: {year}
                                    <button 
                                        type="button" 
                                        onClick={() => { setYear(currentYearDefault); setPagination(prev => ({ ...prev, pageIndex: 0 })); }}
                                        className="hover:text-red-600 p-0.5 rounded-xs"
                                        aria-label="Kembalikan tahun saat ini"
                                    >
                                        <X className="w-3 h-3" aria-hidden="true" />
                                    </button>
                                </span>
                            )}
                            {jenis !== "all" && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-blue-200 text-slate-700 shadow-2xs">
                                    Jenis: {jenis}
                                    <button 
                                        type="button" 
                                        onClick={() => { setJenis("all"); setPagination(prev => ({ ...prev, pageIndex: 0 })); }}
                                        className="hover:text-red-600 p-0.5 rounded-xs"
                                        aria-label="Hapus filter jenis"
                                    >
                                        <X className="w-3 h-3" aria-hidden="true" />
                                    </button>
                                </span>
                            )}
                            {departemen !== "all" && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-blue-200 text-slate-700 shadow-2xs">
                                    Dept: {departemenList.find(d => d.dep_id === departemen)?.nama || departemen}
                                    <button 
                                        type="button" 
                                        onClick={() => { setDepartemen("all"); setPagination(prev => ({ ...prev, pageIndex: 0 })); }}
                                        className="hover:text-red-600 p-0.5 rounded-xs"
                                        aria-label="Hapus filter departemen"
                                    >
                                        <X className="w-3 h-3" aria-hidden="true" />
                                    </button>
                                </span>
                            )}
                            <button
                                type="button"
                                onClick={handleResetFilters}
                                className="ml-auto text-xs text-blue-600 hover:text-blue-800 font-medium underline-offset-2 hover:underline"
                            >
                                Reset Semua
                            </button>
                        </div>
                    )}

                    {/* Table View */}
                    <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm bg-white">
                        <Table>
                            <TableHeader className="bg-slate-50/75 border-b border-slate-200">
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow key={headerGroup.id} className="hover:bg-transparent">
                                        {headerGroup.headers.map((header) => {
                                            return (
                                                <TableHead key={header.id} className="text-slate-600 font-semibold text-xs uppercase tracking-wider py-3 h-auto">
                                                    {header.isPlaceholder
                                                        ? null
                                                        : flexRender(
                                                              header.column.columnDef.header,
                                                              header.getContext()
                                                          )}
                                                </TableHead>
                                            );
                                        })}
                                    </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={columns.length} className="h-32 text-center">
                                            <div className="flex justify-center items-center gap-2">
                                                <Loader2 className="h-6 w-6 animate-spin text-blue-600" aria-hidden="true" />
                                                <span className="text-slate-500 font-medium">Memuat data...</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : fetchError ? (
                                    <TableRow>
                                        <TableCell colSpan={columns.length} className="h-44 text-center py-6">
                                            <div className="flex flex-col items-center justify-center gap-2 text-slate-600 max-w-sm mx-auto">
                                                <AlertCircle className="w-8 h-8 text-red-500" aria-hidden="true" />
                                                <div className="font-semibold text-slate-800">Gagal Memuat Data</div>
                                                <p className="text-xs text-slate-500">{fetchError}</p>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={fetchData}
                                                    className="mt-2 text-xs border-slate-200 gap-1.5"
                                                >
                                                    <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                                                    Coba Lagi
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : table.getRowModel().rows?.length ? (
                                    table.getRowModel().rows.map((row) => (
                                        <TableRow
                                            key={row.id}
                                            data-state={row.getIsSelected() && "selected"}
                                            className="hover:bg-blue-50/20 transition-colors border-b border-slate-100 last:border-0"
                                        >
                                            {row.getVisibleCells().map((cell) => (
                                                <TableCell key={cell.id} className="py-3">
                                                    {flexRender(
                                                        cell.column.columnDef.cell,
                                                        cell.getContext()
                                                    )}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : hasActiveFilters ? (
                                    <TableRow>
                                        <TableCell colSpan={columns.length} className="h-44 text-center py-6">
                                            <div className="flex flex-col items-center justify-center gap-2 text-slate-600 max-w-sm mx-auto">
                                                <FilterX className="w-8 h-8 text-slate-400" aria-hidden="true" />
                                                <div className="font-semibold text-slate-800">Tidak Ada Data yang Cocok</div>
                                                <p className="text-xs text-slate-500">
                                                    Tidak ditemukan data gaji yang sesuai dengan kombinasi filter saat ini.
                                                </p>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleResetFilters}
                                                    className="mt-2 text-xs border-slate-200 gap-1.5"
                                                >
                                                    <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                                                    Reset Filter
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={columns.length} className="h-44 text-center py-6">
                                            <div className="flex flex-col items-center justify-center gap-2 text-slate-600 max-w-sm mx-auto">
                                                <FileX2 className="w-8 h-8 text-slate-400" aria-hidden="true" />
                                                <div className="font-semibold text-slate-800">Belum Ada Data Gaji</div>
                                                <p className="text-xs text-slate-500">
                                                    Data rekapitulasi gaji untuk periode ini belum tersedia atau belum digenerate.
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 pt-4">
                        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 font-medium">
                            <span>
                                Halaman {totalPages > 0 ? table.getState().pagination.pageIndex + 1 : 0} dari {totalPages}
                                {totalRecords > 0 && ` (${totalRecords} pegawai)`}
                            </span>
                            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
                                <span className="text-xs text-slate-400">Baris:</span>
                                <Select
                                    value={pagination.pageSize.toString()}
                                    onValueChange={(val) => setPagination(prev => ({ ...prev, pageSize: parseInt(val), pageIndex: 0 }))}
                                >
                                    <SelectTrigger className="h-8 w-[70px] text-xs bg-white border-slate-200" aria-label="Jumlah baris per halaman">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="10">10</SelectItem>
                                        <SelectItem value="25">25</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                        <SelectItem value="100">100</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => table.previousPage()}
                                disabled={!table.getCanPreviousPage() || loading}
                                className="h-9 px-3 border-slate-200 hover:bg-slate-50 gap-1 text-slate-700"
                                aria-label="Halaman sebelumnya"
                            >
                                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => table.nextPage()}
                                disabled={!table.getCanNextPage() || loading}
                                className="h-9 px-3 border-slate-200 hover:bg-slate-50 gap-1 text-slate-700"
                                aria-label="Halaman selanjutnya"
                            >
                                Next
                                <ChevronRight className="h-4 w-4" aria-hidden="true" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Print Modal */}
            <Dialog open={isPrintModalOpen} onOpenChange={setIsPrintModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-slate-900">
                            <Printer className="w-5 h-5 text-blue-600" aria-hidden="true" />
                            Cetak Rekapitulasi Gaji
                        </DialogTitle>
                        <DialogDescription>
                            Pilih format laporan rekapitulasi gaji yang ingin dicetak.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        {/* Context preview */}
                        <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs space-y-1 text-slate-600">
                            <div className="font-medium text-slate-800">Parameter Cetak Saat Ini:</div>
                            <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-1">
                                <div>Periode: <span className="font-semibold text-slate-900">{month === "all" ? "Semua Bulan" : new Date(0, parseInt(month) - 1).toLocaleString('id-ID', { month: 'long' })} {year}</span></div>
                                <div>Jenis: <span className="font-semibold text-slate-900">{jenis === "all" ? "Gaji & Jasa" : jenis}</span></div>
                                <div className="col-span-2">Departemen: <span className="font-semibold text-slate-900">{departemen === "all" ? "Semua Departemen" : (departemenList.find(d => d.dep_id === departemen)?.nama || departemen)}</span></div>
                            </div>
                        </div>

                        {month === "all" && (
                            <div className="flex items-start gap-2 p-3 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg">
                                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
                                <span>Pencetakan laporan membutuhkan pemilihan <strong>Bulan tertentu</strong>. Silakan ubah filter bulan terlebih dahulu.</span>
                            </div>
                        )}

                        {/* Format options */}
                        <div className="space-y-2">
                            <span className="text-xs font-semibold text-slate-700">Pilih Format Laporan:</span>
                            
                            <div 
                                onClick={() => setPrintGroupByContract(false)}
                                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                    !printGroupByContract 
                                        ? "border-blue-600 bg-blue-50/40 ring-1 ring-blue-600" 
                                        : "border-slate-200 hover:bg-slate-50"
                                }`}
                            >
                                <input 
                                    type="radio" 
                                    id="format-standar"
                                    name="printFormat" 
                                    checked={!printGroupByContract} 
                                    onChange={() => setPrintGroupByContract(false)}
                                    className="mt-1 text-blue-600 focus:ring-blue-500" 
                                />
                                <label htmlFor="format-standar" className="space-y-0.5 cursor-pointer">
                                    <div className="text-sm font-semibold text-slate-900">Format Standar</div>
                                    <div className="text-xs text-slate-500">
                                        Rekapitulasi seluruh pegawai dalam satu tabel terurut NIK.
                                    </div>
                                </label>
                            </div>

                            <div 
                                onClick={() => setPrintGroupByContract(true)}
                                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                    printGroupByContract 
                                        ? "border-blue-600 bg-blue-50/40 ring-1 ring-blue-600" 
                                        : "border-slate-200 hover:bg-slate-50"
                                }`}
                            >
                                <input 
                                    type="radio" 
                                    id="format-kontrak"
                                    name="printFormat" 
                                    checked={printGroupByContract} 
                                    onChange={() => setPrintGroupByContract(true)}
                                    className="mt-1 text-blue-600 focus:ring-blue-500" 
                                />
                                <label htmlFor="format-kontrak" className="space-y-0.5 cursor-pointer">
                                    <div className="text-sm font-semibold text-slate-900">Kelompok Kontrak</div>
                                    <div className="text-xs text-slate-500">
                                        Dikelompokkan berdasarkan masa kontrak (&lt; 2018 dan &ge; 2018).
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => setIsPrintModalOpen(false)}
                            disabled={printing}
                        >
                            Batal
                        </Button>
                        <Button
                            onClick={() => {
                                setIsPrintModalOpen(false);
                                handlePrint(printGroupByContract);
                            }}
                            disabled={printing || month === "all"}
                            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                        >
                            {printing ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Printer className="w-4 h-4" aria-hidden="true" />}
                            Buka Laporan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <PenggajianSettingsModal 
                isOpen={isSettingsModalOpen}
                onClose={() => setIsSettingsModalOpen(false)}
            />
        </div>
    );
}
