import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Auth from "./features/auth/Auth";
import useAuthStore from "./store/authStore";
import authApi from "./api/authApi";
import { LogOut, User, Mail, Phone, Briefcase } from "lucide-react";

// Kiểm tra quyền truy cập của user trước khi cho phép vào trang
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  return children;
};

// Giao diện tổng quan
const DashboardOverview = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // bỏ qua lỗi nếu phiên đã kết thúc từ server
    } finally {
      logout();
      navigate("/auth");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3.5 mb-6 pb-4 border-b border-slate-100">
          <img
            src="/logo.png"
            alt="DeviceCare Logo"
            className="w-12 h-12 object-contain shrink-0"
          />
          <div>
            <div className="flex items-center">
              <span className="text-lg font-black text-slate-800 tracking-tight">Device</span>
              <span className="text-lg font-black text-blue-600 tracking-tight">Care</span>
            </div>
            <p className="text-xs text-slate-500">Đã đăng nhập thành công vào hệ thống</p>
          </div>
        </div>

        <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6 text-sm">
          <div className="flex items-center space-x-3 text-slate-700">
            <User size={18} className="text-blue-600 shrink-0" />
            <span className="font-semibold text-slate-900">{user?.fullName || "Chưa có tên"}</span>
          </div>
          <div className="flex items-center space-x-3 text-slate-700">
            <Mail size={18} className="text-blue-600 shrink-0" />
            <span>{user?.email || "Chưa có email"}</span>
          </div>
          <div className="flex items-center space-x-3 text-slate-700">
            <Phone size={18} className="text-blue-600 shrink-0" />
            <span>{user?.phoneNumber || "Chưa có số điện thoại"}</span>
          </div>
          <div className="flex items-center space-x-3 text-slate-700">
            <Briefcase size={18} className="text-blue-600 shrink-0" />
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                {user?.role || "Employee"}
              </span>
              <span className="text-xs text-slate-500">({user?.position || "Kỹ thuật viên"})</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors cursor-pointer text-sm shadow-sm"
        >
          <LogOut size={18} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </div>
  );
};

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const updateUser = useAuthStore((state) => state.updateUser);

  // Đồng bộ thông tin cá nhân khi tải lại trang
  useEffect(() => {
    if (isAuthenticated) {
      authApi.getProfile()
        .then((res) => {
          if (res?.data) {
            updateUser(res.data);
          }
        })
        .catch(() => {
          // bỏ qua lỗi nếu serrver chưa khởi động hoặc login hết hạn
        });
    }
  }, [isAuthenticated, updateUser]);

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardOverview />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
