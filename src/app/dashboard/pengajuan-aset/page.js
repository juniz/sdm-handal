"use client";

import React, { useState, useEffect, useMemo } from "react";
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
    DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { 
    Plus, 
    Server, 
    ArrowLeft, 
    ChevronRight, 
    Package, 
    Clock, 
    History, 
    Search, 
    Filter,
    ShieldCheck,
    AlertCircle,
    CheckCircle2,
    XCircle,
    RotateCcw,
    Monitor,
    Laptop,
    Printer,
    Tablet,
    Settings
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function PengajuanAsetIT() {
    const [myRequests, setMyRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [userProfile, setUserProfile] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        jenis_aset_diminta: "Laptop",
        tujuan_peminjaman: "",
        tenggat_pengembalian: ""
    });

    const fetchUserProfile = async () => {
        try {
            const response = await fetch("/api/auth/user");
            if (response.ok) {
                const data = await response.json();
                setUserProfile(data.user);
                return data.user.id;
            }
        } catch (error) {
            console.error("Gagal mendapatkan sesi user");
        }
        return null;
    };

    const fetchMyRequests = async (userId) => {
        if (!userId) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/it-assets/loans?pegawai_id=${userId}`);
            if (res.ok) {
                const data = await res.json();
                setMyRequests(data);
            }
        } catch (error) {
            toast.error("Gagal memuat histori pengajuan");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const init = async () => {
             const uid = await fetchUserProfile();
             if (uid) fetchMyRequests(uid);
        };
        init();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!userProfile?.id) {
            toast.error("Sesi tidak valid. Harap login ulang.");
            return;
        }

        try {
            const payload = {
                ...formData,
                pegawai_id: userProfile.id,
                departemen_id: userProfile.departemen || null,
            };

            const res = await fetch("/api/it-assets/loans", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            
            if (res.ok) {
                toast.success("Pengajuan berhasil dikirim");
                setIsAddOpen(false);
                setFormData({ jenis_aset_diminta: "Laptop", tujuan_peminjaman: "", tenggat_pengembalian: "" });
                fetchMyRequests(userProfile.id);
            } else {
                toast.error("Gagal mengirim pengajuan");
            }
        } catch (error) {
            toast.error("Terjadi kesalahan server");
        }
    };

    // Stats Calculation
    const stats = useMemo(() => {
        return {
            active: myRequests.filter(r => r.status_peminjaman === 'Aktif').length,
            pending: myRequests.filter(r => r.status_peminjaman === 'Menunggu Approval').length,
            total: myRequests.length
        };
    }, [myRequests]);

    // Filtering logic
    const filteredRequests = useMemo(() => {
        const q = search.toLowerCase();
        return myRequests.filter(r => 
            (r.jenis_aset_diminta || "").toLowerCase().includes(q) ||
            (r.tujuan_peminjaman || "").toLowerCase().includes(q) ||
            (`REQ-${r.id}`).toLowerCase().includes(q)
        );
    }, [myRequests, search]);

    const StatusBadge = ({ status }) => {
        const variants = {
            "Menunggu Approval": { class: "bg-blue-50 text-blue-700 border-blue-200", icon: <Clock size={12} className="mr-1" />, label: "Review IT" },
            "Aktif": { class: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <ShieldCheck size={12} className="mr-1" />, label: "Dipakai" },
            "Ditolak": { class: "bg-rose-50 text-rose-700 border-rose-200", icon: <XCircle size={12} className="mr-1" />, label: "Ditolak" },
            "Dikembalikan": { class: "bg-slate-50 text-slate-600 border-slate-200", icon: <RotateCcw size={12} className="mr-1" />, label: "Selesai" }
        };
        const active = variants[status] || { class: "bg-gray-50 text-gray-700", icon: null, label: status };
        return (
            <Badge variant="outline" className={`rounded-full px-2.5 py-0.5 font-medium flex items-center w-fit tracking-tight ${active.class}`}>
                {active.icon}
                {active.label}
            </Badge>
        );
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-1">
                        <Link href="/dashboard" className="hover:text-[#0093dd] transition-colors">Dashboard</Link>
                        <ChevronRight size={14} />
                        <span className="text-slate-900 font-semibold">Pengajuan Aset IT</span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Request Inventaris</h1>
                    <p className="text-slate-500 text-sm">Ajukan kebutuhan hardware dan monitor sirkulasi aset Anda.</p>
                </div>
                
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-[#0093dd] hover:bg-[#007bbd] text-white shadow-lg shadow-blue-200/50 h-12 px-6 rounded-2xl group transition-all">
                            <Plus size={20} className="mr-2 group-hover:rotate-90 transition-transform duration-300" />
                            Buat Request Baru
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-none shadow-2xl rounded-3xl">
                        <form onSubmit={handleSubmit}>
                            <div className="bg-[#0093dd] p-8 text-white relative">
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-bold">Ajukan Hardware</DialogTitle>
                                    <DialogDescription className="text-blue-100/80 font-medium">
                                        Pilih unit yang Anda butuhkan untuk mendukung produktivitas kerja.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="absolute -bottom-6 right-8 w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#0093dd] shadow-lg">
                                    <Plus size={24} />
                                </div>
                            </div>

                            <div className="p-8 space-y-6 bg-white pt-10">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Kategori Perangkat*</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {['Laptop', 'PC Desktop', 'Monitor', 'Printer', 'Tablet', 'Aksesoris/Lainnya'].map((type) => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => setFormData({...formData, jenis_aset_diminta: type})}
                                                className={`flex items-center gap-2 px-3 py-3 rounded-xl border text-sm font-medium transition-all text-left ${
                                                    formData.jenis_aset_diminta === type 
                                                    ? "bg-blue-50 border-[#0093dd] text-[#0093dd] ring-1 ring-[#0093dd]" 
                                                    : "bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100"
                                                }`}
                                            >
                                                <div className={`p-1.5 rounded-lg ${formData.jenis_aset_diminta === type ? "bg-[#0093dd] text-white" : "bg-white text-slate-400"}`}>
                                                    {type === 'Laptop' && <Laptop size={14} />}
                                                    {type === 'PC Desktop' && <Server size={14} />}
                                                    {type === 'Monitor' && <Monitor size={14} />}
                                                    {type === 'Printer' && <Printer size={14} />}
                                                    {type === 'Tablet' && <Tablet size={14} />}
                                                    {type === 'Aksesoris/Lainnya' && <Settings size={14} />}
                                                </div>
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Keperluan / Keterangan*</label>
                                    <textarea 
                                        required 
                                        rows={3}
                                        value={formData.tujuan_peminjaman} 
                                        onChange={(e) => setFormData({...formData, tujuan_peminjaman: e.target.value})} 
                                        placeholder="Contoh: Unit pengganti untuk pendaftaran RS, atau untuk implementasi SIMRS baru..."
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0093dd]/20 transition-all resize-none"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estimasi Selesai Pinjam</label>
                                    <Input 
                                        type="date" 
                                        value={formData.tenggat_pengembalian} 
                                        onChange={(e) => setFormData({...formData, tenggat_pengembalian: e.target.value})} 
                                        className="h-12 rounded-xl bg-slate-50 border-slate-200"
                                    />
                                    <p className="text-[10px] text-slate-400 font-medium italic">*Kosongkan jika untuk inventaris kerja permanen.</p>
                                </div>
                            </div>

                            <div className="px-8 pb-8 pt-2 bg-white flex justify-end gap-3">
                                <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)} className="rounded-xl h-11 px-6">Batal</Button>
                                <Button type="submit" className="bg-[#0093dd] hover:bg-[#007bbd] text-white rounded-xl h-11 px-8 shadow-lg shadow-blue-200/50 font-bold">
                                    Kirim Pengajuan
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Summary KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-sm bg-white overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-500 text-blue-600">
                        <Package size={64} />
                    </div>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-blue-50 text-[#0093dd] rounded-2xl shadow-sm">
                                <Package size={24} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Aset Di Tangan</h3>
                                <p className="text-xs text-slate-400">Unit aktif sedang digunakan</p>
                            </div>
                        </div>
                        <div className="text-4xl font-black text-slate-900">
                            {loading ? <Skeleton className="h-10 w-16" /> : stats.active}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-500 text-amber-600">
                        <Clock size={64} />
                    </div>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl shadow-sm border border-amber-100">
                                <Clock size={24} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Menunggu Review</h3>
                                <p className="text-xs text-slate-400">Masih diproses tim IT</p>
                            </div>
                        </div>
                        <div className="text-4xl font-black text-slate-900 tracking-tight">
                            {loading ? <Skeleton className="h-10 w-16" /> : stats.pending}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-500 text-slate-400">
                        <History size={64} />
                    </div>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-slate-50 text-slate-500 rounded-2xl shadow-sm border border-slate-200">
                                <History size={24} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Histori Request</h3>
                                <p className="text-xs text-slate-400">Total seluruh pengajuan</p>
                            </div>
                        </div>
                        <div className="text-4xl font-black text-slate-900 tracking-tight">
                            {loading ? <Skeleton className="h-10 w-16" /> : stats.total}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Area */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
                {/* Search & Action Bar */}
                <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="relative flex-1 w-full max-w-md">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Cari histori berdasarkan kategori atau keperluan..."
                            className="pl-10 h-11 bg-slate-50/50 border-none focus-visible:ring-2 focus-visible:ring-[#0093dd]/20 text-slate-700 font-medium"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl border-slate-200 text-slate-500 hover:bg-slate-50">
                            <Filter size={18} />
                        </Button>
                    </div>
                </div>

                {/* Table View */}
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent bg-slate-50/50">
                                <TableHead className="w-28 text-center font-bold text-slate-600 uppercase text-[10px] tracking-widest pl-8">Identitas</TableHead>
                                <TableHead className="font-bold text-slate-600 uppercase text-[10px] tracking-widest">Barang / Kebutuhan</TableHead>
                                <TableHead className="font-bold text-slate-600 uppercase text-[10px] tracking-widest">Alokasi Fisik IT</TableHead>
                                <TableHead className="font-bold text-slate-600 uppercase text-[10px] tracking-widest">Keterangan</TableHead>
                                <TableHead className="font-bold text-slate-600 uppercase text-[10px] tracking-widest pr-8">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array(3).fill(0).map((_, i) => (
                                    <TableRow key={i} className="border-b border-slate-50">
                                        <TableCell className="pl-8 py-6"><Skeleton className="h-10 w-full rounded-lg" /></TableCell>
                                        <TableCell><Skeleton className="h-10 w-full rounded-lg" /></TableCell>
                                        <TableCell><Skeleton className="h-10 w-full rounded-lg" /></TableCell>
                                        <TableCell><Skeleton className="h-10 w-full rounded-lg" /></TableCell>
                                        <TableCell className="pr-8"><Skeleton className="h-10 w-24 rounded-full" /></TableCell>
                                    </TableRow>
                                ))
                            ) : filteredRequests.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-80 text-center">
                                        <div className="flex flex-col items-center justify-center gap-6 max-w-sm mx-auto">
                                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 shadow-inner">
                                                <History size={40} />
                                            </div>
                                            <div className="space-y-2">
                                                <h3 className="text-xl font-bold text-slate-900">Belum Ada Histori</h3>
                                                <p className="text-slate-500 text-sm leading-relaxed px-4">
                                                    Anda belum pernah membuat pengajuan inventaris sebelumnya. Klik tombol "Buat Request" untuk memesan hardware.
                                                </p>
                                            </div>
                                            <Button variant="outline" className="rounded-xl border-slate-200 px-8" onClick={() => setIsAddOpen(true)}>
                                                Mulai Ajukan Sekarang
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredRequests.map((req) => (
                                    <TableRow key={req.id} className="group hover:bg-slate-50/80 transition-all border-b border-slate-50">
                                        <TableCell className="pl-8 py-5">
                                            <div className="flex flex-col">
                                                <span className="font-mono text-[10px] font-bold text-slate-400 group-hover:text-[#0093dd] transition-colors tracking-tighter">REQ-{req.id}</span>
                                                <span className="font-bold text-slate-900 text-xs mt-0.5">{new Date(req.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 shadow-sm flex items-center justify-center text-[#0093dd] group-hover:bg-[#0093dd] group-hover:text-white transition-all">
                                                    {req.jenis_aset_diminta === 'Laptop' && <Laptop size={14} />}
                                                    {req.jenis_aset_diminta === 'Monitor' && <Monitor size={14} />}
                                                    {req.jenis_aset_diminta === 'Printer' && <Printer size={14} />}
                                                    {(req.jenis_aset_diminta === 'Aksesoris/Lainnya' || req.jenis_aset_diminta === 'Tablet') && <Package size={14} />}
                                                    {req.jenis_aset_diminta === 'PC Desktop' && <Server size={14} />}
                                                </div>
                                                <span className="font-bold text-slate-700 group-hover:text-slate-900 transition-colors uppercase text-[11px] tracking-wide">{req.jenis_aset_diminta}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {req.asset_id ? (
                                                <div className="flex flex-col space-y-0.5">
                                                    <span className="text-sm font-semibold text-slate-800">{req.asset_nama}</span>
                                                    <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded w-fit">SN: {req.serial_id}</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 text-slate-400 italic text-xs font-medium">
                                                    <Clock size={12} />
                                                    Menunggu Alokasi IT
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="max-w-[180px]">
                                                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-medium">{req.tujuan_peminjaman || '-'}</p>
                                                {req.tenggat_pengembalian && (
                                                    <div className="flex items-center gap-1 mt-1 font-bold text-[9px] text-amber-600 uppercase tracking-tighter">
                                                        <AlertCircle size={10} /> S/D {new Date(req.tenggat_pengembalian).toLocaleDateString('id-ID')}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="pr-8">
                                            <div className="space-y-1.5">
                                                <StatusBadge status={req.status_peminjaman} />
                                                {req.alasan_penolakan && req.status_peminjaman === 'Ditolak' && (
                                                    <div className="flex items-start gap-1 p-2 bg-rose-50 rounded-lg border border-rose-100 text-[10px] text-rose-700 font-medium max-w-[160px] animate-in fade-in slide-in-from-top-1">
                                                        <AlertCircle size={12} className="shrink-0 mt-0.5" />
                                                        <span>{req.alasan_penolakan}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Footer Info */}
                <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center gap-4 text-xs text-slate-500 italic">
                    <ShieldCheck size={16} className="text-[#0093dd]" />
                    Setiap unit yang dialokasikan tunduk pada kebijakan pemeliharaan & keamanan data Rumah Sakit.
                </div>
            </div>
        </div>
    );
}
