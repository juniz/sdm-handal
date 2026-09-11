"use client";

import { useState } from "react";
import {
	Calendar as CalendarIcon,
	Search,
	X,
	ChevronLeft,
	ChevronRight,
	ChevronDown,
	User,
	Filter,
} from "lucide-react";
import moment from "moment-timezone";
import { id } from "date-fns/locale";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";

const FilterBar = ({
	filterDate,
	setFilterDate,
	searchNamaRapat,
	setSearchNamaRapat,
	searchNamaPeserta,
	setSearchNamaPeserta,
	onResetSearch,
	isToday,
	totalResults,
}) => {
	const [isCalendarOpen, setIsCalendarOpen] = useState(false);

	const handlePrevDay = () => {
		const prev = moment(filterDate).subtract(1, "days").format("YYYY-MM-DD");
		setFilterDate(prev);
	};

	const handleNextDay = () => {
		const next = moment(filterDate).add(1, "days").format("YYYY-MM-DD");
		setFilterDate(next);
	};

	const handleSetToday = () => {
		setFilterDate(moment().format("YYYY-MM-DD"));
	};

	const handleDateSelect = (date) => {
		if (date) {
			setFilterDate(moment(date).format("YYYY-MM-DD"));
			setIsCalendarOpen(false);
		}
	};

	const hasActiveFilter = Boolean(searchNamaRapat || searchNamaPeserta);
	const selectedDate = filterDate ? moment(filterDate).toDate() : new Date();

	return (
		<div className="bg-white rounded-xl shadow-xs border border-slate-200/90 p-4 space-y-3">
			<div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
				{/* Date Navigator with Popover Calendar */}
				<div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
					<div className="flex items-center bg-slate-50 border border-slate-300 rounded-lg p-0.5">
						<button
							type="button"
							onClick={handlePrevDay}
							className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-md transition-colors"
							title="Hari sebelumnya"
							aria-label="Hari sebelumnya"
						>
							<ChevronLeft className="w-4 h-4" />
						</button>

						{/* Popover Date Trigger */}
						<Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
							<PopoverTrigger asChild>
								<button
									type="button"
									className="flex items-center gap-2 px-2.5 py-1 text-xs sm:text-sm font-semibold text-slate-800 hover:text-sky-700 transition-colors focus:outline-none"
									aria-label="Buka kalender pemilih tanggal"
								>
									<CalendarIcon className="w-4 h-4 text-sky-600 shrink-0" />
									<span>{moment(filterDate).format("DD MMMM YYYY")}</span>
									<ChevronDown className="w-3.5 h-3.5 text-slate-400" />
								</button>
							</PopoverTrigger>
							<PopoverContent
								className="w-auto p-3 shadow-xl border border-slate-200 rounded-xl bg-white z-[120]"
								align="start"
								sideOffset={6}
							>
								<div className="space-y-2.5">
									{/* Quick Preset Buttons */}
									<div className="flex items-center gap-1.5 pb-2 border-b border-slate-100">
										<button
											type="button"
											onClick={() => {
												setFilterDate(
													moment().subtract(1, "days").format("YYYY-MM-DD")
												);
												setIsCalendarOpen(false);
											}}
											className="text-xs px-2.5 py-1 rounded-md bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium transition-colors"
										>
											Kemarin
										</button>
										<button
											type="button"
											onClick={() => {
												setFilterDate(moment().format("YYYY-MM-DD"));
												setIsCalendarOpen(false);
											}}
											className="text-xs px-2.5 py-1 rounded-md bg-sky-50 hover:bg-sky-100 text-sky-800 font-semibold transition-colors"
										>
											Hari Ini
										</button>
										<button
											type="button"
											onClick={() => {
												setFilterDate(
													moment().add(1, "days").format("YYYY-MM-DD")
												);
												setIsCalendarOpen(false);
											}}
											className="text-xs px-2.5 py-1 rounded-md bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium transition-colors"
										>
											Besok
										</button>
									</div>

									{/* Interactive Calendar */}
									<CalendarPicker
										mode="single"
										selected={selectedDate}
										onSelect={handleDateSelect}
										locale={id}
										initialFocus
									/>
								</div>
							</PopoverContent>
						</Popover>

						<button
							type="button"
							onClick={handleNextDay}
							className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-md transition-colors"
							title="Hari berikutnya"
							aria-label="Hari berikutnya"
						>
							<ChevronRight className="w-4 h-4" />
						</button>
					</div>

					<button
						type="button"
						onClick={handleSetToday}
						className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
							isToday
								? "bg-sky-50 text-sky-800 border-sky-200"
								: "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
						}`}
					>
						Hari Ini
					</button>

					<span className="hidden sm:inline text-xs text-slate-500 font-medium ml-1">
						{moment(filterDate).format("dddd")}
					</span>
				</div>

				{/* Search Inputs */}
				<div className="flex items-center gap-2 flex-1 max-w-xl">
					{/* Search Meeting Name */}
					<div className="relative flex-1">
						<Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
						<input
							type="text"
							value={searchNamaRapat}
							onChange={(e) => setSearchNamaRapat(e.target.value)}
							placeholder="Cari nama rapat..."
							className="w-full pl-9 pr-8 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-slate-50/50 transition-all placeholder:text-slate-400"
							aria-label="Cari nama rapat"
						/>
						{searchNamaRapat && (
							<button
								type="button"
								onClick={() => setSearchNamaRapat("")}
								className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
								aria-label="Hapus filter nama rapat"
							>
								<X className="w-3.5 h-3.5" />
							</button>
						)}
					</div>

					{/* Search Attendee Name */}
					<div className="relative flex-1">
						<User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
						<input
							type="text"
							value={searchNamaPeserta}
							onChange={(e) => setSearchNamaPeserta(e.target.value)}
							placeholder="Cari nama peserta..."
							className="w-full pl-9 pr-8 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-slate-50/50 transition-all placeholder:text-slate-400"
							aria-label="Cari nama peserta"
						/>
						{searchNamaPeserta && (
							<button
								type="button"
								onClick={() => setSearchNamaPeserta("")}
								className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
								aria-label="Hapus filter nama peserta"
							>
								<X className="w-3.5 h-3.5" />
							</button>
						)}
					</div>
				</div>
			</div>

			{/* Active filter badge summary */}
			{hasActiveFilter && (
				<div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
					<div className="flex items-center gap-2 flex-wrap">
						<Filter className="w-3.5 h-3.5 text-sky-600" />
						<span>Hasil penyaringan:</span>
						{searchNamaRapat && (
							<span className="bg-sky-50 text-sky-800 border border-sky-200 px-2 py-0.5 rounded font-medium">
								Rapat: "{searchNamaRapat}"
							</span>
						)}
						{searchNamaPeserta && (
							<span className="bg-sky-50 text-sky-800 border border-sky-200 px-2 py-0.5 rounded font-medium">
								Peserta: "{searchNamaPeserta}"
							</span>
						)}
						<span className="text-slate-500 font-semibold">
							({totalResults} hasil)
						</span>
					</div>
					<button
						type="button"
						onClick={onResetSearch}
						className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 hover:underline"
					>
						<X className="w-3.5 h-3.5" />
						Reset Pencarian
					</button>
				</div>
			)}
		</div>
	);
};

export default FilterBar;
