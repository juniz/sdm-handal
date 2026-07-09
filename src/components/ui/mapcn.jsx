"use client";

import {
	createContext,
	forwardRef,
	useCallback,
	useContext,
	useEffect,
	useId,
	useImperativeHandle,
	useMemo,
	useRef,
	useState,
} from "react";
import { createPortal } from "react-dom";
import MapLibreGL from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { X, Minus, Plus, Locate } from "lucide-react";
import { cn } from "@/lib/utils";

const defaultStyles = {
	dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
	light: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
};

const blankMapStyle = {
	version: 8,
	sources: {},
	layers: [
		{
			id: "background",
			type: "background",
			paint: { "background-color": "rgba(0, 0, 0, 0)" },
		},
	],
};

const MapContext = createContext(null);

export function useMap() {
	const context = useContext(MapContext);
	if (!context) {
		throw new Error("useMap must be used within a Map component");
	}
	return context;
}

function getViewport(map) {
	const center = map.getCenter();
	return {
		center: [center.lng, center.lat],
		zoom: map.getZoom(),
		bearing: map.getBearing(),
		pitch: map.getPitch(),
	};
}

export const Map = forwardRef(function Map(
	{
		children,
		className,
		theme: themeProp,
		styles,
		blank = false,
		projection,
		viewport,
		onViewportChange,
		loading = false,
		...props
	},
	ref
) {
	const containerRef = useRef(null);
	const [mapInstance, setMapInstance] = useState(null);
	const [isLoaded, setIsLoaded] = useState(false);
	const [isStyleLoaded, setIsStyleLoaded] = useState(false);
	const currentStyleRef = useRef(null);
	const styleTimeoutRef = useRef(null);
	const internalUpdateRef = useRef(false);
	const resolvedTheme = themeProp || "light";

	const isControlled = viewport !== undefined && onViewportChange !== undefined;

	const onViewportChangeRef = useRef(onViewportChange);
	onViewportChangeRef.current = onViewportChange;

	const mapStyles = useMemo(() => {
		if (styles) {
			return {
				dark: styles.dark ?? defaultStyles.dark,
				light: styles.light ?? defaultStyles.light,
			};
		}
		if (blank) {
			return { dark: blankMapStyle, light: blankMapStyle };
		}
		return defaultStyles;
	}, [styles, blank]);

	useImperativeHandle(ref, () => mapInstance, [mapInstance]);

	const clearStyleTimeout = useCallback(() => {
		if (styleTimeoutRef.current) {
			clearTimeout(styleTimeoutRef.current);
			styleTimeoutRef.current = null;
		}
	}, []);

	useEffect(() => {
		if (!containerRef.current) return;

		const initialStyle =
			resolvedTheme === "dark" ? mapStyles.dark : mapStyles.light;
		currentStyleRef.current = initialStyle;

		const map = new MapLibreGL.Map({
			container: containerRef.current,
			style: initialStyle,
			renderWorldCopies: false,
			attributionControl: {
				compact: true,
			},
			...props,
			...viewport,
		});

		const styleDataHandler = () => {
			clearStyleTimeout();
			styleTimeoutRef.current = setTimeout(() => {
				setIsStyleLoaded(true);
				if (projection) {
					map.setProjection(projection);
				}
			}, 100);
		};
		const loadHandler = () => setIsLoaded(true);

		const handleMove = () => {
			if (internalUpdateRef.current) return;
			onViewportChangeRef.current?.(getViewport(map));
		};

		map.on("load", loadHandler);
		map.on("styledata", styleDataHandler);
		map.on("move", handleMove);
		setMapInstance(map);

		return () => {
			clearStyleTimeout();
			map.off("load", loadHandler);
			map.off("styledata", styleDataHandler);
			map.off("move", handleMove);
			map.remove();
			setIsLoaded(false);
			setIsStyleLoaded(false);
			setMapInstance(null);
		};
	}, []);

	useEffect(() => {
		if (!mapInstance || !isControlled || !viewport) return;
		if (mapInstance.isMoving()) return;

		const current = getViewport(mapInstance);
		const next = {
			center: viewport.center ?? current.center,
			zoom: viewport.zoom ?? current.zoom,
			bearing: viewport.bearing ?? current.bearing,
			pitch: viewport.pitch ?? current.pitch,
		};

		if (
			next.center[0] === current.center[0] &&
			next.center[1] === current.center[1] &&
			next.zoom === current.zoom &&
			next.bearing === current.bearing &&
			next.pitch === current.pitch
		) {
			return;
		}

		internalUpdateRef.current = true;
		mapInstance.jumpTo(next);
		internalUpdateRef.current = false;
	}, [mapInstance, isControlled, viewport]);

	useEffect(() => {
		if (!mapInstance || !resolvedTheme) return;

		const newStyle =
			resolvedTheme === "dark" ? mapStyles.dark : mapStyles.light;

		if (currentStyleRef.current === newStyle) return;

		clearStyleTimeout();
		currentStyleRef.current = newStyle;
		setIsStyleLoaded(false);

		mapInstance.setStyle(newStyle, { diff: true });
	}, [mapInstance, resolvedTheme, mapStyles, clearStyleTimeout]);

	const contextValue = useMemo(
		() => ({
			map: mapInstance,
			isLoaded: isLoaded && isStyleLoaded,
			resolvedTheme,
		}),
		[mapInstance, isLoaded, isStyleLoaded, resolvedTheme]
	);

	return (
		<MapContext.Provider value={contextValue}>
			<div
				ref={containerRef}
				className={cn("relative h-full w-full", className)}
			>
				{(!isLoaded || loading) && (
					<div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-100/50 backdrop-blur-xs">
						<span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse"></span>
						<span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse ml-1"></span>
						<span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse ml-1"></span>
					</div>
				)}
				{mapInstance && children}
			</div>
		</MapContext.Provider>
	);
});

const MarkerContext = createContext(null);

export function MapMarker({
	longitude,
	latitude,
	children,
	onClick,
	onMouseEnter,
	onMouseLeave,
	onDragStart,
	onDrag,
	onDragEnd,
	draggable = false,
	...markerOptions
}) {
	const { map } = useMap();
	const [element] = useState(() => {
		const el = document.createElement("div");
		el.className = "mapcn-marker-container animate-bounce duration-500";
		return el;
	});
	const [marker, setMarker] = useState(null);

	const callbacksRef = useRef({
		onClick,
		onMouseEnter,
		onMouseLeave,
		onDragStart,
		onDrag,
		onDragEnd,
	});
	callbacksRef.current = {
		onClick,
		onMouseEnter,
		onMouseLeave,
		onDragStart,
		onDrag,
		onDragEnd,
	};

	useEffect(() => {
		if (!map) return;

		const m = new MapLibreGL.Marker({
			...markerOptions,
			element,
			draggable,
		})
			.setLngLat([longitude, latitude])
			.addTo(map);

		setMarker(m);

		const handleClick = (e) => callbacksRef.current.onClick?.(e);
		const handleMouseEnter = (e) => callbacksRef.current.onMouseEnter?.(e);
		const handleMouseLeave = (e) => callbacksRef.current.onMouseLeave?.(e);

		element.addEventListener("click", handleClick);
		element.addEventListener("mouseenter", handleMouseEnter);
		element.addEventListener("mouseleave", handleMouseLeave);

		const handleDragStart = () => {
			const lngLat = m.getLngLat();
			callbacksRef.current.onDragStart?.({ lng: lngLat.lng, lat: lngLat.lat });
		};
		const handleDrag = () => {
			const lngLat = m.getLngLat();
			callbacksRef.current.onDrag?.({ lng: lngLat.lng, lat: lngLat.lat });
		};
		const handleDragEnd = () => {
			const lngLat = m.getLngLat();
			callbacksRef.current.onDragEnd?.({ lng: lngLat.lng, lat: lngLat.lat });
		};

		if (draggable) {
			m.on("dragstart", handleDragStart);
			m.on("drag", handleDrag);
			m.on("dragend", handleDragEnd);
		}

		return () => {
			element.removeEventListener("click", handleClick);
			element.removeEventListener("mouseenter", handleMouseEnter);
			element.removeEventListener("mouseleave", handleMouseLeave);
			m.remove();
			setMarker(null);
		};
	}, [map, longitude, latitude, draggable]);

	return (
		<MarkerContext.Provider value={{ marker, map }}>
			{marker && createPortal(children, element)}
		</MarkerContext.Provider>
	);
}

export function MarkerContent({ children, className }) {
	return <div className={cn("relative flex items-center justify-center", className)}>{children}</div>;
}

export function MarkerTooltip({ children, className }) {
	return (
		<div className={cn("absolute bg-slate-900/90 text-white text-xs px-2.5 py-1 rounded shadow-md pointer-events-none -translate-y-full mb-10 whitespace-nowrap z-50 transition-all font-semibold font-figtree border border-slate-700/50", className)}>
			{children}
		</div>
	);
}
