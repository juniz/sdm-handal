"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import moment from "moment";
import "moment/locale/id";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

// Shift badge styling helper following clinical cyan and semantic tokens
const getShiftBadgeStyle = (shiftCode) => {
	if (!shiftCode) return "";
	const code = String(shiftCode).trim().toUpperCase();
	if (code === "L") {
		return "bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold";
	}
	if (code.startsWith("P")) {
		return "bg-sky-50 text-sky-700 border-sky-200 font-semibold";
	}
	if (code.startsWith("S")) {
		return "bg-amber-50 text-amber-800 border-amber-200 font-semibold";
	}
	if (code.startsWith("M")) {
		return "bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold";
	}
	return "bg-slate-100 text-slate-700 border-slate-200 font-medium";
};

// Modal component for input/edit schedule
const ShiftModal = ({
	isOpen,
	onClose,
	selectedDate,
	onSave,
	initialTableType = "jadwal_pegawai",
	regularShift = "",
	additionalShift = "",
}) => {
	const [targetTable, setTargetTable] = useState(initialTableType);
	const [selectedShift, setSelectedShift] = useState("");
	const [shifts, setShifts] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState(null);

	// Sync target table & preselect existing shift when date or table changes
	useEffect(() => {
		setTargetTable(initialTableType);
	}, [initialTableType, isOpen]);

	useEffect(() => {
		const current = targetTable === "jadwal_tambahan" ? additionalShift : regularShift;
		setSelectedShift(current || "");
	}, [targetTable, regularShift, additionalShift, isOpen]);

	// Escape key dismissal
	useEffect(() => {
		if (!isOpen) return;
		const handleKeyDown = (e) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, onClose]);

	const fetchShifts = useCallback(async () => {
		try {
			setIsLoading(true);
			setError(null);
			const response = await fetch("/api/shifts");
			if (!response.ok) throw new Error("Gagal mengambil data shift");

			const data = await response.json();
			setShifts(data.data || []);
		} catch (err) {
			console.error("Error fetching shifts:", err);
			setError("Gagal mengambil daftar shift");
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		if (isOpen) {
			fetchShifts();
		}
	}, [isOpen, fetchShifts]);

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!selectedShift) return;
		try {
			setIsSaving(true);
			await onSave(selectedDate, selectedShift, targetTable);
			onClose();
		} catch (err) {
			// error handled in parent
		} finally {
			setIsSaving(false);
		}
	};

	const handleSetLibur = async () => {
		try {
			setIsSaving(true);
			await onSave(selectedDate, "L", targetTable);
			onClose();
		} catch (err) {
			// error handled in parent
		} finally {
			setIsSaving(false);
		}
	};

	const handleClearShift = async () => {
		try {
			setIsSaving(true);
			await onSave(selectedDate, "", targetTable);
			onClose();
		} catch (err) {
			// error handled in parent
		} finally {
			setIsSaving(false);
		}
	};

	if (!isOpen || !selectedDate) return null;

	const dateDisplay = moment(selectedDate).format("dddd, DD MMMM YYYY");

	return (
		<div
			className="fixed inset-0 bg-slate-900/50 backdrop-blur-[2px] flex items-center justify-center z-50 p-4 transition-all"
			onClick={onClose}
			role="dialog"
			aria-modal="true"
			aria-labelledby="shift-modal-title"
		>
			<div
				className="bg-white rounded-xl shadow-xl border border-slate-200 p-5 sm:p-6 w-full max-w-md mx-auto relative animate-in fade-in zoom-in-95 duration-150"
				onClick={(e) => e.stopPropagation()}
			>
				{/* Modal Header */}
				<div className="flex items-start justify-between mb-4 border-b border-slate-100 pb-3">
					<div>
						<h2 id="shift-modal-title" className="text-base sm:text-lg font-bold text-slate-900">
							Atur Jadwal Dinas
						</h2>
						<p className="text-xs sm:text-sm text-slate-500 flex items-center gap-1.5 mt-0.5">
							<CalendarIcon className="w-3.5 h-3.5 text-sky-600" />
							{dateDisplay}
						</p>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-100 transition-colors"
						aria-label="Tutup modal"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				{/* Schedule Type Selector */}
				<div className="mb-4">
					<label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
						Tipe Jadwal
					</label>
					<div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
						<button
							type="button"
							onClick={() => setTargetTable("jadwal_pegawai")}
							className={`py-1.5 px-3 text-xs sm:text-sm font-medium rounded-md transition-all ${
								targetTable === "jadwal_pegawai"
									? "bg-white text-sky-700 shadow-sm font-semibold"
									: "text-slate-600 hover:text-slate-900"
							}`}
						>
							Jadwal Regular
						</button>
						<button
							type="button"
							onClick={() => setTargetTable("jadwal_tambahan")}
							className={`py-1.5 px-3 text-xs sm:text-sm font-medium rounded-md transition-all ${
								targetTable === "jadwal_tambahan"
									? "bg-white text-sky-700 shadow-sm font-semibold"
									: "text-slate-600 hover:text-slate-900"
							}`}
						>
							Jadwal Tambahan
						</button>
					</div>
				</div>

				{/* Active Shift Context */}
				<div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 flex justify-between items-center">
					<span>
						Status saat ini:{" "}
						<strong className="text-slate-800">
							{targetTable === "jadwal_tambahan"
								? additionalShift || "Belum diatur"
								: regularShift || "Belum diatur"}
						</strong>
					</span>
					{(targetTable === "jadwal_tambahan" ? additionalShift : regularShift) && (
						<button
							type="button"
							onClick={handleClearShift}
							disabled={isSaving}
							className="text-xs text-rose-600 hover:text-rose-700 font-medium hover:underline"
						>
							Kosongkan
						</button>
					)}
				</div>

				<form onSubmit={handleSubmit}>
					<div className="mb-5">
						<label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
							Pilih Kode Shift
						</label>
						{isLoading ? (
							<div className="flex items-center justify-center py-6">
								<div className="animate-spin rounded-full h-6 w-6 border-2 border-sky-600 border-t-transparent"></div>
							</div>
						) : error ? (
							<div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-600 text-xs flex items-center gap-2">
								<ShieldAlert className="w-4 h-4 shrink-0" />
								<span>{error}</span>
							</div>
						) : (
							<select
								value={selectedShift}
								onChange={(e) => setSelectedShift(e.target.value)}
								className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white"
								required
							>
								<option value="">-- Pilih Kode Shift --</option>
								{shifts.map((shift) => (
									<option key={shift.shift} value={shift.shift}>
										{shift.shift} ({shift.jam_masuk} - {shift.jam_pulang})
									</option>
								))}
							</select>
						)}
					</div>

					<div className="flex flex-col-reverse sm:flex-row gap-2 pt-2 border-t border-slate-100">
						<button
							type="button"
							onClick={handleSetLibur}
							disabled={isLoading || isSaving}
							className="w-full sm:w-auto px-4 py-2 text-xs sm:text-sm font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors disabled:opacity-50"
						>
							Set Libur (L)
						</button>
						<div className="flex justify-end gap-2 w-full">
							<button
								type="button"
								onClick={onClose}
								disabled={isSaving}
								className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
							>
								Batal
							</button>
							<button
								type="submit"
								disabled={isLoading || isSaving || !selectedShift}
								className="px-4 py-2 text-xs sm:text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center min-w-[80px]"
							>
								{isSaving ? (
									<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
								) : (
									"Simpan"
								)}
							</button>
						</div>
					</div>
				</form>
			</div>
		</div>
	);
};

// Reusable Calendar Component
const CalendarComponent = ({
	currentMonth,
	setCurrentMonth,
	regularSchedule,
	additionalSchedule,
	viewMode, // 'all', 'regular', 'additional'
	onDateClick,
	isLoading = false,
}) => {
	// Generate calendar days starting Monday (Senin) per hospital standards
	const calendarDays = useMemo(() => {
		const startDay = currentMonth.clone().startOf("month").startOf("isoWeek");
		const endDay = currentMonth.clone().endOf("month").endOf("isoWeek");
		const days = [];
		const day = startDay.clone();

		while (day.isSameOrBefore(endDay, "day")) {
			days.push(day.clone());
			day.add(1, "day");
		}
		return days;
	}, [currentMonth]);

	// Month navigation helpers
	const handlePrevMonth = () => setCurrentMonth((prev) => prev.clone().subtract(1, "month"));
	const handleNextMonth = () => setCurrentMonth((prev) => prev.clone().add(1, "month"));
	const handleToday = () => setCurrentMonth(moment());

	return (
		<div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
			{/* Calendar Header */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50">
				<div>
					<h1 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
						<CalendarIcon className="w-5 h-5 text-sky-600" />
						Jadwal Dinas
					</h1>
					<p className="text-xs text-slate-500 mt-0.5">
						Klik tanggal untuk memperbarui jadwal dinas atau hari libur
					</p>
				</div>

				<div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
					<button
						type="button"
						onClick={handleToday}
						className="px-2.5 py-1.5 text-xs font-medium border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors"
					>
						Hari Ini
					</button>
					<div className="flex items-center gap-1">
						<button
							type="button"
							onClick={handlePrevMonth}
							aria-label="Bulan sebelumnya"
							className="h-8 w-8 flex items-center justify-center border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors"
						>
							<ChevronLeft className="w-4 h-4" />
						</button>
						<span className="text-xs sm:text-sm font-semibold text-slate-800 min-w-[130px] text-center">
							{currentMonth.format("MMMM YYYY")}
						</span>
						<button
							type="button"
							onClick={handleNextMonth}
							aria-label="Bulan berikutnya"
							className="h-8 w-8 flex items-center justify-center border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors"
						>
							<ChevronRight className="w-4 h-4" />
						</button>
					</div>
				</div>
			</div>

			{/* Weekday Labels (Monday to Sunday) */}
			<div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50 text-slate-600 font-medium text-xs text-center py-2">
				{["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((day, idx) => (
					<div
						key={day}
						className={`py-0.5 ${idx >= 5 ? "text-rose-600 font-semibold" : ""}`}
					>
						{day}
					</div>
				))}
			</div>

			{/* Calendar Grid Container */}
			<div className="relative">
				{isLoading && (
					<div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] z-10 flex items-center justify-center transition-opacity duration-200">
						<div className="flex items-center gap-2 px-3.5 py-2 bg-white shadow-md border border-slate-200 rounded-lg text-xs font-semibold text-sky-700">
							<div className="w-3.5 h-3.5 border-2 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
							<span>Memuat jadwal...</span>
						</div>
					</div>
				)}

				<div className={`grid grid-cols-7 gap-1 sm:gap-1.5 p-2 sm:p-4 bg-slate-50/30 transition-opacity duration-150 ${isLoading ? "opacity-30" : "opacity-100"}`}>
				{calendarDays.map((date) => {
					const isCurrentMonth = date.month() === currentMonth.month();
					const isToday = date.isSame(moment(), "day");
					const isWeekend = date.isoWeekday() >= 6;
					const dateKey = date.format("YYYY-MM-DD");

					const regShift = regularSchedule[dateKey];
					const addShift = additionalSchedule[dateKey];

					// Determine what to display based on viewMode
					const showReg = viewMode === "all" || viewMode === "regular";
					const showAdd = viewMode === "all" || viewMode === "additional";

					return (
						<button
							key={dateKey}
							type="button"
							onClick={() => isCurrentMonth && onDateClick(date)}
							disabled={!isCurrentMonth}
							className={`
								aspect-square p-1 sm:p-1.5 border rounded-lg transition-all text-left flex flex-col justify-between relative group
								${
									isCurrentMonth
										? "bg-white hover:border-sky-400 hover:shadow-sm cursor-pointer"
										: "bg-slate-100/60 text-slate-400 border-slate-100 cursor-not-allowed opacity-50"
								}
								${isToday ? "border-sky-500 ring-2 ring-sky-500/20" : "border-slate-200"}
							`}
						>
							{/* Date Header */}
							<div className="flex items-center justify-between w-full">
								<span
									className={`text-[11px] sm:text-xs font-semibold ${
										isToday
											? "text-sky-600 font-bold"
											: isWeekend && isCurrentMonth
											? "text-rose-600"
											: "text-slate-700"
									}`}
								>
									{date.format("D")}
								</span>
								{isToday && (
									<span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0"></span>
								)}
							</div>

							{/* Shift Badges Container */}
							<div className="flex flex-col gap-0.5 sm:gap-1 w-full mt-auto">
								{/* Regular Shift Badge */}
								{showReg && regShift && (
									<span
										className={`text-[9px] sm:text-[11px] px-1 py-0.5 rounded border text-center truncate ${getShiftBadgeStyle(
											regShift
										)}`}
										title={`Regular: Shift ${regShift}`}
									>
										{regShift === "L" ? "Libur" : regShift}
									</span>
								)}

								{/* Additional Shift Badge */}
								{showAdd && addShift && (
									<span
										className="text-[9px] sm:text-[11px] px-1 py-0.5 rounded border text-center truncate bg-purple-50 text-purple-700 border-purple-200 font-semibold"
										title={`Tambahan: Shift ${addShift}`}
									>
										+{addShift}
									</span>
								)}
							</div>
						</button>
					);
				})}
				</div>
			</div>

			{/* Shift Legend & Overview */}
			<div className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
				<div className="flex flex-wrap items-center gap-3">
					<span className="font-semibold text-slate-700">Keterangan:</span>
					<div className="flex items-center gap-1.5">
						<span className="w-4 h-4 rounded border text-[10px] flex items-center justify-center bg-sky-50 text-sky-700 border-sky-200 font-bold">
							P
						</span>
						<span>Pagi</span>
					</div>
					<div className="flex items-center gap-1.5">
						<span className="w-4 h-4 rounded border text-[10px] flex items-center justify-center bg-amber-50 text-amber-800 border-amber-200 font-bold">
							S
						</span>
						<span>Siang</span>
					</div>
					<div className="flex items-center gap-1.5">
						<span className="w-4 h-4 rounded border text-[10px] flex items-center justify-center bg-indigo-50 text-indigo-700 border-indigo-200 font-bold">
							M
						</span>
						<span>Malam</span>
					</div>
					<div className="flex items-center gap-1.5">
						<span className="w-4 h-4 rounded border text-[10px] flex items-center justify-center bg-emerald-50 text-emerald-700 border-emerald-200 font-bold">
							L
						</span>
						<span>Libur</span>
					</div>
					<div className="flex items-center gap-1.5">
						<span className="px-1 py-0.5 rounded border text-[10px] bg-purple-50 text-purple-700 border-purple-200 font-bold">
							+T
						</span>
						<span>Tambahan</span>
					</div>
				</div>
			</div>
		</div>
	);
};

// Main Page Component
export default function SchedulePage() {
	const [activeTab, setActiveTab] = useState("all"); // 'all' | 'regular' | 'additional'
	const [currentMonth, setCurrentMonth] = useState(moment());
	const [selectedDate, setSelectedDate] = useState(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [scheduleData, setScheduleData] = useState({});
	const [additionalScheduleData, setAdditionalScheduleData] = useState({});
	const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);

	// Fetch schedule data from database
	const fetchScheduleData = useCallback(async (year, month, isAdditional = false) => {
		try {
			const table = isAdditional ? "jadwal_tambahan" : "jadwal_pegawai";
			const response = await fetch(
				`/api/schedule?tahun=${year}&bulan=${month.toString().padStart(2, "0")}&table=${table}`
			);
			if (!response.ok) throw new Error("Gagal mengambil data jadwal");

			const data = await response.json();
			const formattedData = {};

			if (data.data) {
				Object.entries(data.data).forEach(([key, value]) => {
					if (key.startsWith("h") && value) {
						const day = key.substring(1).padStart(2, "0");
						const dateKey = `${year}-${month.toString().padStart(2, "0")}-${day}`;
						formattedData[dateKey] = value;
					}
				});
			}

			if (isAdditional) {
				setAdditionalScheduleData(formattedData);
			} else {
				setScheduleData(formattedData);
			}
		} catch (error) {
			console.error("Error fetching schedule:", error);
			toast.error("Gagal memuat data jadwal dinas");
		}
	}, []);

	// Refresh schedules on month change
	useEffect(() => {
		const year = currentMonth.format("YYYY");
		const month = currentMonth.format("MM");
		setIsLoadingSchedule(true);
		Promise.all([
			fetchScheduleData(year, month, false),
			fetchScheduleData(year, month, true),
		]).finally(() => setIsLoadingSchedule(false));
	}, [currentMonth, fetchScheduleData]);

	// Calculate summary stats for current month
	const stats = useMemo(() => {
		let regularCount = 0;
		let additionalCount = 0;
		let offCount = 0;

		const currentMonthStr = currentMonth.format("YYYY-MM");

		Object.entries(scheduleData).forEach(([dateKey, shift]) => {
			if (dateKey.startsWith(currentMonthStr)) {
				if (shift === "L") offCount++;
				else if (shift) regularCount++;
			}
		});

		Object.entries(additionalScheduleData).forEach(([dateKey, shift]) => {
			if (dateKey.startsWith(currentMonthStr) && shift) {
				additionalCount++;
			}
		});

		return { regularCount, additionalCount, offCount };
	}, [scheduleData, additionalScheduleData, currentMonth]);

	const handleDateClick = (date) => {
		setSelectedDate(date);
		setIsModalOpen(true);
	};

	const handleSaveShift = async (date, shift, targetTable) => {
		const formattedDate = date.format("YYYY-MM-DD");
		const table = targetTable || (activeTab === "additional" ? "jadwal_tambahan" : "jadwal_pegawai");

		try {
			const response = await fetch("/api/schedule", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					date: formattedDate,
					shift,
					table,
				}),
			});

			if (!response.ok) {
				const err = await response.json().catch(() => ({}));
				throw new Error(err.message || "Gagal menyimpan jadwal");
			}

			// Update state locally
			if (table === "jadwal_tambahan") {
				setAdditionalScheduleData((prev) => ({
					...prev,
					[formattedDate]: shift,
				}));
			} else {
				setScheduleData((prev) => ({
					...prev,
					[formattedDate]: shift,
				}));
			}

			toast.success(`Jadwal tanggal ${date.format("DD MMMM YYYY")} berhasil disimpan`);
		} catch (error) {
			console.error("Error saving schedule:", error);
			toast.error(error.message || "Gagal menyimpan jadwal");
			throw error;
		}
	};

	const selectedDateKey = selectedDate ? selectedDate.format("YYYY-MM-DD") : "";

	return (
		<div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
			{/* Top Bar with Segmented Control & Monthly Summary */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
				{/* Segmented View Tabs */}
				<div className="inline-flex bg-slate-100 p-1 rounded-lg border border-slate-200 w-full sm:w-auto">
					<button
						type="button"
						onClick={() => setActiveTab("all")}
						className={`flex-1 sm:flex-none px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all ${
							activeTab === "all"
								? "bg-white text-sky-700 shadow-sm font-semibold"
								: "text-slate-600 hover:text-slate-900"
						}`}
					>
						Semua Jadwal
					</button>
					<button
						type="button"
						onClick={() => setActiveTab("regular")}
						className={`flex-1 sm:flex-none px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all ${
							activeTab === "regular"
								? "bg-white text-sky-700 shadow-sm font-semibold"
								: "text-slate-600 hover:text-slate-900"
						}`}
					>
						Jadwal Regular
					</button>
					<button
						type="button"
						onClick={() => setActiveTab("additional")}
						className={`flex-1 sm:flex-none px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all ${
							activeTab === "additional"
								? "bg-white text-sky-700 shadow-sm font-semibold"
								: "text-slate-600 hover:text-slate-900"
						}`}
					>
						Jadwal Tambahan
					</button>
				</div>

				{/* Quick Month Stats Chips */}
				<div className="flex items-center gap-2 text-xs w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
					<div className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 flex items-center gap-1.5 shrink-0">
						<span className="w-2 h-2 rounded-full bg-sky-500"></span>
						<span>Regular:</span>
						<strong className="text-slate-900">{stats.regularCount}</strong>
					</div>
					<div className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 flex items-center gap-1.5 shrink-0">
						<span className="w-2 h-2 rounded-full bg-purple-500"></span>
						<span>Tambahan:</span>
						<strong className="text-slate-900">{stats.additionalCount}</strong>
					</div>
					<div className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 flex items-center gap-1.5 shrink-0">
						<span className="w-2 h-2 rounded-full bg-emerald-500"></span>
						<span>Libur:</span>
						<strong className="text-slate-900">{stats.offCount}</strong>
					</div>
				</div>
			</div>

			{/* Main Calendar View */}
			<CalendarComponent
				currentMonth={currentMonth}
				setCurrentMonth={setCurrentMonth}
				regularSchedule={scheduleData}
				additionalSchedule={additionalScheduleData}
				viewMode={activeTab}
				onDateClick={handleDateClick}
				isLoading={isLoadingSchedule}
			/>

			{/* Shift Input / Edit Modal */}
			<ShiftModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				selectedDate={selectedDate}
				onSave={handleSaveShift}
				initialTableType={activeTab === "additional" ? "jadwal_tambahan" : "jadwal_pegawai"}
				regularShift={scheduleData[selectedDateKey] || ""}
				additionalShift={additionalScheduleData[selectedDateKey] || ""}
			/>
		</div>
	);
}
