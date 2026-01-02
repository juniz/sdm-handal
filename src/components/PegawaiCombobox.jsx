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

export function PegawaiCombobox({ value, onValueChange, disabled, error }) {
	const [open, setOpen] = React.useState(false);
	const [pegawai, setPegawai] = React.useState([]);
	const [loading, setLoading] = React.useState(true);
	const [searchQuery, setSearchQuery] = React.useState("");

	React.useEffect(() => {
		let isMounted = true;
		
		const fetchPegawai = async () => {
			try {
				const response = await fetch("/api/pegawai");
				const data = await response.json();
				if (isMounted && data.status === "success") {
					setPegawai(data.data);
				}
			} catch (error) {
				console.error("Error fetching pegawai:", error);
			} finally {
				if (isMounted) {
					setLoading(false);
				}
			}
		};

		fetchPegawai();
		
		return () => {
			isMounted = false;
		};
	}, []);

	// Filter pegawai berdasarkan input pencarian
	const filteredPegawai = React.useMemo(() => {
		if (!searchQuery) return pegawai;

		const search = searchQuery.toLowerCase();
		return pegawai.filter(
			(item) =>
				item.label.toLowerCase().includes(search) ||
				item.value.toLowerCase().includes(search)
		);
	}, [pegawai, searchQuery]);

	return (
		<div className="w-full">
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						role="combobox"
						aria-expanded={open}
						disabled={disabled}
						className={cn(
							"w-full justify-between h-12 text-left",
							error && "border-red-500 focus:ring-red-500",
							!value && "text-muted-foreground"
						)}
					>
						{loading
							? "Memuat data pegawai..."
							: value
							? pegawai.find((item) => item.value === value)?.label
							: "Pilih nama pegawai..."}
						<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
					</Button>
				</PopoverTrigger>
				<PopoverContent
					className="w-[400px] p-0"
					side="bottom"
					align="start"
					sideOffset={8}
					avoidCollisions={true}
					collisionPadding={10}
				>
					<Command shouldFilter={false}>
						<CommandInput
							placeholder="Cari pegawai..."
							value={searchQuery}
							onValueChange={setSearchQuery}
							className="h-12"
						/>
						<CommandList className="max-h-[200px] overflow-y-auto">
							<CommandEmpty>
								{loading ? "Memuat data..." : "Pegawai tidak ditemukan."}
							</CommandEmpty>
							<CommandGroup>
								{filteredPegawai.map((item) => (
									<CommandItem
										key={item.value}
										value={item.value}
										onSelect={(currentValue) => {
											try {
												onValueChange(currentValue === value ? "" : currentValue);
												setOpen(false);
											} catch (error) {
												console.error("Error selecting pegawai:", error);
												setOpen(false);
											}
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
			{error && <p className="mt-1 text-sm text-red-500">{error}</p>}
		</div>
	);
}
