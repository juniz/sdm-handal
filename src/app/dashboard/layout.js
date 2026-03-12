"use client";

import { useState, useEffect, Suspense } from "react";
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
	RefreshCcw,
	Users,
	UserCog,
	DollarSign,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { LogoutConfirmationModal } from "@/components/LogoutConfirmationModal";
import { UserProfile } from "@/components/UserProfile";
import { BottomNavigation } from "@/components/BottomNavigation";
import {
	NotificationBell,
	FloatingNotification,
} from "@/components/notifications";
import { removeClientToken } from "@/lib/client-auth";
import adminType from "@/types/adminType";

// Loading fallback untuk UserProfile
function UserProfileSkeleton() {
	return (
		<div className="flex items-center space-x-4">
			<div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
			<div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
		</div>
	);
}

/**
 * Konfigurasi Menu Dashboard
 * Menggunakan prinsip DRY dan konfigurasi terpusat.
 * Struktur menu dibagi menjadi grup untuk meningkatkan keterbacaan dan organisasi.
 */
const MENU_CONFIG = [
	{
		label: "Menu Utama",
		items: [
			{ icon: Home, label: "Dashboard", href: "/dashboard" },
			{ icon: User, label: "Profil", href: "/dashboard/profile" },
			{ icon: Calendar, label: "Presensi", href: "/dashboard/attendance" },
			{ icon: Calendar, label: "Jadwal", href: "/dashboard/schedule" },
		],
	},
	{
		label: "Administrasi",
		// Hanya tampil jika environment variable MENU_ADMIN aktif ("true")
		visible: process.env.NEXT_PUBLIC_MENU_ADMIN === "true",
		items: [
			{ icon: Ticket, label: "Ticket IT", href: "/dashboard/ticket" },
			{
				icon: UserCheck,
				label: "Assignment IT",
				href: "/dashboard/ticket-assignment",
			},
			{
				icon: FileText,
				label: "Pengajuan Development",
				href: "/dashboard/development",
			},
			{
				icon: CreditCard,
				label: "Pengajuan KTA",
				href: "/dashboard/pengajuan-kta",
			},
			{
				icon: RefreshCcw,
				label: "Tukar Dinas",
				href: "/dashboard/pengajuan-tukar-dinas",
			},
			{
				icon: Users,
				label: "Pegawai Organik",
				href: "/dashboard/pegawai-organik",
				check: (role, department) =>
					department === adminType.IT || department === adminType.SPI,
			},
			{
				icon: UserCog,
				label: "Manajemen Data Pegawai",
				href: "/dashboard/pegawai-manajemen",
				check: (role, department) =>
					department === process.env.NEXT_PUBLIC_DEPARTMENT_IT,
			},
			// {
			// 	icon: DollarSign,
			// 	label: "Penggajian",
			// 	href: "/dashboard/penggajian",
			// },
		],
	},
	{
		label: "Laporan",
		items: [{ icon: FileText, label: "Laporan", href: "/dashboard/reports" }],
	},
	{
		label: "Keuangan",
		checkRole: (role, department) =>
			department === adminType.IT || department === adminType.KEU,
		items: [
			{
				icon: FileText,
				label: "Penggajian",
				href: "/dashboard/penggajian/data-gaji",
			},
			{
				icon: DollarSign,
				label: "Gapok",
				href: "/dashboard/penggajian/gapok",
			},
		],
	},
	{
		label: "System",
		// Hanya tampil untuk role Admin atau Departemen IT/SPI
		checkRole: (role, department) =>
			role?.includes("Admin") || department === adminType.IT,
		items: [
			{
				icon: AlertTriangle,
				label: "Error Logs",
				href: "/dashboard/admin/error-logs",
			},
		],
	},
];

export default function DashboardLayout({ children }) {
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);
	const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
	const [userRole, setUserRole] = useState(null);
	const [userDepartment, setUserDepartment] = useState(null);
	const pathname = usePathname();
	const router = useRouter();

	// Check user role
	useEffect(() => {
		const checkUserRole = async () => {
			try {
				const response = await fetch("/api/auth/user");
				if (response.ok) {
					const data = await response.json();
					const userData = data.user;

					// console.log("Debug: userData from API", userData);
					// console.log(
					// 	"Debug: NEXT_PUBLIC_DEPARTMENT_IT",
					// 	process.env.NEXT_PUBLIC_DEPARTMENT_IT,
					// );

					setUserRole(userData.jabatan);

					// Check user department
					let department = userData.departemen;
					if (userData.departemen === process.env.NEXT_PUBLIC_DEPARTMENT_IT) {
						department = adminType.IT;
					} else if (
						userData.departemen === process.env.NEXT_PUBLIC_DEPARTMENT_SPI
					) {
						department = adminType.SPI;
					} else if (userData.jbtn) {
						// Fallback to jabatan if department is not set or not one of the special ones
						department = userData.jbtn;
					}

					// console.log("Debug: Setting userDepartment to", department);
					setUserDepartment(department);
				}
			} catch (error) {
				console.error("Error checking user role:", error);
			}
		};
		checkUserRole();
	}, []);

	// Filter menu groups berdasarkan kondisi visibility dan role
	const menuGroups = MENU_CONFIG.map((group) => {
		// Cek visibility static (env var) - default true jika undefined
		const isEnvVisible = group.visible !== false;

		// Cek visibility dynamic (role & department) - default true jika undefined
		const isRoleVisible = group.checkRole
			? group.checkRole(userRole, userDepartment)
			: true;

		// if (group.label === "Keuangan" || group.label === "System") {
		// 	console.log(`Debug: Checking visibility for group ${group.label}`, {
		// 		isEnvVisible,
		// 		isRoleVisible,
		// 		userRole,
		// 		userDepartment,
		// 		checkRoleResult: group.checkRole
		// 			? group.checkRole(userRole, userDepartment)
		// 			: "N/A",
		// 		adminTypeIT: adminType.IT,
		// 	});
		// }

		if (isEnvVisible && isRoleVisible) {
			// Filter items within the group
			const filteredItems = group.items.filter((item) => {
				if (item.check) {
					return item.check(userRole, userDepartment);
				}
				return true;
			});

			// Only return group if it has items
			if (filteredItems.length > 0) {
				return { ...group, items: filteredItems };
			}
		}
		return null;
	}).filter(Boolean);

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
				<div className="h-full px-3 py-4 overflow-y-auto bg-blue-600 flex flex-col">
					<div className="flex items-center justify-between mb-6 px-2">
						<h2 className="text-2xl font-semibold text-white">SDM Handal</h2>
						<button
							onClick={() => setIsSidebarOpen(false)}
							className="lg:hidden text-white"
						>
							<X className="h-6 w-6" />
						</button>
					</div>

					<div className="flex-1 space-y-4">
						{menuGroups.map((group, groupIndex) => (
							<div key={groupIndex}>
								{/* Group Label */}
								{group.label && (
									<div className="px-2 mb-2 text-xs font-semibold text-blue-200 uppercase tracking-wider">
										{group.label}
									</div>
								)}
								<ul className="space-y-1">
									{group.items.map((item) => {
										const Icon = item.icon;
										const isActive = pathname === item.href;
										return (
											<li key={item.href}>
												<Link
													href={item.href}
													className={`flex items-center p-2 rounded-lg hover:bg-blue-700 group transition-colors ${
														isActive ? "bg-blue-700" : ""
													}`}
												>
													<Icon className="w-5 h-5 text-white transition duration-75" />
													<span className="ml-3 text-white">{item.label}</span>
												</Link>
											</li>
										);
									})}
								</ul>
							</div>
						))}
					</div>

					{/* Logout Section */}
					<div className="mt-4 pt-4 border-t border-blue-500">
						<button
							onClick={() => setIsLogoutModalOpen(true)}
							className="flex w-full items-center p-2 rounded-lg text-white hover:bg-blue-700 group transition-colors"
						>
							<LogOut className="w-5 h-5 transition duration-75" />
							<span className="ml-3">Keluar</span>
						</button>
					</div>
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
