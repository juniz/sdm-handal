"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	MapPin,
	Save,
	RefreshCw,
	Plus,
	Trash2,
	Edit,
	Globe,
	Target,
	Clock,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

// Simple Label component
const Label = ({ htmlFor, children, className = "" }) => (
	<label
		htmlFor={htmlFor}
		className={`text-sm font-medium leading-none ${className}`}
	>
		{children}
	</label>
);

// Simple toast hook
const useToast = () => {
	const toast = ({ title, description, variant }) => {
		if (variant === "destructive") {
			alert(`Error: ${title}\n${description}`);
		} else {
			alert(`${title}\n${description}`);
		}
	};
	return { toast };
};

export default function LocationSettings() {
	const [locations, setLocations] = useState([
		{
			id: 1,
			name: "Kantor Pusat",
			address: "Jl. Contoh No. 123, Jakarta",
			latitude: -6.2088,
			longitude: 106.8456,
			radius: 100,
			status: "active",
		},
		{
			id: 2,
			name: "Kantor Cabang Bandung",
			address: "Jl. Merdeka No. 45, Bandung",
			latitude: -6.9175,
			longitude: 107.6191,
			radius: 150,
			status: "active",
		},
	]);

	const [newLocation, setNewLocation] = useState({
		name: "",
		address: "",
		latitude: "",
		longitude: "",
		radius: 100,
	});

	const [editingLocation, setEditingLocation] = useState(null);
	const [isLoading, setIsLoading] = useState(false);
	const { toast } = useToast();

	const handleSaveLocation = async () => {
		if (!newLocation.name || !newLocation.address) {
			toast({
				title: "Error",
				description: "Nama dan alamat lokasi harus diisi",
				variant: "destructive",
			});
			return;
		}

		setIsLoading(true);
		try {
			// Simulate API call
			await new Promise((resolve) => setTimeout(resolve, 1000));

			const locationData = {
				id: Date.now(),
				...newLocation,
				latitude: parseFloat(newLocation.latitude) || 0,
				longitude: parseFloat(newLocation.longitude) || 0,
				status: "active",
			};

			setLocations([...locations, locationData]);
			setNewLocation({
				name: "",
				address: "",
				latitude: "",
				longitude: "",
				radius: 100,
			});

			toast({
				title: "Berhasil",
				description: "Lokasi berhasil ditambahkan",
			});
		} catch (error) {
			toast({
				title: "Error",
				description: "Gagal menambahkan lokasi",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleDeleteLocation = async (locationId) => {
		if (!confirm("Apakah Anda yakin ingin menghapus lokasi ini?")) return;

		setIsLoading(true);
		try {
			// Simulate API call
			await new Promise((resolve) => setTimeout(resolve, 500));

			setLocations(locations.filter((loc) => loc.id !== locationId));

			toast({
				title: "Berhasil",
				description: "Lokasi berhasil dihapus",
			});
		} catch (error) {
			toast({
				title: "Error",
				description: "Gagal menghapus lokasi",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const getCurrentLocation = () => {
		if (!navigator.geolocation) {
			toast({
				title: "Error",
				description: "Geolocation tidak didukung browser ini",
				variant: "destructive",
			});
			return;
		}

		setIsLoading(true);
		navigator.geolocation.getCurrentPosition(
			(position) => {
				setNewLocation({
					...newLocation,
					latitude: position.coords.latitude.toString(),
					longitude: position.coords.longitude.toString(),
				});
				toast({
					title: "Berhasil",
					description: "Koordinat lokasi saat ini berhasil didapatkan",
				});
				setIsLoading(false);
			},
			(error) => {
				toast({
					title: "Error",
					description: "Gagal mendapatkan koordinat lokasi",
					variant: "destructive",
				});
				setIsLoading(false);
			}
		);
	};

	return (
		<div className="container mx-auto p-6 space-y-6">
			<div className="flex items-center gap-3 mb-6">
				<div className="rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 p-2 text-white">
					<MapPin className="w-6 h-6" />
				</div>
				<div>
					<h1 className="text-2xl font-bold">Location Settings</h1>
					<p className="text-gray-600">
						Kelola pengaturan lokasi untuk presensi karyawan
					</p>
				</div>
			</div>

			{/* Statistics Cards */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<Card>
					<CardContent className="p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-gray-600">
									Total Lokasi
								</p>
								<p className="text-2xl font-bold">{locations.length}</p>
							</div>
							<Globe className="w-8 h-8 text-blue-500" />
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-gray-600">
									Lokasi Aktif
								</p>
								<p className="text-2xl font-bold text-green-600">
									{locations.filter((l) => l.status === "active").length}
								</p>
							</div>
							<Target className="w-8 h-8 text-green-500" />
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-gray-600">
									Rata-rata Radius
								</p>
								<p className="text-2xl font-bold">
									{Math.round(
										locations.reduce((sum, l) => sum + l.radius, 0) /
											locations.length || 0
									)}{" "}
									m
								</p>
							</div>
							<Clock className="w-8 h-8 text-orange-500" />
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Add New Location Form */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Plus className="w-5 h-5" />
						Tambah Lokasi Baru
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<Label htmlFor="locationName">Nama Lokasi</Label>
							<Input
								id="locationName"
								placeholder="Masukkan nama lokasi"
								value={newLocation.name}
								onChange={(e) =>
									setNewLocation({ ...newLocation, name: e.target.value })
								}
							/>
						</div>
						<div>
							<Label htmlFor="locationRadius">Radius (meter)</Label>
							<Input
								id="locationRadius"
								type="number"
								placeholder="100"
								value={newLocation.radius}
								onChange={(e) =>
									setNewLocation({
										...newLocation,
										radius: parseInt(e.target.value) || 100,
									})
								}
							/>
						</div>
					</div>

					<div>
						<Label htmlFor="locationAddress">Alamat</Label>
						<Textarea
							id="locationAddress"
							placeholder="Masukkan alamat lengkap"
							value={newLocation.address}
							onChange={(e) =>
								setNewLocation({ ...newLocation, address: e.target.value })
							}
						/>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<Label htmlFor="latitude">Latitude</Label>
							<Input
								id="latitude"
								type="number"
								step="any"
								placeholder="-6.2088"
								value={newLocation.latitude}
								onChange={(e) =>
									setNewLocation({
										...newLocation,
										latitude: e.target.value,
									})
								}
							/>
						</div>
						<div>
							<Label htmlFor="longitude">Longitude</Label>
							<Input
								id="longitude"
								type="number"
								step="any"
								placeholder="106.8456"
								value={newLocation.longitude}
								onChange={(e) =>
									setNewLocation({
										...newLocation,
										longitude: e.target.value,
									})
								}
							/>
						</div>
					</div>

					<div className="flex gap-2">
						<Button
							onClick={getCurrentLocation}
							variant="outline"
							disabled={isLoading}
						>
							{isLoading ? (
								<RefreshCw className="w-4 h-4 mr-2 animate-spin" />
							) : (
								<Target className="w-4 h-4 mr-2" />
							)}
							Gunakan Lokasi Saat Ini
						</Button>
						<Button onClick={handleSaveLocation} disabled={isLoading}>
							{isLoading ? (
								<RefreshCw className="w-4 h-4 mr-2 animate-spin" />
							) : (
								<Save className="w-4 h-4 mr-2" />
							)}
							Simpan Lokasi
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* Existing Locations */}
			<Card>
				<CardHeader>
					<CardTitle>Daftar Lokasi</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{locations.map((location) => (
							<div
								key={location.id}
								className="border rounded-lg p-4 hover:bg-gray-50"
							>
								<div className="flex justify-between items-start">
									<div className="flex-1">
										<h3 className="font-semibold text-lg">{location.name}</h3>
										<p className="text-gray-600 text-sm mb-2">
											{location.address}
										</p>
										<div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
											<div>
												<span className="text-gray-500">Latitude:</span>
												<p className="font-medium">{location.latitude}</p>
											</div>
											<div>
												<span className="text-gray-500">Longitude:</span>
												<p className="font-medium">{location.longitude}</p>
											</div>
											<div>
												<span className="text-gray-500">Radius:</span>
												<p className="font-medium">{location.radius}m</p>
											</div>
											<div>
												<span className="text-gray-500">Status:</span>
												<p
													className={`font-medium ${
														location.status === "active"
															? "text-green-600"
															: "text-red-600"
													}`}
												>
													{location.status === "active" ? "Aktif" : "Nonaktif"}
												</p>
											</div>
										</div>
									</div>
									<div className="flex gap-2 ml-4">
										<Button
											variant="outline"
											size="sm"
											onClick={() => setEditingLocation(location)}
										>
											<Edit className="w-4 h-4" />
										</Button>
										<Button
											variant="outline"
											size="sm"
											onClick={() => handleDeleteLocation(location.id)}
											className="text-red-600 hover:text-red-700"
										>
											<Trash2 className="w-4 h-4" />
										</Button>
									</div>
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
