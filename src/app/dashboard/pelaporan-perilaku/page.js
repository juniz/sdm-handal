"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ShieldAlert,
  AlertTriangle,
  FileText,
  History,
  Send,
  User,
  Users,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  Filter,
  Eye,
  Edit3,
  Lock,
  Info,
  RefreshCw,
  Paperclip,
  UploadCloud,
  Trash2,
  Printer,
  ShieldCheck,
  Flame,
  FileCheck,
  HelpCircle,
  ExternalLink,
  ZoomIn,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Volume2,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

import { DatePicker } from "@/components/DatePicker";
import { PegawaiCombobox } from "@/components/PegawaiCombobox";
import { DepartemenCombobox } from "@/components/DepartemenCombobox";

import {
  fetchMyPelaporanPerilaku,
  fetchAdminPelaporanPerilaku,
  createPelaporanPerilakuMutation,
  updateStatusPelaporanPerilakuMutation,
} from "@/lib/pelaporan-perilaku-gql-client";

// List kategori perilaku yang tidak diinginkan
const KATEGORI_PERILAKU = [
  { id: "Pelecehan Seksual", label: "Pelecehan Seksual", desc: "Tindakan, ucapan, atau gestur bermuatan seksual tanpa persetujuan" },
  { id: "Pelecehan Verbal", label: "Pelecehan Verbal", desc: "Penghinaan, kata-kata kasar, atau intimidasi verbal" },
  { id: "Perundungan / Bullying", label: "Perundungan / Bullying", desc: "Perilaku merendahkan, mengucilkan, atau menindas rekan kerja" },
  { id: "Kekerasan Fisik", label: "Kekerasan Fisik", desc: "Tindakan pemukulan, dorongan, atau ancaman fisik" },
  { id: "Diskriminasi", label: "Diskriminasi", desc: "Perlakuan tidak adil berbasis SARA, gender, atau latar belakang" },
  { id: "Penyalahgunaan Wewenang", label: "Penyalahgunaan Wewenang", desc: "Pemaksaan tugas di luar prosedur atau penyalahgunaan kekuasaan" },
  { id: "Pelanggaran Disiplin & Etika", label: "Pelanggaran Disiplin & Etika", desc: "Pelanggaran SOP rumah sakit, kode etik profesi, atau integritas" },
  { id: "Lainnya", label: "Lainnya", desc: "Bentuk perilaku tidak pantas lainnya yang mengganggu lingkungan kerja" },
];

const TINGKAT_URGENSI = [
  { id: "Rendah", label: "Rendah", desc: "Ketidaknyamanan ringan / pelanggaran etika minor", color: "text-slate-700 bg-slate-100 border-slate-300" },
  { id: "Sedang", label: "Sedang", desc: "Insiden mengganggu kinerja / pelanggaran SOP", color: "text-sky-800 bg-sky-50 border-sky-300" },
  { id: "Tinggi", label: "Tinggi", desc: "Pelecehan berat, intimidasi, atau perundungan berulang", color: "text-amber-800 bg-amber-50 border-amber-300" },
  { id: "Kritis", label: "Kritis", desc: "Kekerasan fisik, ancaman keselamatan, atau darurat", color: "text-rose-800 bg-rose-50 border-rose-300" },
];

const DRAFT_STORAGE_KEY = "sdm_draft_pelaporan_perilaku";

function getStepperClass(stepNumber, currentStatus) {
  const base = "p-2 rounded-lg border ";
  if (stepNumber === 1) {
    if (currentStatus) {
      return base + "bg-sky-100 border-sky-200 text-sky-900 font-semibold";
    }
    return base + "bg-white border-slate-200 text-slate-500";
  }
  if (stepNumber === 2) {
    if (currentStatus === "Sedang Diinvestigasi" || currentStatus === "Selesai") {
      return base + "bg-sky-100 border-sky-200 text-sky-900 font-semibold";
    }
    return base + "bg-white border-slate-200 text-slate-500";
  }
  if (stepNumber === 3) {
    if (currentStatus === "Selesai") {
      return base + "bg-sky-100 border-sky-200 text-sky-900 font-semibold";
    }
    return base + "bg-white border-slate-200 text-slate-500";
  }
  if (stepNumber === 4) {
    if (currentStatus === "Selesai") {
      return base + "bg-emerald-100 border-emerald-200 text-emerald-900 font-bold";
    }
    if (currentStatus === "Ditolak") {
      return base + "bg-rose-100 border-rose-200 text-rose-900 font-bold";
    }
    return base + "bg-white border-slate-200 text-slate-500";
  }
  return base + "bg-white border-slate-200 text-slate-500";
}

function isImageAttachment(att) {
  if (!att) return false;
  if (att.type && typeof att.type === "string" && att.type.startsWith("image/")) {
    return true;
  }
  const str = (att.name || att.url || "").toLowerCase();
  return /\.(png|jpe?g|webp|gif|svg|bmp)$/i.test(str);
}

function isAudioAttachment(att) {
  if (!att) return false;
  if (att.type && typeof att.type === "string" && att.type.startsWith("audio/")) {
    return true;
  }
  const str = (att.name || att.url || "").toLowerCase();
  return /\.(mp3|wav|m4a|ogg|aac|wma)$/i.test(str);
}

export default function PelaporanPerilakuPage() {
  const [activeTab, setActiveTab] = useState("form");
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [previewImageList, setPreviewImageList] = useState([]);
  const [previewImageIndex, setPreviewImageIndex] = useState(0);

  // Form State
  const [tanggal, setTanggal] = useState(null);
  const [jenisPerilaku, setJenisPerilaku] = useState("");
  const [tingkatUrgensi, setTingkatUrgensi] = useState("Sedang");
  const [tingkatKerahasiaan, setTingkatKerahasiaan] = useState("Standar");

  const [unitKerja, setUnitKerja] = useState("");
  const [unitKerjaCustom, setUnitKerjaCustom] = useState("");
  const [isUnitKerjaManual, setIsUnitKerjaManual] = useState(false);

  const [pelakuType, setPelakuType] = useState("pegawai"); // "pegawai" | "external"
  const [pelakuPegawaiNik, setPelakuPegawaiNik] = useState("");
  const [pelakuManualNama, setPelakuManualNama] = useState("");

  const [korbanType, setKorbanType] = useState("diri_sendiri"); // "diri_sendiri" | "pegawai" | "external"
  const [korbanPegawaiNik, setKorbanPegawaiNik] = useState("");
  const [korbanManualNama, setKorbanManualNama] = useState("");

  const [kronologi, setKronologi] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Inline Validation Errors
  const [formErrors, setFormErrors] = useState({});
  const [hasRestoredDraft, setHasRestoredDraft] = useState(false);

  // Master Pegawai List for accurate name/NIK mapping
  const [pegawaiList, setPegawaiList] = useState([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // History State (My Reports)
  const [myReports, setMyReports] = useState([]);
  const [isLoadingMyReports, setIsLoadingMyReports] = useState(false);
  const [selectedDetailReport, setSelectedDetailReport] = useState(null);

  // Admin Management State
  const [adminReports, setAdminReports] = useState([]);
  const [adminStats, setAdminStats] = useState({
    total: 0,
    menungguReview: 0,
    sedangDiinvestigasi: 0,
    selesai: 0,
    ditolak: 0,
  });
  const [isLoadingAdminReports, setIsLoadingAdminReports] = useState(false);
  const [adminFilter, setAdminFilter] = useState({
    search: "",
    status: "all",
    jenisPerilaku: "all",
    tingkatUrgensi: "all",
    startDate: "",
    endDate: "",
  });
  const [selectedAdminReport, setSelectedAdminReport] = useState(null);
  const [statusUpdateForm, setStatusUpdateForm] = useState({
    status: "",
    catatanTindakLanjut: "",
  });
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const formRef = useRef(null);

  // Lightbox Navigation Handlers
  const openImageLightbox = (imageAtt, allAttachments = []) => {
    const images = allAttachments.filter(isImageAttachment);
    const validList = images.length > 0 ? images : [imageAtt];
    const idx = validList.findIndex((img) => img.url === imageAtt.url);
    setPreviewImageList(validList);
    setPreviewImageIndex(idx !== -1 ? idx : 0);
    setPreviewImage(imageAtt);
  };

  const handleNextImage = () => {
    if (!previewImageList.length) return;
    const nextIdx = (previewImageIndex + 1) % previewImageList.length;
    setPreviewImageIndex(nextIdx);
    setPreviewImage(previewImageList[nextIdx]);
  };

  const handlePrevImage = () => {
    if (!previewImageList.length) return;
    const prevIdx = (previewImageIndex - 1 + previewImageList.length) % previewImageList.length;
    setPreviewImageIndex(prevIdx);
    setPreviewImage(previewImageList[prevIdx]);
  };

  useEffect(() => {
    if (!previewImage) return;
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight") {
        handleNextImage();
      } else if (e.key === "ArrowLeft") {
        handlePrevImage();
      } else if (e.key === "Escape") {
        setPreviewImage(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewImage, previewImageIndex, previewImageList]);

  // 1. Load User Info & Pegawai Master List
  useEffect(() => {
    async function checkAuthAndPegawai() {
      try {
        const [authRes, pegRes] = await Promise.all([
          fetch("/api/auth/user"),
          fetch("/api/pegawai"),
        ]);

        if (authRes.ok) {
          const data = await authRes.json();
          const user = data.user;
          setCurrentUser(user);

          const dep = (user?.departemen || user?.jbtn || "").toUpperCase();
          const jbtn = (user?.jbtn || "").toUpperCase();
          const hasAdminAccess =
            dep === "IT" ||
            dep === "SDM" ||
            dep === "HRD" ||
            dep === "SPI" ||
            dep.includes("PERSONALIA") ||
            jbtn.includes("DIREKTUR") ||
            jbtn.includes("KASUBBAG");

          setIsAdmin(hasAdminAccess);
        }

        if (pegRes.ok) {
          const pegData = await pegRes.json();
          if (pegData.status === "success" && Array.isArray(pegData.data)) {
            setPegawaiList(pegData.data);
          }
        }
      } catch (err) {
        console.error("Init data load failed:", err);
      }
    }
    checkAuthAndPegawai();
  }, []);

  // 2. Draft Autosave & Restore (localStorage)
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (savedDraft) {
        const draft = JSON.parse(savedDraft);
        if (draft.tanggal) setTanggal(new Date(draft.tanggal));
        if (draft.jenisPerilaku) setJenisPerilaku(draft.jenisPerilaku);
        if (draft.tingkatUrgensi) setTingkatUrgensi(draft.tingkatUrgensi);
        if (draft.tingkatKerahasiaan) setTingkatKerahasiaan(draft.tingkatKerahasiaan);
        if (draft.unitKerja) setUnitKerja(draft.unitKerja);
        if (draft.unitKerjaCustom) setUnitKerjaCustom(draft.unitKerjaCustom);
        if (draft.isUnitKerjaManual !== undefined) setIsUnitKerjaManual(draft.isUnitKerjaManual);
        if (draft.pelakuType) setPelakuType(draft.pelakuType);
        if (draft.pelakuPegawaiNik) setPelakuPegawaiNik(draft.pelakuPegawaiNik);
        if (draft.pelakuManualNama) setPelakuManualNama(draft.pelakuManualNama);
        if (draft.korbanType) setKorbanType(draft.korbanType);
        if (draft.korbanPegawaiNik) setKorbanPegawaiNik(draft.korbanPegawaiNik);
        if (draft.korbanManualNama) setKorbanManualNama(draft.korbanManualNama);
        if (draft.kronologi) setKronologi(draft.kronologi);
        if (draft.attachments) setAttachments(draft.attachments);
        setHasRestoredDraft(true);
      }
    } catch (e) {
      console.error("Failed to load draft:", e);
    }
  }, []);

  // Save draft on change
  useEffect(() => {
    if (!tanggal && !jenisPerilaku && !kronologi && !unitKerja && attachments.length === 0) {
      return;
    }
    const draft = {
      tanggal: tanggal ? tanggal.toISOString() : null,
      jenisPerilaku,
      tingkatUrgensi,
      tingkatKerahasiaan,
      unitKerja,
      unitKerjaCustom,
      isUnitKerjaManual,
      pelakuType,
      pelakuPegawaiNik,
      pelakuManualNama,
      korbanType,
      korbanPegawaiNik,
      korbanManualNama,
      kronologi,
      attachments,
    };
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    } catch (e) {
      console.error("Autosave draft failed:", e);
    }
  }, [
    tanggal,
    jenisPerilaku,
    tingkatUrgensi,
    tingkatKerahasiaan,
    unitKerja,
    unitKerjaCustom,
    isUnitKerjaManual,
    pelakuType,
    pelakuPegawaiNik,
    pelakuManualNama,
    korbanType,
    korbanPegawaiNik,
    korbanManualNama,
    kronologi,
    attachments,
  ]);

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setTanggal(null);
    setJenisPerilaku("");
    setTingkatUrgensi("Sedang");
    setTingkatKerahasiaan("Standar");
    setUnitKerja("");
    setUnitKerjaCustom("");
    setIsUnitKerjaManual(false);
    setPelakuType("pegawai");
    setPelakuPegawaiNik("");
    setPelakuManualNama("");
    setKorbanType("diri_sendiri");
    setKorbanPegawaiNik("");
    setKorbanManualNama("");
    setKronologi("");
    setAttachments([]);
    setFormErrors({});
    setHasRestoredDraft(false);
    toast.info("Draft formulir telah dibersihkan.");
  };

  // 3. File Upload Handler (supports Click & Drag-and-Drop)
  const processFiles = async (files) => {
    if (!files || !files.length) return;

    setIsUploading(true);
    let uploadedCount = 0;

    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`Berkas ${file.name} melebihi batas 10MB.`);
        continue;
      }

      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/pelaporan-perilaku/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (!res.ok || data.error) {
          throw new Error(data.error || "Gagal mengunggah berkas");
        }

        setAttachments((prev) => [
          ...prev,
          {
            url: data.fileUrl,
            name: data.fileName,
            size: data.fileSize,
            type: data.mimeType,
          },
        ]);
        uploadedCount++;
      } catch (err) {
        console.error("Upload error:", err);
        toast.error(`Gagal mengunggah ${file.name}: ${err.message}`);
      }
    }

    setIsUploading(false);
    if (uploadedCount > 0) {
      toast.success(`${uploadedCount} berkas bukti berhasil dilampirkan.`);
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    await processFiles(files);
    e.target.value = "";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      await processFiles(files);
    }
  };

  const handleRemoveAttachment = (indexToRemove) => {
    setAttachments((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // 4. Fetch My Reports
  const loadMyReports = async () => {
    setIsLoadingMyReports(true);
    try {
      const res = await fetchMyPelaporanPerilaku({ limit: 100, offset: 0 });
      setMyReports(res.items || []);
    } catch (err) {
      console.error("Load my reports error:", err);
      toast.error("Gagal memuat riwayat laporan: " + err.message);
    } finally {
      setIsLoadingMyReports(false);
    }
  };

  // 5. Fetch Admin Reports
  const loadAdminReports = async () => {
    if (!isAdmin) return;
    setIsLoadingAdminReports(true);
    try {
      const filterPayload = {};
      if (adminFilter.search) filterPayload.search = adminFilter.search;
      if (adminFilter.status && adminFilter.status !== "all") filterPayload.status = adminFilter.status;
      if (adminFilter.jenisPerilaku && adminFilter.jenisPerilaku !== "all") filterPayload.jenisPerilaku = adminFilter.jenisPerilaku;
      if (adminFilter.tingkatUrgensi && adminFilter.tingkatUrgensi !== "all") filterPayload.tingkatUrgensi = adminFilter.tingkatUrgensi;
      if (adminFilter.startDate) filterPayload.startDate = adminFilter.startDate;
      if (adminFilter.endDate) filterPayload.endDate = adminFilter.endDate;

      const res = await fetchAdminPelaporanPerilaku({
        filter: filterPayload,
        limit: 100,
        offset: 0,
      });

      setAdminReports(res.items || []);
      if (res.stats) {
        setAdminStats(res.stats);
      }
    } catch (err) {
      console.error("Load admin reports error:", err);
      toast.error("Gagal memuat rekap laporan admin: " + err.message);
    } finally {
      setIsLoadingAdminReports(false);
    }
  };

  useEffect(() => {
    if (activeTab === "history") {
      loadMyReports();
    } else if (activeTab === "admin" && isAdmin) {
      loadAdminReports();
    }
  }, [activeTab, isAdmin]);

  // 6. Form Validation & Submission
  const handleValidateBeforeSubmit = (e) => {
    e.preventDefault();
    const errors = {};

    if (!tanggal) {
      errors.tanggal = "Pilih tanggal kejadian insiden.";
    }

    if (!jenisPerilaku) {
      errors.jenisPerilaku = "Pilih salah satu kategori jenis perilaku.";
    }

    const finalUnit = isUnitKerjaManual ? unitKerjaCustom.trim() : unitKerja.trim();
    if (!finalUnit) {
      errors.unitKerja = "Tentukan unit kerja atau lokasi kejadian.";
    }

    if (pelakuType === "pegawai" && !pelakuPegawaiNik) {
      errors.pelaku = "Pilih nama atau NIK pegawai terduga pelaku.";
    } else if (pelakuType === "external" && !pelakuManualNama.trim()) {
      errors.pelaku = "Masukkan nama atau identitas terduga pelaku pihak luar.";
    }

    if (korbanType === "pegawai" && !korbanPegawaiNik) {
      errors.korban = "Pilih nama atau NIK pegawai korban.";
    } else if (korbanType === "external" && !korbanManualNama.trim()) {
      errors.korban = "Masukkan nama atau identitas korban.";
    }

    if (!kronologi.trim()) {
      errors.kronologi = "Uraikan kronologi kejadian insiden.";
    } else if (kronologi.trim().length < 20) {
      errors.kronologi = `Kronologi terlalu singkat (${kronologi.trim().length}/20 karakter). Mohon berikan keterangan yang lebih rinci.`;
    }

    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      const firstErrorKey = Object.keys(errors)[0];
      toast.error(errors[firstErrorKey]);
      // Scroll to form error
      const el = document.getElementById(`field-${firstErrorKey}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    setIsConfirmOpen(true);
  };

  const handleConfirmSubmit = async () => {
    setIsSubmitting(true);
    try {
      const formattedDate = format(tanggal, "yyyy-MM-dd");
      const finalUnit = isUnitKerjaManual ? unitKerjaCustom.trim() : unitKerja.trim();

      let namaPelakuFinal = pelakuManualNama.trim();
      let nikPelakuFinal = undefined;
      if (pelakuType === "pegawai") {
        nikPelakuFinal = (pelakuPegawaiNik || "").trim();
        const matchedPelaku = pegawaiList.find(
          (p) => (p.value || p.nik || "").toLowerCase() === (pelakuPegawaiNik || "").toLowerCase()
        );
        namaPelakuFinal = matchedPelaku?.label || matchedPelaku?.nama || (nikPelakuFinal ? `Pegawai (${nikPelakuFinal})` : "");
      }

      let korbanFinal = "Diri Sendiri (Pelapor)";
      let nikKorbanFinal = undefined;
      if (korbanType === "diri_sendiri") {
        korbanFinal = currentUser?.nama ? `${currentUser.nama} (Diri Sendiri)` : "Diri Sendiri (Pelapor)";
        nikKorbanFinal = currentUser?.nik;
      } else if (korbanType === "pegawai") {
        nikKorbanFinal = (korbanPegawaiNik || "").trim();
        const matchedKorban = pegawaiList.find(
          (p) => (p.value || p.nik || "").toLowerCase() === (korbanPegawaiNik || "").toLowerCase()
        );
        korbanFinal = matchedKorban?.label || matchedKorban?.nama || (nikKorbanFinal ? `Pegawai (${nikKorbanFinal})` : "");
      } else {
        korbanFinal = korbanManualNama.trim();
      }

      const payload = {
        tanggal: formattedDate,
        namaPelaku: namaPelakuFinal,
        nikPelaku: nikPelakuFinal || undefined,
        unitKerja: finalUnit,
        jenisPerilaku,
        tingkatUrgensi,
        korban: korbanFinal,
        nikKorban: nikKorbanFinal || undefined,
        kronologi: kronologi.trim(),
        buktiLampiran: attachments.length > 0 ? JSON.stringify(attachments) : undefined,
        tingkatKerahasiaan,
      };

      await createPelaporanPerilakuMutation(payload);

      toast.success("Laporan aduan berhasil dikirim secara rahasia dan masuk ke antrean penanganan SPI / Komite Etik.");

      // Clean local storage draft
      localStorage.removeItem(DRAFT_STORAGE_KEY);

      // Reset form
      setTanggal(null);
      setJenisPerilaku("");
      setTingkatUrgensi("Sedang");
      setTingkatKerahasiaan("Standar");
      setUnitKerja("");
      setUnitKerjaCustom("");
      setPelakuType("pegawai");
      setPelakuPegawaiNik("");
      setPelakuManualNama("");
      setKorbanType("diri_sendiri");
      setKorbanPegawaiNik("");
      setKorbanManualNama("");
      setKronologi("");
      setAttachments([]);
      setFormErrors({});
      setHasRestoredDraft(false);
      setIsConfirmOpen(false);

      // Switch to history
      setActiveTab("history");
      loadMyReports();
    } catch (err) {
      console.error("Submit report error:", err);
      toast.error("Gagal mengirim laporan: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Status Update Dialog Handler
  const handleOpenStatusDialog = (report) => {
    setSelectedAdminReport(report);
    setStatusUpdateForm({
      status: report.status,
      catatanTindakLanjut: report.catatanTindakLanjut || "",
    });
  };

  const handleSaveStatusUpdate = async () => {
    if (!selectedAdminReport) return;
    setIsUpdatingStatus(true);
    try {
      await updateStatusPelaporanPerilakuMutation({
        id: selectedAdminReport.id,
        status: statusUpdateForm.status,
        catatanTindakLanjut: statusUpdateForm.catatanTindakLanjut,
      });

      toast.success(`Status laporan #${selectedAdminReport.id} berhasil diperbarui.`);
      setSelectedAdminReport(null);
      loadAdminReports();
    } catch (err) {
      console.error("Update status error:", err);
      toast.error("Gagal memperbarui status: " + err.message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Helper render status badge
  const renderStatusBadge = (status) => {
    switch (status) {
      case "Menunggu Review":
        return (
          <Badge variant="outline" className="border-amber-400 bg-amber-50 text-amber-800 font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1.5 w-fit text-xs">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Menunggu Review
          </Badge>
        );
      case "Sedang Diinvestigasi":
        return (
          <Badge variant="outline" className="border-sky-400 bg-sky-50 text-sky-800 font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1.5 w-fit text-xs">
            <RefreshCw className="w-3.5 h-3.5 text-sky-600 animate-spin" />
            Sedang Diinvestigasi
          </Badge>
        );
      case "Selesai":
        return (
          <Badge variant="outline" className="border-emerald-400 bg-emerald-50 text-emerald-800 font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1.5 w-fit text-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Selesai Ditindak
          </Badge>
        );
      case "Ditolak":
        return (
          <Badge variant="outline" className="border-rose-400 bg-rose-50 text-rose-800 font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1.5 w-fit text-xs">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Ditolak
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const renderUrgensiBadge = (urgensi) => {
    switch (urgensi) {
      case "Kritis":
        return (
          <Badge variant="outline" className="border-rose-500 bg-rose-50 text-rose-800 font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 w-fit text-[11px]">
            <Flame className="w-3 h-3 text-rose-600" />
            Kritis
          </Badge>
        );
      case "Tinggi":
        return (
          <Badge variant="outline" className="border-amber-400 bg-amber-50 text-amber-800 font-medium px-2 py-0.5 rounded-md flex items-center gap-1 w-fit text-[11px]">
            Tinggi
          </Badge>
        );
      case "Sedang":
        return (
          <Badge variant="outline" className="border-sky-300 bg-sky-50 text-sky-800 font-medium px-2 py-0.5 rounded-md text-[11px]">
            Sedang
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="border-slate-300 bg-slate-50 text-slate-700 font-medium px-2 py-0.5 rounded-md text-[11px]">
            Rendah
          </Badge>
        );
    }
  };

  // Helper parse attachments
  const parseAttachments = (raw) => {
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  };

  return (
    <div className="container max-w-6xl mx-auto px-3 sm:px-4 pt-2 pb-28 sm:pb-12 space-y-4 sm:space-y-6">
      {/* ─── TABS NAVIGATION ───────────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-5 sm:space-y-6">
        <div className="border-b border-slate-200 overflow-x-auto pb-0.5 scrollbar-none">
          <TabsList className="bg-transparent h-auto min-h-12 p-0 flex flex-nowrap gap-2 sm:gap-4 w-max sm:w-auto">
            <TabsTrigger
              value="form"
              className="data-[state=active]:border-sky-600 data-[state=active]:text-sky-700 data-[state=active]:bg-white data-[state=active]:shadow-sm border border-transparent rounded-lg px-3.5 sm:px-4 py-2.5 font-semibold text-xs sm:text-sm text-slate-600 hover:text-slate-900 transition-all flex items-center gap-2 shrink-0"
            >
              <Send className="w-4 h-4 shrink-0" />
              <span>Buat Laporan Baru</span>
            </TabsTrigger>

            <TabsTrigger
              value="history"
              className="data-[state=active]:border-sky-600 data-[state=active]:text-sky-700 data-[state=active]:bg-white data-[state=active]:shadow-sm border border-transparent rounded-lg px-3.5 sm:px-4 py-2.5 font-semibold text-xs sm:text-sm text-slate-600 hover:text-slate-900 transition-all flex items-center gap-2 shrink-0"
            >
              <History className="w-4 h-4 shrink-0" />
              <span>Riwayat Aduan Saya</span>
              {myReports.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-[11px] font-bold bg-slate-100 text-slate-700 rounded-full">
                  {myReports.length}
                </span>
              )}
            </TabsTrigger>

            {isAdmin && (
              <TabsTrigger
                value="admin"
                className="data-[state=active]:border-sky-600 data-[state=active]:text-sky-700 data-[state=active]:bg-white data-[state=active]:shadow-sm border border-transparent rounded-lg px-3.5 sm:px-4 py-2.5 font-semibold text-xs sm:text-sm text-slate-600 hover:text-slate-900 transition-all flex items-center gap-2 relative shrink-0"
              >
                <ShieldAlert className="w-4 h-4 text-sky-600 shrink-0" />
                <span>Kelola Aduan (SPI / Komite Etik)</span>
                {adminStats.menungguReview > 0 && (
                  <span className="ml-1 px-2 py-0.5 text-[10px] font-bold bg-amber-500 text-white rounded-full">
                    {adminStats.menungguReview}
                  </span>
                )}
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        {/* ─── TAB 1: FORMULIR PENGADUAN ─────────────────────────────────────── */}
        <TabsContent value="form" className="space-y-5 sm:space-y-6">
          {hasRestoredDraft && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Draft isian Anda sebelumnya telah dipulihkan secara otomatis.</span>
              </div>
              <button
                type="button"
                onClick={clearDraft}
                className="text-amber-800 hover:text-amber-950 font-semibold underline text-xs self-end sm:self-auto"
              >
                Bersihkan Draft
              </button>
            </div>
          )}

          <form onSubmit={handleValidateBeforeSubmit} ref={formRef}>
            <Card className="border border-slate-200 shadow-sm overflow-hidden">
              <CardHeader className="bg-slate-50/80 border-b border-slate-200/80 p-4 sm:p-6 pb-3 sm:pb-4">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="p-2 sm:p-2.5 rounded-xl bg-sky-100 text-sky-700 shrink-0 mt-0.5 sm:mt-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base sm:text-lg font-semibold text-slate-900 leading-tight">
                      Formulir Pengaduan Pelanggaran Etika & Perilaku
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm text-slate-500 mt-1">
                      Uraikan fakta kejadian secara objektif untuk membantu tim pemeriksa melakukan verifikasi secara menyeluruh.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-8 space-y-6 sm:space-y-8">
                {/* Section 1: Waktu, Lokasi & Urgensi */}
                <div className="space-y-4" id="field-tanggal">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 border-b border-slate-100 pb-2">
                    <CalendarIcon className="w-4 h-4 text-sky-600 shrink-0" />
                    <span>1. Waktu, Lokasi & Tingkat Urgensi Kejadian</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                    {/* Tanggal Kejadian */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">
                        Tanggal Kejadian <span className="text-rose-500">*</span>
                      </label>
                      <DatePicker
                        value={tanggal}
                        onChange={(val) => {
                          setTanggal(val);
                          if (formErrors.tanggal) setFormErrors({ ...formErrors, tanggal: null });
                        }}
                        maxDate={new Date()}
                        placeholder="Pilih tanggal kejadian..."
                        className={`h-11 ${formErrors.tanggal ? "border-rose-500 ring-1 ring-rose-500" : ""}`}
                      />
                      {formErrors.tanggal && (
                        <p className="text-[11px] text-rose-600 font-medium">{formErrors.tanggal}</p>
                      )}
                    </div>

                    {/* Unit Kerja */}
                    <div className="space-y-1.5" id="field-unitKerja">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-700">
                          Unit Kerja / Lokasi <span className="text-rose-500">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setIsUnitKerjaManual(!isUnitKerjaManual)}
                          className="text-[11px] text-sky-700 hover:text-sky-900 underline font-medium"
                        >
                          {isUnitKerjaManual ? "Pilih dari Master" : "Ketik Manual"}
                        </button>
                      </div>

                      {isUnitKerjaManual ? (
                        <Input
                          placeholder="Misal: Koridor IGD, Ruang Operasi 2, Depo Farmasi..."
                          value={unitKerjaCustom}
                          onChange={(e) => {
                            setUnitKerjaCustom(e.target.value);
                            if (formErrors.unitKerja) setFormErrors({ ...formErrors, unitKerja: null });
                          }}
                          className={`h-11 text-xs ${formErrors.unitKerja ? "border-rose-500 ring-1 ring-rose-500" : ""}`}
                        />
                      ) : (
                        <DepartemenCombobox
                          value={unitKerja}
                          onValueChange={(val) => {
                            setUnitKerja(val);
                            if (formErrors.unitKerja) setFormErrors({ ...formErrors, unitKerja: null });
                          }}
                          className={`h-11 ${formErrors.unitKerja ? "border-rose-500 ring-1 ring-rose-500" : ""}`}
                        />
                      )}
                      {formErrors.unitKerja && (
                        <p className="text-[11px] text-rose-600 font-medium">{formErrors.unitKerja}</p>
                      )}
                    </div>

                    {/* Tingkat Urgensi */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">
                        Tingkat Urgensi
                      </label>
                      <Select value={tingkatUrgensi} onValueChange={setTingkatUrgensi}>
                        <SelectTrigger className="h-11 text-xs">
                          <SelectValue placeholder="Pilih urgensi..." />
                        </SelectTrigger>
                        <SelectContent>
                          {TINGKAT_URGENSI.map((u) => (
                            <SelectItem key={u.id} value={u.id}>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{u.label}</span>
                                <span className="text-slate-400 text-[11px]">({u.desc})</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Section 2: Jenis Perilaku (Accessible Radio Group) */}
                <div className="space-y-4" id="field-jenisPerilaku">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                      <AlertTriangle className="w-4 h-4 text-sky-600" />
                      <span>2. Jenis Perilaku yang Dilaporkan <span className="text-rose-500">*</span></span>
                    </div>
                    {jenisPerilaku && (
                      <span className="text-xs font-semibold text-sky-800 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
                        Dipilih: {jenisPerilaku}
                      </span>
                    )}
                  </div>

                  <div
                    role="radiogroup"
                    aria-label="Kategori Jenis Perilaku yang Dilaporkan"
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
                  >
                    {KATEGORI_PERILAKU.map((kat) => {
                      const isSelected = jenisPerilaku === kat.id;
                      return (
                        <button
                          key={kat.id}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          onClick={() => {
                            setJenisPerilaku(kat.id);
                            if (formErrors.jenisPerilaku) setFormErrors({ ...formErrors, jenisPerilaku: null });
                          }}
                          className={`text-left p-3.5 rounded-xl border transition-all flex flex-col justify-between focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                            isSelected
                              ? "border-sky-600 bg-sky-50/90 ring-2 ring-sky-500/20 shadow-sm"
                              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70"
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className={`text-sm font-semibold ${isSelected ? "text-sky-950" : "text-slate-800"}`}>
                                {kat.label}
                              </span>
                              {isSelected && <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />}
                            </div>
                            <p className="text-xs text-slate-500 leading-snug">
                              {kat.desc}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {formErrors.jenisPerilaku && (
                    <p className="text-[11px] text-rose-600 font-medium">{formErrors.jenisPerilaku}</p>
                  )}
                </div>

                {/* Section 3: Pihak Terlibat (Pelaku & Korban) */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 border-b border-slate-100 pb-2">
                    <Users className="w-4 h-4 text-sky-600" />
                    <span>3. Pihak Terduga Pelaku & Korban</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Terduga Pelaku */}
                    <div
                      className={`space-y-3 p-4 rounded-xl bg-slate-50/80 border ${
                        formErrors.pelaku ? "border-rose-400 bg-rose-50/20" : "border-slate-200"
                      }`}
                      id="field-pelaku"
                    >
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-800">
                          Terduga Pelaku <span className="text-rose-500">*</span>
                        </label>
                        <div className="flex items-center gap-1.5 text-xs" role="tablist">
                          <button
                            type="button"
                            role="tab"
                            aria-selected={pelakuType === "pegawai"}
                            onClick={() => {
                              setPelakuType("pegawai");
                              if (formErrors.pelaku) setFormErrors({ ...formErrors, pelaku: null });
                            }}
                            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                              pelakuType === "pegawai"
                                ? "bg-sky-700 text-white shadow-sm"
                                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            Pegawai RS
                          </button>
                          <button
                            type="button"
                            role="tab"
                            aria-selected={pelakuType === "external"}
                            onClick={() => {
                              setPelakuType("external");
                              if (formErrors.pelaku) setFormErrors({ ...formErrors, pelaku: null });
                            }}
                            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                              pelakuType === "external"
                                ? "bg-sky-700 text-white shadow-sm"
                                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            Pihak Luar
                          </button>
                        </div>
                      </div>

                      {pelakuType === "pegawai" ? (
                        <div className="space-y-1">
                          <PegawaiCombobox
                            value={pelakuPegawaiNik}
                            onValueChange={(val) => {
                              setPelakuPegawaiNik(val);
                              if (formErrors.pelaku) setFormErrors({ ...formErrors, pelaku: null });
                            }}
                          />
                          <p className="text-[11px] text-slate-500">Cari nama atau NIK pegawai yang diadukan.</p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <Input
                            placeholder="Nama atau identitas terduga pelaku (pengunjung/vendor/pasien)..."
                            value={pelakuManualNama}
                            onChange={(e) => {
                              setPelakuManualNama(e.target.value);
                              if (formErrors.pelaku) setFormErrors({ ...formErrors, pelaku: null });
                            }}
                            className="h-11 text-xs"
                          />
                        </div>
                      )}
                      {formErrors.pelaku && (
                        <p className="text-[11px] text-rose-600 font-medium">{formErrors.pelaku}</p>
                      )}
                    </div>

                    {/* Pihak Korban */}
                    <div
                      className={`space-y-3 p-4 rounded-xl bg-slate-50/80 border ${
                        formErrors.korban ? "border-rose-400 bg-rose-50/20" : "border-slate-200"
                      }`}
                      id="field-korban"
                    >
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-800">
                          Pihak Korban <span className="text-rose-500">*</span>
                        </label>
                        <div className="flex items-center gap-1 text-xs" role="tablist">
                          <button
                            type="button"
                            role="tab"
                            aria-selected={korbanType === "diri_sendiri"}
                            onClick={() => {
                              setKorbanType("diri_sendiri");
                              if (formErrors.korban) setFormErrors({ ...formErrors, korban: null });
                            }}
                            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                              korbanType === "diri_sendiri"
                                ? "bg-sky-700 text-white shadow-sm"
                                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            Diri Sendiri
                          </button>
                          <button
                            type="button"
                            role="tab"
                            aria-selected={korbanType === "pegawai"}
                            onClick={() => {
                              setKorbanType("pegawai");
                              if (formErrors.korban) setFormErrors({ ...formErrors, korban: null });
                            }}
                            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                              korbanType === "pegawai"
                                ? "bg-sky-700 text-white shadow-sm"
                                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            Pegawai Lain
                          </button>
                          <button
                            type="button"
                            role="tab"
                            aria-selected={korbanType === "external"}
                            onClick={() => {
                              setKorbanType("external");
                              if (formErrors.korban) setFormErrors({ ...formErrors, korban: null });
                            }}
                            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                              korbanType === "external"
                                ? "bg-sky-700 text-white shadow-sm"
                                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            Pihak Luar
                          </button>
                        </div>
                      </div>

                      {korbanType === "diri_sendiri" ? (
                        <div className="p-3 rounded-lg bg-sky-50 border border-sky-100 text-xs text-sky-900 flex items-center gap-2">
                          <User className="w-4 h-4 text-sky-700 shrink-0" />
                          <span>Laporan diajukan untuk peristiwa yang dialami oleh diri Anda sendiri.</span>
                        </div>
                      ) : korbanType === "pegawai" ? (
                        <div className="space-y-1">
                          <PegawaiCombobox
                            value={korbanPegawaiNik}
                            onValueChange={(val) => {
                              setKorbanPegawaiNik(val);
                              if (formErrors.korban) setFormErrors({ ...formErrors, korban: null });
                            }}
                          />
                          <p className="text-[11px] text-slate-500">Cari nama rekan kerja yang menjadi korban.</p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <Input
                            placeholder="Nama korban (pasien, keluarga pasien, vendor, dll)..."
                            value={korbanManualNama}
                            onChange={(e) => {
                              setKorbanManualNama(e.target.value);
                              if (formErrors.korban) setFormErrors({ ...formErrors, korban: null });
                            }}
                            className="h-11 text-xs"
                          />
                        </div>
                      )}
                      {formErrors.korban && (
                        <p className="text-[11px] text-rose-600 font-medium">{formErrors.korban}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section 4: Uraian Kronologi Kejadian */}
                <div className="space-y-3" id="field-kronologi">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                      <FileText className="w-4 h-4 text-sky-600 shrink-0" />
                      <span>4. Uraian Kronologi Kejadian <span className="text-rose-500">*</span></span>
                    </div>
                    <span className={`text-[11px] font-mono font-medium self-start sm:self-auto px-2 py-0.5 rounded border ${
                      kronologi.trim().length >= 20 
                        ? "text-emerald-700 bg-emerald-50 border-emerald-200" 
                        : "text-amber-700 bg-amber-50 border-amber-200"
                    }`}>
                      {kronologi.trim().length} / min. 20 karakter
                    </span>
                  </div>

                  <Textarea
                    rows={6}
                    placeholder="Uraikan peristiwa dengan rinci (5W+1H):&#10;• Kapan & di mana kejadian berlangsung?&#10;• Apa kata-kata atau tindakan spesifik yang dilakukan pelaku?&#10;• Apakah ada saksi mata di lokasi saat kejadian?&#10;• Dampak langsung yang dirasakan korban pasca-kejadian..."
                    value={kronologi}
                    onChange={(e) => {
                      setKronologi(e.target.value);
                      if (formErrors.kronologi && e.target.value.trim().length >= 20) {
                        setFormErrors({ ...formErrors, kronologi: null });
                      }
                    }}
                    className={`text-xs sm:text-sm leading-relaxed resize-y focus-visible:ring-sky-500 ${
                      formErrors.kronologi ? "border-rose-500 ring-1 ring-rose-500" : ""
                    }`}
                  />
                  {formErrors.kronologi && (
                    <p className="text-[11px] text-rose-600 font-medium">{formErrors.kronologi}</p>
                  )}
                </div>

                {/* Section 5: Bukti & Lampiran Pendukung */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                      <Paperclip className="w-4 h-4 text-sky-600 shrink-0" />
                      <span>5. Unggah Bukti & Lampiran (Opsional)</span>
                    </div>
                    <span className="text-[11px] text-slate-400">Gambar, PDF, DOCX, Audio MP3/WAV (Maks 10MB)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Dropzone Upload with Full Drag & Drop Support */}
                    <label
                      onDragOver={handleDragOver}
                      onDragEnter={handleDragEnter}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`flex flex-col items-center justify-center p-5 sm:p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all text-center group relative overflow-hidden ${
                        isDragging
                          ? "border-sky-500 bg-sky-100/90 ring-4 ring-sky-500/20 scale-[1.01] shadow-md"
                          : "border-sky-200 hover:bg-sky-50/50 hover:border-sky-300 bg-white"
                      }`}
                    >
                      <UploadCloud
                        className={`w-8 h-8 text-sky-600 mb-2 transition-transform duration-200 ${
                          isDragging ? "scale-125 text-sky-700 -translate-y-1" : "group-hover:scale-110"
                        }`}
                      />
                      <span className="text-xs font-semibold text-slate-800">
                        {isUploading
                          ? "Mengunggah berkas..."
                          : isDragging
                          ? "Lepaskan berkas di sini..."
                          : "Klik atau Tarik & Lepas (Drag & Drop) Berkas ke Sini"}
                      </span>
                      <span className="text-[11px] text-slate-500 mt-1">
                        {isDragging
                          ? "Format Foto, Dokumen PDF/Word, & Rekaman Suara didukung (Maks 10MB)"
                          : "Screenshot chat, rekaman suara, foto insiden, atau dokumen (Maks 10MB)"}
                      </span>
                      <input
                        type="file"
                        multiple
                        accept="image/*,application/pdf,.docx,.doc,audio/*,.mp3,.wav,.m4a"
                        onChange={handleFileUpload}
                        disabled={isUploading}
                        className="hidden"
                      />
                    </label>

                    {/* Attachment List */}
                    <div className="space-y-2 max-h-56 overflow-y-auto">
                      {attachments.length === 0 ? (
                        <div className="h-full min-h-[100px] flex items-center justify-center p-6 border border-slate-100 rounded-xl bg-slate-50 text-xs text-slate-400 text-center italic">
                          Belum ada berkas yang dilampirkan.
                        </div>
                      ) : (
                        attachments.map((att, idx) => {
                          const isImg = isImageAttachment(att);
                          const isAudio = isAudioAttachment(att);
                          return (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-2 bg-sky-50/60 border border-sky-150 rounded-lg text-xs gap-3"
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                {isImg ? (
                                  <div className="relative group/thumb shrink-0">
                                    <img
                                      src={att.url}
                                      alt={att.name}
                                      className="w-10 h-10 object-cover rounded-md border border-sky-200 bg-white"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => openImageLightbox(att, attachments)}
                                      className="absolute inset-0 bg-slate-900/40 rounded-md opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center text-white"
                                      title="Perbesar Gambar"
                                    >
                                      <ZoomIn className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : isAudio ? (
                                  <div className="w-10 h-10 rounded-md bg-amber-100 border border-amber-200 flex flex-col items-center justify-center shrink-0">
                                    <Volume2 className="w-4 h-4 text-amber-700" />
                                    <span className="text-[9px] font-bold text-amber-800 uppercase leading-none mt-0.5">
                                      AUDIO
                                    </span>
                                  </div>
                                ) : (
                                  <div className="w-10 h-10 rounded-md bg-sky-100 border border-sky-200 flex flex-col items-center justify-center shrink-0">
                                    <FileText className="w-4 h-4 text-sky-700" />
                                    <span className="text-[9px] font-bold text-sky-800 uppercase leading-none mt-0.5">
                                      {att.name?.split(".").pop() || "DOC"}
                                    </span>
                                  </div>
                                )}
                                <div className="min-w-0 flex-1 space-y-1">
                                  <span className="truncate font-medium text-slate-800 block text-xs" title={att.name}>
                                    {att.name}
                                  </span>
                                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                    <span>({(att.size / 1024).toFixed(0)} KB)</span>
                                    {isImg && (
                                      <button
                                        type="button"
                                        onClick={() => openImageLightbox(att, attachments)}
                                        className="text-sky-700 hover:text-sky-900 font-medium underline"
                                      >
                                        Lihat Pratinjau
                                      </button>
                                    )}
                                  </div>
                                  {isAudio && (
                                    <audio controls src={att.url} className="h-7 w-full max-w-xs mt-1" />
                                  )}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveAttachment(idx)}
                                className="text-rose-600 hover:text-rose-800 p-1.5 rounded-md hover:bg-rose-50 shrink-0 self-start mt-1"
                                title="Hapus Lampiran"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                {/* Section 6: Pengaturan Privasi / Kerahasiaan */}
                <div className="p-4 rounded-xl bg-sky-50/70 border border-sky-150 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-sky-950 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-sky-700 shrink-0" />
                      Tingkat Kerahasiaan Akses Laporan
                    </span>
                    <p className="text-[11px] text-slate-600">
                      Tentukan siapa saja pihak berwenang yang diizinkan meninjau rincian dokumen ini.
                    </p>
                  </div>

                  <Select value={tingkatKerahasiaan} onValueChange={setTingkatKerahasiaan}>
                    <SelectTrigger className="h-10 w-full sm:w-60 text-xs bg-white">
                      <SelectValue placeholder="Pilih privasi..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Standar">Standar (SPI & SDM/HRD)</SelectItem>
                      <SelectItem value="Sangat Rahasia">Sangat Rahasia (SPI & Direktur)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>

              <CardFooter className="bg-slate-50/90 border-t border-slate-200/80 p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-slate-500 flex items-center gap-2 self-start sm:self-center">
                  <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Pelapor tercatat: <strong>{currentUser?.nama || "Pegawai Login"}</strong></span>
                </div>

                <div className="flex flex-col-reverse sm:flex-row items-center gap-2.5 w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={clearDraft}
                    className="w-full sm:w-auto text-xs text-slate-600 h-11 sm:h-10"
                  >
                    Reset Form
                  </Button>
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full sm:w-auto bg-sky-700 hover:bg-sky-800 text-white font-semibold px-6 sm:px-8 h-11 sm:h-10 shadow-sm flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4 shrink-0" />
                    <span>Kirim Laporan Pengaduan</span>
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </form>
        </TabsContent>

        {/* ─── TAB 2: RIWAYAT LAPORAN SAYA ────────────────────────────────────── */}
        <TabsContent value="history" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Riwayat Pengaduan Saya</h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Pantau perkembangan investigasi kasus dan catatan tindak lanjut resmi dari tim berwenang.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadMyReports}
              disabled={isLoadingMyReports}
              className="flex items-center gap-1.5 text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingMyReports ? "animate-spin" : ""}`} />
              Segarkan Data
            </Button>
          </div>

          {isLoadingMyReports ? (
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <Card key={n} className="p-6">
                  <div className="space-y-3">
                    <Skeleton className="h-5 w-1/3" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                </Card>
              ))}
            </div>
          ) : myReports.length === 0 ? (
            <Card className="border-dashed border-2 border-slate-200 p-12 text-center">
              <div className="max-w-md mx-auto space-y-3">
                <div className="w-12 h-12 rounded-full bg-sky-50 text-sky-600 mx-auto flex items-center justify-center">
                  <History className="w-6 h-6" />
                </div>
                <h3 className="text-base font-semibold text-slate-800">Belum Ada Riwayat Aduan</h3>
                <p className="text-xs text-slate-500">
                  Anda belum pernah mengajukan aduan insiden. Jika Anda mengalami atau menyaksikan pelanggaran, buat laporan pada tab "Buat Laporan Baru".
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab("form")}
                  className="mt-2 text-sky-700 border-sky-300 hover:bg-sky-50"
                >
                  Buat Laporan Sekarang
                </Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {myReports.map((report) => (
                <Card
                  key={report.id}
                  className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                >
                  <div className="p-5 sm:p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-1 rounded">
                          #LP-{String(report.id).padStart(4, "0")}
                        </span>
                        <Badge variant="secondary" className="font-semibold text-xs bg-sky-50 text-sky-900 border border-sky-200">
                          {report.jenisPerilaku}
                        </Badge>
                        {renderUrgensiBadge(report.tingkatUrgensi)}
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <CalendarIcon className="w-3.5 h-3.5" />
                          Kejadian: {report.tanggal}
                        </span>
                      </div>
                      <div>{renderStatusBadge(report.status)}</div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600">
                      <div>
                        <span className="text-slate-400 block mb-0.5">Terduga Pelaku:</span>
                        <strong className="text-slate-800 font-semibold">{report.namaPelaku}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Pihak Korban:</span>
                        <strong className="text-slate-800 font-semibold">{report.korban}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Unit Kerja Terkait:</span>
                        <strong className="text-slate-800 font-semibold">{report.unitKerja}</strong>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-150 text-xs text-slate-700">
                      <span className="font-semibold text-slate-800 block mb-1">Kronologi Ringkas:</span>
                      <p className="line-clamp-2 leading-relaxed">{report.kronologi}</p>
                    </div>

                    {report.catatanTindakLanjut && (
                      <div className="bg-sky-50/80 p-3.5 rounded-lg border border-sky-200 text-xs text-sky-950 space-y-1">
                        <div className="flex items-center gap-1.5 font-semibold text-sky-900">
                          <Info className="w-4 h-4 text-sky-700" />
                          <span>Tanggapan & Catatan Tim Investigasi:</span>
                        </div>
                        <p className="leading-relaxed">{report.catatanTindakLanjut}</p>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100">
                      <div>
                        {report.status === "Menunggu Review" && (
                          <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-flex items-center gap-1 font-medium">
                            <Clock className="w-3 h-3 text-amber-600" /> Estimasi SLA Respons SPI: 1–2 hari kerja
                          </span>
                        )}
                        {report.status === "Sedang Diinvestigasi" && (
                          <span className="text-[11px] text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 inline-flex items-center gap-1 font-medium">
                            <ShieldCheck className="w-3 h-3 text-sky-600" /> Proses Klarifikasi & Penelaahan Bukti SPI
                          </span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedDetailReport(report)}
                        className="text-sky-700 hover:text-sky-900 hover:bg-sky-50 text-xs flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Lihat Rincian Laporan</span>
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ─── TAB 3: ADMIN MANAGEMENT QUEUE (SPI / HRD / IT) ────────────────── */}
        {isAdmin && (
          <TabsContent value="admin" className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card className="p-4 border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Total Aduan Masuk</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{adminStats.total}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700">
                    <FileText className="w-5 h-5" />
                  </div>
                </div>
              </Card>

              <Card className="p-4 border-amber-200 bg-amber-50/50 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-amber-800 font-medium">Menunggu Triage</p>
                    <p className="text-2xl font-bold text-amber-900 mt-1">{adminStats.menungguReview}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>
              </Card>

              <Card className="p-4 border-sky-200 bg-sky-50/50 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-sky-800 font-medium">Sedang Diinvestigasi</p>
                    <p className="text-2xl font-bold text-sky-900 mt-1">{adminStats.sedangDiinvestigasi}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-sky-100 text-sky-800">
                    <RefreshCw className="w-5 h-5" />
                  </div>
                </div>
              </Card>

              <Card className="p-4 border-emerald-200 bg-emerald-50/50 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-emerald-800 font-medium">Selesai Ditindak</p>
                    <p className="text-2xl font-bold text-emerald-900 mt-1">{adminStats.selesai}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Filter Bar */}
            <Card className="border border-slate-200 p-4 shadow-sm space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {/* Search */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <Input
                    placeholder="Cari pelaku, korban, pelapor..."
                    value={adminFilter.search}
                    onChange={(e) => setAdminFilter({ ...adminFilter, search: e.target.value })}
                    className="pl-9 h-10 text-xs"
                  />
                </div>

                {/* Filter Status */}
                <Select
                  value={adminFilter.status}
                  onValueChange={(val) => setAdminFilter({ ...adminFilter, status: val })}
                >
                  <SelectTrigger className="h-10 text-xs">
                    <SelectValue placeholder="Status: Semua" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="Menunggu Review">Menunggu Review</SelectItem>
                    <SelectItem value="Sedang Diinvestigasi">Sedang Diinvestigasi</SelectItem>
                    <SelectItem value="Selesai">Selesai</SelectItem>
                    <SelectItem value="Ditolak">Ditolak</SelectItem>
                  </SelectContent>
                </Select>

                {/* Filter Jenis */}
                <Select
                  value={adminFilter.jenisPerilaku}
                  onValueChange={(val) => setAdminFilter({ ...adminFilter, jenisPerilaku: val })}
                >
                  <SelectTrigger className="h-10 text-xs">
                    <SelectValue placeholder="Semua Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Kategori</SelectItem>
                    {KATEGORI_PERILAKU.map((k) => (
                      <SelectItem key={k.id} value={k.id}>
                        {k.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Filter Urgensi */}
                <Select
                  value={adminFilter.tingkatUrgensi}
                  onValueChange={(val) => setAdminFilter({ ...adminFilter, tingkatUrgensi: val })}
                >
                  <SelectTrigger className="h-10 text-xs">
                    <SelectValue placeholder="Semua Urgensi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Urgensi</SelectItem>
                    {TINGKAT_URGENSI.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Filter Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    onClick={loadAdminReports}
                    className="flex-1 bg-sky-700 hover:bg-sky-800 text-white text-xs h-10"
                  >
                    <Filter className="w-3.5 h-3.5 mr-1.5" />
                    Filter
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setAdminFilter({ search: "", status: "all", jenisPerilaku: "all", tingkatUrgensi: "all", startDate: "", endDate: "" });
                      setTimeout(loadAdminReports, 50);
                    }}
                    className="text-xs h-10 px-3"
                  >
                    Reset
                  </Button>
                </div>
              </div>
            </Card>

            {/* Admin Table (Desktop) & Responsive Cards (Mobile) */}
            <Card className="border border-slate-200 shadow-sm overflow-hidden">
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">No. Aduan</th>
                      <th className="py-3 px-4">Urgensi</th>
                      <th className="py-3 px-4">Tgl Kejadian</th>
                      <th className="py-3 px-4">Kategori & Lokasi</th>
                      <th className="py-3 px-4">Pelaku & Korban</th>
                      <th className="py-3 px-4">Pelapor</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {isLoadingAdminReports ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400">
                          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                          Memuat data antrean aduan...
                        </td>
                      </tr>
                    ) : adminReports.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400">
                          Tidak ditemukan laporan dengan filter saat ini.
                        </td>
                      </tr>
                    ) : (
                      adminReports.map((report) => (
                        <tr key={report.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-800 whitespace-nowrap">
                            #LP-{String(report.id).padStart(4, "0")}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {renderUrgensiBadge(report.tingkatUrgensi)}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                            {report.tanggal}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-slate-900 block">{report.jenisPerilaku}</span>
                            <span className="text-slate-400 text-[11px] block">{report.unitKerja}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="space-y-0.5">
                              <div><span className="text-slate-400">Pelaku:</span> <strong className="text-slate-800">{report.namaPelaku}</strong></div>
                              <div><span className="text-slate-400">Korban:</span> <span className="text-slate-700">{report.korban}</span></div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-medium text-slate-800 block">{report.pelapor}</span>
                            <span className="text-slate-400 text-[11px] font-mono">NIK: {report.nikPelapor}</span>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {renderStatusBadge(report.status)}
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedDetailReport(report)}
                                className="h-8 px-2.5 text-xs text-slate-600 hover:text-slate-900"
                                title="Lihat Detail & Berkas"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleOpenStatusDialog(report)}
                                className="h-8 px-2.5 text-xs bg-sky-700 hover:bg-sky-800 text-white"
                                title="Tindak Lanjut & Disposisi"
                              >
                                <Edit3 className="w-3.5 h-3.5 mr-1" />
                                Disposisi
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View (for screens < 768px) */}
              <div className="block md:hidden divide-y divide-slate-100">
                {isLoadingAdminReports ? (
                  <div className="py-8 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                    Memuat data antrean aduan...
                  </div>
                ) : adminReports.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    Tidak ditemukan laporan dengan filter saat ini.
                  </div>
                ) : (
                  adminReports.map((report) => (
                    <div key={report.id} className="p-4 space-y-3">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
                            #LP-{String(report.id).padStart(4, "0")}
                          </span>
                          {renderUrgensiBadge(report.tingkatUrgensi)}
                        </div>
                        <div>{renderStatusBadge(report.status)}</div>
                      </div>

                      <div>
                        <span className="font-semibold text-slate-900 text-xs block">
                          {report.jenisPerilaku}
                        </span>
                        <span className="text-[11px] text-slate-500 block">
                          Unit: {report.unitKerja} • Tgl: {report.tanggal}
                        </span>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-150 text-[11.5px] text-slate-700 space-y-1">
                        <div>
                          <span className="text-slate-400">Pelaku:</span>{" "}
                          <strong className="text-slate-800 font-semibold">{report.namaPelaku}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400">Korban:</span>{" "}
                          <span className="text-slate-700">{report.korban}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Pelapor:</span>{" "}
                          <span className="text-slate-700">{report.pelapor}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedDetailReport(report)}
                          className="w-full text-xs h-9"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1.5 text-slate-600" />
                          Detail
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleOpenStatusDialog(report)}
                          className="w-full text-xs h-9 bg-sky-700 hover:bg-sky-800 text-white font-medium"
                        >
                          <Edit3 className="w-3.5 h-3.5 mr-1.5" />
                          Disposisi
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* ─── MODAL 1: KONFIRMASI SUBMIT ─────────────────────────────────────── */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center mb-2">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Konfirmasi Pengiriman Pengaduan
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 leading-relaxed">
              Laporan Anda akan dienkripsi dan diproses secara rahasia oleh tim Satuan Pemeriksa Internal (SPI) & Komite Etik RS Bhayangkara Nganjuk.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-slate-50 p-4 rounded-xl space-y-2.5 text-xs text-slate-700 border border-slate-200">
            <div className="flex justify-between">
              <span className="text-slate-400">Kategori:</span>
              <strong className="text-slate-800">{jenisPerilaku}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Terduga Pelaku:</span>
              <strong className="text-slate-800 text-right">
                {pelakuType === "pegawai"
                  ? (pegawaiList.find(p => (p.value || p.nik || "").toLowerCase() === (pelakuPegawaiNik || "").toLowerCase())?.label || (pelakuPegawaiNik ? `Pegawai (${pelakuPegawaiNik})` : "-"))
                  : (pelakuManualNama || "-")}
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Pihak Korban:</span>
              <span className="font-semibold text-slate-800 text-right">
                {korbanType === "diri_sendiri"
                  ? (currentUser?.nama ? `${currentUser.nama} (Diri Sendiri)` : "Diri Sendiri")
                  : korbanType === "pegawai"
                  ? (pegawaiList.find(p => (p.value || p.nik || "").toLowerCase() === (korbanPegawaiNik || "").toLowerCase())?.label || (korbanPegawaiNik ? `Pegawai (${korbanPegawaiNik})` : "-"))
                  : (korbanManualNama || "-")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Urgensi:</span>
              <span className="font-semibold text-slate-800">{tingkatUrgensi}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Tanggal Kejadian:</span>
              <span className="font-semibold text-slate-800">{tanggal ? format(tanggal, "dd MMMM yyyy", { locale: idLocale }) : "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Unit Kerja:</span>
              <span className="font-semibold text-slate-800">{isUnitKerjaManual ? unitKerjaCustom : unitKerja}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Lampiran Bukti:</span>
              <span className="font-semibold text-slate-800">{attachments.length} berkas</span>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsConfirmOpen(false)}
              disabled={isSubmitting}
              className="text-xs"
            >
              Periksa Kembali
            </Button>
            <Button
              onClick={handleConfirmSubmit}
              disabled={isSubmitting}
              className="bg-sky-700 hover:bg-sky-800 text-white text-xs font-semibold"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Mengirimkan...
                </>
              ) : (
                "Ya, Kirim Laporan Sekarang"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── MODAL 2: DETAIL LAPORAN LENGKAP & BERKAS DOSSIER ─────────────────── */}
      <Dialog
        open={Boolean(selectedDetailReport)}
        onOpenChange={(open) => !open && setSelectedDetailReport(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedDetailReport && (
            <>
              <DialogHeader className="border-b border-slate-100 pb-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded">
                      #LP-{String(selectedDetailReport.id).padStart(4, "0")}
                    </span>
                    {renderUrgensiBadge(selectedDetailReport.tingkatUrgensi)}
                  </div>
                  <div>{renderStatusBadge(selectedDetailReport.status)}</div>
                </div>
                <DialogTitle className="text-lg font-bold text-slate-900 mt-2">
                  Berkas Laporan: {selectedDetailReport.jenisPerilaku}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Diajukan: {format(new Date(selectedDetailReport.createdAt), "dd MMMM yyyy HH:mm", { locale: idLocale })}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-2">
                {/* Print Letterhead (Visible only on print) */}
                <div className="hidden print:block mb-6 border-b-2 border-slate-900 pb-4 text-center">
                  <h2 className="text-xs font-bold tracking-wider text-slate-900 uppercase">
                    KEPOLISIAN DAERAH JAWA TIMUR • BIDANG KEDOKTERAN DAN KESEHATAN
                  </h2>
                  <h1 className="text-sm font-extrabold tracking-tight text-slate-900 uppercase mt-0.5">
                    RUMAH SAKIT BHAYANGKARA NGANJUK
                  </h1>
                  <p className="text-[9px] text-slate-600 mt-0.5">
                    Jl. Wachid Hasyim No. 129, Nganjuk • Telp: (0358) 321888 • Layanan Pengaduan Etik Internal
                  </p>
                  <div className="mt-2 pt-1.5 border-t border-slate-400">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-slate-900">
                      BERKAS DOSSIER LAPORAN ETIKA & DISIPLIN PEGAWAI
                    </span>
                  </div>
                </div>

                {/* Stepper Lifecycle */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 print:hidden">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-3">
                    Tahapan Penanganan Investigasi:
                  </span>
                  <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
                    <div className={getStepperClass(1, selectedDetailReport.status)}>
                      1. Diterima
                    </div>
                    <div className={getStepperClass(2, selectedDetailReport.status)}>
                      2. Investigasi SPI
                    </div>
                    <div className={getStepperClass(3, selectedDetailReport.status)}>
                      3. Sidang Etik
                    </div>
                    <div className={getStepperClass(4, selectedDetailReport.status)}>
                      4. Keputusan
                    </div>
                  </div>
                </div>

                {/* Data Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-white border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Tanggal Kejadian:</span>
                    <strong className="text-slate-800 font-semibold text-sm">{selectedDetailReport.tanggal}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Unit Kerja Terkait:</span>
                    <strong className="text-slate-800 font-semibold text-sm">{selectedDetailReport.unitKerja}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Kategori Perilaku:</span>
                    <strong className="text-slate-800 font-semibold text-sm">{selectedDetailReport.jenisPerilaku}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Terduga Pelaku:</span>
                    <strong className="text-slate-800 font-semibold text-sm">{selectedDetailReport.namaPelaku}</strong>
                    {selectedDetailReport.nikPelaku && <span className="text-slate-400 block font-mono text-[11px]">NIK: {selectedDetailReport.nikPelaku}</span>}
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Korban:</span>
                    <strong className="text-slate-800 font-semibold text-sm">{selectedDetailReport.korban}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Pelapor:</span>
                    <strong className="text-slate-800 font-semibold text-sm">{selectedDetailReport.pelapor}</strong>
                    <span className="text-slate-400 block font-mono text-[11px]">NIK: {selectedDetailReport.nikPelapor}</span>
                  </div>
                </div>

                {/* Kronologi */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Uraian Kronologi Kejadian:
                  </h4>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {selectedDetailReport.kronologi}
                  </div>
                </div>

                {/* Bukti Lampiran */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Berkas Bukti & Lampiran:
                  </h4>
                  {parseAttachments(selectedDetailReport.buktiLampiran).length === 0 ? (
                    <p className="text-xs text-slate-400 italic">Tidak ada berkas lampiran yang diunggah.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {parseAttachments(selectedDetailReport.buktiLampiran).map((att, idx) => {
                        const isImg = isImageAttachment(att);
                        const isAudio = isAudioAttachment(att);
                        const allAtts = parseAttachments(selectedDetailReport.buktiLampiran);

                        if (isImg) {
                          return (
                            <div
                              key={idx}
                              className="p-2.5 bg-sky-50/50 hover:bg-sky-50 border border-sky-200 rounded-xl shadow-2xs transition-all flex items-center gap-3"
                            >
                              <div
                                className="relative group cursor-pointer shrink-0"
                                onClick={() => openImageLightbox(att, allAtts)}
                              >
                                <img
                                  src={att.url}
                                  alt={att.name}
                                  className="w-13 h-13 object-cover rounded-lg border border-sky-200 bg-white"
                                />
                                <div className="absolute inset-0 bg-slate-900/40 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                  <ZoomIn className="w-4 h-4" />
                                </div>
                              </div>
                              <div className="min-w-0 flex-1 space-y-1">
                                <p className="font-semibold text-slate-800 truncate text-xs" title={att.name}>
                                  {att.name}
                                </p>
                                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                                  <span>{att.size ? (att.size / 1024).toFixed(0) : "0"} KB</span>
                                  <span>•</span>
                                  <button
                                    type="button"
                                    onClick={() => openImageLightbox(att, allAtts)}
                                    className="text-sky-700 hover:text-sky-900 font-medium underline flex items-center gap-1"
                                  >
                                    <Eye className="w-3 h-3" />
                                    Perbesar
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        }

                        if (isAudio) {
                          return (
                            <div
                              key={idx}
                              className="p-2.5 bg-amber-50/60 border border-amber-200 rounded-xl shadow-2xs space-y-1.5"
                            >
                              <div className="flex items-center gap-2">
                                <Volume2 className="w-4 h-4 text-amber-700 shrink-0" />
                                <p className="font-semibold text-slate-800 truncate text-xs" title={att.name}>
                                  {att.name}
                                </p>
                              </div>
                              <audio controls src={att.url} className="h-7 w-full" />
                            </div>
                          );
                        }

                        return (
                          <div
                            key={idx}
                            className="p-2.5 bg-white border border-slate-200 rounded-xl shadow-2xs flex items-center gap-3"
                          >
                            <div className="w-13 h-13 rounded-lg bg-sky-100 border border-sky-200 flex flex-col items-center justify-center shrink-0">
                              <FileText className="w-5 h-5 text-sky-700" />
                              <span className="text-[9px] font-bold text-sky-800 uppercase leading-none mt-0.5">
                                {att.name?.split(".").pop() || "DOC"}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1 space-y-1">
                              <p className="font-semibold text-slate-800 truncate text-xs" title={att.name}>
                                {att.name}
                              </p>
                              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                                <span>{att.size ? (att.size / 1024).toFixed(0) : "0"} KB</span>
                                <span>•</span>
                                <a
                                  href={att.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sky-700 hover:text-sky-900 font-medium underline flex items-center gap-1"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  Unduh Berkas
                                </a>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Catatan Tindak Lanjut */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Catatan Disposisi / Hasil Investigasi:
                  </h4>
                  <div className="p-4 rounded-xl bg-sky-50/80 border border-sky-200 text-xs text-sky-950 leading-relaxed">
                    {selectedDetailReport.catatanTindakLanjut ? (
                      selectedDetailReport.catatanTindakLanjut
                    ) : (
                      <span className="text-slate-400 italic">Belum ada catatan tindak lanjut yang diberikan.</span>
                    )}
                  </div>
                </div>

                {/* Print Verification Signatures (Visible only on print) */}
                <div className="hidden print:grid grid-cols-2 gap-12 mt-12 pt-8 border-t border-slate-400 text-center text-xs">
                  <div className="space-y-16">
                    <p className="font-semibold text-slate-800">Penyidik / Tim Pemeriksa SPI:</p>
                    <div>
                      <p className="font-bold text-slate-900 uppercase underline">( .................................................... )</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">NRP/NIP: ........................................</p>
                    </div>
                  </div>
                  <div className="space-y-16">
                    <p className="font-semibold text-slate-800">Ketua Komite Etik & Disiplin RS:</p>
                    <div>
                      <p className="font-bold text-slate-900 uppercase underline">( .................................................... )</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">NIP: ........................................</p>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="flex justify-between items-center w-full">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                  className="text-xs flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Cetak Berkas Dossier
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setSelectedDetailReport(null)}
                  className="text-xs bg-sky-700 hover:bg-sky-800 text-white"
                >
                  Tutup
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── MODAL 3: UPDATE STATUS & DISPOSISI (ADMIN ONLY) ────────────────── */}
      <Dialog
        open={Boolean(selectedAdminReport)}
        onOpenChange={(open) => !open && setSelectedAdminReport(null)}
      >
        <DialogContent className="max-w-md">
          {selectedAdminReport && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-slate-900">
                  Update Status & Catatan Disposisi
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Perbarui tahapan penanganan untuk laporan #LP-{String(selectedAdminReport.id).padStart(4, "0")}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Status Penanganan</label>
                  <Select
                    value={statusUpdateForm.status}
                    onValueChange={(val) => setStatusUpdateForm({ ...statusUpdateForm, status: val })}
                  >
                    <SelectTrigger className="h-10 text-xs">
                      <SelectValue placeholder="Pilih status..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Menunggu Review">Menunggu Review</SelectItem>
                      <SelectItem value="Sedang Diinvestigasi">Sedang Diinvestigasi</SelectItem>
                      <SelectItem value="Selesai">Selesai Ditindak</SelectItem>
                      <SelectItem value="Ditolak">Ditolak</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Catatan Tindak Lanjut / Rekomendasi Sidang Etik
                  </label>
                  <Textarea
                    rows={4}
                    placeholder="Masukkan hasil investigasi SPI, pemanggilan saksi/pelaku, atau rekomendasi sanksi..."
                    value={statusUpdateForm.catatanTindakLanjut}
                    onChange={(e) => setStatusUpdateForm({ ...statusUpdateForm, catatanTindakLanjut: e.target.value })}
                    className="text-xs"
                  />
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  variant="outline"
                  onClick={() => setSelectedAdminReport(null)}
                  disabled={isUpdatingStatus}
                  className="text-xs"
                >
                  Batal
                </Button>
                <Button
                  onClick={handleSaveStatusUpdate}
                  disabled={isUpdatingStatus}
                  className="bg-sky-700 hover:bg-sky-800 text-white text-xs font-semibold"
                >
                  {isUpdatingStatus ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── MODAL 4: IMAGE LIGHTBOX PREVIEW (WITH MULTI-IMAGE NAVIGATION) ─── */}
      <Dialog open={Boolean(previewImage)} onOpenChange={(open) => !open && setPreviewImage(null)}>
        <DialogContent className="max-w-3xl p-4 bg-white">
          <DialogHeader className="border-b border-slate-100 pb-2">
            <div className="flex items-center justify-between gap-3">
              <DialogTitle className="text-sm font-semibold text-slate-800 truncate flex-1">
                Pratinjau Bukti: {previewImage?.name}
              </DialogTitle>
              {previewImageList.length > 1 && (
                <span className="text-[11px] font-medium bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full shrink-0">
                  Gambar {previewImageIndex + 1} dari {previewImageList.length}
                </span>
              )}
            </div>
          </DialogHeader>

          <div className="relative flex items-center justify-center p-2 min-h-[300px] max-h-[70vh] overflow-hidden bg-slate-900/5 rounded-xl group">
            {previewImage && (
              <img
                src={previewImage.url}
                alt={previewImage.name}
                className="max-h-[65vh] max-w-full object-contain rounded-lg shadow-sm"
              />
            )}

            {/* Prev / Next Navigation Buttons */}
            {previewImageList.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevImage}
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-slate-900/60 hover:bg-slate-900/80 text-white p-2 rounded-full shadow-md transition-all focus:outline-hidden"
                  title="Gambar Sebelumnya (Panah Kiri ◀)"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleNextImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-slate-900/60 hover:bg-slate-900/80 text-white p-2 rounded-full shadow-md transition-all focus:outline-hidden"
                  title="Gambar Selanjutnya (Panah Kanan ▶)"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>

          <DialogFooter className="flex flex-col sm:flex-row justify-between items-center sm:justify-between w-full gap-2">
            <div className="flex items-center gap-3 text-xs text-slate-500">
              {previewImage && (
                <a
                  href={previewImage.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-700 hover:text-sky-900 font-medium underline flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Buka Tab Baru
                </a>
              )}
              {previewImageList.length > 1 && (
                <span className="hidden sm:inline text-[11px] text-slate-400">
                  Tip: Tekan ◀ ▶ keyboard untuk navigasi
                </span>
              )}
            </div>
            <Button
              variant="default"
              size="sm"
              onClick={() => setPreviewImage(null)}
              className="text-xs bg-sky-700 hover:bg-sky-800 text-white"
            >
              Tutup Pratinjau
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
