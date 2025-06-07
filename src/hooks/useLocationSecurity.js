import { useState, useEffect, useRef, useCallback } from "react";

const useLocationSecurity = (options = {}) => {
	const {
		enableHighAccuracy = true,
		timeout = 15000,
		maximumAge = 30000,
		watchInterval = 5000,
		mockLocationThreshold = 10, // meter
		speedThreshold = 100, // km/h - detect unrealistic speed
		accuracyThreshold = 50, // meter
	} = options;

	const [currentLocation, setCurrentLocation] = useState(null);
	const [locationHistory, setLocationHistory] = useState([]);
	const [isLocationValid, setIsLocationValid] = useState(false);
	const [securityStatus, setSecurityStatus] = useState({
		isMockLocation: false,
		isUnrealisticSpeed: false,
		isLowAccuracy: false,
		isLocationSpoofed: false,
		confidence: 0,
		warnings: [],
	});
	const [isWatching, setIsWatching] = useState(false);
	const [error, setError] = useState(null);

	const watchIdRef = useRef(null);
	const lastLocationRef = useRef(null);
	const locationHistoryRef = useRef([]);

	// Office coordinates (should be from environment variables)
	const OFFICE_COORDS = {
		latitude: parseFloat(process.env.NEXT_PUBLIC_OFFICE_LAT || "-7.9797"),
		longitude: parseFloat(process.env.NEXT_PUBLIC_OFFICE_LNG || "112.6304"),
		radius: parseFloat(process.env.NEXT_PUBLIC_ALLOWED_RADIUS || "500"), // meters
	};

	// Calculate distance between two coordinates
	const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
		const R = 6371e3; // Earth's radius in meters
		const φ1 = (lat1 * Math.PI) / 180;
		const φ2 = (lat2 * Math.PI) / 180;
		const Δφ = ((lat2 - lat1) * Math.PI) / 180;
		const Δλ = ((lon2 - lon1) * Math.PI) / 180;

		const a =
			Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
			Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

		return R * c; // Distance in meters
	}, []);

	// Calculate speed between two points
	const calculateSpeed = useCallback(
		(location1, location2) => {
			if (!location1 || !location2) return 0;

			const distance = calculateDistance(
				location1.latitude,
				location1.longitude,
				location2.latitude,
				location2.longitude
			);

			const timeDiff = (location2.timestamp - location1.timestamp) / 1000; // seconds
			if (timeDiff <= 0) return 0;

			const speed = (distance / timeDiff) * 3.6; // km/h
			return speed;
		},
		[calculateDistance]
	);

	// Detect mock/fake location
	const detectMockLocation = useCallback(
		(position) => {
			const warnings = [];
			let confidence = 100;
			let isMockLocation = false;
			let isUnrealisticSpeed = false;
			let isLowAccuracy = false;

			// Check 1: GPS accuracy
			if (position.coords.accuracy > accuracyThreshold) {
				warnings.push(
					`Akurasi GPS rendah: ${Math.round(position.coords.accuracy)}m`
				);
				isLowAccuracy = true;
				confidence -= 20;
			}

			// Check 2: Mock location detection (Android/iOS specific)
			if (navigator.geolocation.watchPosition.toString().includes("mock")) {
				warnings.push("Terdeteksi mock location app");
				isMockLocation = true;
				confidence -= 40;
			}

			// Check 3: Movement pattern analysis
			const lastLocation = lastLocationRef.current;
			if (lastLocation) {
				const speed = calculateSpeed(lastLocation, {
					latitude: position.coords.latitude,
					longitude: position.coords.longitude,
					timestamp: Date.now(),
				});

				if (speed > speedThreshold) {
					warnings.push(`Kecepatan tidak realistis: ${Math.round(speed)} km/h`);
					isUnrealisticSpeed = true;
					confidence -= 30;
				}

				// Check for instant location jumps
				const distance = calculateDistance(
					lastLocation.latitude,
					lastLocation.longitude,
					position.coords.latitude,
					position.coords.longitude
				);

				const timeDiff = (Date.now() - lastLocation.timestamp) / 1000;
				if (distance > mockLocationThreshold && timeDiff < 2) {
					warnings.push("Terdeteksi perpindahan lokasi yang tidak natural");
					isMockLocation = true;
					confidence -= 35;
				}
			}

			// Check 4: Altitude consistency (if available)
			if (
				position.coords.altitude !== null &&
				position.coords.altitude < -100
			) {
				warnings.push("Altitude tidak valid");
				confidence -= 15;
			}

			// Check 5: Location history pattern
			const history = locationHistoryRef.current;
			if (history.length >= 3) {
				const variations = history.slice(-3).map((loc, index, arr) => {
					if (index === 0) return 0;
					return calculateDistance(
						arr[index - 1].latitude,
						arr[index - 1].longitude,
						loc.latitude,
						loc.longitude
					);
				});

				const avgVariation =
					variations.reduce((a, b) => a + b, 0) / variations.length;
				if (avgVariation > 50) {
					warnings.push("Pola pergerakan mencurigakan");
					confidence -= 25;
				}
			}

			// Check 6: Time-based verification
			const now = new Date();
			const positionTime = new Date(position.timestamp);
			const timeDrift = Math.abs(now.getTime() - positionTime.getTime());

			if (timeDrift > 30000) {
				// 30 seconds
				warnings.push("Timestamp lokasi tidak sesuai");
				confidence -= 20;
			}

			return {
				isMockLocation,
				isUnrealisticSpeed,
				isLowAccuracy,
				isLocationSpoofed: confidence < 50,
				confidence: Math.max(0, confidence),
				warnings,
			};
		},
		[
			calculateSpeed,
			calculateDistance,
			speedThreshold,
			accuracyThreshold,
			mockLocationThreshold,
		]
	);

	// Check if location is within office radius
	const checkOfficeRadius = useCallback(
		(latitude, longitude) => {
			const distance = calculateDistance(
				latitude,
				longitude,
				OFFICE_COORDS.latitude,
				OFFICE_COORDS.longitude
			);
			return distance <= OFFICE_COORDS.radius;
		},
		[calculateDistance]
	);

	// Process new location
	const processLocation = useCallback(
		(position) => {
			const newLocation = {
				latitude: position.coords.latitude,
				longitude: position.coords.longitude,
				accuracy: position.coords.accuracy,
				altitude: position.coords.altitude,
				heading: position.coords.heading,
				speed: position.coords.speed,
				timestamp: Date.now(),
			};

			// Security checks
			const securityResult = detectMockLocation(position);
			setSecurityStatus(securityResult);

			// Check office radius
			const withinOffice = checkOfficeRadius(
				newLocation.latitude,
				newLocation.longitude
			);
			setIsLocationValid(withinOffice && securityResult.confidence > 60);

			// Update location history
			const newHistory = [...locationHistoryRef.current, newLocation].slice(
				-10
			); // Keep last 10 locations
			locationHistoryRef.current = newHistory;
			setLocationHistory(newHistory);

			// Update current location
			setCurrentLocation(newLocation);
			lastLocationRef.current = newLocation;

			setError(null);
		},
		[detectMockLocation, checkOfficeRadius]
	);

	// Start watching location
	const startWatching = useCallback(() => {
		if (!navigator.geolocation) {
			setError("Geolocation tidak didukung di perangkat ini");
			return;
		}

		if (watchIdRef.current) {
			navigator.geolocation.clearWatch(watchIdRef.current);
		}

		const watchOptions = {
			enableHighAccuracy,
			timeout,
			maximumAge,
		};

		watchIdRef.current = navigator.geolocation.watchPosition(
			processLocation,
			(error) => {
				console.error("Location error:", error);
				setError(`Error: ${error.message}`);
			},
			watchOptions
		);

		setIsWatching(true);
	}, [processLocation]);

	// Stop watching location
	const stopWatching = useCallback(() => {
		if (watchIdRef.current) {
			navigator.geolocation.clearWatch(watchIdRef.current);
			watchIdRef.current = null;
		}
		setIsWatching(false);
	}, []);

	// Get current location once
	const getCurrentLocation = useCallback(() => {
		return new Promise((resolve, reject) => {
			if (!navigator.geolocation) {
				reject(new Error("Geolocation tidak didukung"));
				return;
			}

			navigator.geolocation.getCurrentPosition(
				(position) => {
					processLocation(position);
					resolve(position);
				},
				(error) => {
					setError(`Error: ${error.message}`);
					reject(error);
				},
				{
					enableHighAccuracy,
					timeout,
					maximumAge,
				}
			);
		});
	}, [processLocation]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (watchIdRef.current) {
				navigator.geolocation.clearWatch(watchIdRef.current);
				watchIdRef.current = null;
			}
		};
	}, []);

	return {
		currentLocation,
		locationHistory,
		isLocationValid,
		securityStatus,
		isWatching,
		error,
		startWatching,
		stopWatching,
		getCurrentLocation,
		officeCoords: OFFICE_COORDS,
		distanceFromOffice: currentLocation
			? calculateDistance(
					currentLocation.latitude,
					currentLocation.longitude,
					OFFICE_COORDS.latitude,
					OFFICE_COORDS.longitude
			  )
			: null,
	};
};

export default useLocationSecurity;
