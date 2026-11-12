// src/components/ui/StatusBadge.jsx
// Selo de status único para Estoque e Solicitações (antes eram dois componentes diferentes).

const ESTILOS = {
  // Estoque
  'disponível': 'bg-green-50 text-green-700 border-green-200',
  'baixo estoque': 'bg-orange-50 text-orange-700 border-orange-200',
  'esgotado': 'bg-red-50 text-red-700 border-red-200',
  // Solicitações
  'pendente': 'bg-amber-50 text-amber-700 border-amber-200',
  'entregue': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'cancelado': 'bg-red-50 text-red-700 border-red-200',
  // Movimentações
  'entrada': 'bg-green-50 text-green-700 border-green-200',
  'saída': 'bg-orange-50 text-orange-700 border-orange-200',
  'estorno': 'bg-blue-50 text-blue-700 border-blue-200',
  'ajuste': 'bg-purple-50 text-purple-700 border-purple-200',
  // Lotes
  'vencido': 'bg-red-50 text-red-700 border-red-200',
  'vence em breve': 'bg-amber-50 text-amber-700 border-amber-200',
  // Resumo por produto
  'em estoque': 'bg-green-50 text-green-700 border-green-200',
  'zerado': 'bg-red-50 text-red-700 border-red-200',
  'abaixo do mínimo': 'bg-orange-50 text-orange-700 border-orange-200',
  'só vencido': 'bg-purple-50 text-purple-700 border-purple-200',
};

export default function StatusBadge({ status }) {
  if (!status) return null;

  const estilo = ESTILOS[status.toLowerCase()] ?? 'bg-gray-50 text-gray-700 border-gray-200';

  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase ${estilo}`}
    >
      {status}
    </span>
  );
}