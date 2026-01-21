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
	const isMountedRef = React.useRef(true);
	const isClosingRef = React.useRef(false);

	React.useEffect(() => {
		isMountedRef.current = true;
		
		const fetchPegawai = async () => {
			try {
				const response = await fetch("/api/pegawai");
				const data = await response.json();
				if (isMountedRef.current && data.status === "success") {
					setPegawai(data.data);
				}
			} catch (error) {
				console.error("Error fetching pegawai:", error);
			} finally {
				if (isMountedRef.current) {
					setLoading(false);
				}
			}
		};

		fetchPegawai();
		
		return () => {
			isMountedRef.current = false;
			// Pastikan popover tertutup sebelum unmount
			setOpen(false);
		};
	}, []);
	
	// Safe popover state handler
	const handleOpenChange = React.useCallback((newOpen) => {
		if (!isMountedRef.current) return;
		if (!newOpen && isClosingRef.current) return;
		
		if (!newOpen) {
			isClosingRef.current = true;
			requestAnimationFrame(() => {
				if (isMountedRef.current) {
					setOpen(false);
				}
				setTimeout(() => {
					isClosingRef.current = false;
				}, 200);
			});
		} else {
			setOpen(true);
		}
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
			<Popover open={open} onOpenChange={handleOpenChange} modal={false}>
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
										if (!isMountedRef.current || isClosingRef.current) return;
										
										try {
											onValueChange(currentValue === value ? "" : currentValue);
											// Gunakan handleOpenChange untuk closing yang aman
											handleOpenChange(false);
										} catch (error) {
											console.error("Error selecting pegawai:", error);
											handleOpenChange(false);
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
