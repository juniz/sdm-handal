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
} from "lucide-react";
import { toast } from "sonner";

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

  // Test message form state
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState("Halo, ini pesan uji coba WhatsApp Gateway SDM.");
  const [sendingTest, setSendingTest] = useState(false);

  const pollTimerRef = useRef(null);

  const fetchStatus = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const res = await fetch("/api/admin/whatsapp-gateway");
      const json = await res.json();
      if (json.status === "success" && json.data) {
        setGatewayData(json.data);
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
      if (res.ok) {
        toast.info(json.message || "Inisialisasi client sedang diproses...");
        fetchStatus(true);
      } else {
        toast.error(json.error || "Gagal menginisialisasi WhatsApp client");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan saat inisialisasi");
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!window.confirm("Apakah Anda yakin ingin memutuskan koneksi WhatsApp dan menghapus sesi?")) {
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/whatsapp-gateway?action=logout", {
        method: "POST",
      });
      const json = await res.json();
      if (res.ok) {
        toast.success(json.message || "Sesi WhatsApp berhasil diputus.");
        fetchStatus(true);
      } else {
        toast.error(json.error || "Gagal memutuskan sesi WhatsApp");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan saat logout");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendTest = async (e) => {
    e.preventDefault();
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
      if (res.ok) {
        toast.success("Pesan uji coba berhasil dikirim!");
      } else {
        toast.error(json.error || json.message || "Gagal mengirim pesan uji coba");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan saat mengirim pesan uji coba");
    } finally {
      setSendingTest(false);
    }
  };

  const renderStatusBadge = () => {
    switch (gatewayData.state) {
      case "READY":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Terhubung (READY)
          </span>
        );
      case "SCAN_QR":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
            <QrCode className="w-3.5 h-3.5 text-amber-600" />
            Menunggu Scan QR
          </span>
        );
      case "INITIALIZING":
      case "AUTHENTICATING":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-300">
            <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
            {gatewayData.state === "AUTHENTICATING" ? "Mengotentikasi..." : "Menginisialisasi Browser..."}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-300">
            <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
            Terputus (DISCONNECTED)
          </span>
        );
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <Link
            href="/dashboard/admin/settings"
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali ke Pengaturan
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-200">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">WhatsApp Gateway</h1>
              <p className="text-sm text-slate-500">
                Kelola sesi whatsapp-web.js untuk gateway pesan resmi rumah sakit
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchStatus(false)}
            disabled={loading || actionLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Muat Ulang
          </button>

          {gatewayData.state === "DISCONNECTED" ? (
            <button
              onClick={handleInitialize}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
            >
              {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Hubungkan WhatsApp
            </button>
          ) : (
            <button
              onClick={handleLogout}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
              Putuskan Sesi
            </button>
          )}
        </div>
      </div>

      {/* Status Card */}
      <div className="bg-white border rounded-xl p-6 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 mb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-800">Status Koneksi</h2>
            <p className="text-xs text-slate-500">
              Terakhir diperbarui: {gatewayData.updatedAt ? new Date(gatewayData.updatedAt).toLocaleString("id-ID") : "-"}
            </p>
          </div>
          <div>{renderStatusBadge()}</div>
        </div>

        {/* Scan QR Section */}
        {gatewayData.state === "SCAN_QR" && gatewayData.qrCodeDataUrl && (
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 py-4">
            <div className="p-4 bg-white border-2 border-dashed border-emerald-400 rounded-2xl shadow-sm">
              <img
                src={gatewayData.qrCodeDataUrl}
                alt="WhatsApp QR Code"
                className="w-64 h-64 object-contain rounded-lg"
              />
            </div>
            <div className="max-w-md space-y-3">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <QrCode className="w-5 h-5 text-emerald-600" />
                Pindai Kode QR dengan WhatsApp
              </h3>
              <ol className="list-decimal list-inside space-y-1.5 text-sm text-slate-600 leading-relaxed">
                <li>Buka aplikasi <strong>WhatsApp</strong> di ponsel resmi RS.</li>
                <li>Buka menu <strong>Titik Tiga</strong> (Android) atau <strong>Pengaturan</strong> (iPhone).</li>
                <li>Pilih <strong>Perangkat Tertaut (Linked Devices)</strong>.</li>
                <li>Ketuk <strong>Tautkan Perangkat</strong> dan arahkan kamera ke kode QR ini.</li>
              </ol>
              <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                Kode QR akan diperbarui secara otomatis setiap beberapa detik jika kedaluwarsa.
              </p>
            </div>
          </div>
        )}

        {/* Connected Details */}
        {gatewayData.state === "READY" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-2">
            <div className="p-4 bg-slate-50 border rounded-lg flex items-center gap-3">
              <Smartphone className="w-8 h-8 text-emerald-600" />
              <div>
                <p className="text-xs text-slate-500">Nomor WhatsApp Terhubung</p>
                <p className="text-base font-semibold text-slate-800">+{gatewayData.phone || "-"}</p>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border rounded-lg flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-sky-600" />
              <div>
                <p className="text-xs text-slate-500">Nama Akun WhatsApp</p>
                <p className="text-base font-semibold text-slate-800">{gatewayData.pushname || "-"}</p>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border rounded-lg flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              <div>
                <p className="text-xs text-slate-500">Mode Sesi</p>
                <p className="text-base font-semibold text-slate-800">LocalAuth (Persistent)</p>
              </div>
            </div>
          </div>
        )}

        {/* Initializing State */}
        {gatewayData.state === "INITIALIZING" && (
          <div className="text-center py-10">
            <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mx-auto mb-3" />
            <p className="font-medium text-slate-800">Menjalankan Puppeteer Browser...</p>
            <p className="text-xs text-slate-500 mt-1">Harap tunggu, kode QR akan muncul sebentar lagi.</p>
          </div>
        )}

        {/* Disconnected State */}
        {gatewayData.state === "DISCONNECTED" && (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <MessageSquare className="w-6 h-6" />
            </div>
            <p className="font-medium text-slate-700">WhatsApp Gateway Sedang Tidak Aktif</p>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Klik tombol &quot;Hubungkan WhatsApp&quot; di kanan atas untuk memulai inisialisasi browser dan menampilkan kode QR login.
            </p>
          </div>
        )}
      </div>

      {/* Test Message Box */}
      <div className="bg-white border rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4 border-b pb-3">
          <Send className="w-5 h-5 text-slate-700" />
          <h2 className="text-base font-semibold text-slate-800">Uji Coba Kirim Pesan WhatsApp</h2>
        </div>
        <form onSubmit={handleSendTest} className="space-y-4 max-w-2xl">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Nomor Telepon Tujuan (Contoh: 08123456789 atau 628123456789)
            </label>
            <input
              type="text"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              placeholder="08123456789"
              disabled={gatewayData.state !== "READY" || sendingTest}
              className="w-full px-3.5 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50 disabled:text-slate-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Pesan Uji Coba
            </label>
            <textarea
              rows={3}
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              disabled={gatewayData.state !== "READY" || sendingTest}
              className="w-full px-3.5 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50 disabled:text-slate-400"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-slate-500">
              {gatewayData.state !== "READY" && (
                <span className="text-amber-600">* Gateway harus berstatus READY untuk dapat mengirim pesan.</span>
              )}
            </p>
            <button
              type="submit"
              disabled={gatewayData.state !== "READY" || sendingTest}
              className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
            >
              {sendingTest ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Kirim Pesan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
