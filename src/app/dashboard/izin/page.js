"use client";
import { useState } from "react";
import {
	Card,
	CardHeader,
	CardTitle,
	CardContent,
	CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Calendar, Clock, Send } from "lucide-react";
import { DatePicker } from "@/components/DatePicker";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PegawaiCombobox } from "@/components/PegawaiCombobox";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import moment from "moment";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
	return (
		<div className="min-h-[80vh] bg-gradient-to-br from-blue-50 to-indigo-50">
			<motion.div
				initial="initial"
				animate="animate"
				variants={staggerContainer}
				className="max-w-6xl mx-auto"
			>
				<motion.div variants={fadeIn}>
					<Card className="backdrop-blur-sm bg-white/90 shadow-xl border-0">
						<CardHeader className="space-y-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 md:p-6">
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
						<CardContent className="p-4 md:p-6">
							<Tabs defaultValue="pengajuan" className="w-full">
								<TabsList className="w-full justify-start my-4">
									<TabsTrigger value="pengajuan">Pengajuan Izin</TabsTrigger>
									<TabsTrigger value="daftar">Daftar Izin</TabsTrigger>
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
