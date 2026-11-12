import React, { useState, useEffect } from 'react';
import { useFuncionarios } from '../../hooks/useFuncionarios';

// Utilitários de Máscara (Fora do componente para evitar recriação em cada render)
const formatCPF = (value) => {
  if (!value) return '';
  return value.replace(/\D/g, '')
              .replace(/(\d{3})(\d)/, '$1.$2')
              .replace(/(\d{3})(\d)/, '$1.$2')
              .replace(/(\d{3})(\d{1,2})/, '$1-$2')
              .replace(/(-\d{2})\d+?$/, '$1');
};

const formatPhone = (value) => {
  if (!value) return '';
  return value.replace(/\D/g, '')
              .replace(/(\d{2})(\d)/, '($1) $2')
              .replace(/(\d{5})(\d)/, '$1-$2')
              .replace(/(-\d{4})\d+?$/, '$1');
};

// Utilitário de Limpeza para a API
const unmask = (value) => value ? value.replace(/\D/g, '') : '';

export default function FuncionariosIndex() {
  const {
    funcionarios,
    isLoading,
    fetchFuncionarios,
    createFuncionario,
    toggleStatus
  } = useFuncionarios();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formError, setFormError] = useState('');

  // 1. Corrigido para 'FUNCIONARIO'
  const formInitialState = { nome: '', email: '', cpf: '', telefone: '', tipo: 'FUNCIONARIO', senha: '', dataAdmissao: new Date().toISOString().split('T')[0] };
  const [formData, setFormData] = useState(formInitialState);

  useEffect(() => {
    fetchFuncionarios();
  }, [fetchFuncionarios]);

  // 2. Máscara aplicada em tempo de digitação
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === 'cpf') formattedValue = formatCPF(value);
    if (name === 'telefone') formattedValue = formatPhone(value);

    setFormData((prev) => ({ ...prev, [name]: formattedValue }));
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setFormData(formInitialState);
    setFormError('');
    setShowPassword(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    // 2. Limpeza dos dados antes de enviar para o Backend (Envia puros)
    const payload = {
      ...formData,
      cpf: unmask(formData.cpf),
      telefone: unmask(formData.telefone)
    };

    const result = await createFuncionario(payload);
    if (result.success) handleModalClose();
    else setFormError(result.message || 'Erro ao cadastrar funcionário.');
  };

  const handleToggleStatus = (func) => {
    const acao = func.ativo ? 'desativar' : 'ativar';
    if (window.confirm(`Tem certeza que deseja ${acao} o funcionário ${func.nome}?`)) {
      toggleStatus(func);
    }
  };

const funcionariosFiltrados = funcionarios.filter((func) => {
    // 1. Normalizamos a busca: letra minúscula e sem espaços inúteis
    const search = searchTerm.toLowerCase().trim();
    
    // 2. Criamos uma versão apenas numérica para buscas de CPF/Telefone
    const searchNumbers = search.replace(/\D/g, '');

    // 3. Verificação de segurança (evitar erro se o campo vier nulo do banco)
    const nome = func.nome?.toLowerCase() || '';
    const email = func.email?.toLowerCase() || '';
    const cpf = func.cpf?.replace(/\D/g, '') || ''; // Garantimos que o CPF do banco está puro
    const telefone = func.telefone?.replace(/\D/g, '') || '';

    return (
      nome.includes(search) || 
      email.includes(search) || 
      (searchNumbers !== '' && cpf.includes(searchNumbers)) || // Só busca CPF se houver números na busca
      (searchNumbers !== '' && telefone.includes(searchNumbers))
    );
  });

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#2D3748] p-8 font-sans">
      
      {/* Header Estratégico */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Funcionários</h1>
          <p className="text-sm text-[#718096]">Gestão de acessos e permissões da equipe.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#007F45] hover:bg-[#006838] text-white px-5 py-2.5 rounded-lg font-semibold transition-all flex items-center gap-2 shadow-sm active:transform active:scale-95"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Cadastrar Funcionário
        </button>
      </div>

      {/* Busca */}
      <div className="bg-white p-4 rounded-xl shadow-sm mb-6 border border-gray-200">
        <div className="relative max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </span>
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filtrar por nome, CPF ou e-mail..." 
            className="block w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#007F45]/20 focus:border-[#007F45] outline-none transition-all"
          />
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-[#4A5568] uppercase text-[11px] tracking-wider">
              <th className="px-6 py-4 font-bold text-left">Nome</th>
              {/* 3. Colunas separadas para E-mail e Telefone */}
              <th className="px-6 py-4 font-bold text-left">E-mail</th>
              <th className="px-6 py-4 font-bold text-left">Telefone</th>
              <th className="px-6 py-4 font-bold text-left">CPF</th>
              <th className="px-6 py-4 font-bold text-left">Admissão</th>
              <th className="px-6 py-4 font-bold text-left">Cargo</th>
              <th className="px-6 py-4 font-bold text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {funcionariosFiltrados.map((func) => (
            <tr key={func.id} className={`hover:bg-gray-50/80 transition-colors ${!func.ativo ? 'bg-gray-50/50 opacity-60' : ''}`}>
              <td className="px-6 py-4">
                <div className={`font-bold ${func.ativo ? 'text-gray-900' : 'text-gray-500 font-normal'}`}>{func.nome}</div>
              </td>
              <td className="px-6 py-4 text-gray-600">{func.email || '-'}</td>
              <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{formatPhone(func.telefone) || '-'}</td>
              
              {/* CPF com menor contraste para reduzir poluição visual */}
              <td className="px-6 py-4 text-left">{formatCPF(func.cpf) || '-'}</td>
              
              {/* Nova Coluna: Admissão */}
              <td className="px-6 py-4 text-gray-700 font-medium">
                {func.dataAdmissao ? new Date(func.dataAdmissao).toLocaleDateString('pt-BR') : '--/--/----'}
              </td>

              <td className="px-6 py-4">
                <span className={`inline-flex px-2 py-1 rounded text-[11px] font-bold uppercase tracking-wide ${
                  func.tipo === 'ADMIN' ? 'bg-purple-50 text-purple-700 border border-purple-100' : 'bg-blue-50 text-blue-700 border border-blue-100'
                }`}>
                  {func.tipo}
                </span>
              </td>
              <td className="px-6 py-4 text-center">
                <button 
                  onClick={() => handleToggleStatus(func)}
                  disabled={isLoading}
                  className={`px-3 py-1.5 rounded-full text-[12px] font-bold transition-all border ${
                    func.ativo 
                      ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' 
                      : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  {func.ativo ? '● Ativo' : '○ Inativo'}
                </button>
              </td>
            </tr>
          ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#1A202C]/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800">Novo Funcionário</h2>
              <button type="button" onClick={handleModalClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              {formError && <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm font-medium">{formError}</div>}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-full">
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Nome Completo</label>
                  <input required name="nome" value={formData.nome} onChange={handleInputChange}
                    placeholder="Nome completo do funcionário"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-3 text-sm focus:ring-2 focus:ring-[#007F45]/20 outline-none" />
                </div>
                
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">E-mail Corporativo</label>
                  <input required type="email" name="email" value={formData.email} onChange={handleInputChange}
                    placeholder="nome@mesacompartilhada.org"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-3 text-sm focus:ring-2 focus:ring-[#007F45]/20 outline-none" />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Telefone</label>
                  <input required name="telefone" value={formData.telefone} onChange={handleInputChange} maxLength="15" placeholder="(00) 00000-0000" className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-3 text-sm focus:ring-2 focus:ring-[#007F45]/20 outline-none" />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">CPF</label>
                  <input required name="cpf" value={formData.cpf} onChange={handleInputChange} maxLength="14" placeholder="000.000.000-00" className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-3 text-sm focus:ring-2 focus:ring-[#007F45]/20 outline-none" />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Nível de Acesso</label>
                  <select name="tipo" value={formData.tipo} onChange={handleInputChange} className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-3 text-sm outline-none">
                    <option value="FUNCIONARIO">Funcionário (Estoque)</option>
                    <option value="ADMIN">Administrador (Total)</option>
                  </select>
                </div>

                <div className="col-span-full">
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Senha</label>
                  <div className="relative">
                    <input
                      required
                      type={showPassword ? "text" : "password"}
                      name="senha"
                      value={formData.senha}
                      onChange={handleInputChange}
                      placeholder="Mínimo 8 caracteres"
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-3 pr-16 text-sm outline-none focus:ring-2 focus:ring-[#007F45]/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#007F45] hover:underline"
                    >
                      {showPassword ? "ESCONDER" : "MOSTRAR"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button type="button" onClick={handleModalClose} className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors">Cancelar</button>
                <button type="submit" disabled={isLoading} className="bg-[#007F45] hover:bg-[#006838] text-white px-8 py-2.5 rounded-lg font-bold text-sm shadow-lg shadow-[#007F45]/20 transition-all disabled:opacity-50">
                  {isLoading ? 'Processando...' : 'Finalizar Cadastro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}