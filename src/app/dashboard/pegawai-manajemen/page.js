"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Users,
  Briefcase,
  BarChart3,
  SlidersHorizontal,
  Award,
  ChevronRight,
  LayoutDashboard,
} from "lucide-react";
import PegawaiDataSection from "@/components/pegawai-manajemen/PegawaiDataSection";
import IndexRemunerasiSection from "@/components/pegawai-manajemen/IndexRemunerasiSection";
import EvaluasiPegawaiSection from "@/components/pegawai-manajemen/EvaluasiPegawaiSection";
import PencapaianPegawaiSection from "@/components/pegawai-manajemen/PencapaianPegawaiSection";
import ThresholdSection from "@/components/pegawai-manajemen/ThresholdSection";
import Link from "next/link";

const tabs = [
  {
    value: "pegawai",
    label: "Data Pegawai",
    icon: Users,
    description: "Kelola data identitas pegawai",
  },
  {
    value: "remunerasi",
    label: "Index Remunerasi",
    icon: Briefcase,
    description: "Atur indeks remunerasi jabatan",
  },
  {
    value: "evaluasi",
    label: "Evaluasi Kinerja",
    icon: BarChart3,
    description: "Penilaian kinerja pegawai",
  },
  {
    value: "pencapaian",
    label: "Pencapaian Kinerja",
    icon: Award,
    description: "Rekap capaian kinerja",
  },
  {
    value: "threshold",
    label: "Threshold Kelompok",
    icon: SlidersHorizontal,
    description: "Batas nilai kelompok jabatan",
  },
];

export default function PegawaiManajemenPage() {
  const [activeTab, setActiveTab] = useState("pegawai");

  const activeTabData = tabs.find((t) => t.value === activeTab);

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700&family=Source+Sans+3:wght@300;400;500;600;700&display=swap');

        .pgw-root {
          font-family: 'Source Sans 3', system-ui, sans-serif;
        }
        .pgw-heading {
          font-family: 'Lexend', system-ui, sans-serif;
        }

        /* Page entrance animation */
        @keyframes pgw-fade-up {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .pgw-animate-in {
          animation: pgw-fade-up 0.3s ease-out both;
        }
        .pgw-animate-in-delay-1 { animation-delay: 0.05s; }
        .pgw-animate-in-delay-2 { animation-delay: 0.10s; }
        .pgw-animate-in-delay-3 { animation-delay: 0.15s; }

        @media (prefers-reduced-motion: reduce) {
          .pgw-animate-in { animation: none !important; }
        }

        /* Tab button overrides */
        .pgw-tab-trigger {
          display: flex;
          align-items: center;
          gap: 10px;
          min-height: 48px;
          padding: 0 24px;
          font-size: 15px;
          font-weight: 500;
          font-family: 'Source Sans 3', system-ui, sans-serif;
          color: #64748b;
          border-bottom: 3px solid transparent;
          border-radius: 0;
          background: transparent;
          white-space: nowrap;
          transition: all 0.2s ease;
          cursor: pointer;
          position: relative;
          outline-offset: -2px;
          flex-shrink: 0;
        }
        .pgw-tab-trigger:hover:not([data-state="active"]) {
          color: #0093dd;
          background: #f0f9ff;
        }
        .pgw-tab-trigger:focus-visible {
          outline: 3px solid #0093dd;
          border-radius: 4px;
        }
        .pgw-tab-trigger[data-state="active"] {
          color: #0093dd;
          border-bottom-color: #0093dd;
          font-weight: 600;
          background: transparent;
        }
        .pgw-tab-trigger[data-state="active"] .pgw-tab-icon {
          color: #0093dd;
          transform: scale(1.1);
        }
        .pgw-tab-icon {
          color: #94a3b8;
          flex-shrink: 0;
          transition: all 0.2s ease;
        }
        .pgw-tab-trigger:hover .pgw-tab-icon {
          color: #0093dd;
        }
        
        .pgw-tab-list-container {
          position: relative;
          width: 100%;
        }
        
        /* Mobile scroll indicators */
        .pgw-tab-list-container::after {
          content: "";
          position: absolute;
          right: 0;
          top: 0;
          bottom: 0;
          width: 40px;
          background: linear-gradient(to right, transparent, rgba(255,255,255,0.9));
          pointer-events: none;
          z-index: 10;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        @media (max-width: 768px) {
          .pgw-tab-list-container::after {
            opacity: 1;
          }
        }

        .pgw-tab-list {
          display: flex;
          align-items: flex-end;
          gap: 0;
          background: transparent;
          border-bottom: 1px solid #e2e8f0;
          padding: 0;
          height: auto;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          width: 100%;
        }
        .pgw-tab-list::-webkit-scrollbar { display: none; }

        /* Mobile tab label hide */
        @media (max-width: 640px) {
          .pgw-tab-trigger {
            padding: 0 16px;
            min-height: 56px;
            font-size: 14px;
            gap: 8px;
          }
          .pgw-tab-label-long { display: none; }
          .pgw-tab-label-short { display: inline; }
        }
        @media (min-width: 641px) {
          .pgw-tab-label-long { display: inline; }
          .pgw-tab-label-short { display: none; }
        }
      `}</style>

      <div className="pgw-root max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-0">

        {/* ── Breadcrumb ───────────────────────────────── */}
        <nav
          aria-label="Breadcrumb"
          className="pgw-animate-in flex items-center gap-1 text-xs sm:text-sm font-medium text-slate-500 mb-4 sm:mb-6"
        >
          <Link
            href="/dashboard"
            className="flex items-center gap-1 hover:text-[#0093dd] transition-colors focus-visible:outline-none focus-visible:text-[#0093dd]"
          >
            <LayoutDashboard size={14} className="sm:size-[16px]" />
            <span className="hidden xs:inline">Dashboard</span>
            <span className="xs:hidden">Home</span>
          </Link>
          <ChevronRight size={14} className="text-slate-300" />
          <span className="text-slate-900 font-semibold truncate">Manajemen Pegawai</span>
        </nav>

        {/* ── Page Header ──────────────────────────────── */}
        <div className="pgw-animate-in pgw-animate-in-delay-1 mb-6 sm:mb-8">
          <h1 className="pgw-heading text-xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-2">
            Manajemen Data Pegawai
          </h1>
          <p className="text-slate-500 text-sm sm:text-base leading-relaxed max-w-3xl">
            Kelola data pegawai, remunerasi, evaluasi kinerja, dan threshold kelompok jabatan dalam satu tempat terpadu.
          </p>
        </div>

        {/* ── Main Card ────────────────────────────────── */}
        <div className="pgw-animate-in pgw-animate-in-delay-2 bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">

            {/* Tab Bar */}
            <div className="pgw-tab-list-container bg-white">
              <TabsList className="pgw-tab-list" aria-label="Modul manajemen pegawai">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="pgw-tab-trigger"
                      aria-label={tab.label}
                    >
                      <Icon size={18} className="pgw-tab-icon" aria-hidden="true" />
                      {/* Short label on mobile */}
                      <span className="pgw-tab-label-short">
                        {tab.label.split(" ")[0]}
                      </span>
                      {/* Full label on desktop */}
                      <span className="pgw-tab-label-long">{tab.label}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

            {/* Active Tab Context Strip */}
            {/* {activeTabData && (
              <div className="flex items-center gap-3 px-4 sm:px-6 py-3 sm:py-4 bg-slate-50 border-b border-slate-200">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-[#0093dd]/10 flex items-center justify-center flex-shrink-0">
                  <activeTabData.icon size={18} className="text-[#0093dd]" aria-hidden="true" />
                </div>
                <div>
                  <p className="pgw-heading text-sm sm:text-base font-semibold text-slate-900 leading-tight">
                    {activeTabData.label}
                  </p>
                  <p className="text-[11px] sm:text-xs text-slate-500 leading-tight mt-0.5">
                    {activeTabData.description}
                  </p>
                </div>
              </div>
            )} */}

            {/* Tab Content Areas */}
            <TabsContent value="pegawai" className="mt-0 focus-visible:outline-none">
              <PegawaiDataSection />
            </TabsContent>

            <TabsContent value="remunerasi" className="mt-0 focus-visible:outline-none">
              <IndexRemunerasiSection />
            </TabsContent>

            <TabsContent value="evaluasi" className="mt-0 focus-visible:outline-none">
              <EvaluasiPegawaiSection />
            </TabsContent>

            <TabsContent value="pencapaian" className="mt-0 focus-visible:outline-none">
              <PencapaianPegawaiSection />
            </TabsContent>

            <TabsContent value="threshold" className="mt-0 focus-visible:outline-none">
              <ThresholdSection />
            </TabsContent>

          </Tabs>
        </div>

        {/* ── Footer note ──────────────────────────────── */}
        <p className="pgw-animate-in pgw-animate-in-delay-3 text-center text-xs text-slate-400 pt-6">
          Sistem Manajemen SDM · Data diperbarui secara real-time
        </p>

      </div>
    </div>
  );
}
