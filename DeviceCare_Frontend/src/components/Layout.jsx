import React, { useState, useEffect } from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutGrid,
  UserCheck,
  Boxes,
  ScrollText,
  BadgePlus,
  Plus,
  UserCog,
  LogOut,
  User,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight
} from "lucide-react";
import useAuthStore from "../store/authStore";
import authApi from "../api/authApi";

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem("devicecare_sidebar_collapsed") === "true";
  });

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("devicecare_sidebar_collapsed", String(next));
      return next;
    });
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // bỏ qua lỗi nếu token đã hết hạn
    } finally {
      logout();
      navigate("/auth");
    }
  };

  const baseNavItems = [
    { path: "/dashboard", icon: LayoutGrid, label: "Tổng quan" },
    { path: "/customers", icon: UserCheck, label: "Khách hàng" },
    { path: "/repairs", icon: ScrollText, label: "Phiếu sửa chữa" },
    { path: "/create", icon: BadgePlus, label: "Tạo phiếu mới" },
    { path: "/inventory", icon: Boxes, label: "Kho linh kiện" }
  ];

  const navItems =
    user?.role === "Admin"
      ? [...baseNavItems, { path: "/users", icon: UserCog, label: "Nhân sự" }]
      : baseNavItems;

  const mobileBottomItems = [
    { path: "/dashboard", icon: LayoutGrid, label: "Tổng quan" },
    { path: "/repairs", icon: ScrollText, label: "Phiếu" },
    { path: "/create", icon: Plus, label: "Tiếp nhận", isCenter: true },
    { path: "/customers", icon: UserCheck, label: "Khách" },
    { path: "/inventory", icon: Boxes, label: "Kho" }
  ];

  return (
    <div className="flex h-screen w-full bg-slate-100 font-sans text-slate-800 overflow-hidden">
      {/* sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 76 : 256 }}
        transition={{ type: "spring", stiffness: 380, damping: 30 }}
        className="hidden lg:flex flex-col bg-white border-r border-slate-200 shrink-0 z-20 overflow-hidden select-none"
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 shrink-0">
          <div className={`flex items-center min-w-0 ${isCollapsed ? "justify-center w-full" : "space-x-3"}`}>
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={isCollapsed ? toggleSidebar : undefined}
              className={`flex items-center shrink-0 ${isCollapsed ? "cursor-pointer" : ""}`}
              title={isCollapsed ? "Mở rộng thanh bên (Ctrl+B)" : undefined}
            >
              <img
                src="/logo.png"
                alt="DeviceCare Logo"
                className="w-9 h-9 object-contain shrink-0"
              />
            </motion.button>

            {!isCollapsed && (
              <div className="min-w-0">
                <div className="flex items-center text-lg font-black tracking-tight leading-none">
                  <span className="text-slate-900">Device</span>
                  <span className="text-blue-600">Care</span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase mt-1 truncate">
                  Quản lý sửa chữa
                </p>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={toggleSidebar}
              title="Thu gọn thanh bên (Ctrl+B)"
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors shrink-0"
            >
              <PanelLeftClose size={18} />
            </motion.button>
          )}
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path !== "/" &&
                item.path !== "/dashboard" &&
                location.pathname.startsWith(item.path));
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                title={isCollapsed ? item.label : undefined}
                className="relative block"
              >
                <motion.div
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center ${
                    isCollapsed ? "justify-center px-0 py-2.5" : "space-x-3 px-3.5 py-2.5"
                  } rounded-xl text-sm font-semibold transition-colors duration-200 relative z-10 ${
                    isActive
                      ? "text-white"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <Icon size={19} className="shrink-0" />
                  {!isCollapsed && (
                    <span className="truncate whitespace-nowrap">{item.label}</span>
                  )}
                </motion.div>

                {isActive && (
                  <motion.div
                    layoutId="sidebarActivePill"
                    className="absolute inset-0 bg-blue-600 rounded-xl shadow-sm z-0"
                    transition={{ type: "spring", stiffness: 450, damping: 32 }}
                  />
                )}
              </NavLink>
            );
          })}
        </nav>

        <div
          className={`border-t border-slate-200 bg-slate-50/70 shrink-0 ${
            isCollapsed ? "p-3 flex flex-col items-center space-y-2" : "p-4"
          }`}
        >
          {isCollapsed ? (
            <>
              <div
                title={`${user?.fullName || "Người dùng"} (${user?.role || "Employee"})`}
                className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0 border border-blue-200"
              >
                {user?.fullName?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={handleLogout}
                title="Đăng xuất"
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut size={18} />
              </motion.button>
            </>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0 border border-blue-200">
                  {user?.fullName?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-800 truncate">
                    {user?.fullName || "Người dùng"}
                  </p>
                  <div className="flex items-center space-x-1.5 mt-0.5">
                    <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-100 text-blue-700">
                      {user?.role || "Employee"}
                    </span>
                    <span className="text-[11px] text-slate-500 truncate">
                      {user?.position || "Kỹ thuật viên"}
                    </span>
                  </div>
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={handleLogout}
                title="Đăng xuất"
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0 ml-1 cursor-pointer"
              >
                <LogOut size={18} />
              </motion.button>
            </div>
          )}
        </div>
      </motion.aside>

      {/* mobile sidebar */}
      <AnimatePresence>
        {mobileDrawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
              onClick={() => setMobileDrawerOpen(false)}
            />

            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className="relative w-72 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col z-10"
            >
              <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 shrink-0 bg-slate-50/50">
                <div className="flex items-center space-x-2.5">
                  <img
                    src="/logo.png"
                    alt="DeviceCare Logo"
                    className="w-8 h-8 object-contain shrink-0"
                  />
                  <div>
                    <div className="flex items-center text-base font-black tracking-tight leading-none">
                      <span className="text-slate-900">Device</span>
                      <span className="text-blue-600">Care</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium uppercase mt-0.5">
                      Quản lý sửa chữa
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-4 border-b border-slate-100 bg-blue-50/40">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                    {user?.fullName?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900 truncate">
                      {user?.fullName || "Người dùng"}
                    </p>
                    <div className="flex items-center space-x-1.5 mt-0.5">
                      <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-100 text-blue-700">
                        {user?.role || "Employee"}
                      </span>
                      <span className="text-[11px] text-slate-500 truncate">
                        {user?.position || "Kỹ thuật viên"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                <p className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Menu chức năng
                </p>
                {navItems.map((item) => {
                  const isActive =
                    location.pathname === item.path ||
                    (item.path !== "/" &&
                      item.path !== "/dashboard" &&
                      location.pathname.startsWith(item.path));
                  const Icon = item.icon;

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileDrawerOpen(false)}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                        isActive
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-slate-600 hover:bg-slate-100 active:bg-slate-200"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon size={19} className="shrink-0" />
                        <span>{item.label}</span>
                      </div>
                      <ChevronRight
                        size={15}
                        className={isActive ? "text-white/70" : "text-slate-300"}
                      />
                    </NavLink>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-slate-200 bg-slate-50 shrink-0">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 active:bg-red-200 border border-red-200 rounded-xl transition-colors cursor-pointer"
                >
                  <LogOut size={16} />
                  <span>Đăng xuất hệ thống</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 shrink-0 z-10">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className="lg:hidden p-2 -ml-1 text-slate-600 hover:bg-slate-100 active:bg-slate-200 rounded-lg cursor-pointer transition-colors"
              title="Mở menu chức năng"
            >
              <Menu size={22} />
            </button>

            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={toggleSidebar}
              title={isCollapsed ? "Mở rộng thanh bên (Ctrl+B)" : "Thu gọn thanh bên (Ctrl+B)"}
              className="hidden lg:flex p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors"
            >
              {isCollapsed ? <PanelLeftOpen size={19} /> : <PanelLeftClose size={19} />}
            </motion.button>

            <div className="flex items-center space-x-2">
              <span className="text-base font-bold text-slate-800 truncate">
                Hệ thống quản lý DeviceCare
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
              <User size={14} className="text-blue-600" />
              <span>Xin chào, <strong>{user?.fullName || "Bạn"}</strong></span>
            </div>

            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className="lg:hidden w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center border border-blue-200 cursor-pointer"
            >
              {user?.fullName?.charAt(0)?.toUpperCase() || "U"}
            </button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut size={14} />
              <span>Đăng xuất</span>
            </motion.button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6 pb-20 lg:pb-6 bg-slate-100">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, ease: [0.32, 0.72, 0, 1] }}
          >
            <Outlet />
          </motion.div>
        </main>

        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1 flex items-center justify-around shadow-lg">
          {mobileBottomItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path !== "/" &&
                item.path !== "/dashboard" &&
                location.pathname.startsWith(item.path));
            const Icon = item.icon;

            if (item.isCenter) {
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className="flex flex-col items-center justify-center -mt-5 group"
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 border-2 border-white ${
                      isActive
                        ? "bg-blue-700 shadow-blue-600/50"
                        : "bg-blue-600 shadow-blue-500/40 hover:bg-blue-700"
                    }`}
                  >
                    <Icon size={22} className="text-white" strokeWidth={2.5} />
                  </div>
                  <span
                    className={`text-[10px] mt-1 font-semibold ${
                      isActive ? "text-blue-600 font-bold" : "text-slate-600"
                    }`}
                  >
                    {item.label}
                  </span>
                </NavLink>
              );
            }

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition-colors ${
                  isActive
                    ? "text-blue-600"
                    : "text-slate-500 hover:text-slate-900 active:text-blue-600"
                }`}
              >
                <Icon size={19} strokeWidth={isActive ? 2.5 : 2} />
                <span
                  className={`text-[10px] mt-0.5 tracking-tight ${
                    isActive ? "font-bold text-blue-600" : "font-medium"
                  }`}
                >
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default Layout;
