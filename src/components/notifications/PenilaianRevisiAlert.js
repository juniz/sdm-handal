"use client";

import { useRouter } from "next/navigation";
import { AlertTriangle, CalendarDays, ExternalLink, X } from "lucide-react";
import usePenilaianRevisiNotif from "@/hooks/usePenilaianRevisiNotif";
import moment from "moment";
import "moment/locale/id";

moment.locale("id");

export default function PenilaianRevisiAlert() {
  const router = useRouter();
  const { revisiList, loading, markAsRead } = usePenilaianRevisiNotif();

  if (loading || !revisiList || revisiList.length === 0) return null;

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3 shadow-xs">
      {/* Header */}
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
        <p className="text-sm font-bold text-amber-800">
          {revisiList.length === 1
            ? "Ada 1 penilaian harian yang perlu direvisi"
            : `Ada ${revisiList.length} penilaian harian yang perlu direvisi`}
        </p>
      </div>

      {/* List */}
      <ul className="divide-y divide-amber-200/60 space-y-0">
        {revisiList.map((item) => (
          <li
            key={item.id}
            className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
          >
            <div className="flex items-start gap-2.5 min-w-0">
              <CalendarDays className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-amber-900">
                  {moment(item.tanggal).format("DD MMMM YYYY")}
                </p>
                {item.catatan_supervisor && (
                  <p className="text-xs text-amber-700 mt-0.5 line-clamp-2 leading-relaxed">
                    &ldquo;{item.catatan_supervisor}&rdquo;
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() =>
                  router.push(
                    `/dashboard/penilaian-kinerja/input?tanggal=${item.tanggal}`
                  )
                }
                className="flex items-center gap-1 text-xs font-semibold text-amber-800 hover:text-amber-950 bg-amber-100/80 hover:bg-amber-200/80 border border-amber-300/60 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                <ExternalLink className="h-3 w-3" />
                Buka
              </button>
              <button
                onClick={() => markAsRead(item.id)}
                className="p-1 rounded-lg text-amber-500 hover:text-amber-700 hover:bg-amber-100 transition-colors cursor-pointer"
                aria-label="Tutup notifikasi"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
