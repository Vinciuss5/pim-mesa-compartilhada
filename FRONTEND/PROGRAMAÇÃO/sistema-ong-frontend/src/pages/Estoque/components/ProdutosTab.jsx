// src/pages/Estoque/components/ProdutosTab.jsx
// Lista TODOS os produtos cadastrados (inclusive os que ainda não têm estoque) e permite editar.
import { useMemo, useState } from 'react';
import { Pencil } from 'lucide-react';
import SearchInput from '../../../components/ui/SearchInput';
import { formatarNumero, formatarQuantidade } from '../../../utils/format';
import { rotuloCategoria } from '../../../utils/produtoOpcoes';

export default function ProdutosTab({ produtos, loading, onEditar }) {
  const [busca, setBusca] = useState('');

  const filtrados = useMemo(() => {
    const termo = busca.toLowerCase().trim();
    return produtos.filter((p) => p.nome.toLowerCase().includes(termo));
  }, [produtos, busca]);

  return (
    <div>
      <div className="rounded-t-xl border border-gray-100 bg-white p-4">
        <SearchInput value={busca} onChange={setBusca} placeholder="Buscar produto pelo nome..." />
      </div>

      <div className="overflow-x-auto rounded-b-xl border-x border-b border-gray-100 bg-white shadow-sm">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="border-b border-gray-100 bg-gray-50/50 text-[#718096]">
            <tr>
              {['Produto', 'Unidade', 'Categoria', 'Peso por unidade', 'Estoque mínimo', 'Validade', 'Alerta de validade'].map(
                (titulo) => (
                  <th
                    key={titulo}
                    className="px-4 py-4 text-left text-[11px] font-semibold uppercase tracking-tighter first:px-5"
                  >
                    {titulo}
                  </th>
                )
              )}
              <th className="px-4 py-4 text-right text-[11px] font-semibold uppercase tracking-tighter">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && produtos.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-5 py-8 text-center text-gray-500">
                  Carregando produtos...
                </td>
              </tr>
            ) : filtrados.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-5 py-8 text-center text-gray-500">
                  Nenhum produto encontrado.
                </td>
              </tr>
            ) : (
              filtrados.map((p) => (
                <tr key={p.id} className="transition-colors hover:bg-gray-50/80">
                  <td className="whitespace-nowrap px-5 py-4 font-bold text-[#2D3748]">{p.nome}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-[#4A5568]">
                    {p.unidadeNome} ({p.unidadeSigla})
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-[#718096]">{rotuloCategoria(p.categoria)}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-[#718096]">
                    {p.pesoKg ? `${formatarNumero(p.pesoKg)} kg` : '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-[#718096]">
                    {p.estoqueMinimo != null ? formatarQuantidade(p.estoqueMinimo, p.unidadeSigla) : '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-[#718096]">
                    {p.controlaValidade ? 'Obrigatória' : 'Não controla'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-[#718096]">
                    {p.controlaValidade ? `${p.diasAlertaValidade} dias antes` : '—'}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <button
                      onClick={() => onEditar(p)}
                      aria-label={`Editar ${p.nome}`}
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
    </div>
  );
}