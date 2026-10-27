import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { motion } from "framer-motion";
import Auth from "./features/auth/Auth";
import Layout from "./components/Layout";
import CustomerList from "./features/customer/CustomerList";
import InventoryList from "./features/inventory/InventoryList";
import useAuthStore from "./store/authStore";
import authApi from "./api/authApi";
import {
  Contact2,
  Boxes,
  Mail,
  PhoneCall,
  BadgeCheck
} from "lucide-react";

// Kiểm tra quyền truy cập trước khi cho phép vào các trang nội bộ
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  return children;
};

const DashboardOverview = () => {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-black text-xl border-2 border-blue-200 shrink-0 shadow-xs">
            {user?.fullName?.charAt(0)?.toUpperCase() || "A"}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Xin chào, {user?.fullName || "Người dùng"}!
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Bạn đang đăng nhập với vai trò{" "}
              <strong className="text-blue-600">{user?.role || "Employee"}</strong> ({user?.position || "Kỹ thuật viên"})
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 450, damping: 25 }}
            onClick={() => navigate("/customers")}
            className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition-colors cursor-pointer"
          >
            <Contact2 size={15} />
            <span>Xem khách hàng</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 450, damping: 25 }}
            onClick={() => navigate("/inventory")}
            className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Boxes size={15} />
            <span>Xem kho linh kiện</span>
          </motion.button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3.5"
        >
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Mail size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-400 uppercase">Email</p>
            <p className="text-sm font-semibold text-slate-800 truncate">{user?.email || "Chưa có email"}</p>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3.5"
        >
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <PhoneCall size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-400 uppercase">Số điện thoại liên lạc</p>
            <p className="text-sm font-semibold text-slate-800 truncate">{user?.phoneNumber || "Chưa cập nhật"}</p>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3.5"
        >
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <BadgeCheck size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-400 uppercase">Chức vụ phụ trách</p>
            <p className="text-sm font-semibold text-slate-800 truncate">{user?.position || "Kỹ thuật viên"}</p>
          </div>
        </motion.div>
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
      authApi
        .getProfile()
        .then((res) => {
          if (res?.data) {
            updateUser(res.data);
          }
        })
        .catch(() => {
        });
    }
  }, [isAuthenticated, updateUser]);

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/auth" element={<Auth />} />

        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardOverview />} />
          <Route path="/customers" element={<CustomerList />} />
          <Route path="/inventory" element={<InventoryList />} />
        </Route>

        {/* Chuyển hướng mặc định */}
        <Route
          path="*"
          element={
            <Navigate to={isAuthenticated ? "/dashboard" : "/auth"} replace />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
