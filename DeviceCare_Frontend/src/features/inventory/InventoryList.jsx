import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Boxes,
  Search,
  Plus,
  Minus,
  PencilLine,
  Ban,
  ShieldAlert,
  Activity,
  Eye,
  EyeOff,
  X,
  Check,
  PackagePlus,
  ArrowUpRight,
  ArrowDownLeft,
  TabletSmartphone,
  Zap,
  Cpu,
  PackageX
} from "lucide-react";
import inventoryApi from "../../api/inventoryApi";
import ConfirmModal from "../../components/ConfirmModal";
import useDebounce from "../../hooks/useDebounce";
import useAuthStore from "../../store/authStore";
import toast from "react-hot-toast";

const CATEGORIES = [
  { id: "ALL", label: "Tất cả linh kiện", icon: Boxes },
  { id: "Màn hình", label: "Màn hình", icon: TabletSmartphone },
  { id: "Pin", label: "Pin", icon: Zap },
  { id: "Khác", label: "Linh kiện khác", icon: Cpu }
];

const BRANDS = ["ALL", "iPhone", "Samsung", "Xiaomi", "Oppo", "Khác"];

const InventoryList = () => {
  const { user: currentUser } = useAuthStore();
  const isAdmin = currentUser?.role === "Admin";

  const [inventories, setInventories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedBrand, setSelectedBrand] = useState("ALL");
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  const [showCostPrice, setShowCostPrice] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentInventory, setCurrentInventory] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "Màn hình",
    brand: "iPhone",
    description: "",
    quantity: 0,
    minStock: 3,
    costPrice: 0,
    sellingPrice: 0,
    isActive: true
  });
  const [saving, setSaving] = useState(false);

  const [importModalItem, setImportModalItem] = useState(null);
  const [importData, setImportData] = useState({ quantity: 1, costPrice: "", reason: "" });
  const [importing, setImporting] = useState(false);

  const [txModalItem, setTxModalItem] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loadingTx, setLoadingTx] = useState(false);

  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, id: null });

  useEffect(() => {
    fetchInventories();
  }, []);

  const fetchInventories = async () => {
    try {
      setLoading(true);
      const res = await inventoryApi.getAll();
      if (res?.success) {
        setInventories(res.data || []);
      }
    } catch (error) {
      toast.error(error.message || "Lỗi khi tải danh sách linh kiện");
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (item = null) => {
    setCurrentInventory(item);
    if (item) {
      setFormData({
        name: item.name || "",
        category: item.category || "Màn hình",
        brand: item.brand || "iPhone",
        description: item.description || "",
        quantity: item.quantity ?? 0,
        minStock: item.minStock ?? 3,
        costPrice: item.costPrice ?? 0,
        sellingPrice: item.sellingPrice ?? 0,
        isActive: item.isActive ?? true
      });
    } else {
      setFormData({
        name: "",
        category: "Màn hình",
        brand: "iPhone",
        description: "",
        quantity: 0,
        minStock: 3,
        costPrice: 0,
        sellingPrice: 0,
        isActive: true
      });
    }
    setIsEditModalOpen(true);
  };

  const openImportModal = (item) => {
    setImportModalItem(item);
    setImportData({
      quantity: 1,
      costPrice: item.costPrice || "",
      reason: "Nhập bổ sung từ nhà cung cấp"
    });
  };

  const openTxModal = async (item) => {
    setTxModalItem(item);
    setLoadingTx(true);
    try {
      const res = await inventoryApi.getTransactions(item.inventoryId);
      if (res?.success) {
        setTransactions(res.data || []);
      }
    } catch {
      toast.error("Không tải được lịch sử biến động kho");
    } finally {
      setLoadingTx(false);
    }
  };

  const closeModals = () => {
    setIsEditModalOpen(false);
    setCurrentInventory(null);
    setImportModalItem(null);
    setTxModalItem(null);
    setTransactions([]);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      return toast.error("Vui lòng nhập tên linh kiện");
    }

    const payload = {
      ...formData,
      quantity: Number(formData.quantity || 0),
      minStock: Number(formData.minStock || 0),
      costPrice: Number(formData.costPrice || 0),
      sellingPrice: Number(formData.sellingPrice || 0)
    };

    setSaving(true);
    try {
      if (currentInventory) {
        await inventoryApi.update(currentInventory.inventoryId, payload);
        toast.success("Cập nhật linh kiện thành công");
      } else {
        await inventoryApi.create(payload);
        toast.success("Thêm mới linh kiện vào kho thành công");
      }
      closeModals();
      fetchInventories();
    } catch (error) {
      toast.error(error.message || "Có lỗi xảy ra khi lưu linh kiện");
    } finally {
      setSaving(false);
    }
  };

  const handleQuickAdjust = async (item, delta) => {
    const newQty = (item.quantity || 0) + delta;
    if (newQty < 0) {
      return toast.error("Số lượng tồn kho không thể âm");
    }

    try {
      await inventoryApi.update(item.inventoryId, {
        name: item.name,
        category: item.category,
        brand: item.brand,
        description: item.description,
        quantity: newQty,
        minStock: item.minStock,
        costPrice: item.costPrice,
        sellingPrice: item.sellingPrice,
        isActive: item.isActive
      });
      toast.success(delta > 0 ? "Tăng tồn kho thành công" : "Giảm tồn kho thành công");
      fetchInventories();
    } catch (error) {
      toast.error(error.message || "Không thể điều chỉnh tồn kho");
    }
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    const qty = Number(importData.quantity);
    if (!qty || qty <= 0) {
      return toast.error("Số lượng nhập phải lớn hơn 0");
    }

    setImporting(true);
    try {
      await inventoryApi.importStock(importModalItem.inventoryId, {
        quantity: qty,
        costPrice: importData.costPrice ? Number(importData.costPrice) : null,
        reason: importData.reason?.trim()
      });
      toast.success("Nhập hàng vào kho thành công");
      closeModals();
      fetchInventories();
    } catch (error) {
      toast.error(error.message || "Lỗi khi nhập hàng");
    } finally {
      setImporting(false);
    }
  };

  const confirmDelete = async () => {
    try {
      await inventoryApi.delete(confirmConfig.id);
      toast.success("Đã ngừng kinh doanh linh kiện");
      fetchInventories();
    } catch (error) {
      toast.error(error.message || "Không thể ngừng kinh doanh linh kiện");
    }
  };

  const filteredInventories = useMemo(() => {
    return inventories.filter((item) => {
      const q = debouncedSearch.trim().toLowerCase();
      const matchSearch =
        !q ||
        item.name?.toLowerCase().includes(q) ||
        item.brand?.toLowerCase().includes(q) ||
        item.category?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q);

      const matchCategory =
        selectedCategory === "ALL" || item.category === selectedCategory;

      const matchBrand =
        selectedBrand === "ALL" ||
        (selectedBrand === "Khác"
          ? !["iPhone", "Samsung", "Xiaomi", "Oppo"].includes(item.brand)
          : item.brand === selectedBrand);

      const matchLowStock = !onlyLowStock || item.quantity <= item.minStock;

      return matchSearch && matchCategory && matchBrand && matchLowStock;
    });
  }, [inventories, debouncedSearch, selectedCategory, selectedBrand, onlyLowStock]);

  return (
    <div className="space-y-4">
      {/* Thanh công cụ quản lý kho */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <Boxes className="text-blue-600" size={22} />
            <span>Quản lý kho linh kiện</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Hiển thị <strong>{filteredInventories.length}</strong> / {inventories.length} mặt hàng
          </p>
        </div>

        <div className="flex items-center space-x-2 flex-wrap">
          {isAdmin && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCostPrice(!showCostPrice)}
              className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors cursor-pointer"
              title="Ẩn hiện giá vốn khi khách đứng trước quầy"
            >
              {showCostPrice ? <EyeOff size={15} /> : <Eye size={15} />}
              <span>{showCostPrice ? "Ẩn giá vốn" : "Hiện giá vốn"}</span>
            </motion.button>
          )}

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setOnlyLowStock(!onlyLowStock)}
            className={`flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
              onlyLowStock
                ? "bg-amber-100 text-amber-800 border-amber-300"
                : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
            }`}
          >
            <ShieldAlert size={15} className={onlyLowStock ? "text-amber-700" : "text-slate-400"} />
            <span>Sắp hết hàng</span>
          </motion.button>

          {isAdmin && (
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: "spring", stiffness: 450, damping: 25 }}
              onClick={() => openEditModal()}
              className="flex items-center space-x-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              <Plus size={16} />
              <span>Thêm linh kiện</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* Bộ lọc phân loại danh mục và nhãn hàng */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <motion.button
                key={cat.id}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 450, damping: 25 }}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <Icon size={14} />
                <span>{cat.label}</span>
              </motion.button>
            );
          })}
        </div>

        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-1 border-t border-slate-100">
          <div className="flex items-center space-x-1.5 overflow-x-auto text-xs">
            <span className="text-slate-400 font-bold uppercase mr-1">Hãng:</span>
            {BRANDS.map((brand) => {
              const isSelected = selectedBrand === brand;
              return (
                <motion.button
                  key={brand}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => setSelectedBrand(brand)}
                  className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-slate-800 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {brand === "ALL" ? "Tất cả hãng" : brand}
                </motion.button>
              );
            })}
          </div>

          <div className="relative w-full md:w-72">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Tìm theo tên linh kiện..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-sm">Đang tải dữ liệu kho linh kiện...</p>
          </div>
        ) : filteredInventories.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <Boxes size={40} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-700">Không tìm thấy linh kiện nào</p>
            <p className="text-xs text-slate-400 mt-1">Hãy thử đổi bộ lọc hoặc thêm linh kiện mới</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Tên linh kiện</th>
                  <th className="py-3 px-4">Phân loại</th>
                  <th className="py-3 px-4">Hãng</th>
                  <th className="py-3 px-4 text-center">Tồn kho</th>
                  {isAdmin && showCostPrice && (
                    <th className="py-3 px-4 text-right">Giá vốn</th>
                  )}
                  <th className="py-3 px-4 text-right">Giá bán</th>
                  <th className="py-3 px-4 text-center">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredInventories.map((item) => {
                  const isLow = item.quantity <= item.minStock;
                  return (
                    <tr
                      key={item.inventoryId}
                      className={`hover:bg-blue-50/40 transition-colors ${
                        !item.isActive ? "bg-slate-50/80 opacity-70" : ""
                      }`}
                    >
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">
                          {item.name}
                        </span>
                        {item.description && (
                          <span className="text-xs text-slate-400 block truncate max-w-xs">
                            {item.description}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-xs font-medium text-slate-600">
                        {item.category || "Khác"}
                      </td>

                      <td className="py-3 px-4 text-xs font-semibold text-slate-800">
                        {item.brand || "Khác"}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center space-x-1.5">
                          <motion.button
                            whileTap={{ scale: 0.85 }}
                            transition={{ type: "spring", stiffness: 500, damping: 25 }}
                            onClick={() => handleQuickAdjust(item, -1)}
                            title="Giảm 1 số lượng"
                            className="w-6 h-6 rounded bg-slate-100 hover:bg-red-100 text-slate-600 hover:text-red-600 flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Minus size={12} />
                          </motion.button>

                          <span
                            className={`min-w-10 text-center px-2 py-0.5 rounded text-xs font-black ${
                              item.quantity === 0
                                ? "bg-red-100 text-red-700 border border-red-200"
                                : isLow
                                ? "bg-amber-100 text-amber-800 border border-amber-300"
                                : "bg-slate-100 text-slate-900 border border-slate-200"
                            }`}
                          >
                            {item.quantity}
                          </span>

                          <motion.button
                            whileTap={{ scale: 0.85 }}
                            transition={{ type: "spring", stiffness: 500, damping: 25 }}
                            onClick={() => handleQuickAdjust(item, 1)}
                            title="Tăng 1 số lượng"
                            className="w-6 h-6 rounded bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-600 flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Plus size={12} />
                          </motion.button>
                        </div>
                        {isLow && item.isActive && (
                          <span className="block text-[10px] text-amber-600 font-bold mt-0.5">
                            Cần nhập thêm
                          </span>
                        )}
                      </td>

                      {isAdmin && showCostPrice && (
                        <td className="py-3 px-4 text-right font-mono text-xs text-slate-500">
                          {Number(item.costPrice || 0).toLocaleString("vi-VN")} đ
                        </td>
                      )}

                      <td className="py-3 px-4 text-right font-bold font-mono text-slate-900 text-xs">
                        {Number(item.sellingPrice || 0).toLocaleString("vi-VN")} đ
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[11px] font-bold ${
                            item.isActive
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {item.isActive ? "Đang bán" : "Ngừng bán"}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1">
                          {isAdmin && item.isActive && (
                            <motion.button
                              whileTap={{ scale: 0.88 }}
                              transition={{ type: "spring", stiffness: 500, damping: 25 }}
                              onClick={() => openImportModal(item)}
                              title="Nhập thêm hàng"
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors cursor-pointer"
                            >
                              <PackagePlus size={16} />
                            </motion.button>
                          )}

                          <motion.button
                            whileTap={{ scale: 0.88 }}
                            transition={{ type: "spring", stiffness: 500, damping: 25 }}
                            onClick={() => openTxModal(item)}
                            title="Xem lịch sử biến động kho"
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                          >
                            <Activity size={16} />
                          </motion.button>

                          {isAdmin && (
                            <motion.button
                              whileTap={{ scale: 0.88 }}
                              transition={{ type: "spring", stiffness: 500, damping: 25 }}
                              onClick={() => openEditModal(item)}
                              title="Sửa thông tin"
                              className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                            >
                              <PencilLine size={16} />
                            </motion.button>
                          )}

                          {isAdmin && item.isActive && (
                            <motion.button
                              whileTap={{ scale: 0.88 }}
                              transition={{ type: "spring", stiffness: 500, damping: 25 }}
                              onClick={() =>
                                setConfirmConfig({ isOpen: true, id: item.inventoryId })
                              }
                              title="Ngừng kinh doanh"
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                            >
                              <Ban size={16} />
                            </motion.button>
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
              className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg border border-slate-200 z-10 overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <h2 className="text-base font-bold text-slate-900">
                  {currentInventory ? "Sửa thông tin linh kiện" : "Thêm mới linh kiện vào kho"}
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
                    Tên linh kiện *
                  </label>
                  <input
                    type="text"
                    required
                    name="name"
                    placeholder="Ví dụ: Màn hình OLED iPhone 13 Pro Max"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Phân loại
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white"
                    >
                      <option value="Màn hình">Màn hình</option>
                      <option value="Pin">Pin</option>
                      <option value="Khác">Linh kiện khác</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Hãng máy
                    </label>
                    <select
                      name="brand"
                      value={formData.brand}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white"
                    >
                      <option value="iPhone">iPhone</option>
                      <option value="Samsung">Samsung</option>
                      <option value="Xiaomi">Xiaomi</option>
                      <option value="Oppo">Oppo</option>
                      <option value="Realme">Realme</option>
                      <option value="Vivo">Vivo</option>
                      <option value="Khác">Khác</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Số lượng tồn kho
                    </label>
                    <input
                      type="number"
                      min="0"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Tồn tối thiểu cảnh báo
                    </label>
                    <input
                      type="number"
                      min="0"
                      name="minStock"
                      value={formData.minStock}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Giá nhập (Vốn)
                    </label>
                    <input
                      type="number"
                      min="0"
                      name="costPrice"
                      value={formData.costPrice}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Giá bán ra
                    </label>
                    <input
                      type="number"
                      min="0"
                      name="sellingPrice"
                      value={formData.sellingPrice}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Mô tả chi tiết
                  </label>
                  <textarea
                    name="description"
                    rows="2"
                    placeholder="Ghi chú thêm về thông số, bảo hành của linh kiện..."
                    value={formData.description}
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
                    <span>{saving ? "Đang lưu..." : "Lưu linh kiện"}</span>
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {importModalItem && (
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
                <div>
                  <h2 className="text-base font-bold text-slate-900">Nhập hàng vào kho</h2>
                  <p className="text-xs text-blue-600 font-semibold mt-0.5">{importModalItem.name}</p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={closeModals}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer transition-colors"
                >
                  <X size={18} />
                </motion.button>
              </div>

              <form onSubmit={handleImportSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Số lượng nhập thêm *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={importData.quantity}
                    onChange={(e) => setImportData({ ...importData, quantity: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Tồn hiện tại: <strong>{importModalItem.quantity}</strong> $\rightarrow$ Sau khi nhập:{" "}
                    <strong>{(importModalItem.quantity || 0) + Number(importData.quantity || 0)}</strong>
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Giá nhập lần này (đ)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Để trống nếu giữ nguyên giá vốn cũ"
                    value={importData.costPrice}
                    onChange={(e) => setImportData({ ...importData, costPrice: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Lý do / Nguồn nhập
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Nhập lô hàng từ đại lý An Khánh"
                    value={importData.reason}
                    onChange={(e) => setImportData({ ...importData, reason: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white"
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
                    disabled={importing}
                    className="flex items-center space-x-1.5 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg disabled:opacity-50 cursor-pointer shadow-sm"
                  >
                    <PackagePlus size={16} />
                    <span>{importing ? "Đang nhập..." : "Xác nhận nhập kho"}</span>
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {txModalItem && (
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
                  <h2 className="text-base font-bold text-slate-900">Lịch sử biến động xuất nhập tồn</h2>
                  <p className="text-xs text-blue-600 font-semibold mt-0.5">{txModalItem.name}</p>
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
                {loadingTx ? (
                  <div className="py-12 text-center text-slate-500 text-sm">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Đang tải lịch sử giao dịch kho...
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-sm bg-slate-50 rounded-lg border border-dashed border-slate-200">
                    <Activity size={32} className="mx-auto text-slate-300 mb-2" />
                    Chưa có giao dịch biến động nào được ghi nhận cho linh kiện này
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase">
                        <tr>
                          <th className="py-2.5 px-3">Thời gian</th>
                          <th className="py-2.5 px-3">Loại</th>
                          <th className="py-2.5 px-3 text-center">Số lượng</th>
                          <th className="py-2.5 px-3 text-center">Tồn trước/sau</th>
                          <th className="py-2.5 px-3">Lý do</th>
                          <th className="py-2.5 px-3">Người làm</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {transactions.map((tx) => {
                          const isImport = tx.type === "Import" || tx.type === "Return";
                          return (
                            <tr key={tx.transactionId} className="hover:bg-slate-50 transition-colors">
                              <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                                {tx.createdAt ? new Date(tx.createdAt).toLocaleString("vi-VN") : "-"}
                              </td>
                              <td className="py-2.5 px-3 whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                                    isImport
                                      ? "bg-emerald-100 text-emerald-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {isImport ? <ArrowDownLeft size={11} /> : <ArrowUpRight size={11} />}
                                  <span>{isImport ? "Nhập kho" : "Xuất kho"}</span>
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-center font-bold font-mono">
                                {isImport ? `+${tx.quantity}` : `-${tx.quantity}`}
                              </td>
                              <td className="py-2.5 px-3 text-center text-slate-500 font-mono">
                                {tx.quantityBefore} $\rightarrow$ {tx.quantityAfter}
                              </td>
                              <td className="py-2.5 px-3 text-slate-600">
                                {tx.reason || (tx.repairCode ? `Gắn vào phiếu ${tx.repairCode}` : "-")}
                              </td>
                              <td className="py-2.5 px-3 text-slate-600 font-medium">
                                {tx.userName || "-"}
                              </td>
                            </tr>
                          );
                        })}
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

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig({ isOpen: false, id: null })}
        onConfirm={confirmDelete}
        title="Xác nhận ngừng kinh doanh linh kiện"
        message="Linh kiện sẽ được chuyển sang trạng thái ngừng bán. Dữ liệu các phiếu sửa chữa đã dùng linh kiện này trước đây vẫn được bảo toàn nguyên vẹn."
        confirmText="Ngừng kinh doanh"
        icon={PackageX}
      />
    </div>
  );
};

export default InventoryList;
