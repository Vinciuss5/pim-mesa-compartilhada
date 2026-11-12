import { useState, useEffect, useMemo } from 'react';
import { useEstoque } from '../../hooks/useEstoque';
import { useUnidades } from '../../hooks/useUnidades';
import { formatarQuantidade, formatarNumero } from '../../utils/format';
import { CATEGORIAS, TIPOS_UNIDADE } from '../../utils/produtoOpcoes';

const FORM_INICIAL = {
  nome: '',
  unidadeId: '',
  categoria: '',
  peso: '',
  estoqueMinimo: '',
  controlaValidade: true,
};

const NOVA_UNIDADE_INICIAL = { nome: '', sigla: '', tipo: 'CONTAGEM' };

const inputClass =
  'w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-1 focus:ring-[#007F45] focus:outline-none bg-white';

export default function EstoqueIndex() {
  const { estoque, isLoading, error, fetchEstoque, createProduto } = useEstoque();
  const { unidades, fetchUnidades, criarUnidade } = useUnidades();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(FORM_INICIAL);
  const [salvando, setSalvando] = useState(false);
  const [aviso, setAviso] = useState('');

  // Mini formulário "+ Nova unidade" dentro do modal
  const [novaUnidadeAberta, setNovaUnidadeAberta] = useState(false);
  const [novaUnidade, setNovaUnidade] = useState(NOVA_UNIDADE_INICIAL);
  const [salvandoUnidade, setSalvandoUnidade] = useState(false);

  // Estados para os filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos os Status');

  // Busca os dados assim que a tela é montada
  useEffect(() => {
    fetchEstoque();
    fetchUnidades();
  }, [fetchEstoque, fetchUnidades]);

  // Some sozinho o aviso de sucesso
  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(''), 7000);
    return () => clearTimeout(t);
  }, [aviso]);

  const unidadeSelecionada = useMemo(
    () => unidades.find((u) => String(u.id) === String(formData.unidadeId)),
    [unidades, formData.unidadeId]
  );

  // Peso por unidade só faz sentido para unidades de contagem (pct, cx, un...)
  const mostrarPeso = unidadeSelecionada?.tipo === 'CONTAGEM';

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleUnidadeChange = (e) => {
    const unidadeId = e.target.value;
    const unidade = unidades.find((u) => String(u.id) === String(unidadeId));
    setFormData((prev) => ({
      ...prev,
      unidadeId,
      // Se a nova unidade não for de contagem, o peso por unidade deixa de existir
      peso: unidade?.tipo === 'CONTAGEM' ? prev.peso : '',
    }));
  };

  const fecharModal = () => {
    setIsModalOpen(false);
    setFormData(FORM_INICIAL);
    setNovaUnidadeAberta(false);
    setNovaUnidade(NOVA_UNIDADE_INICIAL);
  };

  const handleCriarUnidade = async () => {
    if (!novaUnidade.nome.trim() || !novaUnidade.sigla.trim()) {
      alert('Informe o nome e a sigla da nova unidade.');
      return;
    }

    setSalvandoUnidade(true);
    const result = await criarUnidade(novaUnidade);
    setSalvandoUnidade(false);

    if (result.success) {
      // Já deixa a unidade recém-criada selecionada
      setFormData((prev) => ({
        ...prev,
        unidadeId: String(result.data.id),
        peso: result.data.tipo === 'CONTAGEM' ? prev.peso : '',
      }));
      setNovaUnidade(NOVA_UNIDADE_INICIAL);
      setNovaUnidadeAberta(false);
    } else {
      alert(`Erro ao criar unidade: ${result.message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSalvando(true);

    const result = await createProduto(formData);

    setSalvando(false);

    if (result.success) {
      const nomeCadastrado = formData.nome.trim();
      fecharModal();
      // Produto novo entra sem saldo e só aparece na tabela quando receber uma doação.
      setAviso(`"${nomeCadastrado}" cadastrado. Ele aparecerá no estoque assim que receber uma doação.`);
    } else {
      alert(`Erro ao cadastrar produto: ${result.message}`);
    }
  };

  // 1. Lógica dos Mini Relatórios (KPIs) calculada dinamicamente
  const metrics = useMemo(() => {
    let skusAtivos = 0;
    let baixoEstoque = 0;
    let vencimentoProximo = 0;

    const hoje = new Date();

    estoque.forEach((item) => {
      // Conta SKUs ativos (que têm pelo menos 1 item no estoque)
      if (item.qtd > 0) skusAtivos++;

      // Conta itens que estão com o status de baixo estoque
      if (item.status?.toLowerCase() === 'baixo estoque') {
        baixoEstoque++;
      }

      // Calcula proximidade de vencimento (90 dias)
      if (item.validade && item.validade !== 'N/A') {
        const [dia, mes, ano] = item.validade.split('/');
        const dataValidade = new Date(`${ano}-${mes}-${dia}T00:00:00`);

        const diffTempo = dataValidade.getTime() - hoje.getTime();
        const diffDias = Math.ceil(diffTempo / (1000 * 3600 * 24));

        if (diffDias > 0 && diffDias <= 90 && item.qtd > 0) {
          vencimentoProximo++;
        }
      }
    });

    return { skusAtivos, baixoEstoque, vencimentoProximo };
  }, [estoque]);

  // 2. Lógica do Filtro Robusto
  const estoqueFiltrado = useMemo(() => {
    return estoque.filter((item) => {
      const search = searchTerm.toLowerCase().trim();

      const nome = item.nome?.toLowerCase() || '';
      const lote = item.lote?.toLowerCase() || '';
      const origem = item.origem?.toLowerCase() || '';
      const statusItem = item.status?.toLowerCase() || '';

      const matchBusca = nome.includes(search) || lote.includes(search) || origem.includes(search);

      const matchStatus =
        statusFilter === 'Todos os Status' || statusItem === statusFilter.toLowerCase();

      return matchBusca && matchStatus;
    });
  }, [estoque, searchTerm, statusFilter]);

  const getStatusColor = (status) => {
    const st = status?.toLowerCase();
    switch (st) {
      case 'disponível': return 'bg-green-50 text-green-700 border-green-100';
      case 'baixo estoque': return 'bg-orange-50 text-orange-700 border-orange-100';
      case 'esgotado': return 'bg-red-50 text-red-700 border-red-100';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  const checkVencimentoProximo = (validade) => {
    if (!validade || validade === 'N/A') return false;
    const [dia, mes, ano] = validade.split('/');
    const dataValidade = new Date(`${ano}-${mes}-${dia}T00:00:00`);
    const hoje = new Date();
    const diffTempo = dataValidade.getTime() - hoje.getTime();
    const diffDias = Math.ceil(diffTempo / (1000 * 3600 * 24));
    return diffDias > 0 && diffDias <= 90;
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#2D3748] p-8 font-sans">

      {/* HEADER */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#2D3748]">Controle de Estoque</h1>
          <p className="text-sm text-[#718096] mt-1">Gestão inteligente de itens e prazos.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#007F45] hover:bg-[#006838] text-white px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-2 text-sm shadow-sm"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Cadastrar Produto
        </button>
      </div>

      {/* AVISO DE SUCESSO */}
      {aviso && (
        <div className="mb-6 flex items-start justify-between gap-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          <span>{aviso}</span>
          <button type="button" onClick={() => setAviso('')} className="text-green-700 hover:text-green-900" aria-label="Fechar aviso">
            ✕
          </button>
        </div>
      )}

      {/* DASHBOARD CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <span className="text-xs uppercase tracking-wider font-bold text-[#718096]">Total de Itens</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold">{metrics.skusAtivos}</span>
            <span className="text-xs text-green-600 font-medium">SKUs ativos</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border-l-4 border-l-amber-500 shadow-sm flex flex-col justify-between border-y border-r border-gray-100">
          <span className="text-xs uppercase tracking-wider font-bold text-[#718096]">Baixo Estoque</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-amber-600">{metrics.baixoEstoque}</span>
            <span className="text-xs text-amber-500 font-medium">Ação preventiva</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border-l-4 border-l-orange-400 shadow-sm flex flex-col justify-between border-y border-r border-gray-100">
          <span className="text-xs uppercase tracking-wider font-bold text-[#718096]">Próximos ao Vencimento</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-orange-600">{metrics.vencimentoProximo}</span>
            <span className="text-xs text-orange-400">Prox. 3 Meses</span>
          </div>
        </div>
      </div>

      {/* FILTROS */}
      <div className="bg-white p-4 rounded-t-xl border border-gray-100 flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-[#718096]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filtrar produtos por nome ou origem..."
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#007F45]/20 focus:border-[#007F45] outline-none"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-2 px-3 border border-gray-200 rounded-lg text-sm focus:border-[#007F45] outline-none bg-white font-medium"
          >
            <option value="Todos os Status">Todos os Status</option>
            <option value="Disponível">Disponível</option>
            <option value="Baixo estoque">Baixo Estoque</option>
          </select>
        </div>
      </div>

      {/* ESTADOS DE CARREGAMENTO E ERRO */}
      {isLoading && (
        <div className="bg-white p-8 text-center text-gray-500 border-x border-b border-gray-100 rounded-b-xl">
          Carregando estoque...
        </div>
      )}

      {error && !isLoading && (
        <div className="bg-white p-8 text-center text-red-500 border-x border-b border-gray-100 rounded-b-xl">
          Erro ao carregar dados: {error}
        </div>
      )}

      {/* TABELA */}
      {!isLoading && !error && (
        <div className="bg-white rounded-b-xl shadow-sm border-x border-b border-gray-100 overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead className="bg-gray-50/50 border-b border-gray-100 text-[#718096]">
              <tr>
                <th className="px-5 py-4 font-semibold text-left uppercase tracking-tighter text-[11px]">Produto</th>
                <th className="px-4 py-4 font-semibold text-left uppercase tracking-tighter text-[11px]">Estoque Atual</th>
                <th className="px-4 py-4 font-semibold text-left uppercase tracking-tighter text-[11px]">Status</th>
                <th className="px-4 py-4 font-semibold text-left uppercase tracking-tighter text-[11px]">Origem</th>
                <th className="px-4 py-4 font-semibold text-left uppercase tracking-tighter text-[11px]">Entrada</th>
                <th className="px-4 py-4 font-semibold text-left uppercase tracking-tighter text-[11px]">Validade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {estoqueFiltrado.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-5 py-8 text-center text-gray-500">
                    Nenhum produto encontrado.
                  </td>
                </tr>
              ) : (
                estoqueFiltrado.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/80 transition-all cursor-default">
                    <td className="px-5 py-4">
                      <div className="font-bold text-[#2D3748] whitespace-nowrap">{item.nome}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="font-semibold text-[#4A5568]">
                        {formatarQuantidade(item.qtd, item.unidade)}
                      </div>
                      {/* Peso por unidade informado: mostra o total estimado em kg */}
                      {item.peso > 0 && (
                        <div className="text-[11px] text-[#718096] italic">
                          {formatarNumero(item.peso)} kg/{item.unidade} · ≈ {formatarNumero(item.qtd * item.peso)} kg
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold border ${getStatusColor(item.status)}`}>
                        {item.status?.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-[#718096] text-xs font-medium max-w-[150px] truncate" title={item.origem}>
                      {item.origem}
                    </td>
                    <td className="px-4 py-4 text-xs font-medium text-[#718096] whitespace-nowrap">
                      {item.entrada}
                    </td>
                    <td className="px-4 py-4 text-xs font-semibold whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {checkVencimentoProximo(item.validade) && item.qtd > 0 && (
                          <span
                            className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"
                            title="Vencimento próximo (menos de 90 dias)"
                          />
                        )}

                        <span className={`
                            ${item.status?.toLowerCase() === 'esgotado' ? 'text-gray-300' : 'text-[#4A5568]'}
                            ${checkVencimentoProximo(item.validade) && item.qtd > 0 ? 'text-amber-700' : ''}
                          `}>
                          {item.validade}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL: CADASTRAR PRODUTO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-[540px] max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold">Cadastrar Produto</h2>
              <button
                type="button"
                onClick={fecharModal}
                className="text-[#718096] hover:text-[#2D3748]"
                aria-label="Fechar modal"
              >
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-6 grid grid-cols-12 gap-4">

                {/* Nome */}
                <div className="col-span-12">
                  <label className="block text-sm font-medium mb-1 text-[#4A5568]" htmlFor="produto-nome">
                    Nome do Produto
                  </label>
                  <input
                    id="produto-nome"
                    name="nome"
                    value={formData.nome}
                    onChange={handleInputChange}
                    required
                    maxLength={80}
                    type="text"
                    placeholder="Ex: Arroz tipo 1 (pacote 5 kg)"
                    className={inputClass}
                  />
                </div>

                {/* Unidade de medida */}
                <div className="col-span-12 sm:col-span-6">
                  <label className="block text-sm font-medium mb-1 text-[#4A5568]" htmlFor="produto-unidade">
                    Unidade de medida
                  </label>
                  <select
                    id="produto-unidade"
                    name="unidadeId"
                    value={formData.unidadeId}
                    onChange={handleUnidadeChange}
                    required
                    className={inputClass}
                  >
                    <option value="">Selecione...</option>
                    {TIPOS_UNIDADE.map((tipo) => (
                      <optgroup key={tipo.value} label={tipo.label}>
                        {unidades
                          .filter((u) => u.tipo === tipo.value)
                          .map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.nome} ({u.sigla})
                            </option>
                          ))}
                      </optgroup>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setNovaUnidadeAberta((aberta) => !aberta)}
                    className="mt-1 text-xs font-medium text-[#007F45] hover:underline"
                  >
                    {novaUnidadeAberta ? 'Cancelar nova unidade' : '+ Nova unidade'}
                  </button>
                </div>

                {/* Categoria */}
                <div className="col-span-12 sm:col-span-6">
                  <label className="block text-sm font-medium mb-1 text-[#4A5568]" htmlFor="produto-categoria">
                    Categoria <span className="text-[#A0AEC0] font-normal">— opcional</span>
                  </label>
                  <select
                    id="produto-categoria"
                    name="categoria"
                    value={formData.categoria}
                    onChange={handleInputChange}
                    className={inputClass}
                  >
                    <option value="">Sem categoria</option>
                    {CATEGORIAS.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>

                {/* Mini formulário: nova unidade */}
                {novaUnidadeAberta && (
                  <div className="col-span-12 rounded-lg border border-dashed border-[#007F45]/40 bg-[#007F45]/5 p-4 grid grid-cols-12 gap-3">
                    <p className="col-span-12 text-xs text-[#4A5568]">
                      Crie uma unidade que ainda não existe na lista (ex.: Bandeja — bdj).
                    </p>
                    <div className="col-span-12 sm:col-span-5">
                      <input
                        value={novaUnidade.nome}
                        onChange={(e) => setNovaUnidade((p) => ({ ...p, nome: e.target.value }))}
                        maxLength={40}
                        placeholder="Nome (ex.: Bandeja)"
                        aria-label="Nome da nova unidade"
                        className={inputClass}
                      />
                    </div>
                    <div className="col-span-5 sm:col-span-3">
                      <input
                        value={novaUnidade.sigla}
                        onChange={(e) => setNovaUnidade((p) => ({ ...p, sigla: e.target.value }))}
                        maxLength={10}
                        placeholder="Sigla"
                        aria-label="Sigla da nova unidade"
                        className={inputClass}
                      />
                    </div>
                    <div className="col-span-7 sm:col-span-4">
                      <select
                        value={novaUnidade.tipo}
                        onChange={(e) => setNovaUnidade((p) => ({ ...p, tipo: e.target.value }))}
                        aria-label="Tipo da nova unidade"
                        className={inputClass}
                      >
                        {TIPOS_UNIDADE.map((t) => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-12 flex justify-end">
                      <button
                        type="button"
                        onClick={handleCriarUnidade}
                        disabled={salvandoUnidade}
                        className="bg-[#007F45] hover:bg-[#006838] disabled:opacity-60 text-white px-4 py-1.5 rounded-md text-xs font-medium"
                      >
                        {salvandoUnidade ? 'Criando...' : 'Criar unidade'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Peso por unidade: só para unidades de contagem */}
                {mostrarPeso && (
                  <div className="col-span-12 sm:col-span-6">
                    <label className="block text-sm font-medium mb-1 text-[#4A5568]" htmlFor="produto-peso">
                      Peso de 1 {unidadeSelecionada.sigla} (kg) <span className="text-[#A0AEC0] font-normal">— opcional</span>
                    </label>
                    <input
                      id="produto-peso"
                      name="peso"
                      value={formData.peso}
                      onChange={handleInputChange}
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Ex: 5.00"
                      className={inputClass}
                    />
                    <p className="mt-1 text-[11px] text-[#718096]">Permite estimar o total em kg no estoque.</p>
                  </div>
                )}

                {/* Estoque mínimo */}
                <div className={`col-span-12 ${mostrarPeso ? 'sm:col-span-6' : ''}`}>
                  <label className="block text-sm font-medium mb-1 text-[#4A5568]" htmlFor="produto-minimo">
                    Estoque mínimo{unidadeSelecionada ? ` (${unidadeSelecionada.sigla})` : ''}{' '}
                    <span className="text-[#A0AEC0] font-normal">— opcional</span>
                  </label>
                  <input
                    id="produto-minimo"
                    name="estoqueMinimo"
                    value={formData.estoqueMinimo}
                    onChange={handleInputChange}
                    type="number"
                    step={unidadeSelecionada?.tipo === 'CONTAGEM' ? '1' : '0.01'}
                    min="0"
                    placeholder="Ex: 20"
                    className={inputClass}
                  />
                  <p className="mt-1 text-[11px] text-[#718096]">Usado nos alertas de estoque baixo.</p>
                </div>

                {/* Controla validade */}
                <div className="col-span-12">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="controlaValidade"
                      checked={formData.controlaValidade}
                      onChange={handleInputChange}
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-[#007F45]"
                    />
                    <span className="text-sm text-[#4A5568]">
                      <span className="font-medium">Controlar validade</span>
                      <span className="block text-[11px] text-[#718096]">
                        Exige a data de validade em toda doação deste produto.
                      </span>
                    </span>
                  </label>
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 flex justify-between items-center bg-gray-50">
                <button
                  type="button"
                  onClick={fecharModal}
                  className="text-[#718096] text-sm font-medium hover:text-[#2D3748]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="bg-[#007F45] hover:bg-[#006838] disabled:opacity-60 text-white px-6 py-2 rounded-md font-medium text-sm shadow-sm transition-all"
                >
                  {salvando ? 'Salvando...' : 'Salvar Produto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}