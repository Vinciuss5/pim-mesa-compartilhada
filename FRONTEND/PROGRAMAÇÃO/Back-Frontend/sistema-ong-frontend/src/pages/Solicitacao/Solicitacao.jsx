import React, { useState, useEffect } from 'react';
import { useSolicitacao } from '../../hooks/useSolicitacao';
import { useSolicitantes } from '../../hooks/useSolicitantes';
import { useProdutos } from '../../hooks/useProdutos';

export default function SaidaSolicitacoes() {
  // Hooks de Dados
  const { solicitacoes, loading: loadingSol, fetchSolicitacoes, criarSolicitacao, atualizarStatus } = useSolicitacao();
  const { solicitantes, fetchSolicitantes } = useSolicitantes();
  const { produtos, fetchProdutos } = useProdutos();

  // Estados do Modal e UI
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [linhaExpandida, setLinhaExpandida] = useState(null);
  const [filtro, setFiltro] = useState('');

  // Estados do Formulário (Cadastro)
  const [solicitanteId, setSolicitanteId] = useState('');
  const [enderecoManual, setEnderecoManual] = useState(''); // Visual apenas
  const [dataPrevisao, setDataPrevisao] = useState('');
  const [observacao, setObservacao] = useState('');
  
  const [itensCarrinho, setItensCarrinho] = useState([]);
  const [produtoIdAtual, setProdutoIdAtual] = useState('');
  const [qtdAtual, setQtdAtual] = useState('');

  // Carregamento Inicial
  useEffect(() => {
    fetchSolicitacoes();
    fetchSolicitantes();
    fetchProdutos();
  }, [fetchSolicitacoes, fetchSolicitantes, fetchProdutos]);

  // Lógica de Seleção de Solicitante (para pegar o endereço)
  const handleSolicitanteChange = (id) => {
    setSolicitanteId(id);
    const solicitanteEncontrado = solicitantes.find(s => s.id === parseInt(id));
    setEnderecoManual(solicitanteEncontrado?.enderecoEntrega || 'Endereço não cadastrado');
  };

  const adicionarProduto = (e) => {
    e.preventDefault();
    if (!produtoIdAtual || !qtdAtual) return;

    const produtoInfo = produtos.find(p => p.id === parseInt(produtoIdAtual));
    
    const novoItem = {
      produtoId: parseInt(produtoIdAtual),
      nome: produtoInfo?.nome || 'Produto',
      quantidade: parseFloat(qtdAtual)
    };

    setItensCarrinho([...itensCarrinho, novoItem]);
    setProdutoIdAtual('');
    setQtdAtual('');
  };

  const handleRegistrarSolicitacao = async () => {
    // Formata a observação para esconder a data de previsão
    const obsFormatada = `[PREVISÃO: ${dataPrevisao}] ${observacao}`.trim();

    const dto = {
      solicitanteId: parseInt(solicitanteId),
      observacao: obsFormatada,
      itens: itensCarrinho.map(item => ({
        produtoId: item.produtoId,
        quantidade: item.quantidade
      }))
    };

    const resultado = await criarSolicitacao(dto);
    if (resultado.sucesso) {
      setIsModalOpen(false);
      resetForm();
      alert("Solicitação registrada com sucesso!");
    } else {
      alert("Erro: " + resultado.erro);
    }
  };

  const resetForm = () => {
    setSolicitanteId('');
    setEnderecoManual('');
    setDataPrevisao('');
    setObservacao('');
    setItensCarrinho([]);
  };

  const renderStatusBadge = (status) => {
    const statusConfig = {
      'PENDENTE': 'bg-amber-50 text-amber-700 border-amber-200',
      'ENTREGUE': 'bg-emerald-50 text-emerald-700 border-emerald-200',
      'CANCELADO': 'bg-red-50 text-red-700 border-red-200'
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${statusConfig[status] || 'bg-gray-50'}`}>
        {status}
      </span>
    );
  };

  // Filtro de busca simples
  const solicitacoesFiltradas = solicitacoes.filter(s => 
    s.nomeSolicitante.toLowerCase().includes(filtro.toLowerCase()) || 
    s.id.toString().includes(filtro)
  );

  return (
<div className="min-h-screen bg-[#F8F9FA] text-[#2D3748] p-6 md:p-8 font-sans">
  
  {/* HEADER */}
  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
    <div>
      <h1 className="text-2xl font-bold text-gray-800">Saída de Solicitações</h1>
      <p className="text-sm text-gray-500 mt-1">Controle de entregas e baixas de estoque corporativo.</p>
    </div>
    <button 
      onClick={() => setIsModalOpen(true)}
      className="bg-[#007F45] hover:bg-[#006838] text-white px-5 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md"
    >
      <span className="text-lg leading-none">+</span> Nova Solicitação
    </button>
  </div>

  {/* BARRA DE PESQUISA */}
  <div className="bg-white p-4 rounded-xl shadow-sm mb-6 border border-gray-200 flex items-center">
    <div className="relative w-full max-w-md">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg 
  className="h-4 w-4 text-gray-400" 
  fill="none" 
  viewBox="0 0 24 24" 
  stroke="currentColor"
>
  <path 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    strokeWidth={2} 
    d="m21 21-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" 
  />
</svg>
      </div>
      <input 
        type="text" 
        placeholder="Buscar por ID ou Solicitante..." 
        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#007F45] focus:border-[#007F45] transition-all outline-none"
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
      />
    </div>
  </div>

  {/* TABELA DE HISTÓRICO */}
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left whitespace-nowrap">
        <thead className="bg-gray-50/80 text-gray-600 border-b border-gray-200">
          <tr>
            <th className="px-6 py-4 font-semibold">ID</th>
            <th className="px-6 py-4 font-semibold">Data</th>
            <th className="px-6 py-4 font-semibold">Solicitante</th>
            <th className="px-6 py-4 font-semibold">Itens</th>
            <th className="px-6 py-4 font-semibold">Status</th>
            <th className="px-6 py-4 font-semibold text-center">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {solicitacoesFiltradas.map((item) => (
            <React.Fragment key={item.id}>
              <tr className="hover:bg-gray-50/50 transition-colors group">
                <td className="px-6 py-4 font-mono text-xs text-gray-500">#{item.id}</td>
                <td className="px-6 py-4 text-gray-600">{new Date(item.dataSolicitacao).toLocaleDateString()}</td>
                <td className="px-6 py-4 font-medium text-gray-800">{item.nomeSolicitante}</td>
                <td className="px-6 py-4">
                  <button 
                    onClick={() => setLinhaExpandida(linhaExpandida === item.id ? null : item.id)}
                    className="text-[#007F45] font-medium text-xs border border-[#007F45]/30 hover:bg-[#007F45]/10 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1"
                  >
                    {item.itens.length} iten(s)
                    <span className="text-[10px]">{linhaExpandida === item.id ? '▲' : '▼'}</span>
                  </button>
                </td>
                <td className="px-6 py-4">{renderStatusBadge(item.status)}</td>
                <td className="px-6 py-4">
                  {item.status === 'PENDENTE' && (
                  <div className="flex justify-center gap-2">
                    <button 
                      onClick={() => atualizarStatus(item.id, 'ENTREGUE')}
                      className="text-emerald-600 hover:bg-emerald-50 px-2 py-1 rounded text-xs font-medium border border-emerald-100 transition-all" 
                    >
                      Confirmar
                    </button>
                    <button 
                      onClick={() => atualizarStatus(item.id, 'CANCELADO')}
                      className="text-red-600 hover:bg-red-50 px-2 py-1 rounded text-xs font-medium border border-red-100 transition-all" 
                    >
                      Cancelar
                    </button>
                  </div>
                  )}
                </td>
              </tr>
              
              {/* DETALHES EXPANSÍVEIS */}
              {linhaExpandida === item.id && (
                <tr className="bg-gray-50/80 border-b border-gray-200 shadow-inner">
                  <td colSpan="6" className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-[#007F45] rounded-full"></span>
                          Produtos Solicitados
                        </h4>
                        <div className="divide-y divide-gray-100">
                          {item.itens.map(prod => (
                            <div key={prod.id} className="flex justify-between items-center text-sm py-2">
                              <span className="text-gray-700">{prod.nomeProduto}</span>
                              <span className="font-mono font-semibold bg-[#007F45]/10 text-[#007F45] px-2 py-0.5 rounded text-xs">
                                {prod.quantidade} un
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Detalhes Adicionais</h4>
                        <div className="text-sm space-y-3">
                          <p className="text-gray-600">
                            <strong className="text-gray-800 block mb-1">Observações:</strong> 
                            {item.observacao || <span className="text-gray-400 italic">Nenhuma observação registrada.</span>}
                          </p>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
      {solicitacoesFiltradas.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          Nenhuma solicitação encontrada para esta busca.
        </div>
      )}
    </div>
  </div>

  {/* MODAL DE CADASTRO */}
  {isModalOpen && (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white z-10">
          <h2 className="text-lg font-bold text-gray-800">Nova Solicitação de Saída</h2>
          <button 
            onClick={() => setIsModalOpen(false)} 
            className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-8 overflow-y-auto bg-gray-50/50 flex-1">
          {/* SEÇÃO 1: DESTINO */}
          <section className="space-y-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <span className="bg-[#007F45] text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">1</span>
              Dados do Destino
            </h3>
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Solicitante</label>
                <select 
                  className="w-full border border-gray-300 rounded-lg py-2.5 px-3 text-sm focus:ring-2 focus:ring-[#007F45] focus:border-[#007F45] outline-none transition-all"
                  value={solicitanteId}
                  onChange={(e) => handleSolicitanteChange(e.target.value)}
                >
                  <option value="">Selecione um solicitante...</option>
                  {solicitantes.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                </select>
              </div>
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Endereço de Entrega <span className="text-gray-400 font-normal">(Automático)</span></label>
                <input 
                  type="text" 
                  readOnly 
                  value={enderecoManual} 
                  placeholder="Selecione um solicitante para preencher..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-3 text-sm text-gray-600 cursor-not-allowed" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Previsão de Entrega</label>
                <input 
                  type="date" 
                  value={dataPrevisao} 
                  onChange={(e) => setDataPrevisao(e.target.value)} 
                  className="w-full border border-gray-300 rounded-lg py-2.5 px-3 text-sm focus:ring-2 focus:ring-[#007F45] focus:border-[#007F45] outline-none transition-all" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Observação</label>
                <input 
                  type="text" 
                  value={observacao} 
                  onChange={(e) => setObservacao(e.target.value)} 
                  className="w-full border border-gray-300 rounded-lg py-2.5 px-3 text-sm focus:ring-2 focus:ring-[#007F45] focus:border-[#007F45] outline-none transition-all" 
                  placeholder="Ex: Entregar na portaria" 
                />
              </div>
            </div>
          </section>

          {/* SEÇÃO 2: ITENS */}
          <section className="space-y-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <span className="bg-[#007F45] text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">2</span>
              Adicionar Produtos
            </h3>
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-5">
              <form onSubmit={adicionarProduto} className="flex flex-col sm:flex-row gap-3">
                <select 
                  className="flex-1 border border-gray-300 rounded-lg py-2.5 px-3 text-sm focus:ring-2 focus:ring-[#007F45] focus:border-[#007F45] outline-none transition-all"
                  value={produtoIdAtual}
                  onChange={(e) => setProdutoIdAtual(e.target.value)}
                >
                  <option value="">Selecione o produto...</option>
                  {produtos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
                <div className="flex gap-3">
                  <input 
                    type="number" 
                    step="0.01" 
                    placeholder="Qtd" 
                    className="w-24 border border-gray-300 rounded-lg py-2.5 px-3 text-sm focus:ring-2 focus:ring-[#007F45] focus:border-[#007F45] outline-none transition-all"
                    value={qtdAtual}
                    onChange={(e) => setQtdAtual(e.target.value)}
                  />
                  <button 
                    type="submit" 
                    className="bg-[#007F45]/10 hover:bg-[#007F45]/20 text-[#007F45] px-5 py-2.5 rounded-lg text-sm font-bold transition-colors"
                  >
                    Add
                  </button>
                </div>
              </form>

              <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 overflow-hidden">
                {itensCarrinho.length === 0 ? (
                  <div className="p-6 text-center flex flex-col items-center justify-center text-gray-400">
                    <span className="text-2xl mb-2">📦</span>
                    <p className="text-sm">Nenhum produto adicionado à solicitação.</p>
                  </div>
                ) : (
                  itensCarrinho.map((item, index) => (
                    <div key={index} className="p-3 bg-gray-50/30 flex justify-between items-center text-sm hover:bg-gray-50 transition-colors">
                      <span className="font-medium text-gray-700">{item.nome}</span>
                      <div className="flex items-center gap-4">
                        <span className="font-mono font-bold bg-white border border-gray-200 px-2 py-1 rounded text-[#007F45]">
                          {item.quantidade}
                        </span>
                        <button 
                          onClick={() => setItensCarrinho(itensCarrinho.filter((_, i) => i !== index))} 
                          className="text-red-400 hover:text-red-600 hover:bg-red-50 w-7 h-7 rounded flex items-center justify-center transition-colors"
                          title="Remover item"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </div>

        <div className="p-5 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 z-10 rounded-b-2xl">
          <button 
            onClick={() => setIsModalOpen(false)} 
            className="px-5 py-2.5 text-gray-600 hover:bg-gray-200 rounded-lg font-medium text-sm transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={handleRegistrarSolicitacao}
            disabled={itensCarrinho.length === 0 || !solicitanteId}
            className="bg-[#007F45] hover:bg-[#006838] text-white px-6 py-2.5 rounded-lg font-semibold text-sm transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Registrar Solicitação
          </button>
        </div>
      </div>
    </div>
  )}
</div>
  );
}