import { useState, useEffect } from 'react';
import { Plus, Pencil } from 'lucide-react';
import { useSolicitantes } from '../../StatusBadge/hooks/useSolicitantes';
import { useToast } from '../../components/contexts/ToastContext';
import { formatCPF, formatTelefone } from '../../utils/masks';
import PageHeader from '../../components/ui/PageHeader';
import SearchInput from '../../components/ui/SearchInput';
import SolicitanteFormModal from './components/SolicitanteFormModal';

export default function Solicitante() {
  const toast = useToast();
  const { solicitantes, loading, error, fetchSolicitantes, createSolicitante, updateSolicitante } = useSolicitantes();

  const [busca, setBusca] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [solicitanteEditando, setSolicitanteEditando] = useState(null); // null = cadastrar

  // Busca no servidor: espera um instante depois de parar de digitar (a carga inicial é imediata)
  useEffect(() => {
    const espera = setTimeout(() => fetchSolicitantes(busca), busca ? 400 : 0);
    return () => clearTimeout(espera);
  }, [busca, fetchSolicitantes]);

  const abrirCadastro = () => {
    setSolicitanteEditando(null);
    setModalAberto(true);
  };

  const abrirCorrecao = (solicitante) => {
    setSolicitanteEditando(solicitante);
    setModalAberto(true);
  };

  const salvar = async (dto) => {
    const resultado = solicitanteEditando
      ? await updateSolicitante(solicitanteEditando.id, dto)
      : await createSolicitante(dto);

    if (resultado.success) {
      toast.success(
        solicitanteEditando
          ? `Dados de "${dto.Nome}" atualizados.`
          : `Solicitante "${dto.Nome}" cadastrado com sucesso!`
      );
      fetchSolicitantes(busca);
    }

    return resultado; // o modal decide se fecha (sucesso) ou mostra o erro
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-8 font-sans text-[#2D3748]">
      <PageHeader
        title="Solicitantes"
        subtitle="Cadastre quem recebe as doações e corrija os dados sempre que for preciso."
      >
        <button
          onClick={abrirCadastro}
          className="flex items-center gap-2 rounded-md bg-[#007F45] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#006838]"
        >
          <Plus size={16} />
          Cadastrar Solicitante
        </button>
      </PageHeader>

      <div className="mb-6 flex gap-4 rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
        <SearchInput value={busca} onChange={setBusca} placeholder="Buscar por nome ou CPF..." />
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-100 bg-white shadow-sm">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="border-b border-gray-100 bg-gray-50 text-[#718096]">
            <tr>
              {['Nome', 'CPF', 'Telefone', 'E-mail', 'Endereço de entrega'].map((titulo) => (
                <th key={titulo} className="px-6 py-4 text-left font-medium">{titulo}</th>
              ))}
              <th className="px-6 py-4 text-right font-medium">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan="6" className="p-6 text-center text-gray-500">Carregando solicitantes...</td></tr>
            ) : error ? (
              <tr><td colSpan="6" className="p-6 text-center text-red-500">Erro ao carregar solicitantes: {error}</td></tr>
            ) : solicitantes.length === 0 ? (
              <tr><td colSpan="6" className="p-6 text-center text-gray-500">Nenhum solicitante encontrado.</td></tr>
            ) : (
              solicitantes.map((s) => (
                <tr key={s.id} className="transition-colors hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 font-medium text-[#2D3748]">{s.nome}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-[#4A5568]">{s.cpf ? formatCPF(s.cpf) : '—'}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-[#4A5568]">{s.telefone ? formatTelefone(s.telefone) : '—'}</td>
                  <td className="px-6 py-4 text-[#4A5568]">{s.email || '—'}</td>
                  <td className="px-6 py-4 text-[#4A5568]">{s.enderecoEntrega || '—'}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <button
                      onClick={() => abrirCorrecao(s)}
                      aria-label={`Corrigir dados de ${s.nome}`}
                      className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-[#4A5568] transition-colors hover:border-[#007F45] hover:text-[#007F45]"
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

      <SolicitanteFormModal
        open={modalAberto}
        onClose={() => setModalAberto(false)}
        solicitante={solicitanteEditando}
        onSubmit={salvar}
      />
    </div>
  );
}