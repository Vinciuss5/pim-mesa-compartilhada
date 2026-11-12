import React, { useState, useEffect } from 'react';
import { useDoacao } from '../../hooks/useDoacao';
import { useDoadores } from '../../hooks/useDoadores';
import { useProdutos } from '../../hooks/useProdutos';

export default function EntradaDoacoes() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const hojeISO = new Date().toISOString().split('T')[0]; // "AAAA-MM-DD"

  // Hooks
  const { doacoesHistorico, isLoading, createDoacao, fetchDoacoes } = useDoacao();
  const { doadores, fetchDoadores } = useDoadores();
  const { produtos, fetchProdutos } = useProdutos();

  // Estados da Tela Principal (Filtros e Expansão)
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRows, setExpandedRows] = useState([]);

  // Estados do Modal
  const [doadorIdAtual, setDoadorIdAtual] = useState('');
  const [itensCarrinho, setItensCarrinho] = useState([]);

  // Estados do Item Atual
  const [produtoIdAtual, setProdutoIdAtual] = useState('');
  const [qtdAtual, setQtdAtual] = useState('');
  const [validadeAtual, setValidadeAtual] = useState('');

  // Busca os dados iniciais ao montar a tela
  useEffect(() => {
    fetchDoacoes();
    fetchDoadores();
    fetchProdutos();
  }, [fetchDoacoes, fetchDoadores, fetchProdutos]);

  // --- Lógica de Agrupamento e Filtro da Tabela ---

  // 1. Agrupa o histórico (que estava achatado) pelo ID da Doação
  const historicoAgrupado = Object.values(doacoesHistorico.reduce((acc, curr) => {
    if (!acc[curr.idDisplay]) {
      acc[curr.idDisplay] = {
        idDisplay: curr.idDisplay,
        data: curr.data,
        doador: curr.doador,
        itens: []
      };
    }
    acc[curr.idDisplay].itens.push({
      produto: curr.produto,
      quantidade: curr.quantidade,
      validade: curr.validade
    });
    return acc;
  }, {}));

  // 2. Filtra pelo nome do doador de acordo com a barra de pesquisa
  const historicoFiltrado = historicoAgrupado.filter(doacao =>
    doacao.doador.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 3. Função para abrir/fechar os detalhes da doação
  const toggleRow = (idDisplay) => {
    setExpandedRows(prev =>
      prev.includes(idDisplay)
        ? prev.filter(id => id !== idDisplay)
        : [...prev, idDisplay]
    );
  };

  // --- Funções do Carrinho ---

  const adicionarAoCarrinho = (e) => {
    e.preventDefault();
    if (!produtoIdAtual || !qtdAtual || !validadeAtual) return;

    // Bloqueio de segurança: reforça a regra mesmo se o navegador não respeitar o "min"
    if (validadeAtual < hojeISO) {
      alert("A data de validade não pode ser anterior a hoje.");
      return;
    }

    const produtoSelecionado = produtos.find(p => p.id.toString() === produtoIdAtual);

    const novoItem = {
      idTemp: Date.now(),
      produtoId: parseInt(produtoIdAtual),
      nome: produtoSelecionado?.nome || 'Produto Desconhecido',
      quantidade: parseFloat(qtdAtual).toFixed(2),
      validade: validadeAtual
    };

    setItensCarrinho([...itensCarrinho, novoItem]);

    setProdutoIdAtual('');
    setQtdAtual('');
    setValidadeAtual('');
  };

  const removerDoCarrinho = (idTemp) => {
    setItensCarrinho(itensCarrinho.filter(item => item.idTemp !== idTemp));
  };

  const fecharModal = () => {
    setIsModalOpen(false);
    setItensCarrinho([]);
    setDoadorIdAtual('');
    setProdutoIdAtual('');
    setQtdAtual('');
    setValidadeAtual('');
  };

  const handleConcluirRecebimento = async () => {
    if (!doadorIdAtual || itensCarrinho.length === 0) {
      alert("Selecione um doador e adicione pelo menos um item.");
      return;
    }

    const payload = {
      doadorId: parseInt(doadorIdAtual),
      data: new Date().toISOString(),
      itens: itensCarrinho.map(item => ({
        produtoId: item.produtoId,
        quantidade: parseFloat(item.quantidade),
        dataValidade: item.validade ? new Date(item.validade).toISOString() : null
      }))
    };

    const result = await createDoacao(payload);

    if (result.success) {
      fecharModal();
      fetchDoacoes();
    } else {
      alert(`Erro: ${result.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#2D3748] p-8 font-sans">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#2D3748]">Entrada de Doações</h1>
          <p className="text-sm text-[#718096] mt-1">Gerencie o recebimento de produtos e controle o histórico de entradas.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#007F45] hover:bg-[#006838] text-white px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-2 text-sm shadow-sm"
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          Registrar Nova Entrada
        </button>
      </div>

      {/* BARRA DE PESQUISA */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6 border border-gray-100 flex gap-4">
        <div className="relative w-full max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-[#718096]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar pelo nome do doador..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#007F45] focus:border-[#007F45]"
          />
        </div>
      </div>

      {/* TABELA DE HISTÓRICO COM AGRUPAMENTO */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100 text-[#718096]">
            <tr>
              <th className="px-6 py-4 font-medium text-left w-24">ID</th>
              <th className="px-6 py-4 font-medium text-left">Data</th>
              <th className="px-6 py-4 font-medium text-left w-1/3">Doador</th>
              <th className="px-6 py-4 font-medium text-center">Volume</th>
              <th className="px-12 py-4 font-medium text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-[#2D3748]">
            {isLoading ? (
              <tr><td colSpan="5" className="p-6 text-center text-gray-500">Carregando histórico...</td></tr>
            ) : historicoFiltrado.length === 0 ? (
              <tr><td colSpan="5" className="p-6 text-center text-gray-500">Nenhuma doação encontrada.</td></tr>
            ) : (
              historicoFiltrado.map((doacao) => (
                <React.Fragment key={doacao.idDisplay}>
                  <tr className={`hover:bg-gray-50 transition-colors ${expandedRows.includes(doacao.idDisplay) ? 'bg-gray-50' : ''}`}>
                    <td className="px-6 py-4 font-mono text-xs text-[#718096] whitespace-nowrap">{doacao.idDisplay}</td>
                    <td className="px-6 py-4 text-left whitespace-nowrap">{doacao.data}</td>
                    <td className="px-6 py-4 font-medium text-left whitespace-nowrap">{doacao.doador}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="bg-[#EDF2F7] text-[#4A5568] px-3 py-1 rounded-full text-xs font-semibold">
                        {doacao.itens.length} iten(s)
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => toggleRow(doacao.idDisplay)}
                        className="text-[#007F45] hover:text-[#006838] font-medium flex items-center justify-end gap-1 w-full outline-none"
                      >
                        {expandedRows.includes(doacao.idDisplay) ? 'Ocultar' : 'Ver itens'}
                        <svg className={`w-4 h-4 transition-transform ${expandedRows.includes(doacao.idDisplay) ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </button>
                    </td>
                  </tr>

                  {expandedRows.includes(doacao.idDisplay) && (
                    <tr>
                      <td colSpan="5" className="p-0 border-b border-gray-100 bg-[#FAFAFA]">
                        <div className="px-8 py-4 border-l-4 border-[#007F45]">
                          <table className="w-full text-xs">
                            <thead className="text-[#718096] border-b border-gray-200">
                              <tr>
                                <th className="pb-2 font-medium text-left">Produto</th>
                                <th className="pb-2 font-medium text-left">Quantidade</th>
                                <th className="pb-2 font-medium text-left">Validade</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {doacao.itens.map((item, idx) => (
                                <tr key={idx} className="hover:bg-gray-100 transition-colors">
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
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL DE REGISTRO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-[800px] max-h-[90vh] flex flex-col overflow-hidden">

            <div className="flex justify-between items-center p-5 border-b border-gray-100 shrink-0">
              <h2 className="text-xl font-bold text-[#1A202C]">Registrar Nova Entrada</h2>
              <button onClick={fecharModal} className="text-[#A0AEC0] hover:text-[#4A5568] transition-colors p-1 rounded-md hover:bg-gray-100">
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-[#FAFAFA]">

              <section className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="text-xs font-bold text-[#718096] uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[10px]">1</span>
                  Responsável
                </h3>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[#4A5568]">Doador <span className="text-red-500">*</span></label>
                  <select
                    value={doadorIdAtual}
                    onChange={(e) => setDoadorIdAtual(e.target.value)}
                    className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-1 focus:ring-[#007F45] focus:outline-none bg-white"
                  >
                    <option value="">Selecione um doador...</option>
                    {doadores.map(d => (
                      <option key={d.id} value={d.id}>{d.nome}</option>
                    ))}
                  </select>
                </div>
              </section>

              <section>
                <h3 className="text-xs font-bold text-[#718096] uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[10px]">2</span>
                  Adicionar Produtos
                </h3>
                <div className="bg-white p-4 rounded-lg border border-[#E2E8F0] shadow-sm">
                  <form onSubmit={adicionarAoCarrinho} className="grid grid-cols-12 gap-3 items-end">
                    <div className="col-span-12 md:col-span-5">
                      <label className="block text-sm font-medium mb-1 text-[#4A5568]">Produto <span className="text-red-500">*</span></label>
                      <select
                        value={produtoIdAtual}
                        onChange={(e) => setProdutoIdAtual(e.target.value)}
                        className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-1 focus:ring-[#007F45] focus:outline-none bg-white"
                      >
                        <option value="">Selecione...</option>
                        {produtos.map(p => (
                          <option key={p.id} value={p.id}>{p.nome}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-6 md:col-span-2">
                      <label className="block text-sm font-medium mb-1 text-[#4A5568]">Qtd. <span className="text-red-500">*</span></label>
                      <input
                        type="number"
                        step="0.01" min="0.01"
                        value={qtdAtual}
                        onChange={(e) => setQtdAtual(e.target.value)}
                        className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-1 focus:ring-[#007F45] focus:outline-none"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="col-span-6 md:col-span-3">
                      <label className="block text-sm font-medium mb-1 text-[#4A5568]">Validade <span className="text-red-500">*</span></label>
                      <input
                        type="date"
                        value={validadeAtual}
                        min={hojeISO}
                        onChange={(e) => setValidadeAtual(e.target.value)}
                        className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-1 focus:ring-[#007F45] focus:outline-none"
                      />
                    </div>
                    <div className="col-span-12 md:col-span-2">
                      <button
                        type="submit"
                        disabled={!produtoIdAtual || !qtdAtual || !validadeAtual}
                        className="w-full bg-[#EDF2F7] hover:bg-[#E2E8F0] text-[#2D3748] font-medium py-2 rounded-md transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200"
                      >
                        Inserir
                      </button>
                    </div>
                  </form>
                </div>
              </section>

              <section>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xs font-bold text-[#718096] uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[10px]">3</span>
                    Itens desta Doação
                  </h3>
                  <span className="text-xs font-medium text-[#718096] bg-gray-100 px-2 py-1 rounded-full">{itensCarrinho.length} iten(s)</span>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm min-h-[120px]">
                  {itensCarrinho.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-[#A0AEC0]">
                      <svg className="w-8 h-8 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                      <p className="text-sm">Nenhum item adicionado ainda.</p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-100">
                      {itensCarrinho.map((item) => (
                        <li key={item.idTemp} className="p-3 hover:bg-gray-50 flex justify-between items-center group">
                          <div>
                            <p className="text-sm font-semibold text-[#2D3748]">{item.nome}</p>
                            <p className="text-xs text-[#718096]">Validade: <span className="font-medium text-[#4A5568]">{new Date(item.validade).toLocaleDateString('pt-BR')}</span></p>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-sm font-mono font-medium text-[#2D3748]">{item.quantidade} un</span>
                            <button
                              onClick={() => removerDoCarrinho(item.idTemp)}
                              className="text-red-400 hover:text-red-600 p-1.5 rounded-md hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                              title="Remover item"
                            >
                              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>

            </div>

            <div className="p-5 border-t border-gray-100 bg-white flex justify-between items-center shrink-0">
              <button onClick={fecharModal} className="text-[#718096] text-sm font-medium hover:text-[#2D3748] transition-colors">
                Cancelar Transação
              </button>
              <button
                onClick={handleConcluirRecebimento}
                disabled={itensCarrinho.length === 0 || !doadorIdAtual || isLoading}
                className="bg-[#007F45] hover:bg-[#006838] text-white px-6 py-2.5 rounded-md font-medium text-sm transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading ? 'Processando...' : 'Concluir Recebimento'}
                {!isLoading && <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}