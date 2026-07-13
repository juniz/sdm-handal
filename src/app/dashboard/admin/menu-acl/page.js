"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Users,
  Check,
  X,
  Lock,
  Unlock,
  Settings,
  Shield,
  HelpCircle,
} from "lucide-react";
import {
  fetchAdminMenus,
  mutationCreateMenu,
  mutationUpdateMenu,
  mutationDeleteMenu,
  mutationGrantMenuAccess,
  mutationRevokeMenuAccess,
} from "@/lib/menu-gql-client";
import { SearchableSelect } from "@/components/ui/searchable-select";

export default function MenuAclAdminPage() {
  const [menus, setMenus] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState("all");

  // Menu Modal State
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState(null);
  const [menuForm, setMenuForm] = useState({
    groupLabel: "",
    groupOrder: 0,
    label: "",
    href: "",
    iconName: "Home",
    itemOrder: 0,
    isPublic: false,
    accessType: "public",
    isActive: true,
  });

  // ACL Modal State
  const [isAclModalOpen, setIsAclModalOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [menusData, empResponse] = await Promise.all([
        fetchAdminMenus(),
        fetch("/api/pegawai").then((r) => r.json()),
      ]);
      setMenus(menusData);
      if (empResponse.status === "success") {
        setEmployees(empResponse.data);
      }
    } catch (err) {
      console.error("Gagal memuat data:", err);
      setError(err.message || "Gagal memuat data menu.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenMenuModal = (menu = null) => {
    if (menu) {
      setEditingMenu(menu);
      setMenuForm({
        groupLabel: menu.groupLabel,
        groupOrder: menu.groupOrder,
        label: menu.label,
        href: menu.href,
        iconName: menu.iconName,
        itemOrder: menu.itemOrder,
        isPublic: menu.isPublic,
        accessType: menu.accessType || "public",
        isActive: menu.isActive,
      });
    } else {
      setEditingMenu(null);
      setMenuForm({
        groupLabel: "Administrasi",
        groupOrder: 2,
        label: "",
        href: "/dashboard/",
        iconName: "FileText",
        itemOrder: 1,
        isPublic: false,
        accessType: "public",
        isActive: true,
      });
    }
    setIsMenuModalOpen(true);
  };

  const handleSaveMenu = async (e) => {
    e.preventDefault();
    try {
      if (editingMenu) {
        await mutationUpdateMenu(editingMenu.id, {
          groupLabel: menuForm.groupLabel,
          groupOrder: parseInt(menuForm.groupOrder, 10),
          label: menuForm.label,
          href: menuForm.href,
          iconName: menuForm.iconName,
          itemOrder: parseInt(menuForm.itemOrder, 10),
          isPublic: menuForm.isPublic,
          accessType: menuForm.accessType,
          isActive: menuForm.isActive,
        });
      } else {
        await mutationCreateMenu({
          groupLabel: menuForm.groupLabel,
          groupOrder: parseInt(menuForm.groupOrder, 10),
          label: menuForm.label,
          href: menuForm.href,
          iconName: menuForm.iconName,
          itemOrder: parseInt(menuForm.itemOrder, 10),
          isPublic: menuForm.isPublic,
          accessType: menuForm.accessType,
          isActive: menuForm.isActive,
        });
      }
      setIsMenuModalOpen(false);
      loadInitialData();
    } catch (err) {
      alert(err.message || "Gagal menyimpan menu.");
    }
  };

  const handleDeleteMenu = async (id, label) => {
    if (confirm(`Apakah Anda yakin ingin menghapus menu "${label}"? Tindakan ini tidak dapat dibatalkan.`)) {
      try {
        await mutationDeleteMenu(id);
        loadInitialData();
      } catch (err) {
        alert(err.message || "Gagal menghapus menu.");
      }
    }
  };

  const handleOpenAclModal = (menuWithAcl) => {
    setSelectedMenu(menuWithAcl);
    setSelectedEmployeeId("");
    setIsAclModalOpen(true);
  };

  const handleGrantAccess = async () => {
    if (!selectedEmployeeId) return;
    try {
      await mutationGrantMenuAccess(selectedMenu.menu.id, selectedEmployeeId);
      // Refresh local ACL state
      const updatedAllowedIds = [...selectedMenu.allowedUserIds, parseInt(selectedEmployeeId, 10)];
      setSelectedMenu({
        ...selectedMenu,
        allowedUserIds: updatedAllowedIds,
      });
      setSelectedEmployeeId("");
      loadInitialData();
    } catch (err) {
      alert(err.message || "Gagal memberikan akses.");
    }
  };

  const handleRevokeAccess = async (userId) => {
    try {
      await mutationRevokeMenuAccess(selectedMenu.menu.id, userId);
      // Refresh local ACL state
      const updatedAllowedIds = selectedMenu.allowedUserIds.filter((id) => id !== userId);
      setSelectedMenu({
        ...selectedMenu,
        allowedUserIds: updatedAllowedIds,
      });
      loadInitialData();
    } catch (err) {
      alert(err.message || "Gagal mencabut akses.");
    }
  };

  // Helper mapping ID ke nama pegawai
  const getEmployeeName = (id) => {
    const emp = employees.find((e) => e.id === id);
    return emp ? `${emp.label} (${emp.nama_departemen})` : `Pegawai ID ${id}`;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8 space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-primary-600 animate-spin"></div>
        <p className="text-sm font-semibold text-slate-500">Memuat pengaturan menu ACL...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="inline-flex p-3 rounded-full bg-red-50 text-red-500 mb-4">
          <Shield className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 font-figtree">Terjadi Kesalahan</h3>
        <p className="text-sm text-slate-500 mt-2">{error}</p>
        <button
          onClick={loadInitialData}
          className="mt-4 px-4 py-2 bg-primary-600 hover:bg-primary-800 text-white rounded-lg text-xs font-bold transition-all"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  const filteredMenus = menus.filter(({ menu }) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      menu.label.toLowerCase().includes(q) ||
      menu.groupLabel.toLowerCase().includes(q) ||
      menu.href.toLowerCase().includes(q);

    let matchesVisibility = true;
    if (visibilityFilter === "public") {
      matchesVisibility = menu.accessType === "public";
    } else if (visibilityFilter === "restricted") {
      matchesVisibility = menu.accessType !== "public";
    }

    return matchesSearch && matchesVisibility;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-800 font-figtree flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-primary-600" />
            Manajemen Hak Akses & Menu Dinamis
          </h1>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Kelola definisi menu sidebar dan hak akses pegawai secara real-time dari database.
          </p>
        </div>
        <button
          onClick={() => handleOpenMenuModal(null)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-850 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          Tambah Menu
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-xs p-4 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari label menu, group, atau path (href)..."
            className="w-full pl-9 pr-8 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 bg-slate-50/50"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-650"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="w-full sm:w-auto shrink-0">
          <select
            value={visibilityFilter}
            onChange={(e) => setVisibilityFilter(e.target.value)}
            className="w-full sm:w-44 px-3 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 bg-white text-slate-705 font-medium"
          >
            <option value="all">Semua Visibilitas</option>
            <option value="public">Public</option>
            <option value="restricted">Restricted (ACL/Supervisor)</option>
          </select>
        </div>
      </div>

      {/* Main List */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100">
                <th className="px-6 py-3.5 text-slate-500 font-bold text-[11px] uppercase tracking-wider">Urutan</th>
                <th className="px-6 py-3.5 text-slate-500 font-bold text-[11px] uppercase tracking-wider">Group & Label</th>
                <th className="px-6 py-3.5 text-slate-500 font-bold text-[11px] uppercase tracking-wider">Path (href)</th>
                <th className="px-6 py-3.5 text-slate-500 font-bold text-[11px] uppercase tracking-wider">Icon</th>
                <th className="px-6 py-3.5 text-slate-500 font-bold text-[11px] uppercase tracking-wider">Visibilitas</th>
                <th className="px-6 py-3.5 text-slate-500 font-bold text-[11px] uppercase tracking-wider">Status</th>
                <th className="px-6 py-3.5 text-slate-500 font-bold text-[11px] uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMenus.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-500">
                    <HelpCircle className="w-8 h-8 text-slate-350 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-700">Tidak ada menu yang sesuai dengan kriteria pencarian.</p>
                  </td>
                </tr>
              ) : (
                filteredMenus.map(({ menu, allowedUserIds }) => (
                <tr key={menu.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4 text-xs font-mono text-slate-400">
                    G:{menu.groupOrder} / I:{menu.itemOrder}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-800 text-xs">{menu.label}</div>
                    <div className="text-[10px] text-slate-450 uppercase tracking-widest font-mono font-bold mt-0.5">
                      {menu.groupLabel}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-slate-600">{menu.href}</td>
                  <td className="px-6 py-4 text-xs text-slate-600 font-medium">
                    <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 px-2 py-1 rounded-md text-[10px]">
                      <Settings className="w-3 h-3 text-slate-400" />
                      {menu.iconName}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {menu.accessType === "public" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100">
                        <Unlock className="w-2.5 h-2.5" /> Public
                      </span>
                    ) : menu.accessType === "supervisor" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 text-[10px] font-bold border border-violet-100">
                        <Shield className="w-2.5 h-2.5" /> Supervisor Only
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-100">
                        <Lock className="w-2.5 h-2.5" /> Restricted ({allowedUserIds.length} user)
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {menu.isActive ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                        <Check className="w-3 h-3" /> Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-650 text-[10px] font-bold">
                        <X className="w-3 h-3" /> Nonaktif
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="inline-flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                      {menu.accessType === "acl" && (
                        <button
                          onClick={() => handleOpenAclModal({ menu, allowedUserIds })}
                          className="p-1.5 text-slate-500 hover:text-primary-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Kelola User Akses"
                        >
                          <Users className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenMenuModal(menu)}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit Menu"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteMenu(menu.id, menu.label)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Hapus Menu"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Menu Form Modal */}
      {isMenuModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-slate-100 w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-sm font-figtree">
                {editingMenu ? "Edit Menu Item" : "Tambah Menu Item Baru"}
              </h3>
              <button
                onClick={() => setIsMenuModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-650 hover:bg-slate-150 rounded-lg transition-colors"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleSaveMenu} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Group Label</label>
                  <input
                    type="text"
                    required
                    value={menuForm.groupLabel}
                    onChange={(e) => setMenuForm({ ...menuForm, groupLabel: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600"
                    placeholder="Contoh: Administrasi"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Group Order</label>
                  <input
                    type="number"
                    required
                    value={menuForm.groupOrder}
                    onChange={(e) => setMenuForm({ ...menuForm, groupOrder: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Label Menu</label>
                  <input
                    type="text"
                    required
                    value={menuForm.label}
                    onChange={(e) => setMenuForm({ ...menuForm, label: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600"
                    placeholder="Contoh: Ticket IT"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Item Order</label>
                  <input
                    type="number"
                    required
                    value={menuForm.itemOrder}
                    onChange={(e) => setMenuForm({ ...menuForm, itemOrder: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Path URL (href)</label>
                <input
                  type="text"
                  required
                  value={menuForm.href}
                  onChange={(e) => setMenuForm({ ...menuForm, href: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 font-mono"
                  placeholder="Contoh: /dashboard/ticket"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nama Icon (Lucide)</label>
                <input
                  type="text"
                  required
                  value={menuForm.iconName}
                  onChange={(e) => setMenuForm({ ...menuForm, iconName: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600"
                  placeholder="Contoh: Home, Ticket, User, etc."
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tipe Akses</label>
                <select
                  value={menuForm.accessType}
                  onChange={(e) => {
                    const type = e.target.value;
                    setMenuForm({
                      ...menuForm,
                      accessType: type,
                      isPublic: type === "public",
                    });
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 bg-white text-slate-700 font-medium"
                >
                  <option value="public">Public (Semua User)</option>
                  <option value="acl">Restricted - ACL (Pegawai Pilihan)</option>
                  <option value="supervisor">Restricted - Supervisor (Hanya Atasan)</option>
                </select>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={menuForm.isActive}
                    onChange={(e) => setMenuForm({ ...menuForm, isActive: e.target.checked })}
                    className="rounded border-slate-350 text-primary-600 focus:ring-primary-600/20"
                  />
                  Aktif
                </label>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsMenuModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-600 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-850 text-white rounded-lg text-xs font-bold transition-colors"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ACL Management Modal */}
      {isAclModalOpen && selectedMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-slate-100 w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
              <div>
                <h3 className="font-bold text-slate-800 text-sm font-figtree">
                  Kelola Hak Akses User
                </h3>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">{selectedMenu.menu.label} ({selectedMenu.menu.href})</p>
              </div>
              <button
                onClick={() => setIsAclModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-650 hover:bg-slate-150 rounded-lg transition-colors"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Content area: list of allowed users */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Beri Akses Baru</label>
                <div className="flex gap-2 items-center">
                  <div className="flex-1 min-w-0">
                    <SearchableSelect
                      options={employees
                        .filter((emp) => selectedMenu && !selectedMenu.allowedUserIds.includes(emp.id))
                        .map((emp) => ({
                          value: String(emp.id),
                          label: emp.label,
                          sublabel: `${emp.value} — ${emp.nama_departemen}`,
                        }))}
                      value={selectedEmployeeId}
                      onChange={(val) => setSelectedEmployeeId(val)}
                      placeholder="Pilih pegawai..."
                    />
                  </div>
                  <button
                    onClick={handleGrantAccess}
                    disabled={!selectedEmployeeId}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-850 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-xl text-xs font-bold transition-all shrink-0 h-[42px] flex items-center justify-center"
                  >
                    Beri Akses
                  </button>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                  Daftar Pegawai yang Memiliki Akses ({selectedMenu.allowedUserIds.length})
                </label>

                {selectedMenu.allowedUserIds.length === 0 ? (
                  <div className="text-center p-6 bg-slate-50 border border-slate-100 rounded-xl">
                    <HelpCircle className="w-6 h-6 text-slate-350 mx-auto mb-2" />
                    <p className="text-[11px] text-slate-500 font-semibold">Belum ada pegawai khusus yang diberi akses.</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                    {selectedMenu.allowedUserIds.map((userId) => (
                      <li key={userId} className="flex items-center justify-between px-3.5 py-3 hover:bg-slate-50/50 transition-colors">
                        <span className="text-xs font-medium text-slate-700">
                          {getEmployeeName(userId)}
                        </span>
                        <button
                          onClick={() => handleRevokeAccess(userId)}
                          className="text-[10px] font-bold text-red-600 hover:bg-red-50 px-2.5 py-1 rounded-md transition-colors border border-transparent hover:border-red-100"
                        >
                          Cabut
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4 bg-slate-50/30 shrink-0">
              <button
                type="button"
                onClick={() => setIsAclModalOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg text-xs font-bold text-slate-700 transition-colors"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
