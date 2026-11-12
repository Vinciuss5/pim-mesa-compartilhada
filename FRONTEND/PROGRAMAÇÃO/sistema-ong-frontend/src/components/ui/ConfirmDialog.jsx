// src/components/ui/ConfirmDialog.jsx
// Confirmação para ações que não têm volta (no lugar de window.confirm).
import Modal from './Modal';

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Voltar',
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      footer={
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-md px-4 py-2 text-sm font-medium text-[#718096] transition-colors hover:text-[#2D3748] disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`rounded-md px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors disabled:opacity-60 ${
              danger ? 'bg-red-600 hover:bg-red-700' : 'bg-[#007F45] hover:bg-[#006838]'
            }`}
          >
            {loading ? 'Processando...' : confirmLabel}
          </button>
        </div>
      }
    >
      <p className="p-6 text-sm leading-relaxed text-[#4A5568]">{message}</p>
    </Modal>
  );
}
