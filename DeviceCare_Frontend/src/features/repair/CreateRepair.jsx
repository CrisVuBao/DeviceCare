import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Smartphone,
  PhoneCall,
  User,
  Plus,
  Camera,
  X,
  History,
  Check
} from "lucide-react";
import repairApi from "../../api/repairApi";
import customerApi from "../../api/customerApi";
import toast from "react-hot-toast";

const CreateRepair = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const wrapperRef = useRef(null);

  const [formData, setFormData] = useState({
    phoneNumber: "",
    customerName: "",
    deviceName: "",
    errorDescription: "",
    note: "",
    laborCost: "",
    imageUrl: ""
  });

  const [customers, setCustomers] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [pastDevices, setPastDevices] = useState([]);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [imagePreview, setImagePreview] = useState("");

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await customerApi.getAll();
        if (res?.success && res.data) {
          setCustomers(res.data);
        }
      } catch (err) {
        console.error("Lỗi tải khách hàng:", err);
      }
    };
    fetchCustomers();

    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatCurrency = (value) => {
    if (!value && value !== 0) return "";
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const handleLaborCostChange = (e) => {
    const rawValue = e.target.value.replace(/\D/g, "");
    setFormData((prev) => ({
      ...prev,
      laborCost: rawValue ? parseInt(rawValue, 10) : ""
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "phoneNumber") {
      if (value.trim().length >= 3) {
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
      }
      setPastDevices([]);
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.phoneNumber?.includes(formData.phoneNumber.trim()) ||
      c.fullName?.toLowerCase().includes(formData.phoneNumber.trim().toLowerCase())
  );

  const handleSelectCustomer = async (customer) => {
    setFormData((prev) => ({
      ...prev,
      phoneNumber: customer.phoneNumber,
      customerName: customer.fullName
    }));
    setShowSuggestions(false);

    setLoadingDevices(true);
    try {
      const res = await customerApi.getRepairs(customer.customerId);
      if (res?.success && res.data) {
        const devices = res.data.map((r) => r.deviceName).filter(Boolean);
        const uniqueDevices = [...new Set(devices)];
        setPastDevices(uniqueDevices);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDevices(false);
    }
  };

  const handleImageCapture = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file hình ảnh hợp lệ");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const maxWidth = 1024;
        const maxHeight = 1024;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.75);
        setImagePreview(compressedDataUrl);
        setFormData((prev) => ({ ...prev, imageUrl: compressedDataUrl }));
        toast.success("Đã tải ảnh thiết bị");
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImagePreview("");
    setFormData((prev) => ({ ...prev, imageUrl: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.phoneNumber.trim()) {
      toast.error("Vui lòng nhập số điện thoại");
      return;
    }
    if (!formData.customerName.trim()) {
      toast.error("Vui lòng nhập tên khách hàng");
      return;
    }
    if (!formData.deviceName.trim()) {
      toast.error("Vui lòng nhập tên thiết bị");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        phoneNumber: formData.phoneNumber.trim(),
        customerName: formData.customerName.trim(),
        deviceName: formData.deviceName.trim(),
        errorDescription: formData.errorDescription?.trim() || null,
        note: formData.note?.trim() || null,
        laborCost: formData.laborCost === "" ? 0 : Number(formData.laborCost),
        imageUrl: formData.imageUrl || null
      };

      const response = await repairApi.createRepair(payload);
      if (response?.success) {
        toast.success("Tiếp nhận thiết bị thành công");
        const newId = response.data?.id || response.data?.repairId || response.data;
        if (newId && newId !== "undefined") {
          navigate(`/repairs/${newId}`);
        } else {
          navigate("/repairs");
        }
      } else {
        toast.error(response?.message || "Không thể tạo phiếu sửa chữa");
      }
    } catch (err) {
      toast.error(err.message || "Lỗi khi tạo phiếu sửa chữa");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-10">
      <div>
        <button
          type="button"
          onClick={() => navigate("/repairs")}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Quay lại danh sách phiếu</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* form*/}
        <div className="p-5 border-b border-slate-200 bg-slate-50">
          <h1 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <Smartphone size={20} className="text-blue-600" />
            <span>Tiếp nhận thiết bị sửa chữa</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Nhập thông tin khách hàng và thiết bị để khởi tạo phiếu sửa chữa mới.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider pb-2 border-b border-slate-100">
              Thông tin khách hàng
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 relative" ref={wrapperRef}>
                <label className="text-xs font-semibold text-slate-700">
                  Số điện thoại <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <PhoneCall
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    onFocus={() => {
                      if (formData.phoneNumber.trim().length >= 3)
                        setShowSuggestions(true);
                    }}
                    required
                    autoComplete="off"
                    placeholder="VD: 0901234567"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
                  />
                </div>

                {showSuggestions && formData.phoneNumber.trim().length >= 3 && (
                  <div className="absolute z-30 top-full left-0 mt-1 w-full max-h-52 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg divide-y divide-slate-100">
                    {filteredCustomers.length === 0 ? (
                      <div className="p-3 text-xs text-slate-500 text-center">
                        Khách hàng mới (chưa có trong danh bạ)
                      </div>
                    ) : (
                      filteredCustomers.map((c) => (
                        <div
                          key={c.customerId}
                          onClick={() => handleSelectCustomer(c)}
                          className="px-3.5 py-2 cursor-pointer hover:bg-blue-50 transition-colors flex items-center justify-between"
                        >
                          <div>
                            <div className="text-xs font-semibold text-slate-800">
                              {c.fullName}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {c.phoneNumber}
                            </div>
                          </div>
                          <span className="text-[11px] font-semibold text-blue-600">
                            Chọn
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Họ và tên khách hàng <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleChange}
                    required
                    placeholder="VD: Nguyễn Văn A"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider pb-2 border-b border-slate-100">
              Thông tin thiết bị
            </h2>

            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">
                    Tên thiết bị <span className="text-red-500">*</span>
                  </label>
                  {loadingDevices && (
                    <span className="text-xs text-blue-600 animate-pulse">
                      Đang tìm thiết bị cũ...
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Smartphone
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    name="deviceName"
                    value={formData.deviceName}
                    onChange={handleChange}
                    required
                    placeholder="VD: iPhone 13 Pro Max, Dell Latitude 7420..."
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
                  />
                </div>

                {pastDevices.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-xs text-slate-500 flex items-center mr-1">
                      <History size={12} className="mr-1" /> Máy từng sửa:
                    </span>
                    {pastDevices.map((dev, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, deviceName: dev }))
                        }
                        className="px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 rounded transition-colors cursor-pointer"
                      >
                        {dev}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Mô tả tình trạng lỗi
                  </label>
                  <textarea
                    name="errorDescription"
                    value={formData.errorDescription}
                    onChange={handleChange}
                    rows={3}
                    placeholder="VD: Rơi nứt kính, liệt cảm ứng, không nhận sạc..."
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white transition-colors resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Ghi chú tiếp nhận
                  </label>
                  <textarea
                    name="note"
                    value={formData.note}
                    onChange={handleChange}
                    rows={3}
                    placeholder="VD: Khách cần lấy trong ngày, trầy xước góc viền..."
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white transition-colors resize-none"
                  />
                </div>
              </div>

              <div className="space-y-1 max-w-xs">
                <label className="text-xs font-semibold text-slate-700">
                  Tiền công sửa chữa (đ)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="laborCost"
                    value={formatCurrency(formData.laborCost)}
                    onChange={handleLaborCostChange}
                    placeholder="0"
                    className="w-full pl-3 pr-8 py-2 text-sm font-semibold bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                    đ
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider pb-2 border-b border-slate-100">
              Ảnh chụp hiện trạng (Tùy chọn)
            </h2>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              capture="environment"
              onChange={handleImageCapture}
              className="hidden"
            />

            {imagePreview ? (
              <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg border border-slate-200 max-w-md">
                <img
                  src={imagePreview}
                  alt="Ảnh hiện trạng máy"
                  className="w-16 h-16 object-cover rounded border border-slate-300 bg-white"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800">
                    Đã chọn ảnh thiết bị
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Ảnh sẽ được lưu vào phiếu sửa chữa.
                  </p>
                  <div className="mt-1 flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs font-medium text-blue-600 hover:underline cursor-pointer"
                    >
                      Đổi ảnh
                    </button>
                    <span className="text-slate-300">•</span>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="text-xs font-medium text-red-600 hover:underline cursor-pointer"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer"
              >
                <Camera size={16} className="text-slate-500" />
                <span>Chụp ảnh / Tải ảnh hiện trạng máy</span>
              </button>
            )}
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate("/repairs")}
              className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-1.5 px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              <Check size={16} />
              <span>{loading ? "Đang lưu..." : "Tạo phiếu tiếp nhận"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRepair;
