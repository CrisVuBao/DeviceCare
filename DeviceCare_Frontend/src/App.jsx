import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Auth from "./features/auth/Auth";
import Layout from "./components/Layout";
import Dashboard from "./features/dashboard/Dashboard";
import CustomerList from "./features/customer/CustomerList";
import InventoryList from "./features/inventory/InventoryList";
import RepairList from "./features/repair/RepairList";
import CreateRepair from "./features/repair/CreateRepair";
import RepairDetail from "./features/repair/RepairDetail";
import UserList from "./features/user/UserList";
import PublicLookup from "./features/public/PublicLookup";
import useAuthStore from "./store/authStore";
import authApi from "./api/authApi";

// Kiểm tra quyền truy cập trước khi cho phép vào các trang nội bộ
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  return children;
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
        <Route path="/lookup" element={<PublicLookup />} />

        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/customers" element={<CustomerList />} />
          <Route path="/inventory" element={<InventoryList />} />
          <Route path="/repairs" element={<RepairList />} />
          <Route path="/create" element={<CreateRepair />} />
          <Route path="/repairs/:id" element={<RepairDetail />} />
          <Route path="/users" element={<UserList />} />
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
