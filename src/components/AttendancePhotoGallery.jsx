"use client";

import { useState, useEffect } from "react";
import OptimizedPhotoDisplay from "./OptimizedPhotoDisplay";
import { useImagePrefetch } from "@/hooks/useImageOptimization";
import {
	ChevronLeft,
	ChevronRight,
	X,
	Calendar,
	Clock,
	Maximize2,
} from "lucide-react";

const AttendancePhotoGallery = ({ photos = [], currentIndex = 0, onClose }) => {
	const [activeIndex, setActiveIndex] = useState(currentIndex);
	const [isModalOpen, setIsModalOpen] = useState(false);

	// Prefetch adjacent images untuk smooth navigation
	const adjacentPhotos = photos
		.slice(Math.max(0, activeIndex - 2), activeIndex + 3)
		.map((photo) => photo.url)
		.filter(Boolean);

	useImagePrefetch(adjacentPhotos);

	const goToPrevious = () => {
		setActiveIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
	};

	const goToNext = () => {
		setActiveIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
	};

	const handleKeyDown = (e) => {
		if (e.key === "ArrowLeft") goToPrevious();
		if (e.key === "ArrowRight") goToNext();
		if (e.key === "Escape") setIsModalOpen(false);
	};

	useEffect(() => {
		if (isModalOpen) {
			document.addEventListener("keydown", handleKeyDown);
			return () => document.removeEventListener("keydown", handleKeyDown);
		}
	}, [isModalOpen]);

	const currentPhoto = photos[activeIndex];

	if (!photos.length) return null;

	return (
		<>
			{/* Gallery Grid */}
			<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
				{photos.map((photo, index) => (
					<div key={index} className="relative group cursor-pointer">
						<OptimizedPhotoDisplay
							photoUrl={photo.url}
							alt={`Foto Presensi ${photo.date}`}
							width={150}
							height={150}
							lazy={true}
							className="w-full h-32 object-cover rounded-lg transition-transform group-hover:scale-105"
						/>

						{/* Overlay info */}
						<div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-lg flex items-end">
							<div className="w-full p-2 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
								<div className="flex items-center gap-1 mb-1">
									<Calendar className="w-3 h-3" />
									<span>{photo.date}</span>
								</div>
								<div className="flex items-center gap-1">
									<Clock className="w-3 h-3" />
									<span>{photo.time}</span>
								</div>
							</div>
						</div>

						{/* Expand button */}
						<button
							onClick={() => {
								setActiveIndex(index);
								setIsModalOpen(true);
							}}
							className="absolute top-2 right-2 p-1 bg-black bg-opacity-50 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
						>
							<Maximize2 className="w-3 h-3" />
						</button>

						{/* Status indicator */}
						<div
							className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-medium ${
								photo.type === "checkin"
									? "bg-green-500 text-white"
									: "bg-orange-500 text-white"
							}`}
						>
							{photo.type === "checkin" ? "Masuk" : "Pulang"}
						</div>
					</div>
				))}
			</div>

			{/* Modal untuk view photo besar */}
			{isModalOpen && (
				<div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
					<div className="relative max-w-4xl max-h-full">
						{/* Close button */}
						<button
							onClick={() => setIsModalOpen(false)}
							className="absolute top-4 right-4 z-10 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors"
						>
							<X className="w-5 h-5" />
						</button>

						{/* Navigation buttons */}
						{photos.length > 1 && (
							<>
								<button
									onClick={goToPrevious}
									className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors"
								>
									<ChevronLeft className="w-6 h-6" />
								</button>
								<button
									onClick={goToNext}
									className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors"
								>
									<ChevronRight className="w-6 h-6" />
								</button>
							</>
						)}

						{/* Main image */}
						<div className="relative">
							<OptimizedPhotoDisplay
								photoUrl={currentPhoto?.url}
								alt={`Foto Presensi ${currentPhoto?.date}`}
								width={800}
								height={600}
								priority={true}
								lazy={false}
								className="max-w-full max-h-[80vh] object-contain"
							/>

							{/* Photo info overlay */}
							<div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-4">
								<div className="flex items-center justify-between">
									<div>
										<div className="flex items-center gap-2 mb-1">
											<Calendar className="w-4 h-4" />
											<span className="font-medium">{currentPhoto?.date}</span>
											<div
												className={`px-2 py-1 rounded text-xs font-medium ${
													currentPhoto?.type === "checkin"
														? "bg-green-500"
														: "bg-orange-500"
												}`}
											>
												{currentPhoto?.type === "checkin"
													? "Presensi Masuk"
													: "Presensi Pulang"}
											</div>
										</div>
										<div className="flex items-center gap-2">
											<Clock className="w-4 h-4" />
											<span>{currentPhoto?.time}</span>
											{currentPhoto?.location && (
												<span className="text-sm text-gray-300">
													• {currentPhoto.location}
												</span>
											)}
										</div>
									</div>

									{photos.length > 1 && (
										<div className="text-sm text-gray-300">
											{activeIndex + 1} dari {photos.length}
										</div>
									)}
								</div>
							</div>
						</div>
					</div>
				</div>
			)}
		</>
	);
};

export default AttendancePhotoGallery;
