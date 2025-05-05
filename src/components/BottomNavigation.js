"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Clock, UserCircle, Menu } from "lucide-react";

export function BottomNavigation() {
	const pathname = usePathname();

	const isActive = (path) => {
		return pathname === path;
	};

	return (
		<div className="fixed bottom-0 left-0 right-0 bg-white border-t md:hidden">
			<div className="flex justify-around items-center h-16">
				<Link
					href="/dashboard"
					className={`flex flex-col items-center ${
						isActive("/dashboard") ? "text-blue-600" : "text-gray-600"
					}`}
				>
					<Home className="w-6 h-6" />
					<span className="text-xs mt-1">Home</span>
				</Link>

				<Link
					href="/dashboard/attendance"
					className={`flex flex-col items-center ${
						isActive("/dashboard/attendance")
							? "text-blue-600"
							: "text-gray-600"
					}`}
				>
					<Clock className="w-6 h-6" />
					<span className="text-xs mt-1">Presensi</span>
				</Link>

				<Link
					href="/dashboard/profile"
					className={`flex flex-col items-center ${
						isActive("/dashboard/profile") ? "text-blue-600" : "text-gray-600"
					}`}
				>
					<UserCircle className="w-6 h-6" />
					<span className="text-xs mt-1">Profil</span>
				</Link>

				<Link
					href="/dashboard/menu"
					className={`flex flex-col items-center ${
						isActive("/dashboard/menu") ? "text-blue-600" : "text-gray-600"
					}`}
				>
					<Menu className="w-6 h-6" />
					<span className="text-xs mt-1">Menu</span>
				</Link>
			</div>
		</div>
	);
}
