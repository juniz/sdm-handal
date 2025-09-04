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
	Lock,
	Edit,
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
				className="rounded-md object-cover"
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

// Komponen Modal Edit Profile
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
	const [educationHistory, setEducationHistory] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState(false);
	const [showAddEducation, setShowAddEducation] = useState(false);
	const [selectedEducation, setSelectedEducation] = useState(null);

	// Fetch data pendidikan dan riwayat pendidikan saat modal dibuka
	useEffect(() => {
		const fetchData = async () => {
			try {
				// Fetch data pendidikan
				const pendidikanResponse = await fetch("/api/pendidikan");
				const pendidikanData = await pendidikanResponse.json();

				if (pendidikanData.status === 200) {
					setPendidikanList(pendidikanData.data);
				}

				// Fetch riwayat pendidikan
				const educationResponse = await fetch("/api/profile/education");
				const educationData = await educationResponse.json();

				if (educationData.status === 200) {
					setEducationHistory(educationData.data);
				}
			} catch (error) {
				console.error("Error fetching data:", error);
			}
		};

		if (isOpen) {
			fetchData();
		}
	}, [isOpen]);

	// Set initial form data when modal opens
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
				mulai_kerja: profile.mulai_kerja
					? profile.mulai_kerja.split("T")[0]
					: "",
				mulai_kontrak: profile.mulai_kontrak
					? profile.mulai_kontrak.split("T")[0]
					: "",
			});
		}
	}, [isOpen, profile]);

	const resetForm = () => {
		setError("");
		setSuccess(false);
		setLoading(false);
		setPendidikanList([]);
		setShowAddEducation(false);
		setSelectedEducation(null);
	};

	const handleClose = () => {
		resetForm();
		onClose();
	};

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");
		setLoading(true);

		try {
			const response = await fetch("/api/profile", {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(formData),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Terjadi kesalahan");
			}

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

	const handleEditEducation = (education) => {
		setSelectedEducation(education);
		setShowAddEducation(true);
	};

	const handleDeleteEducation = async (id) => {
		if (confirm("Apakah Anda yakin ingin menghapus riwayat pendidikan ini?")) {
			try {
				const response = await fetch(`/api/profile/education/${id}`, {
					method: "DELETE",
				});
				if (response.ok) {
					setEducationHistory((prev) => prev.filter((edu) => edu.id !== id));
					alert("Riwayat pendidikan berhasil dihapus.");
				} else {
					throw new Error("Gagal menghapus riwayat pendidikan");
				}
			} catch (error) {
				console.error("Error deleting education history:", error);
				alert("Terjadi kesalahan saat menghapus riwayat pendidikan.");
			}
		}
	};

	const handleSaveEducation = (educationData) => {
		if (selectedEducation) {
			// Update existing education
			setEducationHistory((prev) =>
				prev.map((edu) =>
					edu.id === selectedEducation.id ? educationData : edu
				)
			);
		} else {
			// Add new education
			setEducationHistory((prev) => [...prev, educationData]);
		}
		setSelectedEducation(null);
		setShowAddEducation(false);
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<motion.div
				initial={{ scale: 0.9, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				exit={{ scale: 0.9, opacity: 0 }}
				className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
			>
				<h3 className="text-lg font-semibold mb-4">Edit Data Diri Lengkap</h3>
				{success ? (
					<div className="text-green-600 text-center py-4">
						Data berhasil diupdate!
					</div>
				) : (
					<form onSubmit={handleSubmit}>
						{error && (
							<div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
								{error}
							</div>
						)}

						{/* Informasi Pribadi */}
						<div className="mb-6">
							<h4 className="text-md font-semibold mb-3 text-gray-800 border-b pb-2">
								Informasi Pribadi
							</h4>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Jenis Kelamin
									</label>
									<select
										name="jk"
										value={formData.jk}
										onChange={handleChange}
										className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
									>
										<option value="">Pilih Jenis Kelamin</option>
										<option value="Pria">Laki-laki</option>
										<option value="Wanita">Perempuan</option>
									</select>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Tempat Lahir
									</label>
									<input
										type="text"
										name="tmp_lahir"
										value={formData.tmp_lahir}
										onChange={handleChange}
										className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
										placeholder="Masukkan tempat lahir"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Tanggal Lahir
									</label>
									<input
										type="date"
										name="tgl_lahir"
										value={formData.tgl_lahir}
										onChange={handleChange}
										className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Pendidikan
									</label>
									<select
										name="pendidikan"
										value={formData.pendidikan}
										onChange={handleChange}
										className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Alamat
									</label>
									<textarea
										name="alamat"
										value={formData.alamat}
										onChange={handleChange}
										className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
										placeholder="Masukkan alamat lengkap"
										rows="3"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Kota
									</label>
									<input
										type="text"
										name="kota"
										value={formData.kota}
										onChange={handleChange}
										className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
										placeholder="Masukkan kota"
									/>
								</div>
							</div>
						</div>

						{/* Informasi Identitas */}
						<div className="mb-6">
							<h4 className="text-md font-semibold mb-3 text-gray-800 border-b pb-2">
								Informasi Identitas
							</h4>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										No. KTP
									</label>
									<input
										type="text"
										name="no_ktp"
										value={formData.no_ktp}
										onChange={handleChange}
										className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
										placeholder="Masukkan nomor KTP"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										NPWP
									</label>
									<input
										type="text"
										name="npwp"
										value={formData.npwp}
										onChange={handleChange}
										className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
										placeholder="Masukkan NPWP"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										No. Rekening
									</label>
									<input
										type="text"
										name="rekening"
										value={formData.rekening}
										onChange={handleChange}
										className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
										placeholder="Masukkan nomor rekening"
									/>
								</div>
							</div>
						</div>

						{/* Informasi Kepegawaian */}
						<div className="mb-6">
							<h4 className="text-md font-semibold mb-3 text-gray-800 border-b pb-2">
								Informasi Kepegawaian
							</h4>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Bidang
									</label>
									<input
										type="text"
										name="bidang"
										value={formData.bidang}
										onChange={handleChange}
										className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
										placeholder="Masukkan bidang kerja"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Mulai Kerja
									</label>
									<input
										type="date"
										name="mulai_kerja"
										value={formData.mulai_kerja}
										onChange={handleChange}
										className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
									/>
								</div>
							</div>
						</div>

						{/* Informasi Kontrak */}
						<div className="mb-6">
							<h4 className="text-md font-semibold mb-3 text-gray-800 border-b pb-2">
								Informasi Kontrak
							</h4>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Mulai Kontrak
									</label>
									<input
										type="date"
										name="mulai_kontrak"
										value={formData.mulai_kontrak}
										onChange={handleChange}
										className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
									/>
								</div>
							</div>
						</div>

						{/* Riwayat Pendidikan */}
						{/* <div className="mb-6">
							<h4 className="text-md font-semibold mb-3 text-gray-800 border-b pb-2">
								Riwayat Pendidikan
							</h4>
							<div className="mb-4">
								<button
									type="button"
									onClick={() => setShowAddEducation(true)}
									className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors"
								>
									<GraduationCap className="w-4 h-4" />
									Tambah Pendidikan
								</button>
							</div>

							<div className="space-y-3">
								{educationHistory.map((education) => (
									<div
										key={education.id}
										className="bg-gray-50 rounded-lg p-3 border-l-4 border-green-500"
									>
										<div className="flex items-center justify-between">
											<div className="flex-1">
												<div className="flex items-center gap-2 mb-1">
													<span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
														{education.pendidikan}
													</span>
													{education.status && (
														<span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
															{education.status}
														</span>
													)}
												</div>
												<h5 className="font-medium text-gray-900 text-sm">
													{education.sekolah}
												</h5>
												{education.jurusan && (
													<p className="text-xs text-gray-600">
														Jurusan: {education.jurusan}
													</p>
												)}
												<p className="text-xs text-gray-500">
													Lulus: {education.thn_lulus}
												</p>
											</div>
											<div className="flex gap-2">
												<button
													type="button"
													onClick={() => handleEditEducation(education)}
													className="p-1 text-blue-600 hover:bg-blue-100 rounded"
													title="Edit"
												>
													<Edit className="w-3 h-3" />
												</button>
												<button
													type="button"
													onClick={() => handleDeleteEducation(education.id)}
													className="p-1 text-red-600 hover:bg-red-100 rounded"
													title="Hapus"
												>
													<svg
														xmlns="http://www.w3.org/2000/svg"
														fill="none"
														viewBox="0 0 24 24"
														strokeWidth={1.5}
														stroke="currentColor"
														className="w-3 h-3"
													>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
														/>
													</svg>
												</button>
											</div>
										</div>
									</div>
								))}
							</div>
						</div> */}

						<div className="flex justify-end gap-3 mt-6 pt-4 border-t">
							<button
								type="button"
								onClick={handleClose}
								className="px-6 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
								disabled={loading}
							>
								Batal
							</button>
							<button
								type="submit"
								className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-blue-300"
								disabled={loading}
							>
								{loading ? "Menyimpan..." : "Simpan Perubahan"}
							</button>
						</div>
					</form>
				)}

				{/* Add/Edit Education Modal */}
				<AddEducationModal
					isOpen={showAddEducation}
					onClose={() => {
						setShowAddEducation(false);
						setSelectedEducation(null);
					}}
					education={selectedEducation}
					onSave={handleSaveEducation}
					pendidikanList={pendidikanList}
				/>
			</motion.div>
		</div>
	);
};

// Komponen Modal Ubah Password
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

		// Validasi
		if (!oldPassword || !newPassword || !confirmPassword) {
			setError("Semua field harus diisi");
			setLoading(false);
			return;
		}

		if (newPassword !== confirmPassword) {
			setError("Password baru dan konfirmasi password tidak sama");
			setLoading(false);
			return;
		}

		try {
			const response = await fetch("/api/profile/password", {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					oldPassword,
					newPassword,
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Terjadi kesalahan");
			}

			setSuccess(true);

			// Tunggu 1.5 detik untuk menampilkan pesan sukses
			setTimeout(() => {
				// Tutup modal dan lakukan proses logout
				handleClose();
				onLogout();
			}, 1500);
		} catch (error) {
			setError(error.message);
		} finally {
			setLoading(false);
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<motion.div
				initial={{ scale: 0.9, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				exit={{ scale: 0.9, opacity: 0 }}
				className="bg-white rounded-lg p-6 w-full max-w-md"
			>
				<h3 className="text-lg font-semibold mb-4">Ubah Password</h3>
				{success ? (
					<div className="text-green-600 text-center py-4">
						Password berhasil diubah!
					</div>
				) : (
					<form onSubmit={handleSubmit}>
						{error && (
							<div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
								{error}
							</div>
						)}
						<div className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Password Lama
								</label>
								<div className="relative">
									<input
										type={showOldPassword ? "text" : "password"}
										value={oldPassword}
										onChange={(e) => setOldPassword(e.target.value)}
										className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
										placeholder="Masukkan password lama"
									/>
									<button
										type="button"
										onClick={() => setShowOldPassword(!showOldPassword)}
										className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
									>
										{showOldPassword ? (
											<svg
												xmlns="http://www.w3.org/2000/svg"
												fill="none"
												viewBox="0 0 24 24"
												strokeWidth={1.5}
												stroke="currentColor"
												className="w-5 h-5"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
												/>
											</svg>
										) : (
											<svg
												xmlns="http://www.w3.org/2000/svg"
												fill="none"
												viewBox="0 0 24 24"
												strokeWidth={1.5}
												stroke="currentColor"
												className="w-5 h-5"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
												/>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
												/>
											</svg>
										)}
									</button>
								</div>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Password Baru
								</label>
								<div className="relative">
									<input
										type={showNewPassword ? "text" : "password"}
										value={newPassword}
										onChange={(e) => setNewPassword(e.target.value)}
										className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
										placeholder="Masukkan password baru"
									/>
									<button
										type="button"
										onClick={() => setShowNewPassword(!showNewPassword)}
										className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
									>
										{showNewPassword ? (
											<svg
												xmlns="http://www.w3.org/2000/svg"
												fill="none"
												viewBox="0 0 24 24"
												strokeWidth={1.5}
												stroke="currentColor"
												className="w-5 h-5"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
												/>
											</svg>
										) : (
											<svg
												xmlns="http://www.w3.org/2000/svg"
												fill="none"
												viewBox="0 0 24 24"
												strokeWidth={1.5}
												stroke="currentColor"
												className="w-5 h-5"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
												/>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
												/>
											</svg>
										)}
									</button>
								</div>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Konfirmasi Password Baru
								</label>
								<div className="relative">
									<input
										type={showConfirmPassword ? "text" : "password"}
										value={confirmPassword}
										onChange={(e) => setConfirmPassword(e.target.value)}
										className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
										placeholder="Konfirmasi password baru"
									/>
									<button
										type="button"
										onClick={() => setShowConfirmPassword(!showConfirmPassword)}
										className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
									>
										{showConfirmPassword ? (
											<svg
												xmlns="http://www.w3.org/2000/svg"
												fill="none"
												viewBox="0 0 24 24"
												strokeWidth={1.5}
												stroke="currentColor"
												className="w-5 h-5"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
												/>
											</svg>
										) : (
											<svg
												xmlns="http://www.w3.org/2000/svg"
												fill="none"
												viewBox="0 0 24 24"
												strokeWidth={1.5}
												stroke="currentColor"
												className="w-5 h-5"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
												/>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
												/>
											</svg>
										)}
									</button>
								</div>
							</div>
						</div>
						<div className="flex justify-end gap-3 mt-6">
							<button
								type="button"
								onClick={handleClose}
								className="px-4 py-2 text-gray-600 hover:text-gray-800"
								disabled={loading}
							>
								Batal
							</button>
							<button
								type="submit"
								className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-blue-300"
								disabled={loading}
							>
								{loading ? "Menyimpan..." : "Simpan"}
							</button>
						</div>
					</form>
				)}
			</motion.div>
		</div>
	);
};

// Komponen Modal untuk Menambah/Edit Riwayat Pendidikan
const AddEducationModal = ({
	isOpen,
	onClose,
	education,
	onSave,
	pendidikanList,
}) => {
	const [formData, setFormData] = useState({
		pendidikan: "",
		sekolah: "",
		jurusan: "",
		thn_lulus: "",
		kepala: "",
		pendanaan: "",
		keterangan: "",
		status: "",
		berkas: "",
	});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	// Set initial form data when modal opens
	useEffect(() => {
		if (isOpen && education) {
			setFormData({
				pendidikan: education.pendidikan || "",
				sekolah: education.sekolah || "",
				jurusan: education.jurusan || "",
				thn_lulus: education.thn_lulus || "",
				kepala: education.kepala || "",
				pendanaan: education.pendanaan || "",
				keterangan: education.keterangan || "",
				status: education.status || "",
				berkas: education.berkas || "",
			});
		} else {
			setFormData({
				pendidikan: "",
				sekolah: "",
				jurusan: "",
				thn_lulus: "",
				kepala: "",
				pendanaan: "",
				keterangan: "",
				status: "",
				berkas: "",
			});
		}
	}, [isOpen, education]);

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");
		setLoading(true);

		try {
			const url = education
				? `/api/profile/education/${education.id}`
				: "/api/profile/education";
			const method = education ? "PUT" : "POST";

			const response = await fetch(url, {
				method,
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(formData),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Terjadi kesalahan");
			}

			onSave(data.data);
			onClose();
		} catch (error) {
			setError(error.message);
		} finally {
			setLoading(false);
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<motion.div
				initial={{ scale: 0.9, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				exit={{ scale: 0.9, opacity: 0 }}
				className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
			>
				<h3 className="text-lg font-semibold mb-4">
					{education ? "Edit Riwayat Pendidikan" : "Tambah Riwayat Pendidikan"}
				</h3>

				<form onSubmit={handleSubmit}>
					{error && (
						<div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
							{error}
						</div>
					)}

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Tingkat Pendidikan *
							</label>
							<select
								name="pendidikan"
								value={formData.pendidikan}
								onChange={handleChange}
								required
								className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
							>
								<option value="">Pilih Tingkat Pendidikan</option>
								{pendidikanList.map((item) => (
									<option key={item.tingkat} value={item.tingkat}>
										{item.tingkat}
									</option>
								))}
							</select>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Nama Sekolah/Institusi *
							</label>
							<input
								type="text"
								name="sekolah"
								value={formData.sekolah}
								onChange={handleChange}
								required
								className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
								placeholder="Masukkan nama sekolah/institusi"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Jurusan/Program Studi
							</label>
							<input
								type="text"
								name="jurusan"
								value={formData.jurusan}
								onChange={handleChange}
								className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
								placeholder="Masukkan jurusan/program studi"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Tahun Lulus *
							</label>
							<input
								type="number"
								name="thn_lulus"
								value={formData.thn_lulus}
								onChange={handleChange}
								required
								min="1950"
								max={new Date().getFullYear() + 1}
								className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
								placeholder="Tahun lulus"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Kepala Sekolah/Direktur
							</label>
							<input
								type="text"
								name="kepala"
								value={formData.kepala}
								onChange={handleChange}
								className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
								placeholder="Masukkan nama kepala sekolah/direktur"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Status
							</label>
							<select
								name="status"
								value={formData.status}
								onChange={handleChange}
								className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
							>
								<option value="">Pilih Status</option>
								<option value="Lulus">Lulus</option>
								<option value="Belum Lulus">Belum Lulus</option>
								<option value="Drop Out">Drop Out</option>
								<option value="Pindah">Pindah</option>
							</select>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Pendanaan
							</label>
							<select
								name="pendanaan"
								value={formData.pendanaan}
								onChange={handleChange}
								className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
							>
								<option value="">Pilih Sumber Pendanaan</option>
								<option value="Biaya Sendiri">Biaya Sendiri</option>
								<option value="Biaya Instansi Sendiri">
									Biaya Instansi Sendiri
								</option>
								<option value="Lembaga Swasta Kerjasama">
									Lembaga Swasta Kerjasama
								</option>
								<option value="Lembaga Swasta Kompetisi">
									Lembaga Swasta Kompetisi
								</option>
								<option value="Lembaga Pemerintah">Lembaga Pemerintah</option>
								<option value="Beasiswa">Beasiswa</option>
							</select>
						</div>

						<div className="md:col-span-2">
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Keterangan
							</label>
							<textarea
								name="keterangan"
								value={formData.keterangan}
								onChange={handleChange}
								className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
								placeholder="Masukkan keterangan tambahan"
								rows="2"
							/>
						</div>

						<div className="md:col-span-2">
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Link Berkas (Opsional)
							</label>
							<input
								type="url"
								name="berkas"
								value={formData.berkas}
								onChange={handleChange}
								className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
								placeholder="https://example.com/berkas.pdf"
							/>
							<p className="text-xs text-gray-500 mt-1">
								Masukkan URL berkas/ijazah jika tersedia
							</p>
						</div>
					</div>

					<div className="flex justify-end gap-3 mt-6 pt-4 border-t">
						<button
							type="button"
							onClick={onClose}
							className="px-6 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
							disabled={loading}
						>
							Batal
						</button>
						<button
							type="submit"
							className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-blue-300"
							disabled={loading}
						>
							{loading ? "Menyimpan..." : education ? "Update" : "Simpan"}
						</button>
					</div>
				</form>
			</motion.div>
		</div>
	);
};

// Komponen Modal untuk menampilkan berkas pendidikan
const EducationDocumentModal = ({
	isOpen,
	onClose,
	documentUrl,
	documentName,
}) => {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<motion.div
				initial={{ scale: 0.9, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				exit={{ scale: 0.9, opacity: 0 }}
				className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden"
			>
				{/* Header Modal */}
				<div className="flex items-center justify-between p-4 border-b">
					<h3 className="text-lg font-semibold">Berkas Pendidikan</h3>
					<button
						onClick={onClose}
						className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							strokeWidth={1.5}
							stroke="currentColor"
							className="w-6 h-6"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>

				{/* Content Modal */}
				<div className="p-4">
					{documentUrl ? (
						<div className="space-y-4">
							{/* Preview untuk gambar */}
							{documentUrl.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/) ? (
								<div className="text-center">
									<img
										src={documentUrl}
										alt={documentName || "Berkas Pendidikan"}
										className="max-w-full max-h-[60vh] mx-auto rounded-lg shadow-lg"
										onError={(e) => {
											e.target.style.display = "none";
											e.target.nextSibling.style.display = "block";
										}}
									/>
									<div style={{ display: "none" }} className="text-center py-8">
										<p className="text-gray-500 mb-4">
											Gambar tidak dapat ditampilkan
										</p>
										<a
											href={documentUrl}
											target="_blank"
											rel="noopener noreferrer"
											className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												fill="none"
												viewBox="0 0 24 24"
												strokeWidth={1.5}
												stroke="currentColor"
												className="w-4 h-4"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
												/>
											</svg>
											Buka di Tab Baru
										</a>
									</div>
								</div>
							) : (
								/* Preview untuk PDF atau dokumen lain */
								<div className="text-center">
									<iframe
										src={documentUrl}
										className="w-full h-[60vh] border rounded-lg"
										title={documentName || "Berkas Pendidikan"}
									/>
								</div>
							)}

							{/* Tombol aksi */}
							<div className="flex justify-center gap-3 pt-4 border-t">
								<a
									href={documentUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										strokeWidth={1.5}
										stroke="currentColor"
										className="w-4 h-4"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
										/>
									</svg>
									Buka di Tab Baru
								</a>
								<button
									onClick={onClose}
									className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
								>
									Tutup
								</button>
							</div>
						</div>
					) : (
						<div className="text-center py-8">
							<p className="text-gray-500">Berkas tidak tersedia</p>
						</div>
					)}
				</div>
			</motion.div>
		</div>
	);
};

// Komponen untuk menampilkan riwayat pendidikan
const ProfileEducationHistory = ({ educationHistory }) => {
	const [showDocumentModal, setShowDocumentModal] = useState(false);
	const [selectedDocument, setSelectedDocument] = useState(null);

	const handleOpenDocument = (education) => {
		const documentUrl =
			process.env.NEXT_PUBLIC_BASE_IMAGE_URL + education.berkas;
		setSelectedDocument({
			url: documentUrl,
			name: `${education.sekolah} - ${education.pendidikan}`,
		});
		setShowDocumentModal(true);
	};

	const handleCloseDocument = () => {
		setShowDocumentModal(false);
		setSelectedDocument(null);
	};

	if (!educationHistory || educationHistory.length === 0) {
		return (
			<div className="bg-white rounded-lg p-6 shadow-sm">
				<div className="flex items-center gap-3 mb-4">
					<div className="rounded-full bg-blue-50 p-2">
						<GraduationCap className="w-5 h-5 text-blue-600" />
					</div>
					<div>
						<h3 className="text-lg font-semibold">Riwayat Pendidikan</h3>
						<p className="text-sm text-gray-500">Belum ada data pendidikan</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5 }}
			className="mb-8"
		>
			<h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
				<GraduationCap className="w-5 h-5 text-blue-600" />
				Riwayat Pendidikan
			</h2>
			<div className="space-y-4">
				{educationHistory.map((education, index) => (
					<motion.div
						key={index}
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.3, delay: index * 0.1 }}
						className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-blue-500"
					>
						<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
							<div className="flex-1">
								{/* <div className="flex items-center gap-2 mb-2">
									<span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
										{education.pendidikan}
									</span>
									{education.status && (
										<span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
											{education.status}
										</span>
									)}
								</div> */}
								<h4 className="font-semibold text-gray-900 mb-1">
									{education.sekolah}
								</h4>
								{education.jurusan && (
									<p className="text-sm text-gray-600 mb-2">
										Jurusan: {education.jurusan}
									</p>
								)}
								<div className="flex flex-wrap gap-4 text-sm text-gray-500">
									<span className="flex items-center gap-1">
										<Calendar className="w-3 h-3" />
										Lulus: {education.thn_lulus}
									</span>
									{education.kepala && (
										<span className="flex items-center gap-1">
											<User className="w-3 h-3" />
											Kepala: {education.kepala}
										</span>
									)}
								</div>
								{education.pendanaan && (
									<p className="text-xs text-gray-500 mt-2">
										Pendanaan: {education.pendanaan}
									</p>
								)}
								{education.keterangan && (
									<p className="text-xs text-gray-500 mt-1">
										{education.keterangan}
									</p>
								)}
							</div>
							{education.berkas && (
								<div className="flex-shrink-0">
									<button
										onClick={() => handleOpenDocument(education)}
										className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-lg hover:bg-blue-200 transition-colors"
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
											strokeWidth={1.5}
											stroke="currentColor"
											className="w-3 h-3"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
											/>
										</svg>
										Lihat Berkas
									</button>
								</div>
							)}
						</div>
					</motion.div>
				))}
			</div>

			{/* Modal untuk menampilkan berkas */}
			<EducationDocumentModal
				isOpen={showDocumentModal}
				onClose={handleCloseDocument}
				documentUrl={selectedDocument?.url}
				documentName={selectedDocument?.name}
			/>
		</motion.div>
	);
};

export default function ProfilePage() {
	const router = useRouter();
	const [profile, setProfile] = useState(null);
	const [educationHistory, setEducationHistory] = useState([]);
	const [loading, setLoading] = useState(true);
	const [showLogoutModal, setShowLogoutModal] = useState(false);
	const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
	const [showEditProfileModal, setShowEditProfileModal] = useState(false);

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

		const fetchEducationHistory = async () => {
			try {
				const response = await fetch("/api/profile/education");
				const data = await response.json();

				if (data.status === 200) {
					setEducationHistory(data.data);
				}
			} catch (error) {
				console.error("Error fetching education history:", error);
			}
		};

		fetchProfile();
		fetchEducationHistory();
	}, []);

	// Handler untuk update profile setelah edit
	const handleProfileUpdate = (updatedData) => {
		setProfile((prev) => ({
			...prev,
			...updatedData,
		}));
	};

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
			{/* Header Profile with Action Buttons */}
			<motion.div
				initial={{ opacity: 0, y: -20 }}
				animate={{ opacity: 1, y: 0 }}
				className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4"
			>
				<div className="flex items-center gap-6">
					<ProfileImage
						photoUrl={getPhotoUrl(profile.photo)}
						name={profile.nama}
					/>
					<div className="text-center md:text-left">
						<h1 className="text-xl font-bold">{profile.nama}</h1>
						<div className="flex flex-wrap justify-center md:justify-start gap-2 mt-3">
							<span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm">
								{profile.departemen}
							</span>
							<span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-sm">
								{profile.jbtn}
							</span>
							<span className="px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-sm">
								{profile.stts_aktif}
							</span>
						</div>
					</div>
				</div>
				<div className="flex gap-2">
					<button
						onClick={() => setShowEditProfileModal(true)}
						className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
						title="Edit Profile"
					>
						{/* <Edit className="w-4 h-4" /> */}
						<span className="text-xs">Ubah Profile</span>
					</button>
					<button
						onClick={() => setShowChangePasswordModal(true)}
						className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
						title="Ubah Password"
					>
						{/* <Lock className="w-4 h-4" /> */}
						<span className="text-xs">Ubah Password</span>
					</button>
					<button
						onClick={() => setShowLogoutModal(true)}
						className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
						title="Logout"
					>
						{/* <LogOut className="w-4 h-4" /> */}
						<span className="text-xs">Keluar</span>
					</button>
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
				<ProfileField icon={MapPin} label="Kota" value={profile.kota} />
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
					icon={CreditCard}
					label="Status"
					value={profile.stts_aktif}
				/>
			</ProfileSection>

			{/* Riwayat Pendidikan */}
			<ProfileEducationHistory educationHistory={educationHistory} />

			{/* Tombol untuk membuka modal edit profile */}
			<div className="text-center mt-8">
				<button
					onClick={() => setShowEditProfileModal(true)}
					className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
				>
					<Edit className="w-4 h-4" />
					Edit Profile Lengkap
				</button>
			</div>

			{/* Logout Modal */}
			<LogoutConfirmationModal
				isOpen={showLogoutModal}
				onClose={() => setShowLogoutModal(false)}
				onConfirm={handleLogout}
			/>

			{/* Edit Profile Modal */}
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
