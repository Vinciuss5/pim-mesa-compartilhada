import { useState, useEffect } from 'react';
import { Plus, Pencil } from 'lucide-react';
import { useDoadores } from '../../StatusBadge/hooks/useDoadores';
import { useToast } from '../../components/contexts/ToastContext';
import { formatCPF, formatTelefone } from '../../utils/masks';
import PageHeader from '../../components/ui/PageHeader';
import SearchInput from '../../components/ui/SearchInput';
import DoadorFormModal from './components/DoadorFormModal';

export default function Doador() {
  const toast = useToast();
  const { doadores, loading, error, fetchDoadores, createDoador, updateDoador } = useDoadores();

  const [busca, setBusca] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [doadorEditando, setDoadorEditando] = useState(null); // null = cadastrar

  // Busca no servidor: espera um instante depois de parar de digitar (a carga inicial é imediata)
  useEffect(() => {
    const espera = setTimeout(() => fetchDoadores(busca), busca ? 400 : 0);
    return () => clearTimeout(espera);
  }, [busca, fetchDoadores]);

  const abrirCadastro = () => {
    setDoadorEditando(null);
    setModalAberto(true);
  };

  const abrirCorrecao = (doador) => {
    setDoadorEditando(doador);
    setModalAberto(true);
  };

  const salvar = async (dto) => {
    const resultado = doadorEditando
      ? await updateDoador(doadorEditando.id, dto)
      : await createDoador(dto);

    if (resultado.success) {
      toast.success(
        doadorEditando ? `Dados de "${dto.Nome}" atualizados.` : `Doador "${dto.Nome}" cadastrado com sucesso!`
      );
      fetchDoadores(busca);
    }

    return resultado; // o modal decide se fecha (sucesso) ou mostra o erro
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-8 font-sans text-[#2D3748]">
      <PageHeader
        title="Doadores"
        subtitle="Cadastre os doadores e corrija os dados sempre que for preciso."
      >
        <button
          onClick={abrirCadastro}
          className="flex items-center gap-2 rounded-md bg-[#007F45] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#006838]"
        >
          <Plus size={16} />
          Cadastrar Doador
        </button>
      </PageHeader>

      <div className="mb-6 flex gap-4 rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
        <SearchInput value={busca} onChange={setBusca} placeholder="Buscar por nome ou CPF..." />
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-100 bg-white shadow-sm">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="border-b border-gray-100 bg-gray-50 text-[#718096]">
            <tr>
              {['Nome', 'CPF', 'Telefone', 'E-mail', 'Endereço'].map((titulo) => (
                <th key={titulo} className="px-6 py-4 text-left font-medium">{titulo}</th>
              ))}
              <th className="px-6 py-4 text-right font-medium">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan="6" className="p-6 text-center text-gray-500">Carregando doadores...</td></tr>
            ) : error ? (
              <tr><td colSpan="6" className="p-6 text-center text-red-500">Erro ao carregar doadores: {error}</td></tr>
            ) : doadores.length === 0 ? (
              <tr><td colSpan="6" className="p-6 text-center text-gray-500">Nenhum doador encontrado.</td></tr>
            ) : (
              doadores.map((d) => (
                <tr key={d.id} className="transition-colors hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 font-medium text-[#2D3748]">{d.nome}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-[#4A5568]">{d.cpf ? formatCPF(d.cpf) : '—'}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-[#4A5568]">{d.telefone ? formatTelefone(d.telefone) : '—'}</td>
                  <td className="px-6 py-4 text-[#4A5568]">{d.email || '—'}</td>
                  <td className="px-6 py-4 text-[#4A5568]">{d.endereco || '—'}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <button
                      onClick={() => abrirCorrecao(d)}
                      aria-label={`Corrigir dados de ${d.nome}`}
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

      <DoadorFormModal
        open={modalAberto}
        onClose={() => setModalAberto(false)}
        doador={doadorEditando}
        onSubmit={salvar}
      />
    </div>
  );
}