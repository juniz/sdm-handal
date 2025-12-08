"use client";

import { useState } from "react";
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

export default function PDFViewerComponent({
	onDocumentLoad,
	onDocumentLoadError,
	onPageChange,
}) {
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

	return (
		<Worker workerUrl="/pdf.worker.min.js">
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
				onDocumentLoad={onDocumentLoad}
				onDocumentLoadError={onDocumentLoadError}
				onPageChange={onPageChange}
				renderPage={(props) => (
					<div style={{ margin: "8px auto", maxWidth: "100%" }}>
						{props.canvasLayer.children}
						{props.annotationLayer.children}
						{props.textLayer.children}
					</div>
				)}
			/>
		</Worker>
	);
}

