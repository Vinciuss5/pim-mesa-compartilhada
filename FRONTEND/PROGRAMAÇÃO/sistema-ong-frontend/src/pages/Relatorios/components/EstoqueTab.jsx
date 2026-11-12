// src/pages/Relatorios/components/EstoqueTab.jsx
import { useRelatorio } from '../../../StatusBadge/hooks/useRelatorio';
import { formatarData, formatarNumero, formatarQuantidade } from '../../../utils/format';
import { exportarCsv, numeroCsv } from '../../../utils/exportarCsv';
import StatusBadge from '../../../components/ui/StatusBadge';
import { Indicador, Quantidades, Secao, Estado, TabelaDados } from './blocos';
import { ROTULO_MOTIVO_PERDA, nomeArquivo } from '../relatorioUtils';

const ROTULO_SITUACAO_LOTE = { URGENTE: 'Urgente', ATENCAO: 'Em atenção', VENCIDO: 'Vencido' };

const textoDias = (dias) => {
  if (dias < 0) return `venceu há ${-dias} dia(s)`;
  if (dias === 0) return 'vence hoje';
  if (dias === 1) return 'vence amanhã';
  return `em ${dias} dias`;
};

/** Parte visual (recebe os dados prontos). */
export function EstoqueConteudo({ dados: d, periodo }) {
  const colunasLote = [
    { titulo: 'Produto', render: (l) => l.produto, classe: 'font-semibold text-[#2D3748]' },
    { titulo: 'Quantidade', render: (l) => formatarQuantidade(l.quantidade, l.unidade) },
    { titulo: 'Validade', render: (l) => formatarData(l.validade) },
    { titulo: 'Prazo', render: (l) => textoDias(l.diasParaVencer) },
    { titulo: 'Situação', render: (l) => <StatusBadge status={ROTULO_SITUACAO_LOTE[l.situacao] ?? l.situacao} /> },
  ];

  const csvLotes = (linhas, base) =>
    exportarCsv(nomeArquivo(base, periodo), [
      { titulo: 'Produto', valor: (l) => l.produto },
      { titulo: 'Unidade', valor: (l) => l.unidade },
      { titulo: 'Quantidade', valor: (l) => numeroCsv(l.quantidade) },
      { titulo: 'Validade', valor: (l) => formatarData(l.validade) },
      { titulo: 'Dias para vencer', valor: (l) => l.diasParaVencer },
      { titulo: 'Situação', valor: (l) => ROTULO_SITUACAO_LOTE[l.situacao] ?? l.situacao },
    ], linhas);

  const totalPerdas = d.perdasPorMotivo.reduce((soma, m) => soma + m.ocorrencias, 0);

  return (
    <div>
      <p className="mb-6 text-xs text-[#718096]">
        Estoque, validade e mínimos são o retrato de agora ({new Date(d.geradoEm).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}).
        Apenas as perdas dependem do período escolhido.
      </p>

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Indicador titulo="Sem saldo disponível" valor={d.semSaldoDisponivel.length} cor={d.semSaldoDisponivel.length > 0 ? 'red' : 'gray'} />
        <Indicador titulo="Abaixo do mínimo" valor={d.abaixoDoMinimo.length} cor={d.abaixoDoMinimo.length > 0 ? 'orange' : 'gray'} />
        <Indicador titulo="Lotes vencidos" valor={d.lotesVencidos.length} cor={d.lotesVencidos.length > 0 ? 'red' : 'gray'} detalhe="ainda no estoque, sem poder ser entregues" />
        <Indicador titulo="Lotes em alerta" valor={d.lotesEmAlerta.length} cor={d.lotesEmAlerta.length > 0 ? 'amber' : 'gray'} detalhe="dentro do prazo de alerta de cada produto" />
      </div>

      <Secao
        titulo="Lotes vencidos"
        descricao="Precisam ser retirados do estoque: Estoque > Lotes > Ajustar > Produto vencido."
        exportarDesativado={d.lotesVencidos.length === 0}
        onExportar={() => csvLotes(d.lotesVencidos, 'lotes-vencidos')}
      >
        <TabelaDados
          linhas={d.lotesVencidos}
          chave={(l) => l.loteId}
          vazio="Nenhum lote vencido no estoque."
          colunas={colunasLote}
        />
      </Secao>

      <Secao
        titulo="Lotes em alerta de validade"
        descricao="Do que vence primeiro para o que vence depois. O prazo de alerta é definido em cada produto."
        exportarDesativado={d.lotesEmAlerta.length === 0}
        onExportar={() => csvLotes(d.lotesEmAlerta, 'lotes-em-alerta')}
      >
        <TabelaDados
          linhas={d.lotesEmAlerta}
          chave={(l) => l.loteId}
          vazio="Nenhum lote dentro do prazo de alerta."
          colunas={colunasLote}
        />
      </Secao>

      <Secao
        titulo="Produtos sem saldo disponível"
        descricao="Zerados ou com apenas lotes vencidos."
        exportarDesativado={d.semSaldoDisponivel.length === 0}
        onExportar={() =>
          exportarCsv(nomeArquivo('produtos-sem-saldo', periodo), [
            { titulo: 'Produto', valor: (l) => l.nome },
            { titulo: 'Unidade', valor: (l) => l.unidadeSigla },
            { titulo: 'Situação', valor: (l) => (l.situacao === 'SOMENTE_VENCIDO' ? 'Só vencido' : 'Zerado') },
            { titulo: 'Saldo vencido', valor: (l) => numeroCsv(l.saldoVencido) },
            { titulo: 'Estoque mínimo', valor: (l) => numeroCsv(l.estoqueMinimo) },
          ], d.semSaldoDisponivel)
        }
      >
        <TabelaDados
          linhas={d.semSaldoDisponivel}
          chave={(l) => l.produtoId}
          vazio="Todos os produtos têm saldo disponível."
          colunas={[
            { titulo: 'Produto', render: (l) => l.nome, classe: 'font-semibold text-[#2D3748]' },
            { titulo: 'Situação', render: (l) => <StatusBadge status={l.situacao === 'SOMENTE_VENCIDO' ? 'Só vencido' : 'Zerado'} /> },
            { titulo: 'Vencido no estoque', render: (l) => (l.saldoVencido > 0 ? formatarQuantidade(l.saldoVencido, l.unidadeSigla) : '—') },
            { titulo: 'Mínimo', render: (l) => (l.estoqueMinimo != null ? formatarQuantidade(l.estoqueMinimo, l.unidadeSigla) : '—') },
          ]}
        />
      </Secao>

      <Secao
        titulo="Abaixo do estoque mínimo"
        descricao="O que precisa ser pedido aos doadores."
        exportarDesativado={d.abaixoDoMinimo.length === 0}
        onExportar={() =>
          exportarCsv(nomeArquivo('abaixo-do-minimo', periodo), [
            { titulo: 'Produto', valor: (l) => l.nome },
            { titulo: 'Unidade', valor: (l) => l.unidadeSigla },
            { titulo: 'Disponível', valor: (l) => numeroCsv(l.saldoDisponivel) },
            { titulo: 'Mínimo', valor: (l) => numeroCsv(l.estoqueMinimo) },
            { titulo: 'Falta', valor: (l) => numeroCsv(l.estoqueMinimo - l.saldoDisponivel) },
          ], d.abaixoDoMinimo)
        }
      >
        <TabelaDados
          linhas={d.abaixoDoMinimo}
          chave={(l) => l.produtoId}
          vazio="Nenhum produto abaixo do mínimo."
          colunas={[
            { titulo: 'Produto', render: (l) => l.nome, classe: 'font-semibold text-[#2D3748]' },
            { titulo: 'Disponível', render: (l) => formatarQuantidade(l.saldoDisponivel, l.unidadeSigla) },
            { titulo: 'Mínimo', render: (l) => formatarQuantidade(l.estoqueMinimo, l.unidadeSigla) },
            {
              titulo: 'Falta',
              render: (l) => `${formatarNumero(l.estoqueMinimo - l.saldoDisponivel)} ${l.unidadeSigla}`.trim(),
              classe: 'font-semibold text-orange-600',
            },
          ]}
        />
      </Secao>

      <Secao
        titulo="Perdas no período"
        descricao="Ajustes de perda, vencimento e avaria registrados no estoque. Correções de contagem não entram."
      >
        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          {d.perdasPorMotivo.length === 0 ? (
            <Indicador titulo="Perdas registradas" valor={0} detalhe="nenhuma perda neste período" />
          ) : (
            d.perdasPorMotivo.map((m) => (
              <Indicador
                key={m.motivo}
                titulo={ROTULO_MOTIVO_PERDA[m.motivo] ?? m.motivo}
                valor={m.ocorrencias}
                detalhe={m.ocorrencias === 1 ? 'ocorrência registrada' : 'ocorrências registradas'}
                cor="red"
              >
                <Quantidades lista={m.quantidades} cor="red" />
              </Indicador>
            ))
          )}
        </div>

        {totalPerdas > 0 && (
          <TabelaDados
            linhas={d.perdasPorProduto}
            chave={(l) => `${l.produtoId}-${l.unidade}`}
            colunas={[
              { titulo: 'Produto', render: (l) => l.produto, classe: 'font-semibold text-[#2D3748]' },
              { titulo: 'Quantidade perdida', render: (l) => `${formatarNumero(l.quantidade)} ${l.unidade}`.trim() },
              { titulo: 'Ocorrências', render: (l) => l.ocorrencias },
            ]}
          />
        )}
      </Secao>
    </div>
  );
}

export default function EstoqueTab({ periodo }) {
  const { dados, loading, error, recarregar } = useRelatorio('/relatorio/estoque', periodo);

  if (!dados) return <Estado loading={loading} error={error} onTentarDeNovo={recarregar} />;

  return (
    <div className={loading ? 'opacity-60 transition-opacity' : ''}>
      <EstoqueConteudo dados={dados} periodo={periodo} />
    </div>
  );
}