// src/pages/Estoque/components/ResumoTab.jsx
// Visão por PRODUTO: saldo disponível, mínimo, lotes, próxima validade e situação,
// com cards de alerta que também funcionam como filtros.
import { useMemo, useState } from 'react';
import SearchInput from '../../../components/ui/SearchInput';
import StatusBadge from '../../../components/ui/StatusBadge';
import { formatarData, formatarNumero, formatarQuantidade } from '../../../utils/format';
import { CATEGORIAS, rotuloCategoria } from '../../../utils/produtoOpcoes';

// Rótulo exibido e prioridade na lista (o mais crítico primeiro)
const SITUACAO = {
  SOMENTE_VENCIDO: { rotulo: 'Só vencido', ordem: 0 },
  ZERADO: { rotulo: 'Zerado', ordem: 1 },
  BAIXO: { rotulo: 'Abaixo do mínimo', ordem: 2 },
  OK: { rotulo: 'Em estoque', ordem: 3 },
};

// Cada card é um filtro. A regra de cada um fica aqui, num lugar só (usada para contar e para filtrar).
const FILTROS = [
  { id: 'ZERADO', rotulo: 'Zerados', cor: 'red', regra: (p) => p.situacao === 'ZERADO' },
  { id: 'BAIXO', rotulo: 'Abaixo do mínimo', cor: 'orange', regra: (p) => p.situacao === 'BAIXO' },
  { id: 'COM_VENCIDO', rotulo: 'Com lote vencido', cor: 'red', regra: (p) => p.saldoVencido > 0 },
  // O alerta de validade vem do backend (RegrasValidade): urgente = poucos dias;
  // atenção = dentro da antecedência configurada em CADA produto.
  {
    id: 'URGENTE',
    rotulo: 'Vencimento urgente',
    dica: 'faltam até 7 dias',
    cor: 'amber',
    regra: (p) => p.alertaValidade === 'URGENTE',
  },
  {
    id: 'ATENCAO',
    rotulo: 'Vencimento em atenção',
    dica: 'dentro do alerta do produto',
    cor: 'yellow',
    regra: (p) => p.alertaValidade === 'ATENCAO',
  },
];

// Classes completas (o Tailwind só gera o que aparece escrito por inteiro)
const COR_CARD = {
  red: { borda: 'border-l-red-500', numero: 'text-red-600', anel: 'ring-red-300' },
  orange: { borda: 'border-l-orange-500', numero: 'text-orange-600', anel: 'ring-orange-300' },
  amber: { borda: 'border-l-amber-500', numero: 'text-amber-600', anel: 'ring-amber-300' },
  yellow: { borda: 'border-l-yellow-400', numero: 'text-yellow-600', anel: 'ring-yellow-300' },
};

const inputClass =
  'rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-[#007F45]';

export default function ResumoTab({ produtos, loading, error, onVerLotes }) {
  const [busca, setBusca] = useState('');
  const [categoria, setCategoria] = useState('');
  const [filtroAtivo, setFiltroAtivo] = useState(null); // id de FILTROS ou null

  // ---- Indicadores e totais (calculados a partir do resumo) ----
  const { contagens, comSaldo, totaisPorUnidade, pesoTotalKg, semEstimativa } = useMemo(() => {
    const contagens = {};
    FILTROS.forEach((f) => {
      contagens[f.id] = produtos.filter(f.regra).length;
    });

    const porUnidade = new Map();
    let comSaldo = 0;
    let pesoTotalKg = 0;
    let semEstimativa = 0;

    produtos.forEach((p) => {
      if (p.saldoDisponivel <= 0) return;
      comSaldo++;

      const atual = porUnidade.get(p.unidadeSigla) ?? { sigla: p.unidadeSigla, tipo: p.unidadeTipo, total: 0 };
      atual.total += p.saldoDisponivel;
      porUnidade.set(p.unidadeSigla, atual);

      if (p.pesoEstimadoKg != null) pesoTotalKg += p.pesoEstimadoKg;
      else semEstimativa++;
    });

    const ordemTipo = { MASSA: 0, VOLUME: 1, CONTAGEM: 2 };
    const totaisPorUnidade = [...porUnidade.values()].sort(
      (a, b) => (ordemTipo[a.tipo] ?? 9) - (ordemTipo[b.tipo] ?? 9) || a.sigla.localeCompare(b.sigla)
    );

    return { contagens, comSaldo, totaisPorUnidade, pesoTotalKg, semEstimativa };
  }, [produtos]);

  // ---- Lista filtrada e ordenada ----
  const lista = useMemo(() => {
    const termo = busca.toLowerCase().trim();
    const regraFiltro = FILTROS.find((f) => f.id === filtroAtivo)?.regra;

    return produtos
      .filter((p) => p.nome.toLowerCase().includes(termo))
      .filter((p) => !categoria || p.categoria === categoria)
      .filter((p) => !regraFiltro || regraFiltro(p))
      .sort(
        (a, b) =>
          (SITUACAO[a.situacao]?.ordem ?? 9) - (SITUACAO[b.situacao]?.ordem ?? 9) ||
          a.nome.localeCompare(b.nome)
      );
  }, [produtos, busca, categoria, filtroAtivo]);

  const alternarFiltro = (id) => setFiltroAtivo((atual) => (atual === id ? null : id));

  return (
    <div>
      {/* TOTAIS GERAIS */}
      <div className="mb-6 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#718096]">Total em estoque (disponível)</span>
          <span className="text-xs text-[#718096]">
            {comSaldo} de {produtos.length} produto(s) com saldo
          </span>
        </div>

        {totaisPorUnidade.length === 0 ? (
          <p className="mt-3 text-sm text-[#718096]">Nenhum saldo disponível no momento.</p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-3">
            {totaisPorUnidade.map((t) => (
              <div key={t.sigla} className="rounded-lg bg-gray-50 px-4 py-2">
                <span className="text-xl font-extrabold text-[#2D3748]">{formatarNumero(t.total)}</span>{' '}
                <span className="text-sm font-semibold text-[#718096]">{t.sigla}</span>
              </div>
            ))}
            {pesoTotalKg > 0 && (
              <div className="rounded-lg bg-[#007F45]/10 px-4 py-2">
                <span className="text-xl font-extrabold text-[#007F45]">≈ {formatarNumero(pesoTotalKg)}</span>{' '}
                <span className="text-sm font-semibold text-[#007F45]">kg no total</span>
              </div>
            )}
          </div>
        )}

        <p className="mt-3 text-[11px] text-[#718096]">
          Unidades diferentes não se somam (kg, L e un ficam separados).
          {semEstimativa > 0 &&
            ` O total em kg é parcial: ${semEstimativa} produto(s) com saldo não têm peso informado.`}
        </p>
      </div>

      {/* CARDS DE ALERTA (clicáveis: filtram a lista) */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        {FILTROS.map((f) => {
          const cores = COR_CARD[f.cor];
          const ativo = filtroAtivo === f.id;
          const total = contagens[f.id];

          return (
            <button
              key={f.id}
              onClick={() => alternarFiltro(f.id)}
              aria-pressed={ativo}
              className={`rounded-xl border-y border-r border-l-4 border-gray-100 bg-white p-4 text-left shadow-sm transition-all hover:shadow-md ${cores.borda} ${
                ativo ? `ring-2 ${cores.anel}` : ''
              }`}
            >
              <span className="block text-[11px] font-bold uppercase leading-tight tracking-wider text-[#718096]">
                {f.rotulo}
              </span>
              <span className={`mt-2 block text-3xl font-extrabold ${total > 0 ? cores.numero : 'text-[#CBD5E0]'}`}>
                {total}
              </span>
              <span className="text-[11px] text-[#718096]">produto(s){f.dica ? ` · ${f.dica}` : ''}</span>
            </button>
          );
        })}
      </div>

      {/* FILTROS */}
      <div className="flex flex-col gap-4 rounded-t-xl border border-gray-100 bg-white p-4 md:flex-row md:items-center">
        <SearchInput
          value={busca}
          onChange={setBusca}
          placeholder="Buscar produto pelo nome..."
          className="max-w-none flex-grow"
        />
        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          aria-label="Filtrar por categoria"
          className={inputClass}
        >
          <option value="">Todas as categorias</option>
          {CATEGORIAS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        {filtroAtivo && (
          <button
            onClick={() => setFiltroAtivo(null)}
            className="text-xs font-medium text-[#007F45] hover:underline"
          >
            Limpar filtro do card
          </button>
        )}
      </div>

      {/* ESTADOS */}
      {loading && produtos.length === 0 && (
        <div className="rounded-b-xl border-x border-b border-gray-100 bg-white p-8 text-center text-gray-500">
          Carregando resumo...
        </div>
      )}

      {error && (
        <div className="rounded-b-xl border-x border-b border-gray-100 bg-white p-8 text-center text-red-500">
          Erro ao carregar dados: {error}
        </div>
      )}

      {/* TABELA */}
      {!error && !(loading && produtos.length === 0) && (
        <div className="overflow-x-auto rounded-b-xl border-x border-b border-gray-100 bg-white shadow-sm">
          <table className="w-full min-w-[950px] text-sm">
            <thead className="border-b border-gray-100 bg-gray-50/50 text-[#718096]">
              <tr>
                {['Produto', 'Disponível', 'Mínimo', 'Lotes', 'Próxima validade', 'Situação'].map((titulo) => (
                  <th
                    key={titulo}
                    className="px-4 py-4 text-left text-[11px] font-semibold uppercase tracking-tighter first:px-5"
                  >
                    {titulo}
                  </th>
                ))}
                <th className="px-4 py-4 text-right text-[11px] font-semibold uppercase tracking-tighter">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lista.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-5 py-8 text-center text-gray-500">
                    {produtos.length === 0
                      ? 'Nenhum produto cadastrado. Use "Cadastrar Produto" para começar.'
                      : 'Nenhum produto encontrado com esses filtros.'}
                  </td>
                </tr>
              ) : (
                lista.map((p) => {
                  const dias = p.diasParaVencer;
                  const situacao = SITUACAO[p.situacao] ?? SITUACAO.OK;
                  const mostraKg = p.pesoEstimadoKg != null && p.unidadeSigla.toLowerCase() !== 'kg';

                  return (
                    <tr key={p.produtoId} className="transition-colors hover:bg-gray-50/80">
                      <td className="px-5 py-4">
                        <div className="whitespace-nowrap font-bold text-[#2D3748]">{p.nome}</div>
                        {p.categoria && (
                          <div className="text-[11px] text-[#718096]">{rotuloCategoria(p.categoria)}</div>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4">
                        <div className="font-semibold text-[#4A5568]">
                          {formatarQuantidade(p.saldoDisponivel, p.unidadeSigla)}
                        </div>
                        {mostraKg && p.saldoDisponivel > 0 && (
                          <div className="text-[11px] italic text-[#718096]">
                            ≈ {formatarNumero(p.pesoEstimadoKg)} kg
                          </div>
                        )}
                        {p.saldoVencido > 0 && (
                          <div className="text-[11px] font-semibold text-red-600">
                            + {formatarQuantidade(p.saldoVencido, p.unidadeSigla)} vencido(s)
                          </div>
                        )}
                      </td>

                      <td
                        className={`whitespace-nowrap px-4 py-4 ${
                          p.situacao === 'BAIXO' ? 'font-semibold text-orange-600' : 'text-[#718096]'
                        }`}
                      >
                        {p.estoqueMinimo != null ? formatarQuantidade(p.estoqueMinimo, p.unidadeSigla) : '—'}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-[#718096]">{p.lotes}</td>

                      <td className="whitespace-nowrap px-4 py-4">
                        {p.proximaValidade ? (
                          <div className="flex flex-col items-start gap-1">
                            <span className="text-xs font-semibold text-[#4A5568]">
                              {formatarData(p.proximaValidade)}
                            </span>
                            {p.alertaValidade && (
                              <span
                                title={`Alerta deste produto: ${p.diasAlertaValidade} dias de antecedência`}
                                className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                                  p.alertaValidade === 'URGENTE'
                                    ? 'border-amber-200 bg-amber-50 text-amber-700'
                                    : 'border-yellow-200 bg-yellow-50 text-yellow-700'
                                }`}
                              >
                                {dias === 0 ? 'Vence hoje' : dias === 1 ? 'Vence amanhã' : `Em ${dias} dias`}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[#A0AEC0]">—</span>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4">
                        <StatusBadge status={situacao.rotulo} />
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-right">
                        {p.lotes > 0 && (
                          <button
                            onClick={() => onVerLotes(p.nome)}
                            className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-[#4A5568] transition-colors hover:border-[#007F45] hover:text-[#007F45]"
                          >
                            Ver lotes
                          </button>
                        )}
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