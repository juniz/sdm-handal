"use client";

import { useState, useEffect } from "react";
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { 
    Search, 
    Loader2, 
    Banknote,
    ChevronLeft, 
    ChevronRight, 
    Pencil, 
    FilePlus,
    AlertTriangle,
    AlertCircle,
    Upload,
    Download,
    FileSpreadsheet,
    Users,
    CheckCircle2,
    X,
    RotateCcw
} from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    fetchGapokList,
    mutationUpdateGapok,
    mutationImportGapok,
    mutationGenerateGaji,
} from "@/lib/gapok-gql-client";

// Format currency
const formatCurrency = (value) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0
    }).format(value);
};

// Schema validation - gapok must be greater than 0
const formSchema = z.object({
    nik: z.string(),
    nama: z.string(),
    gapok: z.coerce.number().min(1, "Gaji pokok harus lebih dari 0")
});

export default function GajiPokokPage() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [unsetTotal, setUnsetTotal] = useState(0);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [showUnsetOnly, setShowUnsetOnly] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [importFile, setImportFile] = useState(null);
    const [isImporting, setIsImporting] = useState(false);
    const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
    const [importResult, setImportResult] = useState(null);
    
    // Filter state
    const [departments, setDepartments] = useState([]);
    const [selectedDepartment, setSelectedDepartment] = useState("all");

    // Dynamic year list: currentYear + 1 down to currentYear - 5
    const years = [
        new Date().getFullYear() + 1,
        new Date().getFullYear(),
        new Date().getFullYear() - 1,
        new Date().getFullYear() - 2,
        new Date().getFullYear() - 3,
        new Date().getFullYear() - 4,
        new Date().getFullYear() - 5,
    ];

    // Form setup
    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            nik: "",
            nama: "",
            gapok: 0
        }
    });

    const isSubmitting = form.formState.isSubmitting;
    const watchedGapok = form.watch("gapok");

    // Fetch Departments on mount
    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const response = await fetch("/api/departemen");
                const result = await response.json();
                if (result.status === "success") {
                    setDepartments(result.data || []);
                }
            } catch (error) {
                console.error("Failed to fetch departments", error);
            }
        };
        fetchDepartments();
    }, []);

    // Debounce search input only
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 350);

        return () => clearTimeout(timer);
    }, [search]);

    // Fetch on filter / debounced search / pagination changes
    useEffect(() => {
        fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearch, selectedDepartment, showUnsetOnly, page, pageSize]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const result = await fetchGapokList({
                page,
                limit: pageSize,
                search: debouncedSearch,
                depId: selectedDepartment,
                unsetOnly: showUnsetOnly,
            });

            setData(result?.items || []);
            setTotalPages(result?.meta?.totalPages || 1);
            setTotalRecords(result?.meta?.total || 0);
            if (typeof result?.meta?.unset_total === "number") {
                setUnsetTotal(result.meta.unset_total);
            }
        } catch (error) {
            toast.error("Gagal mengambil data", {
                description: error.message || "Tidak dapat menghubungi server"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (employee) => {
        form.reset({
            nik: employee.nik,
            nama: employee.nama,
            gapok: employee.gapok || 0
        });
        setIsDialogOpen(true);
    };

    const onSubmit = async (values) => {
        try {
            await mutationUpdateGapok({
                nik: values.nik,
                gapok: values.gapok,
            });

            toast.success("Berhasil Update", {
                description: `Gaji pokok untuk ${values.nama} berhasil diperbarui.`
            });
            
            // Update local data & re-fetch to sync unset count
            setData(prev => prev.map(item => 
                item.nik === values.nik ? { ...item, gapok: parseFloat(values.gapok) } : item
            ));
            setIsDialogOpen(false);
            fetchData();
        } catch (error) {
            toast.error("Gagal Update", {
                description: error.message || "Gagal menyimpan data ke server."
            });
        }
    };

    const handleDownloadTemplate = async () => {
        setIsDownloadingTemplate(true);
        try {
            const XLSX = await import("xlsx");
            const result = await fetchGapokList({ page: 1, limit: 10000, depId: "all" });
            const list = (result?.items || []).slice().sort((a, b) => {
                const deptA = a.nama_departemen || a.departemen || "TANPA DEPARTEMEN";
                const deptB = b.nama_departemen || b.departemen || "TANPA DEPARTEMEN";
                const deptCmp = deptA.localeCompare(deptB);
                return deptCmp !== 0 ? deptCmp : a.nama.localeCompare(b.nama);
            });

            const rows = [["NIK", "Nama Pegawai", "Departemen", "Jabatan", "Gaji Pokok"]];
            let currentDept = null;
            for (const p of list) {
                const deptName = p.nama_departemen || p.departemen || "TANPA DEPARTEMEN";
                if (deptName !== currentDept) {
                    currentDept = deptName;
                    rows.push([`>> DEPARTEMEN: ${currentDept}`, "", "", "", ""]);
                }
                rows.push([p.nik, p.nama, deptName, p.jbtn || "-", Number(p.gapok) || 0]);
            }

            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.aoa_to_sheet(rows);
            worksheet["!cols"] = [
                { wch: 20 },
                { wch: 32 },
                { wch: 25 },
                { wch: 25 },
                { wch: 18 },
            ];
            XLSX.utils.book_append_sheet(workbook, worksheet, "Template Gaji Pokok");
            XLSX.writeFile(workbook, "Template_Gaji_Pokok_Pegawai.xlsx");
            toast.success("Template berhasil diunduh");
        } catch (error) {
            toast.error(error.message || "Gagal unduh template");
        } finally {
            setIsDownloadingTemplate(false);
        }
    };

    const handleImportSubmit = async (e) => {
        e.preventDefault();
        if (!importFile) {
            toast.error("Pilih file Excel terlebih dahulu");
            return;
        }

        setIsImporting(true);
        setImportResult(null);
        try {
            const XLSX = await import("xlsx");
            const buffer = await importFile.arrayBuffer();
            const workbook = XLSX.read(buffer, { type: "array" });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            if (!rows || rows.length <= 1) {
                toast.error("File Excel kosong atau tidak memiliki data");
                setIsImporting(false);
                return;
            }

            const items = [];
            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                if (!row || row.length === 0) continue;

                const col0 = row[0]?.toString().trim() || "";
                if (col0.toLowerCase() === "nik" || col0.startsWith(">>")) continue;

                const nik = col0;
                let rawGapok = row[4] !== undefined && row[4] !== "" ? row[4] : row[row.length - 1];
                if (typeof rawGapok === "string") {
                    rawGapok = rawGapok.replace(/[^0-9.-]+/g, "");
                }
                const gapok = parseFloat(rawGapok);

                if (nik && !isNaN(gapok)) {
                    items.push({ nik, gapok });
                }
            }

            if (items.length === 0) {
                toast.error("Tidak ada data valid yang ditemukan untuk diimpor");
                setIsImporting(false);
                return;
            }

            const result = await mutationImportGapok(items);
            setImportResult(result);
            toast.success(`Import selesai: ${result.success_count} berhasil, ${result.error_count} gagal/dilewati.`);
            setImportFile(null);
            fetchData();
        } catch (error) {
            toast.error(error.message || "Terjadi kesalahan saat memproses file");
        } finally {
            setIsImporting(false);
        }
    };

    const [isGenerateOpen, setIsGenerateOpen] = useState(false);
    const [generateStep, setGenerateStep] = useState("select"); // "select" | "confirm"
    const [generateMonth, setGenerateMonth] = useState(new Date().getMonth() + 1);
    const [generateYear, setGenerateYear] = useState(new Date().getFullYear());
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            await mutationGenerateGaji({
                periodeBulan: generateMonth,
                periodeTahun: generateYear
            });
            toast.success("Berhasil Generate", {
                description: "Gaji pokok berhasil disalin ke tabel penggajian."
            });
            setIsGenerateOpen(false);
            setGenerateStep("select");
        } catch (error) {
            toast.error("Gagal Generate", {
                description: error.message || "Gagal menghubungi server"
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const hasActiveFilters = Boolean(search || selectedDepartment !== "all" || showUnsetOnly);
    const configuredCount = showUnsetOnly ? 0 : Math.max(0, totalRecords - unsetTotal);

    const handleResetFilters = () => {
        setSearch("");
        setSelectedDepartment("all");
        setShowUnsetOnly(false);
        setPage(1);
    };

    return (
        <div className="container mx-auto p-4 md:p-6 space-y-6">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl md:text-3xl font-figtree font-bold flex items-center gap-2.5 tracking-tight text-slate-900">
                        <span className="p-2 rounded-lg bg-sky-50 border border-sky-100 text-sky-600">
                            <Banknote className="w-6 h-6" aria-hidden="true" />
                        </span>
                        Manajemen Gaji Pokok
                    </h1>
                    <p className="text-sm text-slate-500">
                        Kelola besaran gaji pokok pegawai aktif sebelum generate payroll bulanan
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
                    <Button 
                        variant="outline"
                        onClick={() => { setImportResult(null); setImportFile(null); setIsImportOpen(true); }}
                        className="gap-2 border-slate-200 text-slate-700 hover:bg-slate-50 bg-white shadow-xs h-10 font-medium"
                    >
                        <Upload className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                        Import Excel
                    </Button>
                    <Button 
                        onClick={() => { setGenerateStep("select"); setIsGenerateOpen(true); }} 
                        className="gap-2 bg-sky-600 hover:bg-sky-700 text-white shadow-xs h-10 font-medium"
                    >
                        <FilePlus className="w-4 h-4" aria-hidden="true" />
                        Generate Gaji
                    </Button>
                </div>
            </div>

            {/* KPI Summary Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                {/* Total Pegawai Card */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs flex items-center justify-between">
                    <div className="space-y-1">
                        <span className="text-xs font-medium text-slate-500 block uppercase tracking-wider">
                            Total Pegawai Aktif
                        </span>
                        <div className="text-2xl font-bold font-figtree text-slate-900 tabular-nums">
                            {totalRecords}
                        </div>
                        <span className="text-[11px] text-slate-500 block">
                            {selectedDepartment !== "all" || debouncedSearch ? "Sesuai filter aktif" : "Terdaftar di sistem"}
                        </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-sky-50 border border-sky-100 text-sky-600 shrink-0">
                        <Users className="w-5 h-5" aria-hidden="true" />
                    </div>
                </div>

                {/* Gaji Pokok Terisi */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs flex items-center justify-between">
                    <div className="space-y-1">
                        <span className="text-xs font-medium text-slate-500 block uppercase tracking-wider">
                            Gaji Pokok Terisi
                        </span>
                        <div className="text-2xl font-bold font-figtree text-emerald-700 tabular-nums">
                            {configuredCount}
                        </div>
                        <span className="text-[11px] text-emerald-600 block">
                            Siap generate payroll
                        </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 shrink-0">
                        <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                    </div>
                </div>

                {/* Belum Diatur / Audit Toggle Card */}
                <button
                    type="button"
                    onClick={() => { setShowUnsetOnly(prev => !prev); setPage(1); }}
                    className={`p-4 rounded-xl border text-left transition-all shadow-xs flex items-center justify-between cursor-pointer ${
                        showUnsetOnly 
                            ? "border-amber-400 bg-amber-50/70 ring-2 ring-amber-400/40" 
                            : "border-slate-200 bg-white hover:border-amber-300 hover:bg-amber-50/30"
                    }`}
                    aria-label="Filter pegawai dengan gaji pokok belum diatur"
                    aria-pressed={showUnsetOnly}
                >
                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium text-slate-500 block uppercase tracking-wider">
                                Belum Diatur
                            </span>
                            {showUnsetOnly && (
                                <span className="text-[10px] px-1.5 py-0.2 bg-amber-600 text-white rounded-full font-semibold">
                                    Aktif
                                </span>
                            )}
                        </div>
                        <div className={`text-2xl font-bold font-figtree tabular-nums ${unsetTotal > 0 ? "text-amber-700" : "text-slate-900"}`}>
                            {unsetTotal}
                        </div>
                        <span className="text-[11px] text-amber-700 block">
                            {showUnsetOnly ? "Klik untuk tampilkan semua" : "Klik untuk audit data"}
                        </span>
                    </div>
                    <div className={`p-2.5 rounded-lg shrink-0 border ${
                        showUnsetOnly 
                            ? "bg-amber-600 text-white border-amber-600" 
                            : "bg-amber-50 border-amber-100 text-amber-600"
                    }`}>
                        <AlertCircle className="w-5 h-5" aria-hidden="true" />
                    </div>
                </button>
            </div>

            {/* Main Table Card */}
            <Card className="border-slate-200 shadow-xs">
                <CardHeader className="space-y-3 pb-4">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                        <div>
                            <CardTitle className="text-lg font-figtree font-semibold text-slate-900">Daftar Pegawai</CardTitle>
                            <CardDescription className="text-slate-500 text-xs">
                                Perbarui besaran gaji pokok masing-masing pegawai secara individual atau gunakan import Excel
                            </CardDescription>
                        </div>
                    </div>

                    {/* Symmetrical Filter Toolbar */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1">
                        {/* Left Controls: Search & Department */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto">
                            <div className="relative w-full sm:w-72">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" aria-hidden="true" />
                                <Input
                                    placeholder="Cari nama atau NIK..."
                                    value={search}
                                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                    className="pl-9 pr-8 h-10 bg-white border-slate-200 text-sm focus-visible:ring-sky-500"
                                    aria-label="Cari nama atau NIK"
                                />
                                {search && (
                                    <button
                                        type="button"
                                        onClick={() => { setSearch(""); setPage(1); }}
                                        className="absolute right-2.5 top-3 text-slate-400 hover:text-slate-600 p-0.5"
                                        aria-label="Hapus kata kunci pencarian"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>

                            <div className="w-full sm:w-64">
                                <Select 
                                    value={selectedDepartment} 
                                    onValueChange={(val) => { setSelectedDepartment(val); setPage(1); }}
                                >
                                    <SelectTrigger aria-label="Filter departemen" className="bg-white border-slate-200 h-10 text-sm">
                                        <SelectValue placeholder="Semua Departemen" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua Departemen</SelectItem>
                                        {departments.map((dept) => (
                                            <SelectItem key={dept.dep_id} value={dept.dep_id}>
                                                {dept.nama}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Right Controls: Quick Toggle & Reset */}
                        <div className="flex items-center gap-2 self-start lg:self-auto">
                            <Button
                                type="button"
                                variant={showUnsetOnly ? "default" : "outline"}
                                aria-pressed={showUnsetOnly}
                                onClick={() => { setShowUnsetOnly(prev => !prev); setPage(1); }}
                                className={`h-10 text-xs font-medium gap-1.5 ${
                                    showUnsetOnly 
                                        ? "bg-amber-600 hover:bg-amber-700 text-white border-amber-600 shadow-xs" 
                                        : "border-slate-200 text-slate-700 hover:bg-slate-50 bg-white"
                                }`}
                            >
                                <AlertCircle className={`w-4 h-4 ${showUnsetOnly ? "text-white" : "text-amber-500"}`} aria-hidden="true" />
                                <span>Hanya Belum Diatur</span>
                                {unsetTotal > 0 && (
                                    <span className={`px-1.5 py-0.5 rounded-full text-[11px] font-semibold tabular-nums ${
                                        showUnsetOnly ? "bg-amber-800 text-white" : "bg-amber-100 text-amber-800"
                                    }`}>
                                        {unsetTotal}
                                    </span>
                                )}
                                {showUnsetOnly && <X className="w-3 h-3 ml-0.5" aria-hidden="true" />}
                            </Button>

                            {hasActiveFilters && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleResetFilters}
                                    className="h-10 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 gap-1.5 px-2.5"
                                    aria-label="Reset semua filter"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                                    Reset
                                </Button>
                            )}
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0 sm:p-6 sm:pt-0">
                    {/* Desktop Table View */}
                    <div className="hidden md:block rounded-lg border border-slate-200 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-wider w-[140px]">NIK</TableHead>
                                    <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-wider">Nama Pegawai</TableHead>
                                    <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-wider">Departemen</TableHead>
                                    <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-wider">Jabatan</TableHead>
                                    <TableHead className="w-[170px] text-right font-semibold text-slate-700 text-xs uppercase tracking-wider">Gaji Pokok</TableHead>
                                    <TableHead className="w-[90px] text-center">
                                        <span className="sr-only">Aksi</span>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-32 text-center">
                                            <div className="flex justify-center items-center gap-2">
                                                <Loader2 className="h-5 w-5 animate-spin text-sky-600" aria-hidden="true" />
                                                <span className="text-slate-500 font-medium text-sm">Memuat data pegawai...</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                                            <div className="flex flex-col items-center justify-center gap-1.5">
                                                <AlertCircle className="w-6 h-6 text-slate-400" aria-hidden="true" />
                                                <span className="font-medium text-sm">
                                                    {showUnsetOnly 
                                                        ? "Seluruh pegawai sudah memiliki nilai gaji pokok"
                                                        : "Tidak ada data pegawai yang sesuai"}
                                                </span>
                                                {hasActiveFilters && (
                                                    <Button
                                                        variant="link"
                                                        size="sm"
                                                        onClick={handleResetFilters}
                                                        className="text-xs text-sky-600 h-auto p-0"
                                                    >
                                                        Reset filter pencarian
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    data.map((pegawai) => {
                                        const isUnset = pegawai.gapok === null || pegawai.gapok === undefined || Number(pegawai.gapok) === 0;
                                        return (
                                            <TableRow key={pegawai.id || pegawai.nik} className="hover:bg-sky-50/40 transition-colors">
                                                <TableCell className="font-mono text-xs text-slate-700 font-medium">{pegawai.nik}</TableCell>
                                                <TableCell className="font-medium text-slate-900">{pegawai.nama}</TableCell>
                                                <TableCell className="text-slate-600 text-sm">{pegawai.nama_departemen || pegawai.departemen || "-"}</TableCell>
                                                <TableCell className="text-slate-600 text-sm">{pegawai.jbtn || "-"}</TableCell>
                                                <TableCell className="text-right tabular-nums">
                                                    {isUnset ? (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                                                            Belum diatur
                                                        </span>
                                                    ) : (
                                                        <span className="font-semibold text-slate-900 text-sm">
                                                            {formatCurrency(pegawai.gapok)}
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Button 
                                                        size="sm" 
                                                        variant="outline" 
                                                        onClick={() => handleEditClick(pegawai)}
                                                        className="h-8 px-2.5 text-xs font-medium text-sky-700 border-sky-200 hover:bg-sky-50 hover:text-sky-800 gap-1.5"
                                                        aria-label={`Edit gaji pokok ${pegawai.nama}`}
                                                    >
                                                        <Pencil className="h-3.5 w-3.5 text-sky-600" aria-hidden="true" />
                                                        Edit
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile Card View (< md) */}
                    <div className="md:hidden border-t sm:border border-slate-200 sm:rounded-lg overflow-hidden divide-y divide-slate-100 bg-white">
                        {loading ? (
                            <div className="p-8 text-center flex justify-center items-center gap-2">
                                <Loader2 className="h-5 w-5 animate-spin text-sky-600" aria-hidden="true" />
                                <span className="text-slate-500 font-medium text-sm">Memuat data pegawai...</span>
                            </div>
                        ) : data.length === 0 ? (
                            <div className="p-8 text-center text-slate-500 space-y-1">
                                <AlertCircle className="w-6 h-6 text-slate-400 mx-auto" aria-hidden="true" />
                                <p className="font-medium text-sm">
                                    {showUnsetOnly ? "Seluruh pegawai sudah diatur" : "Tidak ada data pegawai"}
                                </p>
                            </div>
                        ) : (
                            data.map((pegawai) => {
                                const isUnset = pegawai.gapok === null || pegawai.gapok === undefined || Number(pegawai.gapok) === 0;
                                return (
                                    <div key={pegawai.id || pegawai.nik} className="p-4 space-y-2.5">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="space-y-0.5 min-w-0">
                                                <p className="font-semibold text-slate-900 text-sm truncate">{pegawai.nama}</p>
                                                <p className="text-xs text-slate-500 font-mono">{pegawai.nik}</p>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleEditClick(pegawai)}
                                                className="h-8 px-2.5 text-xs font-medium text-sky-700 border-sky-200 hover:bg-sky-50 shrink-0 gap-1"
                                                aria-label={`Edit gaji pokok ${pegawai.nama}`}
                                            >
                                                <Pencil className="h-3.5 w-3.5 text-sky-600" aria-hidden="true" />
                                                Edit
                                            </Button>
                                        </div>

                                        <div className="text-xs text-slate-600 flex flex-wrap items-center gap-1.5">
                                            <span className="font-medium text-slate-700">{pegawai.nama_departemen || pegawai.departemen || "-"}</span>
                                            <span className="text-slate-300">•</span>
                                            <span>{pegawai.jbtn || "-"}</span>
                                        </div>

                                        <div className="flex items-center justify-between pt-1.5 border-t border-slate-100">
                                            <span className="text-xs text-slate-500 font-medium">Gaji Pokok:</span>
                                            {isUnset ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                                                    Belum diatur
                                                </span>
                                            ) : (
                                                <span className="font-semibold text-slate-900 text-sm tabular-nums">
                                                    {formatCurrency(pegawai.gapok)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Pagination Footer */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 sm:px-0 sm:py-4">
                        <div className="flex items-center gap-3 text-sm text-slate-600">
                            <span>
                                Halaman <strong className="font-semibold text-slate-900">{totalPages > 0 ? page : 0}</strong> dari <strong className="font-semibold text-slate-900">{totalPages}</strong> ({totalRecords} pegawai)
                            </span>
                            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
                                <span className="text-xs text-slate-500">Baris:</span>
                                <Select
                                    value={pageSize.toString()}
                                    onValueChange={(val) => { setPageSize(parseInt(val)); setPage(1); }}
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
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1 || loading}
                                className="gap-1 border-slate-200 text-slate-700 h-8 text-xs font-medium"
                                aria-label="Halaman sebelumnya"
                            >
                                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages || loading}
                                className="gap-1 border-slate-200 text-slate-700 h-8 text-xs font-medium"
                                aria-label="Halaman selanjutnya"
                            >
                                Next
                                <ChevronRight className="h-4 w-4" aria-hidden="true" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Generate Dialog */}
            <Dialog open={isGenerateOpen} onOpenChange={(open) => { setIsGenerateOpen(open); if (!open) setGenerateStep("select"); }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-slate-900 font-figtree">
                            <FilePlus className="w-5 h-5 text-sky-600" aria-hidden="true" />
                            {generateStep === "select" ? "Generate Gaji Periode" : "Konfirmasi Generate Gaji"}
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 text-xs">
                            {generateStep === "select" 
                                ? "Salin data gaji pokok ke tabel gaji pegawai. Berlaku untuk seluruh pegawai aktif (bukan hanya filter saat ini)."
                                : "Periksa kembali sebelum melanjutkan proses generate."}
                        </DialogDescription>
                    </DialogHeader>

                    {generateStep === "select" ? (
                        <div className="grid gap-4 py-3">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label htmlFor="gen-month" className="text-xs font-semibold text-slate-700">Bulan</label>
                                    <Select 
                                        value={generateMonth.toString()} 
                                        onValueChange={(val) => setGenerateMonth(parseInt(val))}
                                    >
                                        <SelectTrigger id="gen-month" className="h-10 border-slate-200 bg-white">
                                            <SelectValue placeholder="Bulan" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                                                <SelectItem key={m} value={m.toString()}>
                                                    {new Date(0, m - 1).toLocaleString('id-ID', { month: 'long' })}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <label htmlFor="gen-year" className="text-xs font-semibold text-slate-700">Tahun</label>
                                    <Select
                                        value={generateYear.toString()}
                                        onValueChange={(val) => setGenerateYear(parseInt(val))}
                                    >
                                        <SelectTrigger id="gen-year" className="h-10 border-slate-200 bg-white">
                                            <SelectValue placeholder="Tahun" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {years.map((y) => (
                                                <SelectItem key={y} value={y.toString()}>
                                                    {y}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="py-2 space-y-3">
                            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3.5 space-y-2 text-xs text-amber-900">
                                <div className="flex items-start gap-2">
                                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
                                    <div className="space-y-1">
                                        <span className="font-semibold block text-amber-950">Peringatan Timpa Data</span>
                                        <p className="text-amber-800 leading-relaxed">
                                            Generate gaji periode <strong>{new Date(0, generateMonth - 1).toLocaleString('id-ID', { month: 'long' })} {generateYear}</strong> akan menyalin gaji pokok ke data rekapitulasi. Jika data untuk periode ini sudah pernah digenerate, nilai gaji <strong>akan ditimpa</strong>.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {unsetTotal > 0 && (
                                <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-900 flex items-start gap-2">
                                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
                                    <div className="space-y-0.5">
                                        <span className="font-semibold block text-red-950">Audit Gaji Pokok</span>
                                        <span className="text-red-800">
                                            Terdapat <strong>{unsetTotal} pegawai aktif</strong> yang belum memiliki gaji pokok. Gaji mereka akan bernilai Rp 0 pada periode ini.
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter className="gap-2 sm:gap-3">
                        {generateStep === "select" ? (
                            <>
                                <Button 
                                    variant="outline" 
                                    onClick={() => setIsGenerateOpen(false)} 
                                    disabled={isGenerating}
                                    className="border-slate-200"
                                >
                                    Batal
                                </Button>
                                <Button 
                                    onClick={() => setGenerateStep("confirm")} 
                                    className="bg-sky-600 hover:bg-sky-700 text-white"
                                >
                                    Lanjutkan
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button 
                                    variant="outline" 
                                    onClick={() => setGenerateStep("select")} 
                                    disabled={isGenerating}
                                    className="border-slate-200"
                                >
                                    Kembali
                                </Button>
                                <Button 
                                    onClick={handleGenerate} 
                                    disabled={isGenerating}
                                    className="bg-amber-600 hover:bg-amber-700 text-white gap-2"
                                >
                                    {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <FilePlus className="w-4 h-4" aria-hidden="true" />}
                                    Ya, Generate Sekarang
                                </Button>
                            </>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-slate-900 font-figtree flex items-center gap-2">
                            <Pencil className="w-4 h-4 text-sky-600" aria-hidden="true" />
                            Update Gaji Pokok
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 text-xs">
                            Perbarui nilai besaran gaji pokok untuk pegawai di bawah ini.
                        </DialogDescription>
                    </DialogHeader>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-1">
                            {/* Employee summary card */}
                            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Pegawai</span>
                                <div className="text-sm font-semibold text-slate-900">{form.getValues("nama")}</div>
                                <div className="text-xs font-mono text-slate-500">NIK: {form.getValues("nik")}</div>
                            </div>
                            
                            <FormField
                                control={form.control}
                                name="gapok"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-700 text-xs font-semibold">Nominal Gaji Pokok (Rp)</FormLabel>
                                        <FormControl>
                                            <Input 
                                                type="number" 
                                                placeholder="0" 
                                                className="border-slate-200 bg-white h-10 text-sm focus-visible:ring-sky-500"
                                                {...field} 
                                            />
                                        </FormControl>
                                        {watchedGapok > 0 && (
                                            <div className="text-xs font-semibold text-sky-800 bg-sky-50 border border-sky-200 px-2.5 py-1 rounded inline-block tabular-nums">
                                                Preview: {formatCurrency(watchedGapok)}
                                            </div>
                                        )}
                                        <FormDescription className="text-[11px] text-slate-500">
                                            Ketik angka tanpa tanda titik atau koma pemisah.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <DialogFooter className="gap-2 sm:gap-3 pt-2">
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={() => setIsDialogOpen(false)}
                                    disabled={isSubmitting}
                                    className="border-slate-200"
                                >
                                    Batal
                                </Button>
                                <Button 
                                    type="submit" 
                                    disabled={isSubmitting}
                                    className="bg-sky-600 hover:bg-sky-700 text-white"
                                >
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Simpan Perubahan
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Import Dialog */}
            <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-slate-900 font-figtree">
                            <FileSpreadsheet className="w-5 h-5 text-emerald-600" aria-hidden="true" />
                            Import Gaji Pokok dari Excel
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 text-xs">
                            Unduh template pegawai terkelompok per departemen, lengkapi nilai gaji pokok, lalu unggah kembali file Excel.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        {/* Download Template Banner */}
                        <div className="flex items-center justify-between p-3 rounded-lg border border-emerald-100 bg-emerald-50/60">
                            <div className="space-y-0.5">
                                <span className="text-xs font-semibold text-emerald-950 block">Template Excel Pegawai</span>
                                <span className="text-[11px] text-emerald-700 block">Dikelompokkan rapi per departemen</span>
                            </div>
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={handleDownloadTemplate}
                                disabled={isDownloadingTemplate}
                                className="h-8 text-xs gap-1.5 border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-700 font-medium"
                            >
                                {isDownloadingTemplate ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                                Unduh Template
                            </Button>
                        </div>

                        {/* Form Upload */}
                        <form onSubmit={handleImportSubmit} className="space-y-4">
                            <div className="space-y-1.5">
                                <label htmlFor="import-excel-file" className="text-xs font-semibold text-slate-700 block">
                                    Pilih File Excel (.xlsx / .xls)
                                </label>
                                <Input
                                    id="import-excel-file"
                                    key={importFile ? "file-selected" : "file-empty"}
                                    type="file"
                                    accept=".xlsx,.xls"
                                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                                    className="text-xs h-10 border-slate-200 bg-white file:text-xs file:font-semibold file:text-slate-700 cursor-pointer"
                                    disabled={isImporting}
                                />
                                <p className="text-[11px] text-slate-500">Pastikan kolom NIK dan Gaji Pokok sesuai dengan template.</p>
                            </div>

                            {importResult && (
                                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-2 text-xs">
                                    <div className="flex items-center justify-between font-semibold">
                                        <span className="text-emerald-700">Berhasil: {importResult.success_count}</span>
                                        <span className={importResult.error_count > 0 ? "text-red-600" : "text-slate-500"}>
                                            Gagal/Lewat: {importResult.error_count}
                                        </span>
                                    </div>
                                    {importResult.errors && importResult.errors.length > 0 && (
                                        <div className="max-h-28 overflow-y-auto space-y-1 text-[11px] text-red-600 border-t border-slate-200 pt-1.5">
                                            {importResult.errors.map((err, idx) => (
                                                <div key={idx}>
                                                    {typeof err === "string" ? err : `Baris ${err.row}: ${err.message}`}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            <DialogFooter className="gap-2 sm:gap-3 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsImportOpen(false)}
                                    disabled={isImporting}
                                    className="border-slate-200"
                                >
                                    Tutup
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isImporting || !importFile}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-medium"
                                >
                                    {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                    Unggah & Simpan
                                </Button>
                            </DialogFooter>
                        </form>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
