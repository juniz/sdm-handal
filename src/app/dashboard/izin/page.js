"use client";

import { motion } from "framer-motion";
import { CalendarCheck, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PengajuanIzinForm from "./components/PengajuanIzinForm";
import DaftarIzin from "./components/DaftarIzin";

const fadeIn = {
	initial: { opacity: 0, y: 20 },
	animate: { opacity: 1, y: 0 },
	transition: { duration: 0.5 },
};

const staggerContainer = {
	animate: {
		transition: {
			staggerChildren: 0.1,
		},
	},
};

export default function IzinPage() {
	const router = useRouter();

	return (
		<div className="min-h-[80vh] bg-gradient-to-br from-blue-50 to-indigo-50 max-[779px]:bg-[#f2f2f7] max-[779px]:pb-6">
			<header className="bg-[#f2f2f7] pt-1 min-[780px]:hidden">
				<button
					type="button"
					onClick={() => router.back()}
					className="flex min-h-11 items-center gap-0.5 px-3 text-[17px] font-medium text-[#007aff] transition-opacity active:opacity-40"
					aria-label="Kembali ke halaman sebelumnya"
				>
					<ChevronLeft className="size-6" aria-hidden="true" />
					Kembali
				</button>

				<div className="flex items-center gap-4 px-5 pb-4 pt-1">
					<div>
						<h1 className="text-[34px] font-bold leading-tight tracking-tight text-[#1c1c1e]">
							Izin
						</h1>
						<p className="text-[13px] font-medium text-[#6e6e73]">
							Manajemen Pengajuan Izin
						</p>
					</div>
					<div className="ml-auto flex size-12 items-center justify-center rounded-xl bg-[#007aff] text-white shadow-sm">
						<CalendarCheck className="size-6" aria-hidden="true" />
					</div>
				</div>
			</header>

			<motion.div
				initial="initial"
				animate="animate"
				variants={staggerContainer}
				className="mx-auto max-w-6xl"
			>
				<motion.div variants={fadeIn}>
					<Card className="backdrop-blur-sm bg-white/90 shadow-xl border-0 max-[779px]:rounded-none max-[779px]:bg-transparent max-[779px]:shadow-none max-[779px]:backdrop-blur-none">
						<CardHeader className="space-y-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 md:p-6 max-[779px]:hidden">
							<motion.div
								initial={{ scale: 0.95 }}
								animate={{ scale: 1 }}
								transition={{ duration: 0.3 }}
							>
								<CardTitle className="text-xl md:text-2xl font-bold text-center">
									Pengajuan Izin
								</CardTitle>
							</motion.div>
						</CardHeader>
						<CardContent className="p-4 md:p-6 max-[779px]:px-4 max-[779px]:pb-0 max-[779px]:pt-1">
							<Tabs defaultValue="pengajuan" className="w-full">
								<TabsList className="w-full justify-start my-4 max-[779px]:mt-0 max-[779px]:mb-5 max-[779px]:grid max-[779px]:h-12 max-[779px]:grid-cols-2 max-[779px]:rounded-lg max-[779px]:bg-[#e3e3e8] max-[779px]:p-0.5">
									<TabsTrigger
										value="pengajuan"
										className="max-[779px]:h-11 max-[779px]:rounded-[7px] max-[779px]:text-[13px] max-[779px]:font-semibold max-[779px]:text-[#6e6e73] max-[779px]:shadow-none max-[779px]:data-[state=active]:bg-white max-[779px]:data-[state=active]:text-[#1c1c1e] max-[779px]:data-[state=active]:shadow-sm"
									>
										<span className="min-[780px]:hidden">Pengajuan</span>
										<span className="hidden min-[780px]:inline">Pengajuan Izin</span>
									</TabsTrigger>
									<TabsTrigger
										value="daftar"
										className="max-[779px]:h-11 max-[779px]:rounded-[7px] max-[779px]:text-[13px] max-[779px]:font-semibold max-[779px]:text-[#6e6e73] max-[779px]:shadow-none max-[779px]:data-[state=active]:bg-white max-[779px]:data-[state=active]:text-[#1c1c1e] max-[779px]:data-[state=active]:shadow-sm"
									>
										<span className="min-[780px]:hidden">Riwayat</span>
										<span className="hidden min-[780px]:inline">Daftar Izin</span>
									</TabsTrigger>
								</TabsList>
								<TabsContent value="pengajuan">
									<PengajuanIzinForm />
								</TabsContent>
								<TabsContent value="daftar">
									<DaftarIzin />
								</TabsContent>
							</Tabs>
						</CardContent>
					</Card>
				</motion.div>
			</motion.div>
		</div>
	);
}
