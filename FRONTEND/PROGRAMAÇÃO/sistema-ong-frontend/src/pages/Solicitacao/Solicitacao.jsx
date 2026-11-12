import React, { useState, useEffect, useMemo } from 'react';
import { Plus, ChevronDown, ChevronUp, AlertTriangle, CalendarClock } from 'lucide-react';
import { useSolicitacao } from '../../StatusBadge/hooks/useSolicitacao';
import { useSolicitantes } from '../../StatusBadge/hooks/useSolicitantes';
import { useProdutos } from '../../StatusBadge/hooks/useProdutos';
import { useEstoque } from '../../StatusBadge/hooks/useEstoque';
import { useToast } from '../../components/contexts/ToastContext';
import { formatarData, formatarQuantidade } from '../../utils/format';
import { classificarPrazo, compararPorUrgencia } from '../../utils/prazo';
import PageHeader from '../../components/ui/PageHeader';
import SearchInput from '../../components/ui/SearchInput';
import StatusBadge from '../../components/ui/StatusBadge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import NovaSolicitacaoModal from './components/NovaSolicitacaoModal';
import ReagendarModal, { rotuloMotivoReagendamento } from './components/ReagendarModal';

// Textos das confirmações (ações que mexem no estoque ou não têm volta)
const ACOES = {
  ENTREGUE: {
    title: 'Confirmar entrega',
    confirmLabel: 'Confirmar entrega',
    danger: false,
    mensagem: (id) => `Confirmar a entrega da solicitação #${id}? Depois disso o status não poderá ser alterado.`,
    sucesso: (id) => `Solicitação #${id} marcada como entregue.`,
  },
  CANCELADO: {
    title: 'Cancelar solicitação',
    confirmLabel: 'Cancelar solicitação',
    danger: true,
    mensagem: (id) =>
      `Cancelar a solicitação #${id}? Os itens voltarão para o estoque e o status não poderá ser alterado depois.`,
    sucesso: (id) => `Solicitação #${id} cancelada e itens devolvidos ao estoque.`,
  },
};

// Abas: cada uma é um recorte da fila de entregas. `grupos` = grupos de prazo que ela mostra.
const ABAS = [
  { id: 'pendentes', rotulo: 'Pendentes', filtro: (s) => s.status === 'PENDENTE' },
  { id: 'atrasadas', rotulo: 'Atrasadas', alerta: 'red', grupos: ['ATRASADA'] },
  { id: 'hoje', rotulo: 'Hoje', alerta: 'orange', grupos: ['HOJE'] },
  { id: 'amanha', rotulo: 'Amanhã', alerta: 'amber', grupos: ['AMANHA'] },
  { id: 'semana', rotulo: '2 a 7 dias', grupos: ['SEMANA'] },
  { id: 'sem_previsao', rotulo: 'Sem previsão', grupos: ['SEM_PREVISAO'] },
  { id: 'todas', rotulo: 'Todas', filtro: () => true },
];

const filtroDaAba = (aba) => aba.filtro ?? ((s) => aba.grupos.includes(s.prazo.grupo));

const MENSAGEM_VAZIO = {
  pendentes: 'Nenhuma solicitação pendente. Tudo em dia!',
  atrasadas: 'Nenhuma solicitação atrasada.',
  hoje: 'Nenhuma entrega prevista para hoje.',
  amanha: 'Nenhuma entrega prevista para amanhã.',
  semana: 'Nenhuma entrega prevista entre 2 e 7 dias.',
  sem_previsao: 'Todas as solicitações pendentes têm previsão de entrega.',
  todas: 'Nenhuma solicitação encontrada para esta busca.',
};

const COR_ALERTA_ABA = {
  red: 'bg-red-100 text-red-700',
  orange: 'bg-orange-100 text-orange-700',
  amber: 'bg-amber-100 text-amber-700',
};

const ESTILO_PRAZO = {
  ATRASADA: 'bg-red-50 text-red-700 border-red-200',
  HOJE: 'bg-orange-50 text-orange-700 border-orange-200',
  AMANHA: 'bg-amber-50 text-amber-700 border-amber-200',
  SEMANA: 'bg-blue-50 text-blue-700 border-blue-200',
  FUTURA: 'bg-gray-50 text-gray-600 border-gray-200',
  SEM_PREVISAO: 'bg-gray-50 text-gray-500 border-gray-200',
};

// Faixa colorida na lateral da linha, para a urgência saltar aos olhos
const BORDA_PRAZO = {
  ATRASADA: 'border-l-red-500',
  HOJE: 'border-l-orange-500',
  AMANHA: 'border-l-amber-400',
};

export default function SaidaSolicitacoes() {
  const toast = useToast();

  // Hooks de dados
  const { solicitacoes, fetchSolicitacoes, criarSolicitacao, atualizarStatus, reagendarSolicitacao } =
    useSolicitacao();
  const { solicitantes, fetchSolicitantes } = useSolicitantes();
  const { produtos, fetchProdutos } = useProdutos();
  const { resumo, fetchResumo } = useEstoque();

  // Estados da tela
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [linhaExpandida, setLinhaExpandida] = useState(null);
  const [filtro, setFiltro] = useState('');
  const [abaAtiva, setAbaAtiva] = useState('pendentes');
  const [entregaAte, setEntregaAte] = useState(''); // "AAAA-MM-DD": só entregas previstas até esta data
  const [acaoPendente, setAcaoPendente] = useState(null); // { id, novoStatus }
  const [processando, setProcessando] = useState(false);
  const [solicitacaoReagendando, setSolicitacaoReagendando] = useState(null);

  // Carregamento inicial
  useEffect(() => {
    fetchSolicitacoes();
    fetchSolicitantes();
    fetchProdutos();
    fetchResumo();
  }, [fetchSolicitacoes, fetchSolicitantes, fetchProdutos, fetchResumo]);

  // Saldo disponível por produto, vindo do backend (já descontado o que está vencido)
  const saldoPorProduto = useMemo(() => {
    const saldo = {};
    resumo.forEach((p) => {
      saldo[p.produtoId] = p.saldoDisponivel;
    });
    return saldo;
  }, [resumo]);

  // Cada solicitação ganha o seu prazo (atrasada, hoje, amanhã...)
  const comPrazo = useMemo(
    () => solicitacoes.map((s) => ({ ...s, prazo: classificarPrazo(s) })),
    [solicitacoes]
  );

  // Contagem de cada aba (os números nas etiquetas)
  const contagens = useMemo(() => {
    const resultado = {};
    ABAS.forEach((aba) => {
      resultado[aba.id] = comPrazo.filter(filtroDaAba(aba)).length;
    });
    return resultado;
  }, [comPrazo]);

  const lista = useMemo(() => {
    const aba = ABAS.find((a) => a.id === abaAtiva) ?? ABAS[0];
    const busca = filtro.toLowerCase();

    return comPrazo
      .filter(filtroDaAba(aba))
      .filter((s) => s.nomeSolicitante.toLowerCase().includes(busca) || s.id.toString().includes(busca))
      .filter((s) => {
        if (!entregaAte) return true;
        // Sem previsão não entra quando há limite de data
        return s.dataPrevisaoEntrega ? s.dataPrevisaoEntrega.slice(0, 10) <= entregaAte : false;
      })
      .sort(compararPorUrgencia);
  }, [comPrazo, abaAtiva, filtro, entregaAte]);

  const handleCriar = async (dto) => {
    const resultado = await criarSolicitacao(dto);

    if (resultado.sucesso) {
      toast.success('Solicitação registrada com sucesso!');
      fetchResumo(); // a baixa mudou o saldo
    }

    return resultado; // o modal decide se fecha (sucesso) ou mostra o erro
  };

  const executarAcao = async () => {
    if (!acaoPendente) return;

    const { id, novoStatus } = acaoPendente;

    setProcessando(true);
    const resultado = await atualizarStatus(id, novoStatus);
    setProcessando(false);
    setAcaoPendente(null);

    if (resultado.sucesso) {
      toast.success(ACOES[novoStatus].sucesso(id));
      fetchResumo(); // o cancelamento devolve itens ao estoque
    } else {
      toast.error(resultado.erro || 'Não foi possível atualizar a solicitação.');
    }
  };

  const handleReagendar = async (dados) => {
    const id = solicitacaoReagendando.id;
    const resultado = await reagendarSolicitacao(id, dados);

    if (resultado.sucesso) {
      toast.success(`Entrega da solicitação #${id} reagendada.`);
    }

    return resultado; // o modal decide se fecha (sucesso) ou mostra o erro
  };

  const acaoAtual = acaoPendente ? ACOES[acaoPendente.novoStatus] : null;

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-6 font-sans text-[#2D3748] md:p-8">
      <PageHeader
        title="Saída de Solicitações"
        subtitle="Fila de entregas ordenada pelo prazo: o que é mais urgente aparece primeiro."
      >
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-[#007F45] px-5 py-2.5 font-medium text-white shadow-sm transition-all duration-200 hover:bg-[#006838] hover:shadow-md"
        >
          <Plus size={18} />
          Nova Solicitação
        </button>
      </PageHeader>

      {/* AVISO DE ATRASOS */}
      {contagens.atrasadas > 0 && abaAtiva !== 'atrasadas' && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <span className="flex items-center gap-2">
            <AlertTriangle size={18} className="shrink-0" />
            {contagens.atrasadas === 1
              ? '1 solicitação está com a entrega atrasada.'
              : `${contagens.atrasadas} solicitações estão com a entrega atrasada.`}
          </span>
          <button
            onClick={() => setAbaAtiva('atrasadas')}
            className="font-semibold underline underline-offset-2 hover:text-red-900"
          >
            Ver atrasadas
          </button>
        </div>
      )}

      {/* ABAS POR PRAZO */}
      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-gray-200" role="tablist">
        {ABAS.map((aba) => {
          const ativa = abaAtiva === aba.id;
          const total = contagens[aba.id];
          const destaque = aba.alerta && total > 0 ? COR_ALERTA_ABA[aba.alerta] : 'bg-gray-100 text-[#718096]';

          return (
            <button
              key={aba.id}
              role="tab"
              aria-selected={ativa}
              onClick={() => setAbaAtiva(aba.id)}
              className={`-mb-px flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                ativa
                  ? 'border-[#007F45] text-[#007F45]'
                  : 'border-transparent text-[#718096] hover:text-[#2D3748]'
              }`}
            >
              {aba.rotulo}
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${destaque}`}>{total}</span>
            </button>
          );
        })}
      </div>

      {/* BUSCA E FILTRO DE DATA */}
      <div className="mb-6 flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:flex-row md:items-end">
        <SearchInput
          value={filtro}
          onChange={setFiltro}
          placeholder="Buscar por ID ou Solicitante..."
          className="max-w-none flex-grow"
        />
        <div className="flex items-end gap-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="sol-entrega-ate" className="text-xs font-medium text-[#718096]">
              Entrega prevista até
            </label>
            <input
              id="sol-entrega-ate"
              type="date"
              value={entregaAte}
              onChange={(e) => setEntregaAte(e.target.value)}
              className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#007F45] focus:ring-1 focus:ring-[#007F45]"
            />
          </div>
          {entregaAte && (
            <button
              onClick={() => setEntregaAte('')}
              className="pb-2 text-xs font-medium text-[#007F45] hover:underline"
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* TABELA */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50/80 text-gray-600">
              <tr>
                <th className="px-6 py-4 font-semibold">ID</th>
                <th className="px-6 py-4 font-semibold">Solicitada em</th>
                <th className="px-6 py-4 font-semibold">Solicitante</th>
                <th className="px-6 py-4 font-semibold">Previsão de entrega</th>
                <th className="px-6 py-4 font-semibold">Itens</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 text-center font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lista.map((item) => {
                const aberta = linhaExpandida === item.id;
                const { prazo } = item;

                return (
                  <React.Fragment key={item.id}>
                    <tr className="group transition-colors hover:bg-gray-50/50">
                      <td className={`border-l-4 px-6 py-4 font-mono text-xs text-gray-500 ${BORDA_PRAZO[prazo.grupo] ?? 'border-l-transparent'}`}>
                        #{item.id}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{formatarData(item.dataSolicitacao)}</td>
                      <td className="px-6 py-4 font-medium text-gray-800">{item.nomeSolicitante}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-start gap-1">
                          <span className="text-gray-700">
                            {item.dataPrevisaoEntrega ? formatarData(item.dataPrevisaoEntrega) : '—'}
                          </span>
                          {/* Só solicitações pendentes têm prazo a cobrar */}
                          {prazo.grupo !== 'ENCERRADA' && (
                            <span
                              className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${ESTILO_PRAZO[prazo.grupo]}`}
                            >
                              {prazo.rotulo}
                            </span>
                          )}
                          {item.reagendamentos?.length > 0 && (
                            <span
                              className="text-[11px] font-medium text-purple-600"
                              title="A previsão de entrega já foi alterada"
                            >
                              Reagendada {item.reagendamentos.length}×
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setLinhaExpandida(aberta ? null : item.id)}
                          className="flex items-center gap-1 rounded-full border border-[#007F45]/30 px-3 py-1.5 text-xs font-medium text-[#007F45] transition-colors hover:bg-[#007F45]/10"
                        >
                          {item.itens.length} iten(s)
                          {aberta ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-6 py-4">
                        {item.status === 'PENDENTE' && (
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => setSolicitacaoReagendando(item)}
                              className="flex items-center gap-1 rounded border border-purple-100 px-2 py-1 text-xs font-medium text-purple-600 transition-all hover:bg-purple-50"
                            >
                              <CalendarClock size={12} />
                              {item.dataPrevisaoEntrega ? 'Reagendar' : 'Definir data'}
                            </button>
                            <button
                              onClick={() => setAcaoPendente({ id: item.id, novoStatus: 'ENTREGUE' })}
                              className="rounded border border-emerald-100 px-2 py-1 text-xs font-medium text-emerald-600 transition-all hover:bg-emerald-50"
                            >
                              Confirmar
                            </button>
                            <button
                              onClick={() => setAcaoPendente({ id: item.id, novoStatus: 'CANCELADO' })}
                              className="rounded border border-red-100 px-2 py-1 text-xs font-medium text-red-600 transition-all hover:bg-red-50"
                            >
                              Cancelar
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>

                    {/* DETALHES EXPANSÍVEIS */}
                    {aberta && (
                      <tr className="border-b border-gray-200 bg-gray-50/80 shadow-inner">
                        <td colSpan="7" className="p-6">
                          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                              <h4 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase text-gray-500">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#007F45]"></span>
                                Produtos Solicitados
                              </h4>
                              <div className="divide-y divide-gray-100">
                                {item.itens.map((prod) => (
                                  <div key={prod.id} className="flex items-center justify-between py-2 text-sm">
                                    <span className="text-gray-700">{prod.nomeProduto}</span>
                                    <span className="rounded bg-[#007F45]/10 px-2 py-0.5 font-mono text-xs font-semibold text-[#007F45]">
                                      {formatarQuantidade(prod.quantidade, prod.unidade)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                              <h4 className="mb-3 text-xs font-bold uppercase text-gray-500">Detalhes Adicionais</h4>
                              <div className="space-y-3 text-sm">
                                <p className="text-gray-600">
                                  <strong className="mb-1 block text-gray-800">Previsão de entrega:</strong>
                                  {item.dataPrevisaoEntrega ? (
                                    formatarData(item.dataPrevisaoEntrega)
                                  ) : (
                                    <span className="italic text-gray-400">Não informada.</span>
                                  )}
                                </p>
                                {item.dataEntrega && (
                                  <p className="text-gray-600">
                                    <strong className="mb-1 block text-gray-800">Entregue em:</strong>
                                    {formatarData(item.dataEntrega)}
                                  </p>
                                )}
                                <p className="text-gray-600">
                                  <strong className="mb-1 block text-gray-800">Observações:</strong>
                                  {item.observacao || (
                                    <span className="italic text-gray-400">Nenhuma observação registrada.</span>
                                  )}
                                </p>
                                {item.reagendamentos?.length > 0 && (
                                  <div>
                                    <strong className="mb-2 block text-gray-800">Histórico de reagendamentos:</strong>
                                    <ul className="space-y-2 border-l-2 border-purple-200 pl-3">
                                      {item.reagendamentos.map((r) => (
                                        <li key={r.id} className="text-xs text-gray-600">
                                          <span className="font-semibold text-gray-800">
                                            {r.dataAnterior ? formatarData(r.dataAnterior) : 'Sem previsão'} →{' '}
                                            {formatarData(r.dataNova)}
                                          </span>
                                          <span className="block text-gray-500">
                                            {new Date(r.dataHora).toLocaleString('pt-BR', {
                                              dateStyle: 'short',
                                              timeStyle: 'short',
                                            })}
                                            {r.usuarioNome ? ` · ${r.usuarioNome}` : ''}
                                          </span>
                                          {(r.motivo || r.observacao) && (
                                            <span className="block">
                                              {rotuloMotivoReagendamento(r.motivo) ?? ''}
                                              {r.motivo && r.observacao ? ' — ' : ''}
                                              {r.observacao ?? ''}
                                            </span>
                                          )}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>

          {lista.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              {filtro || entregaAte
                ? 'Nenhuma solicitação encontrada com esses filtros.'
                : MENSAGEM_VAZIO[abaAtiva]}
            </div>
          )}
        </div>
      </div>

      <NovaSolicitacaoModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        solicitantes={solicitantes}
        produtos={produtos}
        saldoPorProduto={saldoPorProduto}
        onSubmit={handleCriar}
      />

      <ReagendarModal
        open={Boolean(solicitacaoReagendando)}
        onClose={() => setSolicitacaoReagendando(null)}
        solicitacao={solicitacaoReagendando}
        onSubmit={handleReagendar}
      />

      <ConfirmDialog
        open={Boolean(acaoPendente)}
        title={acaoAtual?.title ?? ''}
        message={acaoAtual ? acaoAtual.mensagem(acaoPendente.id) : ''}
        confirmLabel={acaoAtual?.confirmLabel}
        danger={acaoAtual?.danger}
        loading={processando}
        onConfirm={executarAcao}
        onCancel={() => setAcaoPendente(null)}
      />
    </div>
  );
}