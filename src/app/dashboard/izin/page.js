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
		<div className="min-h-[80vh] bg-[#f2f2f7] pb-6 min-[780px]:bg-gradient-to-br min-[780px]:from-blue-50 min-[780px]:to-indigo-50 min-[780px]:pb-0">
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
					<Card className="rounded-none border-0 bg-transparent py-0 shadow-none min-[780px]:rounded-xl min-[780px]:bg-white/90 min-[780px]:py-6 min-[780px]:shadow-xl min-[780px]:backdrop-blur-sm">
						<CardHeader className="hidden space-y-1 bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white min-[780px]:flex min-[780px]:p-6">
							<motion.div
								initial={{ scale: 0.95 }}
								animate={{ scale: 1 }}
								transition={{ duration: 0.3 }}
							>
								<CardTitle className="text-center text-xl font-bold min-[780px]:text-2xl">
									Pengajuan Izin
								</CardTitle>
							</motion.div>
						</CardHeader>
						<CardContent className="px-4 pb-0 pt-1 min-[780px]:p-6">
							<Tabs defaultValue="pengajuan" className="w-full">
								<TabsList className="mb-5 grid h-9 w-full grid-cols-2 rounded-lg bg-[#e3e3e8] p-0.5 min-[780px]:my-4 min-[780px]:flex min-[780px]:h-9 min-[780px]:justify-start min-[780px]:rounded-md min-[780px]:bg-muted min-[780px]:p-[3px]">
									<TabsTrigger
										value="pengajuan"
										className="h-8 rounded-[7px] text-[13px] font-semibold text-[#6e6e73] shadow-none data-[state=active]:bg-white data-[state=active]:text-[#1c1c1e] data-[state=active]:shadow-sm min-[780px]:h-[calc(100%-1px)] min-[780px]:rounded-sm min-[780px]:text-sm"
									>
										Pengajuan
									</TabsTrigger>
									<TabsTrigger
										value="daftar"
										className="h-8 rounded-[7px] text-[13px] font-semibold text-[#6e6e73] shadow-none data-[state=active]:bg-white data-[state=active]:text-[#1c1c1e] data-[state=active]:shadow-sm min-[780px]:h-[calc(100%-1px)] min-[780px]:rounded-sm min-[780px]:text-sm"
									>
										Riwayat
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
