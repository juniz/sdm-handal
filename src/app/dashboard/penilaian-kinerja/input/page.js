"use client";

import { useState, useEffect, useRef } from "react";
import moment from "moment";
import { 
	Calendar as CalendarIcon, 
	CheckCircle, 
	Clock, 
	Plus, 
	Trash2, 
	Send, 
	AlertCircle,
	AlertTriangle,
	Loader2, 
	PlusCircle, 
	Info,
	Edit3
} from "lucide-react";

export default function DailyInputPage() {
	const [selectedDate, setSelectedDate] = useState(moment().format("YYYY-MM-DD"));
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [activeTab, setActiveTab] = useState("kegiatan"); // "kegiatan" | "status"
	
	const [scheduleInfo, setScheduleInfo] = useState({ hasSchedule: false, shift: "", isTambahan: false });
	const [shiftDetails, setShiftDetails] = useState([]);
	const [showWarningModal, setShowWarningModal] = useState(false);
	const [warningModalData, setWarningModalData] = useState({ shiftName: "", checkoutTime: "" });
	const [attendanceInfo, setAttendanceInfo] = useState(null);
	const [harianRecord, setHarianRecord] = useState(null);
	const [activities, setActivities] = useState([]);
	const [alasanTerlambat, setAlasanTerlambat] = useState("");
	const [newActivityTitle, setNewActivityTitle] = useState("");
	const [newActivityDesc, setNewActivityDesc] = useState("");
	const [newActivityPriority, setNewActivityPriority] = useState("sedang");

	const [wTinggi, setWTinggi] = useState(3);
	const [wSedang, setWSedang] = useState(2);
	const [wRendah, setWRendah] = useState(1);

	const [suggestions, setSuggestions] = useState([]);
	const [filteredSuggestions, setFilteredSuggestions] = useState([]);
	const [showSuggestions, setShowSuggestions] = useState(false);
	
	const [errorMsg, setErrorMsg] = useState("");
	const [successMsg, setSuccessMsg] = useState("");

	const activitiesRef = useRef(activities);
	activitiesRef.current = activities;

	const isSavingRef = useRef(false);
	const hasPendingSaveRef = useRef(false);

	useEffect(() => {
		loadDailyData();
	}, [selectedDate]);

	useEffect(() => {
		const loadWeights = async () => {
			try {
				const res = await fetch("/api/penilaian/parameter");
				if (res.ok) {
					const data = await res.json();
					if (data?.success && Array.isArray(data.data)) {
						const tinggi = data.data.find(p => p.kode === "KGT_BOBOT_TINGGI")?.nilai_skor;
						const sedang = data.data.find(p => p.kode === "KGT_BOBOT_SEDANG")?.nilai_skor;
						const rendah = data.data.find(p => p.kode === "KGT_BOBOT_RENDAH")?.nilai_skor;
						if (tinggi !== undefined) setWTinggi(Number(tinggi));
						if (sedang !== undefined) setWSedang(Number(sedang));
						if (rendah !== undefined) setWRendah(Number(rendah));
					}
				}
			} catch (e) {
				console.error("Gagal memuat bobot prioritas parameter:", e);
			}
		};
		loadWeights();
	}, []);

	const loadDailyData = async () => {
		setLoading(true);
		setErrorMsg("");
		setSuccessMsg("");
		try {
			// 1. Fetch Schedule
			const month = moment(selectedDate).format("MM");
			const year = moment(selectedDate).format("YYYY");
			const day = moment(selectedDate).format("D");

			const schedRes = await fetch(`/api/penilaian/jadwal?bulan=${month}&tahun=${year}`);
			if (!schedRes.ok) throw new Error("Gagal mengambil jadwal");
			const schedData = await schedRes.json();
			setShiftDetails(schedData.shiftDetails || []);

			if (!schedData.hasSchedule || !schedData.schedule[`h${day}`]) {
				setScheduleInfo({ hasSchedule: false, shift: "", isTambahan: false });
				setLoading(false);
				return;
			}

			const shiftName = schedData.schedule[`h${day}`];
			const isTambahan = schedData.isTambahan ? schedData.isTambahan[`h${day}`] : false;
			setScheduleInfo({ hasSchedule: true, shift: shiftName, isTambahan: isTambahan });

			// 2. Fetch Harian Record
			const harianRes = await fetch(`/api/penilaian/harian?tanggal=${selectedDate}`);
			if (!harianRes.ok) throw new Error("Gagal mengambil data harian");
			const harianData = await harianRes.json();

			if (harianData.data) {
				setHarianRecord(harianData.data);
				setActivities(harianData.data.kegiatan || []);
				setAlasanTerlambat(harianData.data.alasan_terlambat || "");
				
				// Re-resolve attendance status if it's still a draft
				if (harianData.data.status === "draft") {
					const attRes = await fetch(`/api/penilaian/absensi-status?tanggal=${selectedDate}`);
					if (attRes.ok) {
						const attData = await attRes.json();
						setAttendanceInfo(attData);
						
						// If the resolved attendance is different from what's stored in the draft,
						// update the database draft to keep it in sync!
						if (
							attData.sumber !== harianData.data.sumber_absensi ||
							attData.nilai_kondisi !== harianData.data.nilai_kondisi ||
							Number(attData.skor_absensi) !== Number(harianData.data.skor_absensi)
						) {
							await fetch(`/api/penilaian/harian/${harianData.data.id}`, {
								method: "PUT",
								headers: { "Content-Type": "application/json" },
								body: JSON.stringify({
									tanggal: selectedDate,
									sumber_absensi: attData.sumber,
									nilai_kondisi: attData.nilai_kondisi,
									skor_absensi: attData.skor_absensi,
									alasan_terlambat: harianData.data.alasan_terlambat || "",
									kegiatan: harianData.data.kegiatan || []
								})
							});
							
							// Update local record state
							setHarianRecord(prev => ({
								...prev,
								sumber_absensi: attData.sumber,
								nilai_kondisi: attData.nilai_kondisi,
								skor_absensi: attData.skor_absensi
							}));
						}
					} else {
						setAttendanceInfo({
							sumber: harianData.data.sumber_absensi,
							nilai_kondisi: harianData.data.nilai_kondisi,
							skor_absensi: harianData.data.skor_absensi
						});
					}
				} else {
					setAttendanceInfo({
						sumber: harianData.data.sumber_absensi,
						nilai_kondisi: harianData.data.nilai_kondisi,
						skor_absensi: harianData.data.skor_absensi
					});
				}
			} else {
				setHarianRecord(null);
				setActivities([]);
				setAlasanTerlambat("");
				// Fetch resolved attendance status on the fly
				const attRes = await fetch(`/api/penilaian/absensi-status?tanggal=${selectedDate}`);
				if (attRes.ok) {
					const attData = await attRes.json();
					setAttendanceInfo(attData);
				} else {
					setAttendanceInfo(null);
				}
			}

			// 3. Fetch Master Suggestions
			const sugRes = await fetch("/api/penilaian/master-kegiatan?mode=suggestions");
			if (sugRes.ok) {
				const sugData = await sugRes.json();
				setSuggestions(sugData.data || []);
				setFilteredSuggestions(sugData.data || []);
			}
		} catch (err) {
			console.error(err);
			setErrorMsg(err.message || "Gagal memuat data");
		} finally {
			setLoading(false);
		}
	};

	const startDraft = async () => {
		setSaving(true);
		setErrorMsg("");
		try {
			const res = await fetch("/api/penilaian/harian", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ tanggal: selectedDate })
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Gagal memulai draf");
			
			setHarianRecord(data.data);
			setActivities([]);
			setAlasanTerlambat("");
			setSuccessMsg("Draf penilaian harian berhasil dimulai!");
		} catch (err) {
			setErrorMsg(err.message);
		} finally {
			setSaving(false);
		}
	};

	const handleActivityTitleChange = (val) => {
		setNewActivityTitle(val);
		if (!val.trim()) {
			setFilteredSuggestions(suggestions);
		} else {
			const query = val.toLowerCase();
			const filtered = suggestions.filter(s => 
				s.nama_kegiatan.toLowerCase().includes(query) || 
				s.deskripsi?.toLowerCase().includes(query)
			);
			setFilteredSuggestions(filtered);
		}
	};

	const handleSelectSuggestion = (sug) => {
		setNewActivityTitle(sug.nama_kegiatan);
		if (sug.deskripsi) {
			setNewActivityDesc(sug.deskripsi);
		}
		if (sug.prioritas) {
			setNewActivityPriority(sug.prioritas);
		}
		setShowSuggestions(false);
	};

	const handleAddActivity = async (e) => {
		e.preventDefault();
		if (!newActivityTitle.trim()) return;
		if (activities.length >= 20) {
			setErrorMsg("Maksimal 20 kegiatan per hari");
			return;
		}

		const updatedList = [
			...activities,
			{
				id: null,
				judul_kegiatan: newActivityTitle.trim(),
				penjabaran: newActivityDesc.trim(),
				prioritas: newActivityPriority,
				status_selesai: "belum",
				alasan_belum_selesai: "",
				urutan: activities.length + 1
			}
		];

		await syncActivities(updatedList);
		setNewActivityTitle("");
		setNewActivityDesc("");
		setNewActivityPriority("sedang");
	};

	const handleDeleteActivity = async (indexToDelete) => {
		const updatedList = activities.filter((_, idx) => idx !== indexToDelete);
		// Re-assign order/urutan
		const reorderedList = updatedList.map((item, idx) => ({
			...item,
			urutan: idx + 1
		}));
		await syncActivities(reorderedList);
	};

	const handleToggleComplete = async (idx) => {
		const updatedList = [...activities];
		const newStatus = updatedList[idx].status_selesai === "selesai" ? "belum" : "selesai";
		updatedList[idx] = {
			...updatedList[idx],
			status_selesai: newStatus,
			alasan_belum_selesai: newStatus === "selesai" ? null : (updatedList[idx].alasan_belum_selesai || ""),
			selesai_at: newStatus === "selesai" ? (updatedList[idx].selesai_at || moment().format("YYYY-MM-DD HH:mm:ss")) : null
		};
		await syncActivities(updatedList);
	};

	const handlePriorityChange = async (index, newPriority) => {
		const updatedList = [...activities];
		updatedList[index] = {
			...updatedList[index],
			prioritas: newPriority
		};
		await syncActivities(updatedList);
	};

	const syncActivities = async (updatedList) => {
		// 1. Update React state immediately (optimistic UI)
		setActivities(updatedList);
		activitiesRef.current = updatedList;

		// 2. Set pending flag
		hasPendingSaveRef.current = true;

		// 3. If already saving, return and let the active save loop pick it up
		if (isSavingRef.current) {
			return;
		}

		// 4. Start save loop
		isSavingRef.current = true;
		setSaving(true);
		setErrorMsg("");

		try {
			while (hasPendingSaveRef.current) {
				// Clear the flag before making the request
				hasPendingSaveRef.current = false;
				const listToSave = activitiesRef.current;

				const res = await fetch(`/api/penilaian/harian/${harianRecord.id}`, {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ 
						kegiatan: listToSave,
						alasan_terlambat: alasanTerlambat || null
					})
				});
				const data = await res.json();
				if (!res.ok) throw new Error(data.error || "Gagal menyimpan kegiatan");
				
				// Update activities state with the latest saved data from server,
				// but only if there was no new user input in the meantime!
				if (!hasPendingSaveRef.current) {
					setActivities(data.data);
					activitiesRef.current = data.data;
				}
			}
		} catch (err) {
			setErrorMsg(err.message);
		} finally {
			isSavingRef.current = false;
			setSaving(false);
		}
	};

	const handleSaveAlasanTerlambat = async () => {
		if (!harianRecord) return;
		setSaving(true);
		setErrorMsg("");
		try {
			const res = await fetch(`/api/penilaian/harian/${harianRecord.id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ 
					kegiatan: activities,
					alasan_terlambat: alasanTerlambat || null
				})
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Gagal menyimpan alasan terlambat");
			setActivities(data.data);
		} catch (err) {
			setErrorMsg(err.message);
		} finally {
			setSaving(false);
		}
	};

	const handleSubmitPenilaian = async () => {
		if (activities.length === 0) {
			setErrorMsg("Minimal harus mengisi 1 kegiatan sebelum dikirim");
			return;
		}

		// Validasi jam pulang berdasarkan jadwal (hanya jika tanggal pengisian adalah hari ini)
		const todayStr = moment().format("YYYY-MM-DD");
		if (selectedDate === todayStr && scheduleInfo.hasSchedule && scheduleInfo.shift) {
			const shiftName = scheduleInfo.shift;
			if (shiftName !== "OFF" && shiftName !== "Libur") {
				const sInfo = shiftDetails.find(s => s.shift === shiftName);
				if (sInfo) {
					const jamMasuk = sInfo.jam_masuk;
					const jamPulang = sInfo.jam_pulang;

					// Tentukan batas waktu checkout
					let targetCheckout = moment(`${selectedDate} ${jamPulang}`, "YYYY-MM-DD HH:mm:ss");
					if (jamPulang < jamMasuk) {
						// Shift malam, checkout di keesokan harinya
						targetCheckout = targetCheckout.add(1, "day");
					}

					const now = moment();
					if (now.isBefore(targetCheckout)) {
						setWarningModalData({
							shiftName: shiftName,
							checkoutTime: targetCheckout.format("HH:mm")
						});
						setShowWarningModal(true);
						return;
					}
				}
			}
		}

		setSubmitting(true);
		setErrorMsg("");
		setSuccessMsg("");
		try {
			const res = await fetch(`/api/penilaian/harian/${harianRecord.id}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ action: "submit" })
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Gagal mengirim penilaian");
			
			setSuccessMsg("Penilaian harian berhasil dikirim untuk approval supervisor!");
			await loadDailyData();
		} catch (err) {
			setErrorMsg(err.message);
		} finally {
			setSubmitting(false);
		}
	};

	// Calculate Estimated Scores (weighted)
	const getWeight = (prioritas) => {
		if (prioritas === "tinggi") return wTinggi;
		if (prioritas === "rendah") return wRendah;
		return wSedang;
	};

	const completedCount = activities.filter(a => a.status_selesai === "selesai").length;
	const totalCount = activities.length;

	const totalWeight = activities.reduce((acc, curr) => acc + getWeight(curr.prioritas), 0);
	const completedWeight = activities.reduce((acc, curr) => acc + (curr.status_selesai === "selesai" ? getWeight(curr.prioritas) : 0), 0);

	const estSkorKegiatan = totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;
	const estSkorAbsensi = attendanceInfo ? Number(attendanceInfo.skor_absensi || 0) : 0;
	const estSkorTotal = Math.round((estSkorKegiatan * 0.6) + (estSkorAbsensi * 0.4));

	const isReadOnly = harianRecord && (harianRecord.status === "submitted" || harianRecord.status === "approved");

	const getStatusBadge = (status) => {
		switch (status) {
			case "draft":
				return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-50 text-slate-700 border border-slate-200 font-figtree uppercase tracking-wider">Draf</span>;
			case "submitted":
				return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-figtree uppercase tracking-wider animate-pulse">Menunggu Approval</span>;
			case "approved":
				return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-figtree uppercase tracking-wider">Disetujui</span>;
			case "revisi":
				return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-rose-50 text-rose-800 border border-rose-200 font-figtree uppercase tracking-wider">Perlu Revisi</span>;
			default:
				return null;
		}
	};

	return (
		<div className="w-full p-4 md:p-6 space-y-5 font-noto-sans">

			{/* ── Page Header ─────────────────────────────────────────── */}
			<div className="relative bg-primary-900 border border-primary-800/40 rounded-2xl overflow-hidden shadow-sm">
				{/* Decorative radial glow */}
				<div className="absolute -top-16 -right-16 w-64 h-64 bg-primary-700/10 rounded-full blur-3xl pointer-events-none" />
				<div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-6 md:p-8">
					<div>
						<div className="flex items-center gap-2 mb-2">
							<span className="text-[10px] font-bold text-primary-400 uppercase tracking-widest font-mono">Kinerja Harian</span>
						</div>
						<h1 className="text-2xl md:text-3xl font-extrabold tracking-tight font-figtree text-slate-800 leading-tight">
							Penilaian Saya Hari Ini
						</h1>
						<p className="text-slate-500 text-sm mt-1.5 font-medium">
							Kelola target kegiatan harian dan tinjau status kehadiran Anda.
						</p>
					</div>
					{/* Date picker pill */}
					<div className="flex items-center gap-2 bg-white hover:bg-slate-50 active:scale-[0.98] transition-all duration-200 px-4 py-2.5 rounded-xl border border-slate-200 cursor-pointer shrink-0 shadow-xs">
						<CalendarIcon className="h-4 w-4 text-primary-400" />
						<input
							type="date"
							value={selectedDate}
							max={moment().format("YYYY-MM-DD")}
							onChange={(e) => setSelectedDate(e.target.value)}
							className="bg-transparent text-slate-850 font-bold text-sm focus:outline-none cursor-pointer"
						/>
					</div>
				</div>
			</div>

			{/* ── Feedback banners ────────────────────────────────────── */}
			{errorMsg && (
				<div className="p-4 bg-red-50 border border-red-100 text-red-800 rounded-xl flex items-start gap-3">
					<AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
					<span className="font-semibold text-sm leading-relaxed">{errorMsg}</span>
				</div>
			)}
			{successMsg && (
				<div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl flex items-start gap-3">
					<CheckCircle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
					<span className="font-semibold text-sm leading-relaxed">{successMsg}</span>
				</div>
			)}

			{/* ── Main content ────────────────────────────────────────── */}
			{loading ? (
				<div className="flex flex-col justify-center items-center py-24 gap-3">
					<Loader2 className="h-8 w-8 text-[#185FA5] animate-spin" />
					<span className="text-sm text-slate-400 font-medium">Memuat data penilaian…</span>
				</div>
			) : !scheduleInfo.hasSchedule ? (
				/* ── Off-day empty state */
				<div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center shadow-sm">
					<div className="w-16 h-16 bg-[#E6F1FB] text-[#185FA5] rounded-2xl flex items-center justify-center mx-auto mb-4">
						<Clock className="h-8 w-8" />
					</div>
					<h3 className="text-lg font-bold text-slate-800 font-figtree mb-1">Hari Off / Libur</h3>
					<p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed">
						Hari ini adalah hari off atau libur sesuai jadwal shift Anda. Tidak perlu mengisi penilaian harian.
					</p>
				</div>
			) : (
				<>
					{/* Mobile Tab Switcher */}
					<div className="lg:hidden bg-slate-100 p-1 rounded-xl flex shadow-sm border border-slate-200/50">
						<button
							onClick={() => setActiveTab("kegiatan")}
							className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all ${
								activeTab === "kegiatan"
									? "bg-white text-slate-800 shadow-sm"
									: "text-slate-500 hover:text-slate-700"
							}`}
						>
							Laporan Kegiatan
						</button>
						<button
							onClick={() => setActiveTab("status")}
							className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all ${
								activeTab === "status"
									? "bg-white text-slate-800 shadow-sm"
									: "text-slate-500 hover:text-slate-700"
							}`}
						>
							Status &amp; Nilai
						</button>
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
	
						{/* ── LEFT COLUMN: Status cards ───────────────────── */}
						<div className={`${activeTab === "status" ? "block" : "hidden"} lg:block space-y-5 lg:col-span-1`}>

						{/* Attendance & Schedule card */}
						<div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm divide-y divide-slate-100 transition-shadow duration-200 hover:shadow-md">
							{/* Card header */}
							<div className="flex justify-between items-center px-5 py-4">
								<h3 className="font-bold text-slate-800 font-figtree text-sm">Status Kehadiran</h3>
								{harianRecord && getStatusBadge(harianRecord.status)}
							</div>

							{/* Card body: Shift */}
							<div className="px-5 py-4 space-y-4">
								<div>
									<span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-mono block mb-1">Shift Jadwal</span>
									<div className="flex items-center gap-2">
										<span className="text-sm font-semibold text-slate-800">{scheduleInfo.shift || "Pagi"}</span>
										{scheduleInfo.isTambahan && (
											<span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-md border border-amber-200 uppercase tracking-wide">
												Shift Tambahan
											</span>
										)}
									</div>
								</div>

								{attendanceInfo && (
									<>
										<div>
											<span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-mono block mb-1">Sumber Data</span>
											<span className="text-sm font-semibold text-slate-800 uppercase">{attendanceInfo.sumber}</span>
										</div>
										<div>
											<span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-mono block mb-1">Resolusi Kondisi</span>
											<span className="text-sm font-semibold text-slate-800 capitalize">
												{attendanceInfo.nilai_kondisi.replace(/_/g, " ")}
											</span>
										</div>

										{/* Absensi score chip */}
										<div className="flex justify-between items-center bg-primary-50 border border-primary-100 rounded-xl p-3">
											<div className="flex items-center gap-2">
												<Clock className="h-4 w-4 text-primary-600" />
												<span className="text-xs font-bold text-slate-700 font-figtree">Skor Absensi (40%)</span>
											</div>
											<span className="text-xl font-black text-slate-800 font-figtree">
												{attendanceInfo.skor_absensi ?? "-"}
											</span>
										</div>

										{/* Late reason textarea */}
										{harianRecord && ["terlambat_ringan", "terlambat_sedang", "terlambat_berat"].includes(attendanceInfo.nilai_kondisi) && (
											<div className="space-y-1.5">
												<label htmlFor="alasan_terlambat" className="text-[10px] text-red-600 font-bold uppercase tracking-widest font-mono block">
													Alasan Terlambat
												</label>
												{isReadOnly ? (
													<p className="text-xs font-semibold text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 break-words leading-relaxed">
														{alasanTerlambat || "Tidak ada alasan diisi."}
													</p>
												) : (
													<textarea
														id="alasan_terlambat"
														placeholder="Tulis alasan keterlambatan Anda di sini…"
														value={alasanTerlambat}
														onChange={(e) => setAlasanTerlambat(e.target.value)}
														onBlur={handleSaveAlasanTerlambat}
														rows={3}
														maxLength={500}
														className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/10 resize-none font-semibold text-slate-800 transition-all placeholder:text-slate-300"
													/>
												)}
											</div>
										)}
									</>
								)}
							</div>
						</div>

						{/* Live score card */}
						{harianRecord && (
							<div className="bg-white border border-primary-100 rounded-2xl shadow-sm overflow-hidden transition-shadow duration-200 hover:shadow-md">
								{/* Azure top accent bar */}
								<div className="h-1 bg-gradient-to-r from-primary-700 via-primary-600 to-primary-700" />
								<div className="p-5 space-y-4">
									<h3 className="font-bold text-slate-800 text-sm font-figtree flex items-center gap-2">
										<CheckCircle className="h-4 w-4 text-primary-600" />
										Estimasi Nilai Harian
									</h3>

									<div className="grid grid-cols-2 gap-3">
										<div className="bg-primary-50 border border-primary-100 p-3 rounded-xl text-center">
											<span className="text-[9px] text-slate-550 block uppercase font-bold tracking-widest font-mono mb-1">Kegiatan</span>
											<span className="text-2xl font-black text-slate-800 font-figtree">
												{isReadOnly ? Math.round(harianRecord.skor_kegiatan) : estSkorKegiatan}
											</span>
										</div>
										<div className="bg-primary-50 border border-primary-100 p-3 rounded-xl text-center">
											<span className="text-[9px] text-slate-550 block uppercase font-bold tracking-widest font-mono mb-1">Absensi</span>
											<span className="text-2xl font-black text-slate-800 font-figtree">
												{isReadOnly ? Math.round(harianRecord.skor_absensi) : estSkorAbsensi}
											</span>
										</div>
									</div>

									<div className="pt-4 border-t border-primary-100 flex justify-between items-center">
										<div>
											<span className="text-[10px] font-bold text-primary-400 font-mono uppercase tracking-widest">Skor Akhir Terbobot</span>
											<p className="text-[10px] text-slate-400 mt-0.5">60% kegiatan + 40% absensi</p>
										</div>
										<span className="text-4xl font-black text-primary-400 font-figtree">
											{isReadOnly ? Math.round(harianRecord.skor_total) : estSkorTotal}
										</span>
									</div>
								</div>
							</div>
						)}

						{/* Revision notes */}
						{harianRecord?.status === "revisi" && (
							<div className="bg-red-50 border border-red-100 p-4 rounded-2xl space-y-2">
								<div className="flex items-center gap-2 text-red-800 font-bold text-sm font-figtree">
									<AlertTriangle className="h-4 w-4 text-red-500" />
									Catatan Revisi Supervisor
								</div>
								<p className="text-red-700 text-xs font-medium leading-relaxed bg-white/70 p-3 rounded-xl border border-red-200/50">
									{harianRecord.catatan_supervisor || "Harap sesuaikan kegiatan dengan jadwal yang telah disepakati."}
								</p>
							</div>
						)}
					</div>

					{/* ── RIGHT COLUMN: Activities sheet ──────────────── */}
					<div className={`${activeTab === "kegiatan" ? "block" : "hidden"} lg:block lg:col-span-2 space-y-5`}>
						{!harianRecord ? (
							/* Start draft CTA */
							<div className="bg-white border border-slate-200/60 rounded-2xl p-10 text-center shadow-sm">
								<div className="w-14 h-14 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
									<Edit3 className="h-6 w-6" />
								</div>
								<h3 className="text-lg font-bold text-slate-800 font-figtree mb-1">Mulai Laporan Harian</h3>
								<p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">
									Buat draf laporan kinerja baru untuk mengisi item kegiatan yang Anda selesaikan hari ini.
								</p>
								<button
									onClick={startDraft}
									disabled={saving}
									className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-200 disabled:text-slate-400 transition-all duration-200 text-white font-bold rounded-xl text-sm shadow hover:shadow-md inline-flex items-center gap-2 hover:-translate-y-[1px] active:scale-[0.98] cursor-pointer"
								>
									{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
									Mulai Isi Penilaian Hari Ini
								</button>
							</div>
						) : (
							/* Activities sheet */
							<div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm">
								{/* Sheet header */}
								<div className="flex justify-between items-center px-5 md:px-6 py-4 border-b border-slate-100">
									<div className="flex items-center gap-3">
										<div>
											<h3 className="font-bold text-slate-800 font-figtree">Daftar Kegiatan Kerja</h3>
											<p className="text-xs text-slate-400 mt-0.5 font-medium">Kelola minimal 1 hingga 20 pekerjaan utama.</p>
										</div>
										{saving && (
											<span className="flex items-center gap-1.5 text-xs font-semibold text-[#185FA5] bg-[#E6F1FB] px-2.5 py-1 rounded-full border border-blue-100 animate-pulse">
												<Loader2 className="h-3 w-3 animate-spin" />
												Menyimpan...
											</span>
										)}
									</div>
									{/* Progress pill */}
									<div className="flex flex-col items-end gap-1.5">
										<span className="text-xs font-bold text-slate-500 font-figtree tabular-nums">{completedCount}/{totalCount} selesai</span>
										<div className="w-28 h-1.5 bg-slate-100 rounded-full overflow-hidden">
											<div
												className="h-full bg-gradient-to-r from-primary-700 to-primary-600 transition-all duration-300 rounded-full"
												style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
											/>
										</div>
									</div>
								</div>

								<div className="p-5 md:p-6 space-y-5">
									{/* ── Add-activity inline form */}
									{!isReadOnly && (
										<form onSubmit={handleAddActivity} className="p-4 bg-[#F8FAFC] border border-slate-200/80 rounded-xl space-y-3">
											<div className="grid grid-cols-1 md:grid-cols-4 gap-3">
												{/* Title input + autocomplete */}
												<div className="md:col-span-2 relative">
													<input
														type="text"
														placeholder="Nama kegiatan kerja…"
														value={newActivityTitle}
														onChange={(e) => handleActivityTitleChange(e.target.value)}
														onFocus={() => setShowSuggestions(true)}
														onBlur={() => setShowSuggestions(false)}
														maxLength={200}
														required
														className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/10 font-medium placeholder:text-slate-300 transition-all"
													/>
													{showSuggestions && filteredSuggestions.length > 0 && (
														<div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-56 overflow-y-auto divide-y divide-slate-100 animate-in fade-in slide-in-from-top-1 duration-150">
															{filteredSuggestions.map((sug) => (
																<button
																	key={sug.id}
																	type="button"
																	onMouseDown={() => handleSelectSuggestion(sug)}
																	className="w-full text-left px-4 py-2.5 hover:bg-primary-50 transition-colors text-xs font-semibold text-slate-700 flex flex-col gap-0.5 cursor-pointer"
																>
																	<span className="text-slate-800 font-bold">{sug.nama_kegiatan}</span>
																	{sug.deskripsi && <span className="text-[10px] text-slate-400 font-medium line-clamp-1">{sug.deskripsi}</span>}
																</button>
															))}
														</div>
													)}
												</div>
												{/* Priority select */}
												<div className="md:col-span-1">
													<select
														value={newActivityPriority}
														disabled={saving}
														onChange={(e) => setNewActivityPriority(e.target.value)}
														className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/10 font-bold text-slate-800 cursor-pointer"
													>
														<option value="tinggi">Tinggi (x{wTinggi})</option>
														<option value="sedang">Sedang (x{wSedang})</option>
														<option value="rendah">Rendah (x{wRendah})</option>
													</select>
												</div>
												{/* Submit button */}
												<div className="md:col-span-1">
													<button
														type="submit"
														disabled={saving || !newActivityTitle.trim()}
														className="w-full py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-lg text-sm transition-all duration-200 flex items-center justify-center gap-1.5 shadow-sm hover:shadow cursor-pointer active:scale-[0.98]"
													>
														{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
														Tambah
													</button>
												</div>
											</div>
											<textarea
												placeholder="Penjabaran singkat / catatan hasil pekerjaan (opsional)"
												value={newActivityDesc}
												onChange={(e) => setNewActivityDesc(e.target.value)}
												rows={2}
												className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/10 resize-none font-medium placeholder:text-slate-300 transition-all"
											/>
										</form>
									)}

									{/* ── Activity list */}
									{activities.length === 0 ? (
										<div className="text-center py-10 border border-dashed border-slate-200 rounded-xl space-y-2">
											<Info className="h-6 w-6 text-slate-300 mx-auto" />
											<p className="text-sm text-slate-400 font-medium">Belum ada kegiatan yang ditambahkan.</p>
										</div>
									) : (
										<div className="space-y-2.5">
											{activities.map((item, index) => (
												<div
													key={item.id || index}
													className={`py-3.5 px-4 rounded-xl border-l-4 transition-all duration-200 flex items-start justify-between gap-4 group ${
														item.status_selesai === "selesai"
															? "border-emerald-500 bg-emerald-50/30"
															: "border-slate-200 bg-[#F8FAFC] hover:border-primary-400 hover:bg-primary-50"
													}`}
												>
													<div className="flex items-start gap-3 w-full">
														<input
															type="checkbox"
															checked={item.status_selesai === "selesai"}
															disabled={isReadOnly}
															onChange={() => handleToggleComplete(index)}
															className="mt-0.5 h-5 w-5 text-primary-600 border-slate-300 rounded focus:ring-primary-600 cursor-pointer disabled:cursor-not-allowed"
														/>
														<div className="flex-1 min-w-0">
															<span className={`text-sm font-semibold text-slate-800 block break-words leading-snug ${item.status_selesai === "selesai" ? "line-through text-slate-400" : ""}`}>
																{item.judul_kegiatan}
															</span>
															{isReadOnly ? (
																item.penjabaran && (
																	<p className="text-xs text-slate-500 mt-1 leading-relaxed break-words">{item.penjabaran}</p>
																)
															) : (
																<input
																	type="text"
																	placeholder="Penjabaran singkat / catatan hasil pekerjaan (opsional)"
																	value={item.penjabaran || ""}
																	onChange={(e) => {
																		const updatedList = [...activities];
																		updatedList[index] = { ...updatedList[index], penjabaran: e.target.value };
																		setActivities(updatedList);
																	}}
																	onBlur={() => syncActivities(activities)}
																	className="w-full mt-1.5 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/10 font-semibold text-slate-800 placeholder:text-slate-355 transition-colors"
																/>
															)}
															<div className="flex flex-wrap items-center gap-2 mt-2">
																{isReadOnly ? (
																	<span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider font-figtree border ${
																		item.prioritas === "tinggi"
																			? "bg-red-50 text-red-600 border-red-100"
																			: item.prioritas === "rendah"
																			? "bg-slate-100 text-slate-500 border-slate-200"
																			: "bg-amber-50 text-amber-600 border-amber-100"
																	}`}>
																		{item.prioritas || "sedang"}
																	</span>
																) : (
																	<select
																		value={item.prioritas || "sedang"}
																		onChange={(e) => handlePriorityChange(index, e.target.value)}
																		className={`text-[10px] font-bold uppercase tracking-wider rounded-md border px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary-600 cursor-pointer ${
																			item.prioritas === "tinggi"
																				? "bg-red-50 text-red-600 border-red-200"
																				: item.prioritas === "rendah"
																				? "bg-slate-50 text-slate-500 border-slate-200"
																				: "bg-amber-50 text-amber-600 border-amber-200"
																		}`}
																	>
																		<option value="tinggi">Tinggi (x{wTinggi})</option>
																		<option value="sedang">Sedang (x{wSedang})</option>
																		<option value="rendah">Rendah (x{wRendah})</option>
																	</select>
																)}
																{item.status_selesai === "selesai" && item.selesai_at && (
																	<span className="text-[10px] text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-md font-bold font-figtree">
																		Selesai: {moment(item.selesai_at).format("HH:mm")}
																	</span>
																)}
															</div>
															{/* Unfinished reason */}
															{item.status_selesai === "belum" && (
																<div className="mt-2.5 space-y-1">
																	<span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest font-mono block">Alasan Belum Selesai</span>
																	{isReadOnly ? (
																		<p className="text-xs font-semibold text-slate-600 bg-white/70 p-2 rounded-lg border border-slate-200/50 break-words leading-relaxed">
																			{item.alasan_belum_selesai || "-"}
																		</p>
																	) : (
																		<input
																			type="text"
																			placeholder="Tulis alasan pekerjaan ini belum diselesaikan…"
																			value={item.alasan_belum_selesai || ""}
																			onChange={(e) => {
																				const updatedList = [...activities];
																				updatedList[index] = { ...updatedList[index], alasan_belum_selesai: e.target.value };
																				setActivities(updatedList);
																			}}
																			onBlur={() => syncActivities(activities)}
																			className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 font-semibold text-slate-800 placeholder:text-slate-300 transition-colors"
																		/>
																	)}
																</div>
															)}
														</div>
													</div>
													{!isReadOnly && (
														<button
															onClick={() => handleDeleteActivity(index)}
															className="text-slate-300 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-all opacity-100 lg:opacity-0 lg:group-hover:opacity-100 lg:focus:opacity-100 shrink-0 cursor-pointer"
														>
															<Trash2 className="h-4 w-4" />
														</button>
													)}
												</div>
											))}
										</div>
									)}

									{/* ── Submit action */}
									{harianRecord && !isReadOnly && (
										<div className="pt-4 border-t border-slate-100 flex justify-end">
											<button
												onClick={handleSubmitPenilaian}
												disabled={submitting || activities.length === 0}
												className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl text-sm transition-all duration-200 flex items-center gap-2 shadow hover:-translate-y-[1px] active:scale-[0.98] cursor-pointer"
											>
												{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
												Kirim Penilaian Ke Supervisor
											</button>
										</div>
									)}

									{/* ── Read-only notice */}
									{isReadOnly && (
										<div className="p-4 bg-[#F8FAFC] border border-slate-200/60 rounded-xl flex items-start gap-3">
											<Info className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
											<p className="text-xs text-slate-500 leading-relaxed font-medium">
												Penilaian harian ini telah dikunci karena berstatus{" "}
												<strong className="capitalize text-slate-700">{harianRecord.status}</strong>.
												Perubahan tidak dapat dilakukan kecuali dikembalikan oleh supervisor untuk direvisi.
											</p>
										</div>
									)}
								</div>
							</div>
						)}
					</div>
				</div>
				</>
			)}
			{/* ── Warning Modal ──────────────────────────────────────── */}
			{showWarningModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
					<div className="bg-white border border-slate-200/80 rounded-2xl max-w-md w-full shadow-2xl p-6 space-y-5 scale-95 animate-in zoom-in-95 duration-200">
						{/* Icon & Title */}
						<div className="flex items-start gap-4">
							<div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 shrink-0 border border-amber-100">
								<AlertTriangle className="h-6 w-6" />
							</div>
							<div className="space-y-1">
								<h3 className="text-base font-bold text-slate-800 font-figtree">
									Pengiriman Dibatasi
								</h3>
								<p className="text-xs text-slate-500 font-medium">
									Anda belum dapat mengirimkan laporan penilaian kinerja hari ini.
								</p>
							</div>
						</div>

						{/* Detail Info Card */}
						<div className="bg-slate-50 border border-slate-200/50 rounded-xl p-4 space-y-3">
							<div className="flex justify-between items-center text-xs">
								<span className="text-slate-400 font-bold uppercase tracking-wide font-mono">Shift Jadwal</span>
								<span className="font-semibold text-slate-850 bg-slate-200/50 px-2 py-0.5 rounded-md">{warningModalData.shiftName}</span>
							</div>
							<div className="flex justify-between items-center text-xs">
								<span className="text-slate-400 font-bold uppercase tracking-wide font-mono">Jam Pulang Shift</span>
								<span className="font-bold text-primary-600 text-sm">{warningModalData.checkoutTime} WIB</span>
							</div>
							<p className="text-xs font-semibold text-slate-600 leading-relaxed pt-2.5 border-t border-slate-200/60">
								Laporan kinerja harian hanya dapat dikirimkan kepada supervisor setelah Anda menyelesaikan jam kerja/jam pulang sesuai jadwal yang tertera.
							</p>
						</div>

						{/* Actions */}
						<div className="flex justify-end pt-1">
							<button
								onClick={() => setShowWarningModal(false)}
								className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-sm transition-all duration-200 hover:shadow-md cursor-pointer active:scale-[0.98]"
							>
								OK, Mengerti
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

