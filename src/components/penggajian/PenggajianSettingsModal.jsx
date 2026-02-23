"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function PenggajianSettingsModal({ isOpen, onClose }) {
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [formData, setFormData] = useState({
        karumkit_nama: "",
        karumkit_pangkat: "",
        karumkit_nip: "",
        bendahara_nama: "",
        bendahara_pangkat: "",
        bendahara_nip: "",
        bpjs_kesehatan_nominal: 0,
        bpjs_ketenagakerjaan_nominal: 0,
    });

    useEffect(() => {
        if (isOpen) {
            fetchSettings();
        }
    }, [isOpen]);

    const fetchSettings = async () => {
        setFetching(true);
        try {
            const response = await fetch("/api/penggajian-settings");
            const result = await response.json();
            if (result.status === "success" && result.data) {
                setFormData({
                    karumkit_nama: result.data.karumkit_nama || "",
                    karumkit_pangkat: result.data.karumkit_pangkat || "",
                    karumkit_nip: result.data.karumkit_nip || "",
                    bendahara_nama: result.data.bendahara_nama || "",
                    bendahara_pangkat: result.data.bendahara_pangkat || "",
                    bendahara_nip: result.data.bendahara_nip || "",
                    bpjs_kesehatan_nominal: result.data.bpjs_kesehatan_nominal || 0,
                    bpjs_ketenagakerjaan_nominal: result.data.bpjs_ketenagakerjaan_nominal || 0,
                });
            }
        } catch (error) {
            console.error("Error fetching settings:", error);
            toast.error("Gagal mengambil data pengaturan");
        } finally {
            setFetching(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name.includes("nominal") ? parseFloat(value) || 0 : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await fetch("/api/penggajian-settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            const result = await response.json();
            if (result.status === "success") {
                toast.success("Pengaturan berhasil disimpan");
                onClose();
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error("Error saving settings:", error);
            toast.error(error.message || "Gagal menyimpan pengaturan");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Pengaturan Penggajian</DialogTitle>
                </DialogHeader>

                {fetching ? (
                    <div className="py-8 text-center animate-pulse text-gray-500">
                        Mengambil data...
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Karumkit Section */}
                            <div className="space-y-4">
                                <h3 className="font-semibold text-sm text-blue-600 border-b pb-1">Data Karumkit</h3>
                                <div className="space-y-2">
                                    <Label htmlFor="karumkit_nama">Nama Lengkap</Label>
                                    <Input
                                        id="karumkit_nama"
                                        name="karumkit_nama"
                                        value={formData.karumkit_nama}
                                        onChange={handleChange}
                                        placeholder="Nama Karumkit"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="karumkit_pangkat">Pangkat/Gelar</Label>
                                    <Input
                                        id="karumkit_pangkat"
                                        name="karumkit_pangkat"
                                        value={formData.karumkit_pangkat}
                                        onChange={handleChange}
                                        placeholder="e.g. AJUN KOMISARIS BESAR POLISI"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="karumkit_nip">NIP / NRP</Label>
                                    <Input
                                        id="karumkit_nip"
                                        name="karumkit_nip"
                                        value={formData.karumkit_nip}
                                        onChange={handleChange}
                                        placeholder="e.g. 76030927"
                                    />
                                </div>
                            </div>

                            {/* Bendahara Section */}
                            <div className="space-y-4">
                                <h3 className="font-semibold text-sm text-green-600 border-b pb-1">Data Bendahara</h3>
                                <div className="space-y-2">
                                    <Label htmlFor="bendahara_nama">Nama Lengkap</Label>
                                    <Input
                                        id="bendahara_nama"
                                        name="bendahara_nama"
                                        value={formData.bendahara_nama}
                                        onChange={handleChange}
                                        placeholder="Nama Bendahara"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="bendahara_pangkat">Pangkat/Gelar</Label>
                                    <Input
                                        id="bendahara_pangkat"
                                        name="bendahara_pangkat"
                                        value={formData.bendahara_pangkat}
                                        onChange={handleChange}
                                        placeholder="e.g. PENDA"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="bendahara_nip">NIP / NRP</Label>
                                    <Input
                                        id="bendahara_nip"
                                        name="bendahara_nip"
                                        value={formData.bendahara_nip}
                                        onChange={handleChange}
                                        placeholder="e.g. 197801202014122001"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* BPJS Section */}
                        <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                            <h3 className="font-semibold text-sm text-gray-700">Potongan BPJS (Nominal Tetap)</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="bpjs_kesehatan_nominal">BPJS Kesehatan</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2 text-gray-500 text-sm">Rp</span>
                                        <Input
                                            id="bpjs_kesehatan_nominal"
                                            name="bpjs_kesehatan_nominal"
                                            type="number"
                                            className="pl-9"
                                            value={formData.bpjs_kesehatan_nominal}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="bpjs_ketenagakerjaan_nominal">BPJS Ketenagakerjaan</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2 text-gray-500 text-sm">Rp</span>
                                        <Input
                                            id="bpjs_ketenagakerjaan_nominal"
                                            name="bpjs_ketenagakerjaan_nominal"
                                            type="number"
                                            className="pl-9"
                                            value={formData.bpjs_ketenagakerjaan_nominal}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
                                Batal
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? "Menyimpan..." : "Simpan Perubahan"}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
