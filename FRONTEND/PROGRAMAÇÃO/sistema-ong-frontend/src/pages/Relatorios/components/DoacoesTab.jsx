// src/pages/Relatorios/components/DoacoesTab.jsx
import { useRelatorio } from '../../../StatusBadge/hooks/useRelatorio';
import { formatarData, formatarNumero } from '../../../utils/format';
import { exportarCsv, numeroCsv } from '../../../utils/exportarCsv';
import { Indicador, Quantidades, Secao, Estado, TabelaDados } from './blocos';
import { nomeArquivo, textoQuantidades } from '../relatorioUtils';

/** Parte visual (recebe os dados prontos). */
export function DoacoesConteudo({ dados: d, periodo }) {
  return (
    <div>
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Indicador titulo="Doações recebidas" valor={d.totalDoacoes} cor="green" />
        <Indicador titulo="Doadores que doaram" valor={d.doadoresDistintos} detalhe="doadores diferentes no período" cor="green" />
        <Indicador titulo="Quantidade recebida" detalhe="unidades diferentes não se somam" cor="green">
          <Quantidades lista={d.recebido} />
        </Indicador>
      </div>

      <Secao
        titulo="Por doador"
        descricao="Quem mais doou no período, em número de doações."
        exportarDesativado={d.porDoador.length === 0}
        onExportar={() =>
          exportarCsv(nomeArquivo('doacoes-por-doador', periodo), [
            { titulo: 'Doador', valor: (l) => l.nome },
            { titulo: 'Doações', valor: (l) => l.doacoes },
            { titulo: 'Itens', valor: (l) => l.itens },
            { titulo: 'Quantidades', valor: (l) => textoQuantidades(l.quantidades) },
            { titulo: 'Última doação', valor: (l) => formatarData(l.ultimaDoacao) },
          ], d.porDoador)
        }
      >
        <TabelaDados
          linhas={d.porDoador}
          chave={(l) => l.doadorId}
          vazio="Nenhuma doação recebida neste período."
          colunas={[
            { titulo: 'Doador', render: (l) => l.nome, classe: 'font-semibold text-[#2D3748]' },
            { titulo: 'Doações', render: (l) => l.doacoes },
            { titulo: 'Itens', render: (l) => l.itens },
            { titulo: 'Quantidades', render: (l) => textoQuantidades(l.quantidades) },
            { titulo: 'Última doação', render: (l) => formatarData(l.ultimaDoacao) },
          ]}
        />
      </Secao>

      <Secao
        titulo="Produtos recebidos"
        descricao="Total recebido de cada produto, na unidade dele."
        exportarDesativado={d.porProduto.length === 0}
        onExportar={() =>
          exportarCsv(nomeArquivo('doacoes-por-produto', periodo), [
            { titulo: 'Produto', valor: (l) => l.produto },
            { titulo: 'Unidade', valor: (l) => l.unidade },
            { titulo: 'Quantidade', valor: (l) => numeroCsv(l.quantidade) },
            { titulo: 'Em quantas doações', valor: (l) => l.ocorrencias },
          ], d.porProduto)
        }
      >
        <TabelaDados
          linhas={d.porProduto}
          chave={(l) => `${l.produtoId}-${l.unidade}`}
          vazio="Nenhum produto recebido neste período."
          colunas={[
            { titulo: 'Produto', render: (l) => l.produto, classe: 'font-semibold text-[#2D3748]' },
            { titulo: 'Quantidade', render: (l) => `${formatarNumero(l.quantidade)} ${l.unidade}`.trim() },
            { titulo: 'Em quantas doações', render: (l) => l.ocorrencias },
          ]}
        />
      </Secao>
    </div>
  );
}

export default function DoacoesTab({ periodo }) {
  const { dados, loading, error, recarregar } = useRelatorio('/relatorio/doacoes', periodo);

  if (!dados) return <Estado loading={loading} error={error} onTentarDeNovo={recarregar} />;

  return (
    <div className={loading ? 'opacity-60 transition-opacity' : ''}>
      <DoacoesConteudo dados={dados} periodo={periodo} />
    </div>
  );
}