"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Building2, Calendar, Home, User } from "lucide-react";
import { useUser } from "@/hooks/useUser";

export function EmployeeCard() {
	const [imageError, setImageError] = useState(false);
	const { user, error, isLoading } = useUser();

	const userContent = useMemo(() => {
		if (!user) return null;

		return (
			<div className="flex items-start gap-4">
				<div className="relative w-20 h-30 items-center justify-center rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
					{user.photo && !imageError ? (
						<Image
							src={user.photo}
							alt={user.nama}
							fill
							className="object-cover"
							onError={() => setImageError(true)}
							sizes="80px"
							priority
						/>
					) : (
						<div className="w-full h-full flex items-center justify-center bg-gray-100">
							<User className="w-12 h-12 text-gray-400" />
						</div>
					)}
				</div>
				<div className="flex-1 min-w-0">
					<h2 className="text-lg font-bold text-gray-900 leading-tight mb-1">
						{user.nama}
					</h2>
					<p className="text-gray-600 mb-3">{user.departemen}</p>
					<div className="space-y-2">
						<div className="flex items-center text-sm text-gray-600">
							<Building2 className="w-4 h-4 mr-2 flex-shrink-0 text-gray-400" />
							<span>NIP: {user.username}</span>
						</div>
						<div className="flex items-center text-sm text-gray-600">
							<Calendar className="w-4 h-4 mr-2 flex-shrink-0 text-gray-400" />
							<span>
								{user.tmp_lahir}
								{user.formattedBirthDate && `, ${user.formattedBirthDate}`}
							</span>
						</div>
						<div className="flex items-center text-sm text-gray-600">
							<Home className="w-4 h-4 mr-2 flex-shrink-0 text-gray-400" />
							<span className="truncate">{user.alamat}</span>
						</div>
					</div>
				</div>
			</div>
		);
	}, [user, imageError]);

	if (isLoading) {
		return (
			<Card className="p-4">
				<div className="flex items-center justify-center h-32">
					<div className="flex flex-col items-center gap-2">
						<div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
						<p className="text-gray-500">Memuat data pegawai...</p>
					</div>
				</div>
			</Card>
		);
	}

	if (error || !user) {
		return (
			<Card className="p-4">
				<div className="flex items-center justify-center h-32">
					<div className="flex flex-col items-center gap-2 text-center">
						<User className="w-8 h-8 text-gray-400" />
						<p className="text-gray-500">
							{error || "Data pegawai tidak ditemukan"}
						</p>
					</div>
				</div>
			</Card>
		);
	}

	return <Card className="p-5 bg-white">{userContent}</Card>;
}
