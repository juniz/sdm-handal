"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { MapPin, Maximize, X } from "lucide-react";
import "leaflet/dist/leaflet.css";

// Koordinat kantor dengan nilai default
const OFFICE_LOCATION = {
	lat: parseFloat(process.env.NEXT_PUBLIC_OFFICE_LAT || "-6.2088") || -6.2088,
	lng: parseFloat(process.env.NEXT_PUBLIC_OFFICE_LNG || "106.8456") || 106.8456,
};

// Radius default 100 meter jika tidak diset
const ALLOWED_RADIUS = parseInt(
	process.env.NEXT_PUBLIC_ALLOWED_RADIUS || "100",
	10
);

// Import Map secara dinamis untuk menghindari error SSR
const Map = dynamic(() => import("./Map"), {
	ssr: false,
	loading: () => (
		<div className="flex items-center justify-center w-full h-[400px] bg-gray-100 rounded-lg">
			<div className="text-gray-500">Loading map...</div>
		</div>
	),
});

export default function LocationMap({ onLocationVerified }) {
	const [userLocation, setUserLocation] = useState(null);
	const [error, setError] = useState(null);
	const [distance, setDistance] = useState(null);
	const [isMapExpanded, setIsMapExpanded] = useState(false);

	useEffect(() => {
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(
				(position) => {
					const userLoc = {
						lat: position.coords.latitude,
						lng: position.coords.longitude,
					};
					setUserLocation(userLoc);

					// Hitung jarak
					const dist = getDistance(
						userLoc.lat,
						userLoc.lng,
						OFFICE_LOCATION.lat,
						OFFICE_LOCATION.lng
					);
					setDistance(dist);

					onLocationVerified(dist <= ALLOWED_RADIUS);
				},
				(err) => {
					setError("Gagal mendapatkan lokasi: " + err.message);
				}
			);
		} else {
			setError("Geolocation tidak didukung di browser ini");
		}
	}, [onLocationVerified]);

	// Fungsi untuk menghitung jarak antara dua titik koordinat
	function getDistance(lat1, lon1, lat2, lon2) {
		const R = 6371e3; // radius bumi dalam meter
		const φ1 = (lat1 * Math.PI) / 180;
		const φ2 = (lat2 * Math.PI) / 180;
		const Δφ = ((lat2 - lat1) * Math.PI) / 180;
		const Δλ = ((lon2 - lon1) * Math.PI) / 180;

		const a =
			Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
			Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

		return R * c; // jarak dalam meter
	}

	if (error) {
		return (
			<div className="p-4 text-red-500 bg-red-100 rounded-lg">{error}</div>
		);
	}

	return (
		<div className="relative">
			<button
				onClick={() => setIsMapExpanded(true)}
				className="absolute top-2 right-2 z-0 bg-white p-2 rounded-lg shadow-md hover:bg-gray-100"
				title="Perbesar peta"
			>
				<Maximize className="w-5 h-5" />
			</button>

			{/* <Map
				userLocation={userLocation}
				officeLocation={OFFICE_LOCATION}
				allowedRadius={ALLOWED_RADIUS}
				className="h-[400px] w-full rounded-lg"
				zoom={16}
			/> */}

			{distance !== null && (
				<div className="p-5 bg-blue-100 rounded-lg">
					<p className="text-blue-800">
						Jarak Anda dari kantor: {(distance / 1000).toFixed(2)} km
					</p>
					<p className="text-blue-800">
						Status:{" "}
						{distance <= ALLOWED_RADIUS ? (
							<span className="font-semibold text-green-600">
								Dalam radius yang diizinkan
							</span>
						) : (
							<span className="font-semibold text-red-600">
								Di luar radius yang diizinkan
							</span>
						)}
					</p>
				</div>
			)}

			{isMapExpanded && (
				<div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
					<div className="bg-white rounded-lg w-full max-w-4xl">
						<div className="flex justify-between items-center p-4 border-b">
							<h3 className="text-lg font-semibold">Detail Lokasi</h3>
							<button
								onClick={() => setIsMapExpanded(false)}
								className="text-gray-500 hover:text-gray-700"
							>
								<X className="w-6 h-6" />
							</button>
						</div>
						<div className="p-4">
							<Map
								userLocation={userLocation}
								officeLocation={OFFICE_LOCATION}
								allowedRadius={ALLOWED_RADIUS}
								className="w-full h-[70vh] rounded-lg"
								zoom={16}
							/>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
