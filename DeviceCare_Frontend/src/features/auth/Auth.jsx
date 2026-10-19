import React, { useState } from "react";
import { User, Lock, Eye, EyeOff, Loader2, Search, AlertCircle } from "lucide-react";
import { useNavigate, Navigate, Link } from "react-router-dom";
import authApi from "../../api/authApi";
import useAuthStore from "../../store/authStore";

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [formData, setFormData] = useState({
    emailOrPhone: "",
    password: ""
  });

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  // Gửi thông tin login và lưu trạng thái phiên
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await authApi.login({
        emailOrPhone: formData.emailOrPhone.trim(),
        password: formData.password
      });

      if (res.success && res.data) {
        setAuth(res.data.user, res.data.token);
        navigate("/dashboard");
      } else {
        setError(res.message || "Đăng nhập thất bại");
      }
    } catch (err) {
      setError(err.message || "Sai tài khoản hoặc mật khẩu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full">
        <div className="mb-6 flex items-center justify-center space-x-3.5">
          <img
            src="/logo.png"
            alt="DeviceCare Logo"
            className="w-12 h-12 object-contain shrink-0"
          />
          <div>
            <div className="flex items-center">
              <span className="text-2xl font-black text-slate-800 tracking-tight">Device</span>
              <span className="text-2xl font-black text-blue-600 tracking-tight">Care</span>
            </div>
            <span className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Hệ thống quản lý dịch vụ sửa chữa
            </span>
          </div>
        </div>

        {/* Form đăng nhập */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <h2 className="text-lg font-bold text-slate-800 mb-5 border-b border-slate-100 pb-3">
            Đăng nhập hệ thống
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-start space-x-2">
                <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Tài khoản đăng nhập
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  required
                  type="text"
                  name="emailOrPhone"
                  placeholder="Email hoặc số điện thoại"
                  value={formData.emailOrPhone}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-sm transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Nhập mật khẩu"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-sm transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors cursor-pointer text-sm shadow-sm disabled:opacity-60 disabled:cursor-not-allowed mt-6"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <span>Đăng nhập</span>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <Link 
              to="/" 
              className="inline-flex items-center space-x-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
            >
              <Search size={16} />
              <span>Tra cứu tiến độ sửa chữa cho khách hàng</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
