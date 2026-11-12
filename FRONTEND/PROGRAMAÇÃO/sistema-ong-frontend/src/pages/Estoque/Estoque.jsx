import { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { useEstoque } from '../../StatusBadge/hooks/useEstoque';
import { useProdutos } from '../../StatusBadge/hooks/useProdutos';
import { useToast } from '../../components/contexts/ToastContext';
import PageHeader from '../../components/ui/PageHeader';
import ResumoTab from './components/ResumoTab';
import LotesTab from './components/LotesTab';
import ProdutosTab from './components/ProdutosTab';
import ProdutoModal from './components/ProdutoModal';
import AjusteModal from './components/AjusteModal';

const ABAS = [
  { id: 'resumo', rotulo: 'Resumo por produto' },
  { id: 'lotes', rotulo: 'Lotes' },
  { id: 'produtos', rotulo: 'Produtos cadastrados' },
];

export default function Estoque() {
  const toast = useToast();
  const { estoque, isLoading, error, fetchEstoque, resumo, loadingResumo, errorResumo, fetchResumo, ajustarEstoque } =
    useEstoque();
  const {
    produtos,
    loading: loadingProdutos,
    fetchProdutos,
    createProduto,
    updateProduto,
  } = useProdutos();

  const [aba, setAba] = useState('resumo');
  const [buscaLotes, setBuscaLotes] = useState('');

  // Modal de produto: produtoEditando = null (cadastrar) ou o produto a editar
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState(null);

  // Ajuste manual de lote: loteAjuste = null (fechado) ou o lote escolhido
  const [loteAjuste, setLoteAjuste] = useState(null);

  // Tudo que depende do estoque é recarregado junto, para as três abas nunca ficarem divergentes
  const recarregar = useCallback(() => {
    fetchEstoque();
    fetchResumo();
    fetchProdutos();
  }, [fetchEstoque, fetchResumo, fetchProdutos]);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  const abrirCadastro = () => {
    setProdutoEditando(null);
    setIsModalOpen(true);
  };

  const abrirEdicao = (produto) => {
    setProdutoEditando(produto);
    setIsModalOpen(true);
  };

  // Do resumo para os lotes: já abre filtrado pelo produto escolhido
  const verLotes = (nomeProduto) => {
    setBuscaLotes(nomeProduto);
    setAba('lotes');
  };

  const handleSalvarProduto = async (formData) => {
    const nome = formData.nome.trim();

    if (produtoEditando) {
      const result = await updateProduto(produtoEditando.id, formData);

      if (result.success) {
        toast.success(`"${nome}" atualizado.`);
        recarregar(); // nome, unidade, mínimo e peso aparecem nas três abas
      }
      return result;
    }

    const result = await createProduto(formData);

    if (result.success) {
      toast.success(`"${nome}" cadastrado. Ele aparece no resumo como "Zerado" até receber a primeira doação.`, 7000);
      recarregar();
    }

    return result; // o modal decide se fecha (sucesso) ou mostra o erro
  };

  const handleAjustar = async (dados) => {
    const result = await ajustarEstoque(dados);

    if (result.success) {
      toast.success('Ajuste registrado. Ele aparece em Movimentações.');
      recarregar();
    }

    return result; // o modal decide se fecha (sucesso) ou mostra o erro
  };

  // Unidades de contagem (un, pct, cx...) só aceitam quantidades inteiras
  const loteEhContagem =
    produtos.find((p) => p.id === loteAjuste?.produtoId)?.unidadeTipo === 'CONTAGEM';

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-8 font-sans text-[#2D3748]">
      <PageHeader title="Controle de Estoque" subtitle="Saldos, validades e alertas, por produto e por lote.">
        <button
          onClick={abrirCadastro}
          className="flex items-center gap-2 rounded-md bg-[#007F45] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#006838]"
        >
          <Plus size={16} strokeWidth={2.5} />
          Cadastrar Produto
        </button>
      </PageHeader>

      {/* ABAS */}
      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-gray-200" role="tablist">
        {ABAS.map(({ id, rotulo }) => {
          const ativa = aba === id;
          return (
            <button
              key={id}
              role="tab"
              aria-selected={ativa}
              onClick={() => setAba(id)}
              className={`-mb-px shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                ativa
                  ? 'border-[#007F45] text-[#007F45]'
                  : 'border-transparent text-[#718096] hover:text-[#2D3748]'
              }`}
            >
              {rotulo}
              {id === 'produtos' && (
                <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-[#718096]">
                  {produtos.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {aba === 'resumo' && (
        <ResumoTab produtos={resumo} loading={loadingResumo} error={errorResumo} onVerLotes={verLotes} />
      )}

      {aba === 'lotes' && (
        <LotesTab
          estoque={estoque}
          isLoading={isLoading}
          error={error}
          onAjustar={setLoteAjuste}
          busca={buscaLotes}
          onBusca={setBuscaLotes}
        />
      )}

      {aba === 'produtos' && (
        <ProdutosTab produtos={produtos} loading={loadingProdutos} onEditar={abrirEdicao} />
      )}

      <AjusteModal
        open={Boolean(loteAjuste)}
        onClose={() => setLoteAjuste(null)}
        lote={loteAjuste}
        contagem={loteEhContagem}
        onSubmit={handleAjustar}
      />

      <ProdutoModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        produto={produtoEditando}
        onSubmit={handleSalvarProduto}
      />
    </div>
  );
}