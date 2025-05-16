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

	const handleSelect = (date) => {
		onChange(date);
		setOpen(false); // Menutup popover setelah memilih tanggal
	};

	return (
		<div className="w-full">
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						className={cn(
							"w-full justify-start text-left font-normal h-12",
							!value && "text-muted-foreground",
							error && "border-red-500 focus:ring-red-500",
							className
						)}
						disabled={disabled}
					>
						<CalendarIcon
							className={cn(
								"mr-2 h-5 w-5",
								error ? "text-red-500" : "text-blue-500"
							)}
						/>
						{value ? (
							<span className="text-gray-900">
								{format(value, "dd MMMM yyyy", { locale: id })}
							</span>
						) : (
							<span className="text-gray-500">{placeholder}</span>
						)}
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-auto p-0" align="start">
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
						className="rounded-lg border-0 bg-white p-3"
						classNames={{
							months:
								"flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
							month: "space-y-4",
							caption:
								"flex justify-center pt-1 relative items-center text-gray-900",
							caption_label: "text-base font-medium",
							nav: "flex items-center",
							nav_button:
								"h-7 w-7 bg-transparent p-0 hover:bg-blue-50 text-gray-500 hover:text-blue-600 rounded-full transition-colors",
							nav_button_previous: "absolute left-1",
							nav_button_next: "absolute right-1",
							table: "w-full border-collapse space-y-1",
							head_row: "flex",
							head_cell:
								"w-10 h-10 flex items-center justify-center rounded-full text-gray-500 text-sm",
							row: "flex w-full mt-2",
							cell:
								"w-10 h-10 relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-blue-50 rounded-full",
							day:
								"w-10 h-10 p-0 flex items-center justify-center rounded-full hover:bg-blue-50 transition-colors",
							day_range_middle:
								"aria-selected:bg-blue-50 aria-selected:text-blue-600",
							day_selected:
								"bg-blue-600 text-white hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white",
							day_today: "bg-gray-50 text-gray-900",
							day_outside: "text-gray-400 opacity-50",
							day_disabled: "text-gray-400 opacity-50",
							day_hidden: "invisible",
						}}
					/>
				</PopoverContent>
			</Popover>
			{error && <p className="mt-1 text-sm text-red-500">{error}</p>}
		</div>
	);
}
