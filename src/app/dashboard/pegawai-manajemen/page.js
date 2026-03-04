"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Users, Briefcase, BarChart3 } from "lucide-react";
import PegawaiDataSection from "@/components/pegawai-manajemen/PegawaiDataSection";
import IndexRemunerasiSection from "@/components/pegawai-manajemen/IndexRemunerasiSection";
import EvaluasiPegawaiSection from "@/components/pegawai-manajemen/EvaluasiPegawaiSection";

export default function PegawaiManajemenPage() {
	return (
		<div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
			<div className="mb-6">
				<h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
					Manajemen Data Pegawai
				</h1>
				<p className="text-gray-600">
					Kelola data pegawai, index remunerasi, dan evaluasi kinerja dalam satu
					tempat
				</p>
			</div>

			<Tabs defaultValue="pegawai" className="w-full">
				<div className="overflow-x-auto pb-2">
					<TabsList className="inline-flex w-auto min-w-full sm:grid sm:w-full sm:max-w-2xl sm:grid-cols-3 mb-6 h-auto p-1">
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
			</Tabs>
		</div>
	);
}
