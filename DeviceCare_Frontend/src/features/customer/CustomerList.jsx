import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Contact2,
  Search,
  UserPlus2,
  PencilLine,
  Trash,
  PhoneCall,
  MapPin,
  X,
  Check,
  Receipt,
  Hammer,
  UserX
} from "lucide-react";
import customerApi from "../../api/customerApi";
import ConfirmModal from "../../components/ConfirmModal";
import useDebounce from "../../hooks/useDebounce";
import toast from "react-hot-toast";

const CustomerList = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [customerRepairs, setCustomerRepairs] = useState([]);
  const [loadingRepairs, setLoadingRepairs] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    address: "",
    note: ""
  });
  const [saving, setSaving] = useState(false);

  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, id: null });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await customerApi.getAll();
      if (res?.success) {
        setCustomers(res.data || []);
      }
    } catch (error) {
      toast.error(error.message || "Lỗi khi tải danh sách khách hàng");
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (customer = null) => {
    setCurrentCustomer(customer);
    if (customer) {
      setFormData({
        fullName: customer.fullName || "",
        phoneNumber: customer.phoneNumber || "",
        address: customer.address || "",
        note: customer.note || ""
      });
    } else {
      setFormData({ fullName: "", phoneNumber: "", address: "", note: "" });
    }
    setIsEditModalOpen(true);
  };

  const openDetailModal = async (customer) => {
    setCurrentCustomer(customer);
    setIsDetailModalOpen(true);
    setLoadingRepairs(true);
    try {
      const res = await customerApi.getRepairs(customer.customerId);
      if (res?.success) {
        setCustomerRepairs(res.data || []);
      }
    } catch {
      toast.error("Không tải được lịch sử sửa chữa của khách hàng");
    } finally {
      setLoadingRepairs(false);
    }
  };

  const closeModals = () => {
    setIsEditModalOpen(false);
    setIsDetailModalOpen(false);
    setCurrentCustomer(null);
    setCustomerRepairs([]);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Lưu thông tin khách hàng
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      return toast.error("Vui lòng nhập họ tên khách hàng");
    }
    if (!formData.phoneNumber.trim()) {
      return toast.error("Vui lòng nhập số điện thoại");
    }
    const phoneRegex = /^0\d{9}$/;
    if (!phoneRegex.test(formData.phoneNumber.trim())) {
      return toast.error("Số điện thoại phải gồm 10 chữ số và bắt đầu bằng số 0");
    }

    setSaving(true);
    try {
      if (currentCustomer) {
        await customerApi.update(currentCustomer.customerId, formData);
        toast.success("Cập nhật thông tin khách hàng thành công");
      } else {
        await customerApi.create(formData);
        toast.success("Thêm mới khách hàng thành công");
      }
      closeModals();
      fetchCustomers();
    } catch (error) {
      toast.error(error.message || "Có lỗi xảy ra khi lưu khách hàng");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    try {
      await customerApi.delete(confirmConfig.id);
      toast.success("Xóa khách hàng thành công");
      fetchCustomers();
    } catch (error) {
      toast.error(error.message || "Không thể xóa khách hàng");
    }
  };

  const renderStatusBadge = (status) => {
    const map = {
      Received: { text: "Mới tiếp nhận", cls: "bg-blue-100 text-blue-800" },
      Quoted: { text: "Đã báo giá", cls: "bg-purple-100 text-purple-800" },
      Repairing: { text: "Đang sửa chữa", cls: "bg-amber-100 text-amber-800" },
      Completed: { text: "Đã hoàn thành", cls: "bg-emerald-100 text-emerald-800" },
      Returned: { text: "Đã trả máy", cls: "bg-slate-100 text-slate-800" },
      CannotRepair: { text: "Không sửa được", cls: "bg-red-100 text-red-800" }
    };
    const s = map[status] || { text: status, cls: "bg-gray-100 text-gray-800" };
    return (
      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${s.cls}`}>
        {s.text}
      </span>
    );
  };

  const filteredCustomers = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.fullName?.toLowerCase().includes(q) ||
        c.phoneNumber?.includes(q) ||
        c.address?.toLowerCase().includes(q)
    );
  }, [customers, debouncedSearch]);

  return (
    <div className="space-y-4">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <Contact2 className="text-blue-600" size={22} />
            <span>Quản lý khách hàng</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tổng số: <strong>{filteredCustomers.length}</strong> khách hàng trong hệ thống
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
              placeholder="Tìm theo tên, SĐT, địa chỉ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 450, damping: 25 }}
            onClick={() => openEditModal()}
            className="flex items-center space-x-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg transition-colors shrink-0 shadow-sm cursor-pointer"
          >
            <UserPlus2 size={16} />
            <span>Thêm khách hàng</span>
          </motion.button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-sm">Đang tải danh sách khách hàng...</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <Contact2 size={40} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-700">Không tìm thấy khách hàng nào</p>
            <p className="text-xs text-slate-400 mt-1">Hãy thử tìm từ khóa khác hoặc bấm nút Thêm khách hàng</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Mã KH</th>
                  <th className="py-3 px-4">Họ và tên</th>
                  <th className="py-3 px-4">Số điện thoại</th>
                  <th className="py-3 px-4">Địa chỉ</th>
                  <th className="py-3 px-4 text-center">Số lần sửa</th>
                  <th className="py-3 px-4 text-center">Ghi chú</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredCustomers.map((customer) => (
                  <tr
                    key={customer.customerId}
                    className="hover:bg-blue-50/50 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono text-xs font-semibold text-slate-500">
                      KH-{String(customer.customerId).padStart(4, "0")}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block">
                        {customer.fullName}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <a
                        href={`tel:${customer.phoneNumber}`}
                        className="inline-flex items-center text-blue-600 hover:text-blue-800 hover:underline font-medium text-xs group"
                      >
                        <PhoneCall size={13} className="mr-1 group-hover:scale-110 transition-transform" />
                        <span>{customer.phoneNumber}</span>
                      </a>
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-xs max-w-xs truncate">
                      {customer.address ? (
                        <span className="inline-flex items-center">
                          <MapPin size={13} className="mr-1 text-slate-400 shrink-0" />
                          <span className="truncate">{customer.address}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Chưa cập nhật</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {customer.totalRepairs || 0}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500 max-w-xs truncate text-center">
                      {customer.note || "-"}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1">
                        <motion.button
                          whileTap={{ scale: 0.88 }}
                          transition={{ type: "spring", stiffness: 500, damping: 25 }}
                          onClick={() => openDetailModal(customer)}
                          title="Xem lịch sử sửa chữa"
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                        >
                          <Receipt size={16} />
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.88 }}
                          transition={{ type: "spring", stiffness: 500, damping: 25 }}
                          onClick={() => openEditModal(customer)}
                          title="Sửa thông tin"
                          className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                        >
                          <PencilLine size={16} />
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.88 }}
                          transition={{ type: "spring", stiffness: 500, damping: 25 }}
                          onClick={() =>
                            setConfirmConfig({ isOpen: true, id: customer.customerId })
                          }
                          title="Xóa khách hàng"
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                        >
                          <Trash size={16} />
                        </motion.button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
              onClick={closeModals}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              transition={{ type: "spring", stiffness: 420, damping: 28 }}
              className="relative bg-white rounded-xl shadow-2xl w-full max-w-md border border-slate-200 z-10 overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <h2 className="text-base font-bold text-slate-900">
                  {currentCustomer ? "Cập nhật thông tin khách hàng" : "Thêm mới khách hàng"}
                </h2>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={closeModals}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer transition-colors"
                >
                  <X size={18} />
                </motion.button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Họ và tên *
                  </label>
                  <input
                    type="text"
                    required
                    name="fullName"
                    placeholder="Ví dụ: Nguyễn Văn A"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Số điện thoại *
                  </label>
                  <input
                    type="text"
                    required
                    name="phoneNumber"
                    placeholder="Ví dụ: 0912345678"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">10 chữ số, bắt đầu bằng số 0</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Địa chỉ
                  </label>
                  <input
                    type="text"
                    name="address"
                    placeholder="Ví dụ: 123 Võ Văn Ngân, TP. Thủ Đức"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Ghi chú
                  </label>
                  <textarea
                    name="note"
                    rows="3"
                    placeholder="Thông tin thêm về thói quen hoặc yêu cầu của khách..."
                    value={formData.note}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white resize-none"
                  />
                </div>

                <div className="pt-2 flex justify-end space-x-3">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={closeModals}
                    className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
                  >
                    Hủy bỏ
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.96 }}
                    type="submit"
                    disabled={saving}
                    className="flex items-center space-x-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 cursor-pointer shadow-sm"
                  >
                    <Check size={16} />
                    <span>{saving ? "Đang lưu..." : "Lưu dữ liệu"}</span>
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isDetailModalOpen && currentCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
              onClick={closeModals}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              transition={{ type: "spring", stiffness: 420, damping: 28 }}
              className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl border border-slate-200 z-10 overflow-hidden max-h-[85vh] flex flex-col"
            >
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                    <span>Khách hàng: {currentCustomer.fullName}</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    SĐT: {currentCustomer.phoneNumber} {currentCustomer.address && `• ${currentCustomer.address}`}
                  </p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={closeModals}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer transition-colors"
                >
                  <X size={18} />
                </motion.button>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">
                  Lịch sử các lần sửa chữa máy
                </h3>

                {loadingRepairs ? (
                  <div className="py-12 text-center text-slate-500 text-sm">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Đang tải lịch sử phiếu...
                  </div>
                ) : customerRepairs.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-sm bg-slate-50 rounded-lg border border-dashed border-slate-200">
                    <Hammer size={32} className="mx-auto text-slate-300 mb-2" />
                    Khách hàng này chưa có phiếu sửa chữa nào trong hệ thống
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase">
                        <tr>
                          <th className="py-2.5 px-3">Mã phiếu</th>
                          <th className="py-2.5 px-3">Thiết bị</th>
                          <th className="py-2.5 px-3">Trạng thái</th>
                          <th className="py-2.5 px-3">Ngày nhận</th>
                          <th className="py-2.5 px-3 text-right">Chi phí</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {customerRepairs.map((r) => (
                          <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-2.5 px-3 font-mono font-bold text-blue-600">
                              {r.repairCode}
                            </td>
                            <td className="py-2.5 px-3 font-medium text-slate-800">
                              {r.deviceName}
                            </td>
                            <td className="py-2.5 px-3">
                              {renderStatusBadge(r.status)}
                            </td>
                            <td className="py-2.5 px-3 text-slate-500">
                              {r.createdAt ? new Date(r.createdAt).toLocaleDateString("vi-VN") : "-"}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                              {Number(r.totalAmount || 0).toLocaleString("vi-VN")} đ
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end shrink-0">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={closeModals}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  Đóng
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Popup xác nhận xóa */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig({ isOpen: false, id: null })}
        onConfirm={confirmDelete}
        title="Xác nhận xóa khách hàng"
        message="Hệ thống sẽ chuyển khách hàng sang trạng thái ẩn để bảo toàn toàn bộ lịch sử các phiếu sửa chữa trước đây."
        confirmText="Xóa khách hàng"
        icon={UserX}
      />
    </div>
  );
};

export default CustomerList;
