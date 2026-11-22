import React, { useState } from "react";
import { Printer, X, FileText, Receipt } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

const PrintRepairModal = ({ isOpen, onClose, repair }) => {
  const [printFormat, setPrintFormat] = useState("a4"); // a4 | k80

  if (!isOpen || !repair) return null;

  const handlePrint = () => {
    window.print();
  };

  const invoiceCode = repair.invoice?.invoiceCode || `HD-${repair.repairCode}`;
  const paymentMethod =
    repair.invoice?.paymentMethod === "Cash"
      ? "Tiền mặt"
      : repair.invoice?.paymentMethod === "BankTransfer"
      ? "Chuyển khoản"
      : repair.invoice?.paymentMethod || "Tiền mặt";

  const laborCost = Number(repair.laborCost || 0);
  const parts = repair.repairParts || [];
  const partsTotal = parts.reduce((sum, p) => sum + Number(p.price || 0) * Number(p.quantity || 1), 0);
  const totalAmount = Number(repair.totalAmount || laborCost + partsTotal);

  const warrantyDays = repair.warranty?.warrantyDays ?? 30;
  const warrantyEndDate = repair.warranty?.endDate
    ? format(new Date(repair.warranty.endDate), "dd/MM/yyyy", { locale: vi })
    : repair.createdAt
    ? format(new Date(new Date(repair.createdAt).getTime() + warrantyDays * 86400000), "dd/MM/yyyy", { locale: vi })
    : "";

  const printDateRef = repair.returnedAt || repair.invoice?.paidAt || repair.completedAt || repair.createdAt;
  const printDate = printDateRef
    ? format(new Date(printDateRef), "dd/MM/yyyy HH:mm", { locale: vi })
    : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      {/* Chèn css xử lý bản in gọn gàng sạch đẹp */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-invoice-wrapper,
          #printable-invoice-wrapper * {
            visibility: visible !important;
          }
          #printable-invoice-wrapper {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: ${printFormat === "k80" ? "80mm auto" : "A4 portrait"};
            margin: ${printFormat === "k80" ? "3mm" : "12mm"};
          }
        }
      `}</style>

      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="no-print px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Printer size={18} className="text-blue-600" />
            <h3 className="text-sm sm:text-base font-bold text-slate-800">
              In Hóa đơn dịch vụ & Phiếu bảo hành
            </h3>
            <span className="text-xs font-mono bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">
              {repair.repairCode}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <div className="inline-flex p-1 bg-slate-200/80 rounded-lg text-xs font-medium">
              <button
                type="button"
                onClick={() => setPrintFormat("a4")}
                className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-md transition-all cursor-pointer ${
                  printFormat === "a4"
                    ? "bg-white text-slate-900 shadow-xs font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <FileText size={13} />
                <span>Khổ A4/A5</span>
              </button>
              <button
                type="button"
                onClick={() => setPrintFormat("k80")}
                className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-md transition-all cursor-pointer ${
                  printFormat === "k80"
                    ? "bg-white text-slate-900 shadow-xs font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Receipt size={13} />
                <span>Khổ K80 (80mm)</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Printer size={14} />
              <span>In ngay</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
              title="Đóng"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-100/70 p-4 sm:p-6 flex justify-center">
          <div id="printable-invoice-wrapper" className="w-full flex justify-center">
            {printFormat === "a4" ? (
              /* Khổ A4 A5 tiêu chuẩn  */
              <div className="bg-white w-full max-w-[210mm] p-8 sm:p-10 shadow-sm border border-slate-200 rounded-xl text-slate-900 font-sans text-xs sm:text-sm">
                <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5 mb-5">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center text-white font-black text-sm">
                        DC
                      </div>
                      <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 uppercase">
                        DEVICECARE SERVICE
                      </h1>
                    </div>
                    <p className="text-xs text-slate-600">Trung tâm Dịch vụ & Sửa chữa Thiết bị Công nghệ</p>
                    <p className="text-xs text-slate-600">Địa chỉ: 01 ABC, P. ABCD, TP.HCM</p>
                    <p className="text-xs text-slate-600">Hotline: 0988.123.456 | Website: devicecare.vn</p>
                  </div>

                  <div className="text-right space-y-1">
                    <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-800 rounded font-bold text-xs uppercase tracking-wider border border-slate-300">
                      Phiếu Dịch Vụ
                    </span>
                    <p className="text-xs font-mono text-slate-700">Mã phiếu: <strong>{repair.repairCode}</strong></p>
                    <p className="text-xs font-mono text-slate-700">Hóa đơn: <strong>{invoiceCode}</strong></p>
                    <p className="text-[11px] text-slate-500">Ngày in: {printDate}</p>
                  </div>
                </div>

                <div className="text-center my-4">
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-wide">
                    HÓA ĐƠN DỊCH VỤ & PHIẾU BẢO HÀNH
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200 mb-6">
                  <div className="space-y-1.5 text-xs">
                    <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] border-b border-slate-200 pb-1 mb-2">
                      Thông tin khách hàng
                    </div>
                    <div className="flex">
                      <span className="w-24 text-slate-500">Khách hàng:</span>
                      <strong className="text-slate-900">{repair.customer?.fullName || "Khách lẻ"}</strong>
                    </div>
                    <div className="flex">
                      <span className="w-24 text-slate-500">Số điện thoại:</span>
                      <strong className="text-slate-900 font-mono">{repair.customer?.phoneNumber || "---"}</strong>
                    </div>
                    <div className="flex">
                      <span className="w-24 text-slate-500">Địa chỉ:</span>
                      <span className="text-slate-800">{repair.customer?.address || "Tại cửa hàng"}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] border-b border-slate-200 pb-1 mb-2">
                      Thông tin thiết bị sửa chữa
                    </div>
                    <div className="flex">
                      <span className="w-24 text-slate-500">Tên máy:</span>
                      <strong className="text-slate-900">{repair.deviceName}</strong>
                    </div>
                    <div className="flex">
                      <span className="w-24 text-slate-500">Serial / IMEI:</span>
                      <span className="text-slate-900 font-mono font-bold tracking-wide">
                        {repair.serialNumber || repair.imei || "Không có"}
                      </span>
                    </div>
                    <div className="flex">
                      <span className="w-24 text-slate-500">Lỗi ghi nhận:</span>
                      <span className="text-slate-800">{repair.errorDescription || "Kiểm tra theo yêu cầu"}</span>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="font-bold text-slate-800 uppercase tracking-wider text-xs mb-2">
                    Bảng kê chi phí dịch vụ & linh kiện
                  </div>
                  <table className="w-full border-collapse border border-slate-300 text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-800 font-bold">
                        <th className="border border-slate-300 px-3 py-2 text-center w-10">STT</th>
                        <th className="border border-slate-300 px-3 py-2 text-left">Nội dung / Tên linh kiện</th>
                        <th className="border border-slate-300 px-3 py-2 text-center w-16">ĐVT</th>
                        <th className="border border-slate-300 px-3 py-2 text-center w-14">SL</th>
                        <th className="border border-slate-300 px-3 py-2 text-right w-28">Đơn giá</th>
                        <th className="border border-slate-300 px-3 py-2 text-right w-28">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-slate-300 px-3 py-2 text-center">1</td>
                        <td className="border border-slate-300 px-3 py-2 font-medium">
                          Tiền công kỹ thuật & dịch vụ sửa chữa
                        </td>
                        <td className="border border-slate-300 px-3 py-2 text-center">Lần</td>
                        <td className="border border-slate-300 px-3 py-2 text-center">1</td>
                        <td className="border border-slate-300 px-3 py-2 text-right font-mono">
                          {laborCost.toLocaleString("vi-VN")} đ
                        </td>
                        <td className="border border-slate-300 px-3 py-2 text-right font-mono font-medium">
                          {laborCost.toLocaleString("vi-VN")} đ
                        </td>
                      </tr>

                      {parts.map((p, idx) => {
                        const q = Number(p.quantity || 1);
                        const pr = Number(p.price || 0);
                        const lineTotal = q * pr;
                        return (
                          <tr key={p.repairPartId || idx}>
                            <td className="border border-slate-300 px-3 py-2 text-center">{idx + 2}</td>
                            <td className="border border-slate-300 px-3 py-2 font-medium">
                              Linh kiện: {p.inventoryName}
                            </td>
                            <td className="border border-slate-300 px-3 py-2 text-center">Cái</td>
                            <td className="border border-slate-300 px-3 py-2 text-center">{q}</td>
                            <td className="border border-slate-300 px-3 py-2 text-right font-mono">
                              {pr.toLocaleString("vi-VN")} đ
                            </td>
                            <td className="border border-slate-300 px-3 py-2 text-right font-mono font-medium">
                              {lineTotal.toLocaleString("vi-VN")} đ
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50 font-semibold text-slate-800">
                        <td colSpan="5" className="border border-slate-300 px-3 py-2 text-right">
                          Tiền công:
                        </td>
                        <td className="border border-slate-300 px-3 py-2 text-right font-mono">
                          {laborCost.toLocaleString("vi-VN")} đ
                        </td>
                      </tr>
                      <tr className="bg-slate-50 font-semibold text-slate-800">
                        <td colSpan="5" className="border border-slate-300 px-3 py-2 text-right">
                          Tổng tiền linh kiện:
                        </td>
                        <td className="border border-slate-300 px-3 py-2 text-right font-mono">
                          {partsTotal.toLocaleString("vi-VN")} đ
                        </td>
                      </tr>
                      <tr className="bg-slate-100 font-bold text-slate-900 text-sm">
                        <td colSpan="5" className="border border-slate-300 px-3 py-2.5 text-right uppercase">
                          Tổng thanh toán:
                        </td>
                        <td className="border border-slate-300 px-3 py-2.5 text-right font-mono text-blue-700 text-base">
                          {totalAmount.toLocaleString("vi-VN")} đ
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1.5">
                    <div className="font-bold text-slate-800 flex items-center space-x-1.5 pb-1 border-b border-slate-200">
                      <Receipt size={14} className="text-slate-600" />
                      <span>Thông tin thanh toán</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Hình thức thanh toán:</span>
                      <strong className="text-slate-900">{paymentMethod}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Trạng thái:</span>
                      <span className="font-semibold text-emerald-700">Đã thanh toán đủ</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Kỹ thuật viên phụ trách:</span>
                      <span className="text-slate-900">{repair.employeeName || "Kỹ thuật viên quầy"}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1.5">
                    <div className="font-bold text-slate-800 flex items-center space-x-1.5 pb-1 border-b border-slate-200">
                      <span>Chính sách bảo hành điện tử</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Thời hạn bảo hành:</span>
                      <strong className="text-slate-900">{warrantyDays} ngày</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Hiệu lực bảo hành đến:</span>
                      <strong className="text-slate-900 font-mono">{warrantyEndDate}</strong>
                    </div>
                    <p className="text-[11px] text-slate-500 italic mt-1 leading-relaxed">
                      {repair.warranty?.terms ||
                        "Bảo hành 1 đổi 1 đối với linh kiện thay thế gặp lỗi sản xuất. Không bảo hành các lỗi do rơi vỡ, vào nước, cháy nổ hoặc rách tem niêm phong."}
                    </p>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-200 grid grid-cols-2 text-center text-xs">
                  <div>
                    <p className="font-bold text-slate-900 uppercase">Khách hàng</p>
                    <p className="text-[11px] text-slate-500 italic">(Ký và ghi rõ họ tên)</p>
                    <div className="h-16" />
                    <p className="font-medium text-slate-800">{repair.customer?.fullName || "Khách hàng"}</p>
                  </div>

                  <div>
                    <p className="font-bold text-slate-900 uppercase">Đại diện DeviceCare</p>
                    <p className="text-[11px] text-slate-500 italic">(Ký và xác nhận)</p>
                    <div className="h-16" />
                    <p className="font-medium text-slate-800">
                      {repair.employeeName || repair.receiverEmployeeName || "Kỹ thuật viên"}
                    </p>
                  </div>
                </div>
                <div className="mt-8 text-center text-[11px] text-slate-500 border-t border-dashed border-slate-200 pt-3">
                  Cảm ơn Quý khách đã tin tưởng và sử dụng dịch vụ tại DeviceCare!
                </div>
              </div>
            ) : (
              /* Khổ K80 80mm hóa đơn nhiệt  */
              <div className="bg-white w-full max-w-[340px] p-5 shadow-sm border border-slate-200 rounded-xl text-slate-900 font-mono text-xs">
                <div className="text-center pb-3 border-b border-dashed border-slate-300 space-y-1">
                  <h2 className="font-black text-sm tracking-tight uppercase">DEVICECARE SERVICE</h2>
                  <p className="text-[10px] text-slate-600">01 ABC, P. ABCD, TP.HCM</p>
                  <p className="text-[10px] text-slate-600">Hotline: 0988.123.456</p>
                  <div className="pt-1 font-bold text-xs uppercase tracking-wide">
                    PHIẾU THANH TOÁN & BẢO HÀNH
                  </div>
                </div>

                <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span>Mã phiếu:</span>
                    <strong>{repair.repairCode}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Hóa đơn:</span>
                    <strong>{invoiceCode}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Ngày:</span>
                    <span>{printDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Khách:</span>
                    <strong>{repair.customer?.fullName || "Khách lẻ"}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>SĐT:</span>
                    <span>{repair.customer?.phoneNumber || "---"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Thiết bị:</span>
                    <strong className="text-right">{repair.deviceName}</strong>
                  </div>
                  {repair.serialNumber && (
                    <div className="flex justify-between text-[10px]">
                      <span>SN/IMEI:</span>
                      <span className="font-bold">{repair.serialNumber}</span>
                    </div>
                  )}
                </div>

                <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1.5 text-[11px]">
                  <div className="flex justify-between font-semibold pb-1 border-b border-slate-200 text-[10px]">
                    <span>DỊCH VỤ / VẬT TƯ</span>
                    <span>THÀNH TIỀN</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="pr-2">Công sửa chữa</span>
                    <span>{laborCost.toLocaleString("vi-VN")} đ</span>
                  </div>

                  {parts.map((p, idx) => {
                    const q = Number(p.quantity || 1);
                    const pr = Number(p.price || 0);
                    return (
                      <div key={idx} className="space-y-0.5">
                        <div className="flex justify-between">
                          <span className="truncate pr-2">{p.inventoryName}</span>
                          <span>{(q * pr).toLocaleString("vi-VN")} đ</span>
                        </div>
                        <div className="text-[10px] text-slate-500 pl-2">
                          {q} x {pr.toLocaleString("vi-VN")} đ
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-xs">
                  <div className="flex justify-between font-black text-sm">
                    <span>TỔNG CỘNG:</span>
                    <span>{totalAmount.toLocaleString("vi-VN")} đ</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span>Thanh toán:</span>
                    <span>{paymentMethod}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span>Trạng thái:</span>
                    <strong>Đã thanh toán</strong>
                  </div>
                </div>

                <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[10px] text-slate-600">
                  <div className="font-bold text-slate-900 text-[11px]">CHÍNH SÁCH BẢO HÀNH:</div>
                  <div>• Thời hạn: {warrantyDays} ngày (đến {warrantyEndDate})</div>
                  <div>• Bảo hành 1 đổi 1 linh kiện lỗi do NSX.</div>
                  <div>• Từ chối bảo hành nếu rơi vỡ, vào nước.</div>
                </div>
                <div className="pt-3 text-center text-[10px] text-slate-500 space-y-1">
                  <p>Quý khách vui lòng kiểm tra kỹ máy trước khi rời quầy.</p>
                  <p className="font-bold">Cảm ơn Quý khách & Hẹn gặp lại!</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintRepairModal;
