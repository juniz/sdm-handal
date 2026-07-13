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

export function SearchableSelect({
  options = [],
  value,
  onChange,
  placeholder = "Pilih...",
  disabled = false,
  className,
}) {
  const [open, setOpen] = React.useState(false);

  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between text-left font-normal bg-slate-50 border-slate-200 rounded-xl px-3.5 py-2.5 h-auto text-sm text-slate-700 hover:bg-slate-100/50 disabled:opacity-60 transition-all shadow-xs min-w-0",
            className
          )}
        >
          {selectedOption ? (
            <div className="flex flex-col items-start text-left min-w-0 flex-1">
              <span className="font-semibold text-slate-800 text-xs sm:text-sm truncate w-full">{selectedOption.label}</span>
              {selectedOption.sublabel && (
                <span className="text-[10px] text-slate-400 font-medium truncate w-full">{selectedOption.sublabel}</span>
              )}
            </div>
          ) : (
            <span className="text-slate-400 font-medium truncate">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-55 text-slate-405" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command className="w-full">
          <CommandInput placeholder="Cari..." />
          <CommandList className="max-h-[220px] overflow-y-auto">
            <CommandEmpty className="py-4 text-center text-xs text-slate-450 font-medium">Tidak ada hasil ditemukan.</CommandEmpty>
            <CommandGroup className="p-1.5">
              {options.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                const searchString = `${opt.label} ${opt.sublabel || ""} ${opt.value}`.toLowerCase();
                return (
                  <CommandItem
                    key={opt.value}
                    value={searchString}
                    onSelect={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    className="flex items-center justify-between py-2 px-3 cursor-pointer hover:bg-slate-50/60 rounded-lg text-xs transition-colors"
                  >
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-700">{opt.label}</span>
                      {opt.sublabel && (
                        <span className="text-[10px] text-slate-405 mt-0.5">{opt.sublabel}</span>
                      )}
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-primary-600 shrink-0 ml-2" />}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
