"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { 
    Plus, 
    Search, 
    Filter, 
    ArrowLeft, 
    Edit, 
    Trash2, 
    Camera, 
    X, 
    MoreHorizontal, 
    ChevronRight, 
    Laptop, 
    Monitor, 
    Printer, 
    Network, 
    HardDrive,
    Package,
    ShieldCheck,
    AlertCircle,
    RotateCcw,
    CheckCircle2
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import Script from "next/script";
import { DepartemenCombobox } from "@/components/DepartemenCombobox";

export default function MasterITAssets() {
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("Semua");
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [assetToDelete, setAssetToDelete] = useState(null);
    const [editingAsset, setEditingAsset] = useState(null);
    const [user, setUser] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        serial_id: "",
        nama: "",
        jenis: "Laptop",
        vendor: "",
        tanggal_beli: "",
        status: "Tersedia",
        kondisi: "Baik",
        lokasi_departemen_id: ""
    });

    // Fetch User Info
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch("/api/auth/user");
                if (res.ok) {
                    const data = await res.json();
                    setUser(data.user);
                }
            } catch (err) {
                console.error("Auth fetch error:", err);
            }
        };
        fetchUser();
    }, []);

    // Scanner ref
    const scannerRef = useRef(null);

    const categories = [
        { name: "Semua", icon: <Package size={14} /> },
        { name: "Laptop", icon: <Laptop size={14} /> },
        { name: "PC Desktop", icon: <HardDrive size={14} /> },
        { name: "Monitor", icon: <Monitor size={14} /> },
        { name: "Printer", icon: <Printer size={14} /> },
        { name: "Jaringan", icon: <Network size={14} /> },
        { name: "Lainnya", icon: <ChevronRight size={14} /> },
    ];

    const fetchAssets = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/it-assets?search=${search}`);
            if (res.ok) {
                const data = await res.json();
                setAssets(data);
            }
        } catch (error) {
            console.error("Error fetching assets", error);
            toast.error("Gagal memuat data aset");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delaySearch = setTimeout(() => {
            fetchAssets();
        }, 500);
        return () => clearTimeout(delaySearch);
    }, [search]);

    const filteredAssets = useMemo(() => {
        if (selectedCategory === "Semua") return assets;
        return assets.filter(asset => asset.jenis === selectedCategory);
    }, [assets, selectedCategory]);

    const handleOpenAdd = () => {
        setEditingAsset(null);
        setFormData({
            serial_id: "", nama: "", jenis: "Laptop", vendor: "",
            tanggal_beli: "", status: "Tersedia", kondisi: "Baik",
            lokasi_departemen_id: ""
        });
        setIsAddOpen(true);
    };

    const handleOpenEdit = (asset) => {
        setEditingAsset(asset);
        setFormData({
            serial_id: asset.serial_id || "",
            nama: asset.nama,
            jenis: asset.jenis,
            vendor: asset.vendor || "",
            tanggal_beli: asset.tanggal_beli ? asset.tanggal_beli.split('T')[0] : "",
            status: asset.status,
            kondisi: asset.kondisi,
            lokasi_departemen_id: asset.lokasi_departemen_id || ""
        });
        
        // Use timeout to prevent Radix UI pointer-events clash
        // between closing DropdownMenu and opening Dialog
        setTimeout(() => {
            setIsAddOpen(true);
        }, 150);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const method = editingAsset ? "PUT" : "POST";
        const payload = { 
            ...formData, 
            user_id: user?.id,
            id: editingAsset?.id 
        };

        try {
            const res = await fetch("/api/it-assets", {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            
            if (res.ok) {
                toast.success(editingAsset ? "Aset berhasil diperbarui" : "Aset berhasil ditambahkan");
                setIsAddOpen(false);
                fetchAssets();
            } else {
                const err = await res.json();
                toast.error(err.error || "Gagal menyimpan aset");
            }
        } catch (error) {
            toast.error("Terjadi kesalahan server");
        }
    };

    const confirmDelete = (asset) => {
        setAssetToDelete(asset);
        setTimeout(() => setIsDeleteOpen(true), 150);
    };

    const handleDelete = async () => {
        try {
            const res = await fetch(`/api/it-assets?id=${assetToDelete.id}`, {
                method: "DELETE"
            });
            if (res.ok) {
                toast.success("Aset berhasil dihapus");
                setIsDeleteOpen(false);
                fetchAssets();
            } else {
                toast.error("Gagal menghapus aset");
            }
        } catch (error) {
            toast.error("Terjadi kesalahan server");
        }
    };

    // Scanner Logic
    const startScanner = () => {
        setIsScannerOpen(true);
        setTimeout(() => {
            if (window.Html5QrcodeScanner) {
                const scanner = new window.Html5QrcodeScanner("reader", { 
                    fps: 10, 
                    qrbox: { width: 250, height: 150 },
                    aspectRatio: 1.0
                });
                
                scanner.render((decodedText) => {
                    setFormData(prev => ({ ...prev, serial_id: decodedText }));
                    toast.success("Barcode terdeteksi!");
                    scanner.clear();
                    setIsScannerOpen(false);
                }, (error) => {
                    // console.warn(error);
                });
                scannerRef.current = scanner;
            }
        }, 500);
    };

    const stopScanner = () => {
        if (scannerRef.current) {
            scannerRef.current.clear();
        }
        setIsScannerOpen(false);
    };

    // Failsafe to restore pointer events on close
    useEffect(() => {
        if (!isAddOpen && !isDeleteOpen && !isScannerOpen) {
            document.body.style.pointerEvents = "auto";
        }
    }, [isAddOpen, isDeleteOpen, isScannerOpen]);

    const StatusBadge = ({ status }) => {
        const variants = {
            "Tersedia": { class: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <CheckCircle2 size={12} className="mr-1" /> },
            "Dipinjam": { class: "bg-amber-50 text-amber-700 border-amber-200", icon: <RotateCcw size={12} className="mr-1" /> },
            "Diperbaiki": { class: "bg-blue-50 text-blue-700 border-blue-200", icon: <Filter size={12} className="mr-1" /> },
            "Rusak": { class: "bg-rose-50 text-rose-700 border-rose-200", icon: <AlertCircle size={12} className="mr-1" /> },
            "Dihapus/Afkir": { class: "bg-slate-50 text-slate-700 border-slate-200", icon: <Trash2 size={12} className="mr-1" /> }
        };
        const active = variants[status] || { class: "bg-gray-50 text-gray-700", icon: null };
        return (
            <Badge variant="outline" className={`rounded-full px-2.5 py-0.5 font-medium flex items-center w-fit ${active.class}`}>
                {active.icon}
                {status}
            </Badge>
        );
    };

    const ConditionBadge = ({ kondisi }) => {
        const isGood = kondisi === "Baik" || kondisi === "Sangat Baik";
        const isWarning = kondisi === "Rusak Ringan" || kondisi === "Terdapat Cacat Fisik";
        
        return (
            <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${isGood ? 'bg-emerald-500' : isWarning ? 'bg-amber-500' : 'bg-rose-500'}`} />
                <span className="text-xs font-medium text-slate-600">{kondisi}</span>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 space-y-6">
            <Script src="https://unpkg.com/html5-qrcode" strategy="afterInteractive" />
            
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-1">
                        <Link href="/dashboard/it-assets" className="hover:text-[#0093dd] transition-colors">IT Assets</Link>
                        <ChevronRight size={14} />
                        <span className="text-slate-900">Master Data</span>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Master Data Inventaris</h1>
                    <p className="text-slate-500 text-sm">Kelola pencatatan dan log fisik aset IT Rumah Sakit.</p>
                </div>
                
                <Button className="bg-[#0093dd] hover:bg-[#007bbd] text-white shadow-lg shadow-blue-200/50 h-11 px-6 rounded-xl" onClick={handleOpenAdd}>
                    <Plus size={18} className="mr-2" />
                    Tambah Aset Baru
                </Button>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
                <div className="relative flex-1 w-full sm:w-auto">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Cari asset berdasarkan nama atau S/N..."
                        className="pl-10 h-11 bg-transparent border-none focus-visible:ring-0 text-slate-700 placeholder:text-slate-400"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto px-2 border-l border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mr-2 hidden lg:block">Filter:</span>
                    {categories.map((cat) => (
                        <button
                            key={cat.name}
                            onClick={() => setSelectedCategory(cat.name)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                                selectedCategory === cat.name 
                                ? "bg-[#0093dd] text-white shadow-md shadow-blue-200" 
                                : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                            }`}
                        >
                            {cat.icon}
                            {cat.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table / List Area */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Desktop Table View */}
                <div className="hidden md:block">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-b border-slate-100 bg-slate-50/50">
                                <TableHead className="w-16 text-center font-bold text-slate-600 uppercase text-[10px] tracking-wider">No</TableHead>
                                <TableHead className="font-bold text-slate-600 uppercase text-[10px] tracking-wider">Identitas Aset</TableHead>
                                <TableHead className="font-bold text-slate-600 uppercase text-[10px] tracking-wider">Kategori</TableHead>
                                <TableHead className="font-bold text-slate-600 uppercase text-[10px] tracking-wider">Lokasi / Unit</TableHead>
                                <TableHead className="font-bold text-slate-600 uppercase text-[10px] tracking-wider">Status</TableHead>
                                <TableHead className="font-bold text-slate-600 uppercase text-[10px] tracking-wider">Kondisi</TableHead>
                                <TableHead className="text-right font-bold text-slate-600 uppercase text-[10px] tracking-wider px-6">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-40 text-center">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="w-8 h-8 border-4 border-[#0093dd] border-t-transparent rounded-full animate-spin" />
                                            <span className="text-slate-500 font-medium">Sinkronisasi data...</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredAssets.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-60 text-center">
                                        <div className="flex flex-col items-center justify-center gap-4">
                                            <div className="p-4 bg-slate-100 rounded-full text-slate-400">
                                                <Package size={40} />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="font-bold text-slate-900">Aset Tidak Ditemukan</p>
                                                <p className="text-slate-500 text-sm">Coba ubah kata kunci pencarian atau kategori filter Anda.</p>
                                            </div>
                                            <Button variant="outline" onClick={() => { setSearch(""); setSelectedCategory("Semua"); }}>
                                                Reset Filter
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredAssets.map((asset, idx) => (
                                    <TableRow key={asset.id} className="group hover:bg-slate-50/80 transition-colors border-b border-slate-50">
                                        <TableCell className="text-center font-medium text-slate-400 text-xs">{idx + 1}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col space-y-0.5">
                                                <div className="font-bold text-slate-900 group-hover:text-[#0093dd] transition-colors">{asset.nama}</div>
                                                <div className="text-[10px] font-mono font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded w-fit">SN: {asset.serial_id || 'N/A'}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-slate-600 font-medium text-sm">
                                                {asset.jenis === 'Laptop' && <Laptop size={14} className="text-slate-400" />}
                                                {asset.jenis === 'Monitor' && <Monitor size={14} className="text-slate-400" />}
                                                {asset.jenis === 'Printer' && <Printer size={14} className="text-slate-400" />}
                                                {asset.jenis}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold text-slate-700">{asset.nama_departemen || 'IT Inventory'}</span>
                                                <span className="text-[10px] text-slate-400">{asset.vendor || 'Supplier Umum'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell><StatusBadge status={asset.status} /></TableCell>
                                        <TableCell><ConditionBadge kondisi={asset.kondisi} /></TableCell>
                                        <TableCell className="text-right px-6">
                                            <DropdownMenu modal={false}>
                                                <DropdownMenuTrigger asChild>
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200">
                                                        <MoreHorizontal className="h-4 w-4 text-slate-500" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" sideOffset={8} className="w-48 rounded-xl shadow-xl border-slate-200">
                                                    <DropdownMenuItem className="flex items-center gap-2 py-2.5 cursor-pointer text-slate-600 font-medium" onSelect={() => handleOpenEdit(asset)}>
                                                        <Edit size={16} className="text-blue-500" /> Edit Detail Aset
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator className="bg-slate-100" />
                                                    <DropdownMenuItem className="flex items-center gap-2 py-2.5 cursor-pointer text-rose-600 font-bold" onSelect={() => confirmDelete(asset)}>
                                                        <Trash2 size={16} className="text-rose-500" /> Hapus Aset
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Mobile Card List View */}
                <div className="md:hidden divide-y divide-slate-100">
                    {loading ? (
                        <div className="p-8 text-center flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-4 border-[#0093dd] border-t-transparent rounded-full animate-spin" />
                            <span className="text-slate-500 font-medium">Memuat aset...</span>
                        </div>
                    ) : filteredAssets.length === 0 ? (
                        <div className="p-12 text-center flex flex-col items-center gap-4">
                            <div className="p-4 bg-slate-100 rounded-full text-slate-400">
                                <Package size={32} />
                            </div>
                            <p className="font-bold text-slate-900">Tidak ada aset</p>
                            <Button variant="outline" size="sm" onClick={() => { setSearch(""); setSelectedCategory("Semua"); }}>
                                Reset Filter
                            </Button>
                        </div>
                    ) : (
                        filteredAssets.map((asset) => (
                            <div key={asset.id} className="p-4 space-y-4 bg-white active:bg-slate-50 transition-colors">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-[#0093dd] uppercase tracking-wider">{asset.jenis}</span>
                                            {asset.serial_id && (
                                                <span className="text-[9px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">SN: {asset.serial_id}</span>
                                            )}
                                        </div>
                                        <h3 className="font-bold text-slate-900 leading-tight">{asset.nama}</h3>
                                        <p className="text-xs text-slate-500">{asset.nama_departemen || 'IT Inventory'}</p>
                                    </div>
                                    <DropdownMenu modal={false}>
                                        <DropdownMenuTrigger asChild>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 -mr-2">
                                                <MoreHorizontal className="h-4 w-4 text-slate-400" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" sideOffset={8} className="w-48 rounded-xl z-[60]">
                                            <DropdownMenuItem className="flex items-center gap-2 py-3" onSelect={() => handleOpenEdit(asset)}>
                                                <Edit size={16} /> Edit Detail
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="flex items-center gap-2 py-3 text-rose-600 font-bold" onSelect={() => confirmDelete(asset)}>
                                                <Trash2 size={16} /> Hapus Aset
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                
                                <div className="flex items-center justify-between pt-1">
                                    <StatusBadge status={asset.status} />
                                    <ConditionBadge kondisi={asset.kondisi} />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Modal Add/Edit */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent 
                    onInteractOutside={(e) => e.preventDefault()}
                    onEscapeKeyDown={(e) => e.preventDefault()}
                    className="sm:max-w-[550px] p-0 overflow-y-auto max-h-[95vh] border-none shadow-2xl rounded-3xl"
                >
                    <form onSubmit={handleSave}>
                        <div className="bg-[#0093dd] p-8 text-white relative hidden md:block">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold">{editingAsset ? "Edit Detail Aset" : "Registrasi Aset Baru"}</DialogTitle>
                                <DialogDescription className="text-blue-100/80 font-medium">
                                    {editingAsset ? "Perbarui metadata inventaris barang IT." : "Tambahkan unit hardware baru ke dalam sistem log."}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="absolute -bottom-6 right-8 w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#0093dd] shadow-lg">
                                {editingAsset ? <Edit size={24} /> : <Plus size={24} />}
                            </div>
                        </div>

                        <div className="p-4 md:p-8 space-y-4 md:space-y-6 bg-white">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nama Barang*</label>
                                    <Input required value={formData.nama} onChange={(e) => setFormData({...formData, nama: e.target.value})} placeholder="Asus Vivobook / Dell Optiplex" className="h-11 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Kategori*</label>
                                    <select 
                                        className="flex h-11 w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:bg-white transition-all"
                                        value={formData.jenis} 
                                        onChange={(e) => setFormData({...formData, jenis: e.target.value})}
                                    >
                                        <option value="Laptop">Laptop</option>
                                        <option value="PC Desktop">PC Desktop</option>
                                        <option value="Monitor">Monitor</option>
                                        <option value="Printer">Printer</option>
                                        <option value="Jaringan">Jaringan</option>
                                        <option value="Lainnya">Lainnya</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lokasi / Unit Penempatan*</label>
                                <DepartemenCombobox 
                                    value={formData.lokasi_departemen_id} 
                                    onValueChange={(val) => setFormData({...formData, lokasi_departemen_id: val})} 
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex justify-between">
                                    Serial Number / Barcode
                                    <button type="button" className="text-[#0093dd] font-bold flex items-center gap-1 hover:underline text-[10px]" onClick={startScanner}>
                                        <Camera size={12} /> Scan Camera
                                    </button>
                                </label>
                                <Input value={formData.serial_id} onChange={(e) => setFormData({...formData, serial_id: e.target.value})} placeholder="S/N: 123456789" className="h-11 rounded-xl bg-slate-50 border-slate-200" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Vendor / Supplier</label>
                                    <Input value={formData.vendor} onChange={(e) => setFormData({...formData, vendor: e.target.value})} placeholder="PT. Mulia Tech" className="h-11 rounded-xl bg-slate-50 border-slate-200" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tanggal Perolehan</label>
                                    <Input type="date" value={formData.tanggal_beli} onChange={(e) => setFormData({...formData, tanggal_beli: e.target.value})} className="h-11 rounded-xl bg-slate-50 border-slate-200" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status*</label>
                                    <select 
                                        className="flex h-11 w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:bg-white transition-all"
                                        value={formData.status} 
                                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                                    >
                                        <option value="Tersedia">Tersedia</option>
                                        <option value="Dipinjam">Dipinjam</option>
                                        <option value="Diperbaiki">Diperbaiki</option>
                                        <option value="Rusak">Rusak</option>
                                        <option value="Dihapus/Afkir">Dihapus/Afkir</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Kondisi Fisik*</label>
                                    <select 
                                        className="flex h-11 w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:bg-white transition-all"
                                        value={formData.kondisi} 
                                        onChange={(e) => setFormData({...formData, kondisi: e.target.value})}
                                    >
                                        <option value="Sangat Baik">Sangat Baik</option>
                                        <option value="Baik">Baik</option>
                                        <option value="Terdapat Cacat Fisik">Terdapat Cacat Fisik</option>
                                        <option value="Rusak Ringan">Rusak Ringan</option>
                                        <option value="Rusak Berat">Rusak Berat</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="px-4 md:px-8 pb-6 md:pb-8 pt-2 bg-white flex justify-end gap-3">
                            <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)} className="rounded-xl h-11 px-6">Batal</Button>
                            <Button type="submit" className="bg-[#0093dd] hover:bg-[#007bbd] text-white rounded-xl h-11 px-8 shadow-lg shadow-blue-200/50">
                                {editingAsset ? "Perbarui Data" : "Simpan Aset"}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal Scanner */}
            <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
                <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden rounded-3xl border-none">
                    <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
                        <div className="space-y-1">
                            <DialogTitle className="text-lg font-bold text-white">QR & Barcode Scanner</DialogTitle>
                            <DialogDescription className="text-slate-400 text-xs">Pindai serial number secara otomatis.</DialogDescription>
                        </div>
                        <Button variant="ghost" size="icon" onClick={stopScanner} className="text-slate-400 hover:text-white hover:bg-slate-800"><X /></Button>
                    </div>
                    <div className="p-6 bg-slate-900">
                        <div id="reader" className="w-full bg-slate-800 rounded-2xl overflow-hidden min-h-[300px] border-2 border-dashed border-slate-700"></div>
                        <div className="mt-6 flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl text-xs text-slate-400 italic">
                            <AlertCircle size={14} className="text-[#0093dd]" />
                            Pastikan barcode berada tepat di dalam kotak area pemindaian.
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Modal Delete Confirmation */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent 
                    onInteractOutside={(e) => e.preventDefault()}
                    className="sm:max-w-[400px] p-8 rounded-3xl border-none shadow-2xl"
                >
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center">
                            <Trash2 size={32} />
                        </div>
                        <div className="space-y-2">
                            <DialogTitle className="text-xl font-bold">Konfirmasi Hapus</DialogTitle>
                            <DialogDescription className="text-slate-500 font-medium">
                                Apakah Anda yakin ingin menghapus aset <span className="text-slate-900 font-bold underline underline-offset-4 decoration-rose-300">{assetToDelete?.nama}</span>?
                            </DialogDescription>
                        </div>
                        <div className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-2">
                           <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Peringatan</p>
                           <p className="text-xs text-slate-600 font-medium leading-relaxed">Tindakan ini permanen dan akan menghapus unit dari log inventaris aktif rumah sakit.</p>
                        </div>
                        <div className="flex w-full gap-3 pt-2">
                            <Button variant="ghost" className="flex-1 rounded-xl h-12" onClick={() => setIsDeleteOpen(false)}>Batal</Button>
                            <Button variant="destructive" className="flex-2 rounded-xl h-12 bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-200" onClick={handleDelete}>Hapus Permanen</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
