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
            { icon: Server, label: "Peminjaman Aset IT", href: "/dashboard/pengajuan-aset" },
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
			{
				icon: Server,
				label: "Manajemen Aset IT",
				href: "/dashboard/it-assets",
				check: (role, department) =>
					department === process.env.NEXT_PUBLIC_DEPARTMENT_IT,
			},
		],
	},
	{
		label: "Penilaian Kinerja",
		items: [
			{
				icon: ClipboardList,
				label: "Penilaian Saya Hari Ini",
				href: "/dashboard/penilaian-kinerja/input",
			},
			{
				icon: History,
				label: "Riwayat Penilaian Saya",
				href: "/dashboard/penilaian-kinerja/riwayat",
			},
			{
				icon: CheckSquare,
				label: "Penilaian Tim (Approval)",
				href: "/dashboard/penilaian-kinerja/approval",
				check: (role, department, isSupervisor) => isSupervisor === true,
			},
			{
				icon: TrendingUp,
				label: "Rekap Kinerja Bulanan",
				href: "/dashboard/penilaian-kinerja/rekap",
				check: (role, department) => department === adminType.IT,
			},
			{
				icon: CreditCard,
				label: "Jasa Dasar Pegawai",
				href: "/dashboard/penilaian-kinerja/jasa-dasar",
				check: (role, department) => department === adminType.IT,
			},
			{
				icon: GitMerge,
				label: "Mapping Supervisor",
				href: "/dashboard/penilaian-kinerja/mapping",
				check: (role, department) => department === adminType.IT,
			},
			{
				icon: SlidersHorizontal,
				label: "Parameter Penilaian",
				href: "/dashboard/penilaian-kinerja/parameter",
				check: (role, department) => department === adminType.IT,
			},
			{
				icon: ClipboardList,
				label: "Master Kegiatan Kerja",
				href: "/dashboard/penilaian-kinerja/master-kegiatan",
				check: (role, department) => department === adminType.IT,
			},
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
			{
				icon: DollarSign,
				label: "Pembagian Presentase",
				href: "/dashboard/penggajian/presentase",
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
	const [isSupervisor, setIsSupervisor] = useState(false);
	const [userProfile, setUserProfile] = useState(null);
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
					setUserProfile(userData);

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

		if (isEnvVisible && isRoleVisible) {
			// Filter items within the group
			const filteredItems = group.items.filter((item) => {
				if (item.check) {
					return item.check(userRole, userDepartment, isSupervisor);
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
		<div className="min-h-screen bg-slate-50 font-sans">
			{/* Backdrop overlay for mobile */}
			{isSidebarOpen && (
				<div
					className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-xs md:hidden"
					onClick={() => setIsSidebarOpen(false)}
				/>
			)}

			{/* Sidebar - Persistent on desktop, off-canvas drawer on mobile */}
			<aside
				className={`fixed top-0 left-0 z-40 w-64 h-screen bg-primary-900 border-r border-slate-200/80 transition-transform duration-300 ease-in-out md:translate-x-0 ${
					isSidebarOpen ? "translate-x-0" : "-translate-x-full"
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
											const Icon = item.icon;
											const isActive = pathname === item.href;
											return (
												<li key={item.href}>
													<Link
														href={item.href}
														onClick={() => setIsSidebarOpen(false)}
														className={`flex items-center px-3 py-2 rounded-lg text-[13px] font-semibold transition-all group relative ${
															isActive
																? "bg-primary-800/60 text-primary-400 font-bold border-l-[3px] border-primary-400 pl-[9px]"
																: "text-slate-650 hover:text-slate-900 hover:bg-slate-200/40"
														}`}
													>
														<Icon className={`w-4 h-4 shrink-0 transition-colors duration-150 ${
															isActive ? "text-primary-400" : "text-slate-400 group-hover:text-slate-600"
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
