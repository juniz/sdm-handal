"use client";

import { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import { Camera } from "lucide-react";

export function AttendanceCamera({ onCapture }) {
	const webcamRef = useRef(null);
	const [isCameraOpen, setIsCameraOpen] = useState(false);

	const capture = useCallback(() => {
		const imageSrc = webcamRef.current?.getScreenshot();
		if (imageSrc) {
			onCapture(imageSrc);
			setIsCameraOpen(false);
		}
	}, [onCapture]);

	if (!isCameraOpen) {
		return (
			<button
				onClick={() => setIsCameraOpen(true)}
				className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-blue-500 transition-colors"
			>
				<Camera className="w-8 h-8 text-gray-400" />
				<span className="text-sm text-gray-500">Klik untuk mengambil foto</span>
			</button>
		);
	}

	return (
		<div className="relative">
			<Webcam
				audio={false}
				ref={webcamRef}
				screenshotFormat="image/jpeg"
				className="w-full rounded-lg"
				mirrored={true}
				videoConstraints={{
					facingMode: "user",
					width: 720,
					height: 480,
				}}
			/>
			<div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
				<button
					onClick={() => setIsCameraOpen(false)}
					className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
				>
					Batal
				</button>
				<button
					onClick={capture}
					className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
				>
					Ambil Foto
				</button>
			</div>
		</div>
	);
}
