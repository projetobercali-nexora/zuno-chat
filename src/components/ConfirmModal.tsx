import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      data-testid="confirm-modal-backdrop"
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-desc"
      onClick={onCancel}
    >
      <div
        data-testid="confirm-modal"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-[#0B5226]/15 bg-white p-5 sm:p-6 shadow-2xl space-y-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FCEBEB] text-[#D63B3A]">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3
                id="confirm-modal-title"
                className="font-display text-base sm:text-lg font-bold text-[#0B5226]"
              >
                {title}
              </h3>
              <p
                id="confirm-modal-desc"
                className="mt-1 text-sm text-[#526058] leading-relaxed"
              >
                {description}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            aria-label="Fechar confirmação"
            className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl text-[#526058] hover:bg-[#F4F4F2]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2 border-t border-[#F4F4F2]">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[#E2E7E3] bg-white px-4 py-2 text-sm font-semibold text-[#0B5226] hover:bg-[#F4F4F2] transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            data-testid="confirm-modal-submit"
            onClick={onConfirm}
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#D63B3A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b92f2e] active:bg-[#9c2423] transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
