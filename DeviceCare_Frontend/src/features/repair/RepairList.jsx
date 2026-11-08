import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ScrollText,
  Search,
  Plus,
  Trash2,
  Eye,
  Filter,
  PhoneCall,
  Smartphone,
  Clock
} from "lucide-react";
import repairApi from "../../api/repairApi";
import ConfirmModal from "../../components/ConfirmModal";
import useDebounce from "../../hooks/useDebounce";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import toast from "react-hot-toast";

const STATUS_CONFIG = {
  Received: { label: "Mới nhận", cls: "bg-blue-100 text-blue-800 border-blue-200" },
  Quoted: { label: "Đã báo giá", cls: "bg-purple-100 text-purple-800 border-purple-200" },
  Repairing: { label: "Đang sửa", cls: "bg-amber-100 text-amber-800 border-amber-200" },
  Completed: { label: "Đã sửa xong", cls: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  Returned: { label: "Đã trả khách", cls: "bg-slate-100 text-slate-800 border-slate-300" },
  Cancelled: { label: "Đã hủy", cls: "bg-rose-100 text-rose-800 border-rose-200" },
  CannotRepair: { label: "Không sửa được", cls: "bg-red-100 text-red-800 border-red-200" }
};

const RepairList = () => {
  const navigate = useNavigate();
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const [activeTab, setActiveTab] = useState("all");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    id: null,
    code: ""
  });

  const fetchRepairs = async (searchTerm = debouncedSearch) => {
    try {
      setLoading(true);
      const res = await repairApi.getAllRepairs("", searchTerm);
      if (res?.success) {
        setRepairs(res.data || []);
      }
    } catch {
      toast.error("Không tải được danh sách phiếu sửa chữa");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepairs(debouncedSearch);
  }, [debouncedSearch]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, statusFilter, search]);

  const renderStatusBadge = (status) => {
    const config = STATUS_CONFIG[status] || {
      label: status,
      cls: "bg-gray-100 text-gray-800 border-gray-200"
    };
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${config.cls}`}
      >
        {config.label}
      </span>
    );
  };

  const filteredRepairs = useMemo(() => {
    return repairs.filter((r) => {
      const isActive = ["Received", "Quoted", "Repairing", "Completed"].includes(r.status);
      const isHistory = ["Returned", "Cancelled"].includes(r.status);
      const isFailed = ["CannotRepair"].includes(r.status);

      if (activeTab === "active" && !isActive) return false;
      if (activeTab === "history" && !isHistory) return false;
      if (activeTab === "failed" && !isFailed) return false;

      if (statusFilter && r.status !== statusFilter) return false;

      return true;
    });
  }, [repairs, activeTab, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRepairs.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedRepairs = useMemo(() => {
    return filteredRepairs.slice(startIndex, startIndex + pageSize);
  }, [filteredRepairs, startIndex, pageSize]);

  const counts = useMemo(() => {
    return {
      all: repairs.length,
      active: repairs.filter((r) =>
        ["Received", "Quoted", "Repairing", "Completed"].includes(r.status)
      ).length,
      history: repairs.filter((r) =>
        ["Returned", "Cancelled"].includes(r.status)
      ).length,
      failed: repairs.filter((r) => ["CannotRepair"].includes(r.status)).length
    };
  }, [repairs]);

  const handleDelete = async () => {
    if (!confirmConfig.id) return;
    try {
      const res = await repairApi.deleteRepair(confirmConfig.id);
      if (res?.success) {
        toast.success(`Đã xóa phiếu ${confirmConfig.code}`);
        fetchRepairs();
      } else {
        toast.error(res?.message || "Không thể xóa phiếu");
      }
    } catch (err) {
      toast.error(err.message || "Lỗi máy chủ khi xóa phiếu");
    } finally {
      setConfirmConfig({ isOpen: false, id: null, code: "" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <ScrollText className="text-blue-600" size={22} />
            <span>Quản lý phiếu sửa chữa</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tổng cộng: <strong>{filteredRepairs.length}</strong> phiếu trong hệ thống
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative w-full md:w-72">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Tìm theo mã phiếu, SĐT, tên máy..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
            />
          </div>

          <button
            onClick={() => navigate("/create")}
            className="flex items-center space-x-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg transition-colors shrink-0 shadow-sm cursor-pointer"
          >
            <Plus size={16} />
            <span>Tiếp nhận máy</span>
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: "Tất cả", count: counts.all },
            { id: "active", label: "Đang xử lý", count: counts.active },
            { id: "history", label: "Hoàn tất", count: counts.history },
            { id: "failed", label: "Không sửa được", count: counts.failed }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setStatusFilter("");
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center space-x-1.5 cursor-pointer ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white"
                  : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeTab === tab.id
                    ? "bg-blue-700 text-white"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <Filter size={15} className="text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:border-blue-600 focus:bg-white cursor-pointer"
          >
            <option value="">-- Lọc theo trạng thái --</option>
            {activeTab === "all" &&
              Object.entries(STATUS_CONFIG).map(([key, val]) => (
                <option key={key} value={key}>
                  {val.label}
                </option>
              ))}
            {activeTab === "active" && (
              <>
                <option value="Received">Mới nhận</option>
                <option value="Quoted">Đã báo giá</option>
                <option value="Repairing">Đang sửa</option>
                <option value="Completed">Đã sửa xong</option>
              </>
            )}
            {activeTab === "history" && (
              <>
                <option value="Returned">Đã trả khách</option>
                <option value="Cancelled">Đã hủy</option>
              </>
            )}
            {activeTab === "failed" && (
              <option value="CannotRepair">Không sửa được</option>
            )}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-sm">Đang tải danh sách phiếu sửa chữa...</p>
          </div>
        ) : filteredRepairs.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <ScrollText size={40} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-700">
              Không tìm thấy phiếu sửa chữa nào
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Thử tìm từ khóa khác hoặc bấm nút "Tiếp nhận máy" để tạo mới.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Mã phiếu</th>
                  <th className="py-3 px-4">Khách hàng</th>
                  <th className="py-3 px-4">Thiết bị</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Tổng tiền</th>
                  <th className="py-3 px-4">Ngày tiếp nhận</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {paginatedRepairs.map((r) => {
                  const itemRepairId = r.id || r.repairId;
                  return (
                    <tr
                      key={itemRepairId || r.repairCode}
                      className="hover:bg-blue-50/50 transition-colors cursor-pointer"
                      onClick={() =>
                        itemRepairId && navigate(`/repairs/${itemRepairId}`)
                      }
                    >
                      <td className="py-3 px-4 font-mono text-xs font-bold text-blue-600">
                        {r.repairCode}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">
                          {r.customerName || "Khách vãng lai"}
                        </div>
                        {r.customerPhone && (
                          <div className="text-xs text-slate-500 flex items-center space-x-1 mt-0.5">
                            <PhoneCall size={12} className="text-slate-400" />
                            <span>{r.customerPhone}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-slate-800 flex items-center space-x-1.5">
                          <Smartphone size={14} className="text-slate-400 shrink-0" />
                          <span className="truncate">{r.deviceName}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {renderStatusBadge(r.status)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {Number(r.totalAmount || 0).toLocaleString("vi-VN")} đ
                      </td>

                      <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
                        <div className="flex items-center space-x-1">
                          <Clock size={12} className="text-slate-400" />
                          <span>
                            {r.createdAt
                              ? format(new Date(r.createdAt), "dd/MM/yyyy HH:mm", {
                                  locale: vi
                                })
                              : "-"}
                          </span>
                        </div>
                      </td>

                      <td
                        className="py-3 px-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() =>
                              itemRepairId && navigate(`/repairs/${itemRepairId}`)
                            }
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Xem chi tiết"
                          >
                            <Eye size={16} />
                          </button>

                          {["Received", "Cancelled", "CannotRepair"].includes(r.status) && (
                            <button
                              onClick={() =>
                                setConfirmConfig({
                                  isOpen: true,
                                  id: itemRepairId,
                                  code: r.repairCode
                                })
                              }
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Xóa phiếu"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {filteredRepairs.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div>
              Hiển thị{" "}
              <strong>
                {startIndex + 1} -{" "}
                {Math.min(startIndex + pageSize, filteredRepairs.length)}
              </strong>{" "}
              của <strong>{filteredRepairs.length}</strong> phiếu
            </div>

            <div className="flex items-center space-x-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors cursor-pointer"
              >
                Trước
              </button>

              <span className="px-3 py-1.5 font-semibold text-slate-800">
                {currentPage} / {totalPages}
              </span>

              <button
                disabled={currentPage >= totalPages}
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                className="px-3 py-1.5 rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors cursor-pointer"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig({ isOpen: false, id: null, code: "" })}
        onConfirm={handleDelete}
        title="Xác nhận xóa phiếu"
        message={`Bạn có chắc muốn xóa phiếu "${confirmConfig.code}"? Dữ liệu không thể khôi phục.`}
        confirmText="Xóa phiếu"
        cancelText="Đóng"
        isDanger={true}
      />
    </div>
  );
};

export default RepairList;
