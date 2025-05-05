"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMap } from "react-leaflet";
import L from "leaflet";

// Fix untuk icon marker
const icon = L.icon({
	iconUrl: "/marker-icon.png",
	iconSize: [25, 41],
	iconAnchor: [12, 41],
});

// Komponen untuk mengatur center map
function SetViewOnClick({ coords }) {
	const map = useMap();
	useEffect(() => {
		map.setView(coords, map.getZoom());
	}, [coords, map]);
	return null;
}

export default function Map({
	userLocation,
	officeLocation,
	allowedRadius,
	className,
	zoom,
}) {
	return (
		<MapContainer
			center={[officeLocation.lat, officeLocation.lng]}
			zoom={zoom}
			className={className}
		>
			<TileLayer
				attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
				url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
			/>

			<SetViewOnClick coords={[officeLocation.lat, officeLocation.lng]} />

			<Marker position={[officeLocation.lat, officeLocation.lng]} icon={icon} />

			<Circle
				center={[officeLocation.lat, officeLocation.lng]}
				radius={allowedRadius}
				pathOptions={{
					fillColor: "#3b82f6",
					fillOpacity: 0.1,
					color: "#3b82f6",
					opacity: 0.8,
					weight: 2,
				}}
			/>

			{userLocation && (
				<Marker position={[userLocation.lat, userLocation.lng]} icon={icon} />
			)}
		</MapContainer>
	);
}
