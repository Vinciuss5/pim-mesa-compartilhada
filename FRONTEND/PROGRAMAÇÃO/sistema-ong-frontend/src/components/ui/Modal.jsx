// src/components/ui/Modal.jsx
import { useEffect } from 'react';
import { X } from 'lucide-react';

const TAMANHOS = {
  sm: 'max-w-md',
  md: 'max-w-[540px]',
  lg: 'max-w-2xl',
  xl: 'max-w-[800px]',
};

/**
 * Modal padrão do sistema.
 *
 * Props:
 *  - open: boolean
 *  - onClose: () => void
 *  - title: string
 *  - size: 'sm' | 'md' | 'lg' | 'xl'
 *  - footer: JSX opcional (rodapé fixo, fora da área que rola)
 *  - closeOnOverlay: fecha ao clicar fora (padrão: false, para não perder dados digitados sem querer)
 *
 * Esc fecha o modal. Para formulários, use <form id="x"> no conteúdo
 * e <button type="submit" form="x"> no footer.
 */
export default function Modal({
  open,
  onClose,
  title,
  size = 'md',
  footer,
  closeOnOverlay = false,
  children,
}) {
  useEffect(() => {
    if (!open) return;
    const aoPressionar = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', aoPressionar);
    return () => document.removeEventListener('keydown', aoPressionar);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (closeOnOverlay && e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`flex max-h-[92vh] w-full ${TAMANHOS[size] ?? TAMANHOS.md} flex-col overflow-hidden rounded-xl bg-white shadow-2xl`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 p-5">
          <h2 className="text-xl font-bold text-[#1A202C]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-md p-1 text-[#A0AEC0] transition-colors hover:bg-gray-100 hover:text-[#4A5568]"
          >
            <X size={22} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">{children}</div>

        {footer && (
          <div className="shrink-0 border-t border-gray-100 bg-gray-50 p-5">{footer}</div>
        )}
      </div>
    </div>
  );
}
