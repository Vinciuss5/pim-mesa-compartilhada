// src/pages/Relatorios/components/SolicitacoesTab.jsx
import { useRelatorio } from '../../../StatusBadge/hooks/useRelatorio';
import { formatarData, formatarNumero } from '../../../utils/format';
import { exportarCsv, numeroCsv } from '../../../utils/exportarCsv';
import { Indicador, Secao, Estado, TabelaDados, FilaEntregas } from './blocos';
import { nomeArquivo, percentual, rotuloMotivoReag, textoQuantidades } from '../relatorioUtils';

/** Parte visual (recebe os dados prontos). */
export function SolicitacoesConteudo({ dados: d, periodo, onVerSolicitante }) {
  const p = d.pontualidade;
  const comPrevisao = p.entreguesNoPrazo + p.entreguesComAtraso;
  const pctNoPrazo = percentual(p.entreguesNoPrazo, comPrevisao);
  const totalEntregas = comPrevisao + p.entreguesSemPrevisao;

  return (
    <div>
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Indicador titulo="Solicitações criadas" valor={d.total} cor="blue" />
        <Indicador titulo="Entregues" valor={d.entregues} cor="green" detalhe="das criadas no período" />
        <Indicador titulo="Pendentes" valor={d.pendentes} cor={d.pendentes > 0 ? 'amber' : 'gray'} detalhe="das criadas no período" />
        <Indicador titulo="Canceladas" valor={d.canceladas} cor={d.canceladas > 0 ? 'red' : 'gray'} detalhe="das criadas no período" />
      </div>

      <Secao
        titulo="Pontualidade das entregas"
        descricao="Entregas confirmadas no período, comparadas com a previsão atual de cada solicitação."
      >
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          {totalEntregas === 0 ? (
            <p className="text-sm text-[#A0AEC0]">Nenhuma entrega confirmada neste período.</p>
          ) : (
            <>
              {comPrevisao > 0 && (
                <div className="mb-4">
                  <div className="mb-1 flex items-baseline justify-between">
                    <span className="text-sm font-semibold text-[#2D3748]">{pctNoPrazo}% entregues no prazo</span>
                    <span className="text-xs text-[#718096]">de {comPrevisao} entrega(s) com previsão</span>
                  </div>
                  <div
                    className="h-3 overflow-hidden rounded-full bg-red-100"
                    role="progressbar"
                    aria-valuenow={pctNoPrazo}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div className="h-full rounded-full bg-green-500" style={{ width: `${pctNoPrazo}%` }} />
                  </div>
                </div>
              )}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <span className="block text-2xl font-extrabold text-green-700">{p.entreguesNoPrazo}</span>
                  <span className="text-[11px] text-[#718096]">no prazo</span>
                </div>
                <div>
                  <span className="block text-2xl font-extrabold text-red-600">{p.entreguesComAtraso}</span>
                  <span className="text-[11px] text-[#718096]">com atraso</span>
                </div>
                <div>
                  <span className="block text-2xl font-extrabold text-[#718096]">{p.entreguesSemPrevisao}</span>
                  <span className="text-[11px] text-[#718096]">sem previsão informada</span>
                </div>
              </div>
            </>
          )}
        </div>
      </Secao>

      <Secao titulo="Entregas pendentes agora" descricao="Retrato de hoje, independente do período.">
        <FilaEntregas fila={d.filaEntregas} />
      </Secao>

      <Secao
        titulo="Reagendamentos"
        descricao="Quantas vezes a data de entrega foi alterada no período e por quê."
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Indicador
            titulo="Reagendamentos"
            valor={d.reagendamentos.total}
            detalhe={`em ${d.reagendamentos.solicitacoesReagendadas} solicitação(ões)`}
            cor={d.reagendamentos.total > 0 ? 'amber' : 'gray'}
          />
          <div className="md:col-span-2">
            <TabelaDados
              linhas={d.reagendamentos.porMotivo}
              chave={(l) => l.motivo}
              vazio="Nenhum reagendamento neste período."
              colunas={[
                { titulo: 'Motivo', render: (l) => rotuloMotivoReag(l.motivo), classe: 'font-semibold text-[#2D3748]' },
                { titulo: 'Reagendamentos', render: (l) => l.quantidade, alinhar: 'direita' },
              ]}
            />
          </div>
        </div>
      </Secao>

      <Secao
        titulo="Por solicitante"
        descricao="Solicitações criadas no período, por solicitante. Clique em 'Ver histórico' para o detalhe."
        exportarDesativado={d.porSolicitante.length === 0}
        onExportar={() =>
          exportarCsv(nomeArquivo('solicitacoes-por-solicitante', periodo), [
            { titulo: 'Solicitante', valor: (l) => l.nome },
            { titulo: 'Solicitações', valor: (l) => l.solicitacoes },
            { titulo: 'Entregues', valor: (l) => l.entregues },
            { titulo: 'Pendentes', valor: (l) => l.pendentes },
            { titulo: 'Canceladas', valor: (l) => l.canceladas },
            { titulo: 'Quantidades (sem canceladas)', valor: (l) => textoQuantidades(l.quantidades) },
            { titulo: 'Última solicitação', valor: (l) => formatarData(l.ultimaSolicitacao) },
          ], d.porSolicitante)
        }
      >
        <TabelaDados
          linhas={d.porSolicitante}
          chave={(l) => l.solicitanteId}
          vazio="Nenhuma solicitação criada neste período."
          colunas={[
            { titulo: 'Solicitante', render: (l) => l.nome, classe: 'font-semibold text-[#2D3748]' },
            { titulo: 'Solicitações', render: (l) => l.solicitacoes },
            { titulo: 'Entregues', render: (l) => l.entregues },
            { titulo: 'Pendentes', render: (l) => l.pendentes },
            { titulo: 'Canceladas', render: (l) => l.canceladas },
            { titulo: 'Quantidades', render: (l) => textoQuantidades(l.quantidades) },
            {
              titulo: 'Detalhe',
              alinhar: 'direita',
              render: (l) => (
                <button
                  onClick={() => onVerSolicitante?.(l.solicitanteId)}
                  className="text-xs font-medium text-[#007F45] hover:underline"
                >
                  Ver histórico
                </button>
              ),
            },
          ]}
        />
      </Secao>

      <Secao
        titulo="Produtos mais solicitados"
        descricao="Sem contar as solicitações canceladas."
        exportarDesativado={d.porProduto.length === 0}
        onExportar={() =>
          exportarCsv(nomeArquivo('solicitacoes-por-produto', periodo), [
            { titulo: 'Produto', valor: (l) => l.produto },
            { titulo: 'Unidade', valor: (l) => l.unidade },
            { titulo: 'Quantidade', valor: (l) => numeroCsv(l.quantidade) },
            { titulo: 'Em quantas solicitações', valor: (l) => l.ocorrencias },
          ], d.porProduto)
        }
      >
        <TabelaDados
          linhas={d.porProduto}
          chave={(l) => `${l.produtoId}-${l.unidade}`}
          vazio="Nenhum produto solicitado neste período."
          colunas={[
            { titulo: 'Produto', render: (l) => l.produto, classe: 'font-semibold text-[#2D3748]' },
            { titulo: 'Quantidade', render: (l) => `${formatarNumero(l.quantidade)} ${l.unidade}`.trim() },
            { titulo: 'Em quantas solicitações', render: (l) => l.ocorrencias },
          ]}
        />
      </Secao>
    </div>
  );
}

export default function SolicitacoesTab({ periodo, onVerSolicitante }) {
  const { dados, loading, error, recarregar } = useRelatorio('/relatorio/solicitacoes', periodo);

  if (!dados) return <Estado loading={loading} error={error} onTentarDeNovo={recarregar} />;

  return (
    <div className={loading ? 'opacity-60 transition-opacity' : ''}>
      <SolicitacoesConteudo dados={dados} periodo={periodo} onVerSolicitante={onVerSolicitante} />
    </div>
  );
}