"use client";

import { useState, useEffect } from "react";
import {
	Menu,
	X,
	Home,
	User,
	Calendar,
	FileText,
	LogOut,
	Ticket,
	UserCheck,
	AlertTriangle,
	CreditCard,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { LogoutConfirmationModal } from "@/components/LogoutConfirmationModal";
import { Suspense } from "react";
import { UserProfile } from "@/components/UserProfile";
import { BottomNavigation } from "@/components/BottomNavigation";
import {
	NotificationBell,
	FloatingNotification,
} from "@/components/notifications";
import { removeClientToken } from "@/lib/client-auth";

// Loading fallback untuk UserProfile
function UserProfileSkeleton() {
	return (
		<div className="flex items-center space-x-4">
			<div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
			<div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
		</div>
	);
}

export default function DashboardLayout({ children }) {
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);
	const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
	const [userRole, setUserRole] = useState(null);
	const pathname = usePathname();
	const router = useRouter();

	// Check user role
	useEffect(() => {
		const checkUserRole = async () => {
			try {
				const response = await fetch("/api/auth/me");
				if (response.ok) {
					const userData = await response.json();
					setUserRole(userData.jabatan);
				}
			} catch (error) {
				console.error("Error checking user role:", error);
			}
		};
		checkUserRole();
	}, []);

	// Base menu items untuk semua user
	const baseMenuItems = [
		{ icon: Home, label: "Dashboard", href: "/dashboard" },
		{ icon: User, label: "Profil", href: "/dashboard/profile" },
		{ icon: Calendar, label: "Presensi", href: "/dashboard/attendance" },
		{ icon: Calendar, label: "Jadwal", href: "/dashboard/schedule" },
		{ icon: Ticket, label: "Ticket IT", href: "/dashboard/ticket" },
		{
			icon: UserCheck,
			label: "Assignment IT",
			href: "/dashboard/ticket-assignment",
		},
		{
			icon: CreditCard,
			label: "Pengajuan KTA",
			href: "/dashboard/pengajuan-kta",
		},
		{ icon: FileText, label: "Laporan", href: "/dashboard/reports" },
	];

	// Admin menu items
	const adminMenuItems = [
		{
			icon: AlertTriangle,
			label: "Error Logs",
			href: "/dashboard/admin/error-logs",
		},
	];

	// Combine menu items berdasarkan role
	const menuItems = userRole?.includes("Admin")
		? [...baseMenuItems, ...adminMenuItems]
		: baseMenuItems;

	const handleLogout = async () => {
		try {
			const response = await fetch("/api/auth/logout", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
			});

			if (!response.ok) {
				throw new Error("Logout failed");
			}

			removeClientToken();
			router.replace("/");
			router.refresh();
		} catch (error) {
			console.error("Error during logout:", error);
		}
	};

	return (
		<div className="min-h-screen bg-gray-100">
			{/* Floating Notification for Mobile */}
			<FloatingNotification />

			{/* Sidebar - hidden on mobile */}
			<aside
				className={`fixed top-0 left-0 z-40 w-64 h-screen transition-transform hidden md:block ${
					isSidebarOpen ? "translate-x-0" : "-translate-x-full"
				}`}
			>
				<div className="h-full px-3 py-4 overflow-y-auto bg-blue-600">
					<div className="flex items-center justify-between mb-6 px-2">
						<h2 className="text-2xl font-semibold text-white">SDM Handal</h2>
						<button
							onClick={() => setIsSidebarOpen(false)}
							className="lg:hidden text-white"
						>
							<X className="h-6 w-6" />
						</button>
					</div>
					<ul className="space-y-2">
						{menuItems.map((item) => {
							const Icon = item.icon;
							const isActive = pathname === item.href;
							return (
								<li key={item.href}>
									<Link
										href={item.href}
										className={`flex items-center p-2 rounded-lg hover:bg-blue-700 group ${
											isActive ? "bg-blue-700" : ""
										}`}
									>
										<Icon className="w-5 h-5 text-white transition duration-75" />
										<span className="ml-3 text-white">{item.label}</span>
									</Link>
								</li>
							);
						})}
						<li>
							<button
								onClick={() => setIsLogoutModalOpen(true)}
								className="flex w-full items-center p-2 rounded-lg text-white hover:bg-blue-700 group"
							>
								<LogOut className="w-5 h-5 transition duration-75" />
								<span className="ml-3">Keluar</span>
							</button>
						</li>
					</ul>
				</div>
			</aside>

			{/* Main content - adjusted padding for mobile */}
			<div
				className={`${
					isSidebarOpen ? "md:ml-64" : ""
				} transition-margin duration-300 pb-20 md:pb-4`}
			>
				{/* Top bar - hidden on mobile */}
				<div className="hidden md:block mb-4 bg-white p-4 rounded-lg shadow-sm">
					<div className="flex justify-between items-center">
						<button
							onClick={() => setIsSidebarOpen(!isSidebarOpen)}
							className="text-gray-600 hover:text-gray-900"
						>
							<Menu className="h-6 w-6" />
						</button>
						<div className="flex items-center gap-4">
							<NotificationBell />
							<Suspense fallback={<UserProfileSkeleton />}>
								<UserProfile />
							</Suspense>
						</div>
					</div>
				</div>

				{/* Page content */}
				<main className="bg-white rounded-lg shadow-sm p-0 mt-0 md:mt-0">
					{children}
				</main>
			</div>

			{/* Bottom Navigation - visible only on mobile */}
			<BottomNavigation />

			{/* Logout Confirmation Modal */}
			<LogoutConfirmationModal
				isOpen={isLogoutModalOpen}
				onClose={() => setIsLogoutModalOpen(false)}
				onConfirm={handleLogout}
			/>
		</div>
	);
}
