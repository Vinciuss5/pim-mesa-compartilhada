// src/components/ui/Campo.jsx
// Rótulo + campo + dica, no padrão visual dos formulários do sistema.

export const inputClass =
  'w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#007F45] focus:ring-1 focus:ring-[#007F45] disabled:bg-gray-50 disabled:text-gray-500';

/**
 * Uso: <Campo id="nome" label="Nome" obrigatorio dica="..."><input id="nome" className={inputClass} .../></Campo>
 */
export default function Campo({ id, label, obrigatorio = false, opcional = false, dica, className = '', children }) {
  return (
    <div className={className}>
      <label className="mb-1 block text-sm font-medium text-[#4A5568]" htmlFor={id}>
        {label}
        {obrigatorio && <span className="text-red-500"> *</span>}
        {opcional && <span className="font-normal text-[#A0AEC0]"> — opcional</span>}
      </label>
      {children}
      {dica && <p className="mt-1 text-[11px] text-[#718096]">{dica}</p>}
    </div>
  );
}