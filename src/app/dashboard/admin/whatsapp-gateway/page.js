"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  MessageSquare,
  QrCode,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  LogOut,
  Send,
  Smartphone,
  Loader2,
  ArrowLeft,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const QUICK_TEMPLATES = [
  {
    label: "Uji Coba Umum",
    text: "Halo, ini pesan uji coba WhatsApp Gateway SDM RS Bhayangkara Nganjuk.",
  },
  {
    label: "Format OTP",
    text: "[RS Bhayangkara Nganjuk]\nKode verifikasi Anda adalah: 849201.\nJangan bagikan kode ini kepada siapa pun.",
  },
  {
    label: "Format Registrasi",
    text: "*BUKTI REGISTRASI ONLINE*\nRS Bhayangkara Nganjuk\nNo. RM: 123456\nNama: PASIEN UJI COBA\nStatus: Terverifikasi",
  },
];

export default function WhatsAppGatewayPage() {
  const [gatewayData, setGatewayData] = useState({
    state: "DISCONNECTED",
    qrCodeDataUrl: null,
    phone: null,
    pushname: null,
    updatedAt: null,
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  // Test message form state
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState(QUICK_TEMPLATES[0].text);
  const [sendingTest, setSendingTest] = useState(false);

  const pollTimerRef = useRef(null);

  const fetchStatus = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const res = await fetch("/api/admin/whatsapp-gateway");
      const json = await res.json();
      const statusObj =
        json?.data?.data?.state !== undefined
          ? json.data.data
          : json?.data?.state !== undefined
          ? json.data
          : json?.state !== undefined
          ? json
          : null;

      if (statusObj) {
        setGatewayData(statusObj);
      }
    } catch (err) {
      if (!isSilent) {
        toast.error("Gagal memuat status WhatsApp Gateway");
      }
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Polling logic: 3s if SCAN_QR or INITIALIZING, 15s if READY
  useEffect(() => {
    const currentState = gatewayData.state;
    if (currentState === "SCAN_QR" || currentState === "INITIALIZING") {
      pollTimerRef.current = setInterval(() => {
        fetchStatus(true);
      }, 3000);
    } else if (currentState === "READY") {
      pollTimerRef.current = setInterval(() => {
        fetchStatus(true);
      }, 15000);
    }

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [gatewayData.state, fetchStatus]);

  const handleInitialize = async () => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/whatsapp-gateway?action=initialize", {
        method: "POST",
      });
      const json = await res.json();
      const message =
        json?.data?.message || json?.message || "Inisialisasi client sedang diproses...";
      const errorMsg = json?.data?.error || json?.error || json?.message;

      if (res.ok) {
        toast.info(message);
        fetchStatus(true);
      } else {
        toast.error(errorMsg || "Gagal menginisialisasi WhatsApp client");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan saat inisialisasi");
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogoutConfirm = async () => {
    setLogoutDialogOpen(false);
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/whatsapp-gateway?action=logout", {
        method: "POST",
      });
      const json = await res.json();
      const message = json?.data?.message || json?.message || "Sesi WhatsApp berhasil diputus.";
      const errorMsg = json?.data?.error || json?.error || json?.message;

      if (res.ok) {
        toast.success(message);
        fetchStatus(true);
      } else {
        toast.error(errorMsg || "Gagal memutuskan sesi WhatsApp");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan saat logout");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendTest = async (e) => {
    if (e) e.preventDefault();
    if (!testPhone.trim() || !testMessage.trim()) {
      toast.warning("Nomor tujuan dan pesan wajib diisi");
      return;
    }

    setSendingTest(true);
    try {
      const res = await fetch("/api/admin/whatsapp-gateway?action=send-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: testPhone.trim(), message: testMessage.trim() }),
      });
      const json = await res.json();
      const message = json?.data?.message || json?.message || "Pesan uji coba berhasil dikirim!";
      const errorMsg = json?.data?.error || json?.error || json?.message;

      if (res.ok) {
        toast.success(message);
      } else {
        toast.error(errorMsg || "Gagal mengirim pesan uji coba");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan saat mengirim pesan uji coba");
    } finally {
      setSendingTest(false);
    }
  };

  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      if (gatewayData.state === "READY" && !sendingTest) {
        handleSendTest();
      }
    }
  };

  const renderStatusBadge = () => {
    switch (gatewayData.state) {
      case "READY":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Terhubung (READY)
          </span>
        );
      case "SCAN_QR":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
            <QrCode className="w-3.5 h-3.5 text-amber-600" />
            Menunggu Scan QR
          </span>
        );
      case "INITIALIZING":
      case "AUTHENTICATING":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
            <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
            {gatewayData.state === "AUTHENTICATING" ? "Memverifikasi Kredensial..." : "Menyiapkan Layanan..."}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
            <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
            Terputus (DISCONNECTED)
          </span>
        );
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6">
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <Link
            href="/dashboard/admin/settings"
            className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 transition-colors mb-2 min-h-[36px] focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-md outline-none"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali ke Pengaturan
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-200 shadow-sm">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">WhatsApp Gateway</h1>
              <p className="text-sm text-slate-600">
                Pusat kontrol gateway pengiriman pesan resmi Rumah Sakit Bhayangkara Nganjuk
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchStatus(false)}
            disabled={loading || actionLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors shadow-sm disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 outline-none"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Muat Ulang
          </button>

          {gatewayData.state !== "DISCONNECTED" && (
            <button
              type="button"
              onClick={() => setLogoutDialogOpen(true)}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 text-sm font-medium transition-colors shadow-sm disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 outline-none"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
              Putuskan Sesi
            </button>
          )}
        </div>
      </div>

      {/* Main Connection Status Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4 mb-5">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Status Koneksi Gateway</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Sinkronisasi terakhir: {gatewayData.updatedAt ? new Date(gatewayData.updatedAt).toLocaleString("id-ID") : "-"}
            </p>
          </div>
          <div role="status" aria-live="polite">{renderStatusBadge()}</div>
        </div>

        {/* Scan QR Section */}
        {gatewayData.state === "SCAN_QR" && gatewayData.qrCodeDataUrl && (
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 py-4">
            <div className="p-4 bg-white border-2 border-dashed border-emerald-500 rounded-2xl shadow-sm relative">
              <img
                src={gatewayData.qrCodeDataUrl}
                alt="Kode QR WhatsApp Gateway untuk ditautkan"
                width={256}
                height={256}
                className="w-64 h-64 object-contain rounded-lg"
              />
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-emerald-600 text-white text-[11px] font-medium rounded-full shadow-sm flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-200 animate-ping" />
                QR Siap Dipindai
              </div>
            </div>
            <div className="max-w-md space-y-3.5">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <QrCode className="w-5 h-5 text-emerald-600" />
                Pindai Kode QR dengan WhatsApp Resmi
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-slate-700 leading-relaxed">
                <li>Buka aplikasi <strong>WhatsApp</strong> di ponsel resmi RS.</li>
                <li>Pilih <strong>Menu Titik Tiga</strong> (Android) atau <strong>Pengaturan</strong> (iPhone).</li>
                <li>Ketuk menu <strong>Perangkat Tertaut (Linked Devices)</strong>.</li>
                <li>Ketuk <strong>Tautkan Perangkat</strong> dan arahkan kamera ke kode QR ini.</li>
              </ol>
              <div className="text-xs text-amber-800 bg-amber-50 p-3 rounded-lg border border-amber-200 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  Kode QR akan otomatis diperbarui secara berkala oleh server jika belum dipindai dalam batas waktu.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Connected Details */}
        {gatewayData.state === "READY" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-2">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3.5">
              <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-lg">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Nomor WhatsApp Terhubung</p>
                <p className="text-base font-semibold text-slate-900">+{gatewayData.phone || "-"}</p>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3.5">
              <div className="p-2.5 bg-sky-100 text-sky-700 rounded-lg">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Nama Akun WhatsApp</p>
                <p className="text-base font-semibold text-slate-900">{gatewayData.pushname || "-"}</p>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3.5">
              <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-lg">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Status Penyimpanan Sesi</p>
                <p className="text-base font-semibold text-slate-900">Tersimpan Aman di Server</p>
              </div>
            </div>
          </div>
        )}

        {/* Initializing State */}
        {gatewayData.state === "INITIALIZING" && (
          <div className="text-center py-12">
            <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mx-auto mb-3" />
            <p className="font-semibold text-slate-900">Menyiapkan Layanan WhatsApp di Server...</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Server sedang menyiapkan runtime perpesanan. Kode QR akan otomatis tampil beberapa detik lagi.
            </p>
          </div>
        )}

        {/* Disconnected State - Co-located CTA */}
        {gatewayData.state === "DISCONNECTED" && (
          <div className="text-center py-10 px-4 max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <MessageSquare className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">WhatsApp Gateway Belum Terhubung</h3>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              Hubungkan nomor resmi rumah sakit untuk mengaktifkan pengiriman OTP pasien, bukti registrasi poliklinik, dan notifikasi kepegawaian otomatis.
            </p>
            <button
              type="button"
              onClick={handleInitialize}
              disabled={actionLoading}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 text-sm font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50 min-h-[44px] focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 outline-none"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Memulai Inisialisasi...
                </>
              ) : (
                <>
                  <QrCode className="w-4 h-4" />
                  Hubungkan WhatsApp Sekarang
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Test Message Box */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5 text-slate-700" />
            <h2 className="text-base font-semibold text-slate-900">Uji Coba Kirim Pesan</h2>
          </div>
          <span className="text-xs text-slate-500">Shortcut: Tekan <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-[11px] font-mono">Cmd/Ctrl + Enter</kbd> untuk kirim</span>
        </div>

        {/* Quick Template Chips */}
        <div className="mb-4">
          <p className="text-xs font-medium text-slate-600 mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Template Pesan Cepat:
          </p>
          <div className="flex flex-wrap gap-2">
            {QUICK_TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.label}
                type="button"
                onClick={() => setTestMessage(tmpl.text)}
                disabled={gatewayData.state !== "READY" || sendingTest}
                className="px-3 py-1.5 bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
              >
                {tmpl.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSendTest} onKeyDown={handleKeyDown} className="space-y-4 max-w-2xl">
          <div>
            <label htmlFor="test-phone" className="block text-xs font-medium text-slate-700 mb-1">
              Nomor Telepon Tujuan (Contoh: 08123456789 atau 628123456789)
            </label>
            <input
              id="test-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value.replace(/[^0-9+]/g, ""))}
              placeholder="08123456789"
              disabled={gatewayData.state !== "READY" || sendingTest}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 outline-none disabled:bg-slate-50 disabled:text-slate-400"
            />
          </div>

          <div>
            <label htmlFor="test-message" className="block text-xs font-medium text-slate-700 mb-1">
              Pesan Uji Coba
            </label>
            <textarea
              id="test-message"
              rows={3}
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              disabled={gatewayData.state !== "READY" || sendingTest}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 outline-none disabled:bg-slate-50 disabled:text-slate-400"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <p className="text-xs text-slate-500">
              {gatewayData.state !== "READY" && (
                <span className="text-amber-700 font-medium">
                  * Gateway harus berstatus READY agar dapat mengirim pesan.
                </span>
              )}
            </p>
            <button
              type="submit"
              disabled={gatewayData.state !== "READY" || sendingTest}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-semibold transition-colors shadow-sm disabled:opacity-50 min-h-[44px] focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 outline-none"
            >
              {sendingTest ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Kirim Pesan
            </button>
          </div>
        </form>
      </div>

      {/* Accessible Disconnect Confirmation Modal */}
      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-2">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <AlertDialogTitle className="text-slate-900">Putuskan Sesi WhatsApp?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600 text-sm leading-relaxed">
              Tindakan ini akan memutuskan koneksi gateway dan menghapus sesi di server. Semua pengiriman pesan otomatis rumah sakit (OTP pasien, bukti booking, dan notifikasi kepegawaian) akan terhenti hingga perangkat ditautkan kembali.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel disabled={actionLoading} className="focus-visible:ring-2 focus-visible:ring-slate-400">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogoutConfirm}
              disabled={actionLoading}
              className="bg-rose-600 hover:bg-rose-700 text-white focus-visible:ring-2 focus-visible:ring-rose-500"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
              Ya, Putuskan Sesi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
