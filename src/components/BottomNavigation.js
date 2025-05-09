"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
	Home,
	UserCircle,
	History,
	CameraIcon,
	CalendarRange,
} from "lucide-react";

// Menu items untuk bottom navigation
const menuItems = [
	{
		href: "/dashboard",
		icon: Home,
		label: "Home",
	},
	{
		href: "/dashboard/schedule",
		icon: CalendarRange,
		label: "Jadwal",
	},
	{
		href: "/dashboard/attendance",
		icon: CameraIcon,
		label: "Presensi",
		isMain: true,
	},
	{
		href: "/dashboard/attendance/history",
		icon: History,
		label: "Riwayat",
	},
	{
		href: "/dashboard/profile",
		icon: UserCircle,
		label: "Profile",
	},
];

export function BottomNavigation() {
	const pathname = usePathname();

	const isActive = (path) => {
		return pathname === path;
	};

	return (
		<div className="fixed bottom-2 left-4 right-4 md:hidden">
			{/* Container dengan efek glass morphism */}
			<div className="relative bg-white/80 backdrop-blur-lg rounded-full shadow-lg border border-white/20">
				<div className="flex justify-around items-center h-16 px-4">
					{menuItems.map((item) =>
						item.isMain ? (
							<div key={item.href} className="relative -mt-8">
								<Link
									href={item.href}
									className={`flex flex-col items-center justify-center w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-all duration-300 ${
										isActive(item.href) ? "bg-blue-700" : ""
									}`}
								>
									<item.icon className="w-7 h-7" strokeWidth={2.5} />
								</Link>
							</div>
						) : (
							<Link
								key={item.href}
								href={item.href}
								className={`flex flex-col items-center transition-colors duration-300 px-3 ${
									isActive(item.href)
										? "text-blue-600"
										: "text-gray-500 hover:text-blue-500"
								}`}
							>
								<item.icon
									className={`w-6 h-6 ${
										isActive(item.href) ? "stroke-[2.5px]" : "stroke-[2px]"
									}`}
								/>
								<span
									className={`text-xs mt-1 ${
										isActive(item.href) ? "font-medium" : ""
									}`}
								>
									{item.label}
								</span>
							</Link>
						)
					)}
				</div>
			</div>
		</div>
	);
}
