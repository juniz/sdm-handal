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
    DollarSign,
    ChevronLeft,
    ChevronRight,
    Pencil,
    FilePlus,
    CalendarIcon
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

// Schema validation
const formSchema = z.object({
    nik: z.string(),
    nama: z.string(),
    gapok: z.coerce.number().min(0, "Gaji pokok tidak boleh negatif")
});

export default function GajiPokokPage() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    
    // Filter state
    const [departments, setDepartments] = useState([]);
    const [selectedDepartment, setSelectedDepartment] = useState("all");

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

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setPage(1);
            fetchData();
        }, 500);

        return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, selectedDepartment]);

    // Fetch data whenever page changes
    useEffect(() => {
        fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: "10",
                search: search
            });

            if (selectedDepartment && selectedDepartment !== "all") {
                params.append("dep_id", selectedDepartment);
            }

            const response = await fetch(`/api/pegawai/gapok?${params}`);
            const result = await response.json();

            if (result.status === "success") {
                setData(result.data);
                setTotalPages(result.pagination.totalPages);
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
    const [generateMonth, setGenerateMonth] = useState(new Date().getMonth() + 1);
    const [generateYear, setGenerateYear] = useState(new Date().getFullYear());
    const [isGenerating, setIsGenerating] = useState(false);

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
            } else {
                toast.error("Gagal Generate", {
                    description: result.message
                });
            }
        } catch (error) {
            toast.error("Terjadi Kesalahan", {
                description: "Gagal menghubugi server"
            });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="container mx-auto p-4 md:p-6 space-y-6">
            <div className="flex flex-col space-y-2">
                <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                    {/* <DollarSign className="w-8 h-8 text-green-600" /> */}
                    Manajemen Gaji Pokok
                </h1>
                <p className="text-gray-500">
                    Atur besaran gaji pokok untuk setiap pegawai
                </p>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                        <div>
                            <CardTitle>Daftar Pegawai</CardTitle>
                            <CardDescription>
                                Gunakan tombol edit untuk mengubah gaji pokok
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                             <Button onClick={() => setIsGenerateOpen(true)} className="bg-green-600 hover:bg-green-700">
                                <FilePlus className="w-4 h-4 mr-2" />
                                Generate Gaji
                            </Button>
                        </div>
                    </div>
                    <div className="mt-4 flex flex-col md:flex-row gap-4 w-full md:w-auto">
                            <div className="w-full md:w-72">
                                <Select 
                                    value={selectedDepartment} 
                                    onValueChange={setSelectedDepartment}
                                >
                                    <SelectTrigger>
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
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Cari nama atau NIK..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
                        </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>NIK</TableHead>
                                    <TableHead>Nama</TableHead>
                                    <TableHead>Departemen</TableHead>
                                    <TableHead>Jabatan</TableHead>
                                    <TableHead className="w-[150px] text-right">Gaji Pokok</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            <div className="flex justify-center items-center gap-2">
                                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                                <span>Memuat data...</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                            Tidak ada data pegawai ditemukan
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    data.map((pegawai) => (
                                        <TableRow key={pegawai.id}>
                                            <TableCell className="font-mono text-xs">{pegawai.nik}</TableCell>
                                            <TableCell className="font-medium">{pegawai.nama}</TableCell>
                                            <TableCell>{pegawai.nama_departemen || pegawai.departemen}</TableCell>
                                            <TableCell>{pegawai.jbtn}</TableCell>
                                            <TableCell className="text-right font-medium">
                                                {pegawai.gapok ? formatCurrency(pegawai.gapok) : "Rp 0"}
                                            </TableCell>
                                            <TableCell>
                                                <Button 
                                                    size="icon" 
                                                    variant="ghost" 
                                                    onClick={() => handleEditClick(pegawai)}
                                                    className="h-8 w-8 hover:bg-muted"
                                                >
                                                    <Pencil className="h-4 w-4 text-muted-foreground" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-end space-x-2 py-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1 || loading}
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                        </Button>
                        <div className="text-sm font-medium">
                            Halaman {page} dari {totalPages}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages || loading}
                        >
                            Next
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Generate Dialog */}
            <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Generate Gaji Periode</DialogTitle>
                        <DialogDescription>
                            Proses ini akan menyalin data gaji pokok pegawai aktif ke tabel gaji pegawai untuk periode yang dipilih.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Bulan</label>
                                <Select 
                                    value={generateMonth.toString()} 
                                    onValueChange={(val) => setGenerateMonth(parseInt(val))}
                                >
                                    <SelectTrigger>
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
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Tahun</label>
                                <Input 
                                    type="number" 
                                    value={generateYear} 
                                    onChange={(e) => setGenerateYear(parseInt(e.target.value))}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsGenerateOpen(false)} disabled={isGenerating}>Batal</Button>
                        <Button onClick={handleGenerate} disabled={isGenerating}>
                            {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Generate
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Update Gaji Pokok</DialogTitle>
                        <DialogDescription>
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
                                        <FormLabel>Nama Pegawai</FormLabel>
                                        <FormControl>
                                            <Input {...field} disabled />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            
                            <FormField
                                control={form.control}
                                name="gapok"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Gaji Pokok (Rp)</FormLabel>
                                        <FormControl>
                                            <Input 
                                                type="number" 
                                                placeholder="0" 
                                                {...field} 
                                            />
                                        </FormControl>
                                        <FormDescription>
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
