import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  PhoneCall,
  Smartphone,
  ShieldCheck,
  Lock,
  Clock
} from "lucide-react";
import repairApi from "../../api/repairApi";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import toast from "react-hot-toast";

const STATUS_CONFIG = {
  Received: { label: "Mới tiếp nhận", cls: "bg-blue-100 text-blue-800 border-blue-200" },
  Quoted: { label: "Đã báo giá", cls: "bg-purple-100 text-purple-800 border-purple-200" },
  Repairing: { label: "Đang sửa chữa", cls: "bg-amber-100 text-amber-800 border-amber-200" },
  Completed: { label: "Đã sửa xong", cls: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  Returned: { label: "Đã bàn giao khách", cls: "bg-slate-100 text-slate-800 border-slate-300" },
  Cancelled: { label: "Đã hủy phiếu", cls: "bg-rose-100 text-rose-800 border-rose-200" },
  CannotRepair: { label: "Không thể khắc phục", cls: "bg-red-100 text-red-800 border-red-200" }
};

const STEPS = [
  { key: "Received", label: "Tiếp nhận" },
  { key: "Quoted", label: "Báo giá" },
  { key: "Repairing", label: "Đang sửa" },
  { key: "Completed", label: "Đã xong" },
  { key: "Returned", label: "Bàn giao" }
];

const PublicLookup = () => {
  const [phone, setPhone] = useState("");
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    const cleanPhone = phone.trim();
    if (!cleanPhone) {
      toast.error("Vui lòng nhập số điện thoại để tra cứu");
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      const res = await repairApi.lookupByPhone(cleanPhone);
      if (res?.success && res.data) {
        setRepairs(res.data);
      } else {
        setRepairs([]);
        toast.error(res?.message || "Không tìm thấy hồ sơ sửa chữa");
      }
    } catch (err) {
      setRepairs([]);
      if (err.response?.status !== 404) {
        toast.error("Không tìm thấy thông tin sửa chữa cho số điện thoại này");
      }
    } finally {
      setLoading(false);
    }
  };

  const getStepIndex = (status) => {
    switch (status) {
      case "Received":
        return 0;
      case "Quoted":
        return 1;
      case "Repairing":
        return 2;
      case "Completed":
        return 3;
      case "Returned":
        return 4;
      default:
        return -1;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img
              src="/logo.png"
              alt="DeviceCare Logo"
              className="w-8 h-8 object-contain"
            />
            <div>
              <div className="flex items-center text-lg font-black tracking-tight leading-none">
                <span className="text-slate-900">Device</span>
                <span className="text-blue-600">Care</span>
              </div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                Cổng tra cứu trực tuyến
              </p>
            </div>
          </div>

          <Link
            to="/auth"
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 border border-slate-300 rounded-lg transition-colors cursor-pointer"
          >
            <Lock size={13} />
            <span>Khu vực nhân viên</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-slate-900">
            Tra cứu tiến độ & Bảo hành thiết bị
          </h1>
          <p className="text-xs text-slate-500">
            Nhập số điện thoại quý khách đã đăng ký khi gửi máy tại DeviceCare để kiểm tra tình trạng xử lý.
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <PhoneCall
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Nhập số điện thoại (VD: 0901234567)..."
                required
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center space-x-1.5 px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-60 shrink-0"
            >
              <Search size={15} />
              <span>{loading ? "Đang tìm..." : "Tra cứu"}</span>
            </button>
          </form>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-500">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-medium">Đang tra cứu dữ liệu từ hệ thống...</p>
          </div>
        ) : hasSearched && repairs.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-2 shadow-sm">
            <Smartphone size={36} className="mx-auto text-slate-300" />
            <h3 className="text-sm font-bold text-slate-800">
              Không tìm thấy hồ sơ sửa chữa
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Không tìm thấy thiết bị nào khớp với số điện thoại <strong>{phone}</strong>. Vui lòng kiểm tra lại số điện thoại hoặc liên hệ cửa hàng.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {repairs.map((r) => {
              const statusCfg = STATUS_CONFIG[r.status] || {
                label: r.status,
                cls: "bg-gray-100 text-gray-800 border-gray-200"
              };
              const stepIdx = getStepIndex(r.status);

              return (
                <div
                  key={r.repairCode}
                  className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
                >
                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-blue-600">
                          {r.repairCode}
                        </span>
                        <span className="text-sm font-bold text-slate-900">
                          {r.deviceName}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Khách hàng: <strong>{r.customerName}</strong> • Ngày nhận:{" "}
                        {r.createdAt
                          ? format(new Date(r.createdAt), "dd/MM/yyyy", { locale: vi })
                          : "-"}
                      </p>
                    </div>

                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border self-start sm:self-auto ${statusCfg.cls}`}
                    >
                      {statusCfg.label}
                    </span>
                  </div>

                  <div className="p-5 space-y-5">
                    {stepIdx >= 0 && (
                      <div>
                        <span className="text-xs font-semibold text-slate-500 block mb-2">
                          Tiến độ xử lý
                        </span>
                        <div className="grid grid-cols-5 gap-1.5 text-center">
                          {STEPS.map((st, i) => {
                            const isDone = stepIdx >= i;
                            const isCurrent = stepIdx === i;
                            return (
                              <div key={st.key} className="space-y-1">
                                <div
                                  className={`h-1.5 rounded-full transition-colors ${
                                    isDone ? "bg-blue-600" : "bg-slate-200"
                                  }`}
                                />
                                <span
                                  className={`text-[11px] block truncate ${
                                    isCurrent
                                      ? "font-bold text-blue-600"
                                      : isDone
                                      ? "font-semibold text-slate-700"
                                      : "text-slate-400"
                                  }`}
                                >
                                  {st.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <span className="text-slate-400 block font-semibold mb-1">
                          Tình trạng máy / Lỗi tiếp nhận:
                        </span>
                        <p className="text-slate-800 font-medium">
                          {r.errorDescription || "Chưa có mô tả chi tiết"}
                        </p>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-col justify-between">
                        <div>
                          <span className="text-slate-400 block font-semibold mb-1">
                            Tổng chi phí dịch vụ:
                          </span>
                          <span className="text-base font-bold font-mono text-blue-600">
                            {Number(r.totalAmount || 0).toLocaleString("vi-VN")} đ
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">
                          (Đã bao gồm tiền công và linh kiện thay thế)
                        </p>
                      </div>
                    </div>

                    {r.warranty?.hasWarranty && (
                      <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-emerald-900 flex items-center space-x-1.5">
                            <ShieldCheck size={15} className="text-emerald-700" />
                            <span>Chính sách bảo hành</span>
                          </span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                              r.warranty.isExpired
                                ? "bg-rose-100 text-rose-800"
                                : "bg-emerald-200 text-emerald-900"
                            }`}
                          >
                            {r.warranty.statusText ||
                              (r.warranty.isExpired ? "Hết hạn" : "Còn hiệu lực")}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-slate-700 pt-1">
                          <div>
                            <span className="text-slate-400 block text-[11px]">Thời hạn:</span>
                            <strong>{r.warranty.warrantyDays} ngày</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[11px]">Hạn cuối:</span>
                            <strong>
                              {r.warranty.endDate
                                ? format(new Date(r.warranty.endDate), "dd/MM/yyyy", {
                                    locale: vi
                                  })
                                : "-"}
                            </strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[11px]">Số ngày còn lại:</span>
                            <strong
                              className={
                                r.warranty.remainingDays > 0
                                  ? "text-emerald-700"
                                  : "text-rose-600"
                              }
                            >
                              {r.warranty.remainingDays > 0
                                ? `${r.warranty.remainingDays} ngày`
                                : "Đã hết hạn"}
                            </strong>
                          </div>
                        </div>

                        {r.warranty.terms && (
                          <p className="text-[11px] text-slate-600 pt-1 border-t border-emerald-200/60">
                            <strong>Điều kiện:</strong> {r.warranty.terms}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400 mt-auto">
        <p>© 2026 DeviceCare. Hệ thống quản lý dịch vụ bảo hành & sửa chữa thiết bị.</p>
      </footer>
    </div>
  );
};

export default PublicLookup;
