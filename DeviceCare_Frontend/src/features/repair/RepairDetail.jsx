import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  PhoneCall,
  MapPin,
  Plus,
  Trash2,
  Edit3,
  Save,
  X,
  Printer,
  Receipt,
  Cpu,
  Clock,
  ExternalLink,
  AlertTriangle,
  Check,
  Search,
  Award
} from "lucide-react";
import repairApi from "../../api/repairApi";
import inventoryApi from "../../api/inventoryApi";
import ConfirmModal from "../../components/ConfirmModal";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import toast from "react-hot-toast";

const STATUS_CONFIG = {
  Received: {
    label: "Mới tiếp nhận",
    cls: "bg-blue-100 text-blue-800 border-blue-200",
    badgeCls: "bg-blue-100 text-blue-800 border-blue-200",
    btnCls: "bg-blue-600 hover:bg-blue-700 text-white",
    barBg: "bg-blue-600",
    textColor: "text-blue-600",
    ringCls: "ring-blue-100",
    borderCls: "border-blue-500"
  },
  Quoted: {
    label: "Đã báo giá",
    cls: "bg-purple-100 text-purple-800 border-purple-200",
    badgeCls: "bg-purple-100 text-purple-800 border-purple-200",
    btnCls: "bg-purple-600 hover:bg-purple-700 text-white",
    barBg: "bg-purple-600",
    textColor: "text-purple-600",
    ringCls: "ring-purple-100",
    borderCls: "border-purple-500"
  },
  Repairing: {
    label: "Đang sửa chữa",
    cls: "bg-amber-100 text-amber-800 border-amber-200",
    badgeCls: "bg-amber-100 text-amber-800 border-amber-200",
    btnCls: "bg-amber-600 hover:bg-amber-700 text-white",
    barBg: "bg-amber-600",
    textColor: "text-amber-600",
    ringCls: "ring-amber-100",
    borderCls: "border-amber-500"
  },
  Completed: {
    label: "Đã sửa xong",
    cls: "bg-emerald-100 text-emerald-800 border-emerald-200",
    badgeCls: "bg-emerald-100 text-emerald-800 border-emerald-200",
    btnCls: "bg-emerald-600 hover:bg-emerald-700 text-white",
    barBg: "bg-emerald-600",
    textColor: "text-emerald-600",
    ringCls: "ring-emerald-100",
    borderCls: "border-emerald-500"
  },
  Returned: {
    label: "Đã bàn giao khách",
    cls: "bg-slate-100 text-slate-800 border-slate-300",
    badgeCls: "bg-slate-100 text-slate-800 border-slate-300",
    btnCls: "bg-slate-700 hover:bg-slate-800 text-white",
    barBg: "bg-slate-700",
    textColor: "text-slate-700",
    ringCls: "ring-slate-200",
    borderCls: "border-slate-500"
  },
  Cancelled: {
    label: "Đã hủy phiếu",
    cls: "bg-rose-100 text-rose-800 border-rose-200",
    badgeCls: "bg-rose-100 text-rose-800 border-rose-200",
    btnCls: "bg-rose-600 hover:bg-rose-700 text-white",
    barBg: "bg-rose-600",
    textColor: "text-rose-600",
    ringCls: "ring-rose-100",
    borderCls: "border-rose-500"
  },
  CannotRepair: {
    label: "Không sửa được",
    cls: "bg-red-100 text-red-800 border-red-200",
    badgeCls: "bg-red-100 text-red-800 border-red-200",
    btnCls: "bg-red-600 hover:bg-red-700 text-white",
    barBg: "bg-red-600",
    textColor: "text-red-600",
    ringCls: "ring-red-100",
    borderCls: "border-red-500"
  }
};

const WORKFLOW_STEPS = [
  { id: "Received", label: "Tiếp nhận" },
  { id: "Quoted", label: "Báo giá" },
  { id: "Repairing", label: "Đang sửa" },
  { id: "Completed", label: "Đã sửa xong" },
  { id: "Returned", label: "Đã trả khách" }
];

const RepairDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [repair, setRepair] = useState(null);
  const [loading, setLoading] = useState(true);

  const [editingInfo, setEditingInfo] = useState(false);
  const [infoForm, setInfoForm] = useState({
    deviceName: "",
    errorDescription: "",
    note: "",
    laborCost: 0
  });

  const [inventories, setInventories] = useState([]);
  const [showPartModal, setShowPartModal] = useState(false);
  const [selectedInventoryId, setSelectedInventoryId] = useState("");
  const [partSearchTerm, setPartSearchTerm] = useState("");
  const [partQuantity, setPartQuantity] = useState(1);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [addingPart, setAddingPart] = useState(false);
  const dropdownRef = useRef(null);

  const [cannotRepairModal, setCannotRepairModal] = useState({
    isOpen: false,
    reason: ""
  });

  const [checkoutModal, setCheckoutModal] = useState({
    isOpen: false,
    paymentMethod: "Cash",
    warrantyDays: 30,
    terms: "Bảo hành linh kiện thay thế 1 đổi 1. Không bảo hành rơi vỡ, vào nước.",
    note: ""
  });
  const [checkingOut, setCheckingOut] = useState(false);

  const [zoomedImage, setZoomedImage] = useState(null);

  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
    isDanger: true
  });

  const fetchRepairDetail = async () => {
    if (!id || id === "undefined" || isNaN(Number(id))) {
      return;
    }
    try {
      setLoading(true);
      const res = await repairApi.getRepairDetail(id);
      if (res?.success && res.data) {
        setRepair(res.data);
        setInfoForm({
          deviceName: res.data.deviceName || "",
          errorDescription: res.data.errorDescription || "",
          note: res.data.note || "",
          laborCost: res.data.laborCost || 0
        });
      } else {
        toast.error(res?.message || "Không tìm thấy thông tin phiếu sửa chữa");
        navigate("/repairs");
      }
    } catch {
      toast.error("Lỗi khi tải chi tiết phiếu sửa chữa");
      navigate("/repairs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id || id === "undefined" || isNaN(Number(id))) {
      toast.error("Mã phiếu sửa chữa không hợp lệ");
      navigate("/repairs");
      return;
    }
    fetchRepairDetail();
  }, [id]);

  useEffect(() => {
    if (showPartModal) {
      inventoryApi
        .getAll()
        .then((res) => {
          if (res?.success && res.data) {
            setInventories(res.data.filter((item) => item.quantity > 0));
          }
        })
        .catch(() => {});
    }
  }, [showPartModal]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleUpdateStatus = (newStatus, note = null) => {
    const targetStatus = STATUS_CONFIG[newStatus]?.label || newStatus;
    setConfirmConfig({
      isOpen: true,
      title: "Chuyển trạng thái phiếu",
      message: `Bạn có chắc muốn chuyển phiếu này sang: "${targetStatus}"?`,
      isDanger: false,
      onConfirm: async () => {
        try {
          const res = await repairApi.updateStatus(id, { newStatus, note });
          if (res?.success) {
            toast.success(`Đã cập nhật trạng thái: ${targetStatus}`);
            fetchRepairDetail();
          } else {
            toast.error(res?.message || "Không thể chuyển trạng thái");
          }
        } catch (err) {
          toast.error(err.message || "Lỗi khi cập nhật trạng thái");
        }
      }
    });
  };

  const handleSaveInfo = async () => {
    try {
      const payload = {
        deviceName: infoForm.deviceName.trim(),
        errorDescription: infoForm.errorDescription?.trim() || null,
        note: infoForm.note?.trim() || null,
        laborCost: Number(infoForm.laborCost) || 0
      };
      const res = await repairApi.updateRepair(id, payload);
      if (res?.success) {
        toast.success("Đã cập nhật thông tin thành công");
        setEditingInfo(false);
        fetchRepairDetail();
      } else {
        toast.error(res?.message || "Lỗi khi cập nhật");
      }
    } catch (err) {
      toast.error(err.message || "Lỗi máy chủ khi cập nhật");
    }
  };

  const handleOpenAddPartModal = () => {
    setSelectedInventoryId("");
    setPartSearchTerm("");
    setPartQuantity(1);
    setIsDropdownOpen(false);
    setShowPartModal(true);
  };

  const handleAddPart = async (e) => {
    e.preventDefault();
    if (!selectedInventoryId) {
      toast.error("Vui lòng chọn linh kiện từ danh sách");
      return;
    }
    setAddingPart(true);
    try {
      const res = await repairApi.addPart(id, {
        inventoryId: Number(selectedInventoryId),
        quantity: Number(partQuantity)
      });
      if (res?.success) {
        toast.success("Đã thêm linh kiện và trừ kho thành công");
        setShowPartModal(false);
        setSelectedInventoryId("");
        setPartSearchTerm("");
        setPartQuantity(1);
        fetchRepairDetail();
      } else {
        toast.error(res?.message || "Không thể thêm linh kiện");
      }
    } catch (err) {
      toast.error(err.message || "Lỗi khi thêm linh kiện");
    } finally {
      setAddingPart(false);
    }
  };

  const handleRemovePart = (partId, partName) => {
    setConfirmConfig({
      isOpen: true,
      title: "Gỡ linh kiện",
      message: `Bạn có chắc muốn gỡ linh kiện "${partName}"? Số lượng sẽ được hoàn trả lại vào kho.`,
      isDanger: true,
      onConfirm: async () => {
        try {
          const res = await repairApi.removePart(id, partId);
          if (res?.success) {
            toast.success("Đã gỡ linh kiện và hoàn kho");
            fetchRepairDetail();
          } else {
            toast.error(res?.message || "Không thể gỡ linh kiện");
          }
        } catch (err) {
          toast.error(err.message || "Lỗi khi gỡ linh kiện");
        }
      }
    });
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    setCheckingOut(true);
    try {
      const payload = {
        paymentMethod: checkoutModal.paymentMethod,
        warrantyDays: Number(checkoutModal.warrantyDays) || 0,
        terms: checkoutModal.terms || null,
        note: checkoutModal.note || null
      };
      const res = await repairApi.checkout(id, payload);
      if (res?.success) {
        toast.success("Xuất hóa đơn & trả máy thành công");
        setCheckoutModal((prev) => ({ ...prev, isOpen: false }));
        fetchRepairDetail();
      } else {
        toast.error(res?.message || "Không thể hoàn tất thanh toán");
      }
    } catch (err) {
      toast.error(err.message || "Lỗi khi thanh toán & trả máy");
    } finally {
      setCheckingOut(false);
    }
  };

  const handleCannotRepairSubmit = async (e) => {
    e.preventDefault();
    if (!cannotRepairModal.reason.trim()) {
      toast.error("Vui lòng nhập lý do không thể sửa");
      return;
    }
    try {
      const res = await repairApi.updateStatus(id, {
        newStatus: "CannotRepair",
        note: cannotRepairModal.reason.trim()
      });
      if (res?.success) {
        toast.success("Đã cập nhật trạng thái: Không sửa được");
        setCannotRepairModal({ isOpen: false, reason: "" });
        fetchRepairDetail();
      } else {
        toast.error(res?.message || "Không thể cập nhật");
      }
    } catch (err) {
      toast.error(err.message || "Lỗi khi báo không sửa được");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-500">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm">Đang tải thông tin chi tiết phiếu...</p>
      </div>
    );
  }

  if (!repair) return null;

  const currentStatusConfig = STATUS_CONFIG[repair.status] || {
    label: repair.status,
    cls: "bg-gray-100 text-gray-800 border-gray-200"
  };

  const currentStepIndex = WORKFLOW_STEPS.findIndex((s) => s.id === repair.status);
  const nextStep =
    currentStepIndex >= 0 && currentStepIndex < WORKFLOW_STEPS.length - 1
      ? WORKFLOW_STEPS[currentStepIndex + 1]
      : null;

  const partsTotal =
    repair.repairParts?.reduce(
      (sum, p) => sum + p.price * (p.quantity || p.Quantity || 1),
      0
    ) || 0;

  const isEditable = !["Returned", "Cancelled", "CannotRepair"].includes(repair.status);

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-12">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate("/repairs")}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Quay lại danh sách"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-slate-900 font-mono">
                {repair.repairCode}
              </h1>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${currentStatusConfig.badgeCls || currentStatusConfig.cls}`}
              >
                {currentStatusConfig.label}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Ngày tiếp nhận:{" "}
              {repair.createdAt
                ? format(new Date(repair.createdAt), "dd/MM/yyyy HH:mm", {
                    locale: vi
                  })
                : "-"}
              {repair.receiverEmployeeName && (
                <span className="ml-2">
                  • Người tiếp nhận: <strong>{repair.receiverEmployeeName}</strong>
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {isEditable && (
            <button
              onClick={() => setEditingInfo(!editingInfo)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <Edit3 size={14} />
              <span>{editingInfo ? "Hủy sửa" : "Sửa thông tin"}</span>
            </button>
          )}

          <button
            onClick={() => window.print()}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Printer size={15} className="text-slate-600" />
            <span>In phiếu</span>
          </button>
        </div>
      </div>

      {repair.status !== "Cancelled" && repair.status !== "CannotRepair" && currentStepIndex >= 0 ? (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="relative flex items-center justify-between max-w-3xl mx-auto px-4">
            <div className="absolute top-1/2 left-8 right-8 h-1 bg-slate-200 -translate-y-1/2 -z-0" />
            <div
              className={`absolute top-1/2 left-8 h-1 transition-all duration-500 -translate-y-1/2 -z-0 ${
                currentStatusConfig.barBg || "bg-blue-600"
              }`}
              style={{
                width: `${(currentStepIndex / (WORKFLOW_STEPS.length - 1)) * 100}%`,
                maxWidth: "calc(100% - 4rem)"
              }}
            />

            {WORKFLOW_STEPS.map((step, idx) => {
              const isDone = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              const stepCfg = STATUS_CONFIG[step.id] || {};

              return (
                <div key={step.id} className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isCurrent
                        ? `${stepCfg.barBg} text-white ring-4 ${stepCfg.ringCls} shadow-sm`
                        : isDone
                        ? `${stepCfg.barBg} text-white`
                        : "bg-white text-slate-400 border-2 border-slate-300"
                    }`}
                  >
                    {isDone ? <Check size={14} /> : idx + 1}
                  </div>
                  <span
                    className={`text-xs mt-1.5 font-semibold whitespace-nowrap ${
                      isCurrent
                        ? `${stepCfg.textColor} font-bold`
                        : isDone
                        ? "text-slate-800"
                        : "text-slate-400"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : repair.status === "CannotRepair" ? (
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-center space-x-2 text-sm text-red-800">
          <AlertTriangle size={18} className="text-red-600 shrink-0" />
          <span>
            Thiết bị không thể sửa chữa. Đã dừng tiến trình và hoàn trả máy cho khách hàng.
          </span>
        </div>
      ) : repair.status === "Cancelled" ? (
        <div className="bg-slate-100 border border-slate-200 p-4 rounded-xl flex items-center space-x-2 text-sm text-slate-700">
          <X size={18} className="text-slate-500 shrink-0" />
          <span>Phiếu sửa chữa đã bị hủy theo yêu cầu.</span>
        </div>
      ) : null}

      {isEditable && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 mr-1">
              Thao tác kế tiếp:
            </span>

            {nextStep && nextStep.id !== "Returned" && (
              <button
                onClick={() => handleUpdateStatus(nextStep.id)}
                className={`inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer ${
                  STATUS_CONFIG[nextStep.id]?.btnCls || "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                <span>Chuyển tiếp: {nextStep.label}</span>
              </button>
            )}

            {nextStep && nextStep.id === "Returned" && (
              <button
                onClick={() =>
                  setCheckoutModal((prev) => ({ ...prev, isOpen: true }))
                }
                className={`inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer ${
                  STATUS_CONFIG[nextStep.id]?.btnCls || "bg-slate-700 hover:bg-slate-800 text-white"
                }`}
              >
                <span>Trả máy & Xuất hóa đơn</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {repair.status === "Repairing" && (
              <button
                type="button"
                onClick={() =>
                  setCannotRepairModal({ isOpen: true, reason: "" })
                }
                className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors cursor-pointer"
              >
                Báo không sửa được
              </button>
            )}

            <button
              type="button"
              onClick={() =>
                setConfirmConfig({
                  isOpen: true,
                  title: "Hủy phiếu sửa chữa",
                  message:
                    "Bạn có chắc chắn muốn hủy phiếu này? Thao tác này sẽ đóng hồ sơ sửa chữa.",
                  isDanger: true,
                  onConfirm: () =>
                    handleUpdateStatus("Cancelled", "Hủy theo yêu cầu")
                })
              }
              className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer"
            >
              Hủy phiếu
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-5">
            <div>
              <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center justify-between">
                <span>Thông tin khách hàng</span>
                {repair.customer?.loyaltyPoints !== undefined && (
                  <span className="text-[11px] font-normal text-slate-500 normal-case">
                    Điểm tích lũy: <strong>{repair.customer.loyaltyPoints}</strong>
                  </span>
                )}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 text-sm">
                <div>
                  <span className="text-xs text-slate-400 block">Họ và tên:</span>
                  <span className="font-semibold text-slate-900">
                    {repair.customer?.fullName || "Khách vãng lai"}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Số điện thoại:</span>
                  <span className="font-semibold text-slate-900 flex items-center space-x-1">
                    <PhoneCall size={14} className="text-slate-400" />
                    <span>{repair.customer?.phoneNumber || "Chưa có"}</span>
                  </span>
                </div>
                {repair.customer?.address && (
                  <div className="sm:col-span-2">
                    <span className="text-xs text-slate-400 block">Địa chỉ:</span>
                    <span className="text-slate-700 flex items-center space-x-1">
                      <MapPin size={14} className="text-slate-400 shrink-0" />
                      <span>{repair.customer.address}</span>
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Thông tin thiết bị
                </h2>
                {repair.imageUrl && (
                  <button
                    onClick={() => setZoomedImage(repair.imageUrl)}
                    className="text-xs font-semibold text-blue-600 hover:underline flex items-center space-x-1 cursor-pointer"
                  >
                    <span>Xem ảnh hiện trạng</span>
                    <ExternalLink size={12} />
                  </button>
                )}
              </div>

              {editingInfo ? (
                <div className="pt-3 space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Tên thiết bị
                    </label>
                    <input
                      type="text"
                      value={infoForm.deviceName}
                      onChange={(e) =>
                        setInfoForm((prev) => ({
                          ...prev,
                          deviceName: e.target.value
                        }))
                      }
                      className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Mô tả tình trạng lỗi
                    </label>
                    <textarea
                      rows={2}
                      value={infoForm.errorDescription}
                      onChange={(e) =>
                        setInfoForm((prev) => ({
                          ...prev,
                          errorDescription: e.target.value
                        }))
                      }
                      className="w-full p-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white resize-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Ghi chú
                    </label>
                    <textarea
                      rows={2}
                      value={infoForm.note}
                      onChange={(e) =>
                        setInfoForm((prev) => ({
                          ...prev,
                          note: e.target.value
                        }))
                      }
                      className="w-full p-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white resize-none"
                    />
                  </div>

                  <div className="space-y-1 max-w-xs">
                    <label className="text-xs font-semibold text-slate-700">
                      Tiền công sửa chữa (đ)
                    </label>
                    <input
                      type="number"
                      value={infoForm.laborCost}
                      onChange={(e) =>
                        setInfoForm((prev) => ({
                          ...prev,
                          laborCost: Math.max(0, parseInt(e.target.value, 10) || 0)
                        }))
                      }
                      className="w-full px-3 py-1.5 text-sm font-semibold bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white"
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingInfo(false)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveInfo}
                      className="flex items-center space-x-1 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm cursor-pointer"
                    >
                      <Save size={14} />
                      <span>Lưu thay đổi</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 text-sm">
                  <div>
                    <span className="text-xs text-slate-400 block">Thiết bị:</span>
                    <span className="font-semibold text-slate-900">
                      {repair.deviceName}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Kỹ thuật viên:</span>
                    <span className="font-semibold text-slate-900">
                      {repair.technicianName || "Chưa phân công"}
                    </span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-xs text-slate-400 block">Mô tả lỗi:</span>
                    <p className="text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-200 mt-1">
                      {repair.errorDescription || "Chưa có mô tả chi tiết"}
                    </p>
                  </div>
                  {repair.note && (
                    <div className="sm:col-span-2">
                      <span className="text-xs text-slate-400 block">Ghi chú:</span>
                      <p className="text-slate-700 bg-amber-50/60 p-2.5 rounded-lg border border-amber-200 mt-1">
                        {repair.note}
                      </p>
                    </div>
                  )}

                  {repair.imageUrl && (
                    <div className="sm:col-span-2 pt-1">
                      <span className="text-xs text-slate-400 block mb-1.5">
                        Ảnh hiện trạng lúc nhận:
                      </span>
                      <img
                        src={repair.imageUrl}
                        alt="Ảnh hiện trạng máy"
                        onClick={() => setZoomedImage(repair.imageUrl)}
                        className="w-24 h-24 object-cover rounded border border-slate-300 cursor-pointer hover:opacity-85 transition-opacity"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
                <Cpu size={16} className="text-blue-600" />
                <span>Linh kiện thay thế ({repair.repairParts?.length || 0})</span>
              </h2>

              {isEditable && (
                <button
                  type="button"
                  onClick={handleOpenAddPartModal}
                  className="flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Thêm linh kiện</span>
                </button>
              )}
            </div>

            {!repair.repairParts || repair.repairParts.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">
                Chưa có linh kiện thay thế cho phiếu này.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                    <tr>
                      <th className="py-2 px-3">Tên linh kiện</th>
                      <th className="py-2 px-3 text-center">Số lượng</th>
                      <th className="py-2 px-3 text-right">Đơn giá</th>
                      <th className="py-2 px-3 text-right">Thành tiền</th>
                      {isEditable && <th className="py-2 px-3 text-center">Xóa</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {repair.repairParts.map((part) => (
                      <tr key={part.repairPartId} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                          {part.inventoryName}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold">
                          {part.quantity}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                          {Number(part.price || 0).toLocaleString("vi-VN")} đ
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          {(part.price * part.quantity).toLocaleString("vi-VN")} đ
                        </td>
                        {isEditable && (
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() =>
                                handleRemovePart(part.repairPartId, part.inventoryName)
                              }
                              className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                              title="Gỡ linh kiện"
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center space-x-1.5">
              <Receipt size={16} className="text-blue-600" />
              <span>Chi phí & Thanh toán</span>
            </h2>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Tiền công thợ:</span>
                <span className="font-semibold text-slate-900 font-mono">
                  {Number(repair.laborCost || 0).toLocaleString("vi-VN")} đ
                </span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Linh kiện thay thế:</span>
                <span className="font-semibold text-slate-900 font-mono">
                  {partsTotal.toLocaleString("vi-VN")} đ
                </span>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-sm">
                <span className="font-bold text-slate-900">Tổng cộng:</span>
                <span className="font-mono font-bold text-blue-600 text-base">
                  {Number(repair.totalAmount || 0).toLocaleString("vi-VN")} đ
                </span>
              </div>
            </div>

            {repair.invoice && (
              <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                <div className="flex justify-between font-semibold text-slate-800">
                  <span>Hóa đơn: {repair.invoice.invoiceCode}</span>
                  <span className="text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded text-[10px]">
                    Đã thanh toán
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 flex justify-between">
                  <span>
                    HTTT: {repair.invoice.paymentMethod === "Cash" ? "Tiền mặt" : repair.invoice.paymentMethod}
                  </span>
                  <span>
                    {repair.invoice.paidAt
                      ? format(new Date(repair.invoice.paidAt), "dd/MM/yyyy HH:mm", {
                          locale: vi
                        })
                      : ""}
                  </span>
                </div>
              </div>
            )}
          </div>

          {repair.warranty && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
                  <Award size={16} className="text-emerald-600" />
                  <span>Bảo hành</span>
                </h2>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                    repair.warranty.isExpired
                      ? "bg-rose-100 text-rose-800"
                      : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {repair.warranty.statusText || (repair.warranty.isExpired ? "Hết hạn" : "Còn hiệu lực")}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Thời hạn:</span>
                  <strong className="text-slate-800">{repair.warranty.warrantyDays} ngày</strong>
                </div>
                <div className="flex justify-between">
                  <span>Hạn đến ngày:</span>
                  <strong className="text-slate-800">
                    {format(new Date(repair.warranty.endDate), "dd/MM/yyyy", { locale: vi })}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>Còn lại:</span>
                  <strong
                    className={
                      repair.warranty.remainingDays > 0 ? "text-emerald-700" : "text-rose-600"
                    }
                  >
                    {repair.warranty.remainingDays > 0
                      ? `${repair.warranty.remainingDays} ngày`
                      : "Đã hết hạn"}
                  </strong>
                </div>
                {repair.warranty.terms && (
                  <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded border border-slate-200 mt-2">
                    {repair.warranty.terms}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center space-x-1.5">
              <Clock size={16} className="text-blue-600" />
              <span>Lịch sử trạng thái</span>
            </h2>

            {!repair.statusHistories || repair.statusHistories.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">
                Chưa có lịch sử trạng thái
              </p>
            ) : (
              <div className="space-y-3 text-xs">
                {repair.statusHistories.map((h, index) => {
                  const cfg = STATUS_CONFIG[h.newStatus] || {
                    label: h.newStatus,
                    badgeCls: "bg-slate-100 text-slate-800 border-slate-200",
                    borderCls: "border-slate-400"
                  };
                  return (
                    <div
                      key={h.historyId || index}
                      className={`border-l-2 pl-3 py-0.5 space-y-1 ${cfg.borderCls || "border-blue-500"}`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold border ${
                            cfg.badgeCls || cfg.cls || "bg-slate-100 text-slate-800 border-slate-200"
                          }`}
                        >
                          {cfg.label}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {format(new Date(h.createdAt), "dd/MM HH:mm", { locale: vi })}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Bởi: <span className="font-medium text-slate-700">{h.changedBy || "Hệ thống"}</span>
                      </p>
                      {h.note && (
                        <p className="text-[11px] text-slate-600 bg-slate-50 p-1.5 rounded border border-slate-200">
                          {h.note}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showPartModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
              onClick={() => setShowPartModal(false)}
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
                  <Cpu size={16} className="text-blue-600" />
                  <span>Thêm linh kiện sửa chữa</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowPartModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddPart} className="space-y-4">
                <div className="space-y-1 relative" ref={dropdownRef}>
                  <label className="text-xs font-semibold text-slate-700 block">
                    Linh kiện trong kho <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Search
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Gõ tên hoặc chọn linh kiện từ kho..."
                      value={partSearchTerm}
                      onFocus={() => setIsDropdownOpen(true)}
                      onChange={(e) => {
                        setPartSearchTerm(e.target.value);
                        setIsDropdownOpen(true);
                        setSelectedInventoryId("");
                      }}
                      className="w-full pl-9 pr-8 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
                    />
                    {selectedInventoryId ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedInventoryId("");
                          setPartSearchTerm("");
                          setIsDropdownOpen(true);
                        }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                        title="Chọn lại linh kiện"
                      >
                        <X size={14} />
                      </button>
                    ) : null}
                  </div>

                  {isDropdownOpen && (
                    <div className="absolute z-30 top-full left-0 mt-1 w-full max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg divide-y divide-slate-100">
                      {inventories.filter((item) =>
                        item.name?.toLowerCase().includes(partSearchTerm.toLowerCase())
                      ).length === 0 ? (
                        <div className="p-3 text-xs text-slate-500 text-center">
                          Không tìm thấy linh kiện phù hợp trong kho
                        </div>
                      ) : (
                        inventories
                          .filter((item) =>
                            item.name?.toLowerCase().includes(partSearchTerm.toLowerCase())
                          )
                          .map((item) => (
                            <div
                              key={item.inventoryId}
                              onClick={() => {
                                setSelectedInventoryId(item.inventoryId);
                                setPartSearchTerm(item.name);
                                setIsDropdownOpen(false);
                              }}
                              className={`p-2.5 cursor-pointer hover:bg-blue-50 transition-colors flex items-center justify-between text-xs ${
                                selectedInventoryId === item.inventoryId
                                  ? "bg-blue-50/70"
                                  : ""
                              }`}
                            >
                              <div>
                                <div className="font-semibold text-slate-800">
                                  {item.name}
                                </div>
                                <div className="text-[11px] text-slate-500">
                                  Tồn kho:{" "}
                                  <strong className="text-slate-700">{item.quantity}</strong>
                                </div>
                              </div>
                              <div className="font-mono font-bold text-blue-600">
                                {Number(
                                  item.salePrice || item.sellingPrice || 0
                                ).toLocaleString("vi-VN")}{" "}
                                đ
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Số lượng sử dụng
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={partQuantity}
                    onChange={(e) =>
                      setPartQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))
                    }
                    className="w-full px-3 py-1.5 text-sm font-semibold bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowPartModal(false)}
                    className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={addingPart || !selectedInventoryId}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    {addingPart ? "Đang thêm..." : "Thêm vào phiếu"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {checkoutModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
              onClick={() => setCheckoutModal((prev) => ({ ...prev, isOpen: false }))}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              transition={{ type: "spring", stiffness: 420, damping: 28 }}
              className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-5 border border-slate-200 z-10 overflow-hidden space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">
                  Trả máy & Xuất hóa đơn
                </h3>
                <button
                  type="button"
                  onClick={() => setCheckoutModal((prev) => ({ ...prev, isOpen: false }))}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCheckoutSubmit} className="space-y-3">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                  <span className="text-xs font-semibold text-blue-900">
                    Tổng tiền cần thanh toán:
                  </span>
                  <span className="text-base font-bold font-mono text-blue-700">
                    {Number(repair.totalAmount || 0).toLocaleString("vi-VN")} đ
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Hình thức thanh toán
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "Cash", label: "Tiền mặt" },
                      { id: "Transfer", label: "Chuyển khoản" },
                      { id: "Card", label: "Quẹt thẻ" }
                    ].map((pm) => (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() =>
                          setCheckoutModal((prev) => ({ ...prev, paymentMethod: pm.id }))
                        }
                        className={`py-1.5 px-2 text-xs font-medium rounded-lg border text-center transition-colors cursor-pointer ${
                          checkoutModal.paymentMethod === pm.id
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {pm.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 flex items-center">
                    <Award size={14} className="text-emerald-600 mr-1" />
                    <span>Thời hạn bảo hành</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { days: 0, label: "Không BH" },
                      { days: 7, label: "7 ngày" },
                      { days: 30, label: "1 tháng" },
                      { days: 90, label: "3 tháng" },
                      { days: 180, label: "6 tháng" },
                      { days: 365, label: "1 năm" }
                    ].map((pkg) => (
                      <button
                        key={pkg.days}
                        type="button"
                        onClick={() =>
                          setCheckoutModal((prev) => ({
                            ...prev,
                            warrantyDays: pkg.days
                          }))
                        }
                        className={`px-2.5 py-1 text-xs font-medium rounded border cursor-pointer ${
                          checkoutModal.warrantyDays === pkg.days
                            ? "bg-slate-800 text-white border-slate-800"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {pkg.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Điều khoản bảo hành
                  </label>
                  <textarea
                    rows={2}
                    value={checkoutModal.terms}
                    onChange={(e) =>
                      setCheckoutModal((prev) => ({ ...prev, terms: e.target.value }))
                    }
                    className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Ghi chú hóa đơn
                  </label>
                  <input
                    type="text"
                    placeholder="Ghi chú thêm..."
                    value={checkoutModal.note}
                    onChange={(e) =>
                      setCheckoutModal((prev) => ({ ...prev, note: e.target.value }))
                    }
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setCheckoutModal((prev) => ({ ...prev, isOpen: false }))}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={checkingOut}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    {checkingOut ? "Đang xử lý..." : "Xác nhận trả máy"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {cannotRepairModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
              onClick={() => setCannotRepairModal({ isOpen: false, reason: "" })}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              transition={{ type: "spring", stiffness: 420, damping: 28 }}
              className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-5 border border-slate-200 z-10 overflow-hidden space-y-3"
            >
              <h3 className="text-sm font-bold text-slate-900">
                Lý do không thể sửa chữa
              </h3>

              <form onSubmit={handleCannotRepairSubmit} className="space-y-3">
                <textarea
                  rows={3}
                  required
                  placeholder="Nhập lý do không thể khắc phục (ví dụ: hỏng main nặng, chập nguồn vô phương cứu...)"
                  value={cannotRepairModal.reason}
                  onChange={(e) =>
                    setCannotRepairModal((prev) => ({ ...prev, reason: e.target.value }))
                  }
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-red-600 focus:bg-white resize-none"
                />

                <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setCannotRepairModal({ isOpen: false, reason: "" })}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
                  >
                    Đóng
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm cursor-pointer"
                  >
                    Xác nhận
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {zoomedImage && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setZoomedImage(null)}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 420, damping: 28 }}
              className="relative max-w-3xl max-h-[85vh] bg-white rounded-xl overflow-hidden p-2 z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setZoomedImage(null)}
                className="absolute top-3 right-3 p-1.5 bg-slate-800 text-white rounded-full hover:bg-slate-900 cursor-pointer z-10 transition-colors"
              >
                <X size={16} />
              </button>
              <img
                src={zoomedImage}
                alt="Ảnh hiện trạng phóng to"
                className="max-h-[80vh] w-auto object-contain rounded"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmConfig.onConfirm || (() => {})}
        title={confirmConfig.title}
        message={confirmConfig.message}
        isDanger={confirmConfig.isDanger}
      />
    </div>
  );
};

export default RepairDetail;
