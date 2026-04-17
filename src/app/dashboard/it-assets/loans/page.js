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
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
    CheckCircle2, 
    XCircle, 
    Search, 
    ArrowLeft, 
    ChevronRight, 
    ClipboardList, 
    User, 
    Calendar, 
    Package, 
    AlertCircle, 
    RotateCcw, 
    ShieldCheck, 
    Trash2, 
    X,
    Filter,
    Clock,
    History,
    Check
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default function ApprovalITAssets() {
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [availableAssets, setAvailableAssets] = useState([]);
    const [user, setUser] = useState(null);
    
    // View state
    const [activeTab, setActiveTab] = useState("Menunggu Approval");

    // Modal state
    const [selectedLoan, setSelectedLoan] = useState(null);
    const [isApproveOpen, setIsApproveOpen] = useState(false);
    const [isRejectOpen, setIsRejectOpen] = useState(false);
    const [isReturnOpen, setIsReturnOpen] = useState(false);

    // Form state
    const [approveForm, setApproveForm] = useState({ asset_id: "", kondisi_keluar: "Baik" });
    const [rejectForm, setRejectForm] = useState({ alasan_penolakan: "" });
    const [returnForm, setReturnForm] = useState({ kondisi_kembali: "Baik", status_aset_baru: "Tersedia" });

    const fetchLoans = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/it-assets/loans`);
            if (res.ok) {
                const data = await res.json();
                setLoans(data);
            }
        } catch (error) {
            toast.error("Gagal memuat data peminjaman");
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableAssets = async () => {
        try {
            const res = await fetch('/api/it-assets?status=Tersedia');
            if (res.ok) {
                const data = await res.json();
                setAvailableAssets(data);
            }
        } catch (error) {
            console.error("Gagal get aset tersedia");
        }
    };

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

    useEffect(() => {
        fetchLoans();
        fetchAvailableAssets();
    }, []);

    const processAction = async (payload) => {
        try {
            const res = await fetch("/api/it-assets/loans", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...payload, user_id: user?.id }),
            });
            if (res.ok) {
                toast.success("Berhasil di" + payload.action.toLowerCase());
                fetchLoans();
                if (payload.action === 'APPROVE') fetchAvailableAssets();
                return true;
            } else {
                const err = await res.json();
                toast.error(err.error || "Gagal memproses aksi");
                return false;
            }
        } catch (error) {
            toast.error("Terjadi kesalahan server");
            return false;
        }
    };

    const handleApprove = async (e) => {
        e.preventDefault();
        const ok = await processAction({ action: 'APPROVE', loan_id: selectedLoan.id, ...approveForm });
        if (ok) setIsApproveOpen(false);
    };

    const handleReject = async (e) => {
        e.preventDefault();
        const ok = await processAction({ action: 'REJECT', loan_id: selectedLoan.id, ...rejectForm });
        if (ok) setIsRejectOpen(false);
    };

    const handleReturn = async (e) => {
        e.preventDefault();
        const ok = await processAction({ action: 'RETURN', loan_id: selectedLoan.id, asset_id: selectedLoan.asset_id, ...returnForm });
        if (ok) setIsReturnOpen(false);
    };

    // Filter logic
    const displayedLoans = useMemo(() => {
        const filtered = loans.filter(l => {
            if (activeTab === 'Menunggu Approval' && l.status_peminjaman !== 'Menunggu Approval') return false;
            if (activeTab === 'Sedang Dipinjam' && !['Aktif', 'Terlambat'].includes(l.status_peminjaman)) return false;
            if (activeTab === 'Riwayat/Selesai' && !['Dikembalikan', 'Ditolak', 'Hilang'].includes(l.status_peminjaman)) return false;
            
            const q = search.toLowerCase();
            return (l.pegawai_nama || "").toLowerCase().includes(q) ||
                   (l.asset_nama || "").toLowerCase().includes(q) ||
                   (l.jenis_aset_diminta || "").toLowerCase().includes(q);
        });
        return filtered;
    }, [loans, activeTab, search]);

    // Failsafe to restore pointer events on close
    useEffect(() => {
        if (!isApproveOpen && !isRejectOpen && !isReturnOpen) {
            document.body.style.pointerEvents = "auto";
        }
    }, [isApproveOpen, isRejectOpen, isReturnOpen]);

    const StatusBadge = ({ status }) => {
        const variants = {
            "Aktif": { class: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <CheckCircle2 size={12} className="mr-1" />, label: "Dipinjam" },
            "Terlambat": { class: "bg-rose-50 text-rose-700 border-rose-200", icon: <AlertCircle size={12} className="mr-1" />, label: "Terlambat" },
            "Menunggu Approval": { class: "bg-blue-50 text-blue-700 border-blue-200", icon: <Clock size={12} className="mr-1" />, label: "Review" },
            "Dikembalikan": { class: "bg-slate-50 text-slate-600 border-slate-200", icon: <RotateCcw size={12} className="mr-1" />, label: "Selesai" },
            "Ditolak": { class: "bg-slate-50 text-slate-400 border-slate-200", icon: <XCircle size={12} className="mr-1" />, label: "Ditolak" },
            "Hilang": { class: "bg-rose-900/10 text-rose-900 border-rose-900/20", icon: <AlertCircle size={12} className="mr-1" />, label: "Hilang" }
        };
        const active = variants[status] || { class: "bg-gray-50 text-gray-700", icon: null, label: status };
        return (
            <Badge variant="outline" className={`rounded-full px-2.5 py-0.5 font-medium flex items-center w-fit ${active.class}`}>
                {active.icon}
                {active.label}
            </Badge>
        );
    };

    const tabs = [
        { name: "Menunggu Approval", icon: <Clock size={14} />, color: "text-blue-600", count: loans.filter(l => l.status_peminjaman === 'Menunggu Approval').length },
        { name: "Sedang Dipinjam", icon: <Package size={14} />, color: "text-amber-600", count: loans.filter(l => ['Aktif', 'Terlambat'].includes(l.status_peminjaman)).length },
        { name: "Riwayat/Selesai", icon: <History size={14} />, color: "text-slate-600", count: loans.filter(l => ['Dikembalikan', 'Ditolak', 'Hilang'].includes(l.status_peminjaman)).length },
    ];

    return (
        <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 space-y-6">
            
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-1">
                        <Link href="/dashboard/it-assets" className="hover:text-[#0093dd] transition-colors">IT Assets</Link>
                        <ChevronRight size={14} />
                        <span className="text-slate-900">Peminjaman</span>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Manajemen Pengajuan Aset</h1>
                    <p className="text-slate-500 text-sm">Monitor sirkulasi barang dan review permintaan hardware dari unit.</p>
                </div>
            </div>

            {/* Navigation & Search */}
            <div className="flex flex-col lg:flex-row items-center gap-4 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-1 p-1 bg-slate-50 rounded-xl overflow-x-auto w-full lg:w-auto no-scrollbar">
                    {tabs.map((tab) => (
                        <button
                            key={tab.name}
                            onClick={() => setActiveTab(tab.name)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                                activeTab === tab.name 
                                ? "bg-white text-slate-900 shadow-sm border border-slate-200" 
                                : "text-slate-500 hover:text-slate-700"
                            }`}
                        >
                            <span className={activeTab === tab.name ? tab.color : "text-slate-400"}>{tab.icon}</span>
                            {tab.name}
                            {tab.count > 0 && (
                                <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] ${
                                    activeTab === tab.name ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-600"
                                }`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
                
                <div className="h-8 w-px bg-slate-100 hidden lg:block" />

                <div className="relative flex-1 w-full lg:w-auto">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Cari peminjam, aset, atau tiket REQ..."
                        className="pl-10 h-10 bg-transparent border-none focus-visible:ring-0 text-slate-700 placeholder:text-slate-400"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Desktop View */}
                <div className="hidden md:block">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-b border-slate-100 bg-slate-50/50">
                                <TableHead className="w-24 text-center font-bold text-slate-600 uppercase text-[10px] tracking-wider">Tiket</TableHead>
                                <TableHead className="font-bold text-slate-600 uppercase text-[10px] tracking-wider">Peminjam</TableHead>
                                <TableHead className="font-bold text-slate-600 uppercase text-[10px] tracking-wider">
                                    {activeTab === 'Menunggu Approval' ? "Kebutuhan" : "Aset Fisik"}
                                </TableHead>
                                <TableHead className="font-bold text-slate-600 uppercase text-[10px] tracking-wider">Keperluan</TableHead>
                                <TableHead className="font-bold text-slate-600 uppercase text-[10px] tracking-wider">Status</TableHead>
                                <TableHead className="text-right font-bold text-slate-600 uppercase text-[10px] tracking-wider px-6">Aksi Administrasi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={6} className="h-40 text-center">
                                    <div className="flex flex-col items-center justify-center gap-3">
                                        <div className="w-8 h-8 border-4 border-[#0093dd] border-t-transparent rounded-full animate-spin" />
                                        <span className="text-slate-500 font-medium italic">Sinkronisasi data...</span>
                                    </div>
                                </TableCell></TableRow>
                            ) : displayedLoans.length === 0 ? (
                                <TableRow><TableCell colSpan={6} className="h-60 text-center">
                                    <div className="flex flex-col items-center justify-center gap-4">
                                        <div className="p-4 bg-slate-50 rounded-full text-slate-300">
                                            <ClipboardList size={40} />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-bold text-slate-900">Tidak Ada Data</p>
                                            <p className="text-slate-500 text-sm">Belum ada pengajuan aset untuk kategori tab ini.</p>
                                        </div>
                                    </div>
                                </TableCell></TableRow>
                            ) : displayedLoans.map((loan) => (
                                <TableRow key={loan.id} className="group hover:bg-slate-50/80 transition-colors border-b border-slate-50">
                                    <TableCell className="text-center">
                                        <div className="font-mono text-[11px] font-bold text-slate-400 group-hover:text-slate-900 transition-colors">REQ-{loan.id}</div>
                                        <div className="text-[10px] text-slate-400 mt-1">{new Date(loan.created_at).toLocaleDateString('id-ID')}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                                                <User size={14} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900 group-hover:text-[#0093dd] transition-colors">{loan.pegawai_nama || `Pegawai #${loan.pegawai_id}`}</span>
                                                <span className="text-[10px] font-medium text-slate-500">{loan.jabatan || loan.departemen_nama}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {activeTab === 'Menunggu Approval' ? (
                                            <div className="flex items-center gap-2">
                                                <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-none rounded-md font-bold text-[10px]">{loan.jenis_aset_diminta}</Badge>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col space-y-0.5">
                                                <span className="text-sm font-semibold text-slate-800">{loan.asset_nama}</span>
                                                <span className="text-[10px] font-mono text-slate-400">SN: {loan.serial_id || 'N/A'}</span>
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <p className="text-xs text-slate-600 max-w-[180px] line-clamp-2 leading-relaxed">{loan.tujuan_peminjaman || '-'}</p>
                                    </TableCell>
                                    <TableCell><StatusBadge status={loan.status_peminjaman} /></TableCell>
                                    <TableCell className="text-right px-6">
                                        <div className="flex justify-end gap-2">
                                            {loan.status_peminjaman === 'Menunggu Approval' && (
                                                <>
                                                    <Button 
                                                        size="sm" 
                                                        className="bg-[#0093dd] hover:bg-[#007bbd] text-white shadow-sm h-9 rounded-xl font-bold text-xs"
                                                        onClick={() => { setSelectedLoan(loan); setTimeout(() => setIsApproveOpen(true), 50); }}
                                                    >
                                                        <Check size={14} className="mr-1.5" /> Approve
                                                    </Button>
                                                    <Button 
                                                        size="sm" 
                                                        variant="ghost" 
                                                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-9 rounded-xl font-bold text-xs"
                                                        onClick={() => { setSelectedLoan(loan); setTimeout(() => setIsRejectOpen(true), 50); }}
                                                    >
                                                        Tolak
                                                    </Button>
                                                </>
                                            )}

                                            {(loan.status_peminjaman === 'Aktif' || loan.status_peminjaman === 'Terlambat') && (
                                                <Button 
                                                    size="sm" 
                                                    variant="outline" 
                                                    className="border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm h-9 rounded-xl font-bold text-xs"
                                                    onClick={() => { setSelectedLoan(loan); setTimeout(() => setIsReturnOpen(true), 50); }}
                                                >
                                                    <RotateCcw size={14} className="mr-1.5" /> Terima Kembali
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Mobile View */}
                <div className="md:hidden divide-y divide-slate-100">
                    {loading ? (
                        <div className="p-12 text-center flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-4 border-[#0093dd] border-t-transparent rounded-full animate-spin" />
                            <span className="text-slate-500 font-medium text-sm">Memuat data...</span>
                        </div>
                    ) : displayedLoans.length === 0 ? (
                        <div className="p-12 text-center flex flex-col items-center gap-4">
                            <ClipboardList size={40} className="text-slate-300" />
                            <p className="font-bold text-slate-900">Tidak ada pengajuan</p>
                        </div>
                    ) : displayedLoans.map((loan) => (
                        <div key={loan.id} className="p-4 space-y-4 bg-white active:bg-slate-50 transition-colors">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">REQ-{loan.id}</span>
                                        <StatusBadge status={loan.status_peminjaman} />
                                    </div>
                                    <h3 className="font-bold text-slate-900 leading-tight">{loan.pegawai_nama || `Pegawai #${loan.pegawai_id}`}</h3>
                                    <p className="text-xs text-slate-500 font-medium">{loan.jabatan || loan.departemen_nama}</p>
                                </div>
                                <div className="text-[10px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                                    {new Date(loan.created_at).toLocaleDateString('id-ID')}
                                </div>
                            </div>
                            
                            <div className="p-3 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Aset Fisik:</span>
                                {activeTab === 'Menunggu Approval' ? (
                                    <span className="text-sm font-bold text-[#0093dd]">{loan.jenis_aset_diminta}</span>
                                ) : (
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-slate-800">{loan.asset_nama}</span>
                                        <span className="text-[10px] font-mono text-slate-400">SN: {loan.serial_id || 'N/A'}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2">
                                {loan.status_peminjaman === 'Menunggu Approval' && (
                                    <>
                                        <Button 
                                            size="sm" 
                                            className="flex-1 bg-[#0093dd] hover:bg-[#007bbd] text-white h-10 rounded-xl font-bold"
                                            onClick={() => { setSelectedLoan(loan); setTimeout(() => setIsApproveOpen(true), 50); }}
                                        >
                                            Approve
                                        </Button>
                                        <Button 
                                            size="sm" 
                                            variant="outline" 
                                            className="flex-1 border-rose-200 text-rose-600 h-10 rounded-xl font-bold"
                                            onClick={() => { setSelectedLoan(loan); setTimeout(() => setIsRejectOpen(true), 50); }}
                                        >
                                            Tolak
                                        </Button>
                                    </>
                                )}
                                {(loan.status_peminjaman === 'Aktif' || loan.status_peminjaman === 'Terlambat') && (
                                    <Button 
                                        size="sm" 
                                        variant="outline" 
                                        className="w-full border-slate-200 text-slate-700 h-10 rounded-xl font-bold"
                                        onClick={() => { setSelectedLoan(loan); setTimeout(() => setIsReturnOpen(true), 50); }}
                                    >
                                        Terima Pengembalian
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Modal Approve */}
            <Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
                <DialogContent 
                    onInteractOutside={(e) => e.preventDefault()}
                    onEscapeKeyDown={(e) => e.preventDefault()}
                    className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl rounded-3xl"
                >
                    <form onSubmit={handleApprove}>
                        <div className="bg-[#0093dd] p-8 text-white relative">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold">Approve & Alokasi Aset</DialogTitle>
                                <DialogDescription className="text-blue-100/80 font-medium">
                                    Pilih perangkat spesifik untuk kategori <b>{selectedLoan?.jenis_aset_diminta}</b>.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="absolute -bottom-6 right-8 w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#0093dd] shadow-lg">
                                <ShieldCheck size={24} />
                            </div>
                        </div>

                        <div className="p-8 space-y-6 bg-white">
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Inventaris Fisik Tersedia*</label>
                                <select 
                                    required 
                                    className="flex h-12 w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:bg-white transition-all ring-offset-background"
                                    value={approveForm.asset_id}
                                    onChange={(e) => setApproveForm({...approveForm, asset_id: e.target.value})}
                                >
                                    <option value="">-- Pilih Aset Dari Gudang --</option>
                                    {availableAssets.map(a => (
                                        <option key={a.id} value={a.id}>{a.nama} ({a.jenis}) - {a.serial_id}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Kondisi Saat Keluar*</label>
                                <select 
                                    required 
                                    className="flex h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:bg-white transition-all"
                                    value={approveForm.kondisi_keluar}
                                    onChange={(e) => setApproveForm({...approveForm, kondisi_keluar: e.target.value})}
                                >
                                    <option value="Sangat Baik">Sangat Baik</option>
                                    <option value="Baik">Baik</option>
                                    <option value="Terdapat Cacat Fisik">Terdapat Cacat Fisik</option>
                                </select>
                            </div>
                        </div>

                        <div className="px-8 pb-8 pt-2 bg-white flex justify-end gap-3">
                            <Button type="button" variant="ghost" onClick={() => setIsApproveOpen(false)} className="rounded-xl h-11 px-6">Batal</Button>
                            <Button type="submit" className="bg-[#0093dd] hover:bg-[#007bbd] text-white rounded-xl h-11 px-8 shadow-lg shadow-blue-200/50 font-bold">
                                Konfirmasi Alokasi
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal Reject */}
            <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
                <DialogContent 
                    onInteractOutside={(e) => e.preventDefault()}
                    onEscapeKeyDown={(e) => e.preventDefault()}
                    className="sm:max-w-[450px] p-0 overflow-hidden border-none shadow-2xl rounded-3xl"
                >
                    <form onSubmit={handleReject}>
                        <div className="bg-rose-500 p-8 text-white relative">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold">Tolak Pengajuan</DialogTitle>
                                <DialogDescription className="text-rose-100/90 font-medium">
                                    Berikan alasan penolakan untuk disampaikan kepada pegawai.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="absolute -bottom-6 right-8 w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-rose-500 shadow-lg">
                                <XCircle size={24} />
                            </div>
                        </div>

                        <div className="p-8 space-y-6 bg-white pt-10">
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Alasan Penolakan*</label>
                                <textarea 
                                    required
                                    className="flex w-full min-h-[100px] rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:bg-white transition-all resize-none"
                                    value={rejectForm.alasan_penolakan} 
                                    onChange={(e) => setRejectForm({alasan_penolakan: e.target.value})} 
                                    placeholder="Contoh: Stok unit untuk kategori ini sedang kosong hingga bulan depan..."
                                />
                            </div>
                        </div>

                        <div className="px-8 pb-8 pt-2 bg-white flex justify-end gap-3">
                            <Button type="button" variant="ghost" onClick={() => setIsRejectOpen(false)} className="rounded-xl h-11 px-6">Batal</Button>
                            <Button type="submit" className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl h-11 px-8 shadow-lg shadow-rose-200 font-bold">
                                Tolak Permanen
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal Return */}
            <Dialog open={isReturnOpen} onOpenChange={setIsReturnOpen}>
                <DialogContent 
                    onInteractOutside={(e) => e.preventDefault()}
                    onEscapeKeyDown={(e) => e.preventDefault()}
                    className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl rounded-3xl"
                >
                    <form onSubmit={handleReturn}>
                        <div className="bg-slate-900 p-8 text-white relative">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold">Konfirmasi Pengembalian</DialogTitle>
                                <DialogDescription className="text-slate-400 font-medium">
                                    Serah terima kembali unit <b>{selectedLoan?.asset_nama}</b> ke gudang IT.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="absolute -bottom-6 right-8 w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-900 shadow-lg">
                                <RotateCcw size={24} />
                            </div>
                        </div>

                        <div className="p-8 space-y-6 bg-white pt-10">
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Kondisi Fisik Saat Kembali*</label>
                                <select 
                                    required 
                                    className="flex h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:bg-white transition-all"
                                    value={returnForm.kondisi_kembali}
                                    onChange={(e) => setReturnForm({...returnForm, kondisi_kembali: e.target.value})}
                                >
                                    <option value="Sangat Baik">Sangat Baik</option>
                                    <option value="Baik">Baik</option>
                                    <option value="Terdapat Cacat Fisik">Terdapat Cacat Fisik</option>
                                    <option value="Rusak Ringan">Rusak Ringan</option>
                                    <option value="Rusak Berat">Rusak Berat</option>
                                </select>
                            </div>
                            
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status Aset Selanjutnya*</label>
                                <select 
                                    className="flex h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:bg-white transition-all"
                                    value={returnForm.status_aset_baru}
                                    onChange={(e) => setReturnForm({...returnForm, status_aset_baru: e.target.value})}
                                >
                                    <option value="Tersedia">Kembali Tersedia (Siap dipakai lagi)</option>
                                    <option value="Diperbaiki">Bawa ke Maintenance (Perlu dicek)</option>
                                    <option value="Rusak">Rusak (Tidak bisa dipakai)</option>
                                </select>
                            </div>
                        </div>

                        <div className="px-8 pb-8 pt-2 bg-white flex justify-end gap-3">
                            <Button type="button" variant="ghost" onClick={() => setIsReturnOpen(false)} className="rounded-xl h-11 px-6">Batal</Button>
                            <Button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-11 px-8 shadow-lg shadow-slate-200 font-bold">
                                Simpan Berita Acara
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

        </div>
    );
}
