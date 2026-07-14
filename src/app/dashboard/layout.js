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
	Server,
	ClipboardList,
	History,
	CheckSquare,
	TrendingUp,
	GitMerge,
	SlidersHorizontal,
	Activity,
	Shield,
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

import { fetchMyMenus } from "@/lib/menu-gql-client";

const ICON_MAP = {
	Home,
	User,
	Calendar,
	FileText,
	Ticket,
	UserCheck,
	AlertTriangle,
	CreditCard,
	RefreshCcw,
	Users,
	UserCog,
	DollarSign,
	Server,
	ClipboardList,
	History,
	CheckSquare,
	TrendingUp,
	GitMerge,
	SlidersHorizontal,
	Activity,
	Shield,
};

const groupAndSortMenus = (flatMenus) => {
	const groupsMap = {};

	flatMenus.forEach((menu) => {
		if (!groupsMap[menu.groupLabel]) {
			groupsMap[menu.groupLabel] = {
				label: menu.groupLabel,
				groupOrder: menu.groupOrder,
				items: [],
			};
		}
		groupsMap[menu.groupLabel].items.push({
			id: menu.id,
			label: menu.label,
			href: menu.href,
			iconName: menu.iconName,
			itemOrder: menu.itemOrder,
		});
	});

	const sortedGroups = Object.values(groupsMap).sort(
		(a, b) => a.groupOrder - b.groupOrder
	);

	sortedGroups.forEach((group) => {
		group.items.sort((a, b) => a.itemOrder - b.itemOrder);
	});

	return sortedGroups;
};

export default function DashboardLayout({ children }) {
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);
	const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
	const [userRole, setUserRole] = useState(null);
	const [userDepartment, setUserDepartment] = useState(null);
	const [isSupervisor, setIsSupervisor] = useState(false);
	const [userProfile, setUserProfile] = useState(null);
	const [userId, setUserId] = useState(null);
	const [menuGroups, setMenuGroups] = useState([]);
	const [isLoadingMenus, setIsLoadingMenus] = useState(true);
	const pathname = usePathname();
	const router = useRouter();

	// Check user role & fetch menus
	useEffect(() => {
		const checkUserRoleAndMenus = async () => {
			try {
				const response = await fetch("/api/auth/user");
				if (response.ok) {
					const data = await response.json();
					const userData = data.user;
					setUserProfile(userData);
					setUserId(userData.id);

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
						department = userData.jbtn;
					}

					setUserDepartment(department);

					// Check if supervisor
					try {
						const isSupervisorRes = await fetch("/api/penilaian/is-supervisor");
						if (isSupervisorRes.ok) {
							const isSupData = await isSupervisorRes.json();
							setIsSupervisor(isSupData.isSupervisor);
						}
					} catch (supErr) {
						console.error("Error checking supervisor role:", supErr);
					}

					// Fetch dynamic menu from DB
					try {
						const menus = await fetchMyMenus();
						const grouped = groupAndSortMenus(menus);
						setMenuGroups(grouped);
					} catch (menuErr) {
						console.error("Error fetching dynamic menus:", menuErr);
					}
				}
			} catch (error) {
				console.error("Error checking user role:", error);
			} finally {
				setIsLoadingMenus(false);
			}
		};
		checkUserRoleAndMenus();
	}, []);

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
		<div className="min-h-screen bg-slate-50 font-sans">
			{/* Backdrop overlay for mobile */}
			{isSidebarOpen && (
				<div
					className="fixed inset-0 z-[90] bg-slate-900/40 backdrop-blur-xs md:hidden"
					onClick={() => setIsSidebarOpen(false)}
				/>
			)}

			{/* Sidebar - Persistent on desktop, off-canvas drawer on mobile */}
			<aside
				className={`fixed top-0 left-0 z-[100] w-64 h-screen bg-primary-900 border-r border-slate-200/80 transition-transform duration-300 ease-in-out md:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"
					}`}
			>
				<div className="h-full px-4 py-6 overflow-y-auto flex flex-col justify-between select-none">
					<div>
						{/* Brand Header */}
						<div className="flex items-center justify-between mb-6 px-1">
							<div className="flex items-center space-x-3">
								<div className="w-9 h-9 rounded-xl bg-white border border-primary-800 flex items-center justify-center text-primary-400">
									<Activity className="w-5 h-5" />
								</div>
								<div>
									<h2 className="text-base font-bold leading-none text-slate-850 tracking-tight font-figtree">
										SDM Handal
									</h2>
									<span className="text-[9.5px] text-primary-400 font-bold tracking-wide">
										RS Bhayangkara Nganjuk
									</span>
								</div>
							</div>
							<button
								onClick={() => setIsSidebarOpen(false)}
								className="md:hidden p-1.5 rounded-lg text-slate-650 hover:text-slate-900 hover:bg-slate-200/50 transition-colors"
								aria-label="Close menu"
							>
								<X className="h-5 w-5" />
							</button>
						</div>

						{/* Menu Navigation */}
						<div className="space-y-6">
							{menuGroups.map((group, groupIndex) => (
								<div key={groupIndex} className="space-y-1.5">
									{/* Group Label */}
									{group.label && (
										<div className="px-3 text-[10px] font-extrabold text-slate-450 uppercase tracking-widest font-mono">
											{group.label}
										</div>
									)}
									<ul className="space-y-0.5">
										{group.items.map((item) => {
											const Icon = ICON_MAP[item.iconName] || FileText;
											const isActive = pathname === item.href;
											return (
												<li key={item.href}>
													<Link
														href={item.href}
														onClick={() => setIsSidebarOpen(false)}
														className={`flex items-center px-3 py-2 rounded-lg text-[13px] font-semibold transition-all group relative ${isActive
															? "bg-primary-800/60 text-primary-400 font-bold border-l-[3px] border-primary-400 pl-[9px]"
															: "text-slate-650 hover:text-slate-900 hover:bg-slate-200/40"
															}`}
													>
														<Icon className={`w-4 h-4 shrink-0 transition-colors duration-150 ${isActive ? "text-primary-400" : "text-slate-400 group-hover:text-slate-600"
															}`} />
														<span className="ml-3 truncate">{item.label}</span>
													</Link>
												</li>
											);
										})}
									</ul>
								</div>
							))}
						</div>
					</div>

					{/* Sidebar User Profile & Logout Section */}
					<div className="mt-8 pt-4 border-t border-slate-200/80 space-y-3">
						{userProfile ? (
							<div className="flex items-center space-x-3 px-1.5">
								<div className="w-9 h-9 rounded-full bg-white text-primary-400 flex items-center justify-center font-bold text-[13px] border border-primary-800 shrink-0">
									{userProfile.nama
										? userProfile.nama
											.split(" ")
											.map((n) => n[0])
											.slice(0, 2)
											.join("")
											.toUpperCase()
										: "U"}
								</div>
								<div className="flex-1 min-w-0">
									<p className="text-xs font-bold text-slate-800 truncate leading-tight">
										{userProfile.nama}
									</p>
									<p className="text-[10px] text-slate-500 truncate mt-0.5 font-medium">
										{userProfile.jabatan || userProfile.departemen || "Pegawai"}
									</p>
								</div>
							</div>
						) : (
							<div className="flex items-center space-x-3 px-1.5 animate-pulse">
								<div className="w-9 h-9 rounded-full bg-slate-200 shrink-0"></div>
								<div className="flex-1 space-y-1.5 min-w-0">
									<div className="h-2.5 bg-slate-200 rounded w-3/4"></div>
									<div className="h-2 bg-slate-200 rounded w-1/2"></div>
								</div>
							</div>
						)}
						<button
							onClick={() => setIsLogoutModalOpen(true)}
							className="flex w-full items-center px-3 py-2 rounded-lg text-slate-650 hover:text-slate-900 hover:bg-slate-200/50 transition-colors group text-[13px] font-semibold"
						>
							<LogOut className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition duration-75 shrink-0" />
							<span className="ml-3">Keluar</span>
						</button>
					</div>
				</div>
			</aside>

			{/* Mobile Header Bar */}
			<div className="flex md:hidden items-center justify-between bg-white px-4 py-3.5 border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
				<div className="flex items-center space-x-3">
					<button
						onClick={() => setIsSidebarOpen(true)}
						className="text-slate-600 hover:text-slate-900 focus:outline-none p-1.5 rounded-lg hover:bg-slate-50 active:bg-slate-100 transition-colors"
						aria-label="Open menu"
					>
						<Menu className="h-5 w-5" />
					</button>
					<div className="flex items-center space-x-2">
						<div className="w-6 h-6 rounded-lg bg-primary-50 border border-primary-100 flex items-center justify-center text-primary-400">
							<Activity className="w-3.5 h-3.5" />
						</div>
						<span className="font-extrabold text-slate-800 tracking-tight text-[13.5px] font-figtree">
							SDM Handal
						</span>
					</div>
				</div>
				<div className="flex items-center gap-1">
					<NotificationBell />
				</div>
			</div>

			{/* Main Content Area */}
			<div className="md:ml-64 min-h-screen transition-all duration-300 pb-24 md:pb-6">
				{/* Top bar - Desktop only */}
				<div className="hidden md:block mb-6 bg-white px-6 py-4 border-b border-slate-200/60">
					<div className="flex justify-between items-center">
						{/* Left: Brand / System Status */}
						<div className="flex items-center space-x-3">
							<span className="text-xs font-bold text-slate-400 tracking-wider font-mono uppercase">
								Portal Pegawai
							</span>
							<div className="h-4 w-px bg-slate-200" />
							<div className="flex items-center space-x-1.5 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-100/80 text-[10px] font-bold uppercase tracking-wide">
								<span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
								<span>Sistem Aktif</span>
							</div>
						</div>

						{/* Right: Notifications & User profile */}
						<div className="flex items-center gap-6">
							<div className="flex items-center">
								<NotificationBell />
							</div>
							<div className="h-6 w-px bg-slate-200" />
							<Suspense fallback={<UserProfileSkeleton />}>
								<div className="hover:opacity-90 transition-opacity">
									<UserProfile />
								</div>
							</Suspense>
						</div>
					</div>
				</div>

				{/* Page content */}
				<main className="px-0 md:px-6">
					<div className="bg-white md:rounded-xl md:border md:border-gray-200/60 md:shadow-xs overflow-hidden">
						{children}
					</div>
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
