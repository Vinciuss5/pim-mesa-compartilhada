// src/pages/Relatorios/components/blocos.jsx
// Peças visuais reutilizadas por todas as abas dos relatórios.
import { Download } from 'lucide-react';
import { formatarQuantidade } from '../../../utils/format';

// Classes completas (o Tailwind só gera o que aparece escrito por inteiro)
const COR = {
  gray: { borda: 'border-l-gray-300', numero: 'text-[#2D3748]' },
  green: { borda: 'border-l-green-500', numero: 'text-green-700' },
  red: { borda: 'border-l-red-500', numero: 'text-red-600' },
  orange: { borda: 'border-l-orange-500', numero: 'text-orange-600' },
  amber: { borda: 'border-l-amber-500', numero: 'text-amber-600' },
  yellow: { borda: 'border-l-yellow-400', numero: 'text-yellow-600' },
  blue: { borda: 'border-l-blue-400', numero: 'text-blue-600' },
};

/** Cartão de indicador: título, número grande (opcional), conteúdo livre (children) e detalhe. */
export function Indicador({ titulo, valor, detalhe, cor = 'gray', children }) {
  const c = COR[cor] ?? COR.gray;

  return (
    <div className={`rounded-xl border-y border-r border-l-4 border-gray-100 bg-white p-4 shadow-sm ${c.borda}`}>
      <span className="block text-[11px] font-bold uppercase leading-tight tracking-wider text-[#718096]">
        {titulo}
      </span>
      {valor !== undefined && valor !== null && (
        <span className={`mt-2 block text-3xl font-extrabold ${c.numero}`}>{valor}</span>
      )}
      {children}
      {detalhe && <span className="mt-1 block text-[11px] leading-snug text-[#718096]">{detalhe}</span>}
    </div>
  );
}

/** Quantidades por unidade em "pílulas": 120 kg · 30 un. Unidades diferentes nunca se somam. */
export function Quantidades({ lista, cor = 'gray' }) {
  if (!lista || lista.length === 0) {
    return <span className="mt-2 block text-sm text-[#A0AEC0]">—</span>;
  }

  const estilo = cor === 'red' ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-[#2D3748]';

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {lista.map((q) => (
        <span key={q.unidade} className={`rounded-lg px-3 py-1 text-sm font-bold ${estilo}`}>
          {formatarQuantidade(q.quantidade, q.unidade)}
        </span>
      ))}
    </div>
  );
}

/** Seção com título e, se houver, botão de exportar CSV. */
export function Secao({ titulo, descricao, onExportar, exportarDesativado = false, children }) {
  return (
    <section className="mb-8">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-[#2D3748]">{titulo}</h2>
          {descricao && <p className="text-xs text-[#718096]">{descricao}</p>}
        </div>
        {onExportar && (
          <button
            onClick={onExportar}
            disabled={exportarDesativado}
            className="flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-[#4A5568] transition-colors hover:border-[#007F45] hover:text-[#007F45] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download size={14} />
            Exportar CSV
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

/** Estado de carregamento / erro de um relatório (ainda sem dados). */
export function Estado({ loading, error, onTentarDeNovo }) {
  if (error) {
    return (
      <div className="rounded-xl border border-red-100 bg-white p-8 text-center text-sm text-red-600">
        Erro ao carregar o relatório: {error}
        <button onClick={onTentarDeNovo} className="ml-3 font-semibold underline underline-offset-2">
          Tentar de novo
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white p-8 text-center text-sm text-gray-500">
        Carregando relatório...
      </div>
    );
  }

  return null;
}

/**
 * Tabela simples e padronizada.
 * colunas = [{ titulo, render: (linha) => ..., alinhar?: 'direita', classe?: string }]
 */
export function TabelaDados({ colunas, linhas, chave, vazio = 'Nenhum registro no período.' }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
      <table className="w-full min-w-[560px] text-sm">
        <thead className="border-b border-gray-100 bg-gray-50/50 text-[#718096]">
          <tr>
            {colunas.map((c) => (
              <th
                key={c.titulo}
                className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-tighter ${
                  c.alinhar === 'direita' ? 'text-right' : 'text-left'
                }`}
              >
                {c.titulo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {linhas.length === 0 ? (
            <tr>
              <td colSpan={colunas.length} className="px-4 py-6 text-center text-[#A0AEC0]">
                {vazio}
              </td>
            </tr>
          ) : (
            linhas.map((linha) => (
              <tr key={chave(linha)} className="transition-colors hover:bg-gray-50/80">
                {colunas.map((c) => (
                  <td
                    key={c.titulo}
                    className={`px-4 py-3 ${c.alinhar === 'direita' ? 'text-right' : ''} ${c.classe ?? 'text-[#4A5568]'}`}
                  >
                    {c.render(linha)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

/** As seis faixas da fila de entregas pendentes (retrato de agora). */
export function FilaEntregas({ fila }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
      <Indicador titulo="Atrasadas" valor={fila.atrasadas} cor={fila.atrasadas > 0 ? 'red' : 'gray'} />
      <Indicador titulo="Hoje" valor={fila.hoje} cor={fila.hoje > 0 ? 'orange' : 'gray'} />
      <Indicador titulo="Amanhã" valor={fila.amanha} cor={fila.amanha > 0 ? 'amber' : 'gray'} />
      <Indicador titulo="Em 2 a 7 dias" valor={fila.ate7Dias} cor={fila.ate7Dias > 0 ? 'blue' : 'gray'} />
      <Indicador titulo="Depois de 7 dias" valor={fila.depois} />
      <Indicador titulo="Sem previsão" valor={fila.semPrevisao} cor={fila.semPrevisao > 0 ? 'yellow' : 'gray'} />
    </div>
  );
}