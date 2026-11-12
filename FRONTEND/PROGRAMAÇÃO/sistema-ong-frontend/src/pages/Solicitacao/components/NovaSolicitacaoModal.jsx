// src/pages/Solicitacao/components/NovaSolicitacaoModal.jsx
import { useState, useMemo } from 'react';
import { Package, X } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import { useToast } from '../../../components/contexts/ToastContext';
import { formatarQuantidade, hojeISO } from '../../../utils/format';

const inputClass =
  'w-full border border-gray-300 rounded-lg py-2.5 px-3 text-sm focus:ring-2 focus:ring-[#007F45] focus:border-[#007F45] outline-none transition-all bg-white';

const Etapa = ({ numero, children }) => (
  <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500">
    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#007F45] text-[10px] text-white">
      {numero}
    </span>
    {children}
  </h3>
);

/**
 * Props:
 *  - open / onClose
 *  - solicitantes, produtos: listas vindas da tela
 *  - saldoPorProduto: { [produtoId]: saldoTotal }  (PROVISÓRIO: calculado no front a partir do estoque;
 *                     na Fase 3 passa a vir pronto do backend)
 *  - onSubmit(dto) -> Promise<{ sucesso, erro? }>
 */
export default function NovaSolicitacaoModal({
  open,
  onClose,
  solicitantes,
  produtos,
  saldoPorProduto,
  onSubmit,
}) {
  const toast = useToast();

  const [solicitanteId, setSolicitanteId] = useState('');
  const [dataPrevisao, setDataPrevisao] = useState('');
  const [observacao, setObservacao] = useState('');
  const [itens, setItens] = useState([]);
  const [produtoId, setProdutoId] = useState('');
  const [qtd, setQtd] = useState('');
  const [enviando, setEnviando] = useState(false);

  const solicitanteSelecionado = solicitantes.find((s) => String(s.id) === solicitanteId);
  const endereco = solicitanteSelecionado
    ? solicitanteSelecionado.enderecoEntrega || 'Endereço não cadastrado'
    : '';

  // Quanto de cada produto ainda dá para pedir (saldo menos o que já está nesta solicitação)
  const saldoRestante = useMemo(() => {
    const emUso = {};
    itens.forEach((i) => {
      emUso[i.produtoId] = (emUso[i.produtoId] ?? 0) + i.quantidade;
    });
    return (id) => (saldoPorProduto[id] ?? 0) - (emUso[id] ?? 0);
  }, [itens, saldoPorProduto]);

  const produtoSelecionado = produtos.find((p) => String(p.id) === produtoId);
  const contagem = produtoSelecionado?.unidadeTipo === 'CONTAGEM';
  const sigla = produtoSelecionado?.unidadeSigla ?? '';

  const fechar = () => {
    setSolicitanteId('');
    setDataPrevisao('');
    setObservacao('');
    setItens([]);
    setProdutoId('');
    setQtd('');
    onClose();
  };

  const adicionar = (e) => {
    e.preventDefault();
    if (!produtoSelecionado) return;

    const quantidade = Number(qtd);
    const disponivel = saldoRestante(produtoSelecionado.id);

    if (!quantidade || quantidade <= 0) {
      toast.error('Informe uma quantidade maior que zero.');
      return;
    }
    if (contagem && !Number.isInteger(quantidade)) {
      toast.error(`${produtoSelecionado.nome} é contado em ${sigla} e aceita apenas números inteiros.`);
      return;
    }
    if (quantidade > disponivel) {
      toast.error(
        `Saldo insuficiente de ${produtoSelecionado.nome}. Ainda disponível: ${formatarQuantidade(disponivel, sigla)}.`
      );
      return;
    }

    setItens((atual) => {
      const indice = atual.findIndex((i) => i.produtoId === produtoSelecionado.id);

      if (indice >= 0) {
        return atual.map((i, idx) =>
          idx === indice ? { ...i, quantidade: i.quantidade + quantidade } : i
        );
      }

      return [
        ...atual,
        { produtoId: produtoSelecionado.id, nome: produtoSelecionado.nome, unidade: sigla, quantidade },
      ];
    });

    setProdutoId('');
    setQtd('');
  };

  const registrar = async () => {
    const dto = {
      solicitanteId: parseInt(solicitanteId, 10),
      observacao: observacao.trim() || null,
      // Campo próprio (antes ia escrito dentro da observação). Data pura, sem fuso.
      dataPrevisaoEntrega: dataPrevisao ? `${dataPrevisao}T00:00:00` : null,
      itens: itens.map((item) => ({ produtoId: item.produtoId, quantidade: item.quantidade })),
    };

    setEnviando(true);
    const resultado = await onSubmit(dto);
    setEnviando(false);

    if (resultado.sucesso) {
      fechar();
    } else {
      toast.error(resultado.erro || 'Não foi possível registrar a solicitação.');
    }
  };

  return (
    <Modal
      open={open}
      onClose={fechar}
      title="Nova Solicitação de Saída"
      size="lg"
      footer={
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={fechar}
            className="rounded-lg px-5 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={registrar}
            disabled={itens.length === 0 || !solicitanteId || enviando}
            className="rounded-lg bg-[#007F45] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#006838] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {enviando ? 'Registrando...' : 'Registrar Solicitação'}
          </button>
        </div>
      }
    >
      <div className="space-y-8 bg-gray-50/50 p-6">
        {/* 1. DESTINO */}
        <section className="space-y-4">
          <Etapa numero="1">Dados do Destino</Etapa>
          <div className="grid grid-cols-1 gap-5 rounded-xl border border-gray-200 bg-white p-5 shadow-sm md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700" htmlFor="sol-solicitante">
                Solicitante
              </label>
              <select
                id="sol-solicitante"
                className={inputClass}
                value={solicitanteId}
                onChange={(e) => setSolicitanteId(e.target.value)}
              >
                <option value="">Selecione um solicitante...</option>
                {solicitantes.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700" htmlFor="sol-endereco">
                Endereço de Entrega <span className="font-normal text-gray-400">(automático)</span>
              </label>
              <input
                id="sol-endereco"
                type="text"
                readOnly
                value={endereco}
                placeholder="Selecione um solicitante para preencher..."
                className="w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-600"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700" htmlFor="sol-previsao">
                Previsão de Entrega
              </label>
              <input
                id="sol-previsao"
                type="date"
                value={dataPrevisao}
                min={hojeISO()}
                onChange={(e) => setDataPrevisao(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700" htmlFor="sol-obs">
                Observação
              </label>
              <input
                id="sol-obs"
                type="text"
                maxLength={200}
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Ex: Entregar na portaria"
                className={inputClass}
              />
            </div>
          </div>
        </section>

        {/* 2. PRODUTOS */}
        <section className="space-y-4">
          <Etapa numero="2">Adicionar Produtos</Etapa>
          <div className="space-y-5 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <form onSubmit={adicionar} className="flex flex-col gap-3 sm:flex-row">
              <select
                aria-label="Produto"
                className={`${inputClass} flex-1`}
                value={produtoId}
                onChange={(e) => {
                  setProdutoId(e.target.value);
                  setQtd('');
                }}
              >
                <option value="">Selecione o produto...</option>
                {produtos.map((p) => {
                  const restante = saldoRestante(p.id);
                  return (
                    <option key={p.id} value={p.id} disabled={restante <= 0}>
                      {p.nome} — {restante > 0 ? `${formatarQuantidade(restante, p.unidadeSigla)} disp.` : 'sem estoque'}
                    </option>
                  );
                })}
              </select>

              <div className="flex gap-3">
                <input
                  type="number"
                  aria-label="Quantidade"
                  step={contagem ? '1' : '0.01'}
                  min={contagem ? '1' : '0.01'}
                  placeholder={sigla ? `Qtd (${sigla})` : 'Qtd'}
                  className={`${inputClass} w-32`}
                  value={qtd}
                  onChange={(e) => setQtd(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={!produtoId || !qtd}
                  className="rounded-lg bg-[#007F45]/10 px-5 py-2.5 text-sm font-bold text-[#007F45] transition-colors hover:bg-[#007F45]/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </form>

            <div className="divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-200">
              {itens.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-6 text-center text-gray-400">
                  <Package size={28} className="mb-2" strokeWidth={1.5} />
                  <p className="text-sm">Nenhum produto adicionado à solicitação.</p>
                </div>
              ) : (
                itens.map((item) => (
                  <div
                    key={item.produtoId}
                    className="flex items-center justify-between bg-gray-50/30 p-3 text-sm transition-colors hover:bg-gray-50"
                  >
                    <span className="font-medium text-gray-700">{item.nome}</span>
                    <div className="flex items-center gap-4">
                      <span className="rounded border border-gray-200 bg-white px-2 py-1 font-mono font-bold text-[#007F45]">
                        {formatarQuantidade(item.quantidade, item.unidade)}
                      </span>
                      <button
                        type="button"
                        onClick={() => setItens((atual) => atual.filter((i) => i.produtoId !== item.produtoId))}
                        title="Remover item"
                        aria-label={`Remover ${item.nome}`}
                        className="flex h-7 w-7 items-center justify-center rounded text-red-400 transition-colors hover:bg-red-50 hover:text-red-600"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </Modal>
  );
}