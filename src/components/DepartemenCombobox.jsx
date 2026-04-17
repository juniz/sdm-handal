"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";

export function DepartemenCombobox({ value, onValueChange, disabled, error, className }) {
	const [open, setOpen] = React.useState(false);
	const [departemen, setDepartemen] = React.useState([]);
	const [loading, setLoading] = React.useState(true);
	const [searchQuery, setSearchQuery] = React.useState("");

	React.useEffect(() => {
		const fetchDepartemen = async () => {
			try {
				const response = await fetch("/api/departemen");
				const result = await response.json();
				if (result.status === "success") {
					// Map to label/value for Combobox compatibility
					const formatted = result.data.map(d => ({
						value: d.dep_id,
						label: d.nama
					}));
					setDepartemen(formatted);
				}
			} catch (error) {
				console.error("Error fetching departemen:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchDepartemen();
	}, []);

	// Filter based on input
	const filteredItems = React.useMemo(() => {
		if (!searchQuery) return departemen;
		const s = searchQuery.toLowerCase();
		return departemen.filter(item => item.label.toLowerCase().includes(s));
	}, [departemen, searchQuery]);

	const selectedLabel = departemen.find((item) => item.value === value)?.label;

	return (
		<div className={cn("w-full", className)}>
			<Popover open={open} onOpenChange={setOpen} modal={true}>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						role="combobox"
						aria-expanded={open}
						disabled={disabled}
						className={cn(
							"w-full justify-between h-11 rounded-xl bg-slate-50 border-slate-200 px-4 transition-all focus:bg-white text-left font-normal",
							error && "border-red-500",
							!value && "text-muted-foreground"
						)}
					>
						{loading
							? "Memuat..."
							: value
							? selectedLabel
							: "Pilih Lokasi / Unit..."}
						<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-xl" align="start">
					<Command shouldFilter={false}>
						<CommandInput
							placeholder="Cari unit..."
							value={searchQuery}
							onValueChange={setSearchQuery}
							className="h-10"
						/>
						<CommandList className="max-h-[250px]">
							<CommandEmpty>Unit tidak ditemukan.</CommandEmpty>
							<CommandGroup>
								{filteredItems.map((item) => (
									<CommandItem
										key={item.value}
										value={item.value}
										onSelect={(currentValue) => {
											onValueChange(currentValue === value ? "" : currentValue);
											setOpen(false);
										}}
                                        className="cursor-pointer"
									>
										<Check
											className={cn(
												"mr-2 h-4 w-4",
												value === item.value ? "opacity-100" : "opacity-0"
											)}
										/>
										{item.label}
									</CommandItem>
								))}
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>
		</div>
	);
}
