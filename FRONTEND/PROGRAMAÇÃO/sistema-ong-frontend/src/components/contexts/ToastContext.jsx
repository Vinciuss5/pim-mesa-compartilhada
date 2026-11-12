// src/contexts/ToastContext.jsx
// Notificações no canto da tela, no lugar de alert().
//
// Uso em qualquer componente:
//   const toast = useToast();
//   toast.success('Salvo!');   toast.error('Algo deu errado');   toast.info('Aviso');

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const ESTILOS = {
  success: { caixa: 'border-green-200 bg-green-50 text-green-800', Icone: CheckCircle2 },
  error: { caixa: 'border-red-200 bg-red-50 text-red-800', Icone: AlertCircle },
  info: { caixa: 'border-blue-200 bg-blue-50 text-blue-800', Icone: Info },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const proximoId = useRef(0);

  const remover = useCallback((id) => {
    setToasts((atual) => atual.filter((t) => t.id !== id));
  }, []);

  const mostrar = useCallback(
    (tipo, mensagem, duracao) => {
      const id = ++proximoId.current;
      setToasts((atual) => [...atual, { id, tipo, mensagem }]);
      if (duracao > 0) setTimeout(() => remover(id), duracao);
    },
    [remover]
  );

  // Objeto estável: pode ser usado em dependências de useEffect/useCallback sem causar loops
  const toast = useMemo(
    () => ({
      success: (mensagem, duracao = 4000) => mostrar('success', mensagem, duracao),
      error: (mensagem, duracao = 8000) => mostrar('error', mensagem, duracao),
      info: (mensagem, duracao = 5000) => mostrar('info', mensagem, duracao),
    }),
    [mostrar]
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}

      <div
        className="pointer-events-none fixed right-4 top-4 z-[60] flex w-full max-w-sm flex-col gap-3"
        aria-live="polite"
      >
        {toasts.map(({ id, tipo, mensagem }) => {
          const { caixa, Icone } = ESTILOS[tipo];
          return (
            <div
              key={id}
              role={tipo === 'error' ? 'alert' : 'status'}
              className={`pointer-events-auto flex items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg ${caixa}`}
            >
              <Icone size={18} className="mt-0.5 shrink-0" />
              <span className="flex-1">{mensagem}</span>
              <button
                type="button"
                onClick={() => remover(id)}
                aria-label="Fechar aviso"
                className="shrink-0 opacity-60 hover:opacity-100"
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const contexto = useContext(ToastContext);
  if (!contexto) {
    throw new Error('useToast precisa ser usado dentro de <ToastProvider>.');
  }
  return contexto;
}