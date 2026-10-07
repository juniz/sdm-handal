"use client";

import { useState, useEffect, useCallback } from "react";
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
    AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

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
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [unsetTotal, setUnsetTotal] = useState(0);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [showUnsetOnly, setShowUnsetOnly] = useState(false);
    
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
                    setDepartments(result.data);
                }
            } catch (error) {
                console.error("Failed to fetch departments", error);
            }
        };
        fetchDepartments();
    }, []);

    // Debounce search and filters
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData();
        }, 500);

        return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, selectedDepartment, showUnsetOnly, page, pageSize]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: pageSize.toString(),
                search: search
            });

            if (selectedDepartment && selectedDepartment !== "all") {
                params.append("dep_id", selectedDepartment);
            }

            if (showUnsetOnly) {
                params.append("unset_only", "true");
            }

            const response = await fetch(`/api/pegawai/gapok?${params}`);
            const result = await response.json();

            if (result.status === "success") {
                setData(result.data || []);
                setTotalPages(result.pagination?.totalPages || 1);
                setTotalRecords(result.pagination?.total || 0);
                if (typeof result.meta?.unset_total === "number") {
                    setUnsetTotal(result.meta.unset_total);
                }
            } else {
                toast.error("Gagal mengambil data", {
                    description: result.message
                });
            }
        } catch (error) {
            toast.error("Terjadi kesalahan", {
                description: "Tidak dapat menghubungi server"
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
            const response = await fetch("/api/pegawai/gapok", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nik: values.nik,
                    gapok: parseFloat(values.gapok)
                })
            });

            const result = await response.json();

            if (result.status === "success") {
                toast.success("Berhasil Update", {
                    description: `Gaji pokok untuk ${values.nama} berhasil diperbarui.`
                });
                
                // Update local data
                setData(prev => prev.map(item => 
                    item.nik === values.nik ? { ...item, gapok: parseFloat(values.gapok) } : item
                ));
                setIsDialogOpen(false);
            } else {
                toast.error("Gagal Update", {
                    description: result.message
                });
            }
        } catch (error) {
            toast.error("Terjadi kesalahan", {
                description: "Gagal menyimpan data ke server."
            });
        }
    };

    const [isGenerateOpen, setIsGenerateOpen] = useState(false);
    const [generateStep, setGenerateStep] = useState("select"); // "select" | "confirm"
    const [generateMonth, setGenerateMonth] = useState(new Date().getMonth() + 1);
    const [generateYear, setGenerateYear] = useState(new Date().getFullYear());
    const [isGenerating, setIsGenerating] = useState(false);

    const displayedData = showUnsetOnly 
        ? data.filter(item => item.gapok === null || item.gapok === undefined || item.gapok === 0)
        : data;

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const response = await fetch("/api/gaji/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    periode_bulan: generateMonth,
                    periode_tahun: generateYear
                })
            });
            const result = await response.json();
            if (result.status === "success") {
                toast.success("Berhasil Generate", {
                    description: result.message
                });
                setIsGenerateOpen(false);
                setGenerateStep("select");
            } else {
                toast.error("Gagal Generate", {
                    description: result.message
                });
            }
        } catch (error) {
            toast.error("Terjadi Kesalahan", {
                description: "Gagal menghubungi server"
            });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="container mx-auto p-4 md:p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2 tracking-tight text-slate-900">
                        <Banknote className="w-8 h-8 text-blue-600" aria-hidden="true" />
                        Manajemen Gaji Pokok
                    </h1>
                    <p className="text-sm text-slate-500">
                        Atur besaran gaji pokok untuk setiap pegawai aktif
                    </p>
                </div>
                <Button 
                    onClick={() => { setGenerateStep("select"); setIsGenerateOpen(true); }} 
                    className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-xs self-start md:self-auto"
                >
                    <FilePlus className="w-4 h-4" aria-hidden="true" />
                    Generate Gaji
                </Button>
            </div>

            <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                        <div>
                            <CardTitle className="text-lg font-semibold text-slate-900">Daftar Pegawai</CardTitle>
                            <CardDescription className="text-slate-500">
                                Gunakan tombol edit untuk mengubah gaji pokok
                            </CardDescription>
                        </div>
                    </div>
                    <div className="mt-4 flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full">
                        <div className="w-full md:w-64">
                            <Select 
                                value={selectedDepartment} 
                                onValueChange={(val) => { setSelectedDepartment(val); setPage(1); }}
                            >
                                <SelectTrigger className="bg-white border-slate-200 h-10">
                                    <SelectValue placeholder="Pilih Departemen" />
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
                        <div className="relative w-full md:w-72">
                            <Search className="absolute left-2.5 top-3 h-4 w-4 text-slate-400" aria-hidden="true" />
                            <Input
                                placeholder="Cari nama atau NIK..."
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                className="pl-8 h-10 bg-white border-slate-200"
                                aria-label="Cari nama atau NIK"
                            />
                        </div>
                        <Button
                            type="button"
                            variant={showUnsetOnly ? "default" : "outline"}
                            onClick={() => { setShowUnsetOnly(prev => !prev); setPage(1); }}
                            className={`h-10 text-xs gap-1.5 ${
                                showUnsetOnly 
                                    ? "bg-amber-600 hover:bg-amber-700 text-white border-amber-600" 
                                    : "border-slate-200 text-slate-700 hover:bg-slate-50 bg-white"
                            }`}
                        >
                            <AlertCircle className={`w-4 h-4 ${showUnsetOnly ? "text-white" : "text-amber-500"}`} aria-hidden="true" />
                            <span>Hanya Belum Diatur</span>
                            {unsetTotal > 0 && (
                                <span className={`px-1.5 py-0.2 rounded-full text-xs font-semibold ${showUnsetOnly ? "bg-amber-800 text-white" : "bg-amber-100 text-amber-800"}`}>
                                    {unsetTotal}
                                </span>
                            )}
                            {showUnsetOnly && <span className="ml-0.5 text-xs">✕</span>}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border border-slate-200 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead className="font-semibold text-slate-700">NIK</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Nama</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Departemen</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Jabatan</TableHead>
                                    <TableHead className="w-[160px] text-right font-semibold text-slate-700">Gaji Pokok</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            <div className="flex justify-center items-center gap-2">
                                                <Loader2 className="h-6 w-6 animate-spin text-blue-600" aria-hidden="true" />
                                                <span className="text-slate-500 font-medium">Memuat data...</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center text-slate-400">
                                            {showUnsetOnly 
                                                ? "Tidak ada pegawai dengan status gaji pokok belum diatur"
                                                : "Tidak ada data pegawai ditemukan"}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    data.map((pegawai) => (
                                        <TableRow key={pegawai.id || pegawai.nik} className="hover:bg-blue-50/20">
                                            <TableCell className="font-mono text-xs text-slate-700">{pegawai.nik}</TableCell>
                                            <TableCell className="font-medium text-slate-900">{pegawai.nama}</TableCell>
                                            <TableCell className="text-slate-600">{pegawai.nama_departemen || pegawai.departemen || "-"}</TableCell>
                                            <TableCell className="text-slate-600">{pegawai.jbtn || "-"}</TableCell>
                                            <TableCell className="text-right font-medium">
                                                {pegawai.gapok === null || pegawai.gapok === undefined ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                                                        Belum diatur
                                                    </span>
                                                ) : pegawai.gapok === 0 ? (
                                                    <span className="text-slate-400 text-sm">Rp 0</span>
                                                ) : (
                                                    <span className="text-slate-900">{formatCurrency(pegawai.gapok)}</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Button 
                                                    size="icon" 
                                                    variant="ghost" 
                                                    onClick={() => handleEditClick(pegawai)}
                                                    className="h-8 w-8 hover:bg-slate-100"
                                                    aria-label={`Edit gaji pokok ${pegawai.nama}`}
                                                >
                                                    <Pencil className="h-4 w-4 text-slate-500" aria-hidden="true" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-4">
                        <div className="flex items-center gap-3 text-sm text-slate-600">
                            <span>
                                Halaman <strong>{totalPages > 0 ? page : 0}</strong> dari <strong>{totalPages}</strong> ({totalRecords} pegawai)
                            </span>
                            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
                                <span className="text-xs text-slate-400">Baris:</span>
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
                                className="gap-1 border-slate-200"
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
                                className="gap-1 border-slate-200"
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
                        <DialogTitle className="flex items-center gap-2 text-slate-900">
                            <FilePlus className="w-5 h-5 text-blue-600" aria-hidden="true" />
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

                    <DialogFooter className="gap-2 sm:gap-0">
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
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
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
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-slate-900">Update Gaji Pokok</DialogTitle>
                        <DialogDescription className="text-slate-500">
                            Perbarui nilai gaji pokok untuk pegawai terpilih. Klik simpan untuk menerapkan.
                        </DialogDescription>
                    </DialogHeader>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="nama"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-700">Nama Pegawai</FormLabel>
                                        <FormControl>
                                            <Input {...field} disabled className="bg-slate-50 border-slate-200" />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            
                            <FormField
                                control={form.control}
                                name="gapok"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-700">Gaji Pokok (Rp)</FormLabel>
                                        <FormControl>
                                            <Input 
                                                type="number" 
                                                placeholder="0" 
                                                className="border-slate-200 bg-white"
                                                {...field} 
                                            />
                                        </FormControl>
                                        {watchedGapok > 0 && (
                                            <div className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded inline-block">
                                                Preview: {formatCurrency(watchedGapok)}
                                            </div>
                                        )}
                                        <FormDescription className="text-xs text-slate-500">
                                            Masukkan nominal tanpa titik atau koma.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <DialogFooter>
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={() => setIsDialogOpen(false)}
                                    disabled={isSubmitting}
                                >
                                    Batal
                                </Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Simpan Perubahan
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
