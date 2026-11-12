// src/pages/Relatorios/components/VisaoGeralTab.jsx
import { useRelatorio } from '../../../StatusBadge/hooks/useRelatorio';
import { formatarNumero } from '../../../utils/format';
import { exportarCsv, numeroCsv } from '../../../utils/exportarCsv';
import { Indicador, Quantidades, Secao, Estado, FilaEntregas } from './blocos';
import { nomeArquivo, textoQuantidades } from '../relatorioUtils';

// Linhas do CSV da visão geral (indicador, valor)
const linhasCsv = (d) => [
  ['Doações recebidas', d.doacoes],
  ['Doadores distintos', d.doadoresDistintos],
  ['Quantidade recebida', textoQuantidades(d.recebido)],
  ['Solicitações criadas', d.solicitacoes],
  ['Solicitantes distintos', d.solicitantesDistintos],
  ['Solicitações entregues', d.solicitacoesEntregues],
  ['Solicitações pendentes', d.solicitacoesPendentes],
  ['Solicitações canceladas', d.solicitacoesCanceladas],
  ['Entregas confirmadas', d.entregasConfirmadas],
  ['Quantidade distribuída', textoQuantidades(d.distribuido)],
  ['Perdas (perda, vencimento e avaria)', textoQuantidades(d.perdas)],
  ['Reagendamentos', d.reagendamentos],
  ['Entregas atrasadas (agora)', d.filaEntregas.atrasadas],
  ['Entregas para hoje (agora)', d.filaEntregas.hoje],
  ['Entregas para amanhã (agora)', d.filaEntregas.amanha],
  ['Produtos cadastrados', d.estoque.produtosCadastrados],
  ['Produtos com saldo', d.estoque.produtosComSaldo],
  ['Produtos zerados', d.estoque.produtosZerados],
  ['Produtos abaixo do mínimo', d.estoque.produtosAbaixoDoMinimo],
  ['Produtos com lote vencido', d.estoque.produtosComVencido],
  ['Estoque disponível', textoQuantidades(d.estoque.disponivel)],
  ['Peso estimado em estoque (kg)', numeroCsv(d.estoque.pesoEstimadoKg)],
];

/** Parte visual (recebe os dados prontos). */
export function VisaoGeralConteudo({ dados: d, periodo }) {
  const e = d.estoque;

  return (
    <div>
      <Secao
        titulo="No período"
        descricao="O que aconteceu entre as datas escolhidas."
        onExportar={() =>
          exportarCsv(nomeArquivo('visao-geral', periodo), [
            { titulo: 'Indicador', valor: (l) => l[0] },
            { titulo: 'Valor', valor: (l) => l[1] },
          ], linhasCsv(d))
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Indicador titulo="Doações recebidas" valor={d.doacoes} detalhe={`${d.doadoresDistintos} doador(es) diferente(s)`} cor="green" />
          <Indicador titulo="Quantidade recebida" detalhe="soma de todos os itens doados" cor="green">
            <Quantidades lista={d.recebido} />
          </Indicador>
          <Indicador
            titulo="Solicitações criadas"
            valor={d.solicitacoes}
            detalhe={`${d.solicitantesDistintos} solicitante(s) · ${d.solicitacoesEntregues} entregue(s) · ${d.solicitacoesPendentes} pendente(s) · ${d.solicitacoesCanceladas} cancelada(s)`}
            cor="blue"
          />
          <Indicador titulo="Quantidade distribuída" detalhe={`${d.entregasConfirmadas} entrega(s) confirmada(s) no período`} cor="blue">
            <Quantidades lista={d.distribuido} />
          </Indicador>
          <Indicador titulo="Perdas" detalhe="perda, vencimento e avaria" cor="red">
            <Quantidades lista={d.perdas} cor="red" />
          </Indicador>
        </div>
      </Secao>

      <Secao
        titulo="Entregas pendentes agora"
        descricao="Retrato de hoje, independente do período: o que ainda precisa ser entregue, por prazo."
      >
        <FilaEntregas fila={d.filaEntregas} />
        <p className="mt-3 text-xs text-[#718096]">
          Reagendamentos no período: <strong className="text-[#4A5568]">{d.reagendamentos}</strong>
          {d.reagendamentos > 0 && ` (em ${d.solicitacoesReagendadas} solicitação(ões))`}.
        </p>
      </Secao>

      <Secao titulo="Estoque agora" descricao="Retrato de hoje, independente do período.">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          <Indicador titulo="Produtos com saldo" valor={e.produtosComSaldo} detalhe={`de ${e.produtosCadastrados} cadastrados`} cor="green" />
          <Indicador titulo="Zerados" valor={e.produtosZerados} cor={e.produtosZerados > 0 ? 'red' : 'gray'} />
          <Indicador titulo="Abaixo do mínimo" valor={e.produtosAbaixoDoMinimo} cor={e.produtosAbaixoDoMinimo > 0 ? 'orange' : 'gray'} />
          <Indicador titulo="Com lote vencido" valor={e.produtosComVencido} cor={e.produtosComVencido > 0 ? 'red' : 'gray'} />
          <Indicador titulo="Vencimento urgente" valor={e.produtosVencimentoUrgente} cor={e.produtosVencimentoUrgente > 0 ? 'amber' : 'gray'} />
          <Indicador titulo="Vencimento em atenção" valor={e.produtosVencimentoEmAtencao} cor={e.produtosVencimentoEmAtencao > 0 ? 'yellow' : 'gray'} />
        </div>

        <div className="mt-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#718096]">Disponível em estoque</span>
          <Quantidades lista={e.disponivel} />
          {e.pesoEstimadoKg > 0 && (
            <p className="mt-3 text-sm text-[#4A5568]">
              ≈ <strong className="text-[#007F45]">{formatarNumero(e.pesoEstimadoKg)} kg</strong> no total
              {e.produtosSemPesoEstimado > 0 &&
                ` (parcial: ${e.produtosSemPesoEstimado} produto(s) com saldo não têm peso informado)`}
            </p>
          )}
        </div>
      </Secao>
    </div>
  );
}

export default function VisaoGeralTab({ periodo }) {
  const { dados, loading, error, recarregar } = useRelatorio('/relatorio/visao-geral', periodo);

  if (!dados) return <Estado loading={loading} error={error} onTentarDeNovo={recarregar} />;

  return (
    <div className={loading ? 'opacity-60 transition-opacity' : ''}>
      <VisaoGeralConteudo dados={dados} periodo={periodo} />
    </div>
  );
}