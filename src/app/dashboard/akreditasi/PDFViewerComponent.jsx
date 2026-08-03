"use client";

import { memo } from "react";
import { SpecialZoomLevel, Viewer, Worker } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";

import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";

function PDFViewerComponent({
	onDocumentLoad,
	onDocumentLoadError,
	onPageChange,
}) {
	// Memanggil plugin di tingkat teratas komponen fungsi sesuai aturan React Hooks
	const defaultLayoutPluginInstance = defaultLayoutPlugin({
		sidebarTabs: () => [],
	});

	return (
		<Worker workerUrl="/pdf.worker.min.js">
			<Viewer
				fileUrl="/documents/akreditasi.pdf"
				plugins={[defaultLayoutPluginInstance]}
				defaultScale={SpecialZoomLevel.PageWidth}
				theme="auto"
				onDocumentLoad={onDocumentLoad}
				onDocumentLoadError={onDocumentLoadError}
				onPageChange={onPageChange}
			/>
		</Worker>
	);
}

export default memo(PDFViewerComponent);

