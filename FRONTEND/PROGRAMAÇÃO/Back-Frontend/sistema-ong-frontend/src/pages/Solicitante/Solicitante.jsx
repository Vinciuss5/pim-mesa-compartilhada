import React, { useState, useEffect } from 'react';
import { useSolicitantes } from '../../hooks/useSolicitantes';

export default function SolicitantesIndex() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { solicitantes, loading, fetchSolicitantes, createSolicitante, primeiraExecucao } = useSolicitantes();


  const [formData, setFormData] = useState({
    nome: '', 
    email: '', 
    cpf: '', 
    telefone: '', 
    enderecoEntrega: ''
  });

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

  const stripMask = (value) => value.replace(/\D/g, '');

  useEffect(() => {
    if (primeiraExecucao.current) {
      primeiraExecucao.current = false;
      fetchSolicitantes(searchTerm);
      return;
    }
    const delayDebounce = setTimeout(() => {
      fetchSolicitantes(searchTerm);
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm, fetchSolicitantes]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === 'cpf') formattedValue = formatCPF(value);
    if (name === 'telefone') formattedValue = formatTelefone(value);

    setFormData(prev => ({ ...prev, [name]: formattedValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const dataToSubmit = {
      ...formData,
      cpf: stripMask(formData.cpf),
      telefone: stripMask(formData.telefone)
    };

    const result = await createSolicitante(dataToSubmit);
    
    if (result.success) {
      setIsModalOpen(false);
      setFormData({ nome: '', email: '', cpf: '', telefone: '', enderecoEntrega: '' });
      fetchSolicitantes();
    } else {
      alert(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#2D3748] p-8 font-sans">
      
      {/* Header Estratégico */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#2D3748]">Solicitantes</h1>
          <p className="text-sm text-[#718096] mt-1">Gestão de beneficiários e controle de entrega de donativos.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#007F45] hover:bg-[#006838] text-white px-4 py-2 rounded-md font-medium transition-all flex items-center gap-2 text-sm shadow-sm"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Novo Solicitante
        </button>
      </div>

      {/* Barra de Busca */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6 border border-gray-100">
        <div className="relative w-full max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-[#718096]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome ou CPF..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#007F45] focus:border-[#007F45] transition-all"
          />
        </div>
      </div>

      {/* Tabela de Dados - Layout Corrigido */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm table-fixed">
          <thead className="bg-gray-50 border-b border-gray-100 text-[#718096]">
            <tr>
              <th className="px-6 py-4 font-semibold text-left w-3/12">Nome</th>
              <th className="px-6 py-4 font-semibold text-left w-3/12">E-mail</th>
              <th className="px-6 py-4 font-semibold text-left w-2/12">Telefone</th>
              <th className="px-6 py-4 font-semibold text-left w-2/12">CPF</th>
              <th className="px-6 py-4 font-semibold text-left w-4/12">Endereço de Entrega</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-[#2D3748]">
            {loading ? (
              <tr><td colSpan="5" className="text-center py-10 animate-pulse">Carregando dados...</td></tr>
            ) : solicitantes.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-bold text-left" title={s.nome}>
                  {s.nome}  
                </td>
                <td className="px-6 py-4 text-left" title={s.email}>
                  {s.email || '-'}
                </td>
                <td className="px-6 py-4 text-left">
                  {formatTelefone(s.telefone)}
                </td>
                <td className="px-6 py-4 text-left">
                  {formatCPF(s.cpf)}
                </td>
                <td className="px-6 py-4 text-left text-[#718096] whitespace-nowrap" title={s.enderecoEntrega}>
                  {s.enderecoEntrega}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de Cadastro */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#1A202C]/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-[700px] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-white">
              <h2 className="text-xl font-bold text-[#2D3748]">Cadastrar Novo Solicitante</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-[#718096] hover:text-red-500 transition-colors">
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-8">
                <div className="grid grid-cols-12 gap-5">
                  <div className="col-span-12">
                    <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-[#4A5568]">Nome Completo</label>
                    <input name="nome" value={formData.nome} onChange={handleInputChange} required type="text" placeholder="Nome do beneficiário" className="w-full border border-gray-300 rounded-md py-2.5 px-4 text-sm focus:ring-2 focus:ring-[#007F45]/20 focus:border-[#007F45] focus:outline-none transition-all" />
                  </div>

                  <div className="col-span-12 md:col-span-6">
                    <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-[#4A5568]">E-mail (Opcional)</label>
                    <input name="email" value={formData.email} onChange={handleInputChange} type="email" placeholder="contato@exemplo.com" className="w-full border border-gray-300 rounded-md py-2.5 px-4 text-sm focus:ring-2 focus:ring-[#007F45]/20 focus:outline-none transition-all" />
                  </div>
                  
                  <div className="col-span-12 md:col-span-6">
                    <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-[#4A5568]">CPF</label>
                    <input name="cpf" value={formData.cpf} onChange={handleInputChange} required type="text" className="w-full border border-gray-300 rounded-md py-2.5 px-4 text-sm focus:ring-2 focus:ring-[#007F45]/20 focus:outline-none transition-all" placeholder="000.000.000-00" maxLength="14" />
                  </div>

                  <div className="col-span-12 md:col-span-4">
                    <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-[#4A5568]">Telefone</label>
                    <input name="telefone" value={formData.telefone} onChange={handleInputChange} required type="text" className="w-full border border-gray-300 rounded-md py-2.5 px-4 text-sm focus:ring-2 focus:ring-[#007F45]/20 focus:outline-none transition-all" placeholder="(00) 00000-0000" maxLength="15" />
                  </div>

                  <div className="col-span-12 md:col-span-8">
                    <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-[#4A5568]">Endereço Completo de Entrega</label>
                    <input name="enderecoEntrega" value={formData.enderecoEntrega} onChange={handleInputChange} required type="text" placeholder="Rua, Numero - Bairro, Cidade - UF" className="w-full border border-gray-300 rounded-md py-2.5 px-4 text-sm focus:ring-2 focus:ring-[#007F45]/20 focus:outline-none transition-all" />
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 flex justify-end gap-4 bg-gray-50">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-[#718096] hover:text-[#2D3748] transition-colors">Descartar</button>
                <button type="submit" className="bg-[#007F45] hover:bg-[#006838] text-white px-8 py-2.5 rounded-md font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-95">
                  Confirmar Cadastro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}