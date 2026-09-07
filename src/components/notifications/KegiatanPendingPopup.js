"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  CalendarDays,
  ExternalLink,
  ChevronDown,
  X,
  AlertCircle,
} from "lucide-react";
import moment from "moment";
import "moment/locale/id";
import usePenilaianPendingNotif from "@/hooks/usePenilaianPendingNotif";

moment.locale("id");

export default function KegiatanPendingPopup() {
  const router = useRouter();
  const { pendingList, loading, isDismissed, dismissItem, dismissAll } =
    usePenilaianPendingNotif();
  const [isExpanded, setIsExpanded] = useState(false);

  if (loading || isDismissed || !pendingList || pendingList.length === 0) {
    return null;
  }

  const count = pendingList.length;

  return (
    <div className="pointer-events-auto w-full">
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white rounded-2xl border border-sky-200/80 shadow-xl overflow-hidden backdrop-blur-md"
      >
        {/* Header Bar (Clickable to toggle expand) */}
        <div
          onClick={() => setIsExpanded((prev) => !prev)}
          className="flex items-center justify-between p-3.5 bg-sky-50/90 hover:bg-sky-100/70 transition-colors select-none cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-sky-500/15 flex items-center justify-center shrink-0">
              <Clock className="h-4.5 w-4.5 text-sky-600" />
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-extrabold text-slate-800 tracking-tight">
                Kegiatan Belum Dikirim
              </span>
              <span className="bg-sky-500 text-white text-xs font-black px-2 py-0.5 rounded-full shadow-xs shrink-0">
                {count}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="p-1 text-slate-400 hover:text-slate-600"
            >
              <ChevronDown className="h-4 w-4" />
            </motion.div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                dismissAll();
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Tutup notifikasi"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Expandable Body */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden border-t border-sky-100/80"
            >
              <ul className="divide-y divide-sky-100/60 max-h-72 overflow-y-auto">
                {pendingList.map((item) => (
                  <li
                    key={item.id || item.tanggal}
                    className="p-3.5 flex items-start justify-between gap-3 hover:bg-sky-50/40 transition-colors"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <CalendarDays className="h-4 w-4 text-sky-500 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-xs font-bold text-slate-800">
                            {moment(item.tanggal).format("dddd, DD MMMM YYYY")}
                          </p>
                          {item.shift && (
                            <span className="bg-sky-100 text-sky-800 text-[10px] font-semibold px-1.5 py-0.5 rounded">
                              Shift: {item.shift}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex items-center gap-1.5">
                          {item.status === "draft" ? (
                            <span className="bg-amber-100 text-amber-800 text-[11px] font-semibold px-2 py-0.5 rounded inline-flex items-center gap-1">
                              <AlertCircle className="h-3 w-3 text-amber-600" />
                              Draft ({item.kegiatan_count} kegiatan)
                            </span>
                          ) : (
                            <span className="bg-rose-100 text-rose-800 text-[11px] font-semibold px-2 py-0.5 rounded inline-flex items-center gap-1">
                              <AlertCircle className="h-3 w-3 text-rose-600" />
                              Belum Diisi
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 mt-0.5">
                      <button
                        onClick={() =>
                          router.push(
                            `/dashboard/penilaian-kinerja/input?tanggal=${item.tanggal}`
                          )
                        }
                        className="flex items-center gap-1 bg-sky-100/80 hover:bg-sky-200/80 text-sky-800 border border-sky-300/60 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Isi / Kirim
                      </button>
                      <button
                        onClick={() => dismissItem(item.tanggal)}
                        className="p-1 rounded-lg text-sky-400 hover:text-sky-700 hover:bg-sky-100 transition-colors cursor-pointer"
                        aria-label="Tutup notifikasi item ini"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
