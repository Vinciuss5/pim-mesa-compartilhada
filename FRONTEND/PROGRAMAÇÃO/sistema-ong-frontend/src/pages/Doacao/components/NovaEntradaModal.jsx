// src/pages/Doacao/components/NovaEntradaModal.jsx
import { useState, useMemo } from 'react';
import { Package, Trash2, Check } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import { useToast } from '../../../components/contexts/ToastContext';
import { formatarQuantidade, hojeISO, isoParaBR } from '../../../utils/format';
import { diasParaPrazo } from '../../../utils/prazo';

const inputClass =
  'w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-1 focus:ring-[#007F45] focus:outline-none bg-white';

const Etapa = ({ numero, children }) => (
  <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#718096]">
    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-[10px]">{numero}</span>
    {children}
  </h3>
);

/**
 * Props:
 *  - open / onClose
 *  - doadores, produtos: listas vindas da tela
 *  - onSubmit(payload) -> Promise<{ success, message? }>
 */
export default function NovaEntradaModal({ open, onClose, doadores, produtos, onSubmit }) {
  const toast = useToast();
  const hoje = hojeISO();

  const [doadorId, setDoadorId] = useState('');
  const [itens, setItens] = useState([]);
  const [produtoId, setProdutoId] = useState('');
  const [qtd, setQtd] = useState('');
  const [validade, setValidade] = useState('');
  const [enviando, setEnviando] = useState(false);

  const produtoSelecionado = useMemo(
    () => produtos.find((p) => String(p.id) === produtoId),
    [produtos, produtoId]
  );

  // Regras que vêm do cadastro do produto
  const controlaValidade = produtoSelecionado?.controlaValidade ?? true;
  const contagem = produtoSelecionado?.unidadeTipo === 'CONTAGEM';
  const sigla = produtoSelecionado?.unidadeSigla ?? '';

  const podeAdicionar = Boolean(produtoId && qtd && (!controlaValidade || validade));

  const limparItemAtual = () => {
    setProdutoId('');
    setQtd('');
    setValidade('');
  };

  const fechar = () => {
    setDoadorId('');
    setItens([]);
    limparItemAtual();
    onClose();
  };

  const adicionar = (e) => {
    e.preventDefault();
    if (!produtoSelecionado) return;

    const quantidade = Number(qtd);

    if (!quantidade || quantidade <= 0) {
      toast.error('Informe uma quantidade maior que zero.');
      return;
    }
    if (contagem && !Number.isInteger(quantidade)) {
      toast.error(`${produtoSelecionado.nome} é contado em ${sigla} e aceita apenas números inteiros.`);
      return;
    }
    if (controlaValidade && !validade) {
      toast.error('Informe a data de validade deste produto.');
      return;
    }
    if (validade && validade < hoje) {
      toast.error('A data de validade não pode ser anterior a hoje.');
      return;
    }

    // Aviso (não bloqueia): o lote já chega dentro do prazo de alerta do produto
    const diasParaVencer = validade ? diasParaPrazo(validade) : null;
    const validadeCurta = diasParaVencer !== null && diasParaVencer <= produtoSelecionado.diasAlertaValidade;

    if (validadeCurta) {
      toast.info(
        `${produtoSelecionado.nome}: este lote vence ${
          diasParaVencer === 0 ? 'hoje' : `em ${diasParaVencer} dia(s)`
        }, dentro do alerta de ${produtoSelecionado.diasAlertaValidade} dias deste produto. Vale direcionar a entrega com rapidez.`,
        8000
      );
    }

    setItens((atual) => {
      // Mesmo produto + mesma validade = mesmo lote: soma em vez de repetir a linha
      const indice = atual.findIndex(
        (i) => i.produtoId === produtoSelecionado.id && i.validade === validade
      );

      if (indice >= 0) {
        return atual.map((i, idx) =>
          idx === indice ? { ...i, quantidade: i.quantidade + quantidade } : i
        );
      }

      return [
        ...atual,
        {
          idTemp: Date.now() + Math.random(),
          produtoId: produtoSelecionado.id,
          nome: produtoSelecionado.nome,
          unidade: sigla,
          quantidade,
          validade, // "AAAA-MM-DD" ou ''
          validadeCurta,
          diasParaVencer,
        },
      ];
    });

    limparItemAtual();
  };

  const remover = (idTemp) => setItens((atual) => atual.filter((i) => i.idTemp !== idTemp));

  const concluir = async () => {
    if (!doadorId || itens.length === 0) {
      toast.error('Selecione um doador e adicione pelo menos um item.');
      return;
    }

   const agora = new Date();
   const doisDigitos = (n) => String(n).padStart(2, '0');
   const dataHoraLocal = `${hojeISO()}T${doisDigitos(agora.getHours())}:${doisDigitos(agora.getMinutes())}:${doisDigitos(agora.getSeconds())}`;

    const payload = {
      doadorId: parseInt(doadorId, 10),
      data: dataHoraLocal,
      itens: itens.map((item) => ({
        produtoId: item.produtoId,
        quantidade: item.quantidade,
        // Data pura, sem fuso: evita o servidor interpretar como UTC e mudar o dia
        dataValidade: item.validade ? `${item.validade}T00:00:00` : null,
      })),
    };

    setEnviando(true);
    const result = await onSubmit(payload);
    setEnviando(false);

    if (result.success) {
      fechar();
    } else {
      toast.error(result.message || 'Não foi possível registrar a entrada.');
    }
  };

  return (
    <Modal
      open={open}
      onClose={fechar}
      title="Registrar Nova Entrada"
      size="xl"
      footer={
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={fechar}
            className="text-sm font-medium text-[#718096] transition-colors hover:text-[#2D3748]"
          >
            Cancelar Transação
          </button>
          <button
            type="button"
            onClick={concluir}
            disabled={itens.length === 0 || !doadorId || enviando}
            className="flex items-center gap-2 rounded-md bg-[#007F45] px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-[#006838] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {enviando ? 'Processando...' : 'Concluir Recebimento'}
            {!enviando && <Check size={16} />}
          </button>
        </div>
      }
    >
      <div className="space-y-8 bg-[#FAFAFA] p-6">
        {/* 1. RESPONSÁVEL */}
        <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <Etapa numero="1">Responsável</Etapa>
          <label className="mb-1 block text-sm font-medium text-[#4A5568]" htmlFor="entrada-doador">
            Doador <span className="text-red-500">*</span>
          </label>
          <select
            id="entrada-doador"
            value={doadorId}
            onChange={(e) => setDoadorId(e.target.value)}
            className={inputClass}
          >
            <option value="">Selecione um doador...</option>
            {doadores.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nome}
              </option>
            ))}
          </select>
        </section>

        {/* 2. ADICIONAR PRODUTOS */}
        <section>
          <Etapa numero="2">Adicionar Produtos</Etapa>
          <div className="rounded-lg border border-[#E2E8F0] bg-white p-4 shadow-sm">
            <form onSubmit={adicionar} className="grid grid-cols-12 items-end gap-3">
              <div className="col-span-12 md:col-span-5">
                <label className="mb-1 block text-sm font-medium text-[#4A5568]" htmlFor="entrada-produto">
                  Produto <span className="text-red-500">*</span>
                </label>
                <select
                  id="entrada-produto"
                  value={produtoId}
                  onChange={(e) => {
                    setProdutoId(e.target.value);
                    setQtd('');
                  }}
                  className={inputClass}
                >
                  <option value="">Selecione...</option>
                  {produtos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome} ({p.unidadeSigla})
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-6 md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-[#4A5568]" htmlFor="entrada-qtd">
                  Qtd.{sigla ? ` (${sigla})` : ''} <span className="text-red-500">*</span>
                </label>
                <input
                  id="entrada-qtd"
                  type="number"
                  step={contagem ? '1' : '0.01'}
                  min={contagem ? '1' : '0.01'}
                  value={qtd}
                  onChange={(e) => setQtd(e.target.value)}
                  placeholder={contagem ? '0' : '0,00'}
                  className={inputClass}
                />
              </div>

              <div className="col-span-6 md:col-span-3">
                <label className="mb-1 block text-sm font-medium text-[#4A5568]" htmlFor="entrada-validade">
                  Validade{' '}
                  {controlaValidade ? (
                    <span className="text-red-500">*</span>
                  ) : (
                    <span className="font-normal text-[#A0AEC0]">(opcional)</span>
                  )}
                </label>
                <input
                  id="entrada-validade"
                  type="date"
                  value={validade}
                  min={hoje}
                  onChange={(e) => setValidade(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div className="col-span-12 md:col-span-2">
                <button
                  type="submit"
                  disabled={!podeAdicionar}
                  className="w-full rounded-md border border-gray-200 bg-[#EDF2F7] py-2 text-sm font-medium text-[#2D3748] transition-colors hover:bg-[#E2E8F0] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Inserir
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* 3. ITENS */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#718096]">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-[10px]">3</span>
              Itens desta Doação
            </h3>
            <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-[#718096]">
              {itens.length} iten(s)
            </span>
          </div>

          <div className="min-h-[120px] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            {itens.length === 0 ? (
              <div className="flex h-32 flex-col items-center justify-center text-[#A0AEC0]">
                <Package size={32} className="mb-2 opacity-50" strokeWidth={1.5} />
                <p className="text-sm">Nenhum item adicionado ainda.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {itens.map((item) => (
                  <li key={item.idTemp} className="group flex items-center justify-between p-3 hover:bg-gray-50">
                    <div>
                      <p className="text-sm font-semibold text-[#2D3748]">{item.nome}</p>
                      <p className="text-xs text-[#718096]">
                        Validade:{' '}
                        <span className="font-medium text-[#4A5568]">
                          {item.validade ? isoParaBR(item.validade) : 'Sem validade'}
                        </span>
                        {item.validadeCurta && (
                          <span className="ml-2 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                            Validade curta · {item.diasParaVencer === 0 ? 'vence hoje' : `${item.diasParaVencer} dia(s)`}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-sm font-medium text-[#2D3748]">
                        {formatarQuantidade(item.quantidade, item.unidade)}
                      </span>
                      <button
                        type="button"
                        onClick={() => remover(item.idTemp)}
                        title="Remover item"
                        aria-label={`Remover ${item.nome}`}
                        className="rounded-md p-1.5 text-red-400 opacity-0 transition-colors hover:bg-red-50 hover:text-red-600 focus:opacity-100 group-hover:opacity-100"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </Modal>
  );
}
