// src/pages/Estoque/components/LotesTab.jsx
// Visão por LOTE (produto + validade): é aqui que se ajusta o estoque (perda, vencimento, avaria, correção).
import { useMemo, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import SearchInput from '../../../components/ui/SearchInput';
import StatusBadge from '../../../components/ui/StatusBadge';
import { formatarNumero, formatarQuantidade } from '../../../utils/format';

const FILTRO_TODOS = 'Todos os Status';

export default function LotesTab({ estoque, isLoading, error, onAjustar, busca, onBusca }) {
  const [statusFilter, setStatusFilter] = useState(FILTRO_TODOS);

  const lista = useMemo(() => {
    const termo = busca.toLowerCase().trim();

    return estoque.filter((item) => {
      const nome = item.nome?.toLowerCase() || '';
      const lote = item.lote?.toLowerCase() || '';
      const origem = item.origem?.toLowerCase() || '';

      const matchBusca = nome.includes(termo) || lote.includes(termo) || origem.includes(termo);
      const matchStatus =
        statusFilter === FILTRO_TODOS || item.status?.toLowerCase() === statusFilter.toLowerCase();

      return matchBusca && matchStatus;
    });
  }, [estoque, busca, statusFilter]);

  return (
    <div>
      {/* FILTROS */}
      <div className="flex flex-col gap-4 rounded-t-xl border border-gray-100 bg-white p-4 md:flex-row">
        <SearchInput
          value={busca}
          onChange={onBusca}
          placeholder="Filtrar lotes por produto ou origem..."
          className="max-w-none flex-grow"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filtrar por status"
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-[#007F45]"
        >
          <option value={FILTRO_TODOS}>Todos os Status</option>
          <option value="Vencido">Vencido</option>
          <option value="Vence em breve">Vence em breve</option>
          <option value="Disponível">Disponível</option>
        </select>
      </div>

      {/* ESTADOS DE CARREGAMENTO E ERRO */}
      {isLoading && (
        <div className="rounded-b-xl border-x border-b border-gray-100 bg-white p-8 text-center text-gray-500">
          Carregando lotes...
        </div>
      )}

      {error && !isLoading && (
        <div className="rounded-b-xl border-x border-b border-gray-100 bg-white p-8 text-center text-red-500">
          Erro ao carregar dados: {error}
        </div>
      )}

      {/* TABELA */}
      {!isLoading && !error && (
        <div className="overflow-x-auto rounded-b-xl border-x border-b border-gray-100 bg-white shadow-sm">
          <table className="w-full min-w-[950px] text-sm">
            <thead className="border-b border-gray-100 bg-gray-50/50 text-[#718096]">
              <tr>
                {['Produto', 'Quantidade no lote', 'Status', 'Origem', 'Entrada', 'Validade', 'Ação'].map((titulo) => (
                  <th
                    key={titulo}
                    className="px-4 py-4 text-left text-[11px] font-semibold uppercase tracking-tighter first:px-5"
                  >
                    {titulo}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lista.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-5 py-8 text-center text-gray-500">
                    Nenhum lote encontrado.
                  </td>
                </tr>
              ) : (
                lista.map((item) => {
                  const situacao = item.status?.toLowerCase();
                  const vencido = situacao === 'vencido';
                  const venceEmBreve = situacao === 'vence em breve';

                  return (
                    <tr
                      key={item.id}
                      className={`cursor-default transition-all hover:bg-gray-50/80 ${vencido ? 'bg-red-50/40' : ''}`}
                    >
                      <td className="px-5 py-4">
                        <div className="whitespace-nowrap font-bold text-[#2D3748]">{item.nome}</div>
                      </td>

                      <td className="whitespace-nowrap px-4 py-4">
                        <div className="font-semibold text-[#4A5568]">{formatarQuantidade(item.qtd, item.unidade)}</div>
                        {/* Peso por unidade informado: mostra o total estimado em kg */}
                        {item.peso > 0 && (
                          <div className="text-[11px] italic text-[#718096]">
                            {formatarNumero(item.peso)} kg/{item.unidade} · ≈ {formatarNumero(item.qtd * item.peso)} kg
                          </div>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4">
                        <StatusBadge status={item.status} />
                      </td>

                      <td
                        className="max-w-[150px] truncate px-4 py-4 text-xs font-medium text-[#718096]"
                        title={item.origem}
                      >
                        {item.origem}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-xs font-medium text-[#718096]">{item.entrada}</td>

                      <td className="whitespace-nowrap px-4 py-4 text-xs font-semibold">
                        <div className="flex items-center gap-2">
                          {(vencido || venceEmBreve) && (
                            <span
                              className={`h-2 w-2 rounded-full ${vencido ? 'bg-red-500' : 'animate-pulse bg-amber-500'}`}
                              title={vencido ? 'Lote vencido' : 'Vence em menos de 30 dias'}
                            />
                          )}
                          <span
                            className={vencido ? 'text-red-600' : venceEmBreve ? 'text-amber-700' : 'text-[#4A5568]'}
                          >
                            {item.validade}
                          </span>
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-4 py-4">
                        <button
                          onClick={() => onAjustar(item)}
                          aria-label={`Ajustar ${item.nome}`}
                          className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-[#4A5568] transition-colors hover:border-[#007F45] hover:text-[#007F45]"
                        >
                          <SlidersHorizontal size={14} />
                          Ajustar
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}