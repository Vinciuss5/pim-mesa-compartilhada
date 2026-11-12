// src/pages/Relatorios/components/SolicitanteTab.jsx
// Tudo o que UM solicitante pediu no período (o "o que ele solicitou no último mês").
import { useEffect } from 'react';
import { useRelatorio } from '../../../StatusBadge/hooks/useRelatorio';
import { useSolicitantes } from '../../../StatusBadge/hooks/useSolicitantes';
import { formatarData, formatarNumero, formatarQuantidade } from '../../../utils/format';
import { exportarCsv, numeroCsv } from '../../../utils/exportarCsv';
import StatusBadge from '../../../components/ui/StatusBadge';
import { Indicador, Quantidades, Secao, Estado, TabelaDados } from './blocos';
import { nomeArquivo } from '../relatorioUtils';

const textoItens = (itens) =>
  itens.map((i) => `${i.nomeProduto} (${formatarQuantidade(i.quantidade, i.unidade)})`).join('; ');

/** Parte visual (recebe os dados prontos). */
export function SolicitanteConteudo({ dados: d, periodo }) {
  const r = d.resumo;

  return (
    <div>
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-5">
        <Indicador titulo="Solicitações" valor={r.solicitacoes} cor="blue" />
        <Indicador titulo="Entregues" valor={r.entregues} cor="green" />
        <Indicador titulo="Pendentes" valor={r.pendentes} cor={r.pendentes > 0 ? 'amber' : 'gray'} />
        <Indicador titulo="Canceladas" valor={r.canceladas} cor={r.canceladas > 0 ? 'red' : 'gray'} />
        <Indicador titulo="Quantidade pedida" detalhe="sem as canceladas" cor="blue">
          <Quantidades lista={r.quantidades} />
        </Indicador>
      </div>

      <Secao
        titulo="Produtos solicitados"
        descricao="Total de cada produto no período, sem contar as solicitações canceladas."
      >
        <TabelaDados
          linhas={d.produtos}
          chave={(l) => `${l.produtoId}-${l.unidade}`}
          vazio="Nenhum produto solicitado neste período."
          colunas={[
            { titulo: 'Produto', render: (l) => l.produto, classe: 'font-semibold text-[#2D3748]' },
            { titulo: 'Quantidade', render: (l) => `${formatarNumero(l.quantidade)} ${l.unidade}`.trim() },
            { titulo: 'Em quantas solicitações', render: (l) => l.ocorrencias },
          ]}
        />
      </Secao>

      <Secao
        titulo="Histórico de solicitações"
        exportarDesativado={d.solicitacoes.length === 0}
        onExportar={() =>
          exportarCsv(nomeArquivo(`historico-${r.nome.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, periodo), [
            { titulo: 'Solicitação', valor: (l) => l.id },
            { titulo: 'Data', valor: (l) => formatarData(l.dataSolicitacao) },
            { titulo: 'Status', valor: (l) => l.status },
            { titulo: 'Previsão de entrega', valor: (l) => (l.dataPrevisaoEntrega ? formatarData(l.dataPrevisaoEntrega) : '') },
            { titulo: 'Entregue em', valor: (l) => (l.dataEntrega ? formatarData(l.dataEntrega) : '') },
            { titulo: 'Reagendamentos', valor: (l) => l.reagendamentos?.length ?? 0 },
            { titulo: 'Itens', valor: (l) => textoItens(l.itens) },
            { titulo: 'Observação', valor: (l) => l.observacao ?? '' },
          ], d.solicitacoes)
        }
      >
        <TabelaDados
          linhas={d.solicitacoes}
          chave={(l) => l.id}
          vazio="Este solicitante não fez solicitações neste período."
          colunas={[
            { titulo: 'Solicitação', render: (l) => `#${l.id}`, classe: 'font-mono text-xs text-[#718096]' },
            { titulo: 'Data', render: (l) => formatarData(l.dataSolicitacao) },
            { titulo: 'Status', render: (l) => <StatusBadge status={l.status} /> },
            { titulo: 'Previsão', render: (l) => (l.dataPrevisaoEntrega ? formatarData(l.dataPrevisaoEntrega) : '—') },
            { titulo: 'Entregue em', render: (l) => (l.dataEntrega ? formatarData(l.dataEntrega) : '—') },
            { titulo: 'Reagend.', render: (l) => l.reagendamentos?.length ?? 0 },
            { titulo: 'Itens', render: (l) => textoItens(l.itens), classe: 'min-w-[260px] text-xs text-[#4A5568]' },
          ]}
        />
      </Secao>
    </div>
  );
}

export default function SolicitanteTab({ periodo, solicitanteId, onEscolherSolicitante }) {
  const { solicitantes, fetchSolicitantes } = useSolicitantes();

  useEffect(() => {
    fetchSolicitantes();
  }, [fetchSolicitantes]);

  const { dados, loading, error, recarregar } = useRelatorio(
    `/relatorio/solicitantes/${solicitanteId}`,
    periodo,
    { ativo: Boolean(solicitanteId) }
  );

  return (
    <div>
      <div className="mb-6 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <label htmlFor="rel-solicitante" className="mb-1 block text-xs font-medium text-[#718096]">
          Solicitante
        </label>
        <select
          id="rel-solicitante"
          value={solicitanteId}
          onChange={(e) => onEscolherSolicitante(e.target.value)}
          className="w-full max-w-md rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-[#007F45] focus:ring-1 focus:ring-[#007F45]"
        >
          <option value="">Selecione um solicitante...</option>
          {[...solicitantes]
            .sort((a, b) => a.nome.localeCompare(b.nome))
            .map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome}
              </option>
            ))}
        </select>
      </div>

      {!solicitanteId ? (
        <div className="rounded-xl border border-gray-100 bg-white p-8 text-center text-sm text-[#718096]">
          Escolha um solicitante para ver tudo o que ele pediu no período.
        </div>
      ) : !dados ? (
        <Estado loading={loading} error={error} onTentarDeNovo={recarregar} />
      ) : (
        <div className={loading ? 'opacity-60 transition-opacity' : ''}>
          <h2 className="mb-4 text-lg font-bold text-[#2D3748]">{dados.resumo.nome}</h2>
          <SolicitanteConteudo dados={dados} periodo={periodo} />
        </div>
      )}
    </div>
  );
}