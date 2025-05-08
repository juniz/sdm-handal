"use client";

import { useState, useEffect, useCallback } from "react";
import moment from "moment";
import "moment/locale/id";
import { Calendar } from "lucide-react";
import { motion } from "framer-motion";

// Hook untuk mendeteksi ukuran layar
const useWindowSize = () => {
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth < 640);
		};

		// Set nilai awal
		checkMobile();

		// Update saat resize
		window.addEventListener("resize", checkMobile);

		// Cleanup
		return () => window.removeEventListener("resize", checkMobile);
	}, []);

	return isMobile;
};

// Komponen Modal untuk input/edit jadwal
const ShiftModal = ({
	isOpen,
	onClose,
	selectedDate,
	onSave,
	isAdditional,
}) => {
	const [selectedShift, setSelectedShift] = useState("");
	const [shifts, setShifts] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState(null);

	const fetchShifts = useCallback(async () => {
		try {
			setIsLoading(true);
			setError(null);
			const endpoint = "/api/shifts";
			const response = await fetch(endpoint);
			if (!response.ok) throw new Error("Gagal mengambil data shift");

			const data = await response.json();
			setShifts(data.data);
		} catch (error) {
			console.error("Error fetching shifts:", error);
			setError("Gagal mengambil data shift");
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		if (isOpen) {
			fetchShifts();
		}
	}, [isOpen, fetchShifts]);

	const handleSubmit = (e) => {
		e.preventDefault();
		onSave(selectedDate, selectedShift);
		onClose();
		setSelectedShift(""); // Reset shift setelah disimpan
	};

	const handleSetLibur = () => {
		onSave(selectedDate, "");
		onClose();
		setSelectedShift(""); // Reset shift setelah disimpan
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-sm mx-auto">
				<h2 className="text-lg sm:text-xl font-semibold mb-4">
					Input {isAdditional ? "Jadwal Tambahan" : "Jadwal Regular"} -{" "}
					{moment(selectedDate).format("DD MMMM YYYY")}
				</h2>
				<form onSubmit={handleSubmit}>
					<div className="mb-4">
						<label className="block text-gray-700 text-sm sm:text-base mb-2">
							Pilih Shift
						</label>
						{isLoading ? (
							<div className="flex items-center justify-center py-4">
								<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
							</div>
						) : error ? (
							<div className="text-red-500 text-sm">{error}</div>
						) : (
							<select
								value={selectedShift}
								onChange={(e) => setSelectedShift(e.target.value)}
								className="w-full border rounded-lg p-2 text-sm sm:text-base"
								required
							>
								<option value="">Pilih Shift</option>
								{shifts.map((shift) => (
									<option key={shift.shift} value={shift.shift}>
										{shift.shift} ({shift.jam_masuk} - {shift.jam_pulang})
									</option>
								))}
							</select>
						)}
					</div>
					<div className="flex flex-col sm:flex-row gap-2 mt-6">
						<button
							type="button"
							onClick={handleSetLibur}
							className="w-full sm:w-1/3 px-3 sm:px-4 py-2 text-sm sm:text-base bg-gray-600 text-white rounded-lg hover:bg-gray-700"
							disabled={isLoading || !!error}
						>
							Set Libur
						</button>
						<div className="flex justify-end gap-2 w-full sm:w-2/3">
							<button
								type="button"
								onClick={() => {
									onClose();
									setSelectedShift(""); // Reset shift saat modal ditutup
								}}
								className="px-3 sm:px-4 py-2 text-sm sm:text-base text-gray-600 hover:text-gray-800"
							>
								Batal
							</button>
							<button
								type="submit"
								disabled={isLoading || !!error || !selectedShift}
								className={`px-3 sm:px-4 py-2 text-sm sm:text-base text-white rounded-lg
									${
										isLoading || !!error || !selectedShift
											? "bg-gray-400 cursor-not-allowed"
											: "bg-blue-600 hover:bg-blue-700"
									}`}
							>
								Simpan
							</button>
						</div>
					</div>
				</form>
			</div>
		</div>
	);
};

// Komponen Tab
const Tab = ({ isActive, onClick, children }) => {
	const tabVariants = {
		active: {
			backgroundColor: "#2563eb",
			color: "#ffffff",
			scale: 1,
			boxShadow: "0 10px 15px -3px rgba(37, 99, 235, 0.2)",
			borderRadius: 9999,
		},
		inactive: {
			backgroundColor: "transparent",
			color: "#4b5563",
			scale: 0.95,
			boxShadow: "none",
			borderRadius: 0,
		},
	};

	return (
		<motion.button
			onClick={onClick}
			initial={isActive ? "active" : "inactive"}
			animate={isActive ? "active" : "inactive"}
			variants={tabVariants}
			whileHover={{ scale: 1.05 }}
			whileTap={{ scale: 0.95 }}
			transition={{
				type: "spring",
				stiffness: 400,
				damping: 25,
				duration: 0.3,
			}}
			className="w-full px-3 sm:px-6 py-2.5 sm:py-3 font-medium text-xs sm:text-base whitespace-nowrap"
		>
			{children}
		</motion.button>
	);
};

// Komponen Calendar yang dapat digunakan ulang
const CalendarComponent = ({
	currentMonth,
	setCurrentMonth,
	scheduleData,
	onDateClick,
	tableType, // 'jadwal_pegawai' atau 'jadwal_tambahan'
}) => {
	const generateCalendar = () => {
		const startDay = currentMonth.clone().startOf("month").startOf("week");
		const endDay = currentMonth.clone().endOf("month").endOf("week");
		const calendar = [];
		const day = startDay.clone();

		while (day.isSameOrBefore(endDay, "day")) {
			calendar.push(day.clone());
			day.add(1, "day");
		}

		return calendar;
	};

	const calendar = generateCalendar();

	return (
		<div className="bg-white rounded-lg shadow-sm">
			<div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 p-4 sm:p-6">
				<h1 className="text-xl sm:text-2xl font-semibold">
					{tableType === "jadwal_pegawai"
						? "Jadwal Pegawai"
						: "Jadwal Tambahan"}
				</h1>
				<div className="flex items-center gap-2">
					<button
						onClick={() =>
							setCurrentMonth((prev) => prev.clone().subtract(1, "month"))
						}
						className="px-3 py-1 border rounded-lg hover:bg-gray-50"
					>
						&lt;
					</button>
					<span className="text-base sm:text-lg font-medium min-w-[140px] text-center">
						{currentMonth.format("MMMM YYYY")}
					</span>
					<button
						onClick={() =>
							setCurrentMonth((prev) => prev.clone().add(1, "month"))
						}
						className="px-3 py-1 border rounded-lg hover:bg-gray-50"
					>
						&gt;
					</button>
				</div>
			</div>

			<div className="grid grid-cols-7 gap-1 sm:gap-2 p-4 sm:p-6">
				{/* Hari */}
				{["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((day) => (
					<div
						key={day}
						className="text-center py-1 sm:py-2 font-medium text-gray-600 text-xs sm:text-sm"
					>
						{day}
					</div>
				))}

				{/* Tanggal */}
				{calendar.map((date) => {
					const isCurrentMonth = date.month() === currentMonth.month();
					const isToday = date.isSame(moment(), "day");
					const dateKey = date.format("YYYY-MM-DD");
					const shift = scheduleData[dateKey];

					return (
						<button
							key={date.format()}
							onClick={() => onDateClick(date)}
							className={`
								aspect-square p-1 sm:p-2 border rounded-lg relative
								${
									isCurrentMonth && shift
										? "bg-blue-500 text-white"
										: isCurrentMonth
										? "bg-white"
										: "bg-gray-50 text-gray-400"
								}
								${isToday ? "border-blue-500" : "border-gray-200"}
								hover:border-blue-500 transition-colors
								text-xs sm:text-base
							`}
						>
							<span className="absolute top-0.5 sm:top-1 left-1">
								{date.format("D")}
							</span>
							{shift && (
								<span className="absolute bottom-0.5 sm:bottom-1 right-1 text-[10px] sm:text-sm font-medium">
									{shift === "L" ? "" : shift}
								</span>
							)}
						</button>
					);
				})}
			</div>
		</div>
	);
};

// Komponen utama
export default function SchedulePage() {
	const [activeTab, setActiveTab] = useState("regular"); // 'regular' atau 'additional'
	const [currentMonth, setCurrentMonth] = useState(moment());
	const [selectedDate, setSelectedDate] = useState(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [scheduleData, setScheduleData] = useState({});
	const [additionalScheduleData, setAdditionalScheduleData] = useState({});
	const isMobile = useWindowSize();

	// Fungsi untuk mengambil data jadwal
	const fetchScheduleData = async (year, month, isAdditional = false) => {
		try {
			const table = isAdditional ? "jadwal_tambahan" : "jadwal_pegawai";
			const response = await fetch(
				`/api/schedule?tahun=${year}&bulan=${month
					.toString()
					.padStart(2, "0")}&table=${table}`
			);
			if (!response.ok) throw new Error("Gagal mengambil data jadwal");

			const data = await response.json();

			// Konversi data dari format database ke format yang dibutuhkan komponen
			const formattedData = {};
			if (data.data) {
				Object.entries(data.data).forEach(([key, value]) => {
					if (key.startsWith("h") && value) {
						const day = key.substring(1).padStart(2, "0");
						const dateKey = `${year}-${month
							.toString()
							.padStart(2, "0")}-${day}`;
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
			alert("Gagal mengambil data jadwal");
		}
	};

	// Effect untuk mengambil data jadwal saat bulan berubah
	useEffect(() => {
		const year = currentMonth.format("YYYY");
		const month = currentMonth.format("MM");
		fetchScheduleData(year, month, false); // Jadwal regular
		fetchScheduleData(year, month, true); // Jadwal tambahan
	}, [currentMonth]);

	const handleDateClick = (date) => {
		setSelectedDate(date);
		setIsModalOpen(true);
	};

	const handleSaveShift = async (date, shift) => {
		try {
			const isAdditional = activeTab === "additional";
			const response = await fetch("/api/schedule", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					date: date.format("YYYY-MM-DD"),
					shift,
					table: isAdditional ? "jadwal_tambahan" : "jadwal_pegawai",
				}),
			});

			if (!response.ok) throw new Error("Gagal menyimpan jadwal");

			// Update local state
			const setterFunction = isAdditional
				? setAdditionalScheduleData
				: setScheduleData;
			setterFunction((prev) => ({
				...prev,
				[date.format("YYYY-MM-DD")]: shift,
			}));
		} catch (error) {
			console.error("Error saving schedule:", error);
			alert("Gagal menyimpan jadwal");
		}
	};

	return (
		<div className="max-w-4xl mx-auto px-2 sm:px-6">
			{/* Tabs */}
			<motion.div
				className="flex justify-center mb-6 sm:mb-8 w-full"
				initial={{ opacity: 0, y: -20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
			>
				<div className="inline-flex bg-gray-100 p-1 rounded-full w-full max-w-[300px] sm:max-w-none">
					<Tab
						isActive={activeTab === "regular"}
						onClick={() => setActiveTab("regular")}
					>
						{isMobile ? "Regular" : "Jadwal Regular"}
					</Tab>
					<Tab
						isActive={activeTab === "additional"}
						onClick={() => setActiveTab("additional")}
					>
						{isMobile ? "Tambahan" : "Jadwal Tambahan"}
					</Tab>
				</div>
			</motion.div>

			{/* Calendar */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, delay: 0.2 }}
				className="w-full"
			>
				{activeTab === "regular" ? (
					<CalendarComponent
						currentMonth={currentMonth}
						setCurrentMonth={setCurrentMonth}
						scheduleData={scheduleData}
						onDateClick={handleDateClick}
						tableType="jadwal_pegawai"
					/>
				) : (
					<CalendarComponent
						currentMonth={currentMonth}
						setCurrentMonth={setCurrentMonth}
						scheduleData={additionalScheduleData}
						onDateClick={handleDateClick}
						tableType="jadwal_tambahan"
					/>
				)}
			</motion.div>

			{/* Modal */}
			<ShiftModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				selectedDate={selectedDate}
				onSave={handleSaveShift}
				isAdditional={activeTab === "additional"}
			/>
		</div>
	);
}
