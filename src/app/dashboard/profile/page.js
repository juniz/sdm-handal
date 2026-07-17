"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
	User,
	MapPin,
	Calendar,
	Briefcase,
	GraduationCap,
	CreditCard,
	Building2,
	Users,
	LogOut,
	Lock,
	Edit,
	Printer,
	Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import { removeClientToken } from "@/lib/client-auth";
import EducationHistorySection from "./EducationHistorySection";
import SeminarHistorySection from "./SeminarHistorySection";
import { printCVReport } from "@/components/profile/PrintCVReport";
import {
	fetchProfileDetail,
	mutationUpdateProfile,
	fetchEducationHistory,
	fetchSeminarHistory,
	fetchPendidikanList,
	mutationUpdatePassword,
} from "@/lib/profile-gql-client";

const ProfileImage = ({ photoUrl, name }) => {
	const [imgError, setImgError] = useState(false);

	return (
		<div className="relative w-24 h-24 rounded-lg overflow-hidden border-2 border-white shadow bg-slate-50 shrink-0 -mt-12">
			<Image
				src={
					imgError ? "/default-avatar.png" : photoUrl || "/default-avatar.png"
				}
				alt={`Foto ${name}`}
				fill
				className="object-cover"
				onError={() => setImgError(true)}
				sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
				priority
			/>
		</div>
	);
};

// Compact Info Item with smaller text and icons
const InfoItem = ({ icon: Icon, label, value }) => (
	<div className="flex items-center gap-2.5 py-1.5 border-b border-slate-50 last:border-0 min-w-0 w-full">
		<div className="w-7 h-7 rounded-md bg-[#E6F1FB] text-[#185FA5] flex items-center justify-center shrink-0">
			<Icon className="w-3.5 h-3.5" />
		</div>
		<div className="min-w-0 flex-1">
			<p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 font-sans">{label}</p>
			<p className="text-xs font-semibold text-slate-700 mt-0.5 truncate" title={value || "-"}>{value || "-"}</p>
		</div>
	</div>
);

const LogoutConfirmationModal = ({ isOpen, onClose, onConfirm }) => {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 pb-24 sm:pb-4">
			<motion.div
				initial={{ scale: 0.95, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				exit={{ scale: 0.95, opacity: 0 }}
				className="bg-white rounded-xl p-5 w-full max-w-sm border border-slate-100 shadow-xl"
			>
				<h3 className="text-base font-bold text-slate-800 font-figtree mb-1.5">Konfirmasi Logout</h3>
				<p className="text-slate-500 text-xs leading-relaxed mb-5">
					Apakah Anda yakin ingin keluar dari sistem kepegawaian sdm?
				</p>
				<div className="flex justify-end gap-2.5">
					<button
						onClick={onClose}
						className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
					>
						Batal
					</button>
					<button
						onClick={onConfirm}
						className="px-4 py-2 text-xs font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 active:scale-95 transition-all shadow-sm"
					>
						Keluar
					</button>
				</div>
			</motion.div>
		</div>
	);
};

const EditProfileModal = ({ isOpen, onClose, profile, onUpdate }) => {
	const [formData, setFormData] = useState({
		alamat: "",
		kota: "",
		jk: "",
		tmp_lahir: "",
		tgl_lahir: "",
		pendidikan: "",
		no_ktp: "",
		npwp: "",
		rekening: "",
		bidang: "",
		mulai_kerja: "",
		mulai_kontrak: "",
	});
	const [pendidikanList, setPendidikanList] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState(false);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const list = await fetchPendidikanList();
				setPendidikanList(list);
			} catch (error) {
				console.error("Error fetching pendidikan list:", error);
			}
		};

		if (isOpen) {
			fetchData();
		}
	}, [isOpen]);

	useEffect(() => {
		if (isOpen && profile) {
			setFormData({
				alamat: profile.alamat || "",
				kota: profile.kota || "",
				jk: profile.jk || "",
				tmp_lahir: profile.tmp_lahir || "",
				tgl_lahir: profile.tgl_lahir ? profile.tgl_lahir.split("T")[0] : "",
				pendidikan: profile.pendidikan || "",
				no_ktp: profile.no_ktp || "",
				npwp: profile.npwp || "",
				rekening: profile.rekening || "",
				bidang: profile.bidang || "",
				mulai_kerja: profile.mulai_kerja ? profile.mulai_kerja.split("T")[0] : "",
				mulai_kontrak: profile.mulai_kontrak ? profile.mulai_kontrak.split("T")[0] : "",
			});
		}
	}, [isOpen, profile]);

	const resetForm = () => {
		setError("");
		setSuccess(false);
		setLoading(false);
		setPendidikanList([]);
	};

	const handleClose = () => {
		resetForm();
		onClose();
	};

	const handleChange = (e) => {
		const { name, value } = e.target;
		const updatedValue = name === "alamat" ? value.replace(/[\r\n]+/g, " ") : value;
		setFormData((prev) => ({
			...prev,
			[name]: updatedValue,
		}));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");

		if (formData.alamat && /[\r\n]/.test(formData.alamat)) {
			setError("Alamat tidak boleh mengandung baris baru (new line)");
			return;
		}

		setLoading(true);

		try {
			await mutationUpdateProfile(formData);
			setSuccess(true);
			onUpdate(formData);

			setTimeout(() => {
				handleClose();
			}, 1500);
		} catch (error) {
			setError(error.message);
		} finally {
			setLoading(false);
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 pb-24 sm:pb-4">
			<motion.div
				initial={{ scale: 0.95, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				exit={{ scale: 0.95, opacity: 0 }}
				className="bg-white rounded-xl w-full max-w-3xl max-h-[85vh] flex flex-col border border-slate-100 shadow-xl overflow-hidden"
			>
				<div className="p-4 border-b bg-slate-50/50 shrink-0">
					<h3 className="text-base font-bold text-slate-800 font-figtree">Ubah Data Diri</h3>
				</div>
				{success ? (
					<div className="text-green-600 text-center py-6 font-semibold flex flex-col items-center gap-1.5 text-sm flex-1 justify-center">
						<div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-500 text-lg font-bold">✓</div>
						Perubahan berhasil disimpan!
					</div>
				) : (
					<form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
						<div className="flex-1 overflow-y-auto p-4 space-y-4">
							{error && (
								<div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs border border-red-100">
									{error}
								</div>
							)}

							<div>
								<h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2.5 font-figtree">
									Informasi Pribadi
								</h4>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
									<div>
										<label className="block text-[10px] font-semibold text-slate-500 mb-1">Jenis Kelamin</label>
										<select
											name="jk"
											value={formData.jk}
											onChange={handleChange}
											className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#185FA5] transition-all"
										>
											<option value="">Pilih Jenis Kelamin</option>
											<option value="Pria">Laki-laki</option>
											<option value="Wanita">Perempuan</option>
										</select>
									</div>
									<div>
										<label className="block text-[10px] font-semibold text-slate-500 mb-1">Tempat Lahir</label>
										<input
											type="text"
											name="tmp_lahir"
											value={formData.tmp_lahir}
											onChange={handleChange}
											className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#185FA5] transition-all"
											placeholder="Tempat lahir"
										/>
									</div>
									<div>
										<label className="block text-[10px] font-semibold text-slate-500 mb-1">Tanggal Lahir</label>
										<input
											type="date"
											name="tgl_lahir"
											value={formData.tgl_lahir}
											onChange={handleChange}
											className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#185FA5] transition-all"
										/>
									</div>
									<div>
										<label className="block text-[10px] font-semibold text-slate-500 mb-1">Pendidikan Terakhir</label>
										<select
											name="pendidikan"
											value={formData.pendidikan}
											onChange={handleChange}
											className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#185FA5] transition-all"
										>
											<option value="">Pilih Pendidikan</option>
											{pendidikanList.map((item) => (
												<option key={item.tingkat} value={item.tingkat}>
													{item.tingkat}
												</option>
											))}
										</select>
									</div>
									<div className="md:col-span-2">
										<label className="block text-[10px] font-semibold text-slate-500 mb-1">Alamat Lengkap</label>
										<textarea
											name="alamat"
											value={formData.alamat}
											onChange={handleChange}
											onKeyDown={(e) => {
												if (e.key === "Enter") {
													e.preventDefault();
												}
											}}
											className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#185FA5] transition-all resize-none"
											placeholder="Tulis alamat lengkap tanpa baris baru..."
											rows="2"
										/>
									</div>
									<div>
										<label className="block text-[10px] font-semibold text-slate-500 mb-1">Kota / Kabupaten</label>
										<input
											type="text"
											name="kota"
											value={formData.kota}
											onChange={handleChange}
											className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#185FA5] transition-all"
											placeholder="Kota tempat tinggal"
										/>
									</div>
								</div>
							</div>

							<div className="pt-3 border-t">
								<h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2.5 font-figtree">
									Informasi Identitas & Finansial
								</h4>
								<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
									<div>
										<label className="block text-[10px] font-semibold text-slate-500 mb-1">Nomor NIK (KTP)</label>
										<input
											type="text"
											name="no_ktp"
											value={formData.no_ktp}
											onChange={handleChange}
											className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#185FA5] transition-all"
											placeholder="16 digit NIK"
										/>
									</div>
									<div>
										<label className="block text-[10px] font-semibold text-slate-500 mb-1">Nomor NPWP</label>
										<input
											type="text"
											name="npwp"
											value={formData.npwp}
											onChange={handleChange}
											className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#185FA5] transition-all"
											placeholder="Nomor NPWP"
										/>
									</div>
									<div>
										<label className="block text-[10px] font-semibold text-slate-500 mb-1">Nomor Rekening Gaji</label>
										<input
											type="text"
											name="rekening"
											value={formData.rekening}
											onChange={handleChange}
											className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#185FA5] transition-all"
											placeholder="Nomor rekening"
										/>
									</div>
								</div>
							</div>

							<div className="pt-3 border-t">
								<h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2.5 font-figtree">
									Informasi Kepegawaian & Kontrak
								</h4>
								<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
									<div>
										<label className="block text-[10px] font-semibold text-slate-500 mb-1">Bidang Pekerjaan</label>
										<input
											type="text"
											name="bidang"
											value={formData.bidang}
											onChange={handleChange}
											className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#185FA5] transition-all"
											placeholder="Bidang unit/kerja"
										/>
									</div>
									<div>
										<label className="block text-[10px] font-semibold text-slate-500 mb-1">Tanggal Mulai Kerja</label>
										<input
											type="date"
											name="mulai_kerja"
											value={formData.mulai_kerja}
											onChange={handleChange}
											className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#185FA5] transition-all"
										/>
									</div>
									<div>
										<label className="block text-[10px] font-semibold text-slate-500 mb-1">Tanggal Mulai Kontrak</label>
										<input
											type="date"
											name="mulai_kontrak"
											value={formData.mulai_kontrak}
											onChange={handleChange}
											className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#185FA5] transition-all"
										/>
									</div>
								</div>
							</div>
						</div>

						<div className="p-4 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-2.5 shrink-0">
							<button
								type="button"
								onClick={handleClose}
								className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
								disabled={loading}
							>
								Batal
							</button>
							<button
								type="submit"
								className="px-4.5 py-2 bg-[#185FA5] text-white rounded-lg text-xs font-semibold hover:bg-[#0c447c] active:scale-95 transition-all"
								disabled={loading}
							>
								{loading ? "Menyimpan..." : "Simpan Perubahan"}
							</button>
						</div>
					</form>
				)}
			</motion.div>
		</div>
	);
};

const ChangePasswordModal = ({ isOpen, onClose, onLogout }) => {
	const [oldPassword, setOldPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState(false);
	const [showOldPassword, setShowOldPassword] = useState(false);
	const [showNewPassword, setShowNewPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

	if (!isOpen) return null;

	const resetForm = () => {
		setOldPassword("");
		setNewPassword("");
		setConfirmPassword("");
		setError("");
		setSuccess(false);
		setShowOldPassword(false);
		setShowNewPassword(false);
		setShowConfirmPassword(false);
	};

	const handleClose = () => {
		resetForm();
		onClose();
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");
		setLoading(true);

		if (!oldPassword || !newPassword || !confirmPassword) {
			setError("Semua inputan wajib diisi");
			setLoading(false);
			return;
		}

		if (newPassword !== confirmPassword) {
			setError("Konfirmasi password baru tidak sesuai");
			setLoading(false);
			return;
		}

		try {
			await mutationUpdatePassword(oldPassword, newPassword);
			setSuccess(true);
			setTimeout(() => {
				handleClose();
				onLogout();
			}, 1500);
		} catch (error) {
			setError(error.message);
		} finally {
			setLoading(false);
		}
	};

	const VisibilityButton = ({ isVisible, onClick }) => (
		<button
			type="button"
			onClick={onClick}
			className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
		>
			{isVisible ? (
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
					<path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
				</svg>
			) : (
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
					<path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
					<path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
				</svg>
			)}
		</button>
	);

	return (
		<div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 pb-24 sm:pb-4">
			<motion.div
				initial={{ scale: 0.95, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				exit={{ scale: 0.95, opacity: 0 }}
				className="bg-white rounded-xl p-5 w-full max-w-sm border border-slate-100 shadow-xl"
			>
				<h3 className="text-base font-bold text-slate-800 font-figtree mb-4">Ubah Password Akun</h3>
				{success ? (
					<div className="text-green-600 text-center py-5 font-semibold flex flex-col items-center gap-1.5 text-xs">
						<div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-500 text-lg font-bold">✓</div>
						Password berhasil diubah, silakan masuk kembali!
					</div>
				) : (
					<form onSubmit={handleSubmit} className="space-y-3.5">
						{error && (
							<div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs border border-red-100">
								{error}
							</div>
						)}
						<div className="space-y-3">
							<div>
								<label className="block text-[10px] font-semibold text-slate-500 mb-1">Password Lama</label>
								<div className="relative">
									<input
										type={showOldPassword ? "text" : "password"}
										value={oldPassword}
										onChange={(e) => setOldPassword(e.target.value)}
										className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#185FA5] transition-all pr-9"
										placeholder="Masukkan password saat ini"
									/>
									<VisibilityButton isVisible={showOldPassword} onClick={() => setShowOldPassword(!showOldPassword)} />
								</div>
							</div>
							<div>
								<label className="block text-[10px] font-semibold text-slate-500 mb-1">Password Baru</label>
								<div className="relative">
									<input
										type={showNewPassword ? "text" : "password"}
										value={newPassword}
										onChange={(e) => setNewPassword(e.target.value)}
										className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#185FA5] transition-all pr-9"
										placeholder="Masukkan password baru"
									/>
									<VisibilityButton isVisible={showNewPassword} onClick={() => setShowNewPassword(!showNewPassword)} />
								</div>
							</div>
							<div>
								<label className="block text-[10px] font-semibold text-slate-500 mb-1">Konfirmasi Password Baru</label>
								<div className="relative">
									<input
										type={showConfirmPassword ? "text" : "password"}
										value={confirmPassword}
										onChange={(e) => setConfirmPassword(e.target.value)}
										className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#185FA5] transition-all pr-9"
										placeholder="Ulangi password baru"
									/>
									<VisibilityButton isVisible={showConfirmPassword} onClick={() => setShowConfirmPassword(!showConfirmPassword)} />
								</div>
							</div>
						</div>
						<div className="flex justify-end gap-2.5 pt-4 border-t mt-4">
							<button
								type="button"
								onClick={handleClose}
								className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
								disabled={loading}
							>
								Batal
							</button>
							<button
								type="submit"
								className="px-4.5 py-2 bg-[#185FA5] text-white rounded-lg text-xs font-semibold hover:bg-[#0c447c] active:scale-95 transition-all shadow-sm"
								disabled={loading}
							>
								{loading ? "Menyimpan..." : "Simpan Password"}
							</button>
						</div>
					</form>
				)}
			</motion.div>
		</div>
	);
};

export default function ProfilePage() {
	const router = useRouter();
	const [profile, setProfile] = useState(null);
	const [educationHistory, setEducationHistory] = useState([]);
	const [seminarHistory, setSeminarHistory] = useState([]);
	const [loading, setLoading] = useState(true);
	const [showLogoutModal, setShowLogoutModal] = useState(false);
	const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
	const [showEditProfileModal, setShowEditProfileModal] = useState(false);
	const [isPrintingCV, setIsPrintingCV] = useState(false);

	const handlePrintCV = async () => {
		setIsPrintingCV(true);
		try {
			await printCVReport();
		} catch (error) {
			console.error("Gagal mencetak CV:", error);
			alert("Gagal mencetak CV: " + error.message);
		} finally {
			setIsPrintingCV(false);
		}
	};

	useEffect(() => {
		const loadData = async () => {
			try {
				const [pData, eduData, semData] = await Promise.all([
					fetchProfileDetail(),
					fetchEducationHistory(),
					fetchSeminarHistory(),
				]);
				setProfile(pData);
				setEducationHistory(eduData);
				setSeminarHistory(semData);
			} catch (error) {
				console.error("Error loading profile page data:", error);
			} finally {
				setLoading(false);
			}
		};
		loadData();
	}, []);

	const handleProfileUpdate = (updatedData) => {
		setProfile((prev) => ({
			...prev,
			...updatedData,
		}));
	};

	if (loading) {
		return (
			<div className="flex justify-center items-center min-h-[50vh]">
				<div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#185FA5]"></div>
			</div>
		);
	}

	if (!profile) {
		return (
			<div className="text-center py-12">
				<p className="text-xs text-slate-500">Gagal memuat data profil pegawai.</p>
			</div>
		);
	}

	const formatDate = (dateString) => {
		if (!dateString) return "-";
		return new Date(dateString).toLocaleDateString("id-ID", {
			day: "numeric",
			month: "short",
			year: "numeric",
		});
	};

	const getPhotoUrl = (photoPath) => {
		if (!photoPath) return null;
		if (photoPath.startsWith("http://") || photoPath.startsWith("https://")) {
			return photoPath;
		}
		const baseUrl = process.env.NEXT_PUBLIC_BASE_IMAGE_URL;
		if (baseUrl) {
			return `${baseUrl}${photoPath}`;
		}
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
		<div className="max-w-5xl mx-auto px-3 py-4 font-sans space-y-4">
			{/* High-density Premium Profile Header Card */}
			<motion.div
				initial={{ opacity: 0, y: -10 }}
				animate={{ opacity: 1, y: 0 }}
				className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden"
			>
				{/* Stylized Gradient Backdrop in deep medical blue */}
				<div className="h-24 bg-gradient-to-r from-[#042C53] via-[#0C447C] to-[#185FA5] relative">
					<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent"></div>
				</div>

				<div className="px-4 pb-4 pt-0 flex flex-col sm:flex-row items-center sm:items-end gap-4 relative z-10">
					<ProfileImage
						photoUrl={getPhotoUrl(profile.photo)}
						name={profile.nama}
					/>
					
					<div className="flex-1 text-center sm:text-left mt-2 sm:mt-0">
						<h1 className="text-xl font-bold text-slate-800 font-figtree">{profile.nama}</h1>
						<p className="text-[#185FA5] font-semibold text-xs mt-0.5">{profile.jbtn || "Staff Kepegawaian"}</p>
						
						<div className="flex flex-wrap justify-center sm:justify-start gap-1.5 mt-2">
							<span className="px-2.5 py-0.5 bg-[#E6F1FB] text-[#185FA5] rounded-md text-[10px] font-bold font-figtree uppercase tracking-wider">
								{profile.departemen}
							</span>
							<span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-md text-[10px] font-bold font-figtree uppercase tracking-wider">
								{profile.stts_aktif || "Aktif"}
							</span>
						</div>
					</div>

					{/* Action Buttons: Ultra-Compact Responsive Layout */}
					<div className="grid grid-cols-2 sm:flex sm:flex-row gap-1.5 w-full sm:w-auto mt-4 sm:mt-0 shrink-0">
						<button
							onClick={handlePrintCV}
							disabled={isPrintingCV}
							className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300 rounded-lg transition-all font-semibold text-xs active:scale-95 disabled:opacity-75"
							title="Cetak CV (PDF)"
						>
							{isPrintingCV ? (
								<Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />
							) : (
								<Printer className="w-3.5 h-3.5 text-slate-500" />
							)}
							<span>Cetak CV</span>
						</button>
						<button
							onClick={() => setShowEditProfileModal(true)}
							className="flex items-center justify-center gap-1.5 px-3 py-2 bg-[#185FA5] text-white hover:bg-[#0c447c] rounded-lg transition-all font-semibold text-xs active:scale-95 shadow-sm shadow-[#185FA5]/15"
							title="Edit Profile"
						>
							<Edit className="w-3.5 h-3.5" />
							<span>Ubah Profile</span>
						</button>
						<button
							onClick={() => setShowChangePasswordModal(true)}
							className="flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-500 text-white hover:bg-amber-600 rounded-lg transition-all font-semibold text-xs active:scale-95 shadow-sm shadow-amber-500/15"
							title="Ubah Password"
						>
							<Lock className="w-3.5 h-3.5" />
							<span>Password</span>
						</button>
						<button
							onClick={() => setShowLogoutModal(true)}
							className="flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-all font-semibold text-xs active:scale-95"
							title="Logout"
						>
							<LogOut className="w-3.5 h-3.5" />
							<span>Keluar</span>
						</button>
					</div>
				</div>
			</motion.div>

			{/* Bento Grid Layout - High Density compact */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
				{/* Bento Card 1: Informasi Pribadi */}
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.3, delay: 0.05 }}
					className="lg:col-span-1 bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm flex flex-col hover:shadow transition-all duration-300"
				>
					<h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-figtree mb-2.5 pb-2 border-b">
						Data Pribadi & Kontak
					</h2>
					<div className="flex-1 flex flex-col justify-start">
						<InfoItem icon={User} label="Jenis Kelamin" value={profile.jk} />
						<InfoItem icon={Calendar} label="Tempat, Tanggal Lahir" value={`${profile.tmp_lahir || "-"}, ${formatDate(profile.tgl_lahir)}`} />
						<InfoItem icon={GraduationCap} label="Pendidikan Terakhir" value={profile.pendidikan} />
						<InfoItem icon={MapPin} label="Alamat Tinggal" value={profile.alamat} />
						<InfoItem icon={MapPin} label="Kota / Kabupaten" value={profile.kota} />
					</div>
				</motion.div>

				{/* Bento Card 2: Kepegawaian & Finansial */}
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.3, delay: 0.1 }}
					className="lg:col-span-2 bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm flex flex-col hover:shadow transition-all duration-300"
				>
					<h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-figtree mb-2.5 pb-2 border-b">
						Kepegawaian & Finansial
					</h2>
					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-0.5">
						<InfoItem icon={Building2} label="Departemen / Unit" value={profile.departemen} />
						<InfoItem icon={Briefcase} label="Bidang Kerja" value={profile.bidang} />
						<InfoItem icon={Users} label="Kelompok / Golongan" value={profile.kode_kelompok} />
						<InfoItem icon={Calendar} label="Mulai Bekerja" value={formatDate(profile.mulai_kerja)} />
						<InfoItem icon={Briefcase} label="Status Pekerjaan" value={profile.ms_kerja} />
						<InfoItem icon={Calendar} label="Mulai Kontrak" value={formatDate(profile.mulai_kontrak)} />
						<InfoItem icon={CreditCard} label="Nomor NIK (KTP)" value={profile.no_ktp} />
						<InfoItem icon={CreditCard} label="Nomor NPWP" value={profile.npwp} />
						<InfoItem icon={CreditCard} label="Rekening Gaji" value={profile.rekening} />
					</div>
				</motion.div>
			</div>

			{/* Riwayat Pendidikan Bento Card */}
			<div className="w-full">
				<EducationHistorySection initialData={educationHistory} />
			</div>

			{/* Riwayat Seminar Bento Card */}
			<div className="w-full">
				<SeminarHistorySection initialData={seminarHistory} />
			</div>

			{/* Bottom Action bar */}
			<div className="flex justify-center pt-2">
				<button
					onClick={() => setShowEditProfileModal(true)}
					className="flex items-center gap-2 px-5 py-3 bg-[#185FA5] text-white rounded-lg hover:bg-[#0c447c] transition-all font-semibold text-xs shadow-sm hover:-translate-y-0.5 active:scale-95"
				>
					<Edit className="w-3.5 h-3.5" />
					<span>Perbarui Keseluruhan Data Pegawai</span>
				</button>
			</div>

			{/* Modals */}
			<LogoutConfirmationModal
				isOpen={showLogoutModal}
				onClose={() => setShowLogoutModal(false)}
				onConfirm={handleLogout}
			/>

			<EditProfileModal
				isOpen={showEditProfileModal}
				onClose={() => setShowEditProfileModal(false)}
				profile={profile}
				onUpdate={handleProfileUpdate}
			/>

			<ChangePasswordModal
				isOpen={showChangePasswordModal}
				onClose={() => setShowChangePasswordModal(false)}
				onLogout={handleLogout}
			/>
		</div>
	);
}
