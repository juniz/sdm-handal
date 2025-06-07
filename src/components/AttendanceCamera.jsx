"use client";

import { useRef, forwardRef, useImperativeHandle } from "react";
import Webcam from "react-webcam";

export const AttendanceCamera = forwardRef(function AttendanceCamera(
	{ onCapture },
	ref
) {
	const webcamRef = useRef(null);

	// Expose capture function to parent component
	useImperativeHandle(ref, () => ({
		capturePhoto: () => {
			const imageSrc = webcamRef.current?.getScreenshot();
			if (imageSrc && onCapture) {
				onCapture(imageSrc);
				return imageSrc;
			}
			return null;
		},
		isReady: () => {
			return webcamRef.current !== null;
		},
	}));

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
			<div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
				Kamera Siap
			</div>
		</div>
	);
});
