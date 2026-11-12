import { useState, useEffect, useMemo } from 'react';
import { Plus, Pencil } from 'lucide-react';
import { useFuncionarios } from '../../StatusBadge/hooks/useFuncionarios';
import { useToast } from '../../components/contexts/ToastContext';
import { apenasDigitos, formatCPF, formatTelefone } from '../../utils/masks';
import { formatarData } from '../../utils/format';
import PageHeader from '../../components/ui/PageHeader';
import SearchInput from '../../components/ui/SearchInput';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import FuncionarioFormModal from './components/FuncionarioFormModal';

const ROTULO_CARGO = { ADMIN: 'Administrador', FUNCIONARIO: 'Funcionário' };

export default function Funcionarios() {
  const toast = useToast();
  const {
    funcionarios,
    isLoading,
    error,
    fetchFuncionarios,
    createFuncionario,
    updateFuncionario,
    toggleStatus,
  } = useFuncionarios();

  const [busca, setBusca] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [funcionarioEditando, setFuncionarioEditando] = useState(null); // null = cadastrar
  const [paraAlterarStatus, setParaAlterarStatus] = useState(null);
  const [processando, setProcessando] = useState(false);

  useEffect(() => {
    fetchFuncionarios();
  }, [fetchFuncionarios]);

  // Filtro local: nome, e-mail, CPF ou telefone (pelos números, com ou sem máscara)
  const filtrados = useMemo(() => {
    const termo = busca.toLowerCase().trim();
    const numeros = apenasDigitos(busca);

    if (!termo) return funcionarios;

    return funcionarios.filter(
      (f) =>
        f.nome?.toLowerCase().includes(termo) ||
        f.email?.toLowerCase().includes(termo) ||
        (numeros && (apenasDigitos(f.cpf).includes(numeros) || apenasDigitos(f.telefone).includes(numeros)))
    );
  }, [funcionarios, busca]);

  const abrirCadastro = () => {
    setFuncionarioEditando(null);
    setModalAberto(true);
  };

  const abrirCorrecao = (funcionario) => {
    setFuncionarioEditando(funcionario);
    setModalAberto(true);
  };

  const salvar = async (dados) => {
    const resultado = funcionarioEditando
      ? await updateFuncionario(funcionarioEditando.id, dados)
      : await createFuncionario(dados);

    if (resultado.success) {
      toast.success(
        funcionarioEditando
          ? `Dados de "${dados.nome.trim()}" atualizados.`
          : `Funcionário "${dados.nome.trim()}" cadastrado com sucesso!`
      );
    }

    return resultado; // o modal decide se fecha (sucesso) ou mostra o erro
  };

  const confirmarStatus = async () => {
    if (!paraAlterarStatus) return;

    const alvo = paraAlterarStatus;
    setProcessando(true);
    const resultado = await toggleStatus(alvo);
    setProcessando(false);
    setParaAlterarStatus(null);

    if (resultado.success) {
      toast.success(alvo.ativo ? `Acesso de "${alvo.nome}" desativado.` : `Acesso de "${alvo.nome}" reativado.`);
    } else {
      toast.error(resultado.message || 'Não foi possível alterar o status.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-8 font-sans text-[#2D3748]">
      <PageHeader
        title="Funcionários"
        subtitle="Gerencie a equipe, cadastros e controle de funcionários no sistema."
      >
        <button
          onClick={abrirCadastro}
          className="flex items-center gap-2 rounded-md bg-[#007F45] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#006838]"
        >
          <Plus size={16} />
          Cadastrar Funcionário
        </button>
      </PageHeader>

      <div className="mb-6 flex gap-4 rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
        <SearchInput value={busca} onChange={setBusca} placeholder="Buscar por nome, e-mail, CPF ou telefone..." />
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-100 bg-white shadow-sm">
        <table className="w-full min-w-[980px] text-sm">
          <thead className="border-b border-gray-100 bg-gray-50 text-[#718096]">
            <tr>
              {['Nome', 'E-mail', 'Telefone', 'CPF', 'Admissão', 'Cargo', 'Status'].map((titulo) => (
                <th key={titulo} className="px-6 py-4 text-left font-medium">{titulo}</th>
              ))}
              <th className="px-6 py-4 text-right font-medium">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading && funcionarios.length === 0 ? (
              <tr><td colSpan="8" className="p-6 text-center text-gray-500">Carregando funcionários...</td></tr>
            ) : error ? (
              <tr><td colSpan="8" className="p-6 text-center text-red-500">Erro ao carregar funcionários: {error}</td></tr>
            ) : filtrados.length === 0 ? (
              <tr><td colSpan="8" className="p-6 text-center text-gray-500">Nenhum funcionário encontrado.</td></tr>
            ) : (
              filtrados.map((f) => (
                <tr key={f.id} className={`transition-colors hover:bg-gray-50 ${f.ativo ? '' : 'bg-gray-50/60 text-gray-400'}`}>
                  <td className="whitespace-nowrap px-6 py-4 font-medium text-[#2D3748]">{f.nome}</td>
                  <td className="px-6 py-4 text-[#4A5568]">{f.email}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-[#4A5568]">{f.telefone ? formatTelefone(f.telefone) : '—'}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-[#4A5568]">{f.cpf ? formatCPF(f.cpf) : '—'}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-[#4A5568]">{formatarData(f.dataAdmissao)}</td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${
                        f.tipo === 'ADMIN'
                          ? 'border-purple-200 bg-purple-50 text-purple-700'
                          : 'border-gray-200 bg-gray-50 text-[#4A5568]'
                      }`}
                    >
                      {ROTULO_CARGO[f.tipo] ?? f.tipo}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <button
                      onClick={() => setParaAlterarStatus(f)}
                      title={f.ativo ? 'Clique para desativar o acesso' : 'Clique para reativar o acesso'}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                        f.ativo
                          ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                          : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      {f.ativo ? 'Ativo' : 'Inativo'}
                    </button>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <button
                      onClick={() => abrirCorrecao(f)}
                      aria-label={`Corrigir dados de ${f.nome}`}
                      className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-[#4A5568] transition-colors hover:border-[#007F45] hover:text-[#007F45]"
                    >
                      <Pencil size={14} />
                      Editar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <FuncionarioFormModal
        open={modalAberto}
        onClose={() => setModalAberto(false)}
        funcionario={funcionarioEditando}
        onSubmit={salvar}
      />

      <ConfirmDialog
        open={Boolean(paraAlterarStatus)}
        title={paraAlterarStatus?.ativo ? 'Desativar acesso' : 'Reativar acesso'}
        message={
          paraAlterarStatus?.ativo
            ? `Desativar o acesso de "${paraAlterarStatus?.nome}"? Ele não poderá mais entrar no sistema, mas o histórico dele é mantido.`
            : `Reativar o acesso de "${paraAlterarStatus?.nome}"?`
        }
        confirmLabel={paraAlterarStatus?.ativo ? 'Desativar' : 'Reativar'}
        danger={Boolean(paraAlterarStatus?.ativo)}
        loading={processando}
        onConfirm={confirmarStatus}
        onCancel={() => setParaAlterarStatus(null)}
      />
    </div>
  );
}