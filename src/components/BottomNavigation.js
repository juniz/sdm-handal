"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Clock, UserCircle, Menu, Calendar } from "lucide-react";

const menuItems = [
	{
		href: "/dashboard",
		icon: Home,
		label: "Home",
	},
	{
		href: "/dashboard/attendance",
		icon: Clock,
		label: "Presensi",
	},
	{
		href: "/dashboard/schedule",
		icon: Calendar,
		label: "Jadwal",
	},
	{
		href: "/dashboard/profile",
		icon: UserCircle,
		label: "Profil",
	},
];

export function BottomNavigation() {
	const pathname = usePathname();

	const isActive = (path) => {
		return pathname === path;
	};

	return (
		<div className="fixed bottom-0 left-0 right-0 bg-white border-t md:hidden">
			<div className="flex justify-around items-center h-16">
				{menuItems.map((item) => (
					<Link
						key={item.href}
						href={item.href}
						className={`flex flex-col items-center ${
							isActive(item.href) ? "text-blue-600" : "text-gray-600"
						}`}
					>
						<item.icon className="w-6 h-6" />
						<span className="text-xs mt-1">{item.label}</span>
					</Link>
				))}
			</div>
		</div>
	);
}
