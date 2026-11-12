// src/components/ui/PageHeader.jsx
// Cabeçalho padrão das telas: título, subtítulo e (opcional) o botão de ação principal.

export default function PageHeader({ title, subtitle, children }) {
  return (
    <div className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
      <div>
        <h1 className="text-2xl font-bold text-[#2D3748]">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-[#718096]">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
