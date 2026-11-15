import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  Clock,
  BadgeCheck,
  Banknote,
  UserCheck,
  ArrowRight,
  Eye,
  RefreshCw,
  BarChart3,
  PieChart as PieChartIcon,
  Wrench,
  ChevronRight
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import toast from "react-hot-toast";
import dashboardApi from "../../api/dashboardApi";
import repairApi from "../../api/repairApi";
import useAuthStore from "../../store/authStore";
import useDebounce from "../../hooks/useDebounce";

const STATUS_CONFIG = {
  Received: {
    label: "Mới tiếp nhận",
    badgeCls: "bg-blue-100 text-blue-800 border-blue-200",
    barBg: "bg-blue-500",
    dotCls: "bg-blue-500"
  },
  Quoted: {
    label: "Đã báo giá",
    badgeCls: "bg-purple-100 text-purple-800 border-purple-200",
    barBg: "bg-purple-500",
    dotCls: "bg-purple-500"
  },
  Repairing: {
    label: "Đang sửa chữa",
    badgeCls: "bg-amber-100 text-amber-800 border-amber-200",
    barBg: "bg-amber-500",
    dotCls: "bg-amber-500"
  },
  Completed: {
    label: "Đã sửa xong",
    badgeCls: "bg-emerald-100 text-emerald-800 border-emerald-200",
    barBg: "bg-emerald-500",
    dotCls: "bg-emerald-500"
  },
  Returned: {
    label: "Đã bàn giao khách",
    badgeCls: "bg-slate-100 text-slate-800 border-slate-300",
    barBg: "bg-slate-600",
    dotCls: "bg-slate-600"
  },
  CannotRepair: {
    label: "Không sửa được",
    badgeCls: "bg-red-100 text-red-800 border-red-200",
    barBg: "bg-red-500",
    dotCls: "bg-red-500"
  },
  Cancelled: {
    label: "Đã hủy phiếu",
    badgeCls: "bg-rose-100 text-rose-800 border-rose-200",
    barBg: "bg-rose-500",
    dotCls: "bg-rose-500"
  }
};

const PERIOD_OPTIONS = [
  { id: "week", label: "Tuần này" },
  { id: "month", label: "Tháng này" },
  { id: "year", label: "Năm nay" }
];

const formatCompactMoney = (val) => {
  const num = Number(val || 0);
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1).replace(/\.0$/, "")} Tỷ`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, "")} Tr`;
  if (num >= 1_000) return `${Math.round(num / 1_000)}K`;
  return String(num);
};

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  const item = payload[0].payload;

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-md px-3 py-2 text-xs">
      <p className="font-bold text-slate-800 border-b border-slate-100 pb-1 mb-1">
        Mốc: {label}
      </p>
      <div className="space-y-1">
        <p className="text-slate-600 flex items-center justify-between gap-4">
          <span>Doanh thu:</span>
          <strong className="font-mono text-blue-600">
            {Number(item.doanhThu || 0).toLocaleString("vi-VN")} đ
          </strong>
        </p>
        <p className="text-slate-600 flex items-center justify-between gap-4">
          <span>Số phiếu tiếp nhận:</span>
          <strong className="font-mono text-slate-900">{item.phieu || 0} phiếu</strong>
        </p>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("week");
  const [chartMetric, setChartMetric] = useState("doanhThu");

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 350);
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);

  const handleRefresh = async (targetPeriod = period) => {
    try {
      setLoading(true);
      const res = await dashboardApi.getSummary(targetPeriod);
      if (res?.success && res.data) {
        setSummary(res.data);
      } else {
        toast.error(res?.message || "Không tải được dữ liệu thống kê");
      }
    } catch (err) {
      toast.error(err.message || "Lỗi kết nối máy chủ");
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (newPeriod) => {
    if (newPeriod === period) return;
    setLoading(true);
    setPeriod(newPeriod);
  };

  useEffect(() => {
    let cancelled = false;
    dashboardApi
      .getSummary(period)
      .then((res) => {
        if (cancelled) return;
        if (res?.success && res.data) {
          setSummary(res.data);
        } else {
          toast.error(res?.message || "Không tải được dữ liệu thống kê");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          toast.error(err.message || "Lỗi kết nối máy chủ");
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
  }, [period]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const trimmed = debouncedSearch.trim();
    if (!trimmed) return;

    let cancelled = false;
    repairApi
      .getAllRepairs("", trimmed)
      .then((res) => {
        if (!cancelled && res?.success) {
          setSuggestions((res.data || []).slice(0, 6));
          setShowDropdown(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSuggestions([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setSearching(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedSearch]);

  const periodTotals = useMemo(() => {
    const data = summary?.chartData || [];
    return {
      revenue: data.reduce((sum, d) => sum + Number(d.doanhThu || 0), 0),
      tickets: data.reduce((sum, d) => sum + Number(d.phieu || 0), 0)
    };
  }, [summary]);

  const totalStatusCount = useMemo(() => {
    const list = summary?.statusDistribution || [];
    return list.reduce((sum, s) => sum + (s.count || 0), 0);
  }, [summary]);

  const todayFormatted = useMemo(() => {
    return format(new Date(), "EEEE, dd/MM/yyyy", { locale: vi });
  }, []);

  return (
    <div className="space-y-4">
      {/* header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Tổng quan cửa hàng
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Xin chào <strong className="text-slate-700">{user?.fullName || "Nhân viên"}</strong>
            <span className="mx-1.5">•</span>
            <span className="text-blue-600 font-semibold">
              {user?.position || (user?.role === "Admin" ? "Quản trị viên" : "Kỹ thuật viên")}
            </span>
            <span className="mx-1.5">•</span>
            <span className="capitalize">{todayFormatted}</span>
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative w-full sm:w-72" ref={searchRef}>
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Tìm nhanh mã phiếu, SĐT, tên máy..."
              value={searchTerm}
              onFocus={() => {
                if (searchTerm.trim()) setShowDropdown(true);
              }}
              onChange={(e) => {
                const val = e.target.value;
                setSearchTerm(val);
                if (!val.trim()) {
                  setSuggestions([]);
                  setShowDropdown(false);
                  setSearching(false);
                } else {
                  setSearching(true);
                }
              }}
              className="w-full pl-9 pr-8 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
            />
            {searching && (
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            )}

            {showDropdown && (
              <div className="absolute z-40 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
                {suggestions.length === 0 ? (
                  <div className="p-3 text-center text-xs text-slate-500">
                    Không tìm thấy phiếu phù hợp
                  </div>
                ) : (
                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                    {suggestions.map((item) => {
                      const targetId = item.repairId ?? item.id;
                      const cfg = STATUS_CONFIG[item.status] || {
                        label: item.status,
                        badgeCls: "bg-slate-100 text-slate-700 border-slate-200"
                      };
                      return (
                        <button
                          key={targetId}
                          type="button"
                          onClick={() => {
                            if (targetId) {
                              setShowDropdown(false);
                              navigate(`/repairs/${targetId}`);
                            }
                          }}
                          className="w-full px-3 py-2.5 text-left hover:bg-slate-50 flex items-center justify-between gap-2 transition-colors cursor-pointer"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono text-xs font-bold text-blue-600">
                                {item.repairCode}
                              </span>
                              <span
                                className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${cfg.badgeCls}`}
                              >
                                {cfg.label}
                              </span>
                            </div>
                            <p className="text-xs font-medium text-slate-800 truncate mt-0.5">
                              {item.deviceName}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate">
                              {item.customerName} • {item.customerPhone}
                            </p>
                          </div>
                          <ChevronRight size={15} className="text-slate-400 shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => navigate("/create")}
            className="flex items-center justify-center space-x-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm transition-colors shrink-0 cursor-pointer"
          >
            <Plus size={16} />
            <span>Tiếp nhận máy</span>
          </button>
        </div>
      </div>

      {/* card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => navigate("/repairs")}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 transition-colors cursor-pointer flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-semibold text-slate-500">Đang xử lý</p>
            <p className="text-2xl font-bold text-slate-900 mt-1 font-mono">
              {loading && !summary ? "-" : summary?.totalPending ?? 0}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Phiếu tiếp nhận, báo giá & đang sửa
            </p>
          </div>
          <div className="text-amber-500 shrink-0">
            <Wrench size={26} strokeWidth={2.2} />
          </div>
        </div>

        <div
          onClick={() => navigate("/repairs")}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 transition-colors cursor-pointer flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-semibold text-slate-500">Đã hoàn thành</p>
            <p className="text-2xl font-bold text-slate-900 mt-1 font-mono">
              {loading && !summary ? "-" : summary?.totalCompleted ?? 0}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Máy đã sửa xong & đã trả khách
            </p>
          </div>
          <div className="text-emerald-500 shrink-0">
            <BadgeCheck size={28} strokeWidth={2.2} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <p className="text-xs font-semibold text-slate-500">Tổng doanh thu</p>
            <p className="text-2xl font-bold text-blue-600 mt-1 font-mono truncate">
              {loading && !summary
                ? "-"
                : `${Number(summary?.totalRevenue || 0).toLocaleString("vi-VN")} đ`}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Doanh thu ghi nhận từ hóa đơn
            </p>
          </div>
          <div className="text-blue-600 shrink-0">
            <Banknote size={26} strokeWidth={2.2} />
          </div>
        </div>

        <div
          onClick={() => navigate("/customers")}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 transition-colors cursor-pointer flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-semibold text-slate-500">Khách hàng</p>
            <p className="text-2xl font-bold text-slate-900 mt-1 font-mono">
              {loading && !summary ? "-" : summary?.newCustomers ?? 0}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Tổng hồ sơ khách trong hệ thống
            </p>
          </div>
          <div className="text-purple-600 shrink-0">
            <UserCheck size={26} strokeWidth={2.2} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <BarChart3 size={17} className="text-blue-600" />
                <span>Biểu đồ hoạt động theo thời gian</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Trong kỳ:{" "}
                <strong className="text-blue-600 font-mono">
                  {periodTotals.revenue.toLocaleString("vi-VN")} đ
                </strong>{" "}
                • <strong className="text-slate-700">{periodTotals.tickets}</strong> phiếu tiếp nhận
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setChartMetric("doanhThu")}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                    chartMetric === "doanhThu"
                      ? "bg-white text-blue-600 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Doanh thu
                </button>
                <button
                  type="button"
                  onClick={() => setChartMetric("phieu")}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                    chartMetric === "phieu"
                      ? "bg-white text-blue-600 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Số phiếu
                </button>
              </div>

              <div className="inline-flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                {PERIOD_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handlePeriodChange(opt.id)}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                      period === opt.id
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => handleRefresh(period)}
                disabled={loading}
                title="Làm mới dữ liệu"
                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              </button>
            </div>
          </div>

          <div className="h-[290px] w-full pt-4">
            {loading && !summary ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Đang tải dữ liệu biểu đồ...
              </div>
            ) : !summary?.chartData || summary.chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Chưa có dữ liệu trong khoảng thời gian này
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                {chartMetric === "doanhThu" ? (
                  <AreaChart
                    data={summary.chartData}
                    margin={{ top: 10, right: 12, left: -10, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="revenueAreaFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 11 }}
                      dy={6}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 11 }}
                      tickFormatter={formatCompactMoney}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="doanhThu"
                      stroke="#2563eb"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#revenueAreaFill)"
                      activeDot={{ r: 5, fill: "#2563eb", stroke: "#fff", strokeWidth: 2 }}
                    />
                  </AreaChart>
                ) : (
                  <BarChart
                    data={summary.chartData}
                    margin={{ top: 10, right: 12, left: -15, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 11 }}
                      dy={6}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                      tick={{ fill: "#64748b", fontSize: 11 }}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar
                      dataKey="phieu"
                      fill="#2563eb"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={36}
                    />
                  </BarChart>
                )}
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <PieChartIcon size={17} className="text-blue-600" />
              <span>Phân bố trạng thái phiếu</span>
            </h2>
            <span className="text-xs font-semibold text-slate-500">
              Tổng: {totalStatusCount}
            </span>
          </div>

          <div className="flex-1 pt-4 space-y-3">
            {!summary?.statusDistribution || summary.statusDistribution.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Chưa có dữ liệu trạng thái
              </div>
            ) : (
              summary.statusDistribution.map((item) => {
                const cfg = STATUS_CONFIG[item.status] || {
                  label: item.label || item.status,
                  barBg: "bg-slate-400",
                  dotCls: "bg-slate-400"
                };
                const pct =
                  totalStatusCount > 0
                    ? Math.round((item.count / totalStatusCount) * 100)
                    : 0;

                return (
                  <div key={item.status} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2 min-w-0">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dotCls}`} />
                        <span className="text-slate-700 font-medium truncate">
                          {cfg.label}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 shrink-0 font-mono">
                        <span className="font-bold text-slate-900">{item.count}</span>
                        <span className="text-[11px] text-slate-400 w-9 text-right">
                          ({pct}%)
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${cfg.barBg}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-4 mt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate("/repairs")}
              className="w-full py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200 transition-colors flex items-center justify-center space-x-1 cursor-pointer"
            >
              <span>Đi đến danh sách phiếu sửa chữa</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock size={17} className="text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">Phiếu tiếp nhận gần đây</h2>
          </div>

          <button
            type="button"
            onClick={() => navigate("/repairs")}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center space-x-1 cursor-pointer"
          >
            <span>Xem tất cả</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-bold text-slate-700">
              <tr>
                <th className="py-3 px-4">Mã phiếu</th>
                <th className="py-3 px-4">Thiết bị</th>
                <th className="py-3 px-4">Khách hàng</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-right">Tổng tiền</th>
                <th className="py-3 px-4">Thời gian</th>
                <th className="py-3 px-4 text-center">Xem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && !summary ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-slate-400">
                    Đang tải danh sách phiếu mới nhất...
                  </td>
                </tr>
              ) : !summary?.recentRepairs || summary.recentRepairs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-slate-400">
                    Chưa có phiếu sửa chữa nào trong hệ thống.
                  </td>
                </tr>
              ) : (
                summary.recentRepairs.map((r) => {
                  const cfg = STATUS_CONFIG[r.status] || {
                    label: r.status,
                    badgeCls: "bg-slate-100 text-slate-800 border-slate-200"
                  };

                  return (
                    <tr
                      key={r.id}
                      onClick={() => navigate(`/repairs/${r.id}`)}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-blue-600 text-xs whitespace-nowrap">
                        {r.code}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {r.device}
                      </td>
                      <td className="py-3 px-4 text-slate-700 text-xs">
                        {r.customer}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${cfg.badgeCls}`}
                        >
                          {cfg.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-800 whitespace-nowrap text-xs">
                        {Number(r.totalAmount || 0).toLocaleString("vi-VN")} đ
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
                        {r.time}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/repairs/${r.id}`);
                          }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 rounded hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Xem chi tiết"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
