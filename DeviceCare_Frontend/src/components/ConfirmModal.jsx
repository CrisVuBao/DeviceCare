import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, HelpCircle, X } from "lucide-react";

// Popup xác nhận
const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Xác nhận",
  cancelText = "Hủy bỏ",
  isDanger = true,
  icon: CustomIcon
}) => {
  const IconComponent = CustomIcon || (isDanger ? Trash2 : HelpCircle);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 6 }}
            transition={{ type: "spring", stiffness: 420, damping: 28 }}
            className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border border-slate-200 z-10 overflow-hidden"
          >
            <div className="flex items-start space-x-4">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                  isDanger
                    ? "bg-red-50 text-red-600 border border-red-200"
                    : "bg-blue-50 text-blue-600 border border-blue-200"
                }`}
              >
                <IconComponent size={22} />
              </div>

              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900 leading-snug">{title}</h3>
                <p className="mt-1 text-sm text-slate-500 leading-relaxed">
                  {message}
                </p>
              </div>

              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <motion.button
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={onClose}
                className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
              >
                {cancelText}
              </motion.button>
              <motion.button
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`px-4 py-2 text-sm font-semibold text-white rounded-xl transition-colors shadow-sm cursor-pointer ${
                  isDanger
                    ? "bg-red-600 hover:bg-red-700 active:bg-red-800"
                    : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
                }`}
              >
                {confirmText}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmModal;
