"use client";

import { AlertTriangle, X } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "default";
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmDialogProps) {
  if (!open) return null;

  const variantStyles = {
    danger: "bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30",
    warning: "bg-[#f5c518]/20 text-[#f5c518] border-[#f5c518]/30 hover:bg-[#f5c518]/30",
    default: "btn-glass-primary",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="glass-card w-full max-w-sm text-center animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-text-secondary hover:text-white transition-colors"
        >
          <X size={18} />
        </button>

        {variant === "danger" && (
          <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={28} className="text-red-400" />
          </div>
        )}
        {variant === "warning" && (
          <div className="w-14 h-14 rounded-full bg-[#f5c518]/20 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={28} className="text-[#f5c518]" />
          </div>
        )}

        <h3 className="font-bold text-white text-lg mb-2">{title}</h3>
        <p className="text-text-secondary text-sm mb-6 leading-relaxed">{message}</p>

        <div className="flex gap-3 justify-center">
          <button
            onClick={onCancel}
            disabled={loading}
            className="btn-glass"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`btn-glass ${variantStyles[variant]}`}
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
            ) : null}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
