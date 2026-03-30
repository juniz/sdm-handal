"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
	Users,
	Briefcase,
	BarChart3,
	SlidersHorizontal,
	Award,
} from "lucide-react";
import PegawaiDataSection from "@/components/pegawai-manajemen/PegawaiDataSection";
import IndexRemunerasiSection from "@/components/pegawai-manajemen/IndexRemunerasiSection";
import EvaluasiPegawaiSection from "@/components/pegawai-manajemen/EvaluasiPegawaiSection";
import PencapaianPegawaiSection from "@/components/pegawai-manajemen/PencapaianPegawaiSection";
import ThresholdSection from "@/components/pegawai-manajemen/ThresholdSection";

export default function PegawaiManajemenPage() {
	return (
		<div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
			<div className="mb-6">
				<h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
					Manajemen Data Pegawai
				</h1>
				<p className="text-gray-600">
					Kelola data pegawai, index remunerasi, evaluasi kinerja, pencapaian
					kinerja, dan threshold kelompok jabatan dalam satu tempat
				</p>
			</div>

			<Tabs defaultValue="pegawai" className="w-full">
				<div className="overflow-x-auto pb-2">
					<TabsList className="inline-flex w-auto min-w-full sm:grid sm:w-full sm:max-w-5xl sm:grid-cols-5 mb-6 h-auto p-1">
						<TabsTrigger
							value="pegawai"
							className="flex items-center gap-2 py-2 px-4"
						>
							<Users className="w-4 h-4 shrink-0" />
							<span className="whitespace-nowrap">Data Pegawai</span>
						</TabsTrigger>
						<TabsTrigger
							value="remunerasi"
							className="flex items-center gap-2 py-2 px-4"
						>
							<Briefcase className="w-4 h-4 shrink-0" />
							<span className="whitespace-nowrap">Index Remunerasi</span>
						</TabsTrigger>
						<TabsTrigger
							value="evaluasi"
							className="flex items-center gap-2 py-2 px-4"
						>
							<BarChart3 className="w-4 h-4 shrink-0" />
							<span className="whitespace-nowrap">Evaluasi Kinerja</span>
						</TabsTrigger>
						<TabsTrigger
							value="pencapaian"
							className="flex items-center gap-2 py-2 px-4"
						>
							<Award className="w-4 h-4 shrink-0" />
							<span className="whitespace-nowrap">Pencapaian Kinerja</span>
						</TabsTrigger>
						<TabsTrigger
							value="threshold"
							className="flex items-center gap-2 py-2 px-4"
						>
							<SlidersHorizontal className="w-4 h-4 shrink-0" />
							<span className="whitespace-nowrap">Threshold Kelompok</span>
						</TabsTrigger>
					</TabsList>
				</div>

				<TabsContent value="pegawai" className="mt-0">
					<PegawaiDataSection />
				</TabsContent>

				<TabsContent value="remunerasi" className="mt-0">
					<IndexRemunerasiSection />
				</TabsContent>

				<TabsContent value="evaluasi" className="mt-0">
					<EvaluasiPegawaiSection />
				</TabsContent>

				<TabsContent value="pencapaian" className="mt-0">
					<PencapaianPegawaiSection />
				</TabsContent>

				<TabsContent value="threshold" className="mt-0">
					<ThresholdSection />
				</TabsContent>
			</Tabs>
		</div>
	);
}
