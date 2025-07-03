"use client";

import * as React from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export function DatePicker({
	value,
	onChange,
	placeholder = "Pilih tanggal",
	disabled,
	fromDate,
	className,
	error,
	minDate,
	maxDate,
}) {
	const [open, setOpen] = React.useState(false);
	const [isSelecting, setIsSelecting] = React.useState(false);

	const handleSelect = (date) => {
		setIsSelecting(true);
		onChange(date);
		// Delay untuk memberikan feedback visual sebelum menutup
		setTimeout(() => {
			setOpen(false);
			setIsSelecting(false);
		}, 150);
	};

	return (
		<div className="w-full">
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						className={cn(
							"w-full justify-start text-left font-normal h-12 border-2 transition-all duration-200 hover:border-blue-400 hover:bg-blue-50/50 focus:ring-2 focus:ring-blue-200 focus:ring-offset-2",
							!value && "text-muted-foreground border-gray-300",
							value && "border-blue-500 bg-blue-50/30",
							error && "border-red-500 focus:ring-red-200 bg-red-50/30",
							disabled && "opacity-50 cursor-not-allowed",
							className
						)}
						disabled={disabled}
					>
						<CalendarIcon
							className={cn(
								"mr-2 h-5 w-5 transition-colors duration-200",
								error
									? "text-red-500"
									: value
									? "text-blue-600"
									: "text-gray-400"
							)}
						/>
						{isSelecting ? (
							<div className="flex items-center gap-2">
								<div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
								<span className="text-blue-700">Memilih tanggal...</span>
							</div>
						) : value ? (
							<span className="text-blue-900 font-medium">
								{format(value, "dd MMMM yyyy", { locale: id })}
							</span>
						) : (
							<span className="text-gray-500">{placeholder}</span>
						)}
					</Button>
				</PopoverTrigger>
				<PopoverContent
					className="w-auto p-0 shadow-xl border-2 border-blue-100 animate-in fade-in-0 zoom-in-95"
					align="start"
					sideOffset={8}
				>
					<Calendar
						mode="single"
						selected={value}
						onSelect={handleSelect}
						disabled={(date) => {
							if (disabled) return true;
							if (minDate && date < minDate) return true;
							if (maxDate && date > maxDate) return true;
							if (typeof disabled === "function") return disabled(date);
							return false;
						}}
						fromDate={fromDate}
						className="rounded-lg border-0 bg-gradient-to-br from-white to-blue-50/30 p-4"
						classNames={{
							months:
								"flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
							month: "space-y-4",
							caption:
								"flex justify-center pt-1 relative items-center text-blue-900 font-semibold",
							caption_label: "text-base font-semibold",
							nav: "flex items-center",
							nav_button:
								"h-8 w-8 bg-blue-100 p-0 hover:bg-blue-200 text-blue-600 hover:text-blue-700 rounded-full transition-all duration-200 hover:scale-105",
							nav_button_previous: "absolute left-1",
							nav_button_next: "absolute right-1",
							table: "w-full border-collapse space-y-1",
							head_row: "flex",
							head_cell:
								"w-10 h-10 flex items-center justify-center rounded-full text-blue-600 text-sm font-medium",
							row: "flex w-full mt-2",
							cell:
								"w-10 h-10 relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-blue-100 rounded-full",
							day:
								"w-10 h-10 p-0 flex items-center justify-center rounded-full hover:bg-blue-100 hover:text-blue-700 transition-all duration-200 hover:scale-105 font-medium",
							day_range_middle:
								"aria-selected:bg-blue-100 aria-selected:text-blue-700",
							day_selected:
								"bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 hover:text-white focus:from-blue-700 focus:to-blue-800 focus:text-white shadow-lg scale-105 ring-2 ring-blue-300 ring-offset-2",
							day_today:
								"bg-orange-100 text-orange-700 font-bold border-2 border-orange-300",
							day_outside: "text-gray-400 opacity-50",
							day_disabled: "text-gray-400 opacity-50",
							day_hidden: "invisible",
						}}
					/>
				</PopoverContent>
			</Popover>
			{error && (
				<p className="mt-2 text-sm text-red-500 flex items-center gap-1">
					<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
						<path
							fillRule="evenodd"
							d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
							clipRule="evenodd"
						/>
					</svg>
					{error}
				</p>
			)}
		</div>
	);
}
