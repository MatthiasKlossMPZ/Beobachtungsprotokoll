import { useState } from 'preact/hooks';

export default function ConfirmModal({
  isOpen,
  title = "Bestätigen",
  message,
  confirmText = "Ja",
  cancelText = "Abbrechen",
  onConfirm,
  onCancel,
  danger = false   // für rote Buttons bei "Verwerfen"
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b">
          <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
        </div>

        {/* Nachricht */}
        <div className="p-6 text-slate-700">
          {message}
        </div>

        {/* Buttons */}
        <div className="flex border-t">
          <button
            onClick={onCancel}
            className="flex-1 py-5 text-slate-600 font-medium hover:bg-slate-100 transition border-r"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-5 font-semibold transition ${
              danger 
                ? 'text-red-600 hover:bg-red-50' 
                : 'text-blue-600 hover:bg-blue-50'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}