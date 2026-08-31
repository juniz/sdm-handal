"use client";

import { memo } from "react";
import { SpecialZoomLevel, Viewer, Worker } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";

import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";

function PDFViewerComponent({
	fileUrl = "/documents/akreditasi.pdf",
	initialPage = 0,
	onDocumentLoad,
	onDocumentLoadError,
	onPageChange,
}) {
	// Enable standard layout with sidebar tabs (thumbnails, outline/bookmarks) and search
	const defaultLayoutPluginInstance = defaultLayoutPlugin();

	return (
		<Worker workerUrl="/pdf.worker.min.js">
			<Viewer
				fileUrl={fileUrl}
				plugins={[defaultLayoutPluginInstance]}
				defaultScale={SpecialZoomLevel.PageWidth}
				initialPage={initialPage}
				theme="auto"
				onDocumentLoad={onDocumentLoad}
				onDocumentLoadError={onDocumentLoadError}
				onPageChange={onPageChange}
			/>
		</Worker>
	);
}

export default memo(PDFViewerComponent);


