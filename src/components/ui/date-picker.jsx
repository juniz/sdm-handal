"use client";

import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { useState } from "react";
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
	placeholder = "Pilih tanggal...",
	disabled = false,
	className,
	...props
}) {
	const [open, setOpen] = useState(false);

	const handleSelect = (date) => {
		onChange(date);
		setOpen(false);
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					className={cn(
						"w-full justify-start text-left font-normal",
						!value && "text-muted-foreground",
						className
					)}
					disabled={disabled}
					{...props}
				>
					<CalendarIcon className="mr-2 h-4 w-4" />
					{value ? (
						format(value, "dd MMMM yyyy", { locale: id })
					) : (
						<span>{placeholder}</span>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0" align="start">
				<Calendar
					mode="single"
					selected={value}
					onSelect={handleSelect}
					initialFocus
					locale={id}
					disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
				/>
			</PopoverContent>
		</Popover>
	);
}
