import { FiAlertCircle, FiTrash2, FiX, FiCheck } from "react-icons/fi";

export default function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = "Confirm", 
  cancelText = "Cancel",
  type = "danger", // danger, warning, success, info
  isLoading = false 
}) {
  if (!isOpen) return null;

  const typeStyles = {
    danger: {
      gradient: "from-red-500 to-red-600",
      icon: <FiTrash2 size={24} />,
      button: "bg-red-500 hover:bg-red-600"
    },
    warning: {
      gradient: "from-yellow-500 to-yellow-600",
      icon: <FiAlertCircle size={24} />,
      button: "bg-yellow-500 hover:bg-yellow-600"
    },
    success: {
      gradient: "from-green-500 to-green-600",
      icon: <FiCheck size={24} />,
      button: "bg-green-500 hover:bg-green-600"
    },
    info: {
      gradient: "from-blue-500 to-blue-600",
      icon: <FiAlertCircle size={24} />,
      button: "bg-blue-500 hover:bg-blue-600"
    }
  };

  const style = typeStyles[type] || typeStyles.danger;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-scaleIn">
        <div className={`p-6 bg-gradient-to-r ${style.gradient} text-white`}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              {style.icon}
            </div>
            <h2 className="text-2xl font-black">{title}</h2>
          </div>
        </div>

        <div className="p-6">
          <p className="text-gray-700 whitespace-pre-line">{message}</p>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex-1 px-4 py-3 ${style.button} text-white rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
