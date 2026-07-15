"use client";

import { useState } from "react";
import { format, subDays, subMonths, startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns";
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

export function DateRangePicker({
  value,
  onChange,
  placeholder = "Pilih rentang tanggal...",
  disabled = false,
  className,
  ...props
}) {
  const [open, setOpen] = useState(false);

  const presets = [
    {
      label: "Hari Ini",
      getValue: () => ({
        from: startOfDay(new Date()),
        to: endOfDay(new Date()),
      }),
    },
    {
      label: "7 Hari Terakhir",
      getValue: () => ({
        from: startOfDay(subDays(new Date(), 6)),
        to: endOfDay(new Date()),
      }),
    },
    {
      label: "30 Hari Terakhir",
      getValue: () => ({
        from: startOfDay(subDays(new Date(), 29)),
        to: endOfDay(new Date()),
      }),
    },
    {
      label: "Bulan Ini",
      getValue: () => ({
        from: startOfMonth(new Date()),
        to: endOfDay(new Date()),
      }),
    },
    {
      label: "Bulan Lalu",
      getValue: () => ({
        from: startOfMonth(subMonths(new Date(), 1)),
        to: endOfMonth(subMonths(new Date(), 1)),
      }),
    },
  ];

  const handleSelect = (range) => {
    onChange(range);
    // Auto close only if both start and end dates are selected
    if (range?.from && range?.to) {
      setOpen(false);
    }
  };

  const handlePresetSelect = (range) => {
    onChange(range);
    setOpen(false);
  };

  // Helper to highlight active preset
  const isPresetActive = (preset) => {
    if (!value?.from || !value?.to) return false;
    const presetRange = preset.getValue();
    return (
      format(value.from, "yyyy-MM-dd") === format(presetRange.from, "yyyy-MM-dd") &&
      format(value.to, "yyyy-MM-dd") === format(presetRange.to, "yyyy-MM-dd")
    );
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date-range"
            variant="outline"
            size="sm"
            className={cn(
              "w-[260px] justify-start text-left font-normal border-slate-200 text-xs h-9 bg-white hover:bg-slate-50 text-slate-700",
              !value && "text-muted-foreground",
              className
            )}
            disabled={disabled}
            {...props}
          >
            <CalendarIcon className="mr-2 h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
            {value?.from ? (
              value.to ? (
                <>
                  {format(value.from, "dd MMM yyyy", { locale: id })} -{" "}
                  {format(value.to, "dd MMM yyyy", { locale: id })}
                </>
              ) : (
                <>{format(value.from, "dd MMM yyyy", { locale: id })} - ...</>
              )
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 flex" align="end">
          {/* Presets Sidebar */}
          <div className="flex flex-col border-r border-slate-100 p-2 gap-1.5 bg-slate-50/50 min-w-[130px] justify-center">
            <span className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider">Presets</span>
            {presets.map((p) => {
              const active = isPresetActive(p);
              return (
                <Button
                  key={p.label}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "justify-start text-xs font-normal h-8 px-2.5 transition-colors",
                    active 
                      ? "bg-[#0093dd]/10 text-[#0093dd] font-semibold hover:bg-[#0093dd]/15 hover:text-[#0093dd]" 
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  )}
                  onClick={() => handlePresetSelect(p.getValue())}
                >
                  {p.label}
                </Button>
              );
            })}
          </div>

          {/* Calendar View */}
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={value?.from}
            selected={value}
            onSelect={handleSelect}
            numberOfMonths={2}
            locale={id}
            disabled={(date) => date > new Date()}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
