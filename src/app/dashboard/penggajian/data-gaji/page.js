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
    FileText 
} from "lucide-react";
import { toast } from "sonner";

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
                    row.getValue("jenis") === 'Gaji' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
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
                jenis: jenis
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

    // Debounce search and effect
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData();
        }, 500);
        return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pagination.pageIndex, pagination.pageSize, search, month, year, jenis]);

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
            <div className="flex flex-col space-y-2">
                <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                    <FileText className="w-8 h-8 text-blue-600" />
                    Data Gaji Pegawai
                </h1>
                <p className="text-gray-500">
                    Rekapitulasi data gaji yang telah digenerate per periode.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
                        <CardTitle>Daftar Gaji</CardTitle>
                        <div className="flex flex-col sm:flex-row gap-4">
                            {/* Month Filter */}
                            <Select value={month} onValueChange={(val) => { setMonth(val); setPagination(prev => ({ ...prev, pageIndex: 0 })); }}>
                                <SelectTrigger className="w-[180px]">
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

                            {/* Year Filter */}
                            <Input 
                                type="number" 
                                placeholder="Tahun" 
                                value={year} 
                                onChange={(e) => { setYear(e.target.value); setPagination(prev => ({ ...prev, pageIndex: 0 })); }}
                                className="w-[100px]"
                            />

                            {/* Jenis Filter */}
                            <Select value={jenis} onValueChange={(val) => { setJenis(val); setPagination(prev => ({ ...prev, pageIndex: 0 })); }}>
                                <SelectTrigger className="w-[120px]">
                                    <SelectValue placeholder="Jenis" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua</SelectItem>
                                    <SelectItem value="Gaji">Gaji</SelectItem>
                                    <SelectItem value="Jasa">Jasa</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Search */}
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Cari NIK atau Nama..."
                                    value={search}
                                    onChange={(e) => { setSearch(e.target.value); setPagination(prev => ({ ...prev, pageIndex: 0 })); }}
                                    className="pl-8"
                                />
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => {
                                            return (
                                                <TableHead key={header.id}>
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
                                        <TableCell colSpan={columns.length} className="h-24 text-center">
                                            <div className="flex justify-center items-center gap-2">
                                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                                <span>Memuat data...</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : table.getRowModel().rows?.length ? (
                                    table.getRowModel().rows.map((row) => (
                                        <TableRow
                                            key={row.id}
                                            data-state={row.getIsSelected() && "selected"}
                                        >
                                            {row.getVisibleCells().map((cell) => (
                                                <TableCell key={cell.id}>
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
                                        <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                                            Tidak ada data ditemukan.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-end space-x-2 py-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage() || loading}
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                        </Button>
                        <div className="text-sm font-medium">
                            Halaman {table.getState().pagination.pageIndex + 1} dari {table.getPageCount()}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage() || loading}
                        >
                            Next
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
