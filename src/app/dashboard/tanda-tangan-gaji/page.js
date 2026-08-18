"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import {
  fetchMyGajiValidasiList,
  mutationSignGaji,
} from "@/lib/gaji-validasi-gql-client";
import TandaTanganModal from "@/components/penggajian/TandaTanganModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  PenLine,
  CheckCircle2,
  Clock,
  Calendar,
  Banknote,
  Coins,
  Receipt,
  User,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  Info,
  Building2,
  Check,
} from "lucide-react";

const MONTHS = [
  { value: 1, label: "Januari" },
  { value: 2, label: "Februari" },
  { value: 3, label: "Maret" },
  { value: 4, label: "April" },
  { value: 5, label: "Mei" },
  { value: 6, label: "Juni" },
  { value: 7, label: "Juli" },
  { value: 8, label: "Agustus" },
  { value: 9, label: "September" },
  { value: 10, label: "Oktober" },
  { value: 11, label: "November" },
  { value: 12, label: "Desember" },
];

function formatRupiah(amount) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount || 0);
}

function formatDateTime(dateStr) {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(d);
  } catch {
    return dateStr;
  }
}

export default function TandaTanganGajiPage() {
  const currentDate = useMemo(() => new Date(), []);
  const [selectedTahun, setSelectedTahun] = useState(currentDate.getFullYear());
  const [selectedBulan, setSelectedBulan] = useState(currentDate.getMonth() + 1);

  const [activeTab, setActiveTab] = useState("gaji");
  const [gajiItems, setGajiItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal State
  const [selectedItemForSign, setSelectedItemForSign] = useState(null);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);

  // Available years: current year and 3 years before
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 4 }, (_, i) => currentYear - i);
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchMyGajiValidasiList({
        periodeTahun: parseInt(selectedTahun, 10),
        periodeBulan: parseInt(selectedBulan, 10),
      });
      setGajiItems(data || []);
    } catch (err) {
      console.error("Error fetching gaji validasi list:", err);
      toast.error(err.message || "Gagal memuat data slip gaji & validasi");
      setGajiItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedTahun, selectedBulan]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleOpenSignModal = (item) => {
    setSelectedItemForSign(item);
    setIsSignModalOpen(true);
  };

  const handleSubmitSignature = async ({ gaji_id, tanda_tangan, catatan }) => {
    try {
      await mutationSignGaji({
        gajiId: gaji_id || selectedItemForSign?.id,
        tandaTangan: tanda_tangan,
        catatan,
      });

      toast.success("Tanda tangan validasi berhasil disimpan!");
      setIsSignModalOpen(false);
      setSelectedItemForSign(null);
      loadData();
    } catch (err) {
      console.error("Error signing gaji:", err);
      toast.error(err.message || "Gagal menyimpan tanda tangan");
      throw err;
    }
  };

  // Filter items per tab
  const gajiPokokList = useMemo(() => {
    return gajiItems.filter(
      (item) => !item.jenis || item.jenis.toLowerCase() === "gaji"
    );
  }, [gajiItems]);

  const jasaList = useMemo(() => {
    return gajiItems.filter(
      (item) => item.jenis && item.jenis.toLowerCase() === "jasa"
    );
  }, [gajiItems]);

  // Count pending validation across all
  const pendingCount = useMemo(() => {
    return gajiItems.filter((i) => !i.isValidated).length;
  }, [gajiItems]);

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-5 md:p-6 space-y-4 sm:space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-4 sm:p-5 md:p-6 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600 shrink-0 mt-0.5 sm:mt-0">
            <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 tracking-tight font-figtree">
              Tanda Tangan Gaji & Jasa
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5">
              RS Bhayangkara Nganjuk &bull; Portal Validasi Hak Penerimaan Pegawai
            </p>
          </div>
        </div>

        {/* Responsive Filter Toolbar */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-2.5 w-full md:w-auto">
          {/* Dropdown Bulan */}
          <div className="col-span-1 sm:w-36">
            <Select
              value={String(selectedBulan)}
              onValueChange={(val) => setSelectedBulan(Number(val))}
            >
              <SelectTrigger
                aria-label="Pilih Bulan Penggajian"
                className="h-10 sm:h-9 bg-slate-50 border-slate-200 text-xs font-medium text-slate-700 w-full"
              >
                <Calendar className="h-3.5 w-3.5 text-slate-400 mr-1 shrink-0" />
                <SelectValue placeholder="Pilih Bulan" />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m) => (
                  <SelectItem key={m.value} value={String(m.value)} className="text-xs">
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dropdown Tahun */}
          <div className="col-span-1 sm:w-28">
            <Select
              value={String(selectedTahun)}
              onValueChange={(val) => setSelectedTahun(Number(val))}
            >
              <SelectTrigger
                aria-label="Pilih Tahun Penggajian"
                className="h-10 sm:h-9 bg-slate-50 border-slate-200 text-xs font-medium text-slate-700 w-full"
              >
                <SelectValue placeholder="Tahun" />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((y) => (
                  <SelectItem key={y} value={String(y)} className="text-xs">
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading || refreshing}
            aria-label="Segarkan data slip gaji dan jasa"
            className="col-span-2 sm:col-span-1 h-10 sm:h-9 px-3 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs w-full sm:w-auto justify-center"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 mr-1.5 ${refreshing ? "animate-spin" : ""}`}
            />
            <span>Segarkan</span>
          </Button>
        </div>
      </div>

      {/* Summary Status Strip */}
      {!loading && gajiItems.length > 0 && (
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <Receipt className="h-4 w-4 text-cyan-600 shrink-0" />
            <span className="truncate">
              Periode:{" "}
              <strong className="text-slate-900">
                {MONTHS.find((m) => m.value === selectedBulan)?.label} {selectedTahun}
              </strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            {pendingCount > 0 ? (
              <span className="inline-flex items-center gap-1.5 text-amber-700 font-semibold bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full text-[11px]">
                <Clock className="h-3 w-3 shrink-0" /> {pendingCount} slip belum ditandatangani
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full text-[11px]">
                <Check className="h-3 w-3 shrink-0" /> Semua slip telah divalidasi
              </span>
            )}
          </div>
        </div>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-slate-100 p-1 border border-slate-200 rounded-xl w-full sm:w-auto grid grid-cols-2 sm:inline-flex h-auto">
          <TabsTrigger
            value="gaji"
            className="flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:text-cyan-700 data-[state=active]:shadow-xs px-3 sm:px-4 py-2.5 sm:py-2 text-xs font-semibold text-slate-600 transition-all rounded-lg"
          >
            <Banknote className="h-4 w-4 text-cyan-600 shrink-0" />
            <span>Gaji Pokok</span>
            <span className="ml-1 text-[10px] px-2 py-0.5 rounded-full bg-cyan-100/70 text-cyan-800 font-bold">
              {gajiPokokList.length}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="jasa"
            className="flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:text-cyan-700 data-[state=active]:shadow-xs px-3 sm:px-4 py-2.5 sm:py-2 text-xs font-semibold text-slate-600 transition-all rounded-lg"
          >
            <Coins className="h-4 w-4 text-cyan-600 shrink-0" />
            <span>Jasa Pelayanan</span>
            <span className="ml-1 text-[10px] px-2 py-0.5 rounded-full bg-cyan-100/70 text-cyan-800 font-bold">
              {jasaList.length}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="gaji" className="space-y-4 focus-visible:outline-none">
          <GajiSectionContent
            items={gajiPokokList}
            type="Gaji Pokok"
            loading={loading}
            selectedBulan={selectedBulan}
            selectedTahun={selectedTahun}
            onSign={handleOpenSignModal}
          />
        </TabsContent>

        <TabsContent value="jasa" className="space-y-4 focus-visible:outline-none">
          <GajiSectionContent
            items={jasaList}
            type="Jasa Pelayanan"
            loading={loading}
            selectedBulan={selectedBulan}
            selectedTahun={selectedTahun}
            onSign={handleOpenSignModal}
          />
        </TabsContent>
      </Tabs>

      {/* Tanda Tangan Modal */}
      {selectedItemForSign && (
        <TandaTanganModal
          open={isSignModalOpen}
          onOpenChange={(open) => {
            setIsSignModalOpen(open);
            if (!open) setSelectedItemForSign(null);
          }}
          gajiData={{
            id: selectedItemForSign.id,
            nama: selectedItemForSign.namaPegawai,
            namaPegawai: selectedItemForSign.namaPegawai,
            periode_bulan: selectedItemForSign.periodeBulan,
            periodeBulan: selectedItemForSign.periodeBulan,
            periode_tahun: selectedItemForSign.periodeTahun,
            periodeTahun: selectedItemForSign.periodeTahun,
            jenis:
              selectedItemForSign.jenis ||
              (activeTab === "gaji" ? "Gaji Pokok" : "Jasa Pelayanan"),
            gaji:
              activeTab === "gaji"
                ? selectedItemForSign.nominal ?? selectedItemForSign.gapok
                : selectedItemForSign.nominal ?? selectedItemForSign.jasaDasar,
            nominal:
              activeTab === "gaji"
                ? selectedItemForSign.nominal ?? selectedItemForSign.gapok
                : selectedItemForSign.nominal ?? selectedItemForSign.jasaDasar,
          }}
          onSubmit={handleSubmitSignature}
        />
      )}
    </div>
  );
}

function GajiSectionContent({
  items,
  type,
  loading,
  selectedBulan,
  selectedTahun,
  onSign,
}) {
  const bulanName = MONTHS.find((m) => m.value === selectedBulan)?.label;

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <Card key={i} className="animate-pulse border border-slate-200 bg-white rounded-xl">
            <CardHeader className="space-y-2 p-4 sm:p-5">
              <div className="h-5 bg-slate-200 rounded w-1/3"></div>
              <div className="h-4 bg-slate-100 rounded w-1/2"></div>
            </CardHeader>
            <CardContent className="space-y-3 p-4 sm:p-5 pt-0 sm:pt-0">
              <div className="h-12 bg-slate-100 rounded"></div>
              <div className="h-8 bg-slate-200 rounded w-1/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <Card className="border-dashed border-2 border-slate-200 p-8 sm:p-12 text-center bg-slate-50/50 rounded-xl">
        <div className="flex flex-col items-center justify-center max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800 font-figtree">
            Tidak Ada Data {type}
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Belum ada catatan slip {type.toLowerCase()} untuk periode{" "}
            <span className="font-semibold text-slate-700">
              {bulanName} {selectedTahun}
            </span>
            . Data slip akan ditampilkan setelah diterbitkan oleh bagian Keuangan.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
      {items.map((item) => {
        const nominalValue =
          type === "Gaji Pokok"
            ? item.gapok ?? item.nominal
            : item.jasaDasar ?? item.nominal;

        return (
          <Card
            key={item.id}
            className={`transition-all duration-200 bg-white rounded-xl border ${
              item.isValidated
                ? "border-emerald-200 shadow-xs hover:border-emerald-300"
                : "border-slate-200 shadow-xs hover:border-cyan-300"
            }`}
          >
            <CardHeader className="p-4 sm:p-5 pb-3 border-b border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 sm:gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-slate-400 shrink-0" />
                    <CardTitle className="text-sm font-bold text-slate-900 font-figtree truncate">
                      {item.namaPegawai || "Pegawai"}
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs text-slate-500 font-medium">
                    NIK: {item.nik || "-"} &bull; Periode:{" "}
                    <span className="font-semibold text-slate-700">
                      {MONTHS.find((m) => m.value === item.periodeBulan)?.label ||
                        item.periodeBulan}{" "}
                      {item.periodeTahun}
                    </span>
                  </CardDescription>
                </div>

                <div className="self-start">
                  {item.isValidated ? (
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1 bg-emerald-50 text-emerald-700 border-emerald-200 px-2.5 py-0.5 text-[11px] font-semibold"
                    >
                      <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
                      Sudah Divalidasi
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1 bg-amber-50 text-amber-700 border-amber-200 px-2.5 py-0.5 text-[11px] font-semibold"
                    >
                      <Clock className="h-3 w-3 text-amber-600 shrink-0" />
                      Belum Ditandatangani
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-5 pt-4 space-y-4">
              {/* Nominal Detail */}
              <div className="bg-slate-50 p-3 sm:p-3.5 rounded-lg border border-slate-200/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 sm:p-2.5 rounded-lg bg-cyan-100/60 text-cyan-700 border border-cyan-200/60 shrink-0">
                    <Banknote className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500 font-medium">
                      Nominal {type}
                    </div>
                    <div className="text-base sm:text-lg font-bold text-slate-900 font-figtree tracking-tight">
                      {formatRupiah(nominalValue)}
                    </div>
                  </div>
                </div>

                {item.nominal && item.gapok && item.nominal !== item.gapok && (
                  <div className="text-right shrink-0">
                    <div className="text-[10px] text-slate-400 font-medium">
                      Total Penerimaan
                    </div>
                    <div className="text-xs font-bold text-slate-700 font-figtree">
                      {formatRupiah(item.nominal)}
                    </div>
                  </div>
                )}
              </div>

              {/* Status Section */}
              {item.isValidated ? (
                <div className="bg-emerald-50/40 border border-emerald-100 rounded-lg p-3 sm:p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-emerald-800 border-b border-emerald-200/50 pb-2">
                    <span className="flex items-center gap-1.5 font-semibold text-[11px]">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      Tanda Terima Sah
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {formatDateTime(item.signedAt)}
                    </span>
                  </div>

                  {item.tandaTangan && (
                    <div className="space-y-1">
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                        Spesimen Tanda Tangan:
                      </div>
                      <div className="bg-white rounded-lg border border-slate-200 p-2 flex justify-center items-center h-20 sm:h-24 overflow-hidden shadow-2xs">
                        <img
                          src={item.tandaTangan}
                          alt="Tanda Tangan Digital"
                          className="max-h-full object-contain"
                        />
                      </div>
                    </div>
                  )}

                  {item.catatan && (
                    <div className="text-xs text-slate-600 bg-white p-2 rounded border border-slate-100">
                      <span className="font-semibold text-slate-700">Catatan: </span>
                      {item.catatan}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-start gap-2 p-2.5 bg-amber-50/60 rounded-lg border border-amber-200/60 text-xs text-amber-900">
                    <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      Mohon periksa kesesuaian nominal sebelum melakukan pengesahan digital.
                    </span>
                  </div>

                  <Button
                    onClick={() => onSign(item)}
                    className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-xs flex items-center justify-center gap-2 py-2.5 h-10 sm:h-9 rounded-lg shadow-xs transition-colors"
                  >
                    <PenLine className="h-3.5 w-3.5" />
                    Tanda Tangani {type}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
