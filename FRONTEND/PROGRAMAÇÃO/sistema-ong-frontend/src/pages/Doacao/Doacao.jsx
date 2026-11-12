import React, { useState, useEffect, useMemo } from 'react';
import { Plus, ChevronDown } from 'lucide-react';
import { useDoacao } from '../../StatusBadge/hooks/useDoacao';
import { useDoadores } from '../../StatusBadge/hooks/useDoadores';
import { useProdutos } from '../../StatusBadge/hooks/useProdutos';
import { useToast } from '../../components/contexts/ToastContext';
import PageHeader from '../../components/ui/PageHeader';
import SearchInput from '../../components/ui/SearchInput';
import NovaEntradaModal from './components/NovaEntradaModal';

export default function EntradaDoacoes() {
  const toast = useToast();

  // Hooks de dados
  const { doacoesHistorico, isLoading, createDoacao, fetchDoacoes } = useDoacao();
  const { doadores, fetchDoadores } = useDoadores();
  const { produtos, fetchProdutos } = useProdutos();

  // Estados da tela (modal, filtro e linhas expandidas)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRows, setExpandedRows] = useState([]);

  // Busca os dados iniciais ao montar a tela
  useEffect(() => {
    fetchDoacoes();
    fetchDoadores();
    fetchProdutos();
  }, [fetchDoacoes, fetchDoadores, fetchProdutos]);

  // O hook entrega o histórico "achatado" (uma linha por item); aqui agrupamos pela doação.
  // (Na Fase 4 o hook passa a entregar já agrupado.)
  const historicoAgrupado = useMemo(
    () =>
      Object.values(
        doacoesHistorico.reduce((acc, curr) => {
          if (!acc[curr.idDisplay]) {
            acc[curr.idDisplay] = {
              idDisplay: curr.idDisplay,
              data: curr.data,
              doador: curr.doador,
              itens: [],
            };
          }
          acc[curr.idDisplay].itens.push({
            produto: curr.produto,
            quantidade: curr.quantidade,
            validade: curr.validade,
          });
          return acc;
        }, {})
      ),
    [doacoesHistorico]
  );

  const historicoFiltrado = useMemo(() => {
    const busca = searchTerm.toLowerCase();
    return historicoAgrupado.filter((doacao) => doacao.doador.toLowerCase().includes(busca));
  }, [historicoAgrupado, searchTerm]);

  const toggleRow = (idDisplay) => {
    setExpandedRows((prev) =>
      prev.includes(idDisplay) ? prev.filter((id) => id !== idDisplay) : [...prev, idDisplay]
    );
  };

  const handleRegistrar = async (payload) => {
    const result = await createDoacao(payload);

    if (result.success) {
      toast.success('Entrada registrada com sucesso!');
      fetchDoacoes();
    }

    return result; // o modal decide se fecha (sucesso) ou mostra o erro
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-8 font-sans text-[#2D3748]">
      <PageHeader
        title="Entrada de Doações"
        subtitle="Gerencie o recebimento de produtos e controle o histórico de entradas."
      >
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-md bg-[#007F45] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#006838]"
        >
          <Plus size={16} />
          Registrar Nova Entrada
        </button>
      </PageHeader>

      {/* BARRA DE PESQUISA */}
      <div className="mb-6 flex gap-4 rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Buscar pelo nome do doador..."
        />
      </div>

      {/* TABELA DE HISTÓRICO COM AGRUPAMENTO */}
      <div className="overflow-x-auto rounded-lg border border-gray-100 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100 bg-gray-50 text-[#718096]">
            <tr>
              <th className="w-24 px-6 py-4 text-left font-medium">ID</th>
              <th className="px-6 py-4 text-left font-medium">Data</th>
              <th className="w-1/3 px-6 py-4 text-left font-medium">Doador</th>
              <th className="px-6 py-4 text-center font-medium">Volume</th>
              <th className="px-12 py-4 text-right font-medium">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-[#2D3748]">
            {isLoading ? (
              <tr>
                <td colSpan="5" className="p-6 text-center text-gray-500">
                  Carregando histórico...
                </td>
              </tr>
            ) : historicoFiltrado.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-6 text-center text-gray-500">
                  Nenhuma doação encontrada.
                </td>
              </tr>
            ) : (
              historicoFiltrado.map((doacao) => {
                const aberta = expandedRows.includes(doacao.idDisplay);

                return (
                  <React.Fragment key={doacao.idDisplay}>
                    <tr className={`transition-colors hover:bg-gray-50 ${aberta ? 'bg-gray-50' : ''}`}>
                      <td className="whitespace-nowrap px-6 py-4 font-mono text-xs text-[#718096]">
                        {doacao.idDisplay}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-left">{doacao.data}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-left font-medium">{doacao.doador}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="rounded-full bg-[#EDF2F7] px-3 py-1 text-xs font-semibold text-[#4A5568]">
                          {doacao.itens.length} iten(s)
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => toggleRow(doacao.idDisplay)}
                          className="flex w-full items-center justify-end gap-1 font-medium text-[#007F45] outline-none hover:text-[#006838]"
                        >
                          {aberta ? 'Ocultar' : 'Ver itens'}
                          <ChevronDown
                            size={16}
                            className={`transition-transform ${aberta ? 'rotate-180' : ''}`}
                          />
                        </button>
                      </td>
                    </tr>

                    {aberta && (
                      <tr>
                        <td colSpan="5" className="border-b border-gray-100 bg-[#FAFAFA] p-0">
                          <div className="border-l-4 border-[#007F45] px-8 py-4">
                            <table className="w-full text-xs">
                              <thead className="border-b border-gray-200 text-[#718096]">
                                <tr>
                                  <th className="pb-2 text-left font-medium">Produto</th>
                                  <th className="pb-2 text-left font-medium">Quantidade</th>
                                  <th className="pb-2 text-left font-medium">Validade</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {doacao.itens.map((item, idx) => (
                                  <tr key={idx} className="transition-colors hover:bg-gray-100">
                                    <td className="py-2.5 text-left font-medium text-[#4A5568]">{item.produto}</td>
                                    <td className="py-2.5 text-left font-semibold">{item.quantidade}</td>
                                    <td className="py-2.5 text-left text-[#718096]">{item.validade}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <NovaEntradaModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        doadores={doadores}
        produtos={produtos}
        onSubmit={handleRegistrar}
      />
    </div>
  );
}