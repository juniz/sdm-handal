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
    ChevronLeft, 
    ChevronRight, 
    Loader2, 
    Search, 
    FileText,
    Printer,
    Settings
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
    
    // Filters
    const [search, setSearch] = useState("");
    const [month, setMonth] = useState((new Date().getMonth() + 1).toString());
    const [year, setYear] = useState(new Date().getFullYear().toString());
    const [jenis, setJenis] = useState("all");
    const [departemen, setDepartemen] = useState("all");
    const [departemenList, setDepartemenList] = useState([]);
    const [printing, setPrinting] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

    // Handle Print
    const handlePrint = async (groupByContract = false) => {
        // Validate filters for print - need specific month and year
        if (month === "all") {
            toast.error("Pilih bulan tertentu untuk mencetak");
            return;
        }
        if (!year || year.length !== 4) {
            toast.error("Masukkan tahun yang valid");
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
            header: "Uploaded By",
            cell: ({ row }) => <span className="text-muted-foreground text-xs">{row.getValue("uploaded_by")}</span>,
        },
        {
            accessorKey: "uploaded_at",
            header: "Tanggal Upload",
            cell: ({ row }) => <span className="text-muted-foreground text-xs">{formatDate(row.getValue("uploaded_at"))}</span>,
        },
    ], []);

    // Fetch Data
    const fetchData = async () => {
        setLoading(true);
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
                setData(result.data);
                setTotalPages(result.pagination.totalPages);
            } else {
                toast.error("Gagal mengambil data", { description: result.message });
            }
        } catch (error) {
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
                        onClick={() => handlePrint(false)}
                        disabled={printing || loading}
                        className="gap-2 border-slate-200 hover:bg-slate-50"
                    >
                        {printing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Printer className="h-4 w-4 text-slate-500" />
                        )}
                        Print Standard
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePrint(true)}
                        disabled={printing || loading}
                        className="gap-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                    >
                        {printing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Printer className="h-4 w-4 text-indigo-500" />
                        )}
                        Print per Kelompok Kontrak
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsSettingsModalOpen(true)}
                        className="gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                        <Settings className="h-4 w-4 text-blue-500" />
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
                        {/* Search Bar - Full Width */}
                        <div className="relative w-full">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Cari NIK atau Nama Pegawai..."
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPagination(prev => ({ ...prev, pageIndex: 0 })); }}
                                className="pl-9 pr-4 h-10 border-slate-200 bg-white focus-visible:ring-blue-500 w-full"
                            />
                        </div>

                        {/* Dropdown Filters - 4-Column Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Month Filter */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-500">Bulan</label>
                                <Select value={month} onValueChange={(val) => { setMonth(val); setPagination(prev => ({ ...prev, pageIndex: 0 })); }}>
                                    <SelectTrigger className="w-full bg-white border-slate-200 h-10">
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

                            {/* Year Filter */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-500">Tahun</label>
                                <Input 
                                    type="number" 
                                    placeholder="Tahun" 
                                    value={year} 
                                    onChange={(e) => { setYear(e.target.value); setPagination(prev => ({ ...prev, pageIndex: 0 })); }}
                                    className="w-full bg-white border-slate-200 h-10"
                                />
                            </div>

                            {/* Jenis Filter */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-500">Jenis</label>
                                <Select value={jenis} onValueChange={(val) => { setJenis(val); setPagination(prev => ({ ...prev, pageIndex: 0 })); }}>
                                    <SelectTrigger className="w-full bg-white border-slate-200 h-10">
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
                                <label className="text-xs font-semibold text-slate-500">Departemen</label>
                                <Select value={departemen} onValueChange={(val) => { setDepartemen(val); setPagination(prev => ({ ...prev, pageIndex: 0 })); }}>
                                    <SelectTrigger className="w-full bg-white border-slate-200 h-10">
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
                                                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                                                <span className="text-slate-500 font-medium">Memuat data...</span>
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
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={columns.length} className="h-32 text-center text-slate-400">
                                            Tidak ada data ditemukan.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                        <div className="text-sm text-slate-500 font-medium">
                            Halaman {table.getState().pagination.pageIndex + 1} dari {table.getPageCount()}
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => table.previousPage()}
                                disabled={!table.getCanPreviousPage() || loading}
                                className="h-9 px-3 border-slate-200 hover:bg-slate-50 gap-1 text-slate-700"
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => table.nextPage()}
                                disabled={!table.getCanNextPage() || loading}
                                className="h-9 px-3 border-slate-200 hover:bg-slate-50 gap-1 text-slate-700"
                            >
                                Next
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <PenggajianSettingsModal 
                isOpen={isSettingsModalOpen}
                onClose={() => setIsSettingsModalOpen(false)}
            />
        </div>
    );
}
