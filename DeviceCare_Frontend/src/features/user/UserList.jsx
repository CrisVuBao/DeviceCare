import React, { useState, useEffect, useMemo } from "react";
import { Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserCog,
  Search,
  Plus,
  Trash2,
  Lock,
  Unlock,
  KeyRound,
  Pencil,
  Phone,
  Mail,
  Briefcase,
  X,
  Check
} from "lucide-react";
import userApi from "../../api/userApi";
import ConfirmModal from "../../components/ConfirmModal";
import useDebounce from "../../hooks/useDebounce";
import useAuthStore from "../../store/authStore";
import toast from "react-hot-toast";

const COMMON_POSITIONS = [
  "Kỹ thuật viên phần cứng",
  "Kỹ thuật viên phần mềm",
  "Nhân viên tiếp tân",
  "Quản lý kho",
  "Trưởng phòng kỹ thuật",
  "Quản trị viên hệ thống"
];

const UserList = () => {
  const currentUser = useAuthStore((state) => state.user);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const [activeTab, setActiveTab] = useState("all");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [createForm, setCreateForm] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    password: "",
    role: "Employee",
    position: "Kỹ thuật viên phần cứng",
    salary: 0
  });

  const [editForm, setEditForm] = useState({
    fullName: "",
    phoneNumber: "",
    role: "Employee",
    position: "",
    salary: 0
  });

  const [resetPasswordForm, setResetPasswordForm] = useState({
    newPassword: "",
    confirmPassword: ""
  });

  const [submitting, setSubmitting] = useState(false);

  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
    isDanger: true
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await userApi.getAll();
      if (res?.success) {
        setUsers(res.data || []);
      } else {
        toast.error(res?.message || "Không tải được danh sách nhân sự");
      }
    } catch (err) {
      toast.error(err.message || "Lỗi máy chủ khi tải danh sách nhân sự");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    userApi
      .getAll()
      .then((res) => {
        if (!cancelled && res?.success) {
          setUsers(res.data || []);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          toast.error(err.message || "Lỗi máy chủ khi tải danh sách nhân sự");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const counts = useMemo(() => {
    return {
      all: users.length,
      employees: users.filter((u) => u.role === "Employee").length,
      admins: users.filter((u) => u.role === "Admin").length,
      active: users.filter((u) => u.status === "Active").length,
      blocked: users.filter((u) => u.status === "Blocked" || u.status === "Inactive").length
    };
  }, [users]);

  const filteredUsers = useMemo(() => {
    let list = [...users];

    if (activeTab === "employees") {
      list = list.filter((u) => u.role === "Employee");
    } else if (activeTab === "admins") {
      list = list.filter((u) => u.role === "Admin");
    } else if (activeTab === "active") {
      list = list.filter((u) => u.status === "Active");
    } else if (activeTab === "blocked") {
      list = list.filter((u) => u.status === "Blocked" || u.status === "Inactive");
    }

    const q = debouncedSearch.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (u) =>
          (u.fullName || "").toLowerCase().includes(q) ||
          (u.email || "").toLowerCase().includes(q) ||
          (u.phoneNumber || "").includes(q) ||
          (u.position || "").toLowerCase().includes(q)
      );
    }

    return list;
  }, [users, activeTab, debouncedSearch]);

  const openCreateModal = () => {
    setCreateForm({
      fullName: "",
      email: "",
      phoneNumber: "",
      password: "",
      role: "Employee",
      position: "Kỹ thuật viên phần cứng",
      salary: 8000000
    });
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.fullName.trim() || !createForm.email.trim() || !createForm.password.trim()) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    try {
      setSubmitting(true);
      const res = await userApi.create({
        ...createForm,
        salary: Number(createForm.salary) || 0
      });
      if (res?.success) {
        toast.success("Tạo tài khoản nhân sự thành công");
        setIsCreateModalOpen(false);
        fetchUsers();
      } else {
        toast.error(res?.message || "Không thể tạo tài khoản nhân sự");
      }
    } catch (err) {
      toast.error(err.message || "Lỗi khi tạo nhân sự");
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setEditForm({
      fullName: user.fullName || "",
      phoneNumber: user.phoneNumber || "",
      role: user.role || "Employee",
      position: user.position || "Kỹ thuật viên",
      salary: user.salary || 0
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      setSubmitting(true);
      const res = await userApi.update(selectedUser.id, {
        ...editForm,
        salary: Number(editForm.salary) || 0
      });
      if (res?.success) {
        toast.success("Cập nhật thông tin nhân sự thành công");
        setIsEditModalOpen(false);
        fetchUsers();
      } else {
        toast.error(res?.message || "Cập nhật thất bại");
      }
    } catch (err) {
      toast.error(err.message || "Lỗi khi cập nhật");
    } finally {
      setSubmitting(false);
    }
  };

  const openResetPasswordModal = (user) => {
    setSelectedUser(user);
    setResetPasswordForm({ newPassword: "", confirmPassword: "" });
    setIsResetPasswordOpen(true);
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    if (!resetPasswordForm.newPassword) {
      toast.error("Vui lòng nhập mật khẩu mới");
      return;
    }

    if (resetPasswordForm.newPassword.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }

    if (resetPasswordForm.newPassword !== resetPasswordForm.confirmPassword) {
      toast.error("Xác nhận mật khẩu không trùng khớp");
      return;
    }

    try {
      setSubmitting(true);
      const res = await userApi.resetPassword(selectedUser.id, resetPasswordForm.newPassword);
      if (res?.success) {
        toast.success(`Đã đặt lại mật khẩu cho ${selectedUser.fullName}`);
        setIsResetPasswordOpen(false);
      } else {
        toast.error(res?.message || "Không thể đặt lại mật khẩu");
      }
    } catch (err) {
      toast.error(err.message || "Lỗi khi đặt lại mật khẩu");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = (user) => {
    if (String(user.id) === String(currentUser?.id)) {
      toast.error("Bạn không thể tự khóa tài khoản của chính mình");
      return;
    }

    const isBlocking = user.status === "Active";
    const actionText = isBlocking ? "khóa tài khoản" : "mở khóa tài khoản";

    setConfirmConfig({
      isOpen: true,
      title: `Xác nhận ${actionText}`,
      message: `Bạn có chắc chắn muốn ${actionText} của nhân viên "${user.fullName}" (${user.email})?`,
      isDanger: isBlocking,
      onConfirm: async () => {
        try {
          const newStatus = isBlocking ? "Blocked" : "Active";
          const res = await userApi.updateStatus(user.id, newStatus);
          if (res?.success) {
            toast.success(`Đã ${actionText} thành công`);
            fetchUsers();
          } else {
            toast.error(res?.message || "Thao tác không thành công");
          }
        } catch (err) {
          toast.error(err.message || "Lỗi máy chủ khi cập nhật trạng thái");
        } finally {
          setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleDelete = (user) => {
    if (String(user.id) === String(currentUser?.id)) {
      toast.error("Bạn không thể tự xóa tài khoản của chính mình");
      return;
    }

    setConfirmConfig({
      isOpen: true,
      title: "Xác nhận xóa tài khoản",
      message: `Bạn có chắc chắn muốn xóa vĩnh viễn nhân sự "${user.fullName}" (${user.email}) khỏi hệ thống? Thao tác này không thể hoàn tác.`,
      isDanger: true,
      onConfirm: async () => {
        try {
          const res = await userApi.delete(user.id);
          if (res?.success) {
            toast.success(`Đã xóa nhân sự "${user.fullName}"`);
            fetchUsers();
          } else {
            toast.error(res?.message || "Không thể xóa nhân sự");
          }
        } catch (err) {
          toast.error(err.message || "Lỗi máy chủ khi xóa nhân sự");
        } finally {
          setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  if (currentUser && currentUser.role !== "Admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="space-y-4">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <UserCog className="text-blue-600" size={22} />
            <span>Quản lý nhân sự</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tổng cộng: <strong>{filteredUsers.length}</strong> nhân sự trong hệ thống
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative w-full md:w-72">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Tìm theo họ tên, email, SĐT, chức vụ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
            />
          </div>

          <button
            onClick={openCreateModal}
            className="flex items-center space-x-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg transition-colors shrink-0 shadow-sm cursor-pointer"
          >
            <Plus size={16} />
            <span>Thêm nhân sự</span>
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: "Tất cả", count: counts.all },
            { id: "employees", label: "Kỹ thuật / Nhân viên", count: counts.employees },
            { id: "admins", label: "Quản trị viên", count: counts.admins },
            { id: "active", label: "Đang làm việc", count: counts.active },
            { id: "blocked", label: "Đã khóa", count: counts.blocked }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeTab === tab.id ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-bold text-slate-700">
              <tr>
                <th className="py-3 px-4">Nhân viên</th>
                <th className="py-3 px-4">Số điện thoại</th>
                <th className="py-3 px-4">Chức vụ</th>
                <th className="py-3 px-4">Vai trò</th>
                <th className="py-3 px-4 text-right">Lương cơ bản</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-slate-400">
                    Đang tải dữ liệu nhân sự...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-slate-400">
                    Không tìm thấy nhân sự phù hợp
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isCurrent = String(u.id) === String(currentUser?.id);
                  const isBlocked = u.status === "Blocked" || u.status === "Inactive";

                  return (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0 border border-blue-200">
                            {u.fullName?.charAt(0)?.toUpperCase() || "U"}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 flex items-center space-x-1.5">
                              <span>{u.fullName}</span>
                              {isCurrent && (
                                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-normal">
                                  Bạn
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-slate-400 truncate flex items-center space-x-1 mt-0.5">
                              <Mail size={12} className="shrink-0" />
                              <span className="truncate">{u.email}</span>
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-xs font-semibold text-slate-800 whitespace-nowrap">
                        <span className="flex items-center space-x-1">
                          <Phone size={13} className="text-slate-400" />
                          <span>{u.phoneNumber || "Chưa có"}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 text-xs text-slate-700">
                        <span className="flex items-center space-x-1.5">
                          <Briefcase size={13} className="text-slate-400 shrink-0" />
                          <span>{u.position || "Kỹ thuật viên"}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`text-xs font-semibold ${
                            u.role === "Admin" ? "text-purple-600" : "text-blue-600"
                          }`}
                        >
                          {u.role === "Admin" ? "Quản trị viên" : "Nhân viên"}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-800 text-xs whitespace-nowrap">
                        {Number(u.salary || 0).toLocaleString("vi-VN")} đ
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${
                            isBlocked
                              ? "bg-rose-100 text-rose-800 border-rose-200"
                              : "bg-emerald-100 text-emerald-800 border-emerald-200"
                          }`}
                        >
                          {isBlocked ? "Đã khóa" : "Đang hoạt động"}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(u)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 rounded hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Sửa thông tin"
                          >
                            <Pencil size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() => openResetPasswordModal(u)}
                            className="p-1.5 text-slate-400 hover:text-amber-600 rounded hover:bg-amber-50 transition-colors cursor-pointer"
                            title="Đặt lại mật khẩu"
                          >
                            <KeyRound size={15} />
                          </button>

                          <button
                            type="button"
                            disabled={isCurrent}
                            onClick={() => handleToggleStatus(u)}
                            className={`p-1.5 rounded transition-colors cursor-pointer ${
                              isCurrent
                                ? "text-slate-200 cursor-not-allowed"
                                : isBlocked
                                ? "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                                : "text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                            }`}
                            title={isBlocked ? "Mở khóa tài khoản" : "Khóa tài khoản"}
                          >
                            {isBlocked ? <Unlock size={15} /> : <Lock size={15} />}
                          </button>

                          <button
                            type="button"
                            disabled={isCurrent}
                            onClick={() => handleDelete(u)}
                            className={`p-1.5 rounded transition-colors cursor-pointer ${
                              isCurrent
                                ? "text-slate-200 cursor-not-allowed"
                                : "text-slate-400 hover:text-red-600 hover:bg-red-50"
                            }`}
                            title="Xóa tài khoản"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
              onClick={() => setIsCreateModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              transition={{ type: "spring", stiffness: 420, damping: 28 }}
              className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg p-5 border border-slate-200 z-10 overflow-hidden space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                  <UserCog size={17} className="text-blue-600" />
                  <span>Thêm tài khoản nhân sự mới</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  Họ và tên nhân sự <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Văn A"
                  value={createForm.fullName}
                  onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Email đăng nhập <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="email@devicecare.vn"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="0912345678"
                    value={createForm.phoneNumber}
                    onChange={(e) => setCreateForm({ ...createForm, phoneNumber: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  Mật khẩu khởi tạo <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Tối thiểu 6 ký tự"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Vai trò hệ thống <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={createForm.role}
                    onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white cursor-pointer"
                  >
                    <option value="Employee">Nhân viên / Kỹ thuật viên</option>
                    <option value="Admin">Quản trị viên (Admin)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Lương cơ bản (đ)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500000"
                    value={createForm.salary}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        salary: Math.max(0, parseInt(e.target.value, 10) || 0)
                      })
                    }
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  Chức vụ / Vị trí phụ trách
                </label>
                <input
                  type="text"
                  list="positions-list"
                  placeholder="Chọn hoặc nhập chức danh..."
                  value={createForm.position}
                  onChange={(e) => setCreateForm({ ...createForm, position: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white"
                />
                <datalist id="positions-list">
                  {COMMON_POSITIONS.map((pos) => (
                    <option key={pos} value={pos} />
                  ))}
                </datalist>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <Check size={14} />
                  <span>{submitting ? "Đang tạo..." : "Tạo nhân sự"}</span>
                </button>
              </div>
            </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isEditModalOpen && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
              onClick={() => setIsEditModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              transition={{ type: "spring", stiffness: 420, damping: 28 }}
              className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg p-5 border border-slate-200 z-10 overflow-hidden space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                  <Pencil size={17} className="text-blue-600" />
                  <span>Chỉnh sửa nhân sự: {selectedUser.fullName}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

            <form onSubmit={handleEditSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  Email đăng nhập
                </label>
                <input
                  type="text"
                  disabled
                  value={selectedUser.email}
                  className="w-full px-3 py-2 text-sm bg-slate-100 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  Họ và tên nhân sự <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={editForm.phoneNumber}
                    onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Vai trò hệ thống <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white cursor-pointer"
                  >
                    <option value="Employee">Nhân viên / Kỹ thuật viên</option>
                    <option value="Admin">Quản trị viên (Admin)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Chức vụ / Vị trí
                  </label>
                  <input
                    type="text"
                    list="positions-list-edit"
                    value={editForm.position}
                    onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                  <datalist id="positions-list-edit">
                    {COMMON_POSITIONS.map((pos) => (
                      <option key={pos} value={pos} />
                    ))}
                  </datalist>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Lương cơ bản (đ)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500000"
                    value={editForm.salary}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        salary: Math.max(0, parseInt(e.target.value, 10) || 0)
                      })
                    }
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <Check size={14} />
                  <span>{submitting ? "Đang lưu..." : "Lưu thay đổi"}</span>
                </button>
              </div>
            </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isResetPasswordOpen && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
              onClick={() => setIsResetPasswordOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              transition={{ type: "spring", stiffness: 420, damping: 28 }}
              className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-5 border border-slate-200 z-10 overflow-hidden space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                  <KeyRound size={17} className="text-amber-600" />
                  <span>Đặt lại mật khẩu cho {selectedUser.fullName}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsResetPasswordOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleResetPasswordSubmit} className="space-y-3">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                  Đặt lại mật khẩu trực tiếp cho tài khoản{" "}
                  <strong>{selectedUser.email}</strong>. Nhân viên có thể dùng mật khẩu mới này để đăng nhập ngay lập tức.
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Mật khẩu mới <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Tối thiểu 6 ký tự"
                    value={resetPasswordForm.newPassword}
                    onChange={(e) =>
                      setResetPasswordForm({ ...resetPasswordForm, newPassword: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Xác nhận mật khẩu mới <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Nhập lại mật khẩu mới"
                    value={resetPasswordForm.confirmPassword}
                    onChange={(e) =>
                      setResetPasswordForm({ ...resetPasswordForm, confirmPassword: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsResetPasswordOpen(false)}
                    className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    <KeyRound size={14} />
                    <span>{submitting ? "Đang xử lý..." : "Cập nhật mật khẩu"}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        isDanger={confirmConfig.isDanger}
        onConfirm={confirmConfig.onConfirm}
        onClose={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default UserList;
