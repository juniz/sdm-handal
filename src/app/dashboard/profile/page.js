"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
	User,
	Mail,
	Phone,
	MapPin,
	Calendar,
	Briefcase,
	GraduationCap,
	CreditCard,
	Building2,
	Users,
	LogOut,
} from "lucide-react";
import { motion } from "framer-motion";
import { removeClientToken } from "@/lib/client-auth";

// Komponen untuk menampilkan foto profil dengan error handling
const ProfileImage = ({ photoUrl, name }) => {
	const [imgError, setImgError] = useState(false);

	return (
		<div className="relative w-32 h-32">
			<Image
				src={
					imgError ? "/default-avatar.png" : photoUrl || "/default-avatar.png"
				}
				alt={`Foto ${name}`}
				fill
				className="rounded-full object-cover"
				onError={() => setImgError(true)}
				sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
				priority
			/>
		</div>
	);
};

const ProfileField = ({ icon: Icon, label, value, isLarge = false }) => (
	<div
		className={`bg-white rounded-lg p-4 shadow-sm ${
			isLarge ? "col-span-2" : ""
		}`}
	>
		<div className="flex items-start gap-3">
			<div className="rounded-full bg-blue-50 p-2">
				<Icon className="w-5 h-5 text-blue-600" />
			</div>
			<div>
				<p className="text-sm text-gray-500">{label}</p>
				<p className="font-medium mt-1">{value || "-"}</p>
			</div>
		</div>
	</div>
);

const ProfileSection = ({ title, children }) => (
	<motion.div
		initial={{ opacity: 0, y: 20 }}
		animate={{ opacity: 1, y: 0 }}
		transition={{ duration: 0.5 }}
		className="mb-8"
	>
		<h2 className="text-lg font-semibold mb-4">{title}</h2>
		<div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
	</motion.div>
);

// Komponen Modal Konfirmasi Logout
const LogoutConfirmationModal = ({ isOpen, onClose, onConfirm }) => {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<motion.div
				initial={{ scale: 0.9, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				exit={{ scale: 0.9, opacity: 0 }}
				className="bg-white rounded-lg p-6 w-full max-w-sm"
			>
				<h3 className="text-lg font-semibold mb-4">Konfirmasi Logout</h3>
				<p className="text-gray-600 mb-6">
					Apakah Anda yakin ingin keluar dari aplikasi?
				</p>
				<div className="flex justify-end gap-3">
					<button
						onClick={onClose}
						className="px-4 py-2 text-gray-600 hover:text-gray-800"
					>
						Batal
					</button>
					<button
						onClick={onConfirm}
						className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
					>
						Logout
					</button>
				</div>
			</motion.div>
		</div>
	);
};

export default function ProfilePage() {
	const router = useRouter();
	const [profile, setProfile] = useState(null);
	const [loading, setLoading] = useState(true);
	const [showLogoutModal, setShowLogoutModal] = useState(false);

	useEffect(() => {
		const fetchProfile = async () => {
			try {
				const response = await fetch("/api/profile");
				const data = await response.json();

				if (data.error) {
					throw new Error(data.error);
				}

				setProfile(data.data);
			} catch (error) {
				console.error("Error fetching profile:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchProfile();
	}, []);

	if (loading) {
		return (
			<div className="flex justify-center items-center min-h-[60vh]">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
			</div>
		);
	}

	if (!profile) {
		return (
			<div className="text-center py-12">
				<p className="text-gray-500">Gagal memuat data profil</p>
			</div>
		);
	}

	const formatDate = (dateString) => {
		if (!dateString) return "-";
		return new Date(dateString).toLocaleDateString("id-ID", {
			day: "numeric",
			month: "long",
			year: "numeric",
		});
	};

	// Fungsi untuk memformat URL gambar
	const getPhotoUrl = (photoPath) => {
		if (!photoPath) return null;

		// Jika photoPath sudah berupa URL lengkap
		if (photoPath.startsWith("http://") || photoPath.startsWith("https://")) {
			return photoPath;
		}

		// Jika menggunakan BASE_IMAGE_URL dari environment
		const baseUrl = process.env.NEXT_PUBLIC_BASE_IMAGE_URL;
		if (baseUrl) {
			return `${baseUrl}${photoPath}`;
		}

		// Jika tidak ada BASE_IMAGE_URL, gunakan path relatif
		return photoPath;
	};

	const handleLogout = async () => {
		try {
			const response = await fetch("/api/auth/logout", {
				method: "POST",
			});

			if (response.ok) {
				removeClientToken();
				router.push("/");
			} else {
				throw new Error("Gagal logout");
			}
		} catch (error) {
			console.error("Error during logout:", error);
			alert("Terjadi kesalahan saat logout");
		}
	};

	return (
		<div className="max-w-4xl mx-auto px-4 py-6">
			{/* Header Profile with Logout Button */}
			<motion.div
				initial={{ opacity: 0, y: -20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
				className="bg-white rounded-xl p-6 mb-8 shadow-sm relative"
			>
				<button
					onClick={() => setShowLogoutModal(true)}
					className="absolute top-4 right-4 p-2 text-gray-500 hover:text-red-500 transition-colors"
					title="Logout"
				>
					<LogOut className="w-6 h-6" />
				</button>
				<div className="flex flex-col md:flex-row items-center gap-6">
					<ProfileImage
						photoUrl={getPhotoUrl(profile.photo)}
						name={profile.nama}
					/>
					<div className="text-center md:text-left">
						<h1 className="text-2xl font-bold">{profile.nama}</h1>
						<p className="text-gray-500 mt-1">{profile.nik}</p>
						<div className="flex flex-wrap justify-center md:justify-start gap-2 mt-3">
							<span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm">
								{profile.departemen}
							</span>
							<span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-sm">
								{profile.jnj_jabatan}
							</span>
							<span className="px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-sm">
								{profile.stts_aktif}
							</span>
						</div>
					</div>
				</div>
			</motion.div>

			{/* Informasi Pribadi */}
			<ProfileSection title="Informasi Pribadi">
				<ProfileField
					icon={User}
					label="Jenis Kelamin"
					value={profile.jk}
					isLarge
				/>
				<ProfileField
					icon={Calendar}
					label="Tempat, Tanggal Lahir"
					value={`${profile.tmp_lahir}, ${formatDate(profile.tgl_lahir)}`}
					isLarge
				/>
				<ProfileField
					icon={GraduationCap}
					label="Pendidikan"
					value={profile.pendidikan}
					isLarge
				/>
				<ProfileField
					icon={MapPin}
					label="Alamat"
					value={profile.alamat}
					isLarge
				/>
				<ProfileField icon={MapPin} label="Kota" value={profile.kota} isLarge />
			</ProfileSection>

			{/* Informasi Kepegawaian */}
			<ProfileSection title="Informasi Kepegawaian">
				<ProfileField
					icon={Building2}
					label="Departemen"
					value={profile.departemen}
				/>
				<ProfileField icon={Briefcase} label="Bidang" value={profile.bidang} />
				<ProfileField
					icon={Users}
					label="Kelompok"
					value={profile.kode_kelompok}
				/>
				<ProfileField
					icon={Calendar}
					label="Mulai Kerja"
					value={formatDate(profile.mulai_kerja)}
				/>
				<ProfileField
					icon={Briefcase}
					label="Status Kerja"
					value={profile.ms_kerja}
				/>
				<ProfileField icon={CreditCard} label="NPWP" value={profile.npwp} />
				<ProfileField
					icon={CreditCard}
					label="No. KTP"
					value={profile.no_ktp}
				/>
				<ProfileField
					icon={CreditCard}
					label="Rekening"
					value={profile.rekening}
				/>
			</ProfileSection>

			{/* Informasi Kontrak */}
			<ProfileSection title="Informasi Kontrak">
				<ProfileField
					icon={Calendar}
					label="Mulai Kontrak"
					value={formatDate(profile.mulai_kontrak)}
				/>
				<ProfileField
					icon={Calendar}
					label="Cuti Diambil"
					value={profile.cuti_diambil}
				/>
				<ProfileField
					icon={CreditCard}
					label="Status"
					value={profile.stts_aktif}
				/>
				<ProfileField icon={CreditCard} label="Index" value={profile.indek} />
			</ProfileSection>

			{/* Logout Modal */}
			<LogoutConfirmationModal
				isOpen={showLogoutModal}
				onClose={() => setShowLogoutModal(false)}
				onConfirm={handleLogout}
			/>
		</div>
	);
}
