import { useEffect, useMemo, useState } from 'react';
import { useMovimentacoes } from '../../StatusBadge/hooks/useMovimentacoes';
import { useProdutos } from '../../StatusBadge/hooks/useProdutos';
import { formatarData, formatarQuantidade, hojeISO } from '../../utils/format';
import PageHeader from '../../components/ui/PageHeader';
import StatusBadge from '../../components/ui/StatusBadge';

const LIMITE = 200;

const TIPOS = [
  { value: '', label: 'Todos os tipos' },
  { value: 'ENTRADA', label: 'Entrada' },
  { value: 'SAIDA', label: 'Saída' },
  { value: 'ESTORNO', label: 'Estorno' },
  { value: 'AJUSTE', label: 'Ajuste' },
];

// Texto que aparece no selo (com acento)
const ROTULO_TIPO = { ENTRADA: 'Entrada', SAIDA: 'Saída', ESTORNO: 'Estorno', AJUSTE: 'Ajuste' };

const ROTULO_MOTIVO = {
  PERDA: 'Perda',
  VENCIMENTO: 'Vencimento',
  AVARIA: 'Avaria',
  CORRECAO: 'Correção',
};

// "AAAA-MM-DD" de N dias atrás, no fuso do usuário
const diasAtrasISO = (dias) => {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
};

const inputClass =
  'rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-[#007F45]';

export default function Movimentacoes() {
  const { movimentacoes, loading, error, fetchMovimentacoes } = useMovimentacoes();
  const { produtos, fetchProdutos } = useProdutos();

  const [filtros, setFiltros] = useState({
    produtoId: '',
    tipo: '',
    de: diasAtrasISO(30),
    ate: hojeISO(),
  });

  useEffect(() => {
    fetchProdutos();
  }, [fetchProdutos]);

  // Busca de novo sempre que um filtro muda
  useEffect(() => {
    fetchMovimentacoes({ ...filtros, limite: LIMITE });
  }, [filtros, fetchMovimentacoes]);

  const atualizarFiltro = (campo) => (e) =>
    setFiltros((atual) => ({ ...atual, [campo]: e.target.value }));

  const resumo = useMemo(() => {
    const contagem = { ENTRADA: 0, SAIDA: 0, ESTORNO: 0, AJUSTE: 0 };
    movimentacoes.forEach((m) => {
      contagem[m.tipo] = (contagem[m.tipo] ?? 0) + 1;
    });
    return contagem;
  }, [movimentacoes]);

  const dataHora = (valor) =>
    new Date(valor).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-8 font-sans text-[#2D3748]">
      <PageHeader
        title="Movimentações de Estoque"
        subtitle="Histórico de tudo que entrou, saiu, foi devolvido ou ajustado."
      />

      {/* RESUMO */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {Object.entries(resumo).map(([tipo, total]) => (
          <div key={tipo} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <StatusBadge status={ROTULO_TIPO[tipo]} />
            <p className="mt-2 text-2xl font-extrabold">{total}</p>
            <p className="text-xs text-[#718096]">no período filtrado</p>
          </div>
        ))}
      </div>

      {/* FILTROS */}
      <div className="flex flex-col gap-4 rounded-t-xl border border-gray-100 bg-white p-4 lg:flex-row lg:items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-[#718096]" htmlFor="mov-produto">Produto</label>
          <select id="mov-produto" value={filtros.produtoId} onChange={atualizarFiltro('produtoId')} className={inputClass}>
            <option value="">Todos os produtos</option>
            {produtos.map((p) => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-[#718096]" htmlFor="mov-tipo">Tipo</label>
          <select id="mov-tipo" value={filtros.tipo} onChange={atualizarFiltro('tipo')} className={inputClass}>
            {TIPOS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-[#718096]" htmlFor="mov-de">De</label>
          <input id="mov-de" type="date" value={filtros.de} max={filtros.ate || undefined} onChange={atualizarFiltro('de')} className={inputClass} />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-[#718096]" htmlFor="mov-ate">Até</label>
          <input id="mov-ate" type="date" value={filtros.ate} min={filtros.de || undefined} onChange={atualizarFiltro('ate')} className={inputClass} />
        </div>
      </div>

      {/* ESTADOS */}
      {loading && (
        <div className="rounded-b-xl border-x border-b border-gray-100 bg-white p-8 text-center text-gray-500">
          Carregando movimentações...
        </div>
      )}

      {error && !loading && (
        <div className="rounded-b-xl border-x border-b border-gray-100 bg-white p-8 text-center text-red-500">
          Erro ao carregar dados: {error}
        </div>
      )}

      {/* TABELA */}
      {!loading && !error && (
        <div className="overflow-x-auto rounded-b-xl border-x border-b border-gray-100 bg-white shadow-sm">
          <table className="w-full min-w-[1000px] text-sm">
            <thead className="border-b border-gray-100 bg-gray-50/50 text-[#718096]">
              <tr>
                {['Data/hora', 'Tipo', 'Produto', 'Quantidade', 'Lote (validade)', 'Origem', 'Responsável', 'Observação'].map((titulo) => (
                  <th key={titulo} className="px-4 py-4 text-left text-[11px] font-semibold uppercase tracking-tighter first:px-5">
                    {titulo}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {movimentacoes.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-5 py-8 text-center text-gray-500">
                    Nenhuma movimentação encontrada neste período.
                  </td>
                </tr>
              ) : (
                movimentacoes.map((m) => {
                  const entrou = m.quantidade > 0;

                  return (
                    <tr key={m.id} className="transition-colors hover:bg-gray-50/80">
                      <td className="whitespace-nowrap px-5 py-4 text-xs text-[#718096]">{dataHora(m.dataHora)}</td>
                      <td className="whitespace-nowrap px-4 py-4">
                        <StatusBadge status={ROTULO_TIPO[m.tipo] ?? m.tipo} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 font-bold text-[#2D3748]">{m.produtoNome}</td>
                      <td className={`whitespace-nowrap px-4 py-4 font-mono font-semibold ${entrou ? 'text-green-700' : 'text-red-600'}`}>
                        {entrou ? '+' : '−'}
                        {formatarQuantidade(Math.abs(m.quantidade), m.unidade)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-xs text-[#4A5568]">
                        {m.loteId ? (m.loteValidade ? formatarData(m.loteValidade) : 'Sem validade') : '—'}
                      </td>
                      <td className="px-4 py-4 text-xs text-[#4A5568]">
                        {m.referencia ?? (m.motivo ? ROTULO_MOTIVO[m.motivo] ?? m.motivo : '—')}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-xs text-[#718096]">{m.usuarioNome ?? '—'}</td>
                      <td className="max-w-[220px] truncate px-4 py-4 text-xs text-[#718096]" title={m.observacao ?? ''}>
                        {m.tipo === 'AJUSTE' && m.motivo ? (
                          <span className="font-medium text-[#4A5568]">{ROTULO_MOTIVO[m.motivo] ?? m.motivo}</span>
                        ) : null}
                        {m.tipo === 'AJUSTE' && m.motivo && m.observacao ? ' — ' : ''}
                        {m.observacao ?? ''}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {movimentacoes.length >= LIMITE && (
            <p className="border-t border-gray-100 px-5 py-3 text-xs text-[#718096]">
              Mostrando as {LIMITE} movimentações mais recentes. Use os filtros para refinar.
            </p>
          )}
        </div>
      )}
    </div>
  );
}