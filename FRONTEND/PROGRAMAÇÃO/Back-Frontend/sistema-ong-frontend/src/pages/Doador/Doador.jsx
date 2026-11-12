import React, { useState, useEffect } from 'react';
import { useDoadores } from '../../hooks/useDoadores';

export default function DoadoresIndex() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { doadores, loading, fetchDoadores, createDoador, primeiraExecucao } = useDoadores();

  const [formData, setFormData] = useState({
    nome: '', email: '', cpf: '', telefone: '', endereco: ''
  });

  // --- Funções de Formatação (Máscaras de Visualização) ---
  const formatCPF = (value) => {
    if (!value) return "";
    return value
      .replace(/\D/g, '') 
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1'); 
  };

  const formatTelefone = (value) => {
    if (!value) return "";
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1'); 
  };

  // --- Função para limpar máscara (Sanitização para o Banco) ---
  const stripMask = (value) => value.replace(/\D/g, '');

  useEffect(() => {
    if (primeiraExecucao.current) {
      primeiraExecucao.current = false;
      fetchDoadores(searchTerm); // busca imediata ao entrar na tela, sem esperar 500ms
      return;
    }
    const delayDebounce = setTimeout(() => {
      fetchDoadores(searchTerm);
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm, fetchDoadores]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === 'cpf') formattedValue = formatCPF(value);
    if (name === 'telefone') formattedValue = formatTelefone(value);

    setFormData(prev => ({ ...prev, [name]: formattedValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Engenharia de Software: Criamos um DTO de envio limpo
    // Não alteramos o estado do formulário para não "pular" a máscara na tela do usuário
    const dataToSubmit = {
      ...formData,
      cpf: stripMask(formData.cpf),
      telefone: stripMask(formData.telefone)
    };

    try {
      await createDoador(dataToSubmit); // Envia apenas números
      setIsModalOpen(false);
      setFormData({ nome: '', email: '', cpf: '', telefone: '', endereco: '' });
      fetchDoadores();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#2D3748] p-8 font-sans">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#2D3748]">Doadores</h1>
          <p className="text-sm text-[#718096] mt-1">Gestão da rede de parceiros e doadores da instituição.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#007F45] hover:bg-[#006838] text-white px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-2 text-sm shadow-sm"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Cadastrar Doador
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6 border border-gray-100">
        <div className="relative w-full max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-[#718096]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, CPF ou e-mail..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#007F45] focus:border-[#007F45]"
          />
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100 text-[#718096]">
            <tr>
              <th className="px-6 py-4 font-medium text-left">Nome</th>
              <th className="px-6 py-4 font-medium text-left">E-mail</th>
              <th className="px-6 py-4 font-medium text-left">Telefone</th>
              <th className="px-6 py-4 font-medium text-left">CPF</th>
              <th className="px-6 py-4 font-medium text-left">Endereço</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-[#2D3748]">
            {loading ? (
                <tr><td colSpan="5" className="text-center py-10">Carregando doadores...</td></tr>
            ) : doadores.map((doador) => (
              <tr key={doador.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-bold text-left">{doador.nome}</td>
                <td className="px-6 py-4 text-left">{doador.email}</td>
                {/* Visualização Formatada para o Usuário */}
                <td className="px-6 py-4 text-left">{formatTelefone(doador.telefone)}</td>
                <td className="px-6 py-4 text-left">{formatCPF(doador.cpf)}</td>
                <td className="px-6 py-4 text-left text-[#718096] whitespace-nowrap">
                  {doador.endereco}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de Cadastro */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-[650px] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold">Cadastrar Doador</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-[#718096] hover:text-[#2D3748]">
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="p-6">
                <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-12">
                      <label className="block text-sm font-medium mb-1 text-[#4A5568]">Nome Completo</label>
                      <input name="nome" value={formData.nome} onChange={handleInputChange} required type="text" placeholder="Insira o nome completo" className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-1 focus:ring-[#007F45] focus:outline-none" />
                    </div>

                    <div className="col-span-12 md:col-span-6">
                      <label className="block text-sm font-medium mb-1 text-[#4A5568]">E-mail</label>
                      <input name="email" value={formData.email} onChange={handleInputChange} required type="email" placeholder="Ex: doador@exemplo.com" className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-1 focus:ring-[#007F45] focus:outline-none" />
                    </div>
                    
                    <div className="col-span-12 md:col-span-6">
                      <label className="block text-sm font-medium mb-1 text-[#4A5568]">CPF</label>
                      <input name="cpf" value={formData.cpf} onChange={handleInputChange} required type="text" className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-1 focus:ring-[#007F45] focus:outline-none" placeholder="000.000.000-00" maxLength="14" />
                    </div>

                    <div className="col-span-12 md:col-span-4">
                      <label className="block text-sm font-medium mb-1 text-[#4A5568]">Telefone</label>
                      <input name="telefone" value={formData.telefone} onChange={handleInputChange} required type="text" className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-1 focus:ring-[#007F45] focus:outline-none" placeholder="(00) 00000-0000" maxLength="15" />
                    </div>

                    <div className="col-span-12 md:col-span-8">
                      <label className="block text-sm font-medium mb-1 text-[#4A5568]">Endereço Completo</label>
                      <input name="endereco" value={formData.endereco} onChange={handleInputChange} required type="text" placeholder="Rua, Numero - Bairro, Cidade - UF" className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-1 focus:ring-[#007F45] focus:outline-none" />
                    </div>
                </div>
                </div>

                <div className="p-6 border-t border-gray-100 flex justify-between items-center bg-gray-50">
                <button type="button" onClick={() => setIsModalOpen(false)} className="text-[#718096] text-sm font-medium hover:text-[#2D3748]">Cancelar</button>
                <button type="submit" className="bg-[#007F45] hover:bg-[#006838] text-white px-6 py-2 rounded-md font-medium text-sm shadow-sm transition-all">
                    Salvar Doador
                </button>
                </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );    
}