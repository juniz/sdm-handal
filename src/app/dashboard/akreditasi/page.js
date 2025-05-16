"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { BookOpen, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

import { Viewer, Worker } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import { zoomPlugin } from "@react-pdf-viewer/zoom";
import { toolbarPlugin } from "@react-pdf-viewer/toolbar";
import { pageNavigationPlugin } from "@react-pdf-viewer/page-navigation";

import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";
import "@react-pdf-viewer/toolbar/lib/styles/index.css";
import "@react-pdf-viewer/zoom/lib/styles/index.css";
import "@react-pdf-viewer/page-navigation/lib/styles/index.css";

const fadeIn = {
	initial: { opacity: 0, y: 20 },
	animate: { opacity: 1, y: 0 },
	transition: { duration: 0.5 },
};

export default function AkreditasiPage() {
	const [currentPage, setCurrentPage] = useState(0);

	// Inisialisasi plugin
	const pageNavigationPluginInstance = pageNavigationPlugin();
	const defaultLayoutPluginInstance = defaultLayoutPlugin({
		sidebarTabs: (defaultTabs) => [],
	});
	const zoomPluginInstance = zoomPlugin();
	const toolbarPluginInstance = toolbarPlugin({
		scrollModePlugin: {
			scrollMode: "vertical",
		},
	});

	const handleDownload = () => {
		const link = document.createElement("a");
		link.href = "/documents/akreditasi.pdf";
		link.download = "buku-akreditasi.pdf";
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	return (
		<div className="min-h-[80vh] bg-gradient-to-br from-rose-50 to-pink-50">
			<motion.div
				initial="initial"
				animate="animate"
				variants={fadeIn}
				className="max-w-6xl mx-auto"
			>
				<Card className="backdrop-blur-sm bg-white/90 shadow-xl border-0">
					<CardHeader className="space-y-1 bg-gradient-to-r from-rose-600 to-pink-600 text-white p-2 md:p-6">
						<div className="flex items-center justify-between flex-wrap gap-4">
							<div className="flex items-center gap-2">
								<BookOpen className="w-6 h-6" />
								<CardTitle className="text-xl md:text-2xl font-bold">
									Buku Akreditasi
								</CardTitle>
							</div>
							<Button
								onClick={handleDownload}
								variant="ghost"
								className="bg-white/20 hover:bg-white/30 text-white"
							>
								<Download className="w-4 h-4 mr-2" />
								Unduh PDF
							</Button>
						</div>
					</CardHeader>
					<CardContent className="!p-0">
						<div className="min-h-[80vh] bg-gray-100 rounded-lg overflow-hidden">
							<Worker
								workerUrl={`https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js`}
							>
								<Viewer
									fileUrl="/documents/akreditasi.pdf"
									plugins={[
										pageNavigationPluginInstance,
										defaultLayoutPluginInstance,
										zoomPluginInstance,
										toolbarPluginInstance,
									]}
									defaultScale={0.6}
									theme={{
										theme: "auto",
									}}
									onPageChange={(e) => setCurrentPage(e.currentPage)}
									renderPage={(props) => (
										<div style={{ margin: "8px auto", maxWidth: "100%" }}>
											{props.canvasLayer.children}
											{props.annotationLayer.children}
											{props.textLayer.children}
										</div>
									)}
								/>
							</Worker>
						</div>
					</CardContent>
				</Card>
			</motion.div>
		</div>
	);
}
